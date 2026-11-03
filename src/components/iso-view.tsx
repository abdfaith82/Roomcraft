import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { CATALOG, WALL_HEIGHT } from '@/catalog';
import { itemCorners, planBounds, rad } from '@/geometry';
import { colors } from '@/theme';
import type { Project, Pt } from '@/types';

type P3 = { x: number; y: number; z: number };
type Scr = { x: number; y: number; depth: number };
type Poly = { pts: Scr[]; fill: string };
type Obj = { depth: number; polys: Poly[] };

/** Shade a #rrggbb colour by a factor (<1 darker, >1 lighter). */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function projectPoint(p: P3, theta: number, c: Pt): Scr {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const xr = dx * Math.cos(theta) - dy * Math.sin(theta);
  const yr = dx * Math.sin(theta) + dy * Math.cos(theta);
  return { x: (xr - yr) * 0.866, y: (xr + yr) * 0.5 - p.z, depth: xr + yr };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

export function IsoView({ project, angle, onAngle }: {
  project: Project;
  angle: number;
  onAngle: (deg: number) => void;
}) {
  const wallColor = project.style?.palette[0] ?? '#d9d4cc';
  const floorColor = project.style?.palette[1] ?? '#efe9df';

  const start = useRef(angle);
  const latest = useRef(angle);
  latest.current = angle;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = latest.current;
        },
        onPanResponderMove: (_e, g) => onAngle(start.current + g.dx * 0.5),
      }),
    [onAngle],
  );

  const [size, setSize] = useState({ w: 0, h: 0 });

  const { polys, viewBox } = useMemo(() => {
    const theta = rad(angle);
    const b = planBounds(project);
    const center = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
    const proj = (x: number, y: number, z: number) => projectPoint({ x, y, z }, theta, center);
    const objs: Obj[] = [];

    // Floor under the walls' bounding box.
    const wallPts = project.walls.flatMap((w) => [w.a, w.b]);
    const floorPolys: Poly[] = [];
    if (wallPts.length > 0) {
      const fx0 = Math.min(...wallPts.map((p) => p.x));
      const fx1 = Math.max(...wallPts.map((p) => p.x));
      const fy0 = Math.min(...wallPts.map((p) => p.y));
      const fy1 = Math.max(...wallPts.map((p) => p.y));
      floorPolys.push({
        fill: floorColor,
        pts: [proj(fx0, fy0, 0), proj(fx1, fy0, 0), proj(fx1, fy1, 0), proj(fx0, fy1, 0)],
      });
    }

    for (const w of project.walls) {
      const pts = [
        proj(w.a.x, w.a.y, 0),
        proj(w.b.x, w.b.y, 0),
        proj(w.b.x, w.b.y, WALL_HEIGHT),
        proj(w.a.x, w.a.y, WALL_HEIGHT),
      ];
      objs.push({ depth: mean(pts.map((p) => p.depth)), polys: [{ pts, fill: wallColor }] });
    }

    for (const it of project.items) {
      const c = CATALOG[it.kind];
      const base = itemCorners(it);
      const bottom = base.map((p) => proj(p.x, p.y, 0));
      const top = base.map((p) => proj(p.x, p.y, c.h));
      const sides = base
        .map((_, i) => {
          const j = (i + 1) % 4;
          return {
            pts: [bottom[i], bottom[j], top[j], top[i]],
            fill: shade(c.color, 0.62 + 0.14 * (i % 2)),
          };
        })
        .sort((p, q) => mean(p.pts.map((s) => s.depth)) - mean(q.pts.map((s) => s.depth)));
      objs.push({
        depth: mean(bottom.map((p) => p.depth)) + (it.kind === 'rug' ? -1000 : 0),
        polys: [...sides, { pts: top, fill: shade(c.color, 1.08) }],
      });
    }

    objs.sort((p, q) => p.depth - q.depth);
    const all: Poly[] = [...floorPolys, ...objs.flatMap((o) => o.polys)];
    const xs = all.flatMap((p) => p.pts.map((s) => s.x));
    const ys = all.flatMap((p) => p.pts.map((s) => s.y));
    const minX = xs.length ? Math.min(...xs) : -200;
    const maxX = xs.length ? Math.max(...xs) : 200;
    const minY = ys.length ? Math.min(...ys) : -150;
    const maxY = ys.length ? Math.max(...ys) : 150;
    const m = 30;
    return {
      polys: all,
      viewBox: `${minX - m} ${minY - m} ${maxX - minX + 2 * m} ${maxY - minY + 2 * m}`,
    };
  }, [project, angle, wallColor, floorColor]);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      {...pan.panHandlers}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} viewBox={viewBox} pointerEvents="none">
          {polys.map((p, i) => (
            <Polygon
              key={i}
              points={p.pts.map((s) => `${s.x},${s.y}`).join(' ')}
              fill={p.fill}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface },
});
