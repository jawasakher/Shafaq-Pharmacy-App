import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OrderReviewScreen() {
    const handleConfirmOrder = () => {
        router.push('/order-confirmation');
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={10}
                            style={styles.backButton}
                        >
                            <ThemedText style={styles.backArrow}>
                                →
                            </ThemedText>
                        </Pressable>

                        <View style={styles.headerText}>
                            <ThemedText style={styles.eyebrow}>
                                الخطوة الأخيرة قبل الإرسال
                            </ThemedText>

                            <ThemedText style={styles.title}>
                                مراجعة طلبك
                            </ThemedText>

                            <ThemedText style={styles.subtitle}>
                                تأكد من تفاصيل طلبك قبل إرساله إلى الصيدلية
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            الصيدلية المختارة
                        </ThemedText>

                        <View style={styles.pharmacyCard}>
                            <View style={styles.pharmacyIcon}>
                                <ThemedText style={styles.iconText}>
                                    +
                                </ThemedText>
                            </View>

                            <View style={styles.pharmacyInfo}>
                                <ThemedText style={styles.pharmacyName}>
                                    صيدلية الشفاء
                                </ThemedText>

                                <ThemedText style={styles.pharmacyMeta}>
                                    مفتوحة الآن • 0.8 كم
                                </ThemedText>

                                <ThemedText style={styles.pharmacyTime}>
                                    التوصيل المتوقع: 20 - 30 دقيقة
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            الأدوية المطلوبة
                        </ThemedText>

                        <View style={styles.card}>
                            <View style={styles.medicineRow}>
                                <View style={styles.quantity}>
                                    <ThemedText style={styles.quantityText}>
                                        × 2
                                    </ThemedText>
                                </View>

                                <ThemedText style={styles.medicineName}>
                                    باراسيتامول
                                </ThemedText>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.medicineRow}>
                                <View style={styles.quantity}>
                                    <ThemedText style={styles.quantityText}>
                                        × 1
                                    </ThemedText>
                                </View>

                                <ThemedText style={styles.medicineName}>
                                    فيتامين C
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            الوصفة الطبية
                        </ThemedText>

                        <View style={styles.statusCard}>
                            <View style={styles.checkCircle}>
                                <ThemedText style={styles.check}>
                                    ✓
                                </ThemedText>
                            </View>

                            <View style={styles.statusInfo}>
                                <ThemedText style={styles.statusTitle}>
                                    تم إرفاق الوصفة
                                </ThemedText>

                                <ThemedText style={styles.statusText}>
                                    سيتم إرسالها إلى الصيدلية مع الطلب
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            موقع التوصيل
                        </ThemedText>

                        <View style={styles.locationCard}>
                            <View style={styles.locationIcon}>
                                <ThemedText style={styles.locationIconText}>
                                    ⌖
                                </ThemedText>
                            </View>

                            <View style={styles.locationInfo}>
                                <ThemedText style={styles.locationTitle}>
                                    موقعك الحالي
                                </ThemedText>

                                <ThemedText style={styles.locationText}>
                                    سيتم استخدام موقعك المحدد لإتمام التوصيل
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.notice}>
                        <ThemedText style={styles.noticeTitle}>
                            ملاحظة مهمة
                        </ThemedText>

                        <ThemedText style={styles.noticeText}>
                            سيتم أولا إرسال طلبك إلى الصيدلية
                            للتحقق من توفرالأدوية وتحديد السعر قبل إتمام الدفع
                        </ThemedText>
                    </View>

                    <Pressable
                        onPress={handleConfirmOrder}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.pressed,
                        ]}
                    >
                        <ThemedText style={styles.buttonText}>
                            تأكيد وإرسال الطلب
                        </ThemedText>

                        <ThemedText style={styles.arrow}>
                            ←
                        </ThemedText>
                    </Pressable>
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

    content: {
        paddingHorizontal: 20,
        paddingBottom: 35,
    },

    header: {
        minHeight: 100,
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
    },

    headerText: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 14,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    backArrow: {
        fontSize: 24,
        color: '#45B8CC',
    },

    eyebrow: {
        fontSize: 13,
        color: '#78AEB8',
        marginBottom: 7,
        textAlign: 'right',
    },

    title: {
        fontSize: 27,
        lineHeight: 35,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 7,
        fontSize: 13,
        lineHeight: 21,
        color: '#83AAB2',
        textAlign: 'right',
    },

    section: {
        marginTop: 22,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
        marginBottom: 10,
    },

    pharmacyCard: {
        padding: 16,
        borderRadius: 22,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    pharmacyIcon: {
        width: 58,
        height: 58,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    iconText: {
        fontSize: 30,
        fontWeight: '700',
        color: '#45B8CC',
    },

    pharmacyInfo: {
        flex: 1,
        marginRight: 13,
        alignItems: 'flex-end',
    },

    pharmacyName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    pharmacyMeta: {
        marginTop: 5,
        fontSize: 12,
        color: '#58A6B3',
        textAlign: 'right',
    },

    pharmacyTime: {
        marginTop: 4,
        fontSize: 12,
        color: '#83AAB2',
        textAlign: 'right',
    },

    card: {
        padding: 17,
        borderRadius: 21,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    medicineRow: {
        minHeight: 40,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    medicineName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6899A3',
        textAlign: 'right',
    },

    quantity: {
        minWidth: 48,
        paddingVertical: 7,
        paddingHorizontal: 9,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#D7F3F7',
    },

    quantityText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#45A6B5',
    },

    divider: {
        height: 1,
        marginVertical: 10,
        backgroundColor: '#E2F4F7',
    },

    statusCard: {
        padding: 16,
        borderRadius: 21,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    checkCircle: {
        width: 45,
        height: 45,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
    },

    check: {
        fontSize: 22,
        fontWeight: '800',
        color: '#45A6B5',
    },

    statusInfo: {
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-end',
    },

    statusTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    statusText: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 19,
        color: '#83AAB2',
        textAlign: 'right',
    },

    locationCard: {
        padding: 16,
        borderRadius: 21,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    locationIcon: {
        width: 45,
        height: 45,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
    },

    locationIconText: {
        fontSize: 25,
        color: '#45B8CC',
    },

    locationInfo: {
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-end',
    },

    locationTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    locationText: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 19,
        color: '#83AAB2',
        textAlign: 'right',
    },

    notice: {
        marginTop: 22,
        padding: 16,
        borderRadius: 19,
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    noticeTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#58A6B3',
        textAlign: 'right',
    },

    noticeText: {
        marginTop: 6,
        fontSize: 12,
        lineHeight: 20,
        color: '#719EA7',
        textAlign: 'right',
    },

    button: {
        minHeight: 58,
        marginTop: 26,
        paddingHorizontal: 18,
        borderRadius: 19,
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