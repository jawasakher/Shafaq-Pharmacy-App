import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DeliveryLocationScreen() {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <ThemedText style={styles.eyebrow}>
                        الخطوة التالية
                    </ThemedText>

                    <ThemedText style={styles.title}>
                        أين تريد استلام طلبك؟
                    </ThemedText>

                    <ThemedText style={styles.subtitle}>
                        سنستخدم موقعك الحالي لتحديد الصيدليات المتاحة للتوصيل إليك
                    </ThemedText>

                    <View style={styles.locationCard}>
                        <View style={styles.icon}>
                            <ThemedText style={styles.iconText}>
                                ⌖
                            </ThemedText>
                        </View>

                        <ThemedText style={styles.cardTitle}>
                            استخدام موقعي الحالي
                        </ThemedText>

                        <ThemedText style={styles.cardText}>
                            سيتم تحديد موقعك تلقائيًا عند المتابعة
                        </ThemedText>
                    </View>

                    <Pressable
                        onPress={() => router.push('/pharmacies')}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.pressed,
                        ]}
                    >
                        <ThemedText style={styles.buttonText}>
                            تحديد الموقع والمتابعة
                        </ThemedText>

                        <ThemedText style={styles.arrow}>
                            ←
                        </ThemedText>
                    </Pressable>
                </View>
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

    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
    },

    eyebrow: {
        fontSize: 13,
        color: '#78AEB8',
        textAlign: 'right',
        marginBottom: 8,
    },

    title: {
        fontSize: 27,
        lineHeight: 36,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 23,
        color: '#83AAB2',
        textAlign: 'right',
    },

    locationCard: {
        marginTop: 30,
        padding: 24,
        borderRadius: 26,
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    icon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
        marginBottom: 18,
    },

    iconText: {
        fontSize: 38,
        color: '#45B8CC',
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'center',
    },

    cardText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 21,
        color: '#83AAB2',
        textAlign: 'center',
    },

    button: {
        minHeight: 58,
        marginTop: 24,
        borderRadius: 19,
        paddingHorizontal: 18,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    arrow: {
        color: '#FFFFFF',
        fontSize: 23,
    },

    pressed: {
        opacity: 0.78,
        transform: [{ scale: 0.985 }],
    },
});