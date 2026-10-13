import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RoleSelectionScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <BrandLogo size="large" />
          </View>

          {/* Role Cards: المستخدم -> الصيدلية -> خدمة التوصيل */}
          <View style={styles.rolesContainer}>
            {/* 1. Customer Role */}
            <Pressable
              onPress={() => router.push('/auth/login?role=customer' as any)}
              style={({ pressed }) => [
                styles.roleCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.roleContent}>
                <View style={styles.iconCircle}>
                  <ThemedText style={styles.roleIconText}>👤</ThemedText>
                </View>
                <View style={styles.roleTextContainer}>
                  <ThemedText style={styles.roleTitle}>المستخدم</ThemedText>
                  <ThemedText style={styles.roleSub}>طلب الأدوية والاستشارات</ThemedText>
                </View>
              </View>
            </Pressable>

            {/* 2. Pharmacist Role */}
            <Pressable
              onPress={() => router.push('/auth/login?role=pharmacist' as any)}
              style={({ pressed }) => [
                styles.roleCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.roleContent}>
                <View style={styles.iconCircle}>
                  <ThemedText style={styles.roleIconText}>💊</ThemedText>
                </View>
                <View style={styles.roleTextContainer}>
                  <ThemedText style={styles.roleTitle}>الصيدلية</ThemedText>
                  <ThemedText style={styles.roleSub}>إدارة الطلبات والصرف</ThemedText>
                </View>
              </View>
            </Pressable>

            {/* 3. Delivery Role */}
            <Pressable
              onPress={() => router.push('/auth/login?role=delivery' as any)}
              style={({ pressed }) => [
                styles.roleCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.roleContent}>
                <View style={styles.iconCircle}>
                  <ThemedText style={styles.roleIconText}>🚚</ThemedText>
                </View>
                <View style={styles.roleTextContainer}>
                  <ThemedText style={styles.roleTitle}>خدمة التوصيل</ThemedText>
                  <ThemedText style={styles.roleSub}>التوصيل والتسليم الآمن</ThemedText>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAFBFD',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 12,
  },
  rolesContainer: {
    gap: 16,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  roleCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BDE8EF',
    shadowColor: '#19A9CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  roleContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#DDF7FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    overflow: 'visible',
  },
  roleIconText: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  roleTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16485C',
    marginBottom: 4,
    textAlign: 'right',
  },
  roleSub: {
    fontSize: 13,
    color: '#688795',
    textAlign: 'right',
  },
});
