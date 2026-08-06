-- ============================================================================
--  管理：IPラベル（改名）の一覧を返すRPC。
--  各管理タブ（投稿ログ・記事コメント・募集板 等）で、表示中のIPに付いた
--  ラベルをまとめて引くために使う。admin_ip_labels.sql 適用済み前提。
-- ============================================================================
create or replace function public.admin_list_ip_labels(p_token text)
returns table (ip text, label text)
language plpgsql security definer set search_path = public as $$
begin
  perform _admin_check(p_token);
  return query select l.ip, l.label from public.ip_labels l;
end; $$;
grant execute on function public.admin_list_ip_labels(text) to anon;
