-- ============================================================================
--  掲示板レスのグッド/バッド（👍/👎）
--  Supabase → SQL Editor に貼って Run。前提：board.sql（board_posts）適用済み。
--
--  - board_posts に good / bad のカウント列を追加（読み取りは既存の select で取得）。
--  - board_post_votes に「誰がどちらに投票したか」を保持（1人1票・切替/取消可）。
--    voter は匿名Cookie ID（無ければIP）。anon は直接読み書きせず vote_post RPC 経由。
-- ============================================================================

alter table public.board_posts add column if not exists good int not null default 0;
alter table public.board_posts add column if not exists bad int not null default 0;

create table if not exists public.board_post_votes (
  post_id uuid not null references public.board_posts(id) on delete cascade,
  voter text not null,
  kind text not null check (kind in ('good', 'bad')),
  created_at timestamptz not null default now(),
  primary key (post_id, voter)
);
alter table public.board_post_votes enable row level security;
-- anon に select/insert ポリシーは与えない（集計は board_posts.good/bad、投票は RPC 経由）。

-- 投票（誰でも・1人1票）。同じボタンで取消、反対側で切替。新しい集計を返す。
create or replace function public.vote_post(p_post_id uuid, p_kind text, p_anon_id text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_voter text := nullif(btrim(p_anon_id), '');
  v_existing text;
  v_my text;
  v_good int;
  v_bad int;
begin
  if p_kind not in ('good', 'bad') then raise exception 'invalid kind'; end if;

  -- 識別子：匿名Cookie優先、無ければ x-forwarded-for の先頭IP。
  if v_voter is null then
    v_voter := nullif(btrim(split_part(
      coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
      ',', 1)), '');
  end if;
  if v_voter is null then raise exception 'no voter'; end if;

  if not exists (select 1 from board_posts where id = p_post_id) then
    raise exception 'post not found';
  end if;

  select kind into v_existing from board_post_votes where post_id = p_post_id and voter = v_voter;

  if v_existing is null then
    insert into board_post_votes (post_id, voter, kind) values (p_post_id, v_voter, p_kind);
    if p_kind = 'good' then
      update board_posts set good = good + 1 where id = p_post_id;
    else
      update board_posts set bad = bad + 1 where id = p_post_id;
    end if;
    v_my := p_kind;
  elsif v_existing = p_kind then
    -- 同じボタン＝取り消し
    delete from board_post_votes where post_id = p_post_id and voter = v_voter;
    if p_kind = 'good' then
      update board_posts set good = greatest(good - 1, 0) where id = p_post_id;
    else
      update board_posts set bad = greatest(bad - 1, 0) where id = p_post_id;
    end if;
    v_my := null;
  else
    -- 反対側へ切替
    update board_post_votes set kind = p_kind, created_at = now()
      where post_id = p_post_id and voter = v_voter;
    if p_kind = 'good' then
      update board_posts set good = good + 1, bad = greatest(bad - 1, 0) where id = p_post_id;
    else
      update board_posts set bad = bad + 1, good = greatest(good - 1, 0) where id = p_post_id;
    end if;
    v_my := p_kind;
  end if;

  select good, bad into v_good, v_bad from board_posts where id = p_post_id;
  return json_build_object('good', v_good, 'bad', v_bad, 'my', v_my);
end; $$;
grant execute on function public.vote_post(uuid, text, text) to anon;

select pg_notify('pgrst', 'reload schema');
