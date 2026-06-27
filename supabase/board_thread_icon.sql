-- ============================================================================
--  掲示板スレッドのアイコン（プリセット11枚から選択）
--  Supabase → SQL Editor に貼って Run。
--  前提：spam_measures.sql 適用済み（create_thread の最新版を上書きする）。
--
--  - board_threads に icon 列を追加（選んだプリセット画像のファイル名を保存）。
--  - create_thread に p_icon を追加。許可リスト(11枚)以外は無視して null 扱い
--    （anon が直接RPCを叩いて任意のパスを入れるのを防ぐ）。
--  - 画像実体は client/public/images/icon/ に置く（DBにはファイル名だけ保存）。
-- ============================================================================

alter table public.board_threads add column if not exists icon text;

-- 引数追加（p_icon）のため作り直す。
drop function if exists public.create_thread(text, text, text, text, text);
create or replace function public.create_thread(
  p_board text, p_title text, p_name text, p_body text,
  p_anon_id text default null, p_icon text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_thread_id uuid;
  m record;
  v_anon text := nullif(btrim(p_anon_id), '');
  v_icon text;
  v_allowed text[] := array[
    'Boobie_Ike_square.jpg', 'Brian_Heder_square.jpg', 'Cal_Hampton_square.jpg',
    'DreQuan_Priest_square.jpg', 'Jason_and_Lucia_01_square.jpg', 'Jason_and_Lucia_02_square.jpg',
    'Jason_and_Lucia_03_square.jpg', 'Jason_and_Lucia_Motel_square.jpg',
    'Official_Cover_Art_square.jpg', 'Raul_Bautista_square.jpg', 'Real_Dimez_square.jpg'
  ];
begin
  if char_length(coalesce(trim(p_board), '')) = 0 or char_length(p_board) > 40 then raise exception 'invalid board'; end if;
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then raise exception 'invalid title'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then raise exception 'invalid body'; end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, v_anon) then raise exception 'blocked'; end if;

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_title)) > 0
         or position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  -- 連投制限：同一IP / 同一Cookie からのスレ作成は60秒に1回
  if m.ip is not null and exists (
    select 1 from board_posts where ip = m.ip and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;
  if v_anon is not null and exists (
    select 1 from board_posts where anon_id = v_anon and post_number = 1 and created_at > now() - interval '60 seconds'
  ) then raise exception 'rate limited'; end if;

  -- 同一本文の連投（直近10分・同一IPまたはCookie）
  if exists (
    select 1 from board_posts
    where created_at > now() - interval '10 minutes'
      and body = trim(p_body)
      and ((m.ip is not null and ip = m.ip) or (v_anon is not null and anon_id = v_anon))
  ) then raise exception 'duplicate body'; end if;

  -- アイコンは許可リストのものだけ採用（それ以外は null）
  v_icon := case when p_icon = any(v_allowed) then p_icon else null end;

  insert into board_threads (board, title, icon) values (trim(p_board), trim(p_title), v_icon) returning id into v_thread_id;
  insert into board_posts (thread_id, post_number, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
    values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
            m.ip, m.ua, v_anon, m.ip_hash, m.ip_subnet);
  return v_thread_id;
end; $$;

grant execute on function public.create_thread(text, text, text, text, text, text) to anon;

select pg_notify('pgrst', 'reload schema');
