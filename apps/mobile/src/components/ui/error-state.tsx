import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function ErrorState({
  message = 'حدث خطأ أثناء تحميل البيانات',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <ThemedText style={styles.icon}>⚠️</ThemedText>
      </View>
      <ThemedText style={styles.message}>{message}</ThemedText>
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry}>
          <ThemedText style={styles.buttonText}>إعادة المحاولة</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  message: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0284c7',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
