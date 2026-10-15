import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <ThemedText style={styles.title}>{title}</ThemedText>
    </Pressable>
  );
}

import { Fonts } from '@/constants/theme';

const styles = StyleSheet.create({
  button: {
    height: 48, // 48px touch target for accessibility
    borderRadius: 8, // 8px rounded corners as per spec
    backgroundColor: '#19A9CC', // Primary Cyan
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#19A9CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.rounded,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
