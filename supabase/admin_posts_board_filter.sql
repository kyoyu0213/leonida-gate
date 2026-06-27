-- ============================================================================
--  管理：投稿ログ（admin_list_posts）に board 絞り込みを追加。
--  これまでは全板を新着順 limit 件で返すだけだったため、新着から溢れた板
--  （例: fivem-dev / streamer-servers）のレスが管理画面に出てこなかった。
--  p_board を渡すとその板だけを新着順で返す（null＝全板）。上限も引き上げる。
--  Supabase → SQL Editor に貼り付けて Run。
-- ============================================================================

-- 旧シグネチャ（2引数）を破棄して、board 付き（3引数）に置き換える
drop function if exists public.admin_list_posts(text, int);

create or replace function public.admin_list_posts(
  p_token text,
  p_limit int default 100,
  p_board text default null
)
returns table (
  id uuid, board text, thread_id uuid, post_number int, name text, body text,
  hidden boolean, ip text, ua text, anon_id text, created_at timestamptz, report_count bigint
) language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query
  select p.id, t.board, p.thread_id, p.post_number, p.name, p.body, p.hidden,
         p.ip, p.ua, p.anon_id, p.created_at,
         (select count(*) from board_reports r where r.post_id = p.id)
  from board_posts p
  join board_threads t on t.id = p.thread_id
  where (nullif(btrim(p_board), '') is null or t.board = btrim(p_board))
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end; $$;

grant execute on function public.admin_list_posts(text, int, text) to anon;
