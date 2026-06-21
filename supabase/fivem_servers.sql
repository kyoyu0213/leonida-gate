-- ============================================================================
--  FiveM サーバー掲示板 用テーブル（Supabase）
--  Supabase ダッシュボード → SQL Editor に貼り付けて Run すれば作成されます。
--  承認制：投稿は approved=false で入り、運営が approved=true にしたものだけ表示。
-- ============================================================================

create table if not exists public.fivem_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  type text not null default 'RP',          -- RP / Racing / Survival / Other
  connect_info text,                          -- cfx.re/join/xxxx または IP:port
  discord_url text,
  language text default '日本語',
  tags text[] not null default '{}',
  approved boolean not null default false,    -- 承認フラグ（管理者が true にする）
  created_at timestamptz not null default now()
);

-- 一覧取得を速くするためのインデックス
create index if not exists fivem_servers_approved_created_idx
  on public.fivem_servers (approved, created_at desc);

-- Row Level Security（行レベルセキュリティ）を有効化
alter table public.fivem_servers enable row level security;

-- 誰でも投稿できる。ただし approved=false でしか登録できない（＝自分で承認は不可）
create policy "anon can submit unapproved"
  on public.fivem_servers for insert
  to anon
  with check (approved = false);

-- 承認済みのサーバーだけ、誰でも閲覧できる
create policy "anyone can read approved"
  on public.fivem_servers for select
  to anon
  using (approved = true);
