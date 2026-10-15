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

import { Fonts } from '@/constants/theme';

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
    fontFamily: Fonts.mono, // using mono mapped to Tajawal_900Black
    color: '#16485C',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: '#688795',
    textAlign: 'right',
    marginTop: 2,
  },
  backButton: {
    paddingHorizontal: 14,
    height: 48, // Accessibility standard
    borderRadius: 8,
    backgroundColor: '#F4FCFE',
    borderWidth: 1,
    borderColor: '#D9EEF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  backText: {
    fontSize: 14,
    fontFamily: Fonts.rounded,
    color: '#16485C',
  },
});
