-- ============================================================================
--  掲示板：画像投稿（②）— カテゴリ別フラグ／承認制／公開管理
--  Supabase → SQL Editor に貼って Run。
--  前提：board.sql / board_ip.sql / admin_auth.sql / board_reports.sql 実行済み。
--
--  ★ デフォルトは全カテゴリで「画像投稿 無効」。有効化は管理操作（末尾の例）で行う。
--  ★ 画像はクライアント側で再エンコード（EXIF/GPS除去・圧縮）して Storage に直接アップロードし、
--     create_board_image RPC で「承認待ち」として登録する。公開は管理者の承認後のみ。
--     （MIMEはアップロード前にクライアントで jpg/png/webp に限定し、RPCでも再検証する）
--
--  ▼ 有効化の例（管理画面、または SQL Editor で service role 実行）：
--     -- 管理画面のトークン経由：admin_set_board_image_setting(token, 'gta6', true, true)
--     -- 直接 SQL（service role）：
--        update public.board_image_settings
--          set images_enabled = true, require_approval = true where board = 'gta6';
-- ============================================================================

-- カテゴリ別の画像許可・承認要否（初期は全 board 無効）
create table if not exists public.board_image_settings (
  board text primary key,
  images_enabled boolean not null default false,
  require_approval boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 既存の掲示板スラッグを「無効」で投入（boards.ts の slug と一致させる）
insert into public.board_image_settings (board, images_enabled, require_approval) values
  ('gta6', false, true),
  ('gtarp', false, true),
  ('gtarp-servers', false, true)
on conflict (board) do nothing;

-- 設定は匿名でも読める（クライアントが入口を出すか判定するため）。書き込みは管理 RPC のみ。
alter table public.board_image_settings enable row level security;
drop policy if exists "read image settings" on public.board_image_settings;
create policy "read image settings" on public.board_image_settings for select to anon using (true);

-- 画像メタ。実体は private バケット board-images に保存し、ここはパスのみ保持。
create table if not exists public.board_images (
  id uuid primary key default gen_random_uuid(),
  board text not null,
  thread_id uuid references public.board_threads(id) on delete set null,
  post_id uuid references public.board_posts(id) on delete set null,
  storage_path text not null,
  mime text not null,
  status text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
  hidden boolean not null default false,
  uploader_ip text,                          -- 非公開（開示請求・再発対策のログ）
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.board_images enable row level security;
create index if not exists board_images_post_idx on public.board_images (post_id);
create index if not exists board_images_status_idx on public.board_images (status, created_at desc);

-- 匿名は「承認済み・非表示でない」画像のみ閲覧可。挿入は create_board_image RPC 経由のみ。
-- uploader_ip は匿名から読めないようにする。
revoke select (uploader_ip) on public.board_images from anon;
revoke select (uploader_ip) on public.board_images from authenticated;
drop policy if exists "read approved images" on public.board_images;
create policy "read approved images" on public.board_images
  for select to anon using (status = 'approved' and hidden = false);

-- ----------------------------------------------------------------------------
-- 投稿（誰でも・承認待ちで登録）。クライアントが Storage へアップロード後に呼ぶ。
--  board の images_enabled を確認し、require_approval なら pending、否なら approved。
--  MIME を再検証し、同一IPの連投を軽く制限する。
-- ----------------------------------------------------------------------------
create or replace function public.create_board_image(
  p_board text, p_thread_id uuid, p_post_id uuid, p_storage_path text, p_mime text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_ip text;
  v_enabled boolean;
  v_require boolean;
begin
  select images_enabled, require_approval into v_enabled, v_require
    from board_image_settings where board = p_board;
  if not coalesce(v_enabled, false) then
    raise exception 'images disabled';
  end if;
  if p_mime not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'invalid mime';
  end if;
  if char_length(coalesce(p_storage_path, '')) = 0 or char_length(p_storage_path) > 200 then
    raise exception 'invalid path';
  end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 連投制限：同一IPからの画像登録は5秒に1枚（1投稿で複数枚は許容しつつ乱用を抑制）
  if v_ip is not null and exists (
    select 1 from board_images where uploader_ip = v_ip and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'rate limited';
  end if;

  insert into board_images (board, thread_id, post_id, storage_path, mime, status, uploader_ip, approved_at)
  values (
    p_board, p_thread_id, p_post_id, p_storage_path, p_mime,
    case when coalesce(v_require, true) then 'pending' else 'approved' end,
    v_ip,
    case when coalesce(v_require, true) then null else now() end
  )
  returning id into v_id;
  return v_id;
end; $$;

grant execute on function public.create_board_image(text, uuid, uuid, text, text) to anon;

-- ----------------------------------------------------------------------------
-- 管理 RPC（_admin_check でトークン認可）
-- ----------------------------------------------------------------------------

-- 承認待ち一覧（プレビューは public バケットの公開URLをクライアントで生成）
create or replace function public.admin_list_pending_images(p_token text)
returns table (
  id uuid, board text, thread_id uuid, post_id uuid,
  storage_path text, mime text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select i.id, i.board, i.thread_id, i.post_id, i.storage_path, i.mime, i.created_at
  from board_images i
  where i.status = 'pending'
  order by i.created_at asc;
end; $$;

create or replace function public.admin_approve_image(p_token text, p_image_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_images set status = 'approved', approved_at = now() where id = p_image_id;
end; $$;

-- 却下：公開しない（status=rejected）。実体は開示請求・再発対策のため一定期間保持する方針。
create or replace function public.admin_reject_image(p_token text, p_image_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_images set status = 'rejected' where id = p_image_id;
end; $$;

-- 公開後のワンクリック非表示
create or replace function public.admin_set_image_hidden(p_token text, p_image_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update board_images set hidden = p_hidden where id = p_image_id;
end; $$;

-- カテゴリ別の有効化・承認要否の切り替え
create or replace function public.admin_set_board_image_setting(
  p_token text, p_board text, p_enabled boolean, p_require_approval boolean
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  insert into board_image_settings (board, images_enabled, require_approval, updated_at)
  values (p_board, p_enabled, p_require_approval, now())
  on conflict (board) do update
    set images_enabled = excluded.images_enabled,
        require_approval = excluded.require_approval,
        updated_at = now();
end; $$;

grant execute on function public.admin_list_pending_images(text) to anon;
grant execute on function public.admin_approve_image(text, uuid) to anon;
grant execute on function public.admin_reject_image(text, uuid) to anon;
grant execute on function public.admin_set_image_hidden(text, uuid, boolean) to anon;
grant execute on function public.admin_set_board_image_setting(text, text, boolean, boolean) to anon;
