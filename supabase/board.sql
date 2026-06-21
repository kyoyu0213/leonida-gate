-- ============================================================================
--  GTARPプレイヤー交流掲示板（5ch風・スレッド型・即時投稿）
--  Supabase → SQL Editor に貼り付けて Run。
--  書き込みは RPC 関数（create_thread / create_post）経由のみ。
--  関数は SECURITY DEFINER で RLS をバイパスしつつ、入力検証と採番を行う。
--  直接 insert は RLS により禁止（= 必ず検証を通る）。
-- ============================================================================

-- スレッド
create table if not exists public.board_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now(),
  last_posted_at timestamptz not null default now(),
  post_count int not null default 1
);

create index if not exists board_threads_last_posted_idx
  on public.board_threads (last_posted_at desc);

-- レス
create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.board_threads(id) on delete cascade,
  post_number int not null,            -- スレ内の連番（1始まり）
  name text not null default '名無しさん',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists board_posts_thread_num_idx
  on public.board_posts (thread_id, post_number);

-- RLS：読み取りは誰でも可。直接の書き込みポリシーは作らない（= 関数経由のみ）
alter table public.board_threads enable row level security;
alter table public.board_posts enable row level security;

drop policy if exists "read threads" on public.board_threads;
create policy "read threads" on public.board_threads for select to anon using (true);

drop policy if exists "read posts" on public.board_posts;
create policy "read posts" on public.board_posts for select to anon using (true);

-- スレッド作成（タイトル＋1レス目）。新しいスレIDを返す。
create or replace function public.create_thread(p_title text, p_name text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
begin
  if char_length(coalesce(trim(p_title), '')) = 0 or char_length(p_title) > 60 then
    raise exception 'invalid title';
  end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then
    raise exception 'invalid body';
  end if;

  insert into board_threads (title)
  values (trim(p_title))
  returning id into v_thread_id;

  insert into board_posts (thread_id, post_number, name, body)
  values (v_thread_id, 1, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body));

  return v_thread_id;
end;
$$;

-- レス投稿。次の番号を採番してスレを更新し、付与した番号を返す。
create or replace function public.create_post(p_thread_id uuid, p_name text, p_body text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num int;
begin
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 2000 then
    raise exception 'invalid body';
  end if;

  -- スレ行をロックしつつ採番（同時投稿でも番号が重複しない）
  update board_threads
    set post_count = post_count + 1,
        last_posted_at = now()
    where id = p_thread_id
    returning post_count into v_num;

  if v_num is null then
    raise exception 'thread not found';
  end if;
  if v_num > 1000 then
    raise exception 'thread full';
  end if;

  insert into board_posts (thread_id, post_number, name, body)
  values (p_thread_id, v_num, coalesce(nullif(trim(p_name), ''), '名無しさん'), trim(p_body));

  return v_num;
end;
$$;

grant execute on function public.create_thread(text, text, text) to anon;
grant execute on function public.create_post(uuid, text, text) to anon;
