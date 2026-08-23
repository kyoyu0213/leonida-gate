-- ============================================================================
--  管理：IPラベル（改名）の付け替え。Supabase → SQL Editor に貼って Run。
-- ----------------------------------------------------------------------------
--  ラベルは ip_labels に「IP完全一致」で保存される（admin_ip_labels.sql）。
--  ルーターを再起動して回線のIPが変わると旧IPの行にラベルが残ったままになり、
--  新しいIPには何も付かない。そのときはここの IP を書き換えて実行する。
--
--  ※ 管理画面（/admin/reports → IPランキング）の「改名」ボタンでも同じことができる。
--    こちらはSQLで一括／確実にやりたいとき用。
-- ============================================================================

-- 1) 現在のラベル一覧（付け替え前の確認用）
select ip, label, updated_at from public.ip_labels order by updated_at desc;

-- 2) 自分の現在のIPへ「GTA6 FEED DEV」を付ける
--    2026-08-23 時点の自宅IP。変わったらここだけ書き換える。
insert into public.ip_labels (ip, label)
values ('61.215.248.92', 'GTA6 FEED DEV')
on conflict (ip) do update set label = excluded.label, updated_at = now();

-- 3) 旧IPのラベルは消さない。
--    回線のIPが変わっても「どちらも自分の書き込み」と分かるようにするため、
--    過去に使っていたIPのラベルはそのまま残す（delete は入れない）。
--    区別したくなったら、旧IP側だけ下のように書き換える。
--      update public.ip_labels set label = 'GTA6 FEED DEV（旧）', updated_at = now()
--      where ip = 'ここに旧IP';

-- 4) 結果確認（自分のIPが複数行ぶら下がる状態が正常）
select ip, label, updated_at from public.ip_labels order by updated_at desc;
