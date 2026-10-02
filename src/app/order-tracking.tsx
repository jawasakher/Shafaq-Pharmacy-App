import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

export default function OrderTrackingScreen() {
    const handleBackToHome = () => {
        router.replace('/')
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    <View style={styles.header}>
                        <ThemedText style={styles.eyebrow}>
                            تتبع طلبك
                        </ThemedText>

                        <ThemedText style={styles.title}>
                            طلبك قيد المراجعة
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            الصيدلية تراجع طلبك وتتأكد من توفر الأدوية
                        </ThemedText>
                    </View>

                    <View style={styles.statusCard}>

                        <View style={styles.statusIcon}>
                            <ThemedText style={styles.statusIconText}>
                                ✓
                            </ThemedText>
                        </View>

                        <View style={styles.statusInfo}>
                            <ThemedText style={styles.statusTitle}>
                                تم إرسال الطلب
                            </ThemedText>

                            <ThemedText style={styles.statusText}>
                                وصل طلبك إلى الصيدلية بنجاح
                            </ThemedText>
                        </View>

                    </View>

                    <View style={styles.timeline}>

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDotActive}>
                                <ThemedText style={styles.dotText}>
                                    ✓
                                </ThemedText>
                            </View>

                            <View style={styles.timelineContent}>
                                <ThemedText style={styles.timelineTitle}>
                                    تم إرسال الطلب
                                </ThemedText>

                                <ThemedText style={styles.timelineText}>
                                    طلبك وصل إلى الصيدلية
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.line} />

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDotCurrent}>
                                <ThemedText style={styles.dotText}>
                                    •
                                </ThemedText>
                            </View>

                            <View style={styles.timelineContent}>
                                <ThemedText style={styles.timelineTitle}>
                                    بانتظار تأكيد الصيدلية
                                </ThemedText>

                                <ThemedText style={styles.timelineText}>
                                    سيتم التأكد من توفر الأدوية والأسعار
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.line} />

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot}>
                                <ThemedText style={styles.dotText}>
                                    •
                                </ThemedText>
                            </View>

                            <View style={styles.timelineContent}>
                                <ThemedText style={styles.timelineTitleMuted}>
                                    تجهيز الطلب
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.line} />

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot}>
                                <ThemedText style={styles.dotText}>
                                    •
                                </ThemedText>
                            </View>

                            <View style={styles.timelineContent}>
                                <ThemedText style={styles.timelineTitleMuted}>
                                    مع مندوب التوصيل
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.line} />

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot}>
                                <ThemedText style={styles.dotText}>
                                    •
                                </ThemedText>
                            </View>

                            <View style={styles.timelineContent}>
                                <ThemedText style={styles.timelineTitleMuted}>
                                    تم التسليم
                                </ThemedText>
                            </View>
                        </View>

                    </View>

                    <Pressable
                        onPress={handleBackToHome}
                        hitSlop={8}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.pressed,
                        ]}
                    >
                        <ThemedText style={styles.buttonText}>
                            العودة إلى الرئيسية
                        </ThemedText>

                        <ThemedText style={styles.arrow}>
                            ←
                        </ThemedText>
                    </Pressable>

                </View>
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
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
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
        fontSize: 27,
        lineHeight: 36,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 23,
        color: '#83AAB2',
        textAlign: 'right',
    },

    statusCard: {
        marginTop: 26,
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#BDE8EF',
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },

    statusIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    statusIconText: {
        fontSize: 30,
        fontWeight: '800',
        color: '#45B8CC',
    },

    statusInfo: {
        flex: 1,
        marginRight: 14,
        alignItems: 'flex-end',
    },

    statusTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    statusText: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 21,
        color: '#83AAB2',
        textAlign: 'right',
    },

    timeline: {
        marginTop: 28,
    },

    timelineItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },

    timelineDotActive: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#45B8CC',
    },

    timelineDotCurrent: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 2,
        borderColor: '#45B8CC',
    },

    timelineDot: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#CDEDF2',
    },

    dotText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#45B8CC',
    },

    timelineContent: {
        flex: 1,
        marginRight: 14,
        alignItems: 'flex-end',
    },

    timelineTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    timelineTitleMuted: {
        fontSize: 15,
        fontWeight: '700',
        color: '#9ABBC1',
        textAlign: 'right',
    },

    timelineText: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 19,
        color: '#83AAB2',
        textAlign: 'right',
    },

    line: {
        width: 2,
        height: 22,
        marginRight: 18,
        backgroundColor: '#CDEDF2',
    },

    button: {
        minHeight: 58,
        marginTop: 'auto',
        marginBottom: 18,
        borderRadius: 19,
        paddingHorizontal: 18,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#45B8CC',
        borderWidth: 1,
        borderColor: '#63C7D6',
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
})