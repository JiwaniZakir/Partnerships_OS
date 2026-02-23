import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)/voice');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const handleGoogleSignIn = async () => {
    // In production, use @react-native-google-signin/google-signin
    // For now, show placeholder
    // const { idToken } = await GoogleSignin.signIn();
    // await loginWithGoogle(idToken);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>THE FOUNDRY</Text>
        <Text style={styles.subtitle}>Partnerships OS</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.tagline}>
          Your AI-powered partnership intelligence platform
        </Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

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
  logo: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#6366F1',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
  },
  content: {
    marginBottom: 64,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  googleButton: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '600',
  },
  restriction: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 16,
  },
});
