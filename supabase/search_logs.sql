-- ============================================================================
--  検索キーワードの記録（プライバシー軽め：キーワード・スコープ・件数・日時のみ。
--  IP や Cookie などの個人情報は保存しない）。
--  Supabase → SQL Editor に貼って Run。前提：admin_auth.sql（_admin_check）。
-- ============================================================================

create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  scope text not null default 'all',     -- 'all'（全体）/ 'board'（掲示板内）
  results_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.search_logs enable row level security;
create index if not exists search_logs_created_idx on public.search_logs (created_at desc);
create index if not exists search_logs_query_idx on public.search_logs (lower(query));

-- 記録（匿名可）。空・長すぎる語は無視。個人情報は受け取らない。
create or replace function public.log_search(p_query text, p_scope text, p_results int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(trim(p_query), '')) = 0 or char_length(p_query) > 100 then
    return;
  end if;
  insert into search_logs (query, scope, results_count)
  values (trim(p_query),
          case when p_scope = 'board' then 'board' else 'all' end,
          greatest(coalesce(p_results, 0), 0));
end; $$;
grant execute on function public.log_search(text, text, int) to anon;

-- 管理：最近の検索一覧
create or replace function public.admin_list_searches(p_token text)
returns table (id uuid, query text, scope text, results_count int, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query select s.id, s.query, s.scope, s.results_count, s.created_at
  from search_logs s order by s.created_at desc limit 200;
end; $$;

-- 管理：人気キーワード（直近 p_days 日の検索回数ランキング）
create or replace function public.admin_top_searches(p_token text, p_days int default 30)
returns table (query text, cnt bigint, zero_hits bigint, last_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select lower(s.query) as query,
         count(*) as cnt,
         count(*) filter (where s.results_count = 0) as zero_hits,
         max(s.created_at) as last_at
  from search_logs s
  where s.created_at > now() - make_interval(days => greatest(coalesce(p_days, 30), 1))
  group by lower(s.query)
  order by cnt desc, last_at desc
  limit 50;
end; $$;

grant execute on function public.admin_list_searches(text) to anon;
grant execute on function public.admin_top_searches(text, int) to anon;

select pg_notify('pgrst', 'reload schema');
