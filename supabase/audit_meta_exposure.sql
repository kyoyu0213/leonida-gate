-- ============================================================================
--  匿名メタ列 露出監査（本番 SQL Editor で Run・読み取りのみ・データ変更なし）
--  ------------------------------------------------------------------------
--  public の全 BASE TABLE から「投稿者メタらしい列」(ip/ua/anon_id/ip_hash/
--  ip_subnet/reporter_ip/ip_address/email) を持つものを洗い出し、匿名ロール(anon)
--  で実際に読めるか（＝漏洩しているか）を1件ずつ判定して一覧化する。
--  verdict:
--    LEAK ❌            … anon が値を読めた（実データ漏洩）
--    priv-open ⚠️       … anon に列SELECT権限はあるが RLS で現状0行（脆弱・要是正）
--    safe ✅            … anon は列SELECT権限が無い（列拒否）
--  ※ _audit は一時表。RLS 警告が出たら「Run without RLS」でOK。
-- ============================================================================

create temp table if not exists _audit (tbl text, col text, anon_priv text, sample text, verdict text);
truncate _audit;

do $$
declare r record; v_val text; v_priv text; v_verdict text;
begin
  for r in
    select c.table_name as t, c.column_name as c
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name
     and tb.table_type = 'BASE TABLE'
    where c.table_schema = 'public'
      and c.column_name in ('ip','ua','anon_id','ip_hash','ip_subnet','reporter_ip','ip_address','email')
    order by 1, 2
  loop
    v_val := null; v_priv := 'denied';
    begin
      execute 'set local role anon';
      begin
        execute format('select %I::text from public.%I where %I is not null limit 1', r.c, r.t, r.c)
          into v_val;
        v_priv := 'GRANTED';
      exception
        when insufficient_privilege then v_priv := 'denied';
        when others then v_priv := 'other: ' || SQLERRM;
      end;
      execute 'reset role';
    exception when others then
      execute 'reset role';
      v_priv := 'outer: ' || SQLERRM;
    end;

    if v_priv = 'GRANTED' and v_val is not null then v_verdict := 'LEAK ❌';
    elsif v_priv = 'GRANTED' then v_verdict := 'priv-open ⚠️';
    elsif v_priv = 'denied' then v_verdict := 'safe ✅';
    else v_verdict := 'error';
    end if;

    insert into _audit values (r.t, r.c, v_priv, coalesce(left(v_val, 40), '(none)'), v_verdict);
  end loop;
end $$;

-- (1) メタ列ごとの漏洩判定（LEAK を上に）
select tbl, col, anon_priv, sample, verdict
from _audit
order by (verdict = 'LEAK ❌') desc, (verdict = 'priv-open ⚠️') desc, tbl, col;

-- (2) 上記テーブルの匿名SELECTポリシー（なぜ行が読めるのか＝漏洩の前提）
select p.tablename, p.policyname, p.cmd, p.roles, p.qual
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in (select distinct tbl from _audit)
  and p.cmd in ('SELECT', 'ALL')
order by p.tablename, p.cmd;

-- (3) 対象テーブルが持つメタ列の一覧（是正スクリプト作成用）
select tbl, string_agg(col, ', ' order by col) as meta_columns
from _audit
group by tbl
order by tbl;
