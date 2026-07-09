-- ============================================================================
--  friends/crews モデレーション（④-b）
--  Supabase → SQL Editor に貼って Run。前提：friends.sql / crews.sql 適用済み。
--
--  1) thread_id からカードごと削除する管理RPC（AdminReportsの通報→カード削除用）。
--     通報は post#1（=カード本文の複製）経由で admin_reports に出るため、post_id では
--     なく thread_id 起点でカード＋合成スレを消す。CASCADE で posts/通報/投票も消える。
--  2) board限定トリガー：post#1 の hidden 変化を、対応する friends/crews.status に同期。
--     通報多数の自動非表示（post#1 hidden=true）や管理者の非表示/再表示で、カードも
--     一覧から落ちる/戻るようにする。既存の板は board 判定で弾く（無影響・低コスト）。
--
--  ▼ ロールバック（トリガーだけ外す。RPC/関数は残しても無害）:
--     drop trigger if exists trg_sync_card_status on public.board_posts;
--     -- 完全に戻す場合は関数も:
--     -- drop function if exists public._sync_card_status_from_op();
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) thread_id からカード削除（_admin_check 必須）
-- ----------------------------------------------------------------------------
create or replace function public.admin_delete_friend_by_thread(p_token text, p_thread_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  -- friends.thread_id は ON DELETE SET NULL なので、先にカードを消してからスレを消す。
  delete from friends where thread_id = p_thread_id;
  delete from board_threads where id = p_thread_id;  -- CASCADE: posts/reports/votes
end; $$;
grant execute on function public.admin_delete_friend_by_thread(text, uuid) to anon;

create or replace function public.admin_delete_crew_by_thread(p_token text, p_thread_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  delete from crews where thread_id = p_thread_id;
  delete from board_threads where id = p_thread_id;  -- CASCADE: posts/reports/votes
end; $$;
grant execute on function public.admin_delete_crew_by_thread(text, uuid) to anon;

-- ----------------------------------------------------------------------------
-- 2) board限定トリガー：post#1 の hidden 変化 → カード status を同期
-- ----------------------------------------------------------------------------
create or replace function public._sync_card_status_from_op()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_board text;
begin
  select board into v_board from board_threads where id = NEW.thread_id;
  if v_board = 'friends' then
    update friends set status = case when NEW.hidden then 'hidden' else 'published' end
      where thread_id = NEW.thread_id;
  elsif v_board = 'crews' then
    update crews set status = case when NEW.hidden then 'hidden' else 'published' end
      where thread_id = NEW.thread_id;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_sync_card_status on public.board_posts;
create trigger trg_sync_card_status
  after update of hidden on public.board_posts
  for each row
  when (NEW.post_number = 1 and NEW.hidden is distinct from OLD.hidden)
  execute function public._sync_card_status_from_op();

select pg_notify('pgrst', 'reload schema');
