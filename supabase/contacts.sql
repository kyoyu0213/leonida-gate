-- ============================================================================
--  連絡フォーム（お問い合わせ）の保存テーブル＋送信RPC（スパム対策・メタ保存）
--  Supabase → SQL Editor に貼って Run。
--  前提：admin_auth.sql / board_moderation_meta.sql / board_blocks.sql 適用済み
--        （_admin_check / _req_meta / _is_blocked を利用）。
--
--  方針：クライアント直 insert はやめ、create_contact RPC 経由のみ。
--   - ハニーポット（隠し項目が埋まっていたら静かに無視）
--   - 同一IP/Cookie の連投制限（60秒に1回）／ブロックリスト適用
--   - 投稿者メタ（IP/UA/匿名Cookie/ハッシュ/サブネット）を保存（非公開）
--   - 閲覧は管理RPC経由のみ（anon は select 不可）
--  ※ NGワードは適用しない：削除依頼等で問題語を引用する正当なケースを弾かないため。
-- ============================================================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,                 -- 任意（返信が必要な方のみ）
  message text not null,
  images text[] not null default '{}',  -- 添付画像の Storage パス（任意）
  ip text, ua text, anon_id text, ip_hash text, ip_subnet text,  -- 発信者情報（非公開）
  created_at timestamptz not null default now()
);

-- 既存テーブルがある場合の移行
alter table public.contacts alter column email drop not null;
alter table public.contacts add column if not exists images text[] not null default '{}';
alter table public.contacts add column if not exists ip text;
alter table public.contacts add column if not exists ua text;
alter table public.contacts add column if not exists anon_id text;
alter table public.contacts add column if not exists ip_hash text;
alter table public.contacts add column if not exists ip_subnet text;

alter table public.contacts enable row level security;

-- 直接 insert は禁止（= 必ず create_contact RPC を通す）。閲覧ポリシーも作らない。
drop policy if exists "anyone can submit contact" on public.contacts;
-- 念のため発信者情報は anon/authenticated から読めないように
revoke select (ip, ua, anon_id, ip_hash, ip_subnet) on public.contacts from anon;
revoke select (ip, ua, anon_id, ip_hash, ip_subnet) on public.contacts from authenticated;
create index if not exists contacts_created_idx on public.contacts (created_at desc);

-- 送信（誰でも・ハニーポット・連投制限・ブロック・メタ保存）
create or replace function public.create_contact(
  p_name text, p_email text, p_message text,
  p_images text[] default '{}', p_anon_id text default null, p_hp text default null
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare m record; v_anon text := nullif(btrim(p_anon_id), '');
begin
  -- ハニーポット：隠し項目が埋まっている＝ボット。何もせず静かに終了（成功と錯覚させる）。
  if coalesce(btrim(p_hp), '') <> '' then return; end if;

  if char_length(coalesce(trim(p_name), '')) = 0 or char_length(p_name) > 60 then raise exception 'invalid name'; end if;
  if char_length(coalesce(trim(p_message), '')) = 0 or char_length(p_message) > 5000 then raise exception 'invalid message'; end if;
  if char_length(coalesce(p_email, '')) > 120 then raise exception 'invalid email'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  -- 連投制限：同一IP / 同一Cookie からの送信は60秒に1回
  if m.ip is not null and exists (
    select 1 from contacts where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from contacts where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into contacts (name, email, message, images, ip, ua, anon_id, ip_hash, ip_subnet)
  values (trim(p_name), nullif(trim(coalesce(p_email, '')), ''), trim(p_message), coalesce(p_images, '{}'),
          m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);
end; $$;
grant execute on function public.create_contact(text, text, text, text[], text, text) to anon;

-- 管理者：お問い合わせ一覧（発信者メタ込み）
drop function if exists public.admin_list_contacts(text);
create or replace function public.admin_list_contacts(p_token text)
returns table (
  id uuid, name text, email text, message text, images text[],
  ip text, ua text, anon_id text, ip_subnet text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select c.id, c.name, c.email, c.message, c.images,
         c.ip, c.ua, c.anon_id, c.ip_subnet, c.created_at
  from contacts c order by c.created_at desc limit 200;
end; $$;
grant execute on function public.admin_list_contacts(text) to anon;

-- 管理者：お問い合わせを削除（対応済みの整理用）
create or replace function public.admin_delete_contact(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from contacts where id = p_id;
end; $$;
grant execute on function public.admin_delete_contact(text, uuid) to anon;

select pg_notify('pgrst', 'reload schema');
