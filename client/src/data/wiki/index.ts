// GTA6まとめWiki の本文データ（slug → ページ）。カテゴリのメタは categories.ts。
import type { WikiPage } from './types';
import { CHARACTERS } from './characters';
import { MAP } from './map';
import { LOCATIONS } from './locations';
import { VEHICLES } from './vehicles';
import { POLICE } from './police';
import { NPC } from './npc';
import { MUSIC } from './music';
import { REAL_LOCATIONS } from './realLocations';
import { COMBAT } from './combat';
import { STATUS } from './status';
import { LIVING_WORLD } from './livingWorld';

export const WIKI_PAGES: Record<string, WikiPage> = Object.fromEntries(
  [CHARACTERS, MAP, LOCATIONS, VEHICLES, POLICE, NPC, MUSIC, REAL_LOCATIONS, COMBAT, STATUS, LIVING_WORLD].map((p) => [p.slug, p]),
);
