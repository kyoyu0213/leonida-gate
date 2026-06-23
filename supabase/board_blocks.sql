-- ============================================================================
--  荒らし対策：自動ブロック（IP / IPサブネット / 匿名Cookie ID 単位で投稿拒否）
--  Supabase → SQL Editor に貼って Run。
--  前提：board_moderation_meta.sql 実行済み（_req_meta / 新 create_post など）。
--
--  ブロック対象に一致する投稿は create_thread / create_post で 'blocked' 例外になる。
--  ブロックの追加・解除は管理者トークン（admin_auth.sql）で行う。
-- ============================================================================

create table if not exists public.board_blocks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ip', 'ip_subnet', 'anon')),
  value text not null,
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,                 -- null = 無期限
  unique (kind, value)
);
alter table public.board_blocks enable row level security;
create index if not exists board_blocks_lookup_idx on public.board_blocks (kind, value);

-- ブロック判定（内部用）
create or replace function public._is_blocked(p_ip text, p_subnet text, p_anon text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from board_blocks b
    where (b.expires_at is null or b.expires_at > now())
      and (
        (b.kind = 'ip'        and p_ip     is not null and b.value = p_ip)
        or (b.kind = 'ip_subnet' and p_subnet is not null and b.value = p_subnet)
        or (b.kind = 'anon'      and p_anon   is not null and b.value = p_anon)
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- create_thread / create_post をブロックチェック付きで作り直し
-- （board_moderation_meta.sql の内容＋先頭にブロック判定を追加）
-- ----------------------------------------------------------------------------
create or replace function public.create_thread(
  p_board text, p_title text, p_name text, p_body text, p_anon_id text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_thread_id uuid;
  m record;
begin
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, p_anon_id) then raise exception 'blocked'; end if;

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_title)) > 0
         or position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into board_threads (board, title) values (trim(p_board), trim(p_title)) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, nullif(btrim(p_anon_id), ''), m.ip_hash, m.ip_subnet);
  return v_thread_id;
end; $$;

create or replace function public.create_post(
  p_thread_id uuid, p_name text, p_body text, p_anon_id text default null
) returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  v_num int;
  m record;
begin
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, p_anon_id) then raise exception 'blocked'; end if;

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and created_at > now() - interval '8 seconds'
  ) then raise exception 'rate limited'; end if;

  update board_threads set post_count = post_count + 1, last_posted_at = now()
    where id = p_thread_id returning post_count into v_num;
  if v_num is null then raise exception 'thread not found'; end if;
  if v_num > 1000 then raise exception 'thread full'; end if;

  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (p_thread_id, v_num, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, nullif(btrim(p_anon_id), ''), m.ip_hash, m.ip_subnet);
  return v_num;
end; $$;

grant execute on function public.create_thread(text, text, text, text, text) to anon;
grant execute on function public.create_post(uuid, text, text, text) to anon;

-- ----------------------------------------------------------------------------
-- 管理：ブロックの一覧／追加／解除（admin_auth.sql のトークン認可）
-- ----------------------------------------------------------------------------
create or replace function public.admin_list_blocks(p_token text)
returns table (id uuid, kind text, value text, reason text, created_at timestamptz, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query select b.id, b.kind, b.value, b.reason, b.created_at, b.expires_at
  from board_blocks b order by b.created_at desc limit 200;
end; $$;

-- p_days: null = 無期限、数値 = その日数で失効
create or replace function public.admin_add_block(
  p_token text, p_kind text, p_value text, p_reason text default null, p_days int default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform _admin_check(p_token);
  if p_kind not in ('ip', 'ip_subnet', 'anon') then raise exception 'invalid kind'; end if;
  if char_length(coalesce(btrim(p_value), '')) = 0 then raise exception 'invalid value'; end if;
  insert into board_blocks (kind, value, reason, expires_at)
  values (p_kind, btrim(p_value), nullif(btrim(p_reason), ''),
          case when p_days is not null then now() + make_interval(days => p_days) else null end)
  on conflict (kind, value) do update
    set reason = excluded.reason, expires_at = excluded.expires_at, created_at = now()
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.admin_remove_block(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from board_blocks where id = p_id;
end; $$;

grant execute on function public.admin_list_blocks(text) to anon;
grant execute on function public.admin_add_block(text, text, text, text, int) to anon;
grant execute on function public.admin_remove_block(text, uuid) to anon;

-- ----------------------------------------------------------------------------
-- 管理：投稿ログ（最近の投稿を横断して一覧。IP等のメタは詳細RPCで取得）
-- ----------------------------------------------------------------------------
create or replace function public.admin_list_posts(p_token text, p_limit int default 50)
returns table (
  id uuid, board text, thread_id uuid, post_number int, name text, body text,
  hidden boolean, ip text, ua text, anon_id text, created_at timestamptz, report_count bigint
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select p.id, t.board, p.thread_id, p.post_number, p.name, p.body, p.hidden,
         p.ip, p.ua, p.anon_id, p.created_at,
         (select count(*) from board_reports r where r.post_id = p.id)
  from board_posts p
  join board_threads t on t.id = p.thread_id
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end; $$;
grant execute on function public.admin_list_posts(text, int) to anon;
