import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContactListItem } from '../../components/ContactListItem';
import { api } from '../../services/api';

interface Contact {
  id: string;
  fullName: string;
  organization: string;
  title: string;
  warmthScore: number;
  contactType: string;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchContacts = useCallback(async (searchTerm?: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (searchTerm) params.set('search', searchTerm);

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
  }, []);

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
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Contacts</Text>
        <Text style={styles.count}>{total} total</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts..."
          placeholderTextColor="#6B7280"
        />
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactListItem
            fullName={item.fullName}
            organization={item.organization}
            title={item.title}
            warmthScore={item.warmthScore}
            contactType={item.contactType}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search
                ? 'No contacts match your search'
                : 'No contacts yet. Use the voice agent to add your first!'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 24,
    fontWeight: '700',
  },
  count: {
    color: '#6B7280',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1F1F1F',
    color: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
