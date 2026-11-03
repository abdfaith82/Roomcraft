import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyze, type Analysis } from '@/ai/suggest-style';
import { Button } from '@/components/button';
import type { ScreenProps } from '@/navigation';
import { useProjects } from '@/store';
import { colors, radius, spacing } from '@/theme';

export function StyleScreen({ route }: ScreenProps<'Style'>) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const project = useProjects((s) => s.projects.find((p) => p.id === id));
  const [result, setResult] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!project) return;
    const ctrl = new AbortController();
    analyze(project, ctrl.signal).then((r) => {
      if (!ctrl.signal.aborted) setResult(r);
    });
    return () => ctrl.abort();
    // Re-run only when the project's content changes, not on style apply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.items, project?.walls]);

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This project no longer exists.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {!result ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={styles.heading}>Layout tips</Text>
          {result.tips.map((t) => (
            <Text key={t} style={styles.tip}>
              • {t}
            </Text>
          ))}

          <Text style={[styles.heading, { marginTop: spacing.lg }]}>Style palettes</Text>
          {result.styles.map((s) => {
            const applied = project.style?.name === s.name;
            return (
              <View key={s.name} style={styles.card}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <View style={styles.swatches}>
                  {s.palette.map((c) => (
                    <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                  ))}
                </View>
                {s.notes.map((n) => (
                  <Text key={n} style={styles.note}>
                    {n}
                  </Text>
                ))}
                <Button
                  label={applied ? 'Applied (tap to remove)' : 'Apply to 3D preview'}
                  variant={applied ? 'ghost' : 'primary'}
                  onPress={() => useProjects.getState().setStyle(id, applied ? undefined : s)}
                />
              </View>
            );
          })}
          <Text style={styles.source}>
            {result.source === 'remote' ? 'Suggestions from your styling service.' : 'Built-in suggestions, generated on this device.'}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink },
  tip: { color: colors.ink, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  swatches: { flexDirection: 'row', gap: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line },
  note: { color: colors.muted },
  source: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
});
