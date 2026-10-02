import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OrderConfirmationScreen() {
    const handleTrackOrder = () => {
        router.push('/order-tracking');
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    <View style={styles.iconContainer}>
                        <ThemedText style={styles.icon}>
                            ✓
                        </ThemedText>
                    </View>

                    <ThemedText style={styles.title}>
                        تم إرسال طلبك بنجاح
                    </ThemedText>

                    <ThemedText style={styles.subtitle}>
                        تم إرسال طلبك إلى الصيدلية لمراجعة توفر الأدوية وتحديد السعر
                    </ThemedText>

                    <View style={styles.infoCard}>
                        <ThemedText style={styles.cardTitle}>
                            ماذا سيحدث الآن؟
                        </ThemedText>

                        <ThemedText style={styles.cardText}>
                            ستقوم الصيدلية بمراجعة طلبك والتأكد من توفر الأدوية
                        </ThemedText>


                    </View>

                    <View style={styles.orderCard}>
                        <ThemedText style={styles.orderLabel}>
                            حالة الطلب
                        </ThemedText>

                        <ThemedText style={styles.orderStatus}>
                            بانتظار تأكيد الصيدلية
                        </ThemedText>
                    </View>

                    <Pressable
                        onPress={handleTrackOrder}
                        hitSlop={8}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.pressed,
                        ]}
                    >
                        <ThemedText style={styles.buttonText}>
                            متابعة الطلب
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
        paddingTop: 55,
        alignItems: 'center',
    },

    iconContainer: {
        width: 92,
        height: 92,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    icon: {
        fontSize: 48,
        fontWeight: '800',
        color: '#45B8CC',
    },

    title: {
        marginTop: 28,
        fontSize: 26,
        lineHeight: 36,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'center',
    },

    subtitle: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 23,
        color: '#83AAB2',
        textAlign: 'center',
    },

    infoCard: {
        width: '100%',
        marginTop: 30,
        padding: 22,
        borderRadius: 24,
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    cardText: {
        marginTop: 12,
        fontSize: 13,
        lineHeight: 22,
        color: '#83AAB2',
        textAlign: 'right',
    },

    orderCard: {
        width: '100%',
        marginTop: 16,
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    orderLabel: {
        fontSize: 12,
        color: '#83AAB2',
        textAlign: 'right',
    },

    orderStatus: {
        marginTop: 6,
        fontSize: 15,
        fontWeight: '800',
        color: '#45B8CC',
        textAlign: 'right',
    },

    button: {
        width: '100%',
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
        transform: [
            {
                scale: 0.985,
            },
        ],
    },
});