import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">عن شَفَق</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            منصة رائدة لتوصيل الأدوية واستشارات الصيادلة{'\n'}بكل سهولة وأمان
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="طلب الأدوية الموثوقة">
            <ThemedText type="small">
              اطلب أدويتك ومستلزماتك الطبية مباشرة من صيدليات معتمدة بالقرب منك مع ضمان سرعة التوصيل حتى باب منزلكم.
            </ThemedText>
          </Collapsible>

          <Collapsible title="الاستشارات الطبية والصيدلانية">
            <ThemedText type="small">
              تحدث مباشرة مع صيادلة مختصين عبر المحادثة للحصول على الإرشاد الصحي والاستشارات الدقيقة حول استخدام الأدوية.
            </ThemedText>
          </Collapsible>

          <Collapsible title="رفع وإدارة الوصفات الطبية">
            <ThemedText type="small">
              قم برفع صورة الوصفة الطبية (الروشتة) بأمان تام لمراجعتها واعتمادها من قبل الصيدلية المختصة.
            </ThemedText>
          </Collapsible>

          <Collapsible title="الأمان والخصوصية الطبية">
            <ThemedText type="small">
              نحمي بياناتك الشخصية والوصفات الطبية بأعلى معايير الأمان والسرية لضمان راحة بالك.
            </ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
});

