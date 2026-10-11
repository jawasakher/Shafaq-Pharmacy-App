import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PharmacistTransfersScreen() {
  const [activeTab, setActiveTab] = useState<'active' | 'initiate' | 'history'>('active');
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInitiateTransfer = () => {
    if (!orderId.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الطلب المراد تحويله');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('تم بنجاح', 'تم بث طلب التحويل إلى الصيدليات الشريكة المجاورة ضمن نطاق 10 كم بنجاح.');
      setOrderId('');
      setReason('');
      setActiveTab('active');
    }, 600);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>تحويلات الطلبات (SRS v1.2)</ThemedText>
            <ThemedText style={styles.subtitle}>نظام تحويل الطلبات بين الصيدليات الشريكة</ThemedText>
          </View>

          {/* Metric Overview */}
          <View style={styles.metricsGrid}>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>2</ThemedText>
              <ThemedText style={styles.metricLabel}>تحويلات نشطة</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>10 كم</ThemedText>
              <ThemedText style={styles.metricLabel}>نطاق التغطية</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>15 د</ThemedText>
              <ThemedText style={styles.metricLabel}>مهلة القبول</ThemedText>
            </ShafaqCard>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setActiveTab('active')}
              style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                التحويلات النشطة
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('initiate')}
              style={[styles.tabButton, activeTab === 'initiate' && styles.activeTab]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'initiate' && styles.activeTabText]}>
                تحويل طلب جديد
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('history')}
              style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                السجل
              </ThemedText>
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === 'active' && (
            <View style={styles.queueContainer}>
              <ShafaqCard variant="elevated" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeActive}>
                    <ThemedText style={styles.badgeText}>قيد الانتظار (معروض للصيدليات)</ThemedText>
                  </View>
                  <ThemedText style={styles.orderId}>طلب #SH-8491</ThemedText>
                </View>
                <View style={styles.cardDetails}>
                  <ThemedText style={styles.itemText}>• دواء غير متوفر: إنسولين لانتوس</ThemedText>
                  <ThemedText style={styles.timerText}>⏰ متبقي 12 دقيقة لقبول التحويل من صيدلية مجاورة</ThemedText>
                </View>
              </ShafaqCard>
            </View>
          )}

          {activeTab === 'initiate' && (
            <ShafaqCard variant="elevated" style={styles.card}>
              <ThemedText style={styles.sectionHeading}>إنشاء طلب تحويل جديد</ThemedText>
              <ThemedText style={styles.sectionSub}>
                وفق معيار SRS v1.2، يمكنك تحويل الطلبات المتعذر توفيرها بالكامل إلى أقرب صيدلية شريكة ضمن النطاق الجغرافي.
              </ThemedText>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>رقم الطلب</ThemedText>
                <TextInput
                  value={orderId}
                  onChangeText={setOrderId}
                  placeholder="#SH-xxxx"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  textAlign="right"
                />

                <ThemedText style={styles.label}>سبب التحويل</ThemedText>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="مثال: الدواء غير متوفر حالياً في المخزون"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  textAlign="right"
                  multiline
                />

                <View style={styles.spacer} />

                <PrimaryButton
                  title={loading ? 'جاري البث والتحويل...' : 'بث التحويل للصيدليات القريبة'}
                  onPress={handleInitiateTransfer}
                  disabled={loading}
                />
              </View>
            </ShafaqCard>
          )}

          {activeTab === 'history' && (
            <ShafaqCard variant="elevated" style={styles.card}>
              <ThemedText style={styles.cardTitle}>سجل التحويلات السابقة</ThemedText>
              <ThemedText style={styles.cardDesc}>
                تم بنجاح تحويل وإتمام 14 طلب سابق إلى صيدليات الشريك خلال هذا الشهر.
              </ThemedText>
            </ShafaqCard>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  metricsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderColor: '#BDE8EF',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#087EA4',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#688795',
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#19A9CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#688795',
  },
  activeTabText: {
    color: '#16485C',
  },
  queueContainer: {
    gap: 16,
  },
  card: {
    borderColor: '#D9EEF4',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeActive: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16485C',
  },
  cardDetails: {
    alignItems: 'flex-end',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16485C',
    marginBottom: 6,
    textAlign: 'right',
  },
  timerText: {
    fontSize: 12,
    color: '#087EA4',
    textAlign: 'right',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16485C',
    marginBottom: 6,
    textAlign: 'right',
  },
  sectionSub: {
    fontSize: 13,
    color: '#688795',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'right',
  },
  formGroup: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16485C',
    textAlign: 'right',
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9EEF4',
    backgroundColor: '#F4FCFE',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#16485C',
    textAlign: 'right',
  },
  spacer: {
    height: 8,
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
