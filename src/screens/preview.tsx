import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { IsoView } from '@/components/iso-view';
import type { ScreenProps } from '@/navigation';
import { useProjects } from '@/store';
import { colors, spacing } from '@/theme';

export function Preview({ route }: ScreenProps<'Preview'>) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const project = useProjects((s) => s.projects.find((p) => p.id === id));
  const [angle, setAngle] = useState(35);

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This project no longer exists.</Text>
      </View>
    );
  }

  const empty = project.walls.length === 0 && project.items.length === 0;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {empty ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Draw some walls or add furniture first.</Text>
        </View>
      ) : (
        <IsoView project={project} angle={angle} onAngle={setAngle} />
      )}
      <View style={styles.bar}>
        <Button label="⟲ 15°" onPress={() => setAngle((a) => a - 15)} />
        <Text style={styles.hint}>Drag to rotate</Text>
        <Button label="15° ⟳" onPress={() => setAngle((a) => a + 15)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  hint: { color: colors.muted, fontSize: 12 },
});
