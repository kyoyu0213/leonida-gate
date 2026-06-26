-- ============================================================================
--  記事コメントに「グッド/バッド」と「返信（1階層）」を追加
--  Supabase → SQL Editor に貼って Run。
--  前提：news_comments.sql / news_comments_meta.sql 実行済み。
--
--  - news_comments に good / bad のカウント列と parent_id（返信先）を追加。
--  - news_comment_votes に「誰がどちらに投票したか」を保持（1人1票・切替/取消可）。
--  - 返信は1階層のみ（返信への返信はトップのコメントに正規化）。
-- ============================================================================

-- 1) カウント列と親コメント参照
alter table public.news_comments add column if not exists good int not null default 0;
alter table public.news_comments add column if not exists bad  int not null default 0;
alter table public.news_comments add column if not exists parent_id uuid
  references public.news_comments(id) on delete cascade;
create index if not exists news_comments_parent_idx on public.news_comments (parent_id);

-- 2) 投票テーブル（1人1票）。anon は直接読み書きせず vote_news_comment RPC 経由。
create table if not exists public.news_comment_votes (
  comment_id uuid not null references public.news_comments(id) on delete cascade,
  voter text not null,
  kind text not null check (kind in ('good', 'bad')),
  created_at timestamptz not null default now(),
  primary key (comment_id, voter)
);
alter table public.news_comment_votes enable row level security;

-- 3) 投票（誰でも・1人1票）。同じボタンで取消、反対側で切替。新しい集計を返す。
create or replace function public.vote_news_comment(p_comment_id uuid, p_kind text, p_anon_id text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_voter text := nullif(btrim(p_anon_id), '');
  v_existing text;
  v_my text;
  v_good int;
  v_bad int;
begin
  if p_kind not in ('good', 'bad') then raise exception 'invalid kind'; end if;

  -- 識別子：匿名Cookie優先、無ければ x-forwarded-for の先頭IP。
  if v_voter is null then
    v_voter := nullif(btrim(split_part(
      coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
      ',', 1)), '');
  end if;
  if v_voter is null then raise exception 'no voter'; end if;

  if not exists (select 1 from news_comments where id = p_comment_id and hidden = false) then
    raise exception 'comment not found';
  end if;

  select kind into v_existing from news_comment_votes where comment_id = p_comment_id and voter = v_voter;

  if v_existing is null then
    insert into news_comment_votes (comment_id, voter, kind) values (p_comment_id, v_voter, p_kind);
    if p_kind = 'good' then
      update news_comments set good = good + 1 where id = p_comment_id;
    else
      update news_comments set bad = bad + 1 where id = p_comment_id;
    end if;
    v_my := p_kind;
  elsif v_existing = p_kind then
    delete from news_comment_votes where comment_id = p_comment_id and voter = v_voter;
    if p_kind = 'good' then
      update news_comments set good = greatest(good - 1, 0) where id = p_comment_id;
    else
      update news_comments set bad = greatest(bad - 1, 0) where id = p_comment_id;
    end if;
    v_my := null;
  else
    update news_comment_votes set kind = p_kind, created_at = now()
      where comment_id = p_comment_id and voter = v_voter;
    if p_kind = 'good' then
      update news_comments set good = good + 1, bad = greatest(bad - 1, 0) where id = p_comment_id;
    else
      update news_comments set bad = bad + 1, good = greatest(good - 1, 0) where id = p_comment_id;
    end if;
    v_my := p_kind;
  end if;

  select good, bad into v_good, v_bad from news_comments where id = p_comment_id;
  return json_build_object('good', v_good, 'bad', v_bad, 'my', v_my);
end; $$;
grant execute on function public.vote_news_comment(uuid, text, text) to anon;

-- 4) コメント投稿に返信（p_parent_id）を追加。1階層のみ・同一記事のみ。
--    旧4引数版を置き換える（トップレベル投稿は p_parent_id 省略でこの版に解決される）。
drop function if exists public.create_news_comment(text, text, text, text);
create or replace function public.create_news_comment(
  p_article_id text, p_name text, p_body text, p_anon_id text default null, p_parent_id uuid default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; m record; v_parent uuid; v_pa text;
begin
  if char_length(coalesce(trim(p_article_id), '')) = 0 or char_length(p_article_id) > 40 then raise exception 'invalid article'; end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 1000 then raise exception 'invalid body'; end if;

  -- 返信先の検証：同じ記事の表示中コメントであること。返信への返信はトップに正規化（1階層）。
  v_parent := null;
  if p_parent_id is not null then
    select coalesce(parent_id, id), article_id into v_parent, v_pa
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
