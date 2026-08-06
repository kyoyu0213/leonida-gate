-- ============================================================================
--  管理：IPランキング（書き込み件数の多い順にIPを集計）
--  Supabase → SQL Editor に貼って Run（1回でOK）。
--  掲示板・募集板の全書き込み（board_posts）を IP 単位で集計し、件数の多い順に返す。
--  アクティブ／コアなユーザー（＝多く書き込むIP）を一覧で把握するために使う。
-- ============================================================================
create or replace function public.admin_ip_ranking(p_token text, p_limit int default 100)
returns table (
  ip text,
  ip_subnet text,
  post_count bigint,
  thread_count bigint,
  first_at timestamptz,
  last_at timestamptz,
  sample_name text
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select
    p.ip,
    min(p.ip_subnet)                                            as ip_subnet,
    count(*)                                                    as post_count,
    count(distinct p.thread_id)                                as thread_count,
    min(p.created_at)                                          as first_at,
    max(p.created_at)                                          as last_at,
    (array_agg(p.name order by p.created_at desc))[1]          as sample_name
  from board_posts p
  where p.ip is not null
  group by p.ip
  order by post_count desc, last_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end; $$;

grant execute on function public.admin_ip_ranking(text, int) to anon;
