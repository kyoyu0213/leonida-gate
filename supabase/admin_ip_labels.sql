-- ============================================================================
--  管理：IPに管理用ラベル（改名）を付ける。IPランキングで表示する。
--  Supabase → SQL Editor に貼って Run（1回でOK）。admin_ip_ranking.sql 適用済み前提。
--  ・ip_labels: IP → ラベルの対応表（管理者のみ・RPC経由でのみ読み書き）
--  ・admin_set_ip_label: ラベルの設定／削除（空文字なら削除）
--  ・admin_ip_ranking: ラベル列(label)を返すよう作り直し
-- ============================================================================

-- 1) ラベル表。anon には触らせない（ポリシーを作らない＝RLSで全拒否。RPC は security definer で越える）。
create table if not exists public.ip_labels (
  ip         text primary key,
  label      text not null,
  updated_at timestamptz not null default now()
);
alter table public.ip_labels enable row level security;

-- 2) ラベルの設定／削除（管理トークン必須。label が空なら削除）。
create or replace function public.admin_set_ip_label(p_token text, p_ip text, p_label text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ip    text := nullif(btrim(p_ip), '');
  v_label text := nullif(btrim(p_label), '');
begin
  perform _admin_check(p_token);
  if v_ip is null then raise exception 'ip required'; end if;
  if char_length(coalesce(v_label, '')) > 40 then raise exception 'label too long'; end if;
  if v_label is null then
    delete from ip_labels where ip = v_ip;
  else
    insert into ip_labels (ip, label, updated_at) values (v_ip, v_label, now())
    on conflict (ip) do update set label = excluded.label, updated_at = now();
  end if;
end; $$;
grant execute on function public.admin_set_ip_label(text, text, text) to anon;

-- 3) IPランキングに label 列を追加（返り値の型が変わるので一度 drop してから作り直す）。
drop function if exists public.admin_ip_ranking(text, int);
create or replace function public.admin_ip_ranking(p_token text, p_limit int default 100)
returns table (
  ip text,
  ip_subnet text,
  post_count bigint,
  thread_count bigint,
  first_at timestamptz,
  last_at timestamptz,
  sample_name text,
  label text
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select
    p.ip,
    min(p.ip_subnet)                                  as ip_subnet,
    count(*)                                          as post_count,
    count(distinct p.thread_id)                       as thread_count,
    min(p.created_at)                                 as first_at,
    max(p.created_at)                                 as last_at,
    (array_agg(p.name order by p.created_at desc))[1] as sample_name,
    max(l.label)                                      as label
  from board_posts p
  left join ip_labels l on l.ip = p.ip
  where p.ip is not null
  group by p.ip
  order by count(*) desc, max(p.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end; $$;
grant execute on function public.admin_ip_ranking(text, int) to anon;

select pg_notify('pgrst', 'reload schema');
