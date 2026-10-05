import { router } from 'expo-router'
import { useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

export default function ConsultationFormScreen() {
    const [symptoms, setSymptoms] = useState('')
    const [duration, setDuration] = useState('')
    const [age, setAge] = useState('')
    const [medications, setMedications] = useState('')
    const [allergies, setAllergies] = useState('')
    const [details, setDetails] = useState('')

    const handleContinue = () => {
        router.push('/consultation-chat')
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboard}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >

                        <View style={styles.header}>
                            <Pressable
                                onPress={() => router.back()}
                                style={styles.backButton}
                                hitSlop={8}
                            >
                                <ThemedText style={styles.backText}>
                                    →
                                </ThemedText>
                            </Pressable>

                            <View style={styles.headerText}>
                                <ThemedText style={styles.eyebrow}>
                                    استشارة جديدة
                                </ThemedText>

                                <ThemedText style={styles.title}>
                                    أخبرنا عن حالتك
                                </ThemedText>

                                <ThemedText style={styles.subtitle}>
                                    اكتب المعلومات التي تساعد الصيدلي على فهم حالتك بشكل أفضل
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.form}>

                            <Field
                                label="ما الأعراض التي تشعر بها؟"
                                placeholder="اكتب الأعراض"
                                value={symptoms}
                                onChangeText={setSymptoms}
                                multiline
                            />

                            <Field
                                label="منذ متى بدأت الأعراض؟"
                                placeholder="مثال يومين أو ثلاثة أيام"
                                value={duration}
                                onChangeText={setDuration}
                            />

                            <Field
                                label="العمر"
                                placeholder="اكتب عمرك"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                            />

                            <Field
                                label="هل تستخدم أدوية حاليًا؟"
                                placeholder="اكتب أسماء الأدوية أو اكتب لا يوجد"
                                value={medications}
                                onChangeText={setMedications}
                                multiline
                            />

                            <Field
                                label="هل لديك أي حساسية؟"
                                placeholder="اكتب نوع الحساسية أو اكتب لا يوجد"
                                value={allergies}
                                onChangeText={setAllergies}
                                multiline
                            />

                            <Field
                                label="تفاصيل إضافية"
                                placeholder="اكتب أي معلومات أخرى تريد إخبار الصيدلي بها"
                                value={details}
                                onChangeText={setDetails}
                                multiline
                            />

                        </View>

                        <View style={styles.noteCard}>
                            <ThemedText style={styles.noteTitle}>
                                خصوصية الاستشارة
                            </ThemedText>

                            <ThemedText style={styles.noteText}>
                                المعلومات التي تدخلها هنا مخصصة للاستشارة مع الصيدلي
                            </ThemedText>
                        </View>

                        <Pressable
                            onPress={handleContinue}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.button,
                                pressed && styles.pressed,
                            ]}
                        >
                            <ThemedText style={styles.buttonText}>
                                متابعة
                            </ThemedText>

                            <ThemedText style={styles.arrow}>
                                ←
                            </ThemedText>
                        </Pressable>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ThemedView>
    )
}

type FieldProps = {
    label: string
    placeholder: string
    value: string
    onChangeText: (value: string) => void
    multiline?: boolean
    keyboardType?: 'default' | 'number-pad'
}

function Field({
                   label,
                   placeholder,
                   value,
                   onChangeText,
                   multiline = false,
                   keyboardType = 'default',
               }: FieldProps) {
    return (
        <View style={styles.field}>
            <ThemedText style={styles.label}>
                {label}
            </ThemedText>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#A5C2C8"
                multiline={multiline}
                keyboardType={keyboardType}
                textAlign="right"
                textAlignVertical={multiline ? 'top' : 'center'}
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                ]}
            />
        </View>
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

    keyboard: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },

    header: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D7F3F7',
        borderWidth: 1,
        borderColor: '#9DDFE9',
    },

    backText: {
        fontSize: 24,
        color: '#45B8CC',
    },

    headerText: {
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-end',
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
        fontSize: 13,
        lineHeight: 21,
        color: '#83AAB2',
        textAlign: 'right',
    },

    form: {
        marginTop: 28,
    },

    field: {
        marginBottom: 18,
    },

    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    input: {
        minHeight: 54,
        paddingHorizontal: 16,
        borderRadius: 17,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CDEDF2',
        color: '#5F929C',
        fontSize: 14,
    },

    multilineInput: {
        minHeight: 100,
        paddingTop: 15,
    },

    noteCard: {
        marginTop: 4,
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

    button: {
        minHeight: 58,
        marginTop: 20,
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