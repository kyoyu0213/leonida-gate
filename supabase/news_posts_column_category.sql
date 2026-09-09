-- ============================================================================
--  ニュースカテゴリに「コラム(column)」を追加するマイグレーション
--  Supabase → SQL Editor に貼って Run。
--  前提：news_posts.sql / news_posts_topic_category.sql / news_posts_gtarp_category.sql 適用済み。
--
--  既存DBでは news_posts の create table が再実行されないため、
--  CHECK制約の貼り替えと、作成／更新RPCのカテゴリ判定の更新をここで行う。
--  （news_posts_gtarp_category.sql で 'gtarp' を足したときと同じ手順）
--
--  ※ 'column' は SQL の予約語だが、ここでは列名ではなく category の値（文字列リテラル）
--     としてしか出てこないため、識別子のクォートは不要。
--
--  ※ 権限について
--     admin_create_news / admin_update_news は create or replace で
--     シグネチャを変えずに置き換えるため、既存の
--       grant execute on function ... to anon;（news_posts.sql）
--     はそのまま維持される。ここで grant を貼り直す必要はない。
--
--  ※ コード側（client/src/data/news.ts の NewsCategory・CATEGORY_CONFIG・
--     CATEGORIES、client/src/pages/AdminNews.tsx の CATS）にも 'column' を
--     追加済み。DBとコードのどちらか片方だけだと、管理画面からコラムを
--     選んだ投稿が 'invalid category' で弾かれるので必ず両方を適用すること。
-- ============================================================================

-- 1) category の CHECK 制約を 'column' を含む集合に貼り替える
alter table public.news_posts
  drop constraint if exists news_posts_category_check;
alter table public.news_posts
  add constraint news_posts_category_check
  check (category in ('release', 'topic', 'update', 'speculation', 'event', 'gtarp', 'column'));

-- 2) 作成RPC：カテゴリ判定に 'column' を許可
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
  if p_category not in ('release', 'topic', 'update', 'speculation', 'event', 'gtarp', 'column') then
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

-- 3) 更新RPC：カテゴリ判定に 'column' を許可
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
  if p_category not in ('release', 'topic', 'update', 'speculation', 'event', 'gtarp', 'column') then
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

select pg_notify('pgrst', 'reload schema');
