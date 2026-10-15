import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { verifyServerSession } from '@/lib/auth';
import { promptUpdateIfAvailable } from '@/lib/updater';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

import {
    useFonts,
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_900Black,
} from '@expo-google-fonts/tajawal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    const [fontsLoaded, fontError] = useFonts({
        Tajawal_400Regular,
        Tajawal_500Medium,
        Tajawal_700Bold,
        Tajawal_900Black,
    });

    useEffect(() => {
        async function prepare() {
            try {
                await verifyServerSession();
                promptUpdateIfAvailable();
                await registerForPushNotificationsAsync();
            } catch {
                // Ignore initial verification errors
            }
        }
        prepare();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Handle foreground notification if needed
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.type === 'update_available') {
                router.push('/update' as any);
            }
            if (data?.type === 'APP_UPDATE' && typeof data?.directApkUrl === 'string') {
                const directApkUrl = data.directApkUrl;
                import('react-native').then(({ Linking, Alert }) => {
                    Alert.alert(
                        'تحديث التطبيق',
                        'هل ترغب في بدء تحميل النسخة الجديدة الآن؟',
                        [
                            { text: 'إلغاء', style: 'cancel' },
                            {
                                text: 'نعم',
                                onPress: () => {
                                    Linking.canOpenURL(directApkUrl).then((supported) => {
                                        if (supported) {
                                            Linking.openURL(directApkUrl);
                                        } else {
                                            Alert.alert(
                                                'خطأ في التحميل',
                                                'تعذر فتح الرابط المباشر للتحميل. يرجى محاولة التحديث من داخل التطبيق.'
                                            );
                                        }
                                    }).catch(() => {
                                        Alert.alert(
                                            'خطأ في التحميل',
                                            'حدث خطأ أثناء محاولة فتح رابط التحديث.'
                                        );
                                    });
                                },
                            },
                        ]
                    );
                });
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            // Ensure splash screen is hidden when fonts are loaded or if there's an error
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
            <AnimatedSplashOverlay />

            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(pharmacist)" />
                <Stack.Screen name="(delivery)" />
                <Stack.Screen name="medicine-request" />
                <Stack.Screen name="prescription" />
                <Stack.Screen name="delivery-location" />
                <Stack.Screen name="update" />
            </Stack>
        </ThemeProvider>
    );
}
