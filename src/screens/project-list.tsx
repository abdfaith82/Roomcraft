import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { roomStats } from '@/geometry';
import type { ScreenProps } from '@/navigation';
import { useProjects } from '@/store';
import { colors, radius, spacing } from '@/theme';

export function ProjectList({ navigation }: ScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const projects = useProjects((s) => s.projects);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.md }]}>
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No rooms yet. Create one to start drawing a floor plan.</Text>
        }
        renderItem={({ item }) => {
          const stats = roomStats(item);
          return (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('Editor', { id: item.id })}
              onLongPress={() =>
                Alert.alert('Delete room?', item.name, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => useProjects.getState().deleteProject(item.id),
                  },
                ])
              }
            >
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>
                {stats.areaM2.toFixed(1)} m² · {item.items.length} items
                {item.style ? ` · ${item.style.name}` : ''}
              </Text>
            </Pressable>
          );
        }}
      />
      <View style={styles.cta}>
        <Button
          label="New room"
          variant="primary"
          onPress={() => navigation.navigate('Editor', { id: useProjects.getState().createProject() })}
        />
        <Text style={styles.tip}>Long-press a room to delete it.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { color: colors.muted, marginTop: spacing.xs },
  cta: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  tip: { color: colors.muted, fontSize: 12 },
});
