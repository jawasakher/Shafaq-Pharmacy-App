import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { logout } from '@/lib/auth';

export default function DeliveryAccountScreen() {
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>حساب السائق</ThemedText>
            <ThemedText style={styles.subtitle}>إدارة الحساب وحالة التواجد</ThemedText>
          </View>

          <ShafaqCard variant="elevated" style={styles.card}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarEmoji}>🚗</ThemedText>
            </View>
            <ThemedText style={styles.profileName}>سائق توصيل معتمد</ThemedText>
            <ThemedText style={styles.profileRole}>جاهز لاستقبال الطلبات • متاح</ThemedText>

            <View style={styles.divider} />

            <PrimaryButton title="تسجيل الخروج" onPress={handleLogout} />
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
    paddingVertical: 32,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDF7FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16485C',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#D9EEF4',
    marginBottom: 24,
  },
});
