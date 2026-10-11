import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ThemedText style={styles.backText}>رجوع</ThemedText>
      </Pressable>
      <View style={styles.titleContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  titleContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16485C',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'right',
    marginTop: 2,
  },
  backButton: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FAFD',
    borderWidth: 1,
    borderColor: '#D9EEF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16485C',
  },
});
