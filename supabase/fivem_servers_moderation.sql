-- ============================================================================
--  FiveM サーバー募集板：NGワード ＋ IP連投制限 ＋ 投稿者IP保存
--  Supabase → SQL Editor に貼って Run。
--  前提：fivem_servers.sql / board_moderation.sql（banned_words）実行済み。
--
--  掲示板と同方式：
--   - 直接 insert（anon）を禁止し、SECURITY DEFINER の create_fivem_server 経由のみに。
--   - 関数内で入力検証・NGワード・同一IPの連投制限・IP保存・即時掲載(approved=true)を行う。
-- ============================================================================

-- 投稿者IP列（非公開。匿名・認証ユーザーからは読めない＝管理用ログ）
alter table public.fivem_servers add column if not exists ip text;
revoke select (ip) on public.fivem_servers from anon;
revoke select (ip) on public.fivem_servers from authenticated;

-- 直接 insert を無効化（= 必ず関数を通す）
drop policy if exists "anyone can submit" on public.fivem_servers;
drop policy if exists "anon can submit unapproved" on public.fivem_servers;

-- 掲載（誰でも・即時掲載）。NGワード＋同一IPの連投制限（60秒に1回）つき。
create or replace function public.create_fivem_server(
  p_name text,
  p_description text,
  p_type text,
  p_connect_info text,
  p_discord_url text,
  p_language text,
  p_tags text[]
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_ip text;
  v_haystack text;
begin
  if char_length(coalesce(trim(p_name), '')) = 0 or char_length(p_name) > 60 then
    raise exception 'invalid name';
  end if;
  if char_length(coalesce(trim(p_description), '')) = 0 or char_length(p_description) > 500 then
    raise exception 'invalid description';
  end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 禁止ワード（名前・説明・タグを部分一致・大小無視で検査）
  v_haystack := lower(coalesce(p_name, '') || ' ' || coalesce(p_description, '') || ' '
                      || coalesce(array_to_string(p_tags, ' '), ''));
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then
    raise exception 'banned word';
  end if;

  -- 連投制限：同一IPからの掲載は60秒に1回
  if v_ip is not null and exists (
    select 1 from fivem_servers where ip = v_ip and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'rate limited';
  end if;

  insert into fivem_servers (name, description, type, connect_info, discord_url, language, tags, approved, ip)
  values (
    trim(p_name), trim(p_description),
    coalesce(nullif(trim(p_type), ''), 'RP'),
    nullif(trim(p_connect_info), ''),
    nullif(trim(p_discord_url), ''),
    nullif(trim(p_language), ''),
    coalesce(p_tags, '{}'),
    true,
    v_ip
  )
  returning id into v_id;
  return v_id;
end; $$;

grant execute on function public.create_fivem_server(text, text, text, text, text, text, text[]) to anon;
