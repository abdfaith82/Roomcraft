import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText, Circle } from 'react-native-svg';
import { CATALOG } from '@/catalog';
import { dist, hitItem, snapPt } from '@/geometry';
import { colors } from '@/theme';
import type { FurnitureKind, Project, Pt, Tool } from '@/types';

const PAD = 16;

type Props = {
  project: Project;
  /** Pixels per centimetre. */
  scale: number;
  tool: Tool;
  kind: FurnitureKind;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddWall: (a: Pt, b: Pt) => void;
  onPlace: (at: Pt) => void;
  onMoveItem: (id: string, at: Pt) => void;
};

type Drag = { id: string; x: number; y: number };

export function FloorPlanCanvas(props: Props) {
  const { project, scale: S, tool, selectedId } = props;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pending, setPending] = useState<Pt | null>(null);
  const [preview, setPreview] = useState<{ a: Pt; b: Pt } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const latest = useRef(props);
  latest.current = props;
  const pendingRef = useRef<Pt | null>(null);
  pendingRef.current = pending;
  const dragRef = useRef<Drag | null>(null);
  const gesture = useRef<{ startPx: Pt; start: Pt; moved: boolean; offset?: Pt; dragId?: string }>({
    startPx: { x: 0, y: 0 },
    start: { x: 0, y: 0 },
    moved: false,
  });

  useEffect(() => {
    setPending(null);
    setPreview(null);
  }, [tool]);

  const pan = useMemo(() => {
    const toPlan = (px: number, py: number): Pt => ({
      x: (px - PAD) / latest.current.scale,
      y: (py - PAD) / latest.current.scale,
    });
    const current = (dx: number, dy: number) =>
      toPlan(gesture.current.startPx.x + dx, gesture.current.startPx.y + dy);

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const start = toPlan(locationX, locationY);
        gesture.current = { startPx: { x: locationX, y: locationY }, start, moved: false };
        if (latest.current.tool === 'move') {
          const hit = hitItem(latest.current.project, start);
          latest.current.onSelect(hit ? hit.id : null);
          if (hit) {
            gesture.current.dragId = hit.id;
            gesture.current.offset = { x: hit.x - start.x, y: hit.y - start.y };
          }
        }
      },
      onPanResponderMove: (_e, g) => {
        if (Math.hypot(g.dx, g.dy) > 6) gesture.current.moved = true;
        if (!gesture.current.moved) return;
        const p = current(g.dx, g.dy);
        const { tool: t } = latest.current;
        if (t === 'wall') {
          setPreview({ a: snapPt(gesture.current.start), b: snapPt(p) });
        } else if (t === 'move' && gesture.current.dragId && gesture.current.offset) {
          const at = snapPt({
            x: p.x + gesture.current.offset.x,
            y: p.y + gesture.current.offset.y,
          });
          const next = { id: gesture.current.dragId, ...at };
          dragRef.current = next;
          setDrag(next);
        }
      },
      onPanResponderRelease: (_e, g) => {
        const { tool: t } = latest.current;
        const g0 = gesture.current;
        if (t === 'wall') {
          if (g0.moved) {
            const a = snapPt(g0.start);
            const b = snapPt(current(g.dx, g.dy));
            if (dist(a, b) >= 10) latest.current.onAddWall(a, b);
            setPending(null);
          } else {
            const p = snapPt(g0.start);
            const prev = pendingRef.current;
            if (prev && dist(prev, p) >= 10) latest.current.onAddWall(prev, p);
            setPending(p);
          }
        } else if (t === 'place' && !g0.moved) {
          latest.current.onPlace(snapPt(g0.start));
        } else if (t === 'move' && g0.moved && dragRef.current) {
          latest.current.onMoveItem(dragRef.current.id, {
            x: dragRef.current.x,
            y: dragRef.current.y,
          });
        }
        dragRef.current = null;
        setDrag(null);
        setPreview(null);
      },
      onPanResponderTerminate: () => {
        dragRef.current = null;
        setDrag(null);
        setPreview(null);
      },
    });
  }, []);

  const X = (v: number) => PAD + v * S;
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const gridStep = 100 * S;
  const vLines = gridStep > 0 ? Math.ceil(size.w / gridStep) : 0;
  const hLines = gridStep > 0 ? Math.ceil(size.h / gridStep) : 0;

  return (
    <View style={styles.wrap} onLayout={onLayout} {...pan.panHandlers}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} pointerEvents="none">
          {Array.from({ length: vLines }, (_, i) => (
            <Line key={`v${i}`} x1={X(i * 100)} y1={0} x2={X(i * 100)} y2={size.h} stroke={colors.line} strokeWidth={1} />
          ))}
          {Array.from({ length: hLines }, (_, i) => (
            <Line key={`h${i}`} x1={0} y1={X(i * 100)} x2={size.w} y2={X(i * 100)} stroke={colors.line} strokeWidth={1} />
          ))}

          {project.items.map((it) => {
            const c = CATALOG[it.kind];
            const pos = drag && drag.id === it.id ? drag : it;
            const sel = it.id === selectedId;
            return (
              <G key={it.id} transform={`translate(${X(pos.x)} ${X(pos.y)}) rotate(${it.rot})`}>
                <Rect
                  x={(-c.w * S) / 2}
                  y={(-c.d * S) / 2}
                  width={c.w * S}
                  height={c.d * S}
                  rx={4}
                  fill={c.color}
                  fillOpacity={it.kind === 'rug' ? 0.55 : 0.92}
                  stroke={sel ? colors.accent : 'rgba(0,0,0,0.35)'}
                  strokeWidth={sel ? 3 : 1}
                />
                <SvgText y={3} fontSize={10} fill={colors.ink} textAnchor="middle">
                  {c.label}
                </SvgText>
              </G>
            );
          })}

          {project.walls.map((w) => {
            const mx = X((w.a.x + w.b.x) / 2);
            const my = X((w.a.y + w.b.y) / 2);
            return (
              <G key={w.id}>
                <Line
                  x1={X(w.a.x)}
                  y1={X(w.a.y)}
                  x2={X(w.b.x)}
                  y2={X(w.b.y)}
                  stroke={colors.wall}
                  strokeWidth={Math.max(4, 12 * S)}
                  strokeLinecap="round"
                />
                <SvgText x={mx} y={my - 8} fontSize={10} fill={colors.muted} textAnchor="middle">
                  {(dist(w.a, w.b) / 100).toFixed(2)} m
                </SvgText>
              </G>
            );
          })}

          {preview && (
            <Line
              x1={X(preview.a.x)}
              y1={X(preview.a.y)}
              x2={X(preview.b.x)}
              y2={X(preview.b.y)}
              stroke={colors.accent}
              strokeWidth={4}
              strokeDasharray="6 6"
            />
          )}
          {pending && <Circle cx={X(pending.x)} cy={X(pending.y)} r={7} fill={colors.accent} />}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface },
});
