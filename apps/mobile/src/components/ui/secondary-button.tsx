import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function SecondaryButton({
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

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#DDF7FC',
    borderWidth: 1,
    borderColor: '#65D7E8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#087EA4',
    textAlign: 'center',
  },
});
