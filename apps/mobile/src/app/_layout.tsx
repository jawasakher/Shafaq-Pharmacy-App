import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { verifyServerSession } from '@/lib/auth';
import { promptUpdateIfAvailable } from '@/lib/updater';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        async function prepare() {
            try {
                await verifyServerSession();
                promptUpdateIfAvailable();
            } catch {
                // Ignore initial verification errors
            } finally {
                await SplashScreen.hideAsync();
            }
        }
        prepare();
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
            </Stack>
        </ThemeProvider>
    );
}
