import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Pharmacy = {
    id: string;
    name: string;
    distance: string;
    deliveryTime: string;
    rating: string;
    address: string;
    isOpen: boolean;
};

const pharmacies: Pharmacy[] = [
    {
        id: '1',
        name: 'صيدلية الشفاء',
        distance: '0.8 كم',
        deliveryTime: '20 - 30 دقيقة',
        rating: '4.8',
        address: 'المدينة - المنطقة الرئيسية',
        isOpen: true,
    },
    {
        id: '2',
        name: 'صيدلية النور',
        distance: '1.4 كم',
        deliveryTime: '25 - 35 دقيقة',
        rating: '4.7',
        address: 'المدينة - شارع المركز',
        isOpen: true,
    },
    {
        id: '3',
        name: 'صيدلية الحياة',
        distance: '2.1 كم',
        deliveryTime: '30 - 40 دقيقة',
        rating: '4.6',
        address: 'المدينة - الحي الشرقي',
        isOpen: false,
    },
];

export default function PharmacyDetailsScreen() {
    const { pharmacyId } = useLocalSearchParams<{ pharmacyId: string }>();

    const pharmacy =
        pharmacies.find((item) => item.id === pharmacyId) ?? pharmacies[0];

    const handleSelectPharmacy = () => {
        router.push('/order-review');
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.topBar}>
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={10}
                            style={styles.backButton}
                        >
                            <ThemedText style={styles.backArrow}>
                                →
                            </ThemedText>
                        </Pressable>

                        <ThemedText style={styles.topTitle}>
                            تفاصيل الصيدلية
                        </ThemedText>
                    </View>

                    <View style={styles.heroCard}>
                        <View style={styles.pharmacyIcon}>
                            <ThemedText style={styles.iconText}>
                                +
                            </ThemedText>
                        </View>

                        <ThemedText style={styles.pharmacyName}>
                            {pharmacy.name}
                        </ThemedText>

                        <View
                            style={[
                                styles.statusBadge,
                                pharmacy.isOpen
                                    ? styles.openBadge
                                    : styles.closedBadge,
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.statusText,
                                    pharmacy.isOpen
                                        ? styles.openText
                                        : styles.closedText,
                                ]}
                            >
                                {pharmacy.isOpen
                                    ? 'مفتوحة الآن'
                                    : 'مغلقة حالياً'}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <ThemedText style={styles.infoValue}>
                                {pharmacy.distance}
                            </ThemedText>

                            <ThemedText style={styles.infoLabel}>
                                المسافة
                            </ThemedText>
                        </View>

                        <View style={styles.infoCard}>
                            <ThemedText style={styles.infoValue}>
                                {pharmacy.deliveryTime}
                            </ThemedText>

                            <ThemedText style={styles.infoLabel}>
                                وقت التوصيل
                            </ThemedText>
                        </View>

                        <View style={styles.infoCard}>
                            <ThemedText style={styles.infoValue}>
                                {pharmacy.rating}
                            </ThemedText>

                            <ThemedText style={styles.infoLabel}>
                                التقييم
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            عنوان الصيدلية
                        </ThemedText>

                        <View style={styles.addressCard}>
                            <View style={styles.addressIcon}>
                                <ThemedText style={styles.addressIconText}>
                                    ⌖
                                </ThemedText>
                            </View>

                            <ThemedText style={styles.addressText}>
                                {pharmacy.address}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            طلبك
                        </ThemedText>

                        <View style={styles.orderCard}>
                            <View style={styles.orderRow}>
                                <ThemedText style={styles.orderLabel}>
                                    الأدوية المطلوبة
                                </ThemedText>

                                <ThemedText style={styles.orderValue}>
                                    سيتم عرضها هنا
                                </ThemedText>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.orderRow}>
                                <ThemedText style={styles.orderLabel}>
                                    الوصفة الطبية
                                </ThemedText>

                                <ThemedText style={styles.orderValue}>
                                    حسب الوصفة المرفقة
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <Pressable
                        disabled={!pharmacy.isOpen}
                        onPress={handleSelectPharmacy}
                        style={({ pressed }) => [
                            styles.button,
                            !pharmacy.isOpen && styles.disabledButton,
                            pressed && pharmacy.isOpen && styles.pressed,
                        ]}
                    >
                        <ThemedText style={styles.buttonText}>
                            {pharmacy.isOpen
                                ? 'اختيار هذه الصيدلية'
                                : 'الصيدلية مغلقة حالياً'}
                        </ThemedText>

                        {pharmacy.isOpen && (
                            <ThemedText style={styles.arrow}>
                                ←
                            </ThemedText>
                        )}
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
        paddingBottom: 30,
    },

    topBar: {
        minHeight: 52,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    topTitle: {
        flex: 1,
        fontSize: 21,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
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

    heroCard: {
        marginTop: 18,
        paddingVertical: 28,
        paddingHorizontal: 20,
        borderRadius: 28,
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    pharmacyIcon: {
        width: 82,
        height: 82,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    iconText: {
        fontSize: 42,
        fontWeight: '700',
        color: '#45B8CC',
    },

    pharmacyName: {
        marginTop: 16,
        fontSize: 24,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'center',
    },

    statusBadge: {
        marginTop: 12,
        paddingHorizontal: 15,
        paddingVertical: 7,
        borderRadius: 14,
    },

    openBadge: {
        backgroundColor: '#D7F3F7',
    },

    closedBadge: {
        backgroundColor: '#EEF7F8',
    },

    statusText: {
        fontSize: 13,
        fontWeight: '800',
    },

    openText: {
        color: '#45A6B5',
    },

    closedText: {
        color: '#86AEB5',
    },

    infoGrid: {
        marginTop: 18,
        flexDirection: 'row-reverse',
        gap: 10,
    },

    infoCard: {
        flex: 1,
        minHeight: 88,
        paddingHorizontal: 8,
        paddingVertical: 13,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    infoValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#58A6B3',
        textAlign: 'center',
    },

    infoLabel: {
        marginTop: 6,
        fontSize: 12,
        color: '#83AAB2',
        textAlign: 'center',
    },

    section: {
        marginTop: 24,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
        marginBottom: 10,
    },

    addressCard: {
        minHeight: 76,
        padding: 14,
        borderRadius: 20,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    addressIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
    },

    addressIconText: {
        fontSize: 25,
        color: '#45B8CC',
    },

    addressText: {
        flex: 1,
        marginRight: 12,
        fontSize: 14,
        lineHeight: 22,
        color: '#719EA7',
        textAlign: 'right',
    },

    orderCard: {
        padding: 17,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    orderRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },

    orderLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6899A3',
        textAlign: 'right',
    },

    orderValue: {
        flex: 1,
        fontSize: 13,
        color: '#83AAB2',
        textAlign: 'left',
    },

    divider: {
        height: 1,
        marginVertical: 14,
        backgroundColor: '#E2F4F7',
    },

    button: {
        minHeight: 58,
        marginTop: 28,
        paddingHorizontal: 18,
        borderRadius: 19,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
    },

    disabledButton: {
        backgroundColor: '#CFE9ED',
        borderColor: '#CFE9ED',
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