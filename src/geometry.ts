import { CATALOG } from './catalog';
import type { Item, Project, Pt } from './types';

export const GRID = 10;

export const snap = (v: number, g = GRID) => Math.round(v / g) * g;
export const snapPt = (p: Pt): Pt => ({ x: snap(p.x), y: snap(p.y) });
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const rad = (deg: number) => (deg * Math.PI) / 180;

export function itemCorners(item: Item): Pt[] {
  const { w, d } = CATALOG[item.kind];
  const c = Math.cos(rad(item.rot));
  const s = Math.sin(rad(item.rot));
  const local: [number, number][] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ];
  return local.map(([lx, ly]) => ({
    x: item.x + lx * c - ly * s,
    y: item.y + lx * s + ly * c,
  }));
}

export function pointInItem(item: Item, p: Pt): boolean {
  const { w, d } = CATALOG[item.kind];
  const c = Math.cos(rad(-item.rot));
  const s = Math.sin(rad(-item.rot));
  const dx = p.x - item.x;
  const dy = p.y - item.y;
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= d / 2;
}

/** Topmost item under a point (later items draw on top). */
export function hitItem(project: Project, p: Pt): Item | undefined {
  for (let i = project.items.length - 1; i >= 0; i--) {
    if (pointInItem(project.items[i], p)) return project.items[i];
  }
  return undefined;
}

export function itemsOverlap(a: Item, b: Item): boolean {
  if (pointInItem(b, { x: a.x, y: a.y }) || pointInItem(a, { x: b.x, y: b.y })) return true;
  return (
    itemCorners(a).some((c) => pointInItem(b, c)) ||
    itemCorners(b).some((c) => pointInItem(a, c))
  );
}

export function planBounds(project: Project) {
  const pts: Pt[] = [
    ...project.walls.flatMap((w) => [w.a, w.b]),
    ...project.items.flatMap(itemCorners),
  ];
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

export function roomStats(project: Project) {
  const perimeter = project.walls.reduce((sum, w) => sum + dist(w.a, w.b), 0);
  const wallPts = project.walls.flatMap((w) => [w.a, w.b]);
  let areaM2 = 0;
  if (wallPts.length > 0) {
    const w = Math.max(...wallPts.map((p) => p.x)) - Math.min(...wallPts.map((p) => p.x));
    const h = Math.max(...wallPts.map((p) => p.y)) - Math.min(...wallPts.map((p) => p.y));
    areaM2 = (w * h) / 10000;
  }
  return { perimeterM: perimeter / 100, areaM2 };
}
