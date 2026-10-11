import { getAuthToken, logout } from "../lib/auth";
import { API_BASE_URL } from "./api";

type ApiRequestOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  let { token, headers, ...requestOptions } = options;

  if (!token) {
    try {
      token = (await getAuthToken()) || undefined;
    } catch {
      // Ignore storage read errors
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401) {
    try {
      await logout();
    } catch {
      // Ignore storage clear errors
    }
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `API request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}


