-- ============================================================================
--  FiveM サーバー募集板 用テーブル（Supabase）
--  Supabase ダッシュボード → SQL Editor に貼り付けて Run すれば作成されます。
--  ★ 承認制は廃止：誰でも投稿でき、投稿は即時掲載される。
--    （不適切な掲載は運営がダッシュボードから削除する運用）
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
  approved boolean not null default true,     -- 即時掲載（承認制を廃止）
  created_at timestamptz not null default now()
);

-- 一覧取得を速くするためのインデックス
create index if not exists fivem_servers_approved_created_idx
  on public.fivem_servers (approved, created_at desc);

-- Row Level Security（行レベルセキュリティ）を有効化
alter table public.fivem_servers enable row level security;

-- ▼ 既存環境を「承認制」から「即時掲載」へ移行するとき（このファイルを作成済みの場合）
--   下のブロックも一緒に Run してください（新規作成時は上の create だけでOK）。
alter table public.fivem_servers alter column approved set default true;
update public.fivem_servers set approved = true where approved = false;  -- 保留中も公開する場合

-- 誰でも投稿でき、即時掲載される
drop policy if exists "anon can submit unapproved" on public.fivem_servers;
drop policy if exists "anyone can submit" on public.fivem_servers;
create policy "anyone can submit"
  on public.fivem_servers for insert
  to anon
  with check (true);

-- 掲載中（approved=true）のサーバーは誰でも閲覧できる
drop policy if exists "anyone can read approved" on public.fivem_servers;
create policy "anyone can read approved"
  on public.fivem_servers for select
  to anon
  using (approved = true);
