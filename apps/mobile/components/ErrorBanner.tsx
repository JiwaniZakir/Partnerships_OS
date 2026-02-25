import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useUIStore } from '../stores/ui.store';

export function ErrorBanner() {
  const { error, success, setError, setSuccess } = useUIStore();

  useEffect(() => {
    if (!error && !success) return;

    const timer = setTimeout(() => {
      if (error) setError(null);
      if (success) setSuccess(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [error, success, setError, setSuccess]);

  if (!error && !success) return null;

  const isError = !!error;
  const message = error || success;

  return (
    <View style={[styles.container, isError ? styles.errorBg : styles.successBg]}>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (isError) setError(null);
          else setSuccess(null);
        }}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissText}>{'\u2715'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  errorBg: {
    backgroundColor: '#7F1D1D',
  },
  successBg: {
    backgroundColor: '#14532D',
  },
  message: {
    flex: 1,
    color: '#FAFAFA',
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
  dismissText: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
  },
});
