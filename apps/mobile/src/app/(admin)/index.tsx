import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiRequest } from '@/services/api-client';

type MetricsData = {
  usersByRole: Record<string, number>;
  ordersByStatus: Record<string, number>;
  driversByAvailability: Record<string, number>;
  pharmaciesByApproval: Record<string, number>;
  consultationsByStatus: Record<string, number>;
};

export default function AdminDashboardScreen() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        success: boolean;
        data: MetricsData;
      }>('/admin/dashboard/metrics');

      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch {
      // Ignore load errors if offline
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMetrics();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchMetrics} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>لوحة التحكم الفائقة (Super Admin)</ThemedText>
            <ThemedText style={styles.subtitle}>مراقبة الأنشطة والمؤشرات التشغيلية للمنصة</ThemedText>
          </View>

          {/* Users Grid */}
          <ThemedText style={styles.sectionTitle}>المستخدمين حسب الدور</ThemedText>
          <View style={styles.grid}>
            <ShafaqCard variant="tinted" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.usersByRole?.CUSTOMER || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>العملاء</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.usersByRole?.PHARMACIST || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>الصيادلة</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.usersByRole?.DRIVER || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>السائقين</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.usersByRole?.ADMIN || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>المشرفين</ThemedText>
            </ShafaqCard>
          </View>

          {/* Operational Status Grid */}
          <ThemedText style={styles.sectionTitle}>مؤشرات الصيدليات والتوصيل</ThemedText>
          <View style={styles.grid}>
            <ShafaqCard variant="elevated" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.pharmaciesByApproval?.PENDING_APPROVAL || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>طلبات معلقة</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="elevated" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.driversByAvailability?.AVAILABLE || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>سائقين متاحين</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="elevated" style={styles.card}>
              <ThemedText style={styles.cardNumber}>{metrics?.consultationsByStatus?.REQUESTED || 0}</ThemedText>
              <ThemedText style={styles.cardLabel}>استشارات تنتظر الإسناد</ThemedText>
            </ShafaqCard>
          </View>
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
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16485C',
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16485C',
    textAlign: 'right',
    marginTop: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 18,
    borderColor: '#BDE8EF',
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#087EA4',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#688795',
    textAlign: 'center',
  },
});
