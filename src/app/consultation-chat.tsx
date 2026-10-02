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

type Message = {
    id: string
    text: string
    sender: 'customer' | 'pharmacist'
}

export default function ConsultationChatScreen() {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'مرحبًا بك في الاستشارة سأراجع المعلومات التي أرسلتها وأساعدك بكل ما أستطيع',
            sender: 'pharmacist',
        },
    ])

    const handleSend = () => {
        const trimmedMessage = message.trim()

        if (!trimmedMessage) {
            return
        }

        setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: Date.now().toString(),
                text: trimmedMessage,
                sender: 'customer',
            },
        ])

        setMessage('')
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboard}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={10}
                >

                    <View style={styles.header}>
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={8}
                            style={styles.backButton}
                        >
                            <ThemedText style={styles.backText}>
                                →
                            </ThemedText>
                        </Pressable>

                        <View style={styles.headerInfo}>
                            <ThemedText style={styles.eyebrow}>
                                استشارة صيدلانية
                            </ThemedText>

                            <ThemedText style={styles.title}>
                                الصيدلي المناوب
                            </ThemedText>

                            <View style={styles.onlineRow}>
                                <View style={styles.onlineDot} />

                                <ThemedText style={styles.onlineText}>
                                    متصل الآن
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.privateNotice}>
                        <ThemedText style={styles.privateText}>
                            هذه المحادثة خاصة بينك وبين الصيدلي
                        </ThemedText>
                    </View>

                    <ScrollView
                        style={styles.messages}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((item) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.messageRow,
                                    item.sender === 'customer'
                                        ? styles.customerRow
                                        : styles.pharmacistRow,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        item.sender === 'customer'
                                            ? styles.customerBubble
                                            : styles.pharmacistBubble,
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.messageText,
                                            item.sender === 'customer'
                                                ? styles.customerMessageText
                                                : styles.pharmacistMessageText,
                                        ]}
                                    >
                                        {item.text}
                                    </ThemedText>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.inputArea}>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="اكتب رسالتك"
                            placeholderTextColor="#A5C2C8"
                            textAlign="right"
                            multiline
                            style={styles.input}
                        />

                        <Pressable
                            onPress={handleSend}
                            hitSlop={8}
                            style={({ pressed }) => [
                                styles.sendButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <ThemedText style={styles.sendIcon}>
                                ←
                            </ThemedText>
                        </Pressable>
                    </View>

                </KeyboardAvoidingView>
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

    keyboard: {
        flex: 1,
    },

    header: {
        minHeight: 78,
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#D7F3F7',
        backgroundColor: '#FFFFFF',
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

    headerInfo: {
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-end',
    },

    eyebrow: {
        fontSize: 11,
        color: '#78AEB8',
        textAlign: 'right',
    },

    title: {
        marginTop: 2,
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },

    onlineRow: {
        marginTop: 3,
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },

    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginLeft: 5,
        backgroundColor: '#45B8CC',
    },

    onlineText: {
        fontSize: 10,
        color: '#78AEB8',
    },

    privateNotice: {
        marginHorizontal: 20,
        marginTop: 12,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: '#E9F9FC',
        borderWidth: 1,
        borderColor: '#D7F3F7',
    },

    privateText: {
        fontSize: 11,
        color: '#78AEB8',
        textAlign: 'center',
    },

    messages: {
        flex: 1,
    },

    messagesContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },

    messageRow: {
        width: '100%',
        marginBottom: 14,
    },

    customerRow: {
        alignItems: 'flex-start',
    },

    pharmacistRow: {
        alignItems: 'flex-end',
    },

    messageBubble: {
        maxWidth: '82%',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 19,
    },

    pharmacistBubble: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
        borderTopRightRadius: 5,
    },

    customerBubble: {
        backgroundColor: '#45B8CC',
        borderTopLeftRadius: 5,
    },

    messageText: {
        fontSize: 13,
        lineHeight: 21,
        textAlign: 'right',
    },

    pharmacistMessageText: {
        color: '#6899A3',
    },

    customerMessageText: {
        color: '#FFFFFF',
    },

    inputArea: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#D7F3F7',
    },

    input: {
        flex: 1,
        minHeight: 48,
        maxHeight: 110,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 17,
        backgroundColor: '#F1FBFD',
        borderWidth: 1,
        borderColor: '#CDEDF2',
        color: '#5F929C',
        fontSize: 14,
    },

    sendButton: {
        width: 48,
        height: 48,
        marginRight: 8,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#45B8CC',
    },

    sendIcon: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '800',
    },

    pressed: {
        opacity: 0.78,
        transform: [
            {
                scale: 0.96,
            },
        ],
    },
})