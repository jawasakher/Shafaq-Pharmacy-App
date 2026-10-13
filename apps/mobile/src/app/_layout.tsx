import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { verifyServerSession } from '@/lib/auth';
import { promptUpdateIfAvailable } from '@/lib/updater';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        async function prepare() {
            try {
                await verifyServerSession();
                promptUpdateIfAvailable();
                await registerForPushNotificationsAsync();
            } catch {
                // Ignore initial verification errors
            } finally {
                await SplashScreen.hideAsync();
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
