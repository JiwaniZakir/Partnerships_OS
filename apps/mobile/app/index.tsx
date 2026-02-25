import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { devLogin } from '../services/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const isDev = API_URL.includes('localhost') || __DEV__;

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState('zakir@foundryphl.com');
  const [devLoading, setDevLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)/voice');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F1EFE7" />
      </View>
    );
  }

  const handleGoogleSignIn = async () => {
    // In production, use @react-native-google-signin/google-signin
    // Requires native EAS build — not available in Expo Go
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In requires a native build via EAS. Use Dev Login for local testing.'
    );
  };

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      await devLogin(email);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Check that the API is running.');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoLetter}>f</Text>
        <Text style={styles.logo}>the foundry</Text>
        <Text style={styles.subtitle}>PARTNERSHIPS OS</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.tagline}>
          Your AI-powered partnership intelligence platform
        </Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      {isDev && (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="email@foundryphl.com"
            placeholderTextColor="#6B6560"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.devButton, devLoading && styles.devButtonDisabled]}
            onPress={handleDevLogin}
            disabled={devLoading}
          >
            {devLoading ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.devButtonText}>Dev Login</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.restriction}>
        Restricted to @foundryphl.com accounts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoLetter: {
    fontStyle: 'italic',
    fontSize: 100,
    color: '#F1EFE7',
    lineHeight: 110,
    marginBottom: 4,
  },
  logo: {
    color: '#F1EFE7',
    fontSize: 28,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#6B6560',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 6,
  },
  content: {
    marginBottom: 48,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  googleButton: {
    backgroundColor: '#F1EFE7',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2A2520',
  },
  dividerText: {
    color: '#6B6560',
    fontSize: 12,
  },
  emailInput: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#141210',
    borderWidth: 1,
    borderColor: '#2A2520',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F1EFE7',
    fontSize: 15,
    marginBottom: 12,
  },
  devButton: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  devButtonDisabled: {
    opacity: 0.5,
  },
  devButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
  },
  restriction: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 20,
  },
});
