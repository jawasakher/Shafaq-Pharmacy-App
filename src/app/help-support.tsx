import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router } from 'expo-router';

const faqs = [
    {
        id: '1',
        question: 'كيف أطلب دواء',
        answer:
            'اختر طلب دواء من الصفحة الرئيسية ثم أضف الأدوية التي تحتاجها وأكمل خطوات الوصفة والموقع واختيار الصيدلية وإرسال الطلب',
    },
    {
        id: '2',
        question: 'كيف أرفع وصفة طبية',
        answer:
            'يمكنك إرفاق صورة الوصفة الطبية أثناء طلب الدواء حتى يتمكن الصيدلي من مراجعتها',
    },
    {
        id: '3',
        question: 'كيف أتابع طلبي',
        answer:
            'يمكنك متابعة حالة طلبك من قسم طلباتي ومشاهدة مراحل الطلب حتى يتم التسليم',
    },
    {
        id: '4',
        question: 'كيف أستخدم الاستشارة الصيدلانية',
        answer:
            'ادخل إلى قسم الاستشارة الصيدلانية ثم ابدأ استشارة جديدة وأرسل معلوماتك وأعراضك إلى الصيدلي',
    },
    {
        id: '5',
        question: 'ماذا يحدث إذا لم يتوفر الدواء',
        answer:
            'إذا لم يتوفر الدواء لدى الصيدلية يمكن تحويل الطلب إلى صيدلية أخرى وفق آلية شَفَق',
    },
];

export default function HelpSupportScreen() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggleFaq = (id: string) => {
        setOpenId((current) => (current === id ? null : id));
    };

    const handleContactSupport = () => {
        Alert.alert(
            'دعم شَفَق',
            'سيتم توفير التواصل مع دعم شَفَق قريبًا',
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.title}>المساعدة والدعم</Text>

                        <Text style={styles.subtitle}>
                            نحن هنا لمساعدتك داخل شَفَق
                        </Text>
                    </View>
                </View>

                <View style={styles.welcomeCard}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>؟</Text>
                    </View>

                    <View style={styles.welcomeText}>
                        <Text style={styles.welcomeTitle}>
                            كيف يمكننا مساعدتك
                        </Text>

                        <Text style={styles.welcomeDescription}>
                            اختر السؤال المناسب لمعرفة المزيد عن استخدام شَفَق
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>
                    الأسئلة الشائعة
                </Text>

                <View style={styles.faqContainer}>
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;

                        return (
                            <TouchableOpacity
                                key={faq.id}
                                style={[
                                    styles.faqCard,
                                    isOpen && styles.faqCardOpen,
                                ]}
                                onPress={() => toggleFaq(faq.id)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.questionRow}>
                                    <Text style={styles.question}>
                                        {faq.question}
                                    </Text>

                                    <Text style={styles.arrow}>
                                        {isOpen ? '−' : '+'}
                                    </Text>
                                </View>

                                {isOpen && (
                                    <View style={styles.answerContainer}>
                                        <Text style={styles.answer}>
                                            {faq.answer}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>
                        تحتاج إلى مساعدة إضافية
                    </Text>

                    <Text style={styles.contactDescription}>
                        يمكنك التواصل مع دعم شَفَق عند وجود مشكلة أو استفسار يحتاج إلى مساعدة
                    </Text>

                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleContactSupport}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.contactButtonText}>
                            التواصل مع الدعم
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        دعم شَفَق مخصص لمساعدتك في استخدام التطبيق ومتابعة طلباتك
                    </Text>
                </View>
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
        paddingTop: 56,
        paddingBottom: 40,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#D7F3F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    backText: {
        fontSize: 30,
        lineHeight: 32,
        color: '#45B8CC',
        marginTop: -2,
    },

    headerText: {
        flex: 1,
    },

    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    subtitle: {
        fontSize: 14,
        color: '#83AAB2',
        marginTop: 4,
        textAlign: 'right',
    },

    welcomeCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#D7F3F7',
        borderRadius: 22,
        padding: 18,
        marginBottom: 28,
    },

    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#45B8CC',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 14,
    },

    icon: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    welcomeText: {
        flex: 1,
    },

    welcomeTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
        marginBottom: 5,
    },

    welcomeDescription: {
        fontSize: 13,
        lineHeight: 21,
        color: '#719EA7',
        textAlign: 'right',
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
        marginBottom: 12,
    },

    faqContainer: {
        gap: 10,
    },

    faqCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 17,
        borderWidth: 1,
        borderColor: '#E1F4F7',
    },

    faqCardOpen: {
        borderColor: '#9DDFE9',
    },

    questionRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    question: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#6899A3',
        textAlign: 'right',
    },

    arrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#D7F3F7',
        color: '#45B8CC',
        fontSize: 19,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 27,
        marginLeft: 12,
    },

    answerContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EAF7F9',
        marginTop: 14,
        paddingTop: 13,
    },

    answer: {
        fontSize: 14,
        lineHeight: 23,
        color: '#719EA7',
        textAlign: 'right',
    },

    contactCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 20,
        marginTop: 28,
        borderWidth: 1,
        borderColor: '#E1F4F7',
    },

    contactTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
        marginBottom: 8,
    },

    contactDescription: {
        fontSize: 13,
        lineHeight: 22,
        color: '#719EA7',
        textAlign: 'right',
        marginBottom: 16,
    },

    contactButton: {
        backgroundColor: '#45B8CC',
        borderRadius: 15,
        paddingVertical: 14,
        alignItems: 'center',
    },

    contactButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    infoCard: {
        backgroundColor: '#D7F3F7',
        borderRadius: 18,
        padding: 16,
        marginTop: 14,
    },

    infoText: {
        fontSize: 13,
        lineHeight: 21,
        color: '#6899A3',
        textAlign: 'right',
    },
});