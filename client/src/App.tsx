import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileTabBar from "./components/MobileTabBar";
import { ThemeProvider } from "./contexts/ThemeContext";

// 各ページは遅延読み込み（コード分割）。記事ページ用の重いライブラリ（Markdown
// レンダラ等）をトップの本体JSから切り離し、初回表示を軽くする。
const Home = lazy(() => import("./pages/Home"));
const ServerBoard = lazy(() => import("./pages/ServerBoard"));
const NewsList = lazy(() => import("./pages/NewsList"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const BoardThreadList = lazy(() => import("./pages/BoardThreadList"));
const BoardThread = lazy(() => import("./pages/BoardThread"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminNews = lazy(() => import("./pages/AdminNews"));
const SearchPage = lazy(() => import("./pages/Search"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const FivemGtarp = lazy(() => import("./pages/FivemGtarp"));
const FivemArticle = lazy(() => import("./pages/FivemArticle"));
const GtarpArticle = lazy(() => import("./pages/GtarpArticle"));
const FivemVsGtarpArticle = lazy(() => import("./pages/FivemVsGtarpArticle"));
const FivemHistoryArticle = lazy(() => import("./pages/FivemHistoryArticle"));
const GtarpGlossaryArticle = lazy(() => import("./pages/GtarpGlossaryArticle"));
const FivemFaqArticle = lazy(() => import("./pages/FivemFaqArticle"));
const FivemCommandsArticle = lazy(() => import("./pages/FivemCommandsArticle"));
const GtarpStreamerHistoryArticle = lazy(() => import("./pages/GtarpStreamerHistoryArticle"));
const GtarpObserverGuideArticle = lazy(() => import("./pages/GtarpObserverGuideArticle"));
const GtarpFirstDayGuideArticle = lazy(() => import("./pages/GtarpFirstDayGuideArticle"));
const FivemServerGuide = lazy(() => import("./pages/FivemServerGuide"));
const FivemServerSetupArticle = lazy(() => import("./pages/FivemServerSetupArticle"));
const FivemInstallGuide = lazy(() => import("./pages/FivemInstallGuide"));
const NotFound = lazy(() => import("./pages/NotFound"));

// 遅延読み込み中のフォールバック（テーマ背景のみ。一瞬なので装飾は最小限）。
function PageFallback() {
  return <div className="vice-page" style={{ minHeight: "100vh" }} aria-hidden="true" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/servers" component={ServerBoard} />
      <Route path="/news" component={NewsList} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/board" component={BoardThreadList} />
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
      <Route path="/fivem-gtarp/how-to-install" component={FivemInstallGuide} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/search" component={SearchPage} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
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
          </div>
          <GoogleAnalytics />
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
