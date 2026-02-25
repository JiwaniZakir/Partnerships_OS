import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';

interface ContactDetail {
  id: string;
  fullName: string;
  title: string;
  organization: string;
  organizationType: string;
  contactType: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  personalWebsite?: string;
  warmthScore: number;
  researchSummary?: string;
  keyAchievements?: string[];
  potentialValue?: string;
  mutualInterestsWithFoundry?: string[];
  onboardedBy?: { name: string };
  createdAt: string;
  interactions?: {
    id: string;
    type: string;
    date: string;
    summary: string;
    member?: { name: string };
  }[];
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchContact = async () => {
      try {
        const data = await api.get<ContactDetail>(`/contacts/${id}`);
        setContact(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const renderWarmthStars = (score: number) => {
    const filled = Math.round(score * 5);
    return Array.from({ length: 5 }, (_, i) => (i < filled ? '\u2605' : '\u2606')).join('');
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F1EFE7" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Contact not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = contact.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar and Name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{contact.fullName}</Text>
          <Text style={styles.titleOrg}>
            {contact.title ? `${contact.title} @ ${contact.organization}` : contact.organization}
          </Text>
          <Text style={styles.warmth}>{renderWarmthStars(contact.warmthScore)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{contact.contactType}</Text>
          </View>
        </View>

        {/* Contact Info */}
        {(contact.email || contact.phone || contact.linkedinUrl) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.card}>
              {contact.email && (
                <TouchableOpacity
                  onPress={() => openLink(`mailto:${contact.email}`)}
                  style={styles.contactRow}
                >
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactLink}>{contact.email}</Text>
                </TouchableOpacity>
              )}
              {contact.phone && (
                <TouchableOpacity
                  onPress={() => openLink(`tel:${contact.phone}`)}
                  style={styles.contactRow}
                >
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactLink}>{contact.phone}</Text>
                </TouchableOpacity>
              )}
              {contact.linkedinUrl && (
                <TouchableOpacity
                  onPress={() => openLink(contact.linkedinUrl!)}
                  style={styles.contactRow}
                >
                  <Text style={styles.contactLabel}>LinkedIn</Text>
                  <Text style={styles.contactLink}>View Profile</Text>
                </TouchableOpacity>
              )}
              {contact.twitterUrl && (
                <TouchableOpacity
                  onPress={() => openLink(contact.twitterUrl!)}
                  style={styles.contactRow}
                >
                  <Text style={styles.contactLabel}>Twitter</Text>
                  <Text style={styles.contactLink}>View Profile</Text>
                </TouchableOpacity>
              )}
              {contact.personalWebsite && (
                <TouchableOpacity
                  onPress={() => openLink(contact.personalWebsite!)}
                  style={styles.contactRow}
                >
                  <Text style={styles.contactLabel}>Website</Text>
                  <Text style={styles.contactLink}>{contact.personalWebsite}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Research Summary */}
        {contact.researchSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Research Profile</Text>
            <View style={styles.card}>
              <Text style={styles.bodyText}>{contact.researchSummary}</Text>
            </View>
          </View>
        )}

        {/* Key Achievements */}
        {contact.keyAchievements && contact.keyAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Achievements</Text>
            <View style={styles.card}>
              {contact.keyAchievements.map((achievement, i) => (
                <Text key={i} style={styles.listItem}>
                  {'\u2022'} {achievement}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Potential Value */}
        {contact.potentialValue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why They Matter</Text>
            <View style={styles.card}>
              <Text style={styles.bodyText}>{contact.potentialValue}</Text>
            </View>
          </View>
        )}

        {/* Interaction History */}
        {contact.interactions && contact.interactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interaction History</Text>
            {contact.interactions.map((interaction) => (
              <View key={interaction.id} style={[styles.card, styles.interactionCard]}>
                <View style={styles.interactionHeader}>
                  <Text style={styles.interactionType}>{interaction.type}</Text>
                  <Text style={styles.interactionDate}>
                    {new Date(interaction.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.bodyText}>{interaction.summary}</Text>
                {interaction.member && (
                  <Text style={styles.interactionMember}>
                    with {interaction.member.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Onboarded By */}
        {contact.onboardedBy && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onboarded By</Text>
            <View style={styles.card}>
              <Text style={styles.bodyText}>{contact.onboardedBy.name}</Text>
              <Text style={styles.metaText}>
                Added {new Date(contact.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: '#F1EFE7',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2A2823',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  initials: {
    color: '#F1EFE7',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    color: '#F1EFE7',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleOrg: {
    color: '#A0998A',
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  warmth: {
    color: '#C4B99A',
    fontSize: 20,
    marginTop: 8,
    letterSpacing: 2,
  },
  badge: {
    marginTop: 12,
    backgroundColor: '#2A2823',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#C4B99A',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#A0998A',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  contactLabel: {
    color: '#6B6560',
    fontSize: 14,
  },
  contactLink: {
    color: '#F1EFE7',
    fontSize: 14,
    fontWeight: '500',
  },
  bodyText: {
    color: '#F1EFE7',
    fontSize: 14,
    lineHeight: 22,
  },
  listItem: {
    color: '#F1EFE7',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 4,
  },
  interactionCard: {
    marginBottom: 10,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  interactionType: {
    color: '#C4B99A',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  interactionDate: {
    color: '#6B6560',
    fontSize: 12,
  },
  interactionMember: {
    color: '#6B6560',
    fontSize: 12,
    marginTop: 8,
  },
  metaText: {
    color: '#6B6560',
    fontSize: 12,
    marginTop: 4,
  },
});
