-- ============================================================================
--  GTARP鯖別掲示板「スレッド作成申請」テーブル
--  Supabase → SQL Editor に貼って Run。
--  誰でも申請(insert)できるが、閲覧(select)ポリシーは作らない＝APIからは読めない。
--  申請は Supabase → Table Editor → server_applications で確認し、
--  内容を確認のうえ、管理者が gtarp-servers 掲示板にスレッドを作成する。
-- ============================================================================

create table if not exists public.server_applications (
  id uuid primary key default gen_random_uuid(),
  server_name text not null,
  description text not null,
  contact text,          -- Discord招待URLなどの連絡先
  applicant text,        -- 申請者名（任意）
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.server_applications enable row level security;

drop policy if exists "anyone can apply" on public.server_applications;
create policy "anyone can apply"
  on public.server_applications for insert
  to anon
  with check (approved = false);

-- select ポリシーは作らない（= 一般ユーザー/APIからは閲覧不可）。
-- 閲覧・承認はアプリ内管理画面（/admin/reports「掲載申請」タブ）の管理者トークン経由 RPC で行う。

-- 管理者：掲載申請の一覧（未対応を先頭に）。admin_auth.sql の _admin_check で認可。
create or replace function public.admin_list_applications(p_token text)
returns table (
  id uuid, server_name text, description text, contact text,
  applicant text, approved boolean, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select a.id, a.server_name, a.description, a.contact, a.applicant, a.approved, a.created_at
  from server_applications a
  order by a.approved asc, a.created_at desc
  limit 100;
end; $$;

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

grant execute on function public.admin_list_applications(text) to anon;
grant execute on function public.admin_approve_application(text, uuid) to anon;
grant execute on function public.admin_delete_application(text, uuid) to anon;
