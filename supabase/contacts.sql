-- ============================================================================
--  連絡フォーム（お問い合わせ）の保存テーブル
--  Supabase → SQL Editor に貼って Run。
--  誰でも送信(insert)できるが、閲覧(select)ポリシーは作らない＝APIからは読めない。
--  受信メッセージは Supabase → Table Editor → contacts で確認する。
-- ============================================================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,                 -- 任意（返信が必要な方のみ）
  message text not null,
  images text[] not null default '{}',  -- 添付画像の Storage パス（任意）
  created_at timestamptz not null default now()
);

-- 既存テーブルがある場合の移行
alter table public.contacts alter column email drop not null;
alter table public.contacts add column if not exists images text[] not null default '{}';

alter table public.contacts enable row level security;

-- 誰でも送信できる
drop policy if exists "anyone can submit contact" on public.contacts;
create policy "anyone can submit contact"
  on public.contacts for insert
  to anon
  with check (true);

-- select ポリシーは作らない（= 一般ユーザー/APIからは閲覧不可）。
-- 閲覧はアプリ内管理画面（/admin/reports）の管理者トークン経由 RPC か、Supabase 管理画面で。

-- 管理者：お問い合わせ一覧（admin_auth.sql の _admin_check でトークン認可）
drop function if exists public.admin_list_contacts(text);
create or replace function public.admin_list_contacts(p_token text)
returns table (id uuid, name text, email text, message text, images text[], created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select c.id, c.name, c.email, c.message, c.images, c.created_at
  from contacts c order by c.created_at desc limit 200;
end; $$;

-- 管理者：お問い合わせを削除（対応済みの整理用）
create or replace function public.admin_delete_contact(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from contacts where id = p_id;
end; $$;

grant execute on function public.admin_list_contacts(text) to anon;
grant execute on function public.admin_delete_contact(text, uuid) to anon;
