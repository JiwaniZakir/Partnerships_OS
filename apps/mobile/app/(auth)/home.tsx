import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../services/api';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

interface Contact {
  id: string;
  fullName: string;
  organization: string;
  title: string;
  contactType: string;
  createdAt: string;
  onboardedBy?: { name: string };
}

interface Stats {
  totalContacts: number;
  memberContacts: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { member } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats>({ totalContacts: 0, memberContacts: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [contactsData, statsData] = await Promise.all([
        api.get<{ contacts: Contact[]; pagination: { total: number } }>(
          '/contacts?limit=20&sort=recent'
        ),
        api.get<{ totalContacts: number; totalMembers: number }>('/admin/stats').catch(() => null),
      ]);

      setContacts(contactsData.contacts);
      setStats({
        totalContacts: contactsData.pagination.total,
        memberContacts: statsData?.totalContacts || contactsData.pagination.total,
      });
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const timeSince = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const firstName = member?.name ? member.name.split(' ')[0] : '';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}{firstName ? ',' : ''}
          </Text>
          {firstName ? (
            <Text style={styles.greetingName}>{firstName}</Text>
          ) : null}
        </View>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>the foundry</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{stats.totalContacts}</Text>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.6)' }]}>Network size</Text>
        </View>
        <View style={styles.statCardSecondary}>
          <Text style={styles.statNumber}>{contacts.length}</Text>
          <Text style={styles.statLabel}>Recent</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(auth)/add')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionIcon}>+</Text>
          <Text style={styles.quickActionLabel}>Add Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(auth)/search')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionIcon}>{'\u2315'}</Text>
          <Text style={styles.quickActionLabel}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {contacts.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(auth)/contacts')} activeOpacity={0.7}>
            <Text style={styles.sectionAction}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.activityItem}
            onPress={() => router.push(`/(auth)/contact-detail?id=${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.activityAvatar}>
              <Text style={styles.activityInitials}>
                {item.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName} numberOfLines={1}>{item.fullName}</Text>
              <Text style={styles.activityDetail} numberOfLines={1}>
                {item.title ? `${item.title} at ` : ''}{item.organization}
              </Text>
              {item.onboardedBy && (
                <Text style={styles.activityMeta} numberOfLines={1}>
                  Added by {item.onboardedBy.name}
                </Text>
              )}
            </View>
            <Text style={styles.activityTime}>{timeSince(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.foreground}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + tab below to add your first contact and start building your network.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },

  // Greeting
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  greeting: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.md,
    fontWeight: '400',
    lineHeight: 22,
  },
  greetingName: {
    color: colors.foreground,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    lineHeight: 32,
    marginTop: 2,
  },
  brandPill: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  brandPillText: {
    color: colors.foregroundSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '400',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1.2,
    backgroundColor: colors.foreground,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  statCardSecondary: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    color: colors.foreground,
    fontSize: fontSize.title,
    fontWeight: '700',
    lineHeight: 34,
  },
  statLabel: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    fontWeight: '400',
    marginTop: spacing.xs,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: 8,
  },
  quickActionIcon: {
    fontSize: 18,
    color: colors.foreground,
    fontWeight: '300',
  },
  quickActionLabel: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionAction: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // Activity Items
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: 1,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  activityAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityInitials: {
    color: colors.foregroundSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activityInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  activityName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
    lineHeight: 20,
  },
  activityDetail: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  activityMeta: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  activityTime: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
  },

  // Empty State
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});

