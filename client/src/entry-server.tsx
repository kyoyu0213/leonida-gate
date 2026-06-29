// ============================================================================
//  ビルド時プリレンダ用のサーバーエントリ。
//  静的な fivem-gtarp 配下ページを renderToString で生HTML化し、
//  scripts/prerender-routes.ts が <head> と #root に焼き込む。
//  ※ Vite の SSR ビルドで束ねる（エイリアス/CSS を解決させるため）。
//  ※ 言語は将来 /en/ 対応できるよう lang を受け取れる形にしてある（現状は ja のみ）。
// ============================================================================
import { renderToString } from 'react-dom/server';
import { Router } from 'wouter';
import type { ComponentType } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { readCollectedSeo, type CollectedSeo } from '@/hooks/useSeo';

import FivemGtarp from '@/pages/FivemGtarp';
import FivemArticle from '@/pages/FivemArticle';
import GtarpArticle from '@/pages/GtarpArticle';
import FivemVsGtarpArticle from '@/pages/FivemVsGtarpArticle';
import FivemHistoryArticle from '@/pages/FivemHistoryArticle';
import GtarpGlossaryArticle from '@/pages/GtarpGlossaryArticle';
import FivemFaqArticle from '@/pages/FivemFaqArticle';
import FivemCommandsArticle from '@/pages/FivemCommandsArticle';
import GtarpStreamerHistoryArticle from '@/pages/GtarpStreamerHistoryArticle';
import GtarpObserverGuideArticle from '@/pages/GtarpObserverGuideArticle';
import GtarpFirstDayGuideArticle from '@/pages/GtarpFirstDayGuideArticle';
import FivemServerGuide from '@/pages/FivemServerGuide';
import FivemServerSetupArticle from '@/pages/FivemServerSetupArticle';
import FivemInstallGuide from '@/pages/FivemInstallGuide';
import ToolsIndex from '@/pages/ToolsIndex';
import ImageResizeTool from '@/pages/ImageResizeTool';
import ImageMaskTool from '@/pages/ImageMaskTool';

// プリレンダ対象ルート（App.tsx のルーター定義と一致させる）。
const ROUTES: Record<string, ComponentType> = {
  '/fivem-gtarp': FivemGtarp,
  '/fivem-gtarp/what-is-fivem': FivemArticle,
  '/fivem-gtarp/what-is-gtarp': GtarpArticle,
  '/fivem-gtarp/fivem-vs-gtarp': FivemVsGtarpArticle,
  '/fivem-gtarp/history': FivemHistoryArticle,
  '/fivem-gtarp/glossary': GtarpGlossaryArticle,
  '/fivem-gtarp/faq': FivemFaqArticle,
  '/fivem-gtarp/commands': FivemCommandsArticle,
  '/fivem-gtarp/streamer-server-history': GtarpStreamerHistoryArticle,
  '/fivem-gtarp/observer-guide': GtarpObserverGuideArticle,
  '/fivem-gtarp/first-day-guide': GtarpFirstDayGuideArticle,
  '/fivem-gtarp/server-guide': FivemServerGuide,
  '/fivem-gtarp/server-setup': FivemServerSetupArticle,
  '/fivem-gtarp/how-to-install': FivemInstallGuide,
  '/fivem-gtarp/tools': ToolsIndex,
  '/fivem-gtarp/tools/image-resize': ImageResizeTool,
  '/fivem-gtarp/tools/image-mask': ImageMaskTool,
};

export const ROUTE_PATHS = Object.keys(ROUTES);

export interface RenderResult {
  html: string;
  seo: CollectedSeo | null;
}

/** 1ルートを静的HTML化して返す。未登録ルートは null。 */
export function render(url: string): RenderResult | null {
  const Comp = ROUTES[url];
  if (!Comp) return null;
  const html = renderToString(
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <div className="dark">
          <Router ssrPath={url}>
            <Comp />
          </Router>
        </div>
      </TooltipProvider>
    </ThemeProvider>,
  );
  return { html, seo: readCollectedSeo() };
}
