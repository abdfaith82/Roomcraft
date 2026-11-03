import { STYLE_ENDPOINT } from '@/config';
import { itemsOverlap, roomStats } from '@/geometry';
import type { Project, StylePick } from '@/types';

export type Analysis = {
  tips: string[];
  styles: StylePick[];
  source: 'remote' | 'local';
};

const ENDPOINT = STYLE_ENDPOINT;

const LOCAL_STYLES: StylePick[] = [
  {
    name: 'Scandi calm',
    palette: ['#f2efe9', '#e4d8c6', '#7aa095', '#3a4a47'],
    notes: ['Pale woods and soft whites', 'One muted green accent', 'Keep surfaces uncluttered'],
  },
  {
    name: 'Warm modern',
    palette: ['#efe3d3', '#cfa77f', '#c8553d', '#4a3426'],
    notes: ['Terracotta accents on neutral walls', 'Warm wood tones on the floor', 'Layer rugs and textiles'],
  },
  {
    name: 'Urban loft',
    palette: ['#d7d9dc', '#9aa0a6', '#e0a458', '#23272e'],
    notes: ['Cool greys with brass accents', 'Dark metal details', 'Let one wall carry the colour'],
  },
];

const isHex = (s: unknown): s is string => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);

function isStylePick(v: unknown): v is StylePick {
  const o = v as StylePick;
  return (
    !!o &&
    typeof o.name === 'string' &&
    Array.isArray(o.palette) &&
    o.palette.length === 4 &&
    o.palette.every(isHex) &&
    Array.isArray(o.notes) &&
    o.notes.every((n) => typeof n === 'string')
  );
}

export function layoutTips(project: Project): string[] {
  const tips: string[] = [];
  const count = (k: string) => project.items.filter((i) => i.kind === k).length;
  const { areaM2 } = roomStats(project);

  if (project.walls.length < 3) tips.push('Add walls so the room is enclosed before styling it.');

  const overlapping = new Set<string>();
  for (let i = 0; i < project.items.length; i++) {
    for (let j = i + 1; j < project.items.length; j++) {
      const a = project.items[i];
      const b = project.items[j];
      if (a.kind === 'rug' || b.kind === 'rug') continue;
      if (itemsOverlap(a, b)) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  if (overlapping.size > 0) {
    tips.push(`${overlapping.size} pieces of furniture overlap. Move them apart to keep walkways clear.`);
  }

  if (count('sofa') > 0 && count('rug') === 0) tips.push('A rug under the sofa would anchor the seating area.');
  if (count('bed') > 0 && count('wardrobe') === 0) tips.push('Add a wardrobe or storage near the bed.');
  if (count('desk') > count('chair')) tips.push('You have more desks than chairs.');
  if (project.items.length > 0 && count('plant') === 0) tips.push('One or two plants add life to the room.');
  if (areaM2 > 0 && areaM2 < 9 && project.items.length > 5) {
    tips.push('This is a small room. Consider fewer, smaller pieces.');
  }
  if (tips.length === 0) tips.push('The layout looks balanced. Try one of the palettes below.');
  return tips;
}

function summarize(project: Project) {
  const kinds: Record<string, number> = {};
  for (const i of project.items) kinds[i.kind] = (kinds[i.kind] ?? 0) + 1;
  return { areaM2: roomStats(project).areaM2, walls: project.walls.length, furniture: kinds };
}

export async function analyze(project: Project, signal?: AbortSignal): Promise<Analysis> {
  const local: Analysis = { tips: layoutTips(project), styles: LOCAL_STYLES, source: 'local' };
  if (!ENDPOINT) return local;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summarize(project)),
      signal,
    });
    if (!res.ok) return local;
    const data = (await res.json()) as { tips?: unknown; styles?: unknown };
    const tips = Array.isArray(data.tips) ? data.tips.filter((t): t is string => typeof t === 'string') : [];
    const styles = Array.isArray(data.styles) ? data.styles.filter(isStylePick) : [];
    if (styles.length === 0) return local;
    return { tips: tips.length ? tips : local.tips, styles, source: 'remote' };
  } catch {
    return local;
  }
}
