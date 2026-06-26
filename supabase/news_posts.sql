-- ============================================================================
--  管理画面から投稿するニュース記事（DB管理）
--  Supabase → SQL Editor に貼って Run。前提：admin_auth.sql 適用済み（_admin_check / admin_login）。
--
--  方針：
--   - 公開記事(published=true)は anon が直接 select 可（RLS）。一覧・詳細はこれで取得。
--   - 作成／更新／削除／全件取得（非公開含む）は管理者トークン必須の RPC 経由のみ。
--   - アイキャッチ画像は board-images バケットに既存の uploadRawImages('news', ...) で保存し、
--     その公開URL(eyecatch_url)を保持する（このSQLでは画像は扱わない）。
--   - published_at は静的記事と同じ "YYYY-MM-DD HH:MM" のテキストで保持（タイムゾーン変換を避け、
--     入力した時刻をそのまま表示・並べ替えに使う）。既定は日本時間の現在時刻。
-- ============================================================================

create table if not exists public.news_posts (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  body text not null,
  category text not null default 'speculation'
    check (category in ('release', 'update', 'speculation', 'event')),
  icon text not null default '📰',
  eyecatch_url text,
  published boolean not null default true,
  published_at text not null
    default to_char((now() at time zone 'Asia/Tokyo'), 'YYYY-MM-DD HH24:MI'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.news_posts enable row level security;
create index if not exists news_posts_pub_idx
  on public.news_posts (published, published_at desc);

-- 公開記事は誰でも読める（非公開は読めない）。書き込みポリシーは作らない＝RPC経由のみ。
drop policy if exists news_posts_read on public.news_posts;
create policy news_posts_read on public.news_posts
  for select to anon using (published = true);

-- ----------------------------------------------------------------------------
-- 作成（管理者）。新しい記事IDを返す。
-- ----------------------------------------------------------------------------
create or replace function public.admin_create_news(
  p_token text,
  p_title text,
  p_description text,
  p_body text,
  p_category text,
  p_icon text,
  p_eyecatch_url text,
  p_published_at text,
  p_published boolean
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  perform _admin_check(p_token);
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_body), '') = '' then
    raise exception 'title and body required';
  end if;
  if p_category not in ('release', 'update', 'speculation', 'event') then
    raise exception 'invalid category';
  end if;
  insert into news_posts (title, description, body, category, icon, eyecatch_url, published_at, published)
  values (
    btrim(p_title),
    coalesce(p_description, ''),
    p_body,
    p_category,
    coalesce(nullif(btrim(p_icon), ''), '📰'),
    nullif(btrim(p_eyecatch_url), ''),
    coalesce(nullif(btrim(p_published_at), ''), to_char((now() at time zone 'Asia/Tokyo'), 'YYYY-MM-DD HH24:MI')),
    coalesce(p_published, true)
  )
  returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.admin_create_news(text, text, text, text, text, text, text, text, boolean) to anon;

-- ----------------------------------------------------------------------------
-- 更新（管理者）。
-- ----------------------------------------------------------------------------
create or replace function public.admin_update_news(
  p_token text,
  p_id bigint,
  p_title text,
  p_description text,
  p_body text,
  p_category text,
  p_icon text,
  p_eyecatch_url text,
  p_published_at text,
  p_published boolean
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_body), '') = '' then
    raise exception 'title and body required';
  end if;
  if p_category not in ('release', 'update', 'speculation', 'event') then
    raise exception 'invalid category';
  end if;
  update news_posts set
    title = btrim(p_title),
    description = coalesce(p_description, ''),
    body = p_body,
    category = p_category,
    icon = coalesce(nullif(btrim(p_icon), ''), '📰'),
    eyecatch_url = nullif(btrim(p_eyecatch_url), ''),
    published_at = coalesce(nullif(btrim(p_published_at), ''), published_at),
    published = coalesce(p_published, true),
    updated_at = now()
  where id = p_id;
end; $$;
grant execute on function public.admin_update_news(text, bigint, text, text, text, text, text, text, text, boolean) to anon;

-- ----------------------------------------------------------------------------
-- 削除（管理者）。
-- ----------------------------------------------------------------------------
create or replace function public.admin_delete_news(p_token text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from news_posts where id = p_id;
end; $$;
grant execute on function public.admin_delete_news(text, bigint) to anon;

-- ----------------------------------------------------------------------------
-- 管理一覧（非公開を含む全件・管理者のみ）。
-- ----------------------------------------------------------------------------
create or replace function public.admin_list_news(p_token text)
returns setof news_posts language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query select * from news_posts order by published_at desc;
end; $$;
grant execute on function public.admin_list_news(text) to anon;

select pg_notify('pgrst', 'reload schema');
