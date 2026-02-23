import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth.store';
import { logout } from '../../services/auth';

export default function ProfileScreen() {
  const { member } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  const initials = (member?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{member?.name || 'Member'}</Text>
        <Text style={styles.role}>{member?.role || 'Member'}</Text>
        <Text style={styles.email}>{member?.email || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            The Foundry PHL Partnerships OS{'\n'}
            Version 0.1.0
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F1F',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D2D5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  initials: {
    color: '#A5B4FC',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    color: '#FAFAFA',
    fontSize: 22,
    fontWeight: '700',
  },
  role: {
    color: '#6366F1',
    fontSize: 15,
    marginTop: 4,
  },
  email: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
  },
  cardText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#1F1F1F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
