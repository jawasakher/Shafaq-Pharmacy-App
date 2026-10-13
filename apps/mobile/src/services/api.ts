import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const PRODUCTION_API_URL = 'https://shafaq-pharmacy-app-production.up.railway.app/api/v1';

export const API_BASE_URL =
  (extra.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  PRODUCTION_API_URL;

