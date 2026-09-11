-- ============================================================================
--  GTA5 隠し要素マップ：ピンの管理（承認キュー）RPC
--  Supabase → SQL Editor に貼って Run（1回・何度実行しても同じ結果）。
--  前提：admin_auth.sql（_admin_check）/ map_pins.sql（map_pins・map_datasets）適用済み。
--
--  ▼ 作るもの（すべて管理画面 /admin/reports の「マップピン」タブ用）
--    admin_list_map_pins(token, status)        … 一覧（pending/approved/rejected/all・新しい順）
--    admin_review_map_pin(token, id, status, note)
--                                              … 承認／却下（reviewed_at・review_note を記録）
--    admin_update_map_pin(token, id, category, title, description, x, y, z)
--                                              … カテゴリ・文言・座標の修正（範囲外は弾く）
--
--  ▼ 権限（memory: supabase-grant-rules）
--    - 先頭で必ず _admin_check(token)（管理者セッション・有効期限2時間）
--    - 既存の管理 RPC（board_images.sql など）と同じく anon へ grant execute。
--      管理画面は Supabase Auth を使わず anon キー＋管理トークンで呼ぶため。
--    - 関数は create 時に PUBLIC へ EXECUTE が既定付与されるので、`from public` を含めて
--      いったん全部 revoke してから anon にだけ付け直す。
--    - map_pins の RLS・公開列 allowlist は変更しない（承認済みだけ公開の原則はそのまま）。
--
--  ▼ 未実行でもサイトは動く
--    管理画面の「マップピン」タブが「SQL 未実行」と表示するだけで、他のタブ・公開ページには影響しない。
-- ============================================================================

-- 戻り値の形を変えたときに create or replace が失敗しないよう、先に消す（再実行可）。
drop function if exists public.admin_list_map_pins(text, text);
drop function if exists public.admin_review_map_pin(text, bigint, text, text);
drop function if exists public.admin_update_map_pin(text, bigint, text, text, text, double precision, double precision, double precision);

-- ----------------------------------------------------------------------------
-- 1) 一覧：status で絞り込み。管理用に投稿メタ（IP・ブラウザID・UA・投稿者名）も返す。
-- ----------------------------------------------------------------------------
create or replace function public.admin_list_map_pins(p_token text, p_status text default 'pending')
returns table (
  id bigint, map_id text, category text,
  x double precision, y double precision, z double precision,
  title text, description text, status text, source text,
  reviewed_at timestamptz, review_note text,
  author_name text, anon_id text, ip text, ip_subnet text, ua text,
  created_at timestamptz
) language plpgsql security definer set search_path = public as $$
declare
  v_status text := coalesce(nullif(btrim(p_status), ''), 'pending');
begin
  perform _admin_check(p_token);
  if v_status not in ('pending', 'approved', 'rejected', 'all') then
    raise exception 'invalid status';
  end if;
  return query
  select p.id, p.map_id, p.category, p.x, p.y, p.z,
         p.title, p.description, p.status, p.source,
         p.reviewed_at, p.review_note,
         p.author_name, p.anon_id, p.ip, p.ip_subnet, p.ua,
         p.created_at
  from map_pins p
  where v_status = 'all' or p.status = v_status
  order by p.created_at desc
  limit 500;
end; $$;

-- ----------------------------------------------------------------------------
-- 2) 承認／却下。承認済みを却下に戻す（またはその逆）のも可。理由は任意（500字まで）。
-- ----------------------------------------------------------------------------
create or replace function public.admin_review_map_pin(
  p_token text, p_id bigint, p_status text, p_note text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  perform _admin_check(p_token);
  if p_status not in ('approved', 'rejected') then raise exception 'invalid status'; end if;
  if v_note is not null and char_length(v_note) > 500 then raise exception 'invalid note'; end if;
  update map_pins
     set status = p_status, reviewed_at = now(), review_note = v_note
   where id = p_id;
  if not found then raise exception 'not found'; end if;
end; $$;

-- ----------------------------------------------------------------------------
-- 3) 修正：カテゴリ・タイトル・説明・座標。入力の形は create_map_pin と同じ基準で検証し、
--    座標はそのピンの地図（map_datasets）の範囲内だけ受け付ける。
--    受付停止（accepting=false）中でも運営の修正はできる。status は変えない。
-- ----------------------------------------------------------------------------
create or replace function public.admin_update_map_pin(
  p_token text, p_id bigint,
  p_category text, p_title text, p_description text,
  p_x double precision, p_y double precision, p_z double precision default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_desc text := btrim(coalesce(p_description, ''));
  v_cat text := btrim(coalesce(p_category, ''));
  v_map text;
  d record;
  v_x double precision;
  v_y double precision;
  v_z double precision;
begin
  perform _admin_check(p_token);

  if char_length(v_title) = 0 or char_length(v_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(v_desc) > 400 then raise exception 'invalid description'; end if;
  if v_cat !~ '^[a-z0-9-]{1,32}$' then raise exception 'invalid category'; end if;
  if p_x is null or p_y is null then raise exception 'invalid coordinates'; end if;
  if p_z is not null and (p_z < -500 or p_z > 3000) then raise exception 'invalid coordinates'; end if;
  v_x := round(p_x::numeric, 2)::double precision;
  v_y := round(p_y::numeric, 2)::double precision;
  v_z := case when p_z is null then null else round(p_z::numeric, 2)::double precision end;

  select map_id into v_map from map_pins where id = p_id;
  if not found then raise exception 'not found'; end if;

  select * into d from map_datasets where map_id = v_map;
  if not found then raise exception 'invalid map'; end if;
  if not (v_x between d.min_x and d.max_x and v_y between d.min_y and d.max_y) then
    raise exception 'out of bounds';
  end if;

  update map_pins
     set category = v_cat, title = v_title, description = v_desc,
         x = v_x, y = v_y, z = v_z
   where id = p_id;
end; $$;

revoke all on function public.admin_list_map_pins(text, text) from public, anon, authenticated;
revoke all on function public.admin_review_map_pin(text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_map_pin(text, bigint, text, text, text, double precision, double precision, double precision) from public, anon, authenticated;
grant execute on function public.admin_list_map_pins(text, text) to anon;
grant execute on function public.admin_review_map_pin(text, bigint, text, text) to anon;
grant execute on function public.admin_update_map_pin(text, bigint, text, text, text, double precision, double precision, double precision) to anon;

select pg_notify('pgrst', 'reload schema');

-- ----------------------------------------------------------------------------
-- 適用後の確認（任意）
--   1) 管理トークン無しでは弾かれる：
--        POST /rest/v1/rpc/admin_list_map_pins {"p_token":"x"} → 'forbidden'
--   2) 承認済みだけが公開される（RLS はそのまま）：
--        GET /rest/v1/map_pins?select=id,title&map_id=eq.gta5 → 承認したピンだけ
-- ----------------------------------------------------------------------------
