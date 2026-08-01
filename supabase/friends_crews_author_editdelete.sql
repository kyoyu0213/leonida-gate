-- ============================================================================
--  フレンド募集 / クルー募集：投稿者名(B) ＋ 本人の編集・削除(C)
--  Supabase → SQL Editor に貼って Run（1回でOK）。friends.sql / crews.sql 適用済み前提。
--
--  内容:
--   1. friends / crews に author_name（投稿者名）と delete_key_hash（削除キーのハッシュ）を追加
--   2. create_friend / create_crew を再作成（末尾に p_author_name / p_delete_key を追加。
--      どちらも default null なので、旧フロントからの呼び出し（名前つき引数）も壊れない）
--   3. delete_own_* / update_own_*（本人＝削除キー一致 or 同一ブラウザ anon_id 一致 で操作可）
--      - 返信が付いている募集は完全削除せず status='closed'（募集終了）にして一覧から外すだけ
--        （返信・通報・投票を巻き添えで消さないため）。返信ゼロなら完全削除。
--   4. 公開ステータスに 'closed' を許可（詳細ページで「募集終了」を表示するため。一覧は
--      従来どおり status='published' のみ取得するのでクローズドは出ない）
--
--  安全のためトランザクションで実行（途中失敗なら全ロールバック）。
-- ============================================================================
begin;

-- 削除キーのハッシュ化に使う（Supabase では extensions スキーマに導入）
create extension if not exists pgcrypto with schema extensions;

-- ===========================================================================
-- FRIENDS
-- ===========================================================================
alter table public.friends add column if not exists author_name    text;
alter table public.friends add column if not exists delete_key_hash text;

-- author_name は公開列（表示用）。delete_key_hash は絶対に公開しない（GRANT しない）。
grant select (author_name) on public.friends to anon, authenticated;

-- 詳細ページで「募集終了」を見せるため、closed も anon が読めるようにする
-- （一覧は listPublishedFriends が status='published' で絞るので closed は出ない）。
drop policy if exists "anyone can read published friends" on public.friends;
create policy "anyone can read published friends"
  on public.friends for select to anon
  using (status in ('published', 'closed'));

-- ---- create_friend 再作成（末尾に author_name / delete_key を追加） ----
drop function if exists public.create_friend(text, text, text, text, text, text, text, text, text, text);
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
  p_delete_key text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_thread_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_author text := nullif(btrim(p_author_name), '');
  v_key text := nullif(btrim(p_delete_key), '');
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

  -- 通報用オープニング投稿(post #1)：名前は投稿者名（無ければ名無しさん）
  insert into board_posts
    (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
  values
    (v_thread_id, 1, coalesce(v_author, '名無しさん'), trim(p_body), m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);

  insert into friends
    (title, platform, play_style, voice_chat, active_time, age_range, body, contact,
     author_name, delete_key_hash, thread_id, status, ip, ua, anon_id, ip_hash, ip_subnet)
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
    case when v_key is not null then crypt(v_key, gen_salt('bf')) else null end,
    v_thread_id, 'published',
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet
  )
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function
  public.create_friend(text, text, text, text, text, text, text, text, text, text, text, text) to anon;

-- ---- 本人判定つき削除 ----
-- 削除キーが設定されていればキー一致、無ければ同一ブラウザ(anon_id)一致で許可。
-- 返信あり(post_count>1)は status='closed'（募集終了）。返信なしは完全削除。
create or replace function public.delete_own_friend(
  p_id uuid,
  p_delete_key text default null,
  p_anon_id text default null
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_key  text := nullif(btrim(p_delete_key), '');
  v_ok boolean := false;
  v_count int;
begin
  select * into r from friends where id = p_id;
  if not found or r.status = 'hidden' then raise exception 'not found'; end if;

  if r.delete_key_hash is not null then
    if v_key is not null and r.delete_key_hash = crypt(v_key, r.delete_key_hash) then
      v_ok := true;
    end if;
  end if;
  if not v_ok and r.anon_id is not null and v_anon is not null and r.anon_id = v_anon then
    v_ok := true;
  end if;
  if not v_ok then raise exception 'auth failed'; end if;

  select post_count into v_count from board_threads where id = r.thread_id;
  if coalesce(v_count, 1) > 1 then
    update friends set status = 'closed' where id = p_id;
    return 'closed';
  else
    if r.thread_id is not null then
      delete from board_threads where id = r.thread_id;  -- CASCADE: posts/reports/votes
    end if;
    delete from friends where id = p_id;
    return 'deleted';
  end if;
end; $$;
grant execute on function public.delete_own_friend(uuid, text, text) to anon;

-- ---- 本人判定つき編集 ----
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
  p_anon_id text default null
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_key  text := nullif(btrim(p_delete_key), '');
  v_author text := nullif(btrim(p_author_name), '');
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
    author_name = v_author
  where id = p_id;

  -- 通報用の複製(post #1)も同期（本文・名前）
  update board_posts set body = trim(p_body), name = coalesce(v_author, '名無しさん')
   where thread_id = r.thread_id and post_number = 1;
end; $$;
grant execute on function
  public.update_own_friend(uuid, text, text, text, text, text, text, text, text, text, text, text) to anon;


-- ===========================================================================
-- CREWS（friends と同型）
-- ===========================================================================
alter table public.crews add column if not exists author_name    text;
alter table public.crews add column if not exists delete_key_hash text;

grant select (author_name) on public.crews to anon, authenticated;

drop policy if exists "anyone can read published crews" on public.crews;
create policy "anyone can read published crews"
  on public.crews for select to anon
  using (status in ('published', 'closed'));

drop function if exists public.create_crew(text, text, text, text, text, text, text, text, text, text, text);
create or replace function public.create_crew(
  p_crew_name text,
  p_title text,
  p_platform text,
  p_genre text,
  p_size text,
  p_requirements text,
  p_active_time text,
  p_body text,
  p_contact text,
  p_anon_id text default null,
  p_hp text default null,
  p_author_name text default null,
  p_delete_key text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_thread_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_author text := nullif(btrim(p_author_name), '');
  v_key text := nullif(btrim(p_delete_key), '');
  v_haystack text;
begin
  if coalesce(btrim(p_hp), '') <> '' then return null; end if;

  if char_length(coalesce(trim(p_crew_name), '')) = 0 or char_length(p_crew_name) > 80 then raise exception 'invalid crew_name'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 80 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;
  if v_author is not null and char_length(v_author) > 40 then raise exception 'invalid author_name'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  v_haystack := lower(
    coalesce(p_crew_name, '')  || ' ' || coalesce(p_title, '')       || ' ' ||
    coalesce(p_body, '')       || ' ' || coalesce(p_platform, '')    || ' ' ||
    coalesce(p_genre, '')      || ' ' || coalesce(p_size, '')        || ' ' ||
    coalesce(p_requirements,'')|| ' ' || coalesce(p_active_time, '') || ' ' ||
    coalesce(p_contact, '')    || ' ' || coalesce(v_author, '')
  );
  if exists (select 1 from banned_words bw where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0)
    then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from crews where ip = m.ip and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from crews where anon_id = v_anon and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into board_threads (board, title, post_count)
    values ('crews', trim(p_title), 1)
    returning id into v_thread_id;

  insert into board_posts
    (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
  values
    (v_thread_id, 1, coalesce(v_author, '名無しさん'), trim(p_body), m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);

  insert into crews
    (crew_name, title, platform, genre, size, requirements, active_time, body, contact,
     author_name, delete_key_hash, thread_id, status, ip, ua, anon_id, ip_hash, ip_subnet)
  values (
    trim(p_crew_name),
    trim(p_title),
    nullif(trim(p_platform), ''),
    nullif(trim(p_genre), ''),
    nullif(trim(p_size), ''),
    nullif(trim(p_requirements), ''),
    nullif(trim(p_active_time), ''),
    trim(p_body),
    nullif(trim(p_contact), ''),
    v_author,
    case when v_key is not null then crypt(v_key, gen_salt('bf')) else null end,
    v_thread_id, 'published',
    m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet
  )
  returning id into v_id;

  return v_id;
end; $$;
grant execute on function
  public.create_crew(text, text, text, text, text, text, text, text, text, text, text, text, text) to anon;

create or replace function public.delete_own_crew(
  p_id uuid,
  p_delete_key text default null,
  p_anon_id text default null
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_key  text := nullif(btrim(p_delete_key), '');
  v_ok boolean := false;
  v_count int;
begin
  select * into r from crews where id = p_id;
  if not found or r.status = 'hidden' then raise exception 'not found'; end if;

  if r.delete_key_hash is not null then
    if v_key is not null and r.delete_key_hash = crypt(v_key, r.delete_key_hash) then v_ok := true; end if;
  end if;
  if not v_ok and r.anon_id is not null and v_anon is not null and r.anon_id = v_anon then v_ok := true; end if;
  if not v_ok then raise exception 'auth failed'; end if;

  select post_count into v_count from board_threads where id = r.thread_id;
  if coalesce(v_count, 1) > 1 then
    update crews set status = 'closed' where id = p_id;
    return 'closed';
  else
    if r.thread_id is not null then
      delete from board_threads where id = r.thread_id;
    end if;
    delete from crews where id = p_id;
    return 'deleted';
  end if;
end; $$;
grant execute on function public.delete_own_crew(uuid, text, text) to anon;

create or replace function public.update_own_crew(
  p_id uuid,
  p_crew_name text,
  p_title text,
  p_platform text,
  p_genre text,
  p_size text,
  p_requirements text,
  p_active_time text,
  p_body text,
  p_contact text,
  p_author_name text default null,
  p_delete_key text default null,
  p_anon_id text default null
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_key  text := nullif(btrim(p_delete_key), '');
  v_author text := nullif(btrim(p_author_name), '');
  v_ok boolean := false;
  v_haystack text;
begin
  select * into r from crews where id = p_id;
  if not found or r.status = 'hidden' then raise exception 'not found'; end if;

  if r.delete_key_hash is not null then
    if v_key is not null and r.delete_key_hash = crypt(v_key, r.delete_key_hash) then v_ok := true; end if;
  end if;
  if not v_ok and r.anon_id is not null and v_anon is not null and r.anon_id = v_anon then v_ok := true; end if;
  if not v_ok then raise exception 'auth failed'; end if;

  if char_length(coalesce(trim(p_crew_name), '')) = 0 or char_length(p_crew_name) > 80 then raise exception 'invalid crew_name'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 80 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;
  if v_author is not null and char_length(v_author) > 40 then raise exception 'invalid author_name'; end if;

  v_haystack := lower(
    coalesce(p_crew_name,'')||' '||coalesce(p_title,'')||' '||coalesce(p_body,'')||' '||coalesce(p_platform,'')||' '||
    coalesce(p_genre,'')||' '||coalesce(p_size,'')||' '||coalesce(p_requirements,'')||' '||
    coalesce(p_active_time,'')||' '||coalesce(p_contact,'')||' '||coalesce(v_author,'')
  );
  if exists (select 1 from banned_words bw where bw.word <> '' and position(lower(bw.word) in v_haystack) > 0)
    then raise exception 'banned word'; end if;

  update crews set
    crew_name = trim(p_crew_name),
    title = trim(p_title),
    platform = nullif(trim(p_platform), ''),
    genre = nullif(trim(p_genre), ''),
    size = nullif(trim(p_size), ''),
    requirements = nullif(trim(p_requirements), ''),
    active_time = nullif(trim(p_active_time), ''),
    body = trim(p_body),
    contact = nullif(trim(p_contact), ''),
    author_name = v_author
  where id = p_id;

  update board_posts set body = trim(p_body), name = coalesce(v_author, '名無しさん')
   where thread_id = r.thread_id and post_number = 1;
end; $$;
grant execute on function
  public.update_own_crew(uuid, text, text, text, text, text, text, text, text, text, text, text, text) to anon;

commit;

select pg_notify('pgrst', 'reload schema');
