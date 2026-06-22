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

-- select ポリシーは作らない（= 一般ユーザー/APIからは閲覧不可。管理画面でのみ確認）
