import { router } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AccountScreen() {
    const menuItems = [
        {
            title: 'بياناتي الشخصية',
            subtitle: 'الاسم ورقم الهاتف',
            icon: '◯',
            onPress: () => router.push('/personal-data'),
        },
        {
            title: 'عناويني',
            subtitle: 'إدارة عناوين التوصيل',
            icon: '⌖',
        },
        {
            title: 'الإشعارات',
            subtitle: 'إدارة تنبيهات التطبيق',
            icon: '○',
        },
        {
            title: 'الخصوصية والأمان',
            subtitle: 'إعدادات الحساب والخصوصية',
            icon: '◇',
        },
        {
            title: 'المساعدة والدعم',
            subtitle: 'تواصل معنا عند الحاجة',
            icon: '?',
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>حسابي</Text>
                <Text style={styles.subtitle}>إدارة حسابك وإعداداتك</Text>

                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>ش</Text>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>مرحباً بك في شَفَق</Text>
                        <Text style={styles.profileText}>إدارة معلوماتك الشخصية</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>إعدادات الحساب</Text>

                <View style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.title}
                            style={[
                                styles.menuItem,
                                index !== menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                            activeOpacity={0.75}
                            onPress={item.onPress}
                        >
                            <View style={styles.iconBox}>
                                <Text style={styles.icon}>{item.icon}</Text>
                            </View>

                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>

                            <Text style={styles.arrow}>‹</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.brandCard}>
                    <Text style={styles.brandTitle}>شَفَق</Text>
                    <Text style={styles.brandSubtitle}>نورُ الرعاية</Text>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    activeOpacity={0.8}
                >
                    <Text style={styles.logoutText}>تسجيل الخروج</Text>
                </TouchableOpacity>

                <Text style={styles.version}>الإصدار 1.0</Text>
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
        paddingTop: 60,
        paddingBottom: 120,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#58A6B3',
        textAlign: 'right',
    },
    subtitle: {
        marginTop: 6,
        fontSize: 15,
        color: '#7EA7AF',
        textAlign: 'right',
    },
    profileCard: {
        marginTop: 24,
        padding: 18,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        shadowColor: '#45B8CC',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        elevation: 2,
    },
    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#D7F3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 25,
        fontWeight: '800',
        color: '#45B8CC',
    },
    profileInfo: {
        flex: 1,
        marginRight: 14,
    },
    profileName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#5F929C',
        textAlign: 'right',
    },
    profileText: {
        marginTop: 5,
        fontSize: 13,
        color: '#83AAB2',
        textAlign: 'right',
    },
    sectionTitle: {
        marginTop: 28,
        marginBottom: 10,
        fontSize: 17,
        fontWeight: '800',
        color: '#6899A3',
        textAlign: 'right',
    },
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        overflow: 'hidden',
    },
    menuItem: {
        minHeight: 78,
        paddingHorizontal: 16,
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E7F5F7',
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#D7F3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 19,
        fontWeight: '700',
        color: '#45B8CC',
    },
    menuText: {
        flex: 1,
        marginRight: 13,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#5F929C',
        textAlign: 'right',
    },
    menuSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#86AEB5',
        textAlign: 'right',
    },
    arrow: {
        marginLeft: 8,
        fontSize: 28,
        color: '#9DDFE9',
    },
    brandCard: {
        marginTop: 24,
        paddingVertical: 20,
        borderRadius: 22,
        backgroundColor: '#D7F3F7',
        alignItems: 'center',
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#45B8CC',
    },
    brandSubtitle: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: '700',
        color: '#69AAB5',
    },
    logoutButton: {
        marginTop: 18,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D7F3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#78AEB8',
    },
    version: {
        marginTop: 14,
        fontSize: 12,
        color: '#A0BEC3',
        textAlign: 'center',
    },
});