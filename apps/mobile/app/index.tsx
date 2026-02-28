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

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)/voice');
    }
  }, [isAuthenticated]);

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'To enable Google Sign-In:\n\n1. Create a Google OAuth 2.0 Web Client ID\n2. Add it to .env as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID\n\nUse Dev Login below to test the app now.',
      [{ text: 'OK' }],
    );
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

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
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

      <Text style={styles.hint}>approved emails: admin@example.com</Text>

      <Text style={styles.apiUrl}>↗ {API_URL}</Text>
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
  devButtonDisabled: { opacity: 0.5 },
  devButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: '#374151',
    fontSize: 11,
    marginTop: 16,
  },
  apiUrl: {
    color: '#1F2937',
    fontSize: 10,
    marginTop: 6,
  },
});
