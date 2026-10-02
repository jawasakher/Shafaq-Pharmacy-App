import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ADDRESS_KEY = '@shafaq_address';

type SavedAddress = {
    address: string;
    details: string;
};

export default function AddressesScreen() {
    const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAddress = useCallback(async () => {
        try {
            setLoading(true);

            const storedAddress = await AsyncStorage.getItem(ADDRESS_KEY);

            if (storedAddress) {
                setSavedAddress(JSON.parse(storedAddress));
            } else {
                setSavedAddress(null);
            }
        } catch (error) {
            console.log('Error loading address', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadAddress();
        }, [loadAddress]),
    );

    const handleAddAddress = () => {
        router.push('/add-address');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.title}>عناويني</Text>

                <Text style={styles.subtitle}>
                    إدارة عناوين التوصيل الخاصة بك
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#45B8CC" />
                    </View>
                ) : savedAddress ? (
                    <View style={styles.addressCard}>
                        <View style={styles.locationIcon}>
                            <Text style={styles.locationText}>⌖</Text>
                        </View>

                        <View style={styles.addressContent}>
                            <Text style={styles.addressTitle}>عنوان التوصيل</Text>

                            <Text style={styles.addressText}>
                                {savedAddress.address}
                            </Text>

                            {savedAddress.details ? (
                                <Text style={styles.detailsText}>
                                    {savedAddress.details}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <View style={styles.locationIcon}>
                            <Text style={styles.locationText}>⌖</Text>
                        </View>

                        <Text style={styles.emptyTitle}>موقعي الحالي</Text>

                        <Text style={styles.emptyText}>
                            لم تتم إضافة عنوان بعد
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.addButton}
                    activeOpacity={0.8}
                    onPress={handleAddAddress}
                >
                    <Text style={styles.addText}>إضافة عنوان جديد</Text>
                </TouchableOpacity>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>ملاحظة</Text>

                    <Text style={styles.infoText}>
                        يمكنك إضافة عنوان التوصيل الخاص بك لاستخدامه عند طلب الأدوية
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1FBFD',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 55,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },

    backText: {
        fontSize: 30,
        lineHeight: 32,
        color: '#45B8CC',
    },

    title: {
        marginTop: 22,
        fontSize: 28,
        fontWeight: '800',
        color: '#58A6B3',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 7,
        fontSize: 14,
        color: '#7EA7AF',
        textAlign: 'right',
    },

    loadingContainer: {
        marginTop: 25,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },

    addressCard: {
        marginTop: 25,
        padding: 18,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    emptyCard: {
        marginTop: 25,
        padding: 24,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },

    locationIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#D7F3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },

    locationText: {
        fontSize: 25,
        color: '#45B8CC',
    },

    addressContent: {
        flex: 1,
        marginLeft: 14,
        alignItems: 'flex-end',
    },

    addressTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#58A6B3',
        textAlign: 'right',
    },

    addressText: {
        marginTop: 7,
        fontSize: 14,
        lineHeight: 21,
        color: '#5F929C',
        textAlign: 'right',
    },

    detailsText: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 20,
        color: '#83AAB2',
        textAlign: 'right',
    },

    emptyTitle: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: '800',
        color: '#58A6B3',
    },

    emptyText: {
        marginTop: 6,
        fontSize: 13,
        color: '#83AAB2',
    },

    addButton: {
        height: 55,
        marginTop: 20,
        borderRadius: 18,
        backgroundColor: '#45B8CC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    infoCard: {
        marginTop: 18,
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#D7F3F7',
    },

    infoTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#58A6B3',
        textAlign: 'right',
    },

    infoText: {
        marginTop: 7,
        fontSize: 13,
        lineHeight: 21,
        color: '#6899A3',
        textAlign: 'right',
    },
});