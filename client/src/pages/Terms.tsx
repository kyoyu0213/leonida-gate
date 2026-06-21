import Header from '@/components/Header';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-16">
      <Header />

      <div className="container max-w-3xl mx-auto py-14 px-4">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-primary">
          利用規約・プライバシーポリシー
        </h1>
        <p className="text-sm font-mono text-muted-foreground mb-10">最終更新日: 2026-06-22</p>

        <div className="space-y-10 text-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">1. はじめに</h2>
            <p className="text-sm md:text-base">
              LEONIDA GATE（以下「当サイト」）は、Grand Theft Auto VI（GTA6）および FiveM / GTA RP
              に関する情報発信と、プレイヤー同士の交流を目的とした非公式のファンコミュニティサイトです。
              Rockstar Games、Take-Two Interactive をはじめとする各権利者とは一切関係がありません。
              当サイトをご利用いただいた時点で、本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">
              2. 投稿について（掲示板・サーバー掲示板）
            </h2>
            <p className="text-sm md:text-base mb-3">
              当サイトの掲示板およびサーバー掲示板は、どなたでも投稿できます。投稿にあたっては、次の行為を禁止します。
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm md:text-base text-foreground/90">
              <li>法令または公序良俗に反する行為</li>
              <li>誹謗中傷、差別、脅迫、ハラスメント、その他他者を害する行為</li>
              <li>他人の個人情報・プライバシーを暴露する行為</li>
              <li>スパム、過度な宣伝、無関係なリンクの投稿</li>
              <li>わいせつ・グロテスクな内容、その他不快感を与える内容</li>
              <li>なりすまし、虚偽の情報の流布</li>
              <li>第三者の著作権・商標権その他の権利を侵害する行為</li>
              <li>サーバーへの攻撃・不正アクセスを助長する行為</li>
            </ul>
            <p className="text-sm md:text-base mt-3">
              サーバー掲示板への掲載は運営の承認制です。交流掲示板は即時投稿ですが、運営は予告なく投稿を削除・非表示にし、
              または特定の利用者の投稿を制限することができます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">
              3. プライバシー・記録する情報
            </h2>
            <p className="text-sm md:text-base mb-3">
              掲示板への投稿時、当サイトは荒らし・不正行為の防止および健全な運営のため、次の情報を記録します。
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm md:text-base text-foreground/90">
              <li>投稿日時</li>
              <li>投稿者のIPアドレス</li>
              <li>投稿内容、入力された名前</li>
            </ul>
            <p className="text-sm md:text-base mt-3">
              IPアドレスは一般には公開されず、運営が不正対応などの管理目的でのみ閲覧します。
              ただし、法令に基づく正当な開示請求があった場合など、正当な理由がある場合には、関係機関へ開示することがあります。
            </p>
            <p className="text-sm md:text-base mt-3">
              また、連投防止や表示制御のために、ブラウザのCookieおよびローカルストレージを最小限の範囲で使用します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">4. 免責事項</h2>
            <ul className="list-disc pl-6 space-y-1.5 text-sm md:text-base text-foreground/90">
              <li>
                掲示板・サーバー掲示板の投稿内容は各投稿者の責任に基づくものであり、当サイトはその正確性・安全性・適法性を保証しません。
              </li>
              <li>
                掲載されたサーバーへの参加や、利用者間で生じたトラブルについて、当サイトは一切の責任を負いません。自己責任でご利用ください。
              </li>
              <li>
                当サイトのニュース・考察記事には、未確認のリーク情報や推測を含む場合があります。各記事内の注記をご確認ください。
              </li>
              <li>当サイトの利用により生じたいかなる損害についても、当サイトは責任を負いません。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">5. 著作権・商標</h2>
            <p className="text-sm md:text-base">
              「Grand Theft Auto」「GTA」「Rockstar Games」等の名称・ロゴ・関連する著作物の権利は、各権利者に帰属します。
              当サイトは非公式のファンサイトであり、これらの権利者から公認・提携・後援を受けたものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">6. 規約の変更</h2>
            <p className="text-sm md:text-base">
              当サイトは、本規約を必要に応じて予告なく変更することがあります。変更後の規約は、当ページに掲載した時点で効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary font-display mb-3">7. お問い合わせ</h2>
            <p className="text-sm md:text-base">
              本規約に関するお問い合わせは、トップページの連絡フォームよりお願いいたします。
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-mono text-sm">
            &larr; ホームに戻る
          </a>
        </div>
      </div>

      <footer className="border-t border-border py-8 px-4 text-center text-gray-500 font-mono text-sm">
        <p>&copy; 2026 Leonida Gate. All rights reserved.</p>
      </footer>
    </div>
  );
}
