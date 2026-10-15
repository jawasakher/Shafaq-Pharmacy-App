import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiRequest } from '@/services/api-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('app_updates', {
      name: 'تحديثات التطبيق',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#19A9CC',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return undefined;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found in app.json');
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      // Register token with Shafaq backend
      await apiRequest('/devices/push-token', {
        method: 'POST',
        body: JSON.stringify({
          token,
          platform: Platform.OS,
        }),
      });

    } catch (e) {
      console.warn('Push token registration failed:', e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}


