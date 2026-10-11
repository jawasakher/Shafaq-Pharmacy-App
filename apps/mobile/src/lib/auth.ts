import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api-client';

const AUTH_TOKEN_KEY = '@shafaq_auth_token';
const USER_DATA_KEY = '@shafaq_user_data';

export type AuthUser = {
    id: string;
    name: string;
    phone: string;
    role?: string;
};

export async function saveSession(
    token: string,
    user: AuthUser,
) {
    await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, token],
        [USER_DATA_KEY, JSON.stringify(user)],
    ]);
}

export async function getAuthToken() {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);

    if (!userData) {
        return null;
    }

    try {
        return JSON.parse(userData) as AuthUser;
    } catch {
        return null;
    }
}

export async function isLoggedIn() {
    const token = await getAuthToken();

    return Boolean(token);
}

export async function verifyServerSession(): Promise<{ valid: boolean; user?: AuthUser }> {
    const token = await getAuthToken();
    if (!token) {
        return { valid: false };
    }

    try {
        const res = await apiRequest<{
            success: boolean;
            data: { id: string; name: string; phone: string; role: string };
        }>('/me');

        if (res.success && res.data) {
            const updatedUser: AuthUser = {
                id: res.data.id,
                name: res.data.name || res.data.phone,
                phone: res.data.phone,
                role: res.data.role,
            };
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
            return { valid: true, user: updatedUser };
        }
        return { valid: false };
    } catch (error: any) {
        // If 401/403, apiRequest already called logout()
        const tokenAfter = await getAuthToken();
        if (!tokenAfter) {
            return { valid: false };
        }
        // If network error, preserve local user data so app works offline
        const currentUser = await getCurrentUser();
        return { valid: true, user: currentUser || undefined };
    }
}

export async function logout() {
    await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
    ]);
}