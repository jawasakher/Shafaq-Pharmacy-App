
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: '1',
    title: 'تحديث طلبك',
    message: 'طلبك قيد مراجعة الصيدلية',
    time: 'منذ قليل',
    unread: true,
  },
  {
    id: '2',
    title: 'مرحبًا بك في شَفَق',
    message: 'يمكنك الآن طلب الأدوية والاستفادة من الاستشارة الصيدلانية',
    time: 'اليوم',
    unread: false,
  },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>الإشعارات</Text>

            <Text style={styles.subtitle}>
              آخر التحديثات والتنبيهات الخاصة بك
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {notifications.map((notification) => (
            <View
              key={notification.id}
              style={[
                styles.notificationCard,
                notification.unread && styles.unreadCard,
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>♧</Text>
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>

                  {notification.unread && (
                    <View style={styles.unreadDot} />
                  )}
                </View>

                <Text style={styles.message}>
                  {notification.message}
                </Text>

                <Text style={styles.time}>
                  {notification.time}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>تنبيهات شَفَق</Text>

          <Text style={styles.infoText}>
            ستظهر هنا تحديثات طلباتك والاستشارات وأهم التنبيهات
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FBFD',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 15,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: '#45B8CC',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#58A6B3',
    textAlign: 'right',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    color: '#7EA7AF',
    textAlign: 'right',
  },

  list: {
    marginTop: 25,
    gap: 12,
  },

  notificationCard: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  unreadCard: {
    backgroundColor: '#EAF9FB',
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#D7F3F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 22,
    color: '#45B8CC',
  },

  notificationContent: {
    flex: 1,
    marginLeft: 13,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  notificationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#58A6B3',
    textAlign: 'right',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#45B8CC',
    marginLeft: 7,
  },

  message: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#6899A3',
    textAlign: 'right',
  },

  time: {
    marginTop: 7,
    fontSize: 11,
    color: '#83AAB2',
    textAlign: 'right',
  },

  infoCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#D7F3F7',
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#58A6B3',
    textAlign: 'right',
  },

  infoText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 21,
    color: '#6899A3',
    textAlign: 'right',
  },
});

