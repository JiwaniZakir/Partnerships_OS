import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { restoreSession } from '../services/auth';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'fade',
        }}
      />
    </ErrorBoundary>
  );
}
