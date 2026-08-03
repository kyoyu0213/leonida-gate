-- ============================================================================
--  監査で見つかった2件の修正（Supabase SQL Editor で1回だけ実行する）
-- ----------------------------------------------------------------------------
--  ① 特権関数が PUBLIC 経由で誰でも呼べていた（重大）
--     Postgres は create function 時に EXECUTE を PUBLIC へ既定付与する。
--     そのため `revoke all on function ... from anon, authenticated` だけでは
--     権限は残る（anon は PUBLIC 経由で実行できてしまう）。
--     実測でも、grant を書いていない _admin_check が anon キーから実行できた
--     （'forbidden' が返る＝関数本体まで到達している）。
--
--     影響が大きいのは次の2つ：
--       - set_admin_secret(text)      … 管理画面の合言葉を誰でも上書きできる＝乗っ取り
--       - admin_reset_login_lock()    … 総当たりロックを誰でも解除できる
--     現状はどちらも本体の `delete ... （where 無し）` が Supabase の
--     safeupdate ガードに弾かれて失敗するため実害は出ていないが、
--     これは偶然であって設計上の防御ではない。PUBLIC から明示的に剥がす。
--
--  ② board_images.uploader_ip が匿名から読めていた（プライバシー）
--     列単位の revoke は、テーブル単位の select 権限が残っていると効かない。
--     他テーブル（board_posts / friends / crews / fivem_servers / news_comments）は
--     fix_*_grants.sql で「テーブルごと revoke → 列を allowlist で grant」に
--     直してあるが、board_images だけこの対応から漏れていた。
--     実測で uploader_ip（投稿者の生IP）が anon キーで取得できた。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① PUBLIC からの実行権を剥がす。
--    明示 grant がある62関数はそのまま anon から呼べるので、サイトの動作には
--    影響しない（クライアントが呼ぶ61個はすべて明示 grant 済みであることを確認済み）。
-- ---------------------------------------------------------------------------
revoke all on function public.set_admin_secret(text)       from public, anon, authenticated;
revoke all on function public.admin_reset_login_lock()     from public, anon, authenticated;
revoke all on function public._admin_check(text)           from public, anon, authenticated;

-- 内部ヘルパー（SECURITY DEFINER 関数の中／トリガからのみ呼ばれる）。
-- 呼び出し元は definer 権限で動くため、PUBLIC を剥がしても内部呼び出しは通る。
revoke all on function public._is_blocked(text, text, text) from public, anon, authenticated;
revoke all on function public._req_meta()                   from public, anon, authenticated;
revoke all on function public._sync_card_status_from_op()   from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ② board_images：テーブルごと revoke してから、公開してよい列だけ grant し直す。
--    uploader_ip（生IP）と hidden / status は匿名に見せない。
--    行の絞り込みは既存の RLS ポリシー（status='approved' and hidden=false）が担う。
-- ---------------------------------------------------------------------------
revoke select on public.board_images from anon, authenticated;
grant select (
  id, board, thread_id, post_id, storage_path, mime, created_at
) on public.board_images to anon, authenticated;

select pg_notify('pgrst', 'reload schema');

-- ---------------------------------------------------------------------------
-- 実行後の確認（どちらも 0 行／エラーになれば正常）
-- ---------------------------------------------------------------------------
--   -- PUBLIC に EXECUTE が残っていないか
--   select p.proname, r.grantee
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     cross join lateral aclexplode(p.proacl) a
--     join pg_roles r on r.oid = a.grantee or a.grantee = 0
--    where n.nspname = 'public'
--      and p.proname in ('set_admin_secret','admin_reset_login_lock','_admin_check')
--      and a.grantee = 0;   -- grantee = 0 が PUBLIC
--
--   -- uploader_ip が anon から見えないか
--   select grantee, privilege_type
--     from information_schema.column_privileges
--    where table_name = 'board_images' and column_name = 'uploader_ip'
--      and grantee in ('anon','authenticated');
