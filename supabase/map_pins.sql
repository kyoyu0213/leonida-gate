-- ============================================================================
--  GTA5 隠し要素マップ：ピン投稿（承認キュー）
--  Supabase → SQL Editor に貼って Run（1回）。
--  前提：board_moderation.sql（banned_words）/ board_moderation_meta.sql（_req_meta）/
--        board_blocks.sql（_is_blocked）適用済み。
--
--  ▼ 作るもの
--    map_datasets … 地図ごとの座標範囲と受付可否（範囲外の投稿を弾く／GTA5 の受付停止に使う）
--    map_pins     … ピン本体。投稿は status='pending' で入り、承認（'approved'）されるまで
--                   公開されない。運営が入れる種データは source='official'（別ファイルの雛形参照）。
--    create_map_pin RPC … 投稿の唯一の入口
--
--  ▼ 権限（memory: supabase-grant-rules）
--    - 関数は `revoke all … from public` してから anon へ grant execute
--    - 読み取りは「テーブルごと revoke → 公開列だけ allowlist で grant」＋ RLS で approved のみ
--      （投稿者名・IP・UA・anon_id・審査メモは匿名から読めない）
--    - 書き込み（insert/update/delete）の直接実行は不可。RPC 経由のみ
--
--  ▼ 未実行でもサイトは動く
--    地図ページは取得失敗を空扱いにし、投稿だけ「準備中」を返す（client/src/lib/mapPins.ts）。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 地図データセット（座標範囲）
--    値は client/src/data/maps/gta5/meta.ts の bounds と一致させる。
--    ※ 今の値はプレースホルダ画像の暫定範囲。元画像が決まったら両方を更新すること。
-- ----------------------------------------------------------------------------
create table if not exists public.map_datasets (
  map_id text primary key check (map_id ~ '^[a-z0-9-]{1,16}$'),
  min_x double precision not null,
  max_x double precision not null,
  min_y double precision not null,
  max_y double precision not null,
  accepting boolean not null default true,
  check (min_x < max_x and min_y < max_y)
);
alter table public.map_datasets enable row level security;
-- 匿名から直接は読ませない（範囲は RPC の中でだけ使う）。
revoke all on public.map_datasets from anon, authenticated;

insert into public.map_datasets (map_id, min_x, max_x, min_y, max_y, accepting)
values ('gta5', -5144, 7144, -4144, 8144, true)
on conflict (map_id) do nothing;

-- ----------------------------------------------------------------------------
-- 2) ピン
-- ----------------------------------------------------------------------------
create table if not exists public.map_pins (
  id bigint generated always as identity primary key,
  map_id text not null references public.map_datasets (map_id),
  category text not null check (category ~ '^[a-z0-9-]{1,32}$'),
  x double precision not null,
  y double precision not null,
  z double precision,                                  -- 任意（地図クリックでは取れない高さ）
  title text not null check (char_length(title) between 1 and 60),
  description text not null default '' check (char_length(description) <= 400),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source text not null default 'user' check (source in ('user', 'official')),
  reviewed_at timestamptz,
  review_note text,
  -- 投稿メタ（匿名には非公開）
  author_name text check (author_name is null or char_length(author_name) <= 30),
  anon_id text,
  ip text,
  ip_hash text,
  ip_subnet text,
  ua text,
  created_at timestamptz not null default now()
);
create index if not exists map_pins_public_idx on public.map_pins (map_id, status, created_at);
create index if not exists map_pins_ip_idx on public.map_pins (ip, created_at desc);
create index if not exists map_pins_anon_idx on public.map_pins (anon_id, created_at desc);
alter table public.map_pins enable row level security;

-- 読み取り：テーブルごと revoke → 公開列だけ grant（列単位 revoke はテーブル grant があると無視されるため）
revoke all on public.map_pins from anon, authenticated;
grant select (id, map_id, category, x, y, z, title, description, source, created_at)
  on public.map_pins to anon, authenticated;

drop policy if exists "read approved map pins" on public.map_pins;
create policy "read approved map pins" on public.map_pins
  for select to anon, authenticated
  using (status = 'approved');

-- ----------------------------------------------------------------------------
-- 3) 投稿 RPC
--    処理順（固定）:
--      ① ハニーポット → ② _req_meta（IP等）→ ③ _is_blocked → ④ 連投制限 60秒
--      → ⑤ 保留上限 10件 / IP / 24時間 → ⑥ NGワード → ⑦ 範囲外拒否（受付停止を含む）
--      → ⑧ 近接重複拒否（同じ地図・同じカテゴリで半径3m以内に pending/approved）→ ⑨ pending で INSERT
--    ※ ①の直後に入力の形だけ検証する（空タイトル・長さ超過・カテゴリ書式）。DB 参照は伴わない。
-- ----------------------------------------------------------------------------
drop function if exists public.create_map_pin(text, text, double precision, double precision, double precision, text, text, text, text, text);
create or replace function public.create_map_pin(
  p_map_id text,
  p_category text,
  p_x double precision,
  p_y double precision,
  p_z double precision default null,
  p_title text default null,
  p_description text default null,
  p_author_name text default null,
  p_anon_id text default null,
  p_hp text default null
) returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id bigint;
  m record;
  d record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_title text := btrim(coalesce(p_title, ''));
  v_desc text := btrim(coalesce(p_description, ''));
  v_name text := nullif(btrim(coalesce(p_author_name, '')), '');
  v_cat text := btrim(coalesce(p_category, ''));
  v_x double precision;
  v_y double precision;
  v_z double precision;
  v_haystack text;
begin
  -- ① ハニーポット：埋まっていたら何もせず終了（エラーも返さない）
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  -- 入力の形（DB を見ない検査）
  if char_length(v_title) = 0 or char_length(v_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(v_desc) > 400 then raise exception 'invalid description'; end if;
  if v_name is not null and char_length(v_name) > 30 then raise exception 'invalid author'; end if;
  if v_cat !~ '^[a-z0-9-]{1,32}$' then raise exception 'invalid category'; end if;
  if p_x is null or p_y is null then raise exception 'invalid coordinates'; end if;
  if p_z is not null and (p_z < -500 or p_z > 3000) then raise exception 'invalid coordinates'; end if;
  v_x := round(p_x::numeric, 2)::double precision;
  v_y := round(p_y::numeric, 2)::double precision;
  v_z := case when p_z is null then null else round(p_z::numeric, 2)::double precision end;

  -- ② 投稿メタ（IP は PostgREST のリクエストヘッダから）
  select * into m from _req_meta();

  -- ③ ブロック
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  -- ④ 連投制限：同じ IP / 同じブラウザから 60 秒以内
  if m.ip is not null and exists (
    select 1 from map_pins where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from map_pins where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  -- ⑤ 保留上限：同じ IP の審査待ちが 24 時間で 10 件（IP が取れない時はブラウザIDで数える）
  if (
    select count(*) from map_pins
    where status = 'pending'
      and created_at > now() - interval '24 hours'
      and ((m.ip is not null and ip = m.ip) or (m.ip is null and v_anon is not null and anon_id = v_anon))
  ) >= 10 then raise exception 'daily limit'; end if;

  -- ⑥ NGワード（タイトル・説明・投稿者名）
  v_haystack := lower(v_title || ' ' || v_desc || ' ' || coalesce(v_name, ''));
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then raise exception 'banned word'; end if;

  -- ⑦ 範囲外拒否（データセットが無い・受付停止も含む）
  select * into d from map_datasets where map_id = p_map_id;
  if not found then raise exception 'invalid map'; end if;
  if not d.accepting then raise exception 'not accepting'; end if;
  if not (v_x between d.min_x and d.max_x and v_y between d.min_y and d.max_y) then
    raise exception 'out of bounds';
  end if;

  -- ⑧ 近接重複拒否：同じ地図・同じカテゴリで半径 3m 以内に審査待ち／承認済みがある
  if exists (
    select 1 from map_pins
    where map_id = p_map_id and category = v_cat and status in ('pending', 'approved')
      and (x - v_x) * (x - v_x) + (y - v_y) * (y - v_y) <= 9
  ) then raise exception 'duplicate pin'; end if;

  -- ⑨ 審査待ちで登録（承認されるまで公開されない）
  insert into map_pins
    (map_id, category, x, y, z, title, description, status, source,
     author_name, anon_id, ip, ip_hash, ip_subnet, ua)
  values
    (p_map_id, v_cat, v_x, v_y, v_z, v_title, v_desc, 'pending', 'user',
     v_name, v_anon, m.ip, m.ip_hash, m.ip_subnet, m.ua)
  returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.create_map_pin(text, text, double precision, double precision, double precision, text, text, text, text, text) from public;
grant execute on function public.create_map_pin(text, text, double precision, double precision, double precision, text, text, text, text, text) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');

-- ----------------------------------------------------------------------------
-- 適用後の確認（任意）：公開 anon キーで次を叩いて確かめる
--   1) 承認済みだけが返る  : GET /rest/v1/map_pins?select=id,title,status  → status 列は権限エラーになる（非公開）
--   2) 投稿は pending      : POST /rest/v1/rpc/create_map_pin → 返った id を SQL Editor で
--                            select status from map_pins where id = <id>;  → 'pending'
--   3) pending は見えない  : GET /rest/v1/map_pins?select=id&id=eq.<id> → []
-- ----------------------------------------------------------------------------
