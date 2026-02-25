import { Platform } from 'react-native';

// Web-safe wrapper around expo-secure-store
// On native: uses encrypted keychain/keystore
// On web: falls back to localStorage (dev only)

let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export async function getItem(key: string): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  // Web fallback
  return localStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  localStorage.removeItem(key);
}
