import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const LOCATION_KEY = '@shafaq_location_enabled';
const NOTIFICATIONS_KEY = '@shafaq_notifications_enabled';

type InfoType = 'data' | 'consultation' | null;

export default function PrivacySecurityScreen() {
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeInfo, setActiveInfo] = useState<InfoType>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_KEY);
      const savedNotifications = await AsyncStorage.getItem(
        NOTIFICATIONS_KEY,
      );

      if (savedLocation !== null) {
        setLocationEnabled(savedLocation === 'true');
      }

      if (savedNotifications !== null) {
        setNotificationsEnabled(savedNotifications === 'true');
      }
    } catch (error) {
      console.log('Error loading privacy settings', error);
    }
  };

  const handleLocationChange = async (value: boolean) => {
    setLocationEnabled(value);

    try {
      await AsyncStorage.setItem(
        LOCATION_KEY,
        String(value),
      );
    } catch (error) {
      console.log('Error saving location setting', error);
    }
  };

  const handleNotificationsChange = async (value: boolean) => {
    setNotificationsEnabled(value);

    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        String(value),
      );
    } catch (error) {
      console.log('Error saving notification setting', error);
    }
  };

  const closeInfo = () => {
    setActiveInfo(null);
  };

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
            <Text style={styles.title}>الخصوصية والأمان</Text>

            <Text style={styles.subtitle}>
              حماية بياناتك ومعلومات حسابك
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات الخصوصية</Text>

          <View style={styles.settingCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⌖</Text>
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>مشاركة الموقع</Text>

              <Text style={styles.settingText}>
                السماح باستخدام موقعك لتحديد خيارات التوصيل المناسبة
              </Text>
            </View>

            <Switch
              value={locationEnabled}
              onValueChange={handleLocationChange}
              trackColor={{
                false: '#D7F3F7',
                true: '#9DDFE9',
              }}
              thumbColor="#45B8CC"
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>♧</Text>
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>الإشعارات</Text>

              <Text style={styles.settingText}>
                السماح باستقبال تحديثات الطلبات والتنبيهات
              </Text>
            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsChange}
              trackColor={{
                false: '#D7F3F7',
                true: '#9DDFE9',
              }}
              thumbColor="#45B8CC"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بياناتك الشخصية</Text>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => setActiveInfo('data')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>♙</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>حماية معلوماتك</Text>

                <Text style={styles.arrow}>‹</Text>
              </View>

              <Text style={styles.cardText}>
                نستخدم بياناتك لتقديم خدمات شَفَق وتحسين تجربة استخدامك
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الاستشارات الصيدلانية</Text>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => setActiveInfo('consultation')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>♧</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>خصوصية الاستشارة</Text>

                <Text style={styles.arrow}>‹</Text>
              </View>

              <Text style={styles.cardText}>
                محادثاتك مع الصيدلي خاصة ولا تظهر لمستخدمي التطبيق الآخرين
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>أمان حسابك</Text>

          <Text style={styles.infoText}>
            لا تشارك رمز التحقق أو معلومات الدخول مع أي شخص
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={activeInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={closeInfo}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>
                {activeInfo === 'data' ? '♙' : '♧'}
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              {activeInfo === 'data'
                ? 'حماية معلوماتك'
                : 'خصوصية الاستشارة'}
            </Text>

            <Text style={styles.modalText}>
              {activeInfo === 'data'
                ? 'يتم استخدام بياناتك الشخصية لتقديم خدمات شَفَق وإدارة طلباتك وعناوين التوصيل وتحسين تجربتك داخل التطبيق'
                : 'محادثاتك مع الصيدلي مخصصة للاستشارة الخاصة بك ولا تظهر لمستخدمي التطبيق الآخرين'}
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.8}
              onPress={closeInfo}
            >
              <Text style={styles.closeButtonText}>حسنًا</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 27,
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

  section: {
    marginTop: 25,
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '800',
    color: '#6899A3',
    textAlign: 'right',
  },

  settingCard: {
    marginBottom: 12,
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingContent: {
    flex: 1,
    marginLeft: 13,
    marginRight: 12,
    alignItems: 'flex-end',
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#58A6B3',
    textAlign: 'right',
  },

  settingText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 19,
    color: '#6899A3',
    textAlign: 'right',
  },

  card: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  cardContent: {
    flex: 1,
    marginLeft: 13,
    alignItems: 'flex-end',
  },

  cardTitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#58A6B3',
    textAlign: 'right',
  },

  arrow: {
    marginRight: 8,
    fontSize: 22,
    color: '#45B8CC',
  },

  cardText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 21,
    color: '#6899A3',
    textAlign: 'right',
  },

  infoCard: {
    marginTop: 20,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  modalCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  modalIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#D7F3F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalIconText: {
    fontSize: 27,
    color: '#45B8CC',
  },

  modalTitle: {
    marginTop: 15,
    fontSize: 19,
    fontWeight: '800',
    color: '#58A6B3',
    textAlign: 'center',
  },

  modalText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 23,
    color: '#6899A3',
    textAlign: 'center',
  },

  closeButton: {
    width: '100%',
    height: 52,
    marginTop: 20,
    borderRadius: 17,
    backgroundColor: '#45B8CC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
