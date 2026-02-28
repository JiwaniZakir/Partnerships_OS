import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../stores/auth.store';
import { loginWithGoogle, devLogin } from '../services/auth';

// Required for web browser auth session to complete
WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth setup — only if client ID is configured
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    GOOGLE_CLIENT_ID
      ? { clientId: GOOGLE_CLIENT_ID }
      : { clientId: 'not-configured' },
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)/voice');
    }
  }, [isAuthenticated]);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        setGoogleLoading(true);
        loginWithGoogle(idToken)
          .catch((err) => {
            Alert.alert('Google Sign-In Failed', err.message || 'Authentication failed.');
          })
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) {
      Alert.alert(
        'Not Configured',
        'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env to enable Google Sign-In.\n\nUse Dev Login below for now.',
      );
      return;
    }
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Failed to start sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Enter your approved email address.');
      return;
    }
    setDevLoading(true);
    try {
      await devLogin(email.trim());
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Check that your email is in the approved list.');
    } finally {
      setDevLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoLetter}>f</Text>
        <Text style={styles.logo}>partnerships</Text>
        <Text style={styles.subtitle}>PARTNERSHIPS OS</Text>
      </View>

      <Text style={styles.tagline}>
        Your AI-powered partnership intelligence platform
      </Text>

      <TouchableOpacity
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={googleLoading || !request}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#0A0A0A" />
        ) : (
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or dev login</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.emailInput}
        value={email}
        onChangeText={setEmail}
        placeholder="your@approved-email.com"
        placeholderTextColor="#555"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={handleDevLogin}
      />

      <TouchableOpacity
        style={[styles.devButton, devLoading && styles.buttonDisabled]}
        onPress={handleDevLogin}
        disabled={devLoading}
      >
        {devLoading ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : (
          <Text style={styles.devButtonText}>Dev Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.apiUrl}>{API_URL}</Text>
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
    marginBottom: 32,
  },
  logoLetter: {
    fontStyle: 'italic',
    fontSize: 100,
    color: '#F1EFE7',
    lineHeight: 110,
  },
  logo: {
    color: '#F1EFE7',
    fontSize: 28,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 6,
  },
  tagline: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 280,
  },
  googleButton: {
    backgroundColor: '#F1EFE7',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
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
    backgroundColor: '#222',
  },
  dividerText: {
    color: '#555',
    fontSize: 12,
  },
  emailInput: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
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
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  devButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
  },
  apiUrl: {
    color: '#1F2937',
    fontSize: 10,
    marginTop: 24,
  },
});
