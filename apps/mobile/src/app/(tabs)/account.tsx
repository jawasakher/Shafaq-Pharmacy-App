
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { logout } from '@/lib/auth';

const menuItems = [
  {
    title: 'بياناتي الشخصية',
    subtitle: 'إدارة معلوماتك الشخصية',
    icon: '♙',
    onPress: () => router.push('/personal-data'),
  },
  {
    title: 'عناويني',
    subtitle: 'إدارة عناوين التوصيل',
    icon: '⌂',
    onPress: () => router.push('/addresses'),
  },
  {
    title: 'الإشعارات',
    subtitle: 'إدارة إشعارات التطبيق',
    icon: '♧',
    onPress: () => router.push('/notifications'),
  },
  {
    title: 'الخصوصية والأمان',
    subtitle: 'حماية بياناتك وإعدادات الخصوصية',
    icon: '◇',
    onPress: () => router.push('/privacy-security'),
  },
  {
    title: 'المساعدة والدعم',
    subtitle: 'الأسئلة الشائعة والدعم',
    icon: '?',
    onPress: () => router.push('/help-support'),
  },
];

export default function AccountScreen() {
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد تسجيل الخروج من حسابك',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
    );
  };

  const performLogout = async () => {
    try {
      await logout();

      router.replace('/');
    } catch {
      Alert.alert(
        'تعذر تسجيل الخروج',
        'حدثت مشكلة أثناء تسجيل الخروج حاول مرة أخرى',
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>حسابي</Text>

          <Text style={styles.subtitle}>
            إدارة حسابك وإعداداتك
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>ش</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.welcome}>
              مرحبًا بك في شَفَق
            </Text>

            <Text style={styles.profileSubtitle}>
              إدارة معلوماتك الشخصية
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>
                  {item.icon}
                </Text>
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>
                  {item.title}
                </Text>

                <Text style={styles.menuSubtitle}>
                  {item.subtitle}
                </Text>
              </View>

              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.brandCard}>
          <Text style={styles.brandName}>شَفَق</Text>

          <Text style={styles.brandSlogan}>
            نورُ الرعاية
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>
            تسجيل الخروج
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          الإصدار 1.0
        </Text>
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
    paddingTop: 58,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#5F929C',
    textAlign: 'right',
  },

  subtitle: {
    fontSize: 14,
    color: '#83AAB2',
    marginTop: 5,
    textAlign: 'right',
  },

  profileCard: {
    backgroundColor: '#D7F3F7',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#45B8CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  welcome: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5F929C',
    textAlign: 'right',
  },

  profileSubtitle: {
    fontSize: 13,
    color: '#719EA7',
    marginTop: 5,
    textAlign: 'right',
  },

  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E1F4F7',
  },

  menuItem: {
    minHeight: 72,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF8FA',
  },

  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D7F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 13,
  },

  menuIconText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#45B8CC',
  },

  menuTextContainer: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6899A3',
    textAlign: 'right',
  },

  menuSubtitle: {
    fontSize: 12,
    color: '#83AAB2',
    marginTop: 4,
    textAlign: 'right',
  },

  arrow: {
    fontSize: 26,
    color: '#9DDFE9',
    marginLeft: 4,
  },

  brandCard: {
    backgroundColor: '#D7F3F7',
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
  },

  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#45B8CC',
  },

  brandSlogan: {
    fontSize: 13,
    color: '#719EA7',
    marginTop: 3,
  },

  logoutButton: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1F4F7',
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78AEB8',
  },

  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9ABCC2',
    marginTop: 12,
  },
});
