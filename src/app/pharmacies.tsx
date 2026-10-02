import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Pharmacy = {
    id: string;
    name: string;
    distance: string;
    deliveryTime: string;
    rating: string;
    isOpen: boolean;
};

const pharmacies: Pharmacy[] = [
    {
        id: '1',
        name: 'صيدلية الشفاء',
        distance: '0.8 كم',
        deliveryTime: '20 - 30 دقيقة',
        rating: '4.8',
        isOpen: true,
    },
    {
        id: '2',
        name: 'صيدلية النور',
        distance: '1.4 كم',
        deliveryTime: '25 - 35 دقيقة',
        rating: '4.7',
        isOpen: true,
    },
    {
        id: '3',
        name: 'صيدلية الحياة',
        distance: '2.1 كم',
        deliveryTime: '30 - 40 دقيقة',
        rating: '4.6',
        isOpen: false,
    },
];

export default function PharmaciesScreen() {
    const handleSelectPharmacy = (pharmacy: Pharmacy) => {
        if (!pharmacy.isOpen) {
            return;
        }

        router.push({
            pathname: '/pharmacy-details',
            params: {
                pharmacyId: pharmacy.id,
            },
        });
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.header}>
                        <ThemedText style={styles.eyebrow}>
                            الخطوة التالية
                        </ThemedText>

                        <ThemedText style={styles.title}>
                            اختر الصيدلية
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            الصيدليات المتاحة بالقرب من موقعك
                        </ThemedText>
                    </View>

                    <View style={styles.locationCard}>
                        <View style={styles.locationIcon}>
                            <ThemedText style={styles.locationIconText}>
                                ⌖
                            </ThemedText>
                        </View>

                        <View style={styles.locationContent}>
                            <ThemedText style={styles.locationLabel}>
                                موقع التوصيل
                            </ThemedText>

                            <ThemedText style={styles.locationValue}>
                                موقعك الحالي
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            الصيدليات المتاحة
                        </ThemedText>

                        <ThemedText style={styles.count}>
                            {pharmacies.length} صيدليات
                        </ThemedText>
                    </View>

                    <View style={styles.list}>
                        {pharmacies.map((pharmacy) => (
                            <View
                                key={pharmacy.id}
                                style={[
                                    styles.pharmacyCard,
                                    !pharmacy.isOpen && styles.closedCard,
                                ]}
                            >
                                <View style={styles.cardTop}>
                                    <View style={styles.pharmacyIcon}>
                                        <ThemedText style={styles.pharmacyIconText}>
                                            +
                                        </ThemedText>
                                    </View>

                                    <View style={styles.pharmacyInfo}>
                                        <ThemedText style={styles.pharmacyName}>
                                            {pharmacy.name}
                                        </ThemedText>

                                        <View style={styles.ratingRow}>
                                            <ThemedText style={styles.rating}>
                                                {pharmacy.rating}
                                            </ThemedText>

                                            <ThemedText style={styles.star}>
                                                ★
                                            </ThemedText>
                                        </View>
                                    </View>

                                    <View
                                        style={[
                                            styles.statusBadge,
                                            !pharmacy.isOpen &&
                                            styles.closedBadge,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.statusDot,
                                                !pharmacy.isOpen &&
                                                styles.closedDot,
                                            ]}
                                        />

                                        <ThemedText
                                            style={[
                                                styles.statusText,
                                                !pharmacy.isOpen &&
                                                styles.closedText,
                                            ]}
                                        >
                                            {pharmacy.isOpen
                                                ? 'مفتوحة'
                                                : 'مغلقة'}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.detailsRow}>
                                    <View style={styles.detailItem}>
                                        <ThemedText style={styles.detailIcon}>
                                            ⌖
                                        </ThemedText>

                                        <ThemedText style={styles.detailText}>
                                            {pharmacy.distance}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <ThemedText style={styles.detailIcon}>
                                            ◷
                                        </ThemedText>

                                        <ThemedText style={styles.detailText}>
                                            {pharmacy.deliveryTime}
                                        </ThemedText>
                                    </View>
                                </View>

                                <Pressable
                                    disabled={!pharmacy.isOpen}
                                    onPress={() =>
                                        handleSelectPharmacy(pharmacy)
                                    }
                                    style={({ pressed }) => [
                                        styles.selectButton,
                                        !pharmacy.isOpen &&
                                        styles.disabledButton,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.selectButtonText,
                                            !pharmacy.isOpen &&
                                            styles.disabledButtonText,
                                        ]}
                                    >
                                        {pharmacy.isOpen
                                            ? 'اختيار الصيدلية'
                                            : 'غير متاحة حاليًا'}
                                    </ThemedText>

                                    {pharmacy.isOpen && (
                                        <ThemedText style={styles.arrow}>
                                            ←
                                        </ThemedText>
                                    )}
                                </Pressable>
                            </View>
                        ))}
                    </View>
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
        paddingTop: 14,
        paddingBottom: 34,
    },

    header: {
        alignItems: 'flex-end',
        marginBottom: 22,
    },

    eyebrow: {
        fontSize: 13,
        color: '#78AEB8',
        textAlign: 'right',
        marginBottom: 7,
    },

    title: {
        fontSize: 27,
        lineHeight: 36,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: '#83AAB2',
        textAlign: 'right',
    },

    locationCard: {
        minHeight: 76,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 21,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    locationIcon: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
        marginLeft: 12,
    },

    locationIconText: {
        fontSize: 25,
        color: '#45B8CC',
    },

    locationContent: {
        flex: 1,
        alignItems: 'flex-end',
    },

    locationLabel: {
        fontSize: 12,
        color: '#83AAB2',
        textAlign: 'right',
    },

    locationValue: {
        marginTop: 3,
        fontSize: 14,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    sectionHeader: {
        marginTop: 27,
        marginBottom: 12,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    count: {
        fontSize: 12,
        color: '#83AAB2',
    },

    list: {
        gap: 12,
    },

    pharmacyCard: {
        padding: 16,
        borderRadius: 23,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    closedCard: {
        opacity: 0.72,
    },

    cardTop: {
        minHeight: 58,
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },

    pharmacyIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
        marginLeft: 12,
    },

    pharmacyIconText: {
        fontSize: 27,
        color: '#45B8CC',
    },

    pharmacyInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },

    pharmacyName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    ratingRow: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },

    rating: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6899A3',
    },

    star: {
        marginLeft: 4,
        fontSize: 13,
        color: '#45B8CC',
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 11,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    closedBadge: {
        backgroundColor: '#F1FBFD',
        borderColor: '#D7EDEF',
    },

    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#45B8CC',
        marginLeft: 5,
    },

    closedDot: {
        backgroundColor: '#9DBBC0',
    },

    statusText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#45B8CC',
    },

    closedText: {
        color: '#83AAB2',
    },

    divider: {
        height: 1,
        marginVertical: 14,
        backgroundColor: '#E1F4F7',
    },

    detailsRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    detailItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },

    detailIcon: {
        fontSize: 16,
        color: '#45B8CC',
        marginLeft: 5,
    },

    detailText: {
        fontSize: 12,
        color: '#83AAB2',
    },

    selectButton: {
        minHeight: 50,
        marginTop: 15,
        paddingHorizontal: 15,
        borderRadius: 16,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
    },

    disabledButton: {
        backgroundColor: '#E8F5F7',
        borderColor: '#D3ECEF',
    },

    selectButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },

    disabledButtonText: {
        color: '#83AAB2',
    },

    arrow: {
        color: '#FFFFFF',
        fontSize: 21,
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