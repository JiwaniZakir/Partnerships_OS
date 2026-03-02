import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ContactListItem } from '../../components/ContactListItem';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

interface Contact {
  id: string;
  fullName: string;
  organization: string;
  title: string;
  warmthScore: number;
  contactType: string;
}

type FilterMode = 'all' | 'mine';

export default function ContactsScreen() {
  const router = useRouter();
  const member = useAuthStore((s) => s.member);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterMode>('all');

  const fetchContacts = useCallback(async (searchTerm?: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (searchTerm) params.set('search', searchTerm);
      if (filter === 'mine' && member?.id) params.set('onboardedById', member.id);

      const data = await api.get<{
        contacts: Contact[];
        pagination: { total: number };
      }>(`/contacts?${params}`);

      setContacts(data.contacts);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, member?.id]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchContacts(search || undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchContacts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts(search || undefined);
  }, [search, fetchContacts]);

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
      {/* Title row */}
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{total}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'mine' && styles.filterTabActive]}
          onPress={() => setFilter('mine')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'mine' && styles.filterTextActive]}>
            My Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>{'\u2315'}</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, company, or role..."
            placeholderTextColor={colors.foregroundTertiary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Text style={styles.searchClear}>{'\u2715'}</Text>
            </TouchableOpacity>
          )}
        </View>
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
          <ContactListItem
            fullName={item.fullName}
            organization={item.organization}
            title={item.title}
            warmthScore={item.warmthScore}
            contactType={item.contactType}
            onPress={() => router.push(`/(auth)/contact-detail?id=${item.id}`)}
          />
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
            <Text style={styles.emptyTitle}>
              {search ? 'No results' : 'No contacts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? `No contacts match "${search}". Try a different search term.`
                : 'Your network is empty. Use the Add tab to start building it.'}
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
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.foreground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    color: colors.foregroundMuted,
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    paddingVertical: 13,
    fontSize: fontSize.md,
  },
  searchClear: {
    color: colors.foregroundMuted,
    fontSize: 14,
    padding: spacing.xs,
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
