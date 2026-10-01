import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OrdersScreen() {
    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <ThemedText style={styles.title}>
                        طلباتك
                    </ThemedText>

                    <ThemedText style={styles.subtitle}>
                        ستظهر طلباتك هنا عند إرسالها
                    </ThemedText>
                </View>
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
        flex: 1,
        padding: 24,
        alignItems: 'flex-end',
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#45B8CC',
        textAlign: 'right',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#83AAB2',
        textAlign: 'right',
    },
});