-- ============================================================================
--  クルー募集掲示板 用テーブル＋RPC（Supabase）
--  Supabase → SQL Editor に貼って Run。
--  前提：board.sql / board_ip.sql / board_moderation_meta.sql / board_blocks.sql /
--        board_reports.sql / admin_auth.sql / spam_measures.sql 適用済み。
--
--  設計は friends.sql と同型（方式b）：
--   - 1募集 = 1カード = crews 1行。自由投稿・承認不要・即時掲載。
--   - カード作成時に返信用の合成スレ(board='crews')を1本作り、crews.thread_id に保存。
--     返信は既存 create_post(thread_id,…) をそのまま使う。
--   - ★通報用オープニング投稿：カード本文を post_number=1 として board_posts に複製。
--     既存の report_post / admin_reports / admin_delete_post がカード本体にも効く。
--   - スパム対策は create_fivem_server と同型（ハニーポット／ブロック／NGワード／
--     IP・Cookie 60秒連投／メタ記録）。書き込みは RPC 経由のみ。
--   - カード削除は合成スレを消す＝board_posts/board_reports/board_post_votes が CASCADE。
--   - カテゴリ内フィルタは genre。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- テーブル
-- ----------------------------------------------------------------------------
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  crew_name text not null,                     -- クルー名
  title text not null,                         -- 募集タイトル
  platform text,                               -- PS5 / Xbox / PC など
  genre text,                                  -- ← カテゴリ内フィルタ（RP/レース/フリーローム等）
  size text,                                   -- 規模・募集人数
  requirements text,                           -- 参加条件
  active_time text,                            -- 活動時間帯
  body text not null,                          -- 自由記述（= post #1 に複製される本文）
  contact text,                                -- Discord等の連絡先
  thread_id uuid references public.board_threads(id) on delete set null,  -- 返信用の合成スレ
  status text not null default 'published',    -- 公開ステータス（anon SELECT はこれのみ）
  created_at timestamptz not null default now(),
  ip text, ua text, anon_id text, ip_hash text, ip_subnet text  -- 非公開メタ
);

create index if not exists crews_status_created_idx on public.crews (status, created_at desc);
create index if not exists crews_genre_idx on public.crews (genre);
create index if not exists crews_thread_idx on public.crews (thread_id);

-- ----------------------------------------------------------------------------
-- RLS：公開ステータスのみ anon SELECT 可。INSERT/UPDATE/DELETE は RPC 経由のみ。
-- ----------------------------------------------------------------------------
alter table public.crews enable row level security;

drop policy if exists "anyone can read published crews" on public.crews;
create policy "anyone can read published crews"
  on public.crews for select to anon using (status = 'published');

-- 非公開メタ列を隠す。※ 列単位 REVOKE はテーブル全体 SELECT 付与を上書きできないため、
--   テーブル全体の SELECT を剥がして公開列だけを列単位で GRANT する（friends と同方式）。
--   この方式では匿名の select('*') は権限エラー。フロントは公開列を明示指定すること。
revoke select on public.crews from anon, authenticated;
grant select (
  id, crew_name, title, platform, genre, size, requirements, active_time,
  body, contact, thread_id, status, created_at
) on public.crews to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 掲載（誰でも・即時掲載）。末尾で合成スレ＋通報用オープニング投稿(post #1)を作る。
-- ----------------------------------------------------------------------------
drop function if exists public.create_crew(text, text, text, text, text, text, text, text, text, text, text);
create or replace function public.create_crew(
  p_crew_name text,
  p_title text,
  p_platform text,
  p_genre text,
  p_size text,
  p_requirements text,
  p_active_time text,
  p_body text,
  p_contact text,
  p_anon_id text default null,
  p_hp text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_thread_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_haystack text;
begin
  -- ハニーポット
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  -- 必須：クルー名・タイトル・本文
  if char_length(coalesce(trim(p_crew_name), '')) = 0 or char_length(p_crew_name) > 80 then
    raise exception 'invalid crew_name';
  end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then
    raise exception 'invalid body';
  end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  -- 禁止ワード（全項目連結を部分一致・大小無視で検査）
  v_haystack := lower(
    coalesce(p_crew_name, '')  || ' ' || coalesce(p_title, '')       || ' ' ||
    coalesce(p_body, '')       || ' ' || coalesce(p_platform, '')    || ' ' ||
    coalesce(p_genre, '')      || ' ' || coalesce(p_size, '')        || ' ' ||
    coalesce(p_requirements,'')|| ' ' || coalesce(p_active_time, '') || ' ' ||
    coalesce(p_contact, '')
  );
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then raise exception 'banned word'; end if;

  -- 連投制限：同一IP / 同一Cookie からの掲載は60秒に1回
  if m.ip is not null and exists (
    select 1 from crews where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from crews where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  -- 返信用の合成スレッド（board='crews'）。post_count=1＝オープニング投稿ぶん。
  insert into board_threads (board, title, post_count)
    values ('crews', trim(p_title), 1)
    returning id into v_thread_id;

  -- 通報用オープニング投稿(post #1)：カード本文を複製
  insert into board_posts
    (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
  values
    (v_thread_id, 1, '名無しさん', trim(p_body), m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);

  -- カード本体
  insert into crews
    (crew_name, title, platform, genre, size, requirements, active_time, body, contact,
     thread_id, status, ip, ua, anon_id, ip_hash, ip_subnet)
  values (
    trim(p_crew_name),
    trim(p_title),
    nullif(trim(p_platform), ''),
    nullif(trim(p_genre), ''),
    nullif(trim(p_size), ''),
    nullif(trim(p_requirements), ''),
    nullif(trim(p_active_time), ''),
    trim(p_body),
    nullif(trim(p_contact), ''),
    v_thread_id, 'published',
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet
  )
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function
  public.create_crew(text, text, text, text, text, text, text, text, text, text, text) to anon;

-- ----------------------------------------------------------------------------
-- 管理：一覧（メタ込み・新しい順）
-- ----------------------------------------------------------------------------
create or replace function public.admin_list_crews(p_token text)
returns table (
  id uuid, crew_name text, title text, platform text, genre text, size text,
  requirements text, active_time text, body text, contact text,
  thread_id uuid, status text,
  ip text, ua text, anon_id text, ip_subnet text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select c.id, c.crew_name, c.title, c.platform, c.genre, c.size, c.requirements,
         c.active_time, c.body, c.contact, c.thread_id, c.status,
         c.ip, c.ua, c.anon_id, c.ip_subnet, c.created_at
  from crews c order by c.created_at desc limit 200;
end; $$;
grant execute on function public.admin_list_crews(text) to anon;

-- ----------------------------------------------------------------------------
-- 管理：削除（合成スレ削除→post/通報/投票を CASCADE→crews 行削除）
-- ----------------------------------------------------------------------------
create or replace function public.admin_delete_crew(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_thread_id uuid;
begin
  perform _admin_check(p_token);
  select thread_id into v_thread_id from crews where id = p_id;
  if v_thread_id is not null then
    delete from board_threads where id = v_thread_id;  -- CASCADE: posts/reports/votes
  end if;
  delete from crews where id = p_id;
end; $$;
grant execute on function public.admin_delete_crew(text, uuid) to anon;

-- ----------------------------------------------------------------------------
-- 管理：公開ステータス変更（published / hidden）
-- ----------------------------------------------------------------------------
create or replace function public.admin_set_crew_status(p_token text, p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if p_status not in ('published', 'hidden') then raise exception 'invalid status'; end if;
  update crews set status = p_status where id = p_id;
end; $$;
grant execute on function public.admin_set_crew_status(text, uuid, text) to anon;

select pg_notify('pgrst', 'reload schema');
