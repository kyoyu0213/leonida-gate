-- ============================================================================
--  フレンド募集：性別（gender）を追加
--  Supabase → SQL Editor に貼って Run（1回でOK）。
--  friends.sql / friends_crews_author_editdelete.sql 適用済み前提。
--
--  内容:
--   1. friends に gender 列（'male' | 'female' | 'other' | null）を追加し、公開列にする
--   2. create_friend / update_own_friend を再作成（末尾に p_gender を default null で追加。
--      既存の名前つき呼び出し（gender 無し）も default で通るので、旧フロントも壊れない）
--   3. gender は許可値以外を弾く（任意項目・未指定は null）
--
--  追加型の変更なので、既存の募集・返信・投票は一切影響を受けません。
--  安全のためトランザクションで実行（途中失敗なら全ロールバック）。
-- ============================================================================
begin;

-- 1) 列追加（公開列。表示用に anon/authenticated が読めるようにする）
alter table public.friends add column if not exists gender text;
grant select (gender) on public.friends to anon, authenticated;

-- 2) create_friend 再作成（末尾に p_gender を追加）
drop function if exists public.create_friend(text, text, text, text, text, text, text, text, text, text, text, text);
create or replace function public.create_friend(
  p_title text,
  p_platform text,
  p_play_style text,
  p_voice_chat text,
  p_active_time text,
  p_age_range text,
  p_body text,
  p_contact text,
  p_anon_id text default null,
  p_hp text default null,
  p_author_name text default null,
  p_delete_key text default null,
  p_gender text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_thread_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_author text := nullif(btrim(p_author_name), '');
  v_key text := nullif(btrim(p_delete_key), '');
  v_gender text := nullif(btrim(p_gender), '');
  v_haystack text;
begin
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then
    raise exception 'invalid body';
  end if;
  if v_author is not null and char_length(v_author) > 40 then
    raise exception 'invalid author_name';
  end if;
  -- 性別は固定の選択肢のみ許可（任意・未指定は null）
  if v_gender is not null and v_gender not in ('male', 'female', 'other') then
    raise exception 'invalid gender';
  end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  v_haystack := lower(
    coalesce(p_title, '')       || ' ' || coalesce(p_body, '')       || ' ' ||
    coalesce(p_platform, '')    || ' ' || coalesce(p_play_style, '') || ' ' ||
    coalesce(p_voice_chat, '')  || ' ' || coalesce(p_active_time, '')|| ' ' ||
    coalesce(p_age_range, '')   || ' ' || coalesce(p_contact, '')    || ' ' ||
    coalesce(v_author, '')
  );
  if exists (
    select 1 from banned_words bw
    where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from friends where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from friends where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into board_threads (board, title, post_count)
    values ('friends', trim(p_title), 1)
    returning id into v_thread_id;

  insert into board_posts
    (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
  values
    (v_thread_id, 1, coalesce(v_author, '名無しさん'), trim(p_body), m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);

  insert into friends
    (title, platform, play_style, voice_chat, active_time, age_range, body, contact,
     author_name, gender, delete_key_hash, thread_id, status, ip, ua, anon_id, ip_hash, ip_subnet)
  values (
    trim(p_title),
    nullif(trim(p_platform), ''),
    nullif(trim(p_play_style), ''),
    nullif(trim(p_voice_chat), ''),
    nullif(trim(p_active_time), ''),
    nullif(trim(p_age_range), ''),
    trim(p_body),
    nullif(trim(p_contact), ''),
    v_author,
    v_gender,
    case when v_key is not null then crypt(v_key, gen_salt('bf')) else null end,
    v_thread_id, 'published',
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet
  )
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function
  public.create_friend(text, text, text, text, text, text, text, text, text, text, text, text, text) to anon;

-- 3) update_own_friend 再作成（末尾に p_gender を追加）
create or replace function public.update_own_friend(
  p_id uuid,
  p_title text,
  p_platform text,
  p_play_style text,
  p_voice_chat text,
  p_active_time text,
  p_age_range text,
  p_body text,
  p_contact text,
  p_author_name text default null,
  p_delete_key text default null,
  p_anon_id text default null,
  p_gender text default null
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_key  text := nullif(btrim(p_delete_key), '');
  v_author text := nullif(btrim(p_author_name), '');
  v_gender text := nullif(btrim(p_gender), '');
  v_ok boolean := false;
  v_haystack text;
begin
  select * into r from friends where id = p_id;
  if not found or r.status = 'hidden' then raise exception 'not found'; end if;

  if r.delete_key_hash is not null then
    if v_key is not null and r.delete_key_hash = crypt(v_key, r.delete_key_hash) then v_ok := true; end if;
  end if;
  if not v_ok and r.anon_id is not null and v_anon is not null and r.anon_id = v_anon then v_ok := true; end if;
  if not v_ok then raise exception 'auth failed'; end if;

  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 80 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;
  if v_author is not null and char_length(v_author) > 40 then raise exception 'invalid author_name'; end if;
  if v_gender is not null and v_gender not in ('male', 'female', 'other') then raise exception 'invalid gender'; end if;

  v_haystack := lower(
    coalesce(p_title,'')||' '||coalesce(p_body,'')||' '||coalesce(p_platform,'')||' '||
    coalesce(p_play_style,'')||' '||coalesce(p_voice_chat,'')||' '||coalesce(p_active_time,'')||' '||
    coalesce(p_age_range,'')||' '||coalesce(p_contact,'')||' '||coalesce(v_author,'')
  );
  if exists (select 1 from banned_words bw where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0)
    then raise exception 'banned word'; end if;

  update friends set
    title = trim(p_title),
    platform = nullif(trim(p_platform), ''),
    play_style = nullif(trim(p_play_style), ''),
    voice_chat = nullif(trim(p_voice_chat), ''),
    active_time = nullif(trim(p_active_time), ''),
    age_range = nullif(trim(p_age_range), ''),
    body = trim(p_body),
    contact = nullif(trim(p_contact), ''),
    author_name = v_author,
    gender = v_gender
  where id = p_id;

  update board_posts set body = trim(p_body), name = coalesce(v_author, '名無しさん')
   where thread_id = r.thread_id and post_number = 1;
end; $$;
grant execute on function
  public.update_own_friend(uuid, text, text, text, text, text, text, text, text, text, text, text, text) to anon;

commit;

select pg_notify('pgrst', 'reload schema');
