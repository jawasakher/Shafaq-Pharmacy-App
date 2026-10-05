import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const PERSONAL_DATA_KEY = '@shafaq_personal_data';

export default function PersonalDataScreen() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        loadPersonalData();
    }, []);

    const loadPersonalData = async () => {
        try {
            const savedData = await AsyncStorage.getItem(PERSONAL_DATA_KEY);

            if (savedData) {
                const data = JSON.parse(savedData);

                setName(data.name ?? '');
                setPhone(data.phone ?? '');
                setEmail(data.email ?? '');
            }
        } catch (error) {
            console.log('Error loading personal data', error);
        }
    };

    const handleSave = async () => {
        try {
            const personalData = {
                name,
                phone,
                email,
            };

            await AsyncStorage.setItem(
                PERSONAL_DATA_KEY,
                JSON.stringify(personalData),
            );

            Alert.alert('تم الحفظ', 'تم حفظ بياناتك الشخصية بنجاح');

            router.back();
        } catch (error) {
            Alert.alert(
                'تعذر الحفظ',
                'حدث خطأ أثناء حفظ بياناتك',
            );

            console.log('Error saving personal data', error);
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

                <Text style={styles.title}>بياناتي الشخصية</Text>

                <Text style={styles.subtitle}>
                    يمكنك مراجعة معلومات حسابك الشخصية
                </Text>

                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>ش</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>الاسم</Text>

                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        textAlign="right"
                        placeholder="أدخل اسمك"
                        placeholderTextColor="#A0BEC3"
                    />

                    <Text style={styles.label}>رقم الهاتف</Text>

                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        textAlign="right"
                        keyboardType="phone-pad"
                        placeholder="أدخل رقم هاتفك"
                        placeholderTextColor="#A0BEC3"
                    />

                    <Text style={styles.label}>البريد الإلكتروني</Text>

                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        textAlign="right"
                        keyboardType="email-address"
                        placeholder="أدخل بريدك الإلكتروني"
                        placeholderTextColor="#A0BEC3"
                    />
                </View>

                <TouchableOpacity
                    style={styles.saveButton}
                    activeOpacity={0.8}
                    onPress={handleSave}
                >
                    <Text style={styles.saveText}>حفظ التغييرات</Text>
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
    avatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: '#D7F3F7',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 25,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#45B8CC',
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
        marginBottom: 18,
        paddingHorizontal: 15,
        borderRadius: 15,
        backgroundColor: '#F1FBFD',
        borderWidth: 1,
        borderColor: '#E0F3F6',
        fontSize: 14,
        color: '#5F929C',
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