import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#19A9CC',
        tabBarInactiveTintColor: '#688795',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => (
            <ThemedText style={{ fontSize: 20, color }}>📊</ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: 'سجل التدقيق',
          tabBarIcon: ({ color }) => (
            <ThemedText style={{ fontSize: 20, color }}>📋</ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'العمليات',
          tabBarIcon: ({ color }) => (
            <ThemedText style={{ fontSize: 20, color }}>⚡</ThemedText>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#BDE8EF',
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
