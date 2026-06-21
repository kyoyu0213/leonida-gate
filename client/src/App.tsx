import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ServerBoard from "./pages/ServerBoard";
import NewsList from "./pages/NewsList";
import NewsDetail from "./pages/NewsDetail";
import BoardsIndex from "./pages/BoardsIndex";
import BoardThreadList from "./pages/BoardThreadList";
import BoardThread from "./pages/BoardThread";
import Terms from "./pages/Terms";
import TerminalLoader from "./components/TerminalLoader";


// ローディング画面は「サイトを最初に開いたとき」だけ表示する。
// ページ遷移（フルリロード）のたびに出ないよう、sessionStorage で
// 1セッション1回に制限する（タブを閉じるまで再表示しない）。
const LOADED_KEY = "lg_loaded";

function Router() {
  const [isLoading, setIsLoading] = useState(
    () => typeof sessionStorage !== "undefined" && !sessionStorage.getItem(LOADED_KEY)
  );

  useEffect(() => {
    if (!isLoading) return;

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem(LOADED_KEY, "1");
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TerminalLoader isLoading={isLoading} />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/servers" component={ServerBoard} />
        <Route path="/news" component={NewsList} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/board" component={BoardsIndex} />
        <Route path="/board/:slug" component={BoardThreadList} />
        <Route path="/thread/:id" component={BoardThread} />
        <Route path="/terms" component={Terms} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </>
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
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
