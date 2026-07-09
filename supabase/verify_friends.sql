-- ============================================================================
--  friends.sql 適用後の検証スクリプト（本番 SQL Editor で Run）
--  ------------------------------------------------------------------------
--  前提：friends.sql ＋ friends_grants_fix.sql を Run 済み。
--  テストデータを作るので、確認後は verify_friends_cleanup.sql を必ず Run。
--
--  ハーネス設計（重要）：
--   - create_friend/create_post 等は SECURITY DEFINER なので呼び出しロールに依存しない。
--     → ③のテストは postgres のまま実行（一時表 _vres への書込み権限を保つため）。
--   - RLS/列権限テスト(①②)だけ anon ロールに切替える。匿名操作の結果を変数に captureし、
--     必ず reset role してから _vres に記録する（anonのまま_vresに書かない）。
--  テストデータの目印：タイトル先頭 '[[VERIFY]]'。
-- ============================================================================

create temp table if not exists _vres (step text, expected text, actual text, pass boolean);
truncate _vres;

-- --- 固定フィクスチャ ---------------------------------------------------------
insert into public.banned_words (word) values ('zzbadword') on conflict do nothing;
insert into public.board_blocks (kind, value, reason)
  values ('anon', 'verify-anon-blocked', '[[VERIFY]] test block') on conflict (kind, value) do nothing;
insert into public.friends (title, body, status) values ('[[VERIFY]] hidden', 'x', 'hidden');

-- ============================================================================
-- ③ create_friend（postgres ロールのまま：DEFINER 関数なので挙動は同一）
-- ============================================================================

-- 3a 正常系：1件作成 → 合成スレ(board='friends', post_count=1) と post#1 が生成される
do $$
declare v_id uuid; v_thread uuid; v_pc int; v_body text;
begin
  v_id := create_friend('[[VERIFY]] happy','PC','casual','あり','夜','20代','テスト本文hello','discord.gg/x','verify-anon-ok',null);
  select thread_id into v_thread from friends where id = v_id;
  select post_count into v_pc from board_threads where id = v_thread and board = 'friends';
  select body into v_body from board_posts where thread_id = v_thread and post_number = 1;
  insert into _vres values ('3a create_friend 正常系: friends行', 'uuid返る', coalesce(v_id::text,'null'), v_id is not null);
  insert into _vres values ('3a 合成スレ生成(board=friends,post_count=1)', 'post_count=1', coalesce(v_pc::text,'null'), v_pc = 1);
  insert into _vres values ('3a 通報用post#1にカード本文を複製', 'テスト本文hello', coalesce(v_body,'null'), v_body = 'テスト本文hello');
exception when others then
  insert into _vres values ('3a create_friend 正常系', 'エラー無し', SQLERRM, false);
end $$;

-- 3d 連投制限：同一 anon_id で 60秒以内の2回目は 'rate limited'
do $$
declare v1 uuid; v_pass boolean := false; v_actual text;
begin
  v1 := create_friend('[[VERIFY]] rate1','','','','','','body one','','verify-anon-rate',null);
  begin
    perform create_friend('[[VERIFY]] rate2','','','','','','body two','','verify-anon-rate',null);
    v_actual := 'エラー無し（拒否されなかった）'; v_pass := false;
  exception when others then
    v_actual := '拒否✓: '||SQLERRM; v_pass := (SQLERRM like '%rate limited%');
  end;
  insert into _vres values ('3d 連投制限(2回目を拒否)', 'エラー: rate limited', v_actual, v_pass);
exception when others then
  insert into _vres values ('3d 連投制限', 'エラー無し(1回目)', SQLERRM, false);
end $$;

-- 3b ハニーポット：p_hp が埋まっていたら NULL を返し、行も作らない
do $$
declare v_id uuid; c int;
begin
  v_id := create_friend('[[VERIFY]] hp','','','','','','body','','verify-anon-hp','iam-a-bot');
  select count(*) into c from friends where title = '[[VERIFY]] hp';
  insert into _vres values ('3b ハニーポット(null返却&行なし)', 'null / 0', coalesce(v_id::text,'null')||' / '||c::text, v_id is null and c = 0);
exception when others then
  insert into _vres values ('3b ハニーポット', 'エラー無し', SQLERRM, false);
end $$;

-- 3c NGワード：本文に禁止語 → 'banned word'
do $$
declare v_id uuid;
begin
  v_id := create_friend('[[VERIFY]] bw','','','','','','これは zzbadword を含む','','verify-anon-bw',null);
  insert into _vres values ('3c NGワード拒否', 'エラー: banned word', 'エラー無し id='||coalesce(v_id::text,'null'), false);
exception when others then
  insert into _vres values ('3c NGワード拒否', 'エラー: banned word', '拒否✓: '||SQLERRM, SQLERRM like '%banned word%');
end $$;

-- 3e ブロックリスト：ブロック中の anon_id → 'blocked'
do $$
declare v_id uuid;
begin
  v_id := create_friend('[[VERIFY]] blk','','','','','','body','','verify-anon-blocked',null);
  insert into _vres values ('3e ブロック拒否', 'エラー: blocked', 'エラー無し id='||coalesce(v_id::text,'null'), false);
exception when others then
  insert into _vres values ('3e ブロック拒否', 'エラー: blocked', '拒否✓: '||SQLERRM, SQLERRM like '%blocked%');
end $$;

-- ============================================================================
-- ① 匿名 SELECT：公開のみ可・非公開メタ列は不可
-- ============================================================================

-- 1a 匿名で公開カード(status='published')の許可列は SELECT 可
do $$
declare c int;
begin
  execute 'set local role anon';
  select count(*) into c from friends where title like '[[VERIFY]]%' and status = 'published';
  execute 'reset role';
  insert into _vres values ('1a 匿名で公開カードをSELECT可', 'count>=1', c::text, c >= 1);
exception when others then
  execute 'reset role';
  insert into _vres values ('1a 匿名で公開カードをSELECT可', 'count>=1', 'エラー: '||SQLERRM, false);
end $$;

-- 1b 匿名は非公開メタ列(ip)を SELECT 不可（列権限で拒否）
do $$
declare v_pass boolean := false; v_actual text;
begin
  execute 'set local role anon';
  begin
    execute 'select ip from friends limit 1';
    v_actual := '漏洩! 読めてしまった'; v_pass := false;
  exception when insufficient_privilege then
    v_actual := '拒否✓ (insufficient_privilege)'; v_pass := true;
  when others then
    v_actual := '要確認: '||SQLERRM; v_pass := false;
  end;
  execute 'reset role';
  insert into _vres values ('1b 匿名は非公開メタ列(ip)をSELECT不可', '権限拒否', v_actual, v_pass);
exception when others then
  execute 'reset role';
  insert into _vres values ('1b 匿名は非公開メタ列(ip)をSELECT不可', '権限拒否', '要確認: '||SQLERRM, false);
end $$;

-- 1c 匿名は hidden カードを見られない（RLS）
do $$
declare c int;
begin
  execute 'set local role anon';
  select count(*) into c from friends where title = '[[VERIFY]] hidden';
  execute 'reset role';
  insert into _vres values ('1c 匿名は hidden を見られない', 'count=0', c::text, c = 0);
exception when others then
  execute 'reset role';
  insert into _vres values ('1c 匿名は hidden を見られない', 'count=0', 'エラー: '||SQLERRM, false);
end $$;

-- ============================================================================
-- ② 匿名の直接 INSERT / UPDATE / DELETE 不可（RPC 経由のみ）
-- ============================================================================

-- 2a 匿名の直接 INSERT はRLSで拒否
do $$
declare v_pass boolean := false; v_actual text;
begin
  execute 'set local role anon';
  begin
    execute $q$ insert into friends (title, body) values ('[[VERIFY]] anon-insert', 'x') $q$;
    v_actual := '漏洩! 挿入できた'; v_pass := false;
  exception when others then
    v_actual := '拒否✓: '||SQLERRM; v_pass := true;
  end;
  execute 'reset role';
  insert into _vres values ('2a 匿名の直接INSERT不可', 'RLS拒否', v_actual, v_pass);
exception when others then
  execute 'reset role';
  insert into _vres values ('2a 匿名の直接INSERT不可', 'RLS拒否', '要確認: '||SQLERRM, false);
end $$;

-- 2b 匿名の直接 UPDATE は 0 行（UPDATEポリシー無し）
do $$
declare n int; v_pass boolean := false; v_actual text;
begin
  execute 'set local role anon';
  begin
    execute $q$ update friends set title = 'HACKED' where title like '[[VERIFY]]%' $q$;
    get diagnostics n = row_count;
    v_actual := n::text||'行'; v_pass := (n = 0);
  exception when others then
    v_actual := '拒否✓: '||SQLERRM; v_pass := true;
  end;
  execute 'reset role';
  insert into _vres values ('2b 匿名の直接UPDATE不可', '0行 or エラー', v_actual, v_pass);
exception when others then
  execute 'reset role';
  insert into _vres values ('2b 匿名の直接UPDATE不可', '0行 or エラー', '要確認: '||SQLERRM, false);
end $$;

-- 2c 匿名の直接 DELETE は 0 行（DELETEポリシー無し）
do $$
declare n int; v_pass boolean := false; v_actual text;
begin
  execute 'set local role anon';
  begin
    execute $q$ delete from friends where title like '[[VERIFY]]%' $q$;
    get diagnostics n = row_count;
    v_actual := n::text||'行'; v_pass := (n = 0);
  exception when others then
    v_actual := '拒否✓: '||SQLERRM; v_pass := true;
  end;
  execute 'reset role';
  insert into _vres values ('2c 匿名の直接DELETE不可', '0行 or エラー', v_actual, v_pass);
exception when others then
  execute 'reset role';
  insert into _vres values ('2c 匿名の直接DELETE不可', '0行 or エラー', '要確認: '||SQLERRM, false);
end $$;

-- ============================================================================
-- ④ 管理RPC ＋ CASCADE（合成スレ削除で post・通報・投票も消える）
--    ※ 合言葉不要：一時セッショントークンを直接発行して検証する。
-- ============================================================================
do $$
declare
  v_id uuid; v_thread uuid; v_post1 uuid;
  n_list int; s_happy text;
  c_posts_before int; c_reports_before int; c_votes_before int;
  c_friends int; c_threads int; c_posts int; c_reports int; c_votes int;
begin
  insert into admin_sessions (token, expires_at)
    values ('verify-admin-token', now() + interval '10 minutes')
    on conflict (token) do update set expires_at = excluded.expires_at;

  v_id := create_friend('[[VERIFY]] del','PC','casual','','','','delete me body','','verify-anon-del',null);
  select thread_id into v_thread from friends where id = v_id;
  select id into v_post1 from board_posts where thread_id = v_thread and post_number = 1;
  perform create_post(v_thread, 'tester', 'reply body', 'verify-anon-reply');   -- #2
  perform report_post(v_post1, 'spam', '[[VERIFY]] report');                     -- 通報
  perform vote_post(v_post1, 'good', 'verify-voter');                            -- 投票

  select count(*) into n_list from admin_list_friends('verify-admin-token') where title like '[[VERIFY]]%';
  insert into _vres values ('4a admin_list_friends が一覧を返す', 'count>=1', n_list::text, n_list >= 1);

  perform admin_set_friend_status('verify-admin-token', (select id from friends where title='[[VERIFY]] happy' limit 1), 'hidden');
  select status into s_happy from friends where title = '[[VERIFY]] happy' limit 1;
  insert into _vres values ('4b admin_set_friend_status(hidden)', 'status=hidden', coalesce(s_happy,'null'), s_happy = 'hidden');

  select count(*) into c_posts_before from board_posts where thread_id = v_thread;
  select count(*) into c_reports_before from board_reports where post_id = v_post1;
  select count(*) into c_votes_before from board_post_votes where post_id = v_post1;
  insert into _vres values ('4c 削除前 posts/通報/投票が存在', 'posts=2,reports=1,votes=1',
    c_posts_before||'/'||c_reports_before||'/'||c_votes_before,
    c_posts_before = 2 and c_reports_before = 1 and c_votes_before = 1);

  perform admin_delete_friend('verify-admin-token', v_id);
  select count(*) into c_friends from friends where id = v_id;
  select count(*) into c_threads from board_threads where id = v_thread;
  select count(*) into c_posts from board_posts where thread_id = v_thread;
  select count(*) into c_reports from board_reports where post_id = v_post1;
  select count(*) into c_votes from board_post_votes where post_id = v_post1;
  insert into _vres values ('4d admin_delete_friend で CASCADE 削除', 'すべて0',
    'friends='||c_friends||' threads='||c_threads||' posts='||c_posts||' reports='||c_reports||' votes='||c_votes,
    c_friends = 0 and c_threads = 0 and c_posts = 0 and c_reports = 0 and c_votes = 0);
exception when others then
  insert into _vres values ('4 管理RPC/CASCADE', 'エラー無し', SQLERRM, false);
end $$;

-- --- 結果表示（全行 pass=true を確認） --------------------------------------
select step, expected, actual, pass from _vres order by step;
