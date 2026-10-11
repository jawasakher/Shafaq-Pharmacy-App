import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiRequest } from '@/services/api-client';

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  };
};

export default function AdminAuditLogsScreen() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        success: boolean;
        data: { items: AuditLogItem[] };
      }>('/admin/audit-logs');

      if (res.success && res.data?.items) {
        setLogs(res.data.items);
      }
    } catch {
      // Ignore load error if offline
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAuditLogs();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchAuditLogs} />
          }
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>سجل أحداث وتدقيق النظام</ThemedText>
            <ThemedText style={styles.subtitle}>تتبع العمليات والأحداث التشغيلية للحسابات</ThemedText>
          </View>

          {logs.length === 0 ? (
            <ShafaqCard variant="elevated" style={styles.emptyCard}>
              <ThemedText style={styles.emptyTitle}>لا توجد أحداث مسجلة حالياً</ThemedText>
              <ThemedText style={styles.emptyDesc}>
                يتم تسجيل عمليات تسجيل الدخول والخروج وتغييرات الصلاحيات تلقائياً في هذا السجل.
              </ThemedText>
            </ShafaqCard>
          ) : (
            <View style={styles.logsList}>
              {logs.map((item) => (
                <ShafaqCard key={item.id} variant="elevated" style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <ThemedText style={styles.actionText}>{item.action}</ThemedText>
                    <ThemedText style={styles.timeText}>
                      {new Date(item.createdAt).toLocaleTimeString('ar-SY')}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.entityText}>
                    الكيان: {item.entityType} ({item.entityId.slice(0, 8)})
                  </ThemedText>
                  {item.actor && (
                    <ThemedText style={styles.actorText}>
                      بواسطة: {item.actor.name || item.actor.id} ({item.actor.role})
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
  logsList: {
    gap: 12,
  },
  logCard: {
    borderColor: '#D9EEF4',
    gap: 6,
  },
  logHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16485C',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  entityText: {
    fontSize: 12,
    color: '#688795',
    textAlign: 'right',
  },
  actorText: {
    fontSize: 12,
    color: '#087EA4',
    textAlign: 'right',
  },
});
