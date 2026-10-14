import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ShafaqCard } from '@/components/ui/shafaq-card';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { saveSession } from '@/lib/auth';
import { apiRequest } from '@/services/api-client';

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);

  const roleTitle =
    role === 'pharmacist'
      ? 'الصيدلية'
      : role === 'delivery'
      ? 'خدمة التوصيل'
      : 'المستخدم';

  const roleIcon =
    role === 'pharmacist'
      ? '💊'
      : role === 'delivery'
      ? '🚚'
      : '👤';

  const formatPhoneNumber = (input: string) => {
    let cleaned = input.trim();
    if (cleaned.startsWith('0')) {
      cleaned = '+963' + cleaned.slice(1);
    } else if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleRequestOtp = async () => {
    const rawEmail = email.trim();
    const rawUsername = username.trim();
    const rawPhone = phone.trim();
    const rawPassword = password.trim();

    if (!rawEmail || !rawEmail.includes('@')) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني بشكل صحيح');
      return;
    }

    if (!rawUsername) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم');
      return;
    }

    if (!rawPhone) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف صحيحاً (مثال: 0996483293)');
      return;
    }

    if (!rawPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور');
      return;
    }

    const formattedPhone = formatPhoneNumber(rawPhone);
    const requestPurpose = role === 'pharmacist' || role === 'delivery' ? 'INTERNAL' : 'CUSTOMER';

    try {
      setLoading(true);
      await apiRequest('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({
          email: rawEmail,
          username: rawUsername,
          phone: formattedPhone,
          purpose: requestPurpose,
        }),
      });
      Alert.alert('تم إرسال الرمز', `تم إرسال رمز التحقق إلى بريدك الإلكتروني: ${rawEmail}`);
      setStep('verify');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إرسال رمز التحقق إلى البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndLogin = async () => {
    const formattedPhone = formatPhoneNumber(phone);
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      Alert.alert('تنبيه', 'يرجى إدخال رمز التحقق المكون من أرقام المقروء من بريدك الإلكتروني');
      return;
    }

    try {
      setLoading(true);

      const requestPurpose = role === 'pharmacist' || role === 'delivery' ? 'INTERNAL' : 'CUSTOMER';

      const res = await apiRequest<{
        success: boolean;
        data: {
          user: { id: string; name: string; phone: string; role: string };
          session: { token: string };
        };
      }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          phone: formattedPhone,
          code: trimmedCode,
          purpose: requestPurpose,
        }),
      });

      if (res.success && res.data) {
        const serverRole = res.data.user.role;
        const requestedRoleMap: Record<string, string> = {
          'pharmacist': 'PHARMACIST',
          'delivery': 'DRIVER',
          'customer': 'CUSTOMER',
        };

        const expectedRole = requestedRoleMap[role || 'customer'];

        if (serverRole !== expectedRole && !(expectedRole === 'PHARMACIST' && serverRole === 'OWNER')) {
          Alert.alert('صلاحيات غير كافية', 'حسابك غير مصرح له بالدخول لهذه الواجهة.');
          setLoading(false);
          return;
        }

        await saveSession(res.data.session.token, {
          id: res.data.user.id,
          name: username.trim() || res.data.user.name || formattedPhone,
          phone: res.data.user.phone,
        });

        if (serverRole === 'PHARMACIST' || serverRole === 'OWNER') {
          router.replace('/(pharmacist)/' as any);
        } else if (serverRole === 'DRIVER') {
          router.replace('/(delivery)/' as any);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ marginBottom: 16, alignItems: 'flex-end' }}>
              <BrandLogo size="small" />
            </View>
            <ScreenHeader title={`تسجيل دخول ${roleTitle}`} subtitle="نظام المصادقة عبر البريد الإلكتروني ورقم الهاتف" />

            <ShafaqCard variant="elevated" style={styles.card}>
              <View style={styles.userIconRow}>
                <View style={styles.iconCircle}>
                  <ThemedText style={styles.userEmoji}>{roleIcon}</ThemedText>
                </View>
              </View>

              <View style={styles.formGroup}>
                {/* 1. Email */}
                <ThemedText style={styles.label}>1. البريد الإلكتروني (لتلقي الرمز)</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@domain.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  textAlign="right"
                  editable={step === 'request'}
                />

                {/* 2. Username */}
                <ThemedText style={styles.label}>2. اسم المستخدم</ThemedText>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم الكامل"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  textAlign="right"
                  editable={step === 'request'}
                />

                {/* 3. Phone */}
                <ThemedText style={styles.label}>3. رقم الهاتف المحمول</ThemedText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0996483293"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  style={styles.input}
                  textAlign="right"
                  editable={step === 'request'}
                />

                {/* 4. Password */}
                <ThemedText style={styles.label}>4. كلمة المرور</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  style={styles.input}
                  textAlign="right"
                  editable={step === 'request'}
                />

                {/* OTP Code Step 2 */}
                {step === 'verify' && (
                  <>
                    <View style={styles.divider} />
                    <ThemedText style={styles.label}>رمز التحقق (وصلك على البريد الإلكتروني)</ThemedText>
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      style={[styles.input, styles.otpInput]}
                      textAlign="center"
                    />
                  </>
                )}

                <View style={styles.spacer} />

                {step === 'request' ? (
                  <PrimaryButton
                    title={loading ? 'جاري إرسال الرمز للإيميل...' : 'إرسال رمز التحقق للإيميل'}
                    onPress={handleRequestOtp}
                    disabled={loading}
                  />
                ) : (
                  <View style={{ gap: 12 }}>
                    <PrimaryButton
                      title={loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                      onPress={handleVerifyAndLogin}
                      disabled={loading}
                    />
                    <SecondaryButton
                      title="تغيير البيانات والبريد"
                      onPress={() => {
                        setStep('request');
                        setCode('');
                      }}
                    />
                  </View>
                )}
              </View>
            </ShafaqCard>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingVertical: 32,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderColor: '#BDE8EF',
  },
  userIconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDF7FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#9DDFE9',
    overflow: 'visible',
  },
  userEmoji: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
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
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9EEF4',
    backgroundColor: '#F4FCFE',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#16485C',
    textAlign: 'right',
  },
  otpInput: {
    borderColor: '#19A9CC',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    backgroundColor: '#EAFBFD',
  },
  divider: {
    height: 1,
    backgroundColor: '#BDE8EF',
    marginVertical: 8,
  },
  spacer: {
    height: 8,
  },
});
