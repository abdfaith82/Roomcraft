import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  active?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'ghost', active, disabled }: Props) {
  const filled = variant === 'primary' || active;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled && styles.filled,
        variant === 'danger' && styles.danger,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text
        style={[
          styles.label,
          filled && { color: colors.primaryInk },
          variant === 'danger' && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: colors.primary, borderColor: colors.primary },
  danger: { borderColor: colors.danger },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600' },
});
