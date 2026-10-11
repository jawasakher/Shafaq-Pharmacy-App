import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على عناصر لعرضها في الوقت الحالي',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <ThemedText style={styles.icon}>📭</ThemedText>
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.description}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
