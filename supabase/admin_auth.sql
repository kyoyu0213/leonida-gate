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
--   - 総当たり対策：失敗回数に応じた「段階的ハードロック」方式。
--     直近30分の失敗回数を IP単位／グローバル（全IP横断＝ハッシュ単位）の両方で集計し、
--     どちらかが閾値に達したらロック（IPローテーション総当たりにも対応）。
--       失敗 5回 → 3分 ／ 10回 → 15分 ／ 15回 → 30分（到達した最大段階を適用）。
--     ロック中は正しい合言葉でも弾く。失敗のみを数え、成功・正規ログインは数えない。
--     ※ 共有合言葉・管理者2名想定。締め出された場合は下記の手動解除で即復旧できる。
--
--  ▼ セットアップ（運用者が SQL Editor で1回だけ実行。合言葉はコミットしない）：
--     select public.set_admin_secret('<新しい強力な合言葉>');
--
--  ▼ 万一ロック（遅延が伸びすぎ）た場合の手動解除（Supコンソール SQL Editor）：
--     -- A) ヘルパー関数で一括リセット（推奨）
--     select public.admin_reset_login_lock();
--     -- B) 生SQL（直近1時間の失敗試行を消す＝IP・グローバル両カウンタをリセット）
--     delete from public.admin_login_attempts where attempted_at > now() - interval '1 hour';
--   ※ admin_reset_login_lock / set_admin_secret は anon に grant しないため、
--     SQL Editor / service_role からのみ実行可能。
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

-- ログイン試行ログ（タールピットの遅延計算用）。RLS 有効・select ポリシー無し。
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip text,
  success boolean not null default false,   -- 成否。遅延計算は「失敗のみ」を数える。
  attempted_at timestamptz not null default now()
);
alter table public.admin_login_attempts enable row level security;
-- 既存テーブルへの移行（success 列が無ければ追加）
alter table public.admin_login_attempts add column if not exists success boolean not null default false;
create index if not exists admin_login_attempts_ip_idx on public.admin_login_attempts (ip, attempted_at);
create index if not exists admin_login_attempts_at_idx on public.admin_login_attempts (attempted_at);

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
revoke all on function public.set_admin_secret(text) from anon, authenticated;

-- ----------------------------------------------------------------------------
-- ログイン：合言葉を bcrypt 照合し、成功時に短命トークンを発行して返す。
--  判定順：
--   1) 直近30分の失敗回数を IP単位／グローバル両方で集計（失敗のみ）。
--   2) 段階的ロック判定（5回→3分／10回→15分／15回→30分）。lock_until = 最終失敗時刻＋段階。
--      IP・グローバルのどちらかがロック中なら raise 'locked'（正しい合言葉でも弾く）。
--      ※ ロック中は新たな失敗を記録しない＝解除時刻が予測可能で、手動解除も確実に効く。
--   3) bcrypt 照合。失敗時は失敗を記録して NULL を返す（raise しない＝insert をコミットさせ
--      回数を数えられるようにする）。成功時はトークン発行＋このIPの失敗履歴をリセット。
--  集計窓を30分にしているのは、最大ロック(30分)の間に失敗が窓から抜けて早期解除されるのを防ぐため。
-- ----------------------------------------------------------------------------
create or replace function public.admin_login(p_secret text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ip text;
  v_hash text;
  v_token text;
  v_cnt_ip int;       v_last_ip timestamptz;       v_lock_ip timestamptz;
  v_cnt_global int;   v_last_global timestamptz;   v_lock_global timestamptz;
begin
  -- 軽い遅延（連打を鈍らせる）
  perform pg_sleep(0.5);

  v_ip := nullif(btrim(split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
    ',', 1)), '');

  -- 直近30分の「失敗」回数と最終失敗時刻（IP単位／グローバル）。成功・正規ログインは数えない。
  select count(*), max(attempted_at) into v_cnt_ip, v_last_ip
    from admin_login_attempts
   where success = false and attempted_at > now() - interval '30 minutes'
     and v_ip is not null and ip = v_ip;
  select count(*), max(attempted_at) into v_cnt_global, v_last_global
    from admin_login_attempts
   where success = false and attempted_at > now() - interval '30 minutes';

  -- 段階的ロック時間（到達した最大段階を適用）。lock_until = 最終失敗時刻 ＋ 段階の長さ。
  v_lock_ip := case
    when v_cnt_ip >= 15 then v_last_ip + interval '30 minutes'
    when v_cnt_ip >= 10 then v_last_ip + interval '15 minutes'
    when v_cnt_ip >= 5  then v_last_ip + interval '3 minutes'
    else null end;
  v_lock_global := case
    when v_cnt_global >= 15 then v_last_global + interval '30 minutes'
    when v_cnt_global >= 10 then v_last_global + interval '15 minutes'
    when v_cnt_global >= 5  then v_last_global + interval '3 minutes'
    else null end;

  -- ロック中なら正しい合言葉でも弾く。記録はしない（解除時刻を予測可能に保つ）。
  if (v_lock_ip is not null and now() < v_lock_ip)
     or (v_lock_global is not null and now() < v_lock_global) then
    raise exception 'locked';
  end if;

  -- 古い試行ログを掃除
  delete from admin_login_attempts where attempted_at < now() - interval '1 hour';

  select secret_hash into v_hash from admin_secret where id = 1;
  if v_hash is null then
    return null;  -- 合言葉が未設定（set_admin_secret 未実行）。失敗扱い。
  end if;

  if v_hash <> crypt(p_secret, v_hash) then
    -- 失敗を記録（例外を投げないのでコミットされる）。NULL を返す。
    insert into admin_login_attempts (ip, success) values (v_ip, false);
    return null;
  end if;

  -- 成功：記録し、このIPの失敗履歴をリセット（正規管理者の打ち間違いを次回に持ち越さない）。
  insert into admin_login_attempts (ip, success) values (v_ip, true);
  if v_ip is not null then
    delete from admin_login_attempts where ip = v_ip and success = false;
  end if;

  delete from admin_sessions where expires_at < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into admin_sessions (token, expires_at) values (v_token, now() + interval '2 hours');
  return v_token;
end; $$;

-- ----------------------------------------------------------------------------
-- 手動ロック解除：ログイン試行ログを全消去してタールピット遅延を即リセット。
-- anon / authenticated には grant しない（SQL Editor / service_role 専用）。
-- ----------------------------------------------------------------------------
create or replace function public.admin_reset_login_lock()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from admin_login_attempts;
end; $$;
revoke all on function public.admin_reset_login_lock() from anon, authenticated;

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

-- anon が呼べるのは login / logout のみ（set_admin_secret / admin_reset_login_lock は不可）。
grant execute on function public.admin_login(text) to anon;
grant execute on function public.admin_logout(text) to anon;

select pg_notify('pgrst', 'reload schema');
