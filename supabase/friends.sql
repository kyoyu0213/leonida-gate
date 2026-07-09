-- ============================================================================
--  フレンド募集掲示板 用テーブル＋RPC（Supabase）
--  Supabase → SQL Editor に貼って Run。
--  前提：board.sql / board_ip.sql / board_moderation_meta.sql / board_blocks.sql /
--        board_reports.sql / admin_auth.sql / spam_measures.sql 適用済み
--        （_req_meta / _is_blocked / banned_words / _admin_check / board_threads /
--         board_posts / create_post / report_post が存在すること）。
--
--  設計（方式b：返信は既存レス基盤をゼロ改変で流用）:
--   - 1募集 = 1カード = friends 1行。カード本文は自由投稿（承認不要・即時掲載）。
--   - カード作成時に「返信用の合成スレッド」を board_threads に1本作り、その id を
--     friends.thread_id に保存する。返信は既存 create_post(thread_id, …) をそのまま使う。
--   - ★通報用オープニング投稿：カード本文を post_number=1 として board_posts に複製する。
--     これで既存の report_post / admin_reports / admin_delete_post がカード本体にも効く
--     （新規の通報RPCは不要）。ユーザーの返信は #2 以降に採番される。
--   - 合成スレは board='friends'。BOARDS に無いので /board/:slug のタブには一切出ない。
--   - スパム対策は create_fivem_server と同型（ハニーポット／ブロック／NGワード／
--     IP・Cookie 60秒連投／投稿者メタ記録）を全継承。書き込みは RPC 経由のみ。
--   - カード削除は合成スレを消す＝board_posts / board_reports / board_post_votes が
--     CASCADE で自動削除される（レスも通報も投票も一緒に消える）。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- テーブル
-- ----------------------------------------------------------------------------
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  title text not null,                         -- 募集タイトル
  platform text,                               -- PS5 / Xbox / PC など
  play_style text,                             -- ← カテゴリ内フィルタ（カジュアル/ガチ 等）
  voice_chat text,                             -- VCあり/なし/どちらでも
  active_time text,                            -- 活動時間帯
  age_range text,                              -- 年齢層
  body text not null,                          -- 自由記述（= post #1 に複製される本文）
  contact text,                                -- Discord等の連絡先
  thread_id uuid references public.board_threads(id) on delete set null,  -- 返信用の合成スレ
  status text not null default 'published',    -- 公開ステータス（anon SELECT はこれのみ）
  created_at timestamptz not null default now(),
  -- 投稿者メタ（非公開。匿名・認証ユーザーからは読めない＝管理用ログ）
  ip text,
  ua text,
  anon_id text,
  ip_hash text,
  ip_subnet text
);

-- 一覧（公開・新しい順）とフィルタを速くするインデックス
create index if not exists friends_status_created_idx
  on public.friends (status, created_at desc);
create index if not exists friends_play_style_idx
  on public.friends (play_style);
create index if not exists friends_thread_idx
  on public.friends (thread_id);

-- ----------------------------------------------------------------------------
-- RLS：公開ステータスのみ anon が SELECT 可。INSERT/UPDATE/DELETE は RPC 経由のみ。
-- ----------------------------------------------------------------------------
alter table public.friends enable row level security;

-- 掲載中（status='published'）のカードは誰でも閲覧できる
drop policy if exists "anyone can read published friends" on public.friends;
create policy "anyone can read published friends"
  on public.friends for select
  to anon
  using (status = 'published');

-- 投稿者メタは匿名・認証ユーザーから読めないようにする（管理RPC経由のみ）。
-- ※ PostgreSQL では列単位 REVOKE はテーブル全体 SELECT 付与を上書きできない。
--   Supabase は anon/authenticated にテーブル全体 SELECT をデフォルト付与するため、
--   テーブル全体の SELECT を剥がし、公開列だけを列単位で GRANT し直す。
--   （この方式では匿名の select('*') は権限エラー。フロントは公開列を明示指定すること）
revoke select on public.friends from anon, authenticated;
grant select (
  id, title, platform, play_style, voice_chat, active_time, age_range,
  body, contact, thread_id, status, created_at
) on public.friends to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 掲載（誰でも・即時掲載）。create_fivem_server と同型のスパム対策。
--  末尾で返信用の合成スレ＋通報用オープニング投稿(post #1)を作る。
-- ----------------------------------------------------------------------------
drop function if exists public.create_friend(text, text, text, text, text, text, text, text, text, text);
create or replace function public.create_friend(
  p_title text,
  p_platform text,
  p_play_style text,
  p_voice_chat text,
  p_active_time text,
  p_age_range text,
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
  -- ハニーポット：隠し項目が埋まっている＝ボット。何もせず終了（NULLを返す）。
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  -- 必須：タイトル・本文
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then
    raise exception 'invalid body';
  end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  -- 禁止ワード（タイトル・本文・各項目・連絡先を部分一致・大小無視で検査）
  v_haystack := lower(
    coalesce(p_title, '')       || ' ' || coalesce(p_body, '')       || ' ' ||
    coalesce(p_platform, '')    || ' ' || coalesce(p_play_style, '') || ' ' ||
    coalesce(p_voice_chat, '')  || ' ' || coalesce(p_active_time, '')|| ' ' ||
    coalesce(p_age_range, '')   || ' ' || coalesce(p_contact, '')
  );
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then
    raise exception 'banned word';
  end if;

  -- 連投制限：同一IP / 同一Cookie からの掲載は60秒に1回
  if m.ip is not null and exists (
    select 1 from friends where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from friends where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  -- 返信用の合成スレッド（board='friends'）。post_count=1＝オープニング投稿ぶん。
  -- 最初のユーザー返信は create_post により #2 から採番される。
  insert into board_threads (board, title, post_count)
    values ('friends', trim(p_title), 1)
    returning id into v_thread_id;

  -- 通報用オープニング投稿(post #1)：カード本文を複製。これで report_post /
  -- admin_reports / admin_delete_post がカード本体に対して働く。
  insert into board_posts
    (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
  values
    (v_thread_id, 1, '名無しさん', trim(p_body), m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);

  -- カード本体
  insert into friends
    (title, platform, play_style, voice_chat, active_time, age_range, body, contact,
     thread_id, status, ip, ua, anon_id, ip_hash, ip_subnet)
  values (
    trim(p_title),
    nullif(trim(p_platform), ''),
    nullif(trim(p_play_style), ''),
    nullif(trim(p_voice_chat), ''),
    nullif(trim(p_active_time), ''),
    nullif(trim(p_age_range), ''),
    trim(p_body),
    nullif(trim(p_contact), ''),
    v_thread_id, 'published',
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet
  )
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function
  public.create_friend(text, text, text, text, text, text, text, text, text, text) to anon;

-- ----------------------------------------------------------------------------
-- 管理：フレンド募集の一覧（投稿者メタ込み・新しい順）
-- ----------------------------------------------------------------------------
create or replace function public.admin_list_friends(p_token text)
returns table (
  id uuid, title text, platform text, play_style text, voice_chat text,
  active_time text, age_range text, body text, contact text,
  thread_id uuid, status text,
  ip text, ua text, anon_id text, ip_subnet text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select f.id, f.title, f.platform, f.play_style, f.voice_chat,
         f.active_time, f.age_range, f.body, f.contact,
         f.thread_id, f.status,
         f.ip, f.ua, f.anon_id, f.ip_subnet, f.created_at
  from friends f order by f.created_at desc limit 200;
end; $$;
grant execute on function public.admin_list_friends(text) to anon;

-- ----------------------------------------------------------------------------
-- 管理：フレンド募集の削除。
--  合成スレを削除すると board_posts / board_reports / board_post_votes が
--  CASCADE で消える（＝レス・通報・投票もまとめて削除）。その後 friends 行を削除。
-- ----------------------------------------------------------------------------
create or replace function public.admin_delete_friend(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_thread_id uuid;
begin
  perform _admin_check(p_token);
  select thread_id into v_thread_id from friends where id = p_id;
  if v_thread_id is not null then
    delete from board_threads where id = v_thread_id;  -- CASCADE: posts/reports/votes
  end if;
  delete from friends where id = p_id;
end; $$;
grant execute on function public.admin_delete_friend(text, uuid) to anon;

-- ----------------------------------------------------------------------------
-- 管理：カードの公開ステータス変更（非表示 hidden / 復帰 published）。
--  通報経由でカード本体(post #1)を非表示にした場合に、一覧からも落とすために使う。
-- ----------------------------------------------------------------------------
create or replace function public.admin_set_friend_status(p_token text, p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if p_status not in ('published', 'hidden') then raise exception 'invalid status'; end if;
  update friends set status = p_status where id = p_id;
end; $$;
grant execute on function public.admin_set_friend_status(text, uuid, text) to anon;

select pg_notify('pgrst', 'reload schema');
