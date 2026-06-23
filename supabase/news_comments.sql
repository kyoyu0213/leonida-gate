-- ============================================================================
--  ニュース記事へのコメント
--  Supabase → SQL Editor に貼って Run。
--  前提：admin_auth.sql / board_moderation.sql（banned_words）実行済み。
--  記事は静的（client/src/data/news.ts）。article_id にはその記事 id を文字列で保存する。
--
--  - 投稿はログイン不要（anon が create_news_comment を呼べる）。NGワード＋IP連投制限あり。
--  - 公開クエリは hidden=false のみ表示（板と同じ「あぼーん」方式）。IP は非公開。
--  - 非表示／削除は管理者トークン（admin_auth.sql）で認可。
-- ============================================================================

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  name text not null default '名無しさん',
  body text not null,
  ip text,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.news_comments enable row level security;
create index if not exists news_comments_article_idx
  on public.news_comments (article_id, created_at desc);

-- 読み取りは「非表示でない」コメントのみ。IP 列は匿名から読めない。
revoke select (ip) on public.news_comments from anon;
revoke select (ip) on public.news_comments from authenticated;
drop policy if exists "read news comments" on public.news_comments;
create policy "read news comments" on public.news_comments
  for select to anon using (hidden = false);

-- コメント投稿（ログイン不要）。NGワード＋同一IP 8秒の連投制限。
create or replace function public.create_news_comment(p_article_id text, p_name text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_ip text;
begin
  if char_length(coalesce(trim(p_article_id), '')) = 0 or char_length(p_article_id) > 40 then
    raise exception 'invalid article';
  end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 1000 then
    raise exception 'invalid body';
  end if;

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 禁止ワード（本文・名前）
  if exists (
    select 1 from banned_words bw
    where bw.word <> ''
      and ( position(lower(bw.word) in lower(p_body)) > 0
         or position(lower(bw.word) in lower(coalesce(p_name, ''))) > 0 )
  ) then
    raise exception 'banned word';
  end if;

  -- 連投制限：同一IPからのコメントは8秒に1回
  if v_ip is not null and exists (
    select 1 from news_comments where ip = v_ip and created_at > now() - interval '8 seconds'
  ) then
    raise exception 'rate limited';
  end if;

  insert into news_comments (article_id, name, body, ip)
  values (trim(p_article_id), coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body), v_ip)
  returning id into v_id;
  return v_id;
end; $$;

grant execute on function public.create_news_comment(text, text, text) to anon;

-- 管理者：コメントの非表示／再表示・削除（admin_auth.sql のトークン認可）
create or replace function public.admin_set_news_comment_hidden(p_token text, p_comment_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  update news_comments set hidden = p_hidden where id = p_comment_id;
end; $$;

create or replace function public.admin_delete_news_comment(p_token text, p_comment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from news_comments where id = p_comment_id;
end; $$;

grant execute on function public.admin_set_news_comment_hidden(text, uuid, boolean) to anon;
grant execute on function public.admin_delete_news_comment(text, uuid) to anon;
