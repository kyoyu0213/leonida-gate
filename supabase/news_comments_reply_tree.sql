-- ============================================================================
--  記事コメントの返信を「多階層（ツリー）」に拡張
--  Supabase → SQL Editor に貼って Run。
--  前提：news_comments_votes_replies.sql 実行済み。
--
--  これまで返信は1階層だった（返信への返信はトップのコメントに正規化）。
--  返信への返信＝レスバを可能にするため、parent_id に実際の返信先IDを保存する。
--  検証：返信先は同じ記事の表示中コメントであること（深さ無制限）。
--  ※レス番号（掲示板風の連番）はフロント側で投稿時刻順に振るためDB変更は不要。
-- ============================================================================

create or replace function public.create_news_comment(
  p_article_id text, p_name text, p_body text, p_anon_id text default null, p_parent_id uuid default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; m record; v_parent uuid; v_pa text;
begin
  if char_length(coalesce(trim(p_article_id), '')) = 0 or char_length(p_article_id) > 40 then raise exception 'invalid article'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 1000 then raise exception 'invalid body'; end if;

  -- 返信先の検証：同じ記事の表示中コメントであること。返信先IDをそのまま保存（多階層＝レスバ可）。
  v_parent := null;
  if p_parent_id is not null then
    select id, article_id into v_parent, v_pa
      from news_comments where id = p_parent_id and hidden = false;
    if v_parent is null or v_pa <> trim(p_article_id) then raise exception 'invalid parent'; end if;
  end if;

  select * into m from _req_meta();
  if _is_blocked(m.ip, m.ip_subnet, p_anon_id) then raise exception 'blocked'; end if;

  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then raise exception 'banned word'; end if;

  if m.ip is not null and exists (
    select 1 from news_comments where ip = m.ip and created_at > now() - interval '8 seconds'
  ) then raise exception 'rate limited'; end if;

  insert into news_comments (article_id, name, body, ip, ua, anon_id, ip_hash, ip_subnet, parent_id)
  values (trim(p_article_id), coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
          m.ip, m.ua, nullif(btrim(p_anon_id), ''), m.ip_hash, m.ip_subnet, v_parent)
  returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.create_news_comment(text, text, text, text, uuid) to anon;

select pg_notify('pgrst', 'reload schema');
