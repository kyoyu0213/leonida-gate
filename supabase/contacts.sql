-- ============================================================================
--  連絡フォーム（お問い合わせ）の保存テーブル
--  Supabase → SQL Editor に貼って Run。
--  誰でも送信(insert)できるが、閲覧(select)ポリシーは作らない＝APIからは読めない。
--  受信メッセージは Supabase → Table Editor → contacts で確認する。
-- ============================================================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

-- 誰でも送信できる
drop policy if exists "anyone can submit contact" on public.contacts;
create policy "anyone can submit contact"
  on public.contacts for insert
  to anon
  with check (true);

-- select ポリシーは作らない（= 一般ユーザー/APIからは閲覧不可。管理画面でのみ確認）
