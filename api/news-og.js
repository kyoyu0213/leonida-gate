// ============================================================================
//  DB記事（管理画面から投稿）用の OGP/Twitter Card 配信（Vercelサーバーレス関数）
//
//  静的記事(/news/1..) はビルド時にプリレンダ済み（scripts/prerender-og.ts）。
//  DB記事(/news/100001..) はビルド後に作られるためプリレンダできないので、
//  この関数が Supabase から記事を引き、index.html に OGP メタを差し込んで返す。
//  vercel.json の rewrite で /news/<数字> のうち静的ファイルが無いものがここへ来る。
// ============================================================================

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://uawyuxegcywatkfgyycp.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_56-mcQqzWE-afZce8zFb7Q_qhGAclS3';

const SITE = 'https://gta6-feed.com';
const ID_OFFSET = 100000;
const DEFAULT_IMAGE = `${SITE}/images/news/Official_Cover_Art_landscape.webp`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const id = parseInt(String((req.query && req.query.id) || ''), 10);

  // 1) ベースの空シェル（app.html）を自ホストから取得（SPA本体を維持したままメタだけ差し替える）。
  //    ※ index.html はホームをプリレンダ焼き込み済みなので使わない。catch-all と同じ
  //      pristine シェル app.html を使う（DB記事に本文が無い＝空 #root を返すのが正）。
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  let html = '';
  try {
    const r = await fetch(`${proto}://${host}/app.html`);
    if (r.ok) html = await r.text();
  } catch {
    /* fallback below */
  }

  // 2) DB記事を取得（公開記事のみ）。
  let title = 'GTA6 FEED';
  let desc = 'GTA6・FiveM RPの最新情報';
  let image = DEFAULT_IMAGE;
  // 記事が実在したか。app.html は「空シェルで返る全URL」を一括 noindex にするため
  // <meta name="robots" content="noindex"> を焼いてある（scripts/prerender-home.ts）。
  // 実在する記事ページはインデックスさせたいので、found のときだけ noindex を剥がす。
  // 見つからないID（/news/99999 等）は noindex のままにして、ソフト404が拾われるのを防ぐ。
  let found = false;
  let published = '';
  let modified = '';
  if (Number.isFinite(id) && id >= ID_OFFSET) {
    const dbId = id - ID_OFFSET;
    try {
      const u = `${SUPABASE_URL}/rest/v1/news_posts?id=eq.${dbId}&published=eq.true&select=title,description,eyecatch_url,published_at,updated_at`;
      const r = await fetch(u, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) {
        found = true;
        if (rows[0].title) title = rows[0].title;
        if (rows[0].description) desc = rows[0].description;
        if (rows[0].eyecatch_url) image = rows[0].eyecatch_url;
        published = rows[0].published_at || '';
        modified = rows[0].updated_at || published;
      }
    } catch {
      /* keep defaults */
    }
  }

  const url = `${SITE}/news/${id}`;
  const fullTitle = `${title}｜GTA6 FEED`;
  const meta = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="GTA6 FEED" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
  ].join('\n    ');

  // JSON-LD（NewsArticle + パンくず）。実在する記事のときだけ出す。
  // 静的記事は scripts/lib/jsonld.ts が組み立てるが、この関数は Vercel の
  // サーバーレス関数として単体でバンドルされる（scripts/ を import できない）ため、
  // 同じ形をここで組み立てる。片方だけ形を変えないこと。
  let ldScript = '';
  if (found) {
    const publisher = {
      '@type': 'Organization',
      name: 'GTA6 FEED',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/images/gta6feed-logo.webp` },
    };
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'NewsArticle',
          inLanguage: 'ja',
          headline: title,
          description: desc,
          image: [image],
          ...(published ? { datePublished: published } : {}),
          ...(modified ? { dateModified: modified } : {}),
          author: publisher,
          publisher,
          url,
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          isPartOf: { '@type': 'WebSite', name: 'GTA6 FEED', url: SITE },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: '最新情報', item: `${SITE}/news` },
            { '@type': 'ListItem', position: 3, name: title, item: url },
          ],
        },
      ],
    };
    ldScript = `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  }

  if (html) {
    html = html
      .replace(/\n\s*<meta property="og:[^>]*>/g, '')
      .replace(/\n\s*<meta name="twitter:[^>]*>/g, '')
      // app.html 由来の canonical（トップ指定）を除去してから自己参照 canonical を足す。
      // 除去しないと canonical が2本になり、どちらが採用されるか不定になる。
      .replace(/\n?\s*<link rel="canonical"[^>]*>/g, '')
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
      .replace('</head>', `    ${meta}\n    ${ldScript}\n  </head>`);
    // 実在する記事だけ noindex を剥がす（app.html の一括 noindex を打ち消す）。
    if (found) {
      html = html.replace(/\n?\s*<meta name="robots"[^>]*>/g, '');
    }
  } else {
    // app.html を取れなかった場合の最小フォールバック（クローラ向けメタのみ）。
    // 本文が無いので、記事が見つからなかったときは noindex を明示する。
    const robots = found ? '' : `\n    <meta name="robots" content="noindex" />`;
    html = `<!doctype html><html lang="ja"><head><meta charset="utf-8" /><title>${esc(fullTitle)}</title>\n    ${meta}${robots}\n    ${ldScript}\n  </head><body></body></html>`;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
  res.status(200).send(html);
}
