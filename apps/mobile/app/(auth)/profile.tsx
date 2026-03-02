import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth.store';
import { logout } from '../../services/auth';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{member?.name || 'Member'}</Text>
          <Text style={styles.role}>{member?.role || 'Member'}</Text>
          {member?.email && (
            <View style={styles.emailPill}>
              <Text style={styles.email}>{member.email}</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App</Text>
              <Text style={styles.infoValue}>Partnerships OS</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>0.1.0</Text>
            </View>
          </View>
        </View>

        {/* Organization Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization</Text>
          <View style={styles.card}>
            <View style={styles.orgRow}>
              <View style={styles.orgAvatar}>
                <Text style={styles.orgAvatarText}>f</Text>
              </View>
              <View>
                <Text style={styles.orgName}>The Foundry</Text>
                <Text style={styles.orgDesc}>Partnerships Intelligence Platform</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sign Out */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: spacing.xxxl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    lineHeight: 30,
  },
  role: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.md,
    fontWeight: '400',
    marginTop: spacing.xs,
  },
  emailPill: {
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  email: {
    color: colors.foregroundMuted,
    fontSize: fontSize.sm,
    fontWeight: '400',
  },

  // Sections
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: colors.foregroundMuted,
    fontSize: fontSize.md,
    fontWeight: '400',
  },
  infoValue: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '500',
  },

  // Organization
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  orgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  orgName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  orgDesc: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  logoutButton: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    color: colors.destructive,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
