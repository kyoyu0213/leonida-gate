-- ============================================================================
--  ④-b モデレーション検証（本番 SQL Editor で Run）
--  前提：friends.sql / crews.sql / friends_crews_moderation.sql 適用済み。
--  一時管理トークンを発行して検証。末尾で '[[MOD]]' テストデータを自己クリーンアップ。
--  _vres の RLS 警告は「Run without RLS」。
-- ============================================================================

create temp table if not exists _vres (step text, expected text, actual text, pass boolean);
truncate _vres;

do $$
declare
  v_id uuid; v_thread uuid; v_post1 uuid; s text;
begin
  insert into admin_sessions (token, expires_at)
    values ('verify-admin-token', now() + interval '10 minutes')
    on conflict (token) do update set expires_at = excluded.expires_at;

  -- ===== 1) トリガー：post#1 の hidden 変化 → friends.status 同期 =====
  v_id := create_friend('[[MOD]] trigger','PC','casual','','','','[[MOD]] body','', 'mod-a-'||extract(epoch from clock_timestamp()), null);
  select thread_id into v_thread from friends where id = v_id;
  select id into v_post1 from board_posts where thread_id = v_thread and post_number = 1;

  perform admin_set_post_hidden('verify-admin-token', v_post1, true, '[[MOD]] test');
  select status into s from friends where id = v_id;
  insert into _vres values ('1 トリガー: post#1 非表示→card hidden', 'hidden', s, s = 'hidden');

  perform admin_set_post_hidden('verify-admin-token', v_post1, false, null);
  select status into s from friends where id = v_id;
  insert into _vres values ('1 トリガー: post#1 再表示→card published', 'published', s, s = 'published');

  -- ===== 2) 通報3件で自動非表示 → card も hidden =====
  v_id := create_friend('[[MOD]] auto','PC','casual','','','','[[MOD]] body2','', 'mod-b-'||extract(epoch from clock_timestamp()), null);
  select thread_id into v_thread from friends where id = v_id;
  select id into v_post1 from board_posts where thread_id = v_thread and post_number = 1;
  perform report_post(v_post1, 'spam', '[[MOD]] r1');
  perform report_post(v_post1, 'harassment', '[[MOD]] r2');
  perform report_post(v_post1, 'obscene', '[[MOD]] r3');
  select status into s from friends where id = v_id;
  insert into _vres values ('2 通報3件で自動非表示→card hidden', 'hidden', s, s = 'hidden');

  -- ===== 3) admin_delete_friend_by_thread：カード＋スレ＋CASCADE 全削除 =====
  v_id := create_friend('[[MOD]] del','PC','casual','','','','[[MOD]] body3','', 'mod-c-'||extract(epoch from clock_timestamp()), null);
  select thread_id into v_thread from friends where id = v_id;
  select id into v_post1 from board_posts where thread_id = v_thread and post_number = 1;
  perform report_post(v_post1, 'spam', '[[MOD]] rr');
  perform vote_post(v_post1, 'good', 'mod-voter');

  perform admin_delete_friend_by_thread('verify-admin-token', v_thread);
  insert into _vres values ('3 admin_delete_friend_by_thread で全削除', 'すべて0',
    'friends='||(select count(*) from friends where id=v_id)||
    ' threads='||(select count(*) from board_threads where id=v_thread)||
    ' posts='||(select count(*) from board_posts where thread_id=v_thread)||
    ' reports='||(select count(*) from board_reports where post_id=v_post1)||
    ' votes='||(select count(*) from board_post_votes where post_id=v_post1),
    (select count(*) from friends where id=v_id)=0
      and (select count(*) from board_threads where id=v_thread)=0
      and (select count(*) from board_posts where thread_id=v_thread)=0);

  -- ===== 4) crews：トリガー＋削除RPC の軽い確認 =====
  v_id := create_crew('[[MOD]] c','[[MOD]] crew trigger','PC','RP','','','','[[MOD]] cbody','', 'mod-d-'||extract(epoch from clock_timestamp()), null);
  select thread_id into v_thread from crews where id = v_id;
  select id into v_post1 from board_posts where thread_id = v_thread and post_number = 1;
  perform admin_set_post_hidden('verify-admin-token', v_post1, true, null);
  select status into s from crews where id = v_id;
  insert into _vres values ('4 crews トリガー: post#1 非表示→card hidden', 'hidden', s, s = 'hidden');

  perform admin_delete_crew_by_thread('verify-admin-token', v_thread);
  insert into _vres values ('4 admin_delete_crew_by_thread で削除', 'crews=0 threads=0',
    'crews='||(select count(*) from crews where id=v_id)||' threads='||(select count(*) from board_threads where id=v_thread),
    (select count(*) from crews where id=v_id)=0 and (select count(*) from board_threads where id=v_thread)=0);

  -- ===== 5) 通常板(gtarp)の post#1 hide→unhide はトリガー素通り（エラー無し・カード非影響）=====
  --  board_posts は共有テーブル。board が friends/crews 以外なら _sync_card_status_from_op は
  --  どちらの分岐にも入らず何もしない。ここで例外が出ないこと＝素通りの確認。
  v_thread := create_thread('gtarp', '[[MOD]] normal', 'tester', '[[MOD]] normal body',
                            'mod-e-'||extract(epoch from clock_timestamp()), null);
  select id into v_post1 from board_posts where thread_id = v_thread and post_number = 1;
  perform admin_set_post_hidden('verify-admin-token', v_post1, true, null);
  perform admin_set_post_hidden('verify-admin-token', v_post1, false, null);
  select hidden::text into s from board_posts where id = v_post1;
  insert into _vres values ('5 通常板 hide→unhide がトリガー素通り（エラー無し）', 'hidden=false', s, s = 'false');
exception when others then
  insert into _vres values ('④-b 検証', 'エラー無し', SQLERRM, false);
end $$;

-- --- 後始末（'[[MOD]]' と '[[SMOKE]]' の両テストデータ・全board・一時トークン）-------
--  ④-a スモークの [[SMOKE]] もまとめて掃除する（消し漏れゼロ）。
delete from public.friends where title like '[[MOD]]%' or title like '[[SMOKE]]%';
delete from public.crews   where title like '[[MOD]]%' or title like '[[SMOKE]]%';
-- スレッドは全board対象（gtarp の [[MOD]] normal 含む）。CASCADE で posts/通報/投票も消える。
delete from public.board_threads where title like '[[MOD]]%' or title like '[[SMOKE]]%';
delete from public.admin_sessions where token = 'verify-admin-token';

-- leftover 0 の確認を結果表に載せる（[[MOD]] と [[SMOKE]] の両方）
insert into _vres values ('6 leftover 0 確認（[[MOD]]/[[SMOKE]]）', 'すべて0',
  'friends='||(select count(*) from public.friends where title like '[[MOD]]%' or title like '[[SMOKE]]%')||
  ' crews='||(select count(*) from public.crews where title like '[[MOD]]%' or title like '[[SMOKE]]%')||
  ' threads='||(select count(*) from public.board_threads where title like '[[MOD]]%' or title like '[[SMOKE]]%'),
  (select count(*) from public.friends where title like '[[MOD]]%' or title like '[[SMOKE]]%') = 0
    and (select count(*) from public.crews where title like '[[MOD]]%' or title like '[[SMOKE]]%') = 0
    and (select count(*) from public.board_threads where title like '[[MOD]]%' or title like '[[SMOKE]]%') = 0);

-- --- 結果（全行 pass=true を確認）-------------------------------------------
select step, expected, actual, pass from _vres order by step;
