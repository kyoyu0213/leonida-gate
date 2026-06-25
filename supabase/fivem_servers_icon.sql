-- ============================================================================
--  FiveM サーバー募集板：サーバーのアイコン画像（アップロード・承認不要で即時表示）
--  Supabase → SQL Editor に貼って Run。
--  前提：fivem_servers.sql / fivem_servers_moderation.sql 適用済み。
--
--  - fivem_servers に icon 列（Storage パス）を追加。
--  - create_fivem_server に p_icon を追加。自バケットのパス(fivem-server/...)のみ採用し、
--    外部URL等は無視する。承認キューは通さず、保存パスをそのまま表示する（＝申請不要・即時）。
--  - 画像実体は public バケット board-images の fivem-server/ 配下に置かれる（クライアントが
--    再エンコード=EXIF除去してアップロード）。
-- ============================================================================

alter table public.fivem_servers add column if not exists icon text;

-- 引数追加（p_icon）のため作り直す。
drop function if exists public.create_fivem_server(text, text, text, text, text, text, text[], text, text);
create or replace function public.create_fivem_server(
  p_name text,
  p_description text,
  p_type text,
  p_connect_info text,
  p_discord_url text,
  p_language text,
  p_tags text[],
  p_anon_id text default null,
  p_hp text default null,
  p_icon text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_haystack text;
  v_icon text;
begin
  -- ハニーポット：埋まっていたら何もせず終了。
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  if char_length(coalesce(trim(p_name), '')) = 0 or char_length(p_name) > 60 then
    raise exception 'invalid name';
  end if;
  if char_length(coalesce(trim(p_description), '')) = 0 or char_length(p_description) > 500 then
    raise exception 'invalid description';
  end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  v_haystack := lower(coalesce(p_name, '') || ' ' || coalesce(p_description, '') || ' '
                      || coalesce(array_to_string(p_tags, ' '), ''));
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from fivem_servers where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from fivem_servers where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  -- アイコンは自バケットのパス(fivem-server/...)のみ採用。それ以外(外部URL等)は無視。
  v_icon := case when p_icon like 'fivem-server/%' then p_icon else null end;

  insert into fivem_servers
    (name, description, type, connect_info, discord_url, language, tags, approved,
     ip, ua, anon_id, ip_hash, ip_subnet, icon)
  values (
    trim(p_name), trim(p_description),
    coalesce(nullif(trim(p_type), ''), 'RP'),
    nullif(trim(p_connect_info), ''),
    nullif(trim(p_discord_url), ''),
    nullif(trim(p_language), ''),
    coalesce(p_tags, '{}'),
    true,
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet, v_icon
  )
  returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.create_fivem_server(text, text, text, text, text, text, text[], text, text, text) to anon;

-- 管理者一覧に icon を含める
drop function if exists public.admin_list_fivem_servers(text);
create or replace function public.admin_list_fivem_servers(p_token text)
returns table (
  id uuid, name text, description text, type text, connect_info text, discord_url text,
  language text, tags text[], icon text, ip text, ua text, anon_id text, ip_subnet text, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select s.id, s.name, s.description, s.type, s.connect_info, s.discord_url,
         s.language, s.tags, s.icon, s.ip, s.ua, s.anon_id, s.ip_subnet, s.created_at
  from fivem_servers s order by s.created_at desc limit 200;
end; $$;
grant execute on function public.admin_list_fivem_servers(text) to anon;

select pg_notify('pgrst', 'reload schema');
