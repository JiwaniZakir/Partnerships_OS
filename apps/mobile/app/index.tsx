import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../stores/auth.store';
import { loginWithGoogle, devLogin } from '../services/auth';
import { colors } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    GOOGLE_CLIENT_ID
      ? { clientId: GOOGLE_CLIENT_ID }
      : { clientId: 'not-configured' },
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)/home');
    }
  }, [isAuthenticated]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.foreground} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topSpacer} />

      <View style={styles.brandContainer}>
        <Text style={styles.logoLetter}>f</Text>
        <Text style={styles.logoName}>the foundry</Text>
        <View style={styles.subtitleContainer}>
          <View style={styles.subtitleLine} />
          <Text style={styles.subtitle}>PARTNERSHIPS OS</Text>
          <View style={styles.subtitleLine} />
        </View>
      </View>

      <Text style={styles.tagline}>
        Your network, intelligently connected.
      </Text>

      <View style={styles.formContainer}>
        <TouchableOpacity
          style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={googleLoading || !request}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.emailInput}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={colors.foregroundTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleDevLogin}
        />

        <TouchableOpacity
          style={[styles.devButton, devLoading && styles.buttonDisabled]}
          onPress={handleDevLogin}
          disabled={devLoading}
          activeOpacity={0.8}
        >
          {devLoading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Text style={styles.devButtonText}>Sign in with Email</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer}>
        <Text style={styles.apiUrl}>{API_URL}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSpacer: {
    flex: 1.2,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoLetter: {
    fontStyle: 'italic',
    fontSize: 96,
    color: colors.foreground,
    lineHeight: 104,
    fontWeight: '300',
  },
  logoName: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginTop: -4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  subtitleLine: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.foregroundMuted,
  },
  subtitle: {
    color: colors.foregroundMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
  },
  tagline: {
    color: colors.foregroundSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  googleButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.foregroundMuted,
    fontSize: 13,
    fontWeight: '400',
  },
  emailInput: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: colors.foreground,
    fontSize: 16,
    marginBottom: 12,
  },
  devButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  devButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  apiUrl: {
    color: colors.foregroundTertiary,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
