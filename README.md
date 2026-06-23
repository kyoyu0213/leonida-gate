# VICE HUB

GTA6 / FiveM RP コミュニティサイト（Vite + React + Supabase）。

開発: `corepack pnpm dev`（http://localhost:3000）
型チェック: `corepack pnpm check`

---

## Supabase スキーマの適用順

Supabase → SQL Editor に以下を順に貼って Run（既存環境では未適用ぶんのみ）：

1. `supabase/board.sql`
2. `supabase/board_ip.sql`
3. `supabase/board_moderation.sql`
4. `supabase/contacts.sql` / `supabase/server_applications.sql` / `supabase/fivem_servers.sql`
5. **`supabase/admin_auth.sql`**（管理者認証）
6. **`supabase/board_reports.sql`**（通報＋モデレーション）
7. **`supabase/board_images.sql`**（画像投稿・デフォルト無効）
8. **`supabase/news_comments.sql`**（ニュース記事コメント）

---

## 管理者認証（重要）

管理者の特権操作（通報の確認・投稿の非表示/削除・対応済み化・申請制ジャンルへのスレ作成・画像承認）は、
**サーバー側で認可**される。合言葉はクライアント／バンドル／リポジトリに一切含まれない。

### 合言葉の設定（初回・変更時）

`supabase/admin_auth.sql` を適用したら、SQL Editor で **1回だけ**実行する（合言葉はコミットしないこと）：

```sql
select public.set_admin_secret('<新しい強力な合言葉（12文字以上）>');
```

- 合言葉は **bcrypt（pgcrypto・ソルト付き）** でハッシュ化して保存される（平文・SHA256は保存しない）。
- `set_admin_secret` は anon に grant されていないため、SQL Editor / service_role からのみ実行可能。
- 合言葉を変更すると既存の管理者セッションはすべて失効する。

### 管理画面の使い方

- `/admin/reports` を開き、合言葉でログイン（公開ナビには出していない）。
- ログイン成功で **短命トークン（2時間）** が発行され、**メモリのみ**で保持される
  （localStorage 等には保存しない＝ページ再読込で再ログインが必要）。
- 「通報」タブ：通報の一覧・対象投稿へジャンプ・非表示/再表示・削除・対応済み。
- 「画像承認」タブ：承認待ち画像のプレビューと承認/却下（②を有効化した場合のみ表示）。
- 総当たり対策：合言葉照合は同一IPで5分間に5回まで。各試行に軽い遅延あり。

### 旧合言葉について

以前バンドルに同梱されていた `vh-admin-2026` は漏洩済みとして廃止した。
クライアントコードからは完全に削除済みで、新しい合言葉は上記の手順で設定する。

---

## ① 通報機能

- 掲示板の各投稿（スレ本体・各レス）に「通報」ボタン。ログイン不要。
- 理由を選んで送信（誹謗中傷／個人情報／スパム／わいせつ／なりすまし／その他＋自由記述）。
- 同一IPからの同一投稿への重複通報・短時間の連投はサーバー側で抑制。
- 記録: 対象投稿ID・理由・通報者IP・日時（IPは非公開）。
- 非表示にした投稿は公開画面で「※管理者により非表示」と表示され、レス番号は維持される。
- 削除は当該レスを物理削除する。**スレ1レス目（OP）は削除せず「非表示」推奨**（採番・スレ整合のため）。

---

## ② 画像投稿（承認制・カテゴリ単位でオン/オフ）

掲示板のレスに画像を添付できる。**初期状態は全カテゴリ無効**で、有効化したカテゴリのみ入口が出る。

### 仕組み（クライアント処理）

- ブラウザ側で **canvas 再エンコード**して **EXIF/GPS を含む全メタデータを除去**＋長辺1600pxに圧縮。
- 許可形式は **jpg / png / webp のみ**（gif・svg・その他は拒否）。1投稿最大3枚。
- `nanoid` のランダムパスで **public バケット `board-images`** に直接アップロード。
- アップロード後に `create_board_image` RPC で登録：board が有効か確認し、`require_approval=true` なら
  **承認待ち（pending）**、false なら即 approved。MIME 再検証・同一IP連投制限・投稿者IP保存つき。
- 公開は `status=approved` かつ `hidden=false` のみ（RLS）。承認/却下は管理画面 `/admin/reports` の「画像承認」タブ。
- 却下/非表示の画像も実体とIPログを保持（開示請求・再発対策）。

### 事前準備（有効化前に一度だけ）

1. `supabase/board_images.sql` を SQL Editor で実行（テーブル・設定・RPC を作成）。
2. Supabase → Storage で **public バケット `board-images`** を作成。
3. 匿名アップロードを許可する Storage ポリシーを SQL Editor で実行：
   ```sql
   create policy "anon upload board-images" on storage.objects
     for insert to anon with check (bucket_id = 'board-images');
   ```
   （public バケットなので読み取りは自動。パスは `nanoid(24)` で推測困難。）

### オン / オフの切り替え（カテゴリ単位・初期は全 false）

- **管理画面から**：`/admin/reports` ログイン後に `admin_set_board_image_setting` を利用。
- **SQL から**：
  ```sql
  -- gta6 で画像を有効化（承認制ON）
  update public.board_image_settings
    set images_enabled = true, require_approval = true where board = 'gta6';

  -- 無効に戻す
  update public.board_image_settings set images_enabled = false where board = 'gta6';
  ```
- `require_approval = false` で承認なし即公開（信頼できるカテゴリ向け）。

---

## ③ ニュース記事コメント

- 各ニュース記事（`/news/:id`）の下部にコメント欄。投稿はログイン不要。
- NGワード（`banned_words` を共用）＋同一IP 8秒の連投制限はサーバー側（`create_news_comment`）で実施。
- 非表示／削除は管理者トークンで認可（`admin_set_news_comment_hidden` / `admin_delete_news_comment`）。
  公開クエリは `hidden=false` のみ表示。コメント投稿者IPは保存するが非公開。

---

## アクセス解析（Google Analytics 4）

- 全ページで GA4 を計測（[client/src/components/GoogleAnalytics.tsx](client/src/components/GoogleAnalytics.tsx) を `App` に常設）。
- このサイトは Vite + React の SPA のため、`gtag.js` を実行時に `<head>` へ注入し、wouter のルート変更ごとに `page_view` を送信します（SPAの自動ページビューは無効化し二重計測を防止）。
- **本番（`vite build`）でのみ動作**します。開発（`vite dev`）では読み込みません。
- 測定IDは環境変数 **`VITE_GA_ID`** で管理（[.env.example](.env.example) 参照）。未設定時は既定 `G-37CH3TFBP4` にフォールバック。Vercel等では Environment Variables に `VITE_GA_ID` を設定してください（`NEXT_PUBLIC_*` ではなく Vite の `VITE_*` 接頭辞）。
- 確認：本番URLを開き、DevTools の Network で `googletagmanager.com/gtag/js?id=G-...` の読み込み、GA4 のリアルタイムでアクセス反映を確認。

---

## セキュリティ・メモ

- 書き込みはすべて SECURITY DEFINER の RPC 経由。anon ロールに `board_posts` 等への
  insert/update/delete ポリシーは付与していない（RLS デフォルト拒否）。
  → anon キーで REST/RPC を直接叩いても、投稿の非表示・削除はできない。
- 投稿者IP・通報者IP・アップロード者IPは保存するが、いずれも anon からは select 不可。
- クライアントに含まれる Supabase キーは publishable（anon）キーのみ。service_role キーは含めない。
