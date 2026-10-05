import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrescriptionScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.smallTitle}>
                    الخطوة التالية
                </Text>

                <Text style={styles.title}>
                    هل لديك وصفة طبية؟
                </Text>

                <Text style={styles.description}>
                    يمكنك إضافة صورة واضحة للوصفة لمساعدة الصيدلية على مراجعة طلبك
                </Text>

                <View style={styles.card}>
                    <View style={styles.icon}>
                        <Text style={styles.plus}>+</Text>
                    </View>

                    <Text style={styles.cardTitle}>
                        إضافة وصفة طبية
                    </Text>

                    <Text style={styles.cardDescription}>
                        أضف صورة واضحة للوصفة من جهازك
                    </Text>

                    <Pressable
                        style={styles.imageButton}
                        onPress={() => {
                            alert('زر إضافة الصورة يعمل');
                        }}
                    >
                        <Text style={styles.imageButtonText}>
                            إضافة صورة
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.info}>
                    <Text style={styles.infoTitle}>
                        الوصفة اختيارية
                    </Text>

                    <Text style={styles.infoText}>
                        يمكنك متابعة الطلب بدون وصفة إذا لم تكن بحاجة إليها
                    </Text>
                </View>

                <Pressable
                    style={styles.continueButton}
                    onPress={() => {
                        alert('زر متابعة يعمل');

                        setTimeout(() => {
                            router.push('/delivery-location');
                        }, 100);
                    }}
                >
                    <Text style={styles.continueText}>
                        متابعة
                    </Text>

                    <Text style={styles.arrow}>
                        ←
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.skipButton}
                    onPress={() => {
                        router.push('/delivery-location');
                    }}
                >
                    <Text style={styles.skipText}>
                        المتابعة بدون وصفة
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
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
        paddingTop: 30,
    },

    smallTitle: {
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

    description: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 23,
        color: '#83AAB2',
        textAlign: 'right',
    },

    card: {
        marginTop: 25,
        minHeight: 280,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    icon: {
        width: 70,
        height: 70,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    plus: {
        fontSize: 36,
        color: '#45B8CC',
    },

    cardTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '800',
        color: '#6899A3',
    },

    cardDescription: {
        marginTop: 8,
        fontSize: 13,
        color: '#83AAB2',
        textAlign: 'center',
    },

    imageButton: {
        marginTop: 20,
        minWidth: 150,
        minHeight: 48,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#45B8CC',
    },

    imageButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },

    info: {
        marginTop: 18,
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    infoTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    infoText: {
        marginTop: 5,
        fontSize: 12,
        lineHeight: 19,
        color: '#83AAB2',
        textAlign: 'right',
    },

    continueButton: {
        minHeight: 58,
        marginTop: 22,
        borderRadius: 19,
        paddingHorizontal: 18,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
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

    skipButton: {
        minHeight: 50,
        marginTop: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    skipText: {
        color: '#45B8CC',
        fontSize: 14,
        fontWeight: '700',
    },
});