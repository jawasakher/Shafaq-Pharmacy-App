import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiRequest } from '@/services/api-client';

type DeliveryOffer = {
  id: string;
  deliveryId: string;
  status: string;
  delivery: {
    pickupAddress: string;
    dropoffAddress: string;
    order: {
      id: string;
      totalAmount: number;
    };
  };
};

export default function DeliveryTasksScreen() {
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        success: boolean;
        data: DeliveryOffer[];
      }>('/driver/offers');

      if (res.success && Array.isArray(res.data)) {
        setOffers(res.data);
      }
    } catch {
      // Ignore initial load error if offline
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOffers();
    }, [])
  );

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setActionId(offerId);
      const res = await apiRequest<{ success: boolean }>({
        path: `/driver/offers/${offerId}/accept`,
      } as any);

      if (res.success) {
        Alert.alert('نجاح', 'تم قبول طلب التوصيل بنجاح');
        fetchOffers();
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل قبول طلب التوصيل');
    } finally {
      setActionId(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchOffers} />
          }
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>مهام التوصيل المتاحة</ThemedText>
            <ThemedText style={styles.subtitle}>استقبال وقبول عروض التوصيل القريبة</ThemedText>
          </View>

          {offers.length === 0 ? (
            <ShafaqCard variant="elevated" style={styles.card}>
              <ThemedText style={styles.cardTitle}>لا توجد مهام جديدة حالياً</ThemedText>
              <ThemedText style={styles.cardDesc}>
                ستظهر هنا طلبات التوصيل الجاهزة للاستلام فور توفرها في نطاق منطقتك الجغرافية.
              </ThemedText>
            </ShafaqCard>
          ) : (
            <View style={styles.offersList}>
              {offers.map((item) => (
                <ShafaqCard key={item.id} variant="elevated" style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <ThemedText style={styles.orderBadge}>طلب #{item.delivery.order.id.slice(0, 8)}</ThemedText>
                    <ThemedText style={styles.amountText}>{item.delivery.order.totalAmount} ل.س</ThemedText>
                  </View>

                  <View style={styles.routeContainer}>
                    <ThemedText style={styles.routeLabel}>من: {item.delivery.pickupAddress}</ThemedText>
                    <ThemedText style={styles.routeLabel}>إلى: {item.delivery.dropoffAddress}</ThemedText>
                  </View>

                  <PrimaryButton
                    title={actionId === item.id ? 'جاري القبول...' : 'قبول التوصيل'}
                    onPress={() => handleAcceptOffer(item.id)}
                    disabled={actionId === item.id}
                  />
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
  offersList: {
    gap: 16,
  },
  offerCard: {
    borderColor: '#BDE8EF',
    gap: 12,
  },
  offerHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadge: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16485C',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#19A9CC',
  },
  routeContainer: {
    gap: 6,
    paddingVertical: 4,
  },
  routeLabel: {
    fontSize: 13,
    color: '#4B6B78',
    textAlign: 'right',
  },
});
