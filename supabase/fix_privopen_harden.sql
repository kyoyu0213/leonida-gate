-- ============================================================================
--  priv-open テーブルの権限を締める（防御強化・列grant不要）
--  ------------------------------------------------------------------------
--  対象：匿名SELECTポリシーが無く現状0行だが、テーブル全体SELECT権限だけ開いている
--        4テーブル。フロントは一切読んでいない（.from() 参照ゼロ）ため、grant 無しで
--        SELECT 権限を剥がすだけで安全に閉じられる。
--        書き込みは RPC、閲覧は管理RPC（security definer＝所有者権限）なので影響なし。
--  効果：将来これらに SELECT ポリシーを足しても、匿名にメタ列が露出しなくなる。
-- ============================================================================

revoke select on public.contacts             from anon, authenticated;
revoke select on public.server_applications  from anon, authenticated;
revoke select on public.board_reports        from anon, authenticated;
revoke select on public.admin_login_attempts from anon, authenticated;

select pg_notify('pgrst', 'reload schema');
