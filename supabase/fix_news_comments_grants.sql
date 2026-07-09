-- ============================================================================
--  news_comments：匿名メタ列の露出を塞ぐ（列grant方式・ケースA）
--  ------------------------------------------------------------------------
--  フロントの読み取りは明示列（メタ非含有）：
--    FULL_COLS = id,article_id,name,body,created_at,parent_id,good,bad
--    BASIC_COLS = id,article_id,name,body,created_at
--  非公開メタ ip/ua/anon_id/ip_hash/ip_subnet は grant しない。
--  parent_id/good/bad は news_comments_votes_replies.sql 適用後のみ存在するため、
--  存在する場合だけ動的に grant する（未適用環境でもエラーにならない）。
-- ============================================================================

revoke select on public.news_comments from anon, authenticated;

-- 常に存在する基本列
grant select (id, article_id, name, body, created_at) on public.news_comments to anon, authenticated;

-- 任意列（存在する場合だけ grant）
do $$
declare col text;
begin
  foreach col in array array['parent_id','good','bad'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='news_comments' and column_name=col
    ) then
      execute format('grant select (%I) on public.news_comments to anon, authenticated', col);
    end if;
  end loop;
end $$;

select pg_notify('pgrst', 'reload schema');
