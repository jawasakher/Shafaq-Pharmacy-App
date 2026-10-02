import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

export default function OrdersScreen() {
    const handleTrackOrder = () => {
        router.push('/order-tracking')
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.header}>
                        <ThemedText style={styles.eyebrow}>
                            طلباتك
                        </ThemedText>

                        <ThemedText style={styles.title}>
                            طلباتي
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            يمكنك متابعة طلباتك ومعرفة حالتها في أي وقت
                        </ThemedText>
                    </View>

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            الطلب الحالي
                        </ThemedText>

                        <View style={styles.activeBadge}>
                            <ThemedText style={styles.activeBadgeText}>
                                قيد المراجعة
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.orderCard}>

                        <View style={styles.orderHeader}>
                            <View style={styles.orderNumberContainer}>
                                <ThemedText style={styles.orderLabel}>
                                    رقم الطلب
                                </ThemedText>

                                <ThemedText style={styles.orderNumber}>
                                    #1001
                                </ThemedText>
                            </View>

                            <View style={styles.pharmacyIcon}>
                                <ThemedText style={styles.pharmacyIconText}>
                                    +
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoValue}>
                                صيدلية الشفاء
                            </ThemedText>

                            <ThemedText style={styles.infoLabel}>
                                الصيدلية
                            </ThemedText>
                        </View>

                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoValue}>
                                باراسيتامول × 2
                            </ThemedText>

                            <ThemedText style={styles.infoLabel}>
                                الأدوية
                            </ThemedText>
                        </View>

                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoValue}>
                                0.8 كم
                            </ThemedText>

                            <ThemedText style={styles.infoLabel}>
                                المسافة
                            </ThemedText>
                        </View>

                        <View style={styles.statusBox}>
                            <View style={styles.statusDot} />

                            <ThemedText style={styles.statusText}>
                                بانتظار تأكيد الصيدلية
                            </ThemedText>
                        </View>

                        <Pressable
                            onPress={handleTrackOrder}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.trackButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <ThemedText style={styles.trackButtonText}>
                                متابعة الطلب
                            </ThemedText>

                            <ThemedText style={styles.arrow}>
                                ←
                            </ThemedText>
                        </Pressable>

                    </View>

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            الطلبات السابقة
                        </ThemedText>
                    </View>

                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <ThemedText style={styles.emptyIconText}>
                                ✓
                            </ThemedText>
                        </View>

                        <ThemedText style={styles.emptyTitle}>
                            لا توجد طلبات سابقة
                        </ThemedText>

                        <ThemedText style={styles.emptyText}>
                            ستظهر طلباتك المكتملة هنا
                        </ThemedText>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    )
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
        paddingTop: 28,
        paddingBottom: 30,
    },

    header: {
        alignItems: 'flex-end',
    },

    eyebrow: {
        fontSize: 13,
        color: '#78AEB8',
        textAlign: 'right',
        marginBottom: 8,
    },

    title: {
        fontSize: 28,
        lineHeight: 37,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 9,
        fontSize: 14,
        lineHeight: 23,
        color: '#83AAB2',
        textAlign: 'right',
    },

    sectionHeader: {
        marginTop: 28,
        marginBottom: 12,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    activeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    activeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#45B8CC',
    },

    orderCard: {
        padding: 20,
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    orderHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    orderNumberContainer: {
        alignItems: 'flex-end',
    },

    orderLabel: {
        fontSize: 12,
        color: '#83AAB2',
        textAlign: 'right',
    },

    orderNumber: {
        marginTop: 4,
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    pharmacyIcon: {
        width: 48,
        height: 48,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    pharmacyIconText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#45B8CC',
    },

    divider: {
        height: 1,
        marginVertical: 18,
        backgroundColor: '#E4F5F8',
    },

    infoRow: {
        marginBottom: 13,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    infoLabel: {
        fontSize: 12,
        color: '#9ABBC1',
        textAlign: 'right',
    },

    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#719EA7',
        textAlign: 'left',
    },

    statusBox: {
        marginTop: 5,
        padding: 13,
        borderRadius: 17,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    statusDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginLeft: 9,
        backgroundColor: '#45B8CC',
    },

    statusText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#6899A3',
        textAlign: 'right',
    },

    trackButton: {
        minHeight: 54,
        marginTop: 16,
        borderRadius: 18,
        paddingHorizontal: 17,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
    },

    trackButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    arrow: {
        color: '#FFFFFF',
        fontSize: 22,
    },

    emptyCard: {
        padding: 28,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    emptyIconText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#45B8CC',
    },

    emptyTitle: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'center',
    },

    emptyText: {
        marginTop: 6,
        fontSize: 13,
        color: '#83AAB2',
        textAlign: 'center',
    },

    pressed: {
        opacity: 0.78,
        transform: [
            {
                scale: 0.985,
            },
        ],
    },
})