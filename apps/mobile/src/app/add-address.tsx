import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const ADDRESS_KEY = '@shafaq_address';

export default function AddAddressScreen() {
    const [address, setAddress] = useState('');
    const [details, setDetails] = useState('');

    const handleSave = async () => {
        if (!address.trim()) {
            Alert.alert('أدخل العنوان', 'يرجى كتابة عنوان التوصيل');
            return;
        }

        try {
            const savedAddress = {
                address: address.trim(),
                details: details.trim(),
            };

            await AsyncStorage.setItem(
                ADDRESS_KEY,
                JSON.stringify(savedAddress),
            );

            Alert.alert('تم الحفظ', 'تم حفظ عنوان التوصيل بنجاح', [
                {
                    text: 'حسنًا',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert(
                'تعذر الحفظ',
                'حدث خطأ أثناء حفظ عنوان التوصيل',
            );

            console.log('Error saving address', error);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.title}>إضافة عنوان جديد</Text>

                <Text style={styles.subtitle}>
                    أضف عنوان التوصيل الخاص بك
                </Text>

                <View style={styles.formCard}>
                    <Text style={styles.label}>العنوان</Text>

                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        textAlign="right"
                        placeholder="مثال اسم الشارع ورقم البناء"
                        placeholderTextColor="#A0BEC3"
                    />

                    <Text style={styles.label}>تفاصيل إضافية</Text>

                    <TextInput
                        style={[styles.input, styles.detailsInput]}
                        value={details}
                        onChangeText={setDetails}
                        textAlign="right"
                        multiline
                        placeholder="مثال الطابق ورقم الشقة وأي تفاصيل تساعد المندوب"
                        placeholderTextColor="#A0BEC3"
                    />
                </View>

                <TouchableOpacity
                    style={styles.saveButton}
                    activeOpacity={0.8}
                    onPress={handleSave}
                >
                    <Text style={styles.saveText}>حفظ العنوان</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1FBFD',
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 50,
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

    formCard: {
        marginTop: 25,
        padding: 18,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
    },

    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '700',
        color: '#6899A3',
        textAlign: 'right',
    },

    input: {
        height: 52,
        marginBottom: 20,
        paddingHorizontal: 15,
        borderRadius: 15,
        backgroundColor: '#F1FBFD',
        borderWidth: 1,
        borderColor: '#E0F3F6',
        fontSize: 14,
        color: '#5F929C',
    },

    detailsInput: {
        height: 110,
        paddingTop: 15,
        textAlignVertical: 'top',
    },

    saveButton: {
        height: 55,
        marginTop: 20,
        borderRadius: 18,
        backgroundColor: '#45B8CC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    saveText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});