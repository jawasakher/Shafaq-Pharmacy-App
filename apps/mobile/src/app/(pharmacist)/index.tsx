import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShafaqCard } from '@/components/ui/shafaq-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PharmacistDashboardScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'completed'>('pending');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header & Status Toggle */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>لوحة تحكم الصيدلية</ThemedText>
              <ThemedText style={styles.subtitle}>إدارة الوصفات والطلبات وفق SRS v1.2</ThemedText>
            </View>

            <Pressable
              onPress={() => setIsOpen(!isOpen)}
              style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}
            >
              <View style={[styles.statusDot, isOpen ? styles.openDot : styles.closedDot]} />
              <ThemedText style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
                {isOpen ? 'الصيدلية مفتوحة' : 'الصيدلية مغلقة'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Metrics Overview */}
          <View style={styles.metricsGrid}>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>12</ThemedText>
              <ThemedText style={styles.metricLabel}>طلبات جديدة</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>5</ThemedText>
              <ThemedText style={styles.metricLabel}>قيد التجهيز</ThemedText>
            </ShafaqCard>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>34</ThemedText>
              <ThemedText style={styles.metricLabel}>تم تسليمها اليوم</ThemedText>
            </ShafaqCard>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setActiveTab('pending')}
              style={[styles.tabButton, activeTab === 'pending' && styles.activeTab]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                المراجعة والطلبات الواردة
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('preparing')}
              style={[styles.tabButton, activeTab === 'preparing' && styles.activeTab]}
            >
              <ThemedText style={[styles.tabText, activeTab === 'preparing' && styles.activeTabText]}>
                قيد التجهيز والصرف
              </ThemedText>
            </Pressable>
          </View>

          {/* Orders Queue / Sample Orders */}
          <View style={styles.queueContainer}>
            <ShafaqCard variant="elevated" style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.badgePending}>
                  <ThemedText style={styles.badgeText}>بانتظار التسعير</ThemedText>
                </View>
                <ThemedText style={styles.orderId}>طلب #SH-8492</ThemedText>
              </View>

              <View style={styles.orderDetails}>
                <ThemedText style={styles.customerName}>العميل: أحمد محمد</ThemedText>
                <ThemedText style={styles.medicineList}>• أوميبرازول 20 ملغ (عبوة واحدة){'\n'}• باراسيتامول 500 ملغ (عبوتان)</ThemedText>
                <ThemedText style={styles.timestamp}>منذ 8 دقائق • تم إرفاق روشتة طبية</ThemedText>
              </View>

              <View style={styles.actionRow}>
                <PrimaryButton title="تقديم عرض السعر" onPress={() => {}} />
              </View>
            </ShafaqCard>

            <ShafaqCard variant="elevated" style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.badgeReview}>
                  <ThemedText style={styles.badgeText}>مراجعة روشتة</ThemedText>
                </View>
                <ThemedText style={styles.orderId}>طلب #SH-8490</ThemedText>
              </View>

              <View style={styles.orderDetails}>
                <ThemedText style={styles.customerName}>العميل: سارة أحمد</ThemedText>
                <ThemedText style={styles.medicineList}>• مضاد حيوي أوجمنتين 1g{'\n'}• فيتامين سي فوار</ThemedText>
                <ThemedText style={styles.timestamp}>منذ 15 دقيقة • بانتظار الاعتماد الصيدلي</ThemedText>
              </View>

              <View style={styles.actionRow}>
                <PrimaryButton title="مراجعة واعتماد" onPress={() => {}} />
              </View>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  openBadge: {
    backgroundColor: '#E1F8EC',
    borderColor: '#10b981',
  },
  closedBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  openDot: {
    backgroundColor: '#10b981',
  },
  closedDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  openText: {
    color: '#047857',
  },
  closedText: {
    color: '#B91C1C',
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
    fontSize: 22,
    fontWeight: '900',
    color: '#087EA4',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#688795',
  },
  activeTabText: {
    color: '#16485C',
  },
  queueContainer: {
    gap: 16,
  },
  orderCard: {
    borderColor: '#D9EEF4',
  },
  orderHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgePending: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeReview: {
    backgroundColor: '#DDF7FC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#087EA4',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16485C',
  },
  orderDetails: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16485C',
    marginBottom: 6,
    textAlign: 'right',
  },
  medicineList: {
    fontSize: 13,
    color: '#688795',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  actionRow: {
    width: '100%',
  },
});
