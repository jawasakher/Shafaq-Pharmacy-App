import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

// Use the local network IP so the physical phone can connect to the backend running on the laptop
const LOCAL_IP = '192.168.10.137';

export const API_BASE_URL =
  (extra.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? `http://${LOCAL_IP}:3000/api/v1` : 'http://localhost:3000/api/v1');

