-- ============================================================================
--  fivem_servers：匿名メタ列の露出を塞ぐ（列grant方式・ケースA'）
--  ------------------------------------------------------------------------
--  ★実行順の厳守★ このSQLは「servers.ts を明示列化したビルドを本番デプロイし、
--    サーバー一覧が正常表示されることを確認した後」に Run すること。
--    先にこのSQLを当てると、デプロイ済みの select('*') が権限エラーで壊れる。
--  ------------------------------------------------------------------------
--  背景：列単位 REVOKE はテーブル全体 SELECT 付与を上書きできない。テーブル全体の
--        SELECT を剥がし、公開列だけを列単位で GRANT し直す（friends/crews と同方式）。
--        非公開メタ ip/ua/anon_id/ip_hash/ip_subnet は grant しない。
-- ============================================================================

revoke select on public.fivem_servers from anon, authenticated;

grant select (
  id, name, description, type, connect_info, discord_url, language, tags, approved, created_at, icon
) on public.fivem_servers to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
