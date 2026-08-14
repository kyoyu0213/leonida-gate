import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AdsLoader from "@/components/AdsLoader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileTabBar from "./components/MobileTabBar";
import LangBanner from "./components/LangBanner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazyWithRetry } from "./lib/lazyLoad";

// ============================================================================
//  公開ページのルートコンポーネントは「事前import」に統一する（コード分割しない）。
//
//  以前はここが全38本 lazy(() => import(...)) だった。だが 2026-08-14 の GSC
//  ライブテストで、Googleレンダラーがルートチャンク1本（assets/Contact-*.js）の
//  取得に失敗し、
//    createRoot がプリレンダ本文を消す → lazy の promise が reject
//    → 最上位 ErrorBoundary が全画面エラーを描画
//  という順序で「本文ゼロ＋エラー文言」だけが Google に見えていた
//  （ソフト404 3件・/contact ほか）。チャンク1本の取りこぼしが本文全消しに
//  直結する構造そのものが原因。
//
//  事前importなら公開ページのJSは entry 1本になり、その取得に失敗した場合は
//  React が起動しない＝プリレンダ本文がそのまま残る、という安全側の壊れ方になる。
//  引き換えに entry は約1.16MB→約3.18MB（br 300KB→772KB）に増えるが、
//  審査クローラーに正しく見えることを優先する意図的なコスト。
//
//  例外は /admin/* の2本だけ。noindex でプリレンダ対象外、クローラーが踏まないため
//  失敗しても検索影響がゼロで、事前importすると全公開ページに約83KB を配ることになる。
//  こちらは lazyWithRetry（失敗時に1回だけ再試行）を通して保険をかける。
// ============================================================================
import Home from "./pages/Home";
import RecruitIndex from "./pages/RecruitIndex";
import ServerBoard from "./pages/ServerBoard";
import NewsList from "./pages/NewsList";
import NewsDetail from "./pages/NewsDetail";
import BoardIndex from "./pages/BoardIndex";
import BoardThreadList from "./pages/BoardThreadList";
import BoardThread from "./pages/BoardThread";
import FriendsBoard from "./pages/FriendsBoard";
import CrewsBoard from "./pages/CrewsBoard";
import FriendDetail from "./pages/FriendDetail";
import CrewDetail from "./pages/CrewDetail";
import SearchPage from "./pages/Search";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import About from "./pages/About";
import FivemGtarp from "./pages/FivemGtarp";
import FivemArticle from "./pages/FivemArticle";
import GtarpArticle from "./pages/GtarpArticle";
import FivemVsGtarpArticle from "./pages/FivemVsGtarpArticle";
import FivemHistoryArticle from "./pages/FivemHistoryArticle";
import GtarpGlossaryArticle from "./pages/GtarpGlossaryArticle";
import FivemFaqArticle from "./pages/FivemFaqArticle";
import FivemCommandsArticle from "./pages/FivemCommandsArticle";
import GtarpStreamerHistoryArticle from "./pages/GtarpStreamerHistoryArticle";
import GtarpObserverGuideArticle from "./pages/GtarpObserverGuideArticle";
import GtarpFirstDayGuideArticle from "./pages/GtarpFirstDayGuideArticle";
import FivemServerGuide from "./pages/FivemServerGuide";
import FivemServerSetupArticle from "./pages/FivemServerSetupArticle";
import FieldNotesList from "./pages/FieldNotesList";
import FieldNoteDetail from "./pages/FieldNoteDetail";
import FivemInstallGuide from "./pages/FivemInstallGuide";
import ToolsIndex from "./pages/ToolsIndex";
import ImageResizeTool from "./pages/ImageResizeTool";
import ImageMaskTool from "./pages/ImageMaskTool";
import NotFound from "./pages/NotFound";

// 管理画面のみ遅延読み込み（noindex・クローラー非対象）。
const AdminReports = lazyWithRetry(() => import("./pages/AdminReports"));
const AdminNews = lazyWithRetry(() => import("./pages/AdminNews"));

// /admin/* の読み込み中フォールバック（テーマ背景のみ。一瞬なので装飾は最小限）。
function PageFallback() {
  return <div className="vice-page" style={{ minHeight: "100vh" }} aria-hidden="true" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/recruit" component={RecruitIndex} />
      <Route path="/servers" component={ServerBoard} />
      <Route path="/news" component={NewsList} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/board" component={BoardIndex} />
      {/* フレンド募集・クルー募集（カード型・自由投稿）。/board/:slug より前に置く。 */}
      <Route path="/board/friends" component={FriendsBoard} />
      <Route path="/board/friends/:id" component={FriendDetail} />
      <Route path="/board/crews" component={CrewsBoard} />
      <Route path="/board/crews/:id" component={CrewDetail} />
      <Route path="/board/:slug" component={BoardThreadList} />
      <Route path="/thread/:id" component={BoardThread} />
      <Route path="/fivem-gtarp" component={FivemGtarp} />
      <Route path="/fivem-gtarp/what-is-fivem" component={FivemArticle} />
      <Route path="/fivem-gtarp/what-is-gtarp" component={GtarpArticle} />
      <Route path="/fivem-gtarp/fivem-vs-gtarp" component={FivemVsGtarpArticle} />
      <Route path="/fivem-gtarp/history" component={FivemHistoryArticle} />
      <Route path="/fivem-gtarp/glossary" component={GtarpGlossaryArticle} />
      <Route path="/fivem-gtarp/faq" component={FivemFaqArticle} />
      <Route path="/fivem-gtarp/commands" component={FivemCommandsArticle} />
      <Route path="/fivem-gtarp/streamer-server-history" component={GtarpStreamerHistoryArticle} />
      <Route path="/fivem-gtarp/observer-guide" component={GtarpObserverGuideArticle} />
      <Route path="/fivem-gtarp/first-day-guide" component={GtarpFirstDayGuideArticle} />
      <Route path="/fivem-gtarp/server-guide" component={FivemServerGuide} />
      <Route path="/fivem-gtarp/server-setup" component={FivemServerSetupArticle} />
      <Route path="/fivem-gtarp/field-notes/dev-diary" component={FieldNotesList} />
      <Route path="/fivem-gtarp/field-notes/visit-note" component={FieldNotesList} />
      <Route path="/fivem-gtarp/field-notes/:category/:slug" component={FieldNoteDetail} />
      <Route path="/fivem-gtarp/how-to-install" component={FivemInstallGuide} />
      <Route path="/fivem-gtarp/tools" component={ToolsIndex} />
      <Route path="/fivem-gtarp/tools/image-resize" component={ImageResizeTool} />
      <Route path="/fivem-gtarp/tools/image-mask" component={ImageMaskTool} />

      {/* 英語版（/en/）。日本語ルートと同じコンポーネントを使い、言語は useLang が URL から判定する。
          記事・fivem-gtarp・tools・contact・terms は hreflang/sitemap で正式な英語版として扱う。
          掲示板・servers・home・検索 など（中身が日本語UGC/動的）は UI を英語表示できるよう /en を
          用意するが、hreflang は張らず canonical は日本語版に集約する（重複インデックスを避ける）。 */}
      <Route path="/en" component={Home} />
      <Route path="/en/news" component={NewsList} />
      <Route path="/en/recruit" component={RecruitIndex} />
      <Route path="/en/servers" component={ServerBoard} />
      <Route path="/en/board" component={BoardIndex} />
      <Route path="/en/board/friends" component={FriendsBoard} />
      <Route path="/en/board/friends/:id" component={FriendDetail} />
      <Route path="/en/board/crews" component={CrewsBoard} />
      <Route path="/en/board/crews/:id" component={CrewDetail} />
      <Route path="/en/board/:slug" component={BoardThreadList} />
      <Route path="/en/thread/:id" component={BoardThread} />
      <Route path="/en/search" component={SearchPage} />
      <Route path="/en/news/:id" component={NewsDetail} />
      <Route path="/en/fivem-gtarp" component={FivemGtarp} />
      <Route path="/en/fivem-gtarp/what-is-fivem" component={FivemArticle} />
      <Route path="/en/fivem-gtarp/what-is-gtarp" component={GtarpArticle} />
      <Route path="/en/fivem-gtarp/fivem-vs-gtarp" component={FivemVsGtarpArticle} />
      <Route path="/en/fivem-gtarp/history" component={FivemHistoryArticle} />
      <Route path="/en/fivem-gtarp/glossary" component={GtarpGlossaryArticle} />
      <Route path="/en/fivem-gtarp/faq" component={FivemFaqArticle} />
      <Route path="/en/fivem-gtarp/commands" component={FivemCommandsArticle} />
      <Route path="/en/fivem-gtarp/streamer-server-history" component={GtarpStreamerHistoryArticle} />
      <Route path="/en/fivem-gtarp/observer-guide" component={GtarpObserverGuideArticle} />
      <Route path="/en/fivem-gtarp/first-day-guide" component={GtarpFirstDayGuideArticle} />
      <Route path="/en/fivem-gtarp/server-guide" component={FivemServerGuide} />
      <Route path="/en/fivem-gtarp/server-setup" component={FivemServerSetupArticle} />
      <Route path="/en/fivem-gtarp/field-notes/dev-diary" component={FieldNotesList} />
      <Route path="/en/fivem-gtarp/field-notes/visit-note" component={FieldNotesList} />
      <Route path="/en/fivem-gtarp/field-notes/:category/:slug" component={FieldNoteDetail} />
      <Route path="/en/fivem-gtarp/how-to-install" component={FivemInstallGuide} />
      <Route path="/en/fivem-gtarp/tools" component={ToolsIndex} />
      <Route path="/en/fivem-gtarp/tools/image-resize" component={ImageResizeTool} />
      <Route path="/en/fivem-gtarp/tools/image-mask" component={ImageMaskTool} />
      <Route path="/en/about" component={About} />
      <Route path="/en/contact" component={Contact} />
      <Route path="/en/terms" component={Terms} />
      <Route path="/en/privacy" component={Privacy} />

      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/search" component={SearchPage} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <div className="dark">
            <Suspense fallback={<PageFallback />}>
              <Router />
            </Suspense>
            <MobileTabBar />
            <LangBanner />
          </div>
          <GoogleAnalytics />
          <AdsLoader />
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
