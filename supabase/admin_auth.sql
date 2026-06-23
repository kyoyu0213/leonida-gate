-- ============================================================================
--  アプリ内管理者認証（サーバー側で認可する）
--  Supabase → SQL Editor に貼って Run。
--
--  方針：
--   - 合言葉は平文・ハッシュともクライアント／リポジトリに置かない。
--   - 合言葉は bcrypt（pgcrypto, ソルト付き）でハッシュ化して admin_secret に保存。
--   - クライアントは admin_login(合言葉) を呼び、成功時に短命トークンを受け取る。
--     以降の特権操作はトークンで認可する（合言葉を毎回送らない）。
--   - 特権操作の RPC は SECURITY DEFINER ＋ 先頭で _admin_check(token) を通す。
--     anon ロールには board_posts 等への update/delete ポリシーを与えない
--     （RLS デフォルト拒否のまま）。よって anon キーで直接叩いても破壊操作は不可。
--   - 総当たり対策：admin_login に IP 単位のレート制限＋軽い遅延。
--
--  ▼ セットアップ（運用者が SQL Editor で1回だけ実行。合言葉はコミットしない）：
--     select public.set_admin_secret('<新しい強力な合言葉>');
--  ※ set_admin_secret は anon に grant しないため、SQL Editor / service_role からのみ実行可能。
-- ============================================================================

-- Supabase では拡張は extensions スキーマに入る。関数からも参照できるよう
-- 各関数の search_path に extensions を含める（crypt/gen_salt/gen_random_bytes 用）。
create extension if not exists pgcrypto with schema extensions;

-- 合言葉のハッシュ（1行のみ）。RLS 有効・select ポリシー無し＝ SECURITY DEFINER 経由のみ参照可。
create table if not exists public.admin_secret (
  id int primary key default 1 check (id = 1),
  secret_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_secret enable row level security;

-- 管理者セッション（短命トークン）。RLS 有効・select ポリシー無し。
create table if not exists public.admin_sessions (
  token text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.admin_sessions enable row level security;
create index if not exists admin_sessions_expires_idx on public.admin_sessions (expires_at);

-- ログイン試行ログ（総当たり対策のレート制限用）。RLS 有効・select ポリシー無し。
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip text,
  attempted_at timestamptz not null default now()
);
alter table public.admin_login_attempts enable row level security;
create index if not exists admin_login_attempts_ip_idx on public.admin_login_attempts (ip, attempted_at);

-- ----------------------------------------------------------------------------
-- 合言葉の設定／変更。bcrypt でハッシュ化して保存する。
-- anon には grant しない（= バンドルにもリポジトリにも合言葉を載せない運用）。
-- ----------------------------------------------------------------------------
create or replace function public.set_admin_secret(p_new text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(coalesce(p_new, '')) < 12 then
    raise exception 'secret too short (>= 12 chars required)';
  end if;
  insert into admin_secret (id, secret_hash, updated_at)
  values (1, crypt(p_new, gen_salt('bf', 12)), now())
  on conflict (id) do update set secret_hash = excluded.secret_hash, updated_at = now();
  -- 合言葉変更時は既存セッションを失効させる
  delete from admin_sessions;
end; $$;

-- 明示的に anon / authenticated からは実行不可にする
revoke all on function public.set_admin_secret(text) from anon, authenticated;

-- ----------------------------------------------------------------------------
-- ログイン：合言葉を bcrypt 照合し、成功時に短命トークンを発行して返す。
-- ----------------------------------------------------------------------------
create or replace function public.admin_login(p_secret text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ip text;
  v_hash text;
  v_token text;
begin
  -- 軽い遅延（総当たりを鈍らせる）
  perform pg_sleep(0.5);

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- レート制限：同一IPからの直近5分の試行が5回以上なら拒否
  if v_ip is not null and (
    select count(*) from admin_login_attempts
    where ip = v_ip and attempted_at > now() - interval '5 minutes'
  ) >= 5 then
    raise exception 'too many attempts';
  end if;

  -- 試行を記録（成否に関わらず。古い行は掃除）
  delete from admin_login_attempts where attempted_at < now() - interval '1 hour';
  insert into admin_login_attempts (ip) values (v_ip);

  select secret_hash into v_hash from admin_secret where id = 1;
  if v_hash is null then
    raise exception 'forbidden';  -- 合言葉が未設定（set_admin_secret 未実行）
  end if;

  if v_hash <> crypt(p_secret, v_hash) then
    raise exception 'forbidden';
  end if;

  -- 期限切れセッションを掃除し、新しいトークンを発行（2時間有効）
  delete from admin_sessions where expires_at < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into admin_sessions (token, expires_at) values (v_token, now() + interval '2 hours');
  return v_token;
end; $$;

-- ----------------------------------------------------------------------------
-- トークン検証（内部用）。特権 RPC が先頭で呼ぶ。無効なら forbidden。
-- ----------------------------------------------------------------------------
create or replace function public._admin_check(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or not exists (
    select 1 from admin_sessions where token = p_token and expires_at > now()
  ) then
    raise exception 'forbidden';
  end if;
end; $$;

-- ----------------------------------------------------------------------------
-- ログアウト：当該トークンのセッションを破棄。
-- ----------------------------------------------------------------------------
create or replace function public.admin_logout(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from admin_sessions where token = p_token;
end; $$;

-- anon が呼べるのは login / logout のみ（set_admin_secret は不可）。
-- _admin_check は内部用だが、呼べても副作用が無い（true/例外のみ）ため grant 不要。
grant execute on function public.admin_login(text) to anon;
grant execute on function public.admin_logout(text) to anon;
