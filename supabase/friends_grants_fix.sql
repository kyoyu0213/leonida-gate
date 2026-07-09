-- ============================================================================
--  friends：匿名/認証ロールの列権限を修正（非公開メタ列の露出を塞ぐ）
--  Supabase → SQL Editor に貼って Run。friends.sql 適用済みが前提。
--
--  背景：PostgreSQL では「テーブル全体の SELECT 付与」がある場合、列単位の
--        REVOKE は無効（テーブル権限が優先されて全列読める）。Supabase は anon /
--        authenticated にテーブル全体 DML をデフォルト付与するため、friends.sql の
--        `revoke select (ip, …)` だけでは ip/ua/anon_id 等が匿名から読めてしまう。
--  対策：テーブル全体の SELECT を剥がし、公開列だけを列単位で GRANT し直す。
--        これで匿名は公開列のみ SELECT 可、非公開メタ列は権限拒否になる。
--  注意：この方式では `select *` は匿名で権限エラーになるため、フロントは
--        friends を「明示的な公開列指定」で SELECT すること（select('*') 不可）。
-- ============================================================================

-- テーブル全体の SELECT を剥がす（列単位 revoke を有効化するため）
revoke select on public.friends from anon, authenticated;

-- 公開列だけを許可（非公開メタ列 ip/ua/anon_id/ip_hash/ip_subnet は含めない）
grant select (
  id, title, platform, play_style, voice_chat, active_time, age_range,
  body, contact, thread_id, status, created_at
) on public.friends to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
