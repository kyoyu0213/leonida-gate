import {
  Users,
  Map as MapIcon,
  Building2,
  Car,
  Siren,
  PersonStanding,
  Music,
  MapPin,
  Crosshair,
  Activity,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

/** カテゴリ slug → アイコン（データ側に React を持ち込まないためここで対応づける）。 */
export const WIKI_ICONS: Record<string, LucideIcon> = {
  characters: Users,
  map: MapIcon,
  locations: Building2,
  vehicles: Car,
  police: Siren,
  npc: PersonStanding,
  music: Music,
  'real-locations': MapPin,
  combat: Crosshair,
  status: Activity,
};

export const wikiIcon = (slug: string): LucideIcon => WIKI_ICONS[slug] ?? BookOpen;
