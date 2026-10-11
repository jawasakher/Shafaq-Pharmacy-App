import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PharmacistTransfersScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>تحويلات الطلبات</ThemedText>
            <ThemedText style={styles.subtitle}>إدارة وتحويل الطلبات بين الصيدليات القريبة وفق SRS v1.2</ThemedText>
          </View>

          <ShafaqCard variant="elevated" style={styles.card}>
            <ThemedText style={styles.cardTitle}>لا توجد تحويلات نشطة</ThemedText>
            <ThemedText style={styles.cardDesc}>
              يمكنك تحويل الطلبات غير المتوفرة إلى صيدليات شريك قريبة ضمن نطاق التغطية المعتمد.
            </ThemedText>
          </ShafaqCard>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FCFE',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16485C',
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#688795',
    textAlign: 'right',
  },
  card: {
    borderColor: '#D9EEF4',
    alignItems: 'center',
    paddingVertical: 36,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: '#16485C',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#688795',
    lineHeight: 22,
    textAlign: 'center',
  },
});
