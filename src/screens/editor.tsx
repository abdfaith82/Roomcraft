import { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { FloorPlanCanvas } from '@/components/floor-plan-canvas';
import { CATALOG, KINDS } from '@/catalog';
import { roomStats } from '@/geometry';
import type { ScreenProps } from '@/navigation';
import { useProjects } from '@/store';
import { colors, spacing } from '@/theme';
import type { FurnitureKind, Tool } from '@/types';

export function Editor({ route, navigation }: ScreenProps<'Editor'>) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const project = useProjects((s) => s.projects.find((p) => p.id === id));
  const { addWall, undoWall, addItem, moveItem, rotateItem, removeItem } = useProjects.getState();

  const [tool, setTool] = useState<Tool>('wall');
  const [kind, setKind] = useState<FurnitureKind>('sofa');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.6);

  useLayoutEffect(() => {
    if (project) navigation.setOptions({ title: project.name });
  }, [navigation, project?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This project no longer exists.</Text>
      </View>
    );
  }

  const stats = roomStats(project);
  const selected = project.items.find((i) => i.id === selectedId);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.toolbar}>
        <Button label="Walls" active={tool === 'wall'} onPress={() => setTool('wall')} />
        <Button label="Move" active={tool === 'move'} onPress={() => setTool('move')} />
        <Button label="Furniture" active={tool === 'place'} onPress={() => setTool('place')} />
        <View style={{ flex: 1 }} />
        <Button label="−" onPress={() => setScale((s) => Math.max(0.25, s - 0.1))} />
        <Button label="+" onPress={() => setScale((s) => Math.min(1.4, s + 0.1))} />
      </View>

      {tool === 'place' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catalog}>
          {KINDS.map((k) => (
            <Button key={k} label={CATALOG[k].label} active={kind === k} onPress={() => setKind(k)} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.hint}>
        {tool === 'wall' && 'Drag to draw a wall, or tap two points to chain walls.'}
        {tool === 'move' && 'Tap furniture to select it, drag to move.'}
        {tool === 'place' && `Tap the plan to place a ${CATALOG[kind].label.toLowerCase()}.`}
      </Text>

      <FloorPlanCanvas
        project={project}
        scale={scale}
        tool={tool}
        kind={kind}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddWall={(a, b) => addWall(id, a, b)}
        onPlace={(at) => setSelectedId(addItem(id, kind, at))}
        onMoveItem={(itemId, at) => moveItem(id, itemId, at)}
      />

      <View style={styles.footer}>
        <Text style={styles.stats}>
          {stats.areaM2.toFixed(1)} m² · {stats.perimeterM.toFixed(1)} m of wall
        </Text>
        <View style={styles.row}>
          <Button label="Undo wall" disabled={project.walls.length === 0} onPress={() => undoWall(id)} />
          <Button label="Rotate" disabled={!selected} onPress={() => selected && rotateItem(id, selected.id, 90)} />
          <Button
            label="Delete"
            variant="danger"
            disabled={!selected}
            onPress={() => {
              if (selected) {
                removeItem(id, selected.id);
                setSelectedId(null);
              }
            }}
          />
        </View>
        <View style={styles.row}>
          <Button label="3D preview" variant="primary" onPress={() => navigation.navigate('Preview', { id })} />
          <Button label="AI styling" variant="primary" onPress={() => navigation.navigate('Style', { id })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  toolbar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, alignItems: 'center' },
  catalog: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  hint: { color: colors.muted, fontSize: 12, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  footer: { padding: spacing.md, gap: spacing.sm },
  stats: { color: colors.ink, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
