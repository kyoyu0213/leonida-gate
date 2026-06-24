-- ============================================================================
--  FiveM サーバー募集板：スパム対策強化 ＋ 投稿者メタ保存 ＋ 管理RPC（一覧・削除）
--  Supabase → SQL Editor に貼って Run。
--  前提：fivem_servers.sql / admin_auth.sql / board_moderation_meta.sql /
--        board_blocks.sql（banned_words / _req_meta / _is_blocked / _admin_check）実行済み。
--
--  掲示板と同方式：
--   - 直接 insert（anon）を禁止し、SECURITY DEFINER の create_fivem_server 経由のみ。
--   - ハニーポット／同一IP・Cookieの連投制限（60秒）／NGワード／ブロックリスト適用。
--   - 投稿者メタ（IP/UA/匿名Cookie/ハッシュ/サブネット）を保存（非公開）。
--   - 管理画面から一覧・削除できる admin RPC を追加。
-- ============================================================================

-- 投稿者メタ列（非公開。匿名・認証ユーザーからは読めない＝管理用ログ）
alter table public.fivem_servers add column if not exists ip text;
alter table public.fivem_servers add column if not exists ua text;
alter table public.fivem_servers add column if not exists anon_id text;
alter table public.fivem_servers add column if not exists ip_hash text;
alter table public.fivem_servers add column if not exists ip_subnet text;
revoke select (ip, ua, anon_id, ip_hash, ip_subnet) on public.fivem_servers from anon;
revoke select (ip, ua, anon_id, ip_hash, ip_subnet) on public.fivem_servers from authenticated;

-- 直接 insert を無効化（= 必ず関数を通す）
drop policy if exists "anyone can submit" on public.fivem_servers;
drop policy if exists "anon can submit unapproved" on public.fivem_servers;

-- 掲載（誰でも・即時掲載）。ハニーポット＋NGワード＋IP/Cookie連投制限＋ブロック＋メタ保存。
-- ※ 引数を追加（p_anon_id / p_hp）するため既存をDROPしてから作り直す。
drop function if exists public.create_fivem_server(text, text, text, text, text, text, text[]);
create or replace function public.create_fivem_server(
  p_name text,
  p_description text,
  p_type text,
  p_connect_info text,
  p_discord_url text,
  p_language text,
  p_tags text[],
  p_anon_id text default null,
  p_hp text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_haystack text;
begin
  -- ハニーポット：隠し項目が埋まっている＝ボット。何もせず終了（NULLを返す）。
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  if char_length(coalesce(trim(p_name), '')) = 0 or char_length(p_name) > 60 then
    raise exception 'invalid name';
  end if;
  if char_length(coalesce(trim(p_description), '')) = 0 or char_length(p_description) > 500 then
    raise exception 'invalid description';
  end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  -- 禁止ワード（名前・説明・タグを部分一致・大小無視で検査）
  v_haystack := lower(coalesce(p_name, '') || ' ' || coalesce(p_description, '') || ' '
                      || coalesce(array_to_string(p_tags, ' '), ''));
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then
    raise exception 'banned word';
  end if;

  -- 連投制限：同一IP / 同一Cookie からの掲載は60秒に1回
  if m.ip is not null and exists (
    select 1 from fivem_servers where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from fivem_servers where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into fivem_servers
    (name, description, type, connect_info, discord_url, language, tags, approved,
     ip, ua, anon_id, ip_hash, ip_subnet)
  values (
    trim(p_name), trim(p_description),
    coalesce(nullif(trim(p_type), ''), 'RP'),
    nullif(trim(p_connect_info), ''),
    nullif(trim(p_discord_url), ''),
    nullif(trim(p_language), ''),
    coalesce(p_tags, '{}'),
    true,
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet
  )
  returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.create_fivem_server(text, text, text, text, text, text, text[], text, text) to anon;

-- 管理者：FiveM募集の一覧（投稿者メタ込み・新しい順）
create or replace function public.admin_list_fivem_servers(p_token text)
returns table (
  id uuid, name text, description text, type text, connect_info text, discord_url text,
  language text, tags text[], ip text, ua text, anon_id text, ip_subnet text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select s.id, s.name, s.description, s.type, s.connect_info, s.discord_url,
         s.language, s.tags, s.ip, s.ua, s.anon_id, s.ip_subnet, s.created_at
  from fivem_servers s order by s.created_at desc limit 200;
end; $$;
grant execute on function public.admin_list_fivem_servers(text) to anon;

-- 管理者：FiveM募集の削除
create or replace function public.admin_delete_fivem_server(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from fivem_servers where id = p_id;
end; $$;
grant execute on function public.admin_delete_fivem_server(text, uuid) to anon;

select pg_notify('pgrst', 'reload schema');
