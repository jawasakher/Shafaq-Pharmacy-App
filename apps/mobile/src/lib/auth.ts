import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@shafaq_auth_token';
const USER_DATA_KEY = '@shafaq_user_data';

export type AuthUser = {
    id: string;
    name: string;
    phone: string;
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

export async function logout() {
    await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
    ]);
}