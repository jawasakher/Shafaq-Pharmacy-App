import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
    return (
        <NativeTabs
            backgroundColor="#FFFFFF"
            indicatorColor="#D7F3F7"
            labelStyle={{
                selected: {
                    color: '#45B8CC',
                },
            }}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>
                    الرئيسية
                </NativeTabs.Trigger.Label>

                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/home.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="orders">
                <NativeTabs.Trigger.Label>
                    الطلبات
                </NativeTabs.Trigger.Label>

                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/explore.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="consultation">
                <NativeTabs.Trigger.Label>
                    الاستشارة
                </NativeTabs.Trigger.Label>

                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/explore.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="account">
                <NativeTabs.Trigger.Label>
                    حسابي
                </NativeTabs.Trigger.Label>

                <NativeTabs.Trigger.Icon
                    src={require('@/assets/images/tabIcons/home.png')}
                    renderingMode="template"
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}