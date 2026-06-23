import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
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
import BoardThreadList from "./pages/BoardThreadList";
import BoardThread from "./pages/BoardThread";
import AdminReports from "./pages/AdminReports";
import SearchPage from "./pages/Search";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/servers" component={ServerBoard} />
        <Route path="/news" component={NewsList} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/board" component={BoardThreadList} />
        <Route path="/board/:slug" component={BoardThreadList} />
        <Route path="/thread/:id" component={BoardThread} />
        <Route path="/admin/reports" component={AdminReports} />
        <Route path="/search" component={SearchPage} />
        <Route path="/terms" component={Terms} />
        <Route path="/contact" component={Contact} />
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
          <GoogleAnalytics />
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
