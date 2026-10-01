import { router } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MedicineRequestScreen() {
    const [medicine, setMedicine] = useState('');
    const [medicines, setMedicines] = useState<string[]>([]);

    const addMedicine = () => {
        const value = medicine.trim();

        if (!value) {
            return;
        }

        setMedicines((current) => [...current, value]);
        setMedicine('');
    };

    const handleContinue = () => {
        router.push('/prescription');
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.header}>
                        <ThemedText style={styles.eyebrow}>
                            طلب دواء
                        </ThemedText>

                        <ThemedText style={styles.title}>
                            ما الأدوية التي تحتاجها؟
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            اكتب أسماء الأدوية التي ترغب بطلبها
                        </ThemedText>
                    </View>

                    <View style={styles.inputCard}>
                        <ThemedText style={styles.inputLabel}>
                            اسم الدواء
                        </ThemedText>

                        <TextInput
                            value={medicine}
                            onChangeText={setMedicine}
                            placeholder="اكتب اسم الدواء"
                            placeholderTextColor="#9BBBC1"
                            style={styles.input}
                            textAlign="right"
                            returnKeyType="done"
                            onSubmitEditing={addMedicine}
                        />

                        <Pressable
                            onPress={addMedicine}
                            hitSlop={8}
                            android_ripple={{ color: '#BDE8EF' }}
                            style={({ pressed }) => [
                                styles.addButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <ThemedText style={styles.addButtonText}>
                                + إضافة دواء
                            </ThemedText>
                        </Pressable>
                    </View>

                    <View style={styles.medicinesSection}>
                        <ThemedText style={styles.sectionTitle}>
                            الأدوية المطلوبة
                        </ThemedText>

                        {medicines.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <View style={styles.emptyIcon}>
                                    <ThemedText style={styles.emptyIconText}>
                                        +
                                    </ThemedText>
                                </View>

                                <ThemedText style={styles.emptyTitle}>
                                    لم تضف أي دواء بعد
                                </ThemedText>

                                <ThemedText style={styles.emptyText}>
                                    أضف الأدوية التي تريد طلبها من الصيدلية
                                </ThemedText>
                            </View>
                        ) : (
                            <View style={styles.list}>
                                {medicines.map((item, index) => (
                                    <View
                                        key={`${item}-${index}`}
                                        style={styles.medicineCard}
                                    >
                                        <View style={styles.medicineIcon}>
                                            <ThemedText
                                                style={styles.medicineIconText}
                                            >
                                                +
                                            </ThemedText>
                                        </View>

                                        <ThemedText style={styles.medicineName}>
                                            {item}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <Pressable
                        onPress={handleContinue}
                        style={({ pressed }) => [
                            styles.continueButton,
                            pressed && styles.pressed,
                        ]}
                    >
                        <ThemedText style={styles.continueText}>
                            متابعة
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
        paddingTop: 14,
        paddingBottom: 34,
    },

    header: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },

    eyebrow: {
        fontSize: 13,
        color: '#78AEB8',
        marginBottom: 7,
        textAlign: 'right',
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

    inputCard: {
        padding: 18,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6899A3',
        marginBottom: 9,
        textAlign: 'right',
    },

    input: {
        minHeight: 52,
        borderRadius: 16,
        paddingHorizontal: 15,
        backgroundColor: '#F1FBFD',
        borderWidth: 1,
        borderColor: '#CFEFF4',
        color: '#5F929C',
        fontSize: 15,
    },

    addButton: {
        minHeight: 52,
        marginTop: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
        elevation: 1,
    },

    addButtonText: {
        color: '#45B8CC',
        fontSize: 15,
        fontWeight: '800',
    },

    medicinesSection: {
        marginTop: 26,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#6899A3',
        marginBottom: 12,
        textAlign: 'right',
    },

    emptyCard: {
        minHeight: 180,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    emptyIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        marginBottom: 12,
    },

    emptyIconText: {
        fontSize: 27,
        color: '#45B8CC',
    },

    emptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'center',
    },

    emptyText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 21,
        color: '#83AAB2',
        textAlign: 'center',
    },

    list: {
        gap: 10,
    },

    medicineCard: {
        minHeight: 66,
        paddingHorizontal: 15,
        borderRadius: 18,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    medicineIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        marginLeft: 12,
    },

    medicineIconText: {
        fontSize: 22,
        color: '#45B8CC',
    },

    medicineName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#6899A3',
        textAlign: 'right',
    },

    continueButton: {
        minHeight: 58,
        marginTop: 28,
        borderRadius: 19,
        paddingHorizontal: 18,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
    },

    continueText: {
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