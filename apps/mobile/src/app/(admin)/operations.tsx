import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiRequest } from '@/services/api-client';

type DeliveryItem = {
  id: string;
  orderId: string;
  status: string;
  driver?: {
    id: string;
    availability: string;
    currentLocation?: {
      recordedAt: string;
    };
  };
};

export default function AdminOperationsScreen() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        success: boolean;
        data: { items: DeliveryItem[] };
      }>('/admin/deliveries');

      if (res.success && res.data?.items) {
        setDeliveries(res.data.items);
      }
    } catch {
      // Ignore load error if offline
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchDeliveries} />
          }
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>المراقبة التشغيلية للتوصيل</ThemedText>
            <ThemedText style={styles.subtitle}>متابعة حالة الشحنات وتحديثات الموفرين</ThemedText>
          </View>

          {deliveries.length === 0 ? (
            <ShafaqCard variant="elevated" style={styles.emptyCard}>
              <ThemedText style={styles.emptyTitle}>لا توجد عملية توصيل نشطة حالياً</ThemedText>
              <ThemedText style={styles.emptyDesc}>
                تظهر هنا تحديثات الطلبات المسندة لسائقين أثناء مرحلة الاستلام والتسليم.
              </ThemedText>
            </ShafaqCard>
          ) : (
            <View style={styles.list}>
              {deliveries.map((item) => (
                <ShafaqCard key={item.id} variant="elevated" style={styles.card}>
                  <View style={styles.row}>
                    <ThemedText style={styles.titleText}>شحنة #{item.id.slice(0, 8)}</ThemedText>
                    <ThemedText style={styles.statusBadge}>{item.status}</ThemedText>
                  </View>

                  <ThemedText style={styles.subText}>طلب رقم: {item.orderId.slice(0, 8)}</ThemedText>

                  {item.driver?.currentLocation?.recordedAt && (
                    <ThemedText style={styles.timeText}>
                      آخر تحديث للموقع: {new Date(item.driver.currentLocation.recordedAt).toLocaleTimeString('ar-SY')}
                    </ThemedText>
                  )}
                </ShafaqCard>
              ))}
            </View>
          )}
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
  emptyCard: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16485C',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  card: {
    borderColor: '#D9EEF4',
    gap: 6,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16485C',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#19A9CC',
  },
  subText: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'right',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
});
