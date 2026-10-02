import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

export default function ConsultationScreen() {
    const handleStartConsultation = () => {
        router.push('/consultation-form')
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
                            استشارة صيدلانية
                        </ThemedText>

                        <ThemedText style={styles.title}>
                            اسأل صيدليًا
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            تحدث مع صيدلي لمساعدتك في فهم الأعراض والأدوية بطريقة آمنة
                        </ThemedText>
                    </View>

                    <View style={styles.heroCard}>

                        <View style={styles.iconContainer}>
                            <ThemedText style={styles.icon}>
                                ?
                            </ThemedText>
                        </View>

                        <ThemedText style={styles.heroTitle}>
                            تحتاج إلى استشارة؟
                        </ThemedText>

                        <ThemedText style={styles.heroText}>
                            أخبرنا عن حالتك وسيتم توجيهك إلى صيدلي مناسب لبدء الاستشارة
                        </ThemedText>

                        <Pressable
                            onPress={handleStartConsultation}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <ThemedText style={styles.primaryButtonText}>
                                بدء استشارة جديدة
                            </ThemedText>

                            <ThemedText style={styles.arrow}>
                                ←
                            </ThemedText>
                        </Pressable>

                    </View>

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>
                            استشاراتي
                        </ThemedText>
                    </View>

                    <View style={styles.emptyCard}>

                        <View style={styles.emptyIcon}>
                            <ThemedText style={styles.emptyIconText}>
                                ?
                            </ThemedText>
                        </View>

                        <ThemedText style={styles.emptyTitle}>
                            لا توجد استشارات سابقة
                        </ThemedText>

                        <ThemedText style={styles.emptyText}>
                            ستظهر استشاراتك السابقة هنا
                        </ThemedText>

                    </View>

                    <View style={styles.noteCard}>
                        <ThemedText style={styles.noteTitle}>
                            خصوصية الاستشارة
                        </ThemedText>

                        <ThemedText style={styles.noteText}>
                            محادثتك مع الصيدلي خاصة ولا يمكن للإدارة الاطلاع على محتواها
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

    heroCard: {
        marginTop: 28,
        padding: 24,
        borderRadius: 28,
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
    },

    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    icon: {
        fontSize: 38,
        fontWeight: '800',
        color: '#45B8CC',
    },

    heroTitle: {
        marginTop: 18,
        fontSize: 20,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'center',
    },

    heroText: {
        marginTop: 9,
        fontSize: 13,
        lineHeight: 22,
        color: '#83AAB2',
        textAlign: 'center',
    },

    primaryButton: {
        width: '100%',
        minHeight: 56,
        marginTop: 22,
        borderRadius: 18,
        paddingHorizontal: 17,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    arrow: {
        color: '#FFFFFF',
        fontSize: 22,
    },

    sectionHeader: {
        marginTop: 30,
        marginBottom: 12,
        alignItems: 'flex-end',
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    emptyCard: {
        padding: 28,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
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

    noteCard: {
        marginTop: 18,
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    noteTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    noteText: {
        marginTop: 7,
        fontSize: 12,
        lineHeight: 20,
        color: '#83AAB2',
        textAlign: 'right',
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