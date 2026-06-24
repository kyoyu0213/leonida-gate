-- ============================================================================
--  GTARP鯖別掲示板「スレッド作成申請」テーブル＋申請RPC（スパム対策・メタ保存）
--  Supabase → SQL Editor に貼って Run。
--  前提：admin_auth.sql / board_moderation_meta.sql / board_blocks.sql 適用済み
--        （_admin_check / _req_meta / _is_blocked / banned_words を利用）。
--
--  方針：クライアント直 insert はやめ、create_server_application RPC 経由のみ。
--   - ハニーポット（隠し項目が埋まっていたら静かに無視）
--   - 同一IP/Cookie の連投制限（60秒に1回）／ブロックリスト適用
--   - NGワード（公開スレッドになるため server_name/description/applicant に適用）
--   - 申請者メタ（IP/UA/匿名Cookie/ハッシュ/サブネット）を保存（非公開）
--   - 閲覧・承認は管理RPC経由のみ
-- ============================================================================

create table if not exists public.server_applications (
  id uuid primary key default gen_random_uuid(),
  server_name text not null,
  description text not null,
  contact text,          -- Discord招待URLなどの連絡先
  applicant text,        -- 申請者名（任意）
  approved boolean not null default false,
  ip text, ua text, anon_id text, ip_hash text, ip_subnet text,  -- 申請者情報（非公開）
  created_at timestamptz not null default now()
);

-- 既存テーブルの移行
alter table public.server_applications add column if not exists ip text;
alter table public.server_applications add column if not exists ua text;
alter table public.server_applications add column if not exists anon_id text;
alter table public.server_applications add column if not exists ip_hash text;
alter table public.server_applications add column if not exists ip_subnet text;

alter table public.server_applications enable row level security;

-- 直接 insert は禁止（= 必ず create_server_application RPC を通す）。閲覧ポリシーも作らない。
drop policy if exists "anyone can apply" on public.server_applications;
revoke select (ip, ua, anon_id, ip_hash, ip_subnet) on public.server_applications from anon;
revoke select (ip, ua, anon_id, ip_hash, ip_subnet) on public.server_applications from authenticated;

-- 申請（誰でも・ハニーポット・連投制限・ブロック・NGワード・メタ保存）
create or replace function public.create_server_application(
  p_server_name text, p_description text, p_contact text default null,
  p_applicant text default null, p_anon_id text default null, p_hp text default null
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare m record; v_anon text := nullif(btrim(p_anon_id), '');
begin
  -- ハニーポット：隠し項目が埋まっている＝ボット。何もせず静かに終了。
  if coalesce(btrim(p_hp), '') <> '' then return; end if;

  if char_length(coalesce(trim(p_server_name), '')) = 0 or char_length(p_server_name) > 60 then raise exception 'invalid name'; end if;
  if char_length(coalesce(trim(p_description), '')) = 0 or char_length(p_description) > 500 then raise exception 'invalid description'; end if;
  if char_length(coalesce(p_contact, '')) > 120 then raise exception 'invalid contact'; end if;
  if char_length(coalesce(p_applicant, '')) > 40 then raise exception 'invalid applicant'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  -- NGワード（公開スレッドになるため）
  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_server_name)) > 0
         or position(lower(bw.word) in lower(p_description)) > 0
         or position(lower(bw.word) in lower(coalesce(p_applicant, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  -- 連投制限：同一IP / 同一Cookie からの申請は60秒に1回
  if m.ip is not null and exists (
    select 1 from server_applications where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from server_applications where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into server_applications
    (server_name, description, contact, applicant, approved, ip, ua, anon_id, ip_hash, ip_subnet)
  values
    (trim(p_server_name), trim(p_description),
     nullif(btrim(coalesce(p_contact, '')), ''), nullif(btrim(coalesce(p_applicant, '')), ''),
     false, m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);
end; $$;
grant execute on function public.create_server_application(text, text, text, text, text, text) to anon;

-- 管理者：掲載申請の一覧（申請者メタ込み・未対応を先頭に）
drop function if exists public.admin_list_applications(text);
create or replace function public.admin_list_applications(p_token text)
returns table (
  id uuid, server_name text, description text, contact text, applicant text, approved boolean,
  ip text, ua text, anon_id text, ip_subnet text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select a.id, a.server_name, a.description, a.contact, a.applicant, a.approved,
         a.ip, a.ua, a.anon_id, a.ip_subnet, a.created_at
  from server_applications a
  order by a.approved asc, a.created_at desc
  limit 100;
end; $$;
grant execute on function public.admin_list_applications(text) to anon;

-- 管理者：申請を承認 → gtarp-servers にスレッドを作成し、申請を承認済みにする。新スレIDを返す。
create or replace function public.admin_approve_application(p_token text, p_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_app server_applications;
  v_thread_id uuid;
  v_body text;
begin
  perform _admin_check(p_token);
  select * into v_app from server_applications where id = p_id;
  if v_app.id is null then raise exception 'not found'; end if;

  v_body := v_app.description;
  if coalesce(btrim(v_app.contact), '') <> '' then
    v_body := v_body || E'\n\n連絡先: ' || v_app.contact;
  end if;

  insert into board_threads (board, title)
    values ('gtarp-servers', left(trim(v_app.server_name), 60))
    returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body)
    values (v_thread_id, 1, coalesce(nullif(btrim(v_app.applicant), ''), '名無しさん'), v_body);

  update server_applications set approved = true where id = p_id;
  return v_thread_id;
end; $$;

-- 管理者：申請を削除（却下／整理用）
create or replace function public.admin_delete_application(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from server_applications where id = p_id;
end; $$;

grant execute on function public.admin_approve_application(text, uuid) to anon;
grant execute on function public.admin_delete_application(text, uuid) to anon;

select pg_notify('pgrst', 'reload schema');
