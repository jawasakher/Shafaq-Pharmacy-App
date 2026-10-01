import { StyleSheet, Pressable, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <ThemedText style={styles.greeting}>
                  أهلًا بك في
                </ThemedText>

                <ThemedText style={styles.appName}>
                  شَفَق
                </ThemedText>

                <ThemedText style={styles.brandSubtitle}>
                  نورُ الرعاية
                </ThemedText>
              </View>

              <View style={styles.locationBadge}>
                <ThemedText style={styles.locationIcon}>
                  ⌖
                </ThemedText>
              </View>
            </View>

            {/* Hero */}
            <View style={styles.heroCard}>
              <View style={styles.heroGlow} />

              <ThemedText style={styles.heroSmallText}>
                رعاية تبدأ منك
              </ThemedText>

              <ThemedText style={styles.heroTitle}>
                لأن صحتك أمانة
                {'\n'}
                نضع الرعاية بين يديك
              </ThemedText>

              <ThemedText style={styles.heroDescription}>
                اطلب دواءك من صيدلية موثوقة أو تحدث مع صيدلي
                للحصول على الإرشاد الذي تحتاجه
              </ThemedText>
            </View>

            {/* Main Actions */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                كيف يمكننا مساعدتك
              </ThemedText>

              {/* Order Medicine */}
              <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
              >
                <View style={styles.actionIcon}>
                  <ThemedText style={styles.actionIconText}>
                    +
                  </ThemedText>
                </View>

                <View style={styles.buttonContent}>
                  <ThemedText style={styles.primaryButtonTitle}>
                    اطلب دواءك
                  </ThemedText>

                  <ThemedText style={styles.primaryButtonText}>
                    اختر صيدلية وأرسل طلبك
                  </ThemedText>
                </View>

                <ThemedText style={styles.arrow}>
                  ←
                </ThemedText>
              </Pressable>

              {/* Consultation */}
              <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
              >
                <View style={styles.secondaryIcon}>
                  <ThemedText style={styles.secondaryIconText}>
                    ?
                  </ThemedText>
                </View>

                <View style={styles.buttonContent}>
                  <ThemedText style={styles.secondaryButtonTitle}>
                    استشر صيدليًا
                  </ThemedText>

                  <ThemedText style={styles.secondaryButtonText}>
                    تحدث مع صيدلي واحصل على الإرشاد
                  </ThemedText>
                </View>

                <ThemedText style={styles.arrowSecondary}>
                  ←
                </ThemedText>
              </Pressable>
            </View>

            {/* Location */}
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <View style={styles.locationContent}>
                  <ThemedText style={styles.locationTitle}>
                    موقع التوصيل
                  </ThemedText>

                  <ThemedText style={styles.locationText}>
                    سيتم تحديد موقعك الحالي تلقائيًا
                  </ThemedText>
                </View>

                <View style={styles.smallLocationIcon}>
                  <ThemedText style={styles.smallLocationIconText}>
                    ⌖
                  </ThemedText>
                </View>
              </View>

              <Pressable style={styles.locationButton}>
                <ThemedText style={styles.changeLocation}>
                  استخدام موقعي الحالي
                </ThemedText>

                <ThemedText style={styles.locationArrow}>
                  ←
                </ThemedText>
              </Pressable>
            </View>

            {/* Trust */}
            <View style={styles.trustSection}>
              <View style={styles.trustLine} />

              <ThemedText style={styles.trustText}>
                رعاية هادئة وخدمة تصل إليك باهتمام
              </ThemedText>

              <View style={styles.trustLine} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FBFD',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* Header */

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    alignItems: 'flex-end',
  },

  greeting: {
    fontSize: 14,
    color: '#78AEB8',
    marginBottom: 2,
    textAlign: 'right',
  },

  appName: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#45B8CC',
    textAlign: 'right',
  },

  brandSubtitle: {
    fontSize: 12,
    color: '#78AEB8',
    marginTop: 2,
    textAlign: 'right',
  },

  locationBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7F3F7',
    borderWidth: 1,
    borderColor: '#9DDFE9',
  },

  locationIcon: {
    fontSize: 23,
    color: '#45B8CC',
  },

  /* Hero */

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 27,
    marginBottom: 28,
    backgroundColor: '#D7F3F7',
    borderWidth: 1,
    borderColor: '#9DDFE9',
  },

  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -60,
    top: -70,
    backgroundColor: '#9DDFE9',
    opacity: 0.55,
  },

  heroSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#69AAB5',
    marginBottom: 9,
    textAlign: 'right',
  },

  heroTitle: {
    fontSize: 27,
    lineHeight: 37,
    fontWeight: '800',
    color: '#5F929C',
    marginBottom: 13,
    textAlign: 'right',
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 24,
    color: '#719EA7',
    textAlign: 'right',
  },

  /* Main Actions */

  section: {
    gap: 12,
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#6899A3',
    marginBottom: 4,
    textAlign: 'right',
  },

  primaryButton: {
    minHeight: 94,
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 15,
    backgroundColor: '#45B8CC',
    borderWidth: 1,
    borderColor: '#63C7D6',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  secondaryButton: {
    minHeight: 94,
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 15,
    backgroundColor: '#E9F9FC',
    borderWidth: 1,
    borderColor: '#9DDFE9',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  buttonContent: {
    flex: 1,
    paddingHorizontal: 13,
  },

  primaryButtonTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'right',
  },

  primaryButtonText: {
    color: '#EAFBFD',
    fontSize: 13,
    textAlign: 'right',
  },

  secondaryButtonTitle: {
    color: '#58A6B3',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'right',
  },

  secondaryButtonText: {
    color: '#7EA7AF',
    fontSize: 13,
    textAlign: 'right',
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#63C7D6',
  },

  actionIconText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
  },

  secondaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7F3F7',
  },

  secondaryIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#58B8C7',
  },

  arrow: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  arrowSecondary: {
    fontSize: 24,
    fontWeight: '600',
    color: '#69B9C5',
    marginLeft: 4,
  },

  /* Location */

  locationCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BDE8EF',
  },

  locationCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  locationContent: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6899A3',
    marginBottom: 5,
    textAlign: 'right',
  },

  locationText: {
    fontSize: 13,
    color: '#83AAB2',
    textAlign: 'right',
  },

  smallLocationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7F3F7',
    marginLeft: 12,
  },

  smallLocationIconText: {
    fontSize: 20,
    color: '#45B8CC',
  },

  locationButton: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#DDF3F6',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  changeLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: '#45B8CC',
    textAlign: 'right',
  },

  locationArrow: {
    fontSize: 19,
    color: '#63C7D6',
  },

  /* Trust */

  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },

  trustLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CFEFF4',
  },

  trustText: {
    fontSize: 11,
    color: '#86AEB5',
    textAlign: 'center',
  },
});