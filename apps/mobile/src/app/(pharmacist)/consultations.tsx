import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ShafaqCard } from '@/components/ui/shafaq-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiRequest } from '@/services/api-client';

type ConsultationItem = {
  id: string;
  symptoms: string;
  status: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
};

export default function PharmacistConsultationsScreen() {
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        success: boolean;
        data: ConsultationItem[];
      }>('/pharmacy/consultations');

      if (res.success && Array.isArray(res.data)) {
        setConsultations(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id);
          fetchMessages(res.data[0].id);
        }
      }
    } catch {
      // Ignore load error if offline
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: ChatMessage[];
      }>(`/consultations/${id}/messages`);

      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch {
      // Ignore load error if offline
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConsultations();
    }, [])
  );

  const handleSelectConsultation = (id: string) => {
    setSelectedId(id);
    fetchMessages(id);
  };

  const handleSendReply = async () => {
    if (!selectedId) return;
    if (!replyText.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة نص الرد الطبي');
      return;
    }

    try {
      setSending(true);
      const res = await apiRequest<{
        success: boolean;
        data: ChatMessage;
      }>({
        path: `/consultations/${selectedId}/messages`,
        method: 'POST',
        body: JSON.stringify({ content: replyText.trim() }),
      } as any);

      if (res.success) {
        setReplyText('');
        fetchMessages(selectedId);
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إرسال الرد الطبي');
    } finally {
      setSending(false);
    }
  };

  const selectedItem = consultations.find((c) => c.id === selectedId);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchConsultations} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>استشارات العملاء الطبية (SRS v1.2)</ThemedText>
            <ThemedText style={styles.subtitle}>تقديم الإرشاد الصيدلاني الموثوق للمرضى</ThemedText>
          </View>

          {/* Metrics */}
          <View style={styles.metricsGrid}>
            <ShafaqCard variant="tinted" style={styles.metricCard}>
              <ThemedText style={styles.metricNumber}>{consultations.length}</ThemedText>
              <ThemedText style={styles.metricLabel}>استشارات نشطة</ThemedText>
            </ShafaqCard>
          </View>

          {/* Consultation List / Chat Workspace */}
          <View style={styles.workspace}>
            <View style={styles.listColumn}>
              {consultations.length === 0 ? (
                <ThemedText style={styles.emptyText}>لا توجد استشارات معلقة حالياً</ThemedText>
              ) : (
                consultations.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectConsultation(item.id)}
                    style={[
                      styles.consultationItem,
                      selectedId === item.id && styles.activeItem,
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.liveDot} />
                      <ThemedText style={styles.itemName}>
                        {item.customer?.name || item.customer?.phone || 'مريض'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.itemSnippet} numberOfLines={1}>
                      {item.symptoms}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </View>

            {/* Active Conversation Detail */}
            {selectedItem && (
              <ShafaqCard variant="elevated" style={styles.chatCard}>
                <View style={styles.chatHeader}>
                  <ThemedText style={styles.chatTitle}>محادثة الاستشارة الطبية</ThemedText>
                  <ThemedText style={styles.chatSub}>
                    المريض: {selectedItem.customer?.name || selectedItem.customer?.phone} • آمن ومشفّر
                  </ThemedText>
                </View>

                <View style={styles.messageBox}>
                  <View style={styles.patientBubble}>
                    <ThemedText style={styles.patientText}>
                      الأعراض: {selectedItem.symptoms}
                    </ThemedText>
                  </View>

                  {messages.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.msgBubble,
                        msg.sender?.role === 'CUSTOMER'
                          ? styles.patientBubble
                          : styles.pharmacistBubble,
                      ]}
                    >
                      <ThemedText style={styles.patientText}>{msg.content}</ThemedText>
                    </View>
                  ))}
                </View>

                <View style={styles.replyArea}>
                  <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="اكتب ردك الإرشادي هنا..."
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    textAlign="right"
                    multiline
                  />
                  <PrimaryButton
                    title={sending ? 'جاري الإرسال...' : 'إرسال الرد الطبي'}
                    onPress={handleSendReply}
                    disabled={sending}
                  />
                </View>
              </ShafaqCard>
            )}
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
  metricsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderColor: '#BDE8EF',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#087EA4',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#688795',
    textAlign: 'center',
  },
  workspace: {
    gap: 16,
  },
  listColumn: {
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#688795',
    textAlign: 'center',
    paddingVertical: 12,
  },
  consultationItem: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9EEF4',
  },
  activeItem: {
    borderColor: '#19A9CC',
    backgroundColor: '#F0FAFD',
  },
  itemHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16485C',
    textAlign: 'right',
  },
  itemSnippet: {
    fontSize: 13,
    color: '#688795',
    marginBottom: 6,
    textAlign: 'right',
  },
  chatCard: {
    borderColor: '#D9EEF4',
  },
  chatHeader: {
    marginBottom: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#D9EEF4',
    paddingBottom: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16485C',
    textAlign: 'right',
  },
  chatSub: {
    fontSize: 12,
    color: '#688795',
    textAlign: 'right',
    marginTop: 2,
  },
  messageBox: {
    marginBottom: 16,
    gap: 10,
  },
  msgBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: '85%',
  },
  patientBubble: {
    backgroundColor: '#E0F2FE',
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  pharmacistBubble: {
    backgroundColor: '#DDF7FC',
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  patientText: {
    fontSize: 14,
    color: '#16485C',
    textAlign: 'right',
    lineHeight: 20,
  },
  replyArea: {
    gap: 12,
  },
  input: {
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9EEF4',
    backgroundColor: '#F4FCFE',
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 15,
    color: '#16485C',
    textAlign: 'right',
    textAlignVertical: 'top',
  },
});
