-- ============================================================================
--  記事コメントにも投稿メタ（UA / 匿名ID / IPハッシュ / サブネット）を保存し、
--  自動ブロックを適用する。
--  前提：news_comments.sql / board_moderation_meta.sql / board_blocks.sql 実行済み
--        （_req_meta / _is_blocked を利用）。
-- ============================================================================

alter table public.news_comments add column if not exists ua text;
alter table public.news_comments add column if not exists anon_id text;
alter table public.news_comments add column if not exists ip_hash text;
alter table public.news_comments add column if not exists ip_subnet text;

revoke select (ua, anon_id, ip_hash, ip_subnet) on public.news_comments from anon;
revoke select (ua, anon_id, ip_hash, ip_subnet) on public.news_comments from authenticated;
create index if not exists news_comments_anon_idx on public.news_comments (anon_id);

-- コメント投稿（メタ保存＋ブロック＋NGワード＋連投制限）。匿名IDを受け取る。
drop function if exists public.create_news_comment(text, text, text);
create or replace function public.create_news_comment(
  p_article_id text, p_name text, p_body text, p_anon_id text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; m record;
begin
  if char_length(coalesce(trim(p_article_id), '')) = 0 or char_length(p_article_id) > 40 then raise exception 'invalid article'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 1000 then raise exception 'invalid body'; end if;

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

  insert into news_comments (article_id, name, body, ip, ua, anon_id, ip_hash, ip_subnet)
  values (trim(p_article_id), coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body),
          m.ip, m.ua, nullif(btrim(p_anon_id), ''), m.ip_hash, m.ip_subnet)
  returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.create_news_comment(text, text, text, text) to anon;

-- 管理：記事コメント一覧（メタ込み）
drop function if exists public.admin_list_news_comments(text);
create or replace function public.admin_list_news_comments(p_token text)
returns table (
  id uuid, article_id text, name text, body text,
  ip text, ua text, anon_id text, ip_subnet text, hidden boolean, created_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select c.id, c.article_id, c.name, c.body, c.ip, c.ua, c.anon_id, c.ip_subnet, c.hidden, c.created_at
  from news_comments c order by c.created_at desc limit 200;
end; $$;
grant execute on function public.admin_list_news_comments(text) to anon;

select pg_notify('pgrst', 'reload schema');
