import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/auth.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export async function loginWithGoogle(idToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();

  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);

  useAuthStore.getState().setAuth(data.member, data.accessToken, data.refreshToken);
}

export async function restoreSession(): Promise<boolean> {
  try {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (!accessToken || !refreshToken) {
      useAuthStore.getState().setLoading(false);
      return false;
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const member = await response.json();
      useAuthStore.getState().setAuth(member, accessToken, refreshToken);
      return true;
    }

    // Try refresh
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json();
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

      const meResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (meResponse.ok) {
        const member = await meResponse.json();
        useAuthStore.getState().setAuth(member, tokens.accessToken, tokens.refreshToken);
        return true;
      }
    }

    useAuthStore.getState().setLoading(false);
    return false;
  } catch {
    useAuthStore.getState().setLoading(false);
    return false;
  }
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  useAuthStore.getState().logout();
}
