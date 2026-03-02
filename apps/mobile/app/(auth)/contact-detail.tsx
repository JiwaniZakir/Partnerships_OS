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
import { colors, spacing, radius, fontSize } from '../../constants/theme';

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
  mutualInterests?: string[];
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

  const renderWarmthBar = (score: number) => {
    const percentage = Math.round(score * 100);
    return (
      <View style={styles.warmthContainer}>
        <View style={styles.warmthBarBg}>
          <View
            style={[
              styles.warmthBarFill,
              {
                width: `${percentage}%`,
                backgroundColor:
                  score >= 0.7 ? colors.success :
                  score >= 0.4 ? colors.warmGold :
                  colors.foregroundMuted,
              },
            ]}
          />
        </View>
        <Text style={styles.warmthLabel}>{percentage}% warmth</Text>
      </View>
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backIcon}>{'\u2190'}</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load</Text>
          <Text style={styles.errorText}>{error || 'This contact could not be found.'}</Text>
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

  const contactLinks = [
    contact.email && { label: 'Email', value: contact.email, url: `mailto:${contact.email}` },
    contact.phone && { label: 'Phone', value: contact.phone, url: `tel:${contact.phone}` },
    contact.linkedinUrl && { label: 'LinkedIn', value: 'View Profile', url: contact.linkedinUrl },
    contact.twitterUrl && { label: 'Twitter', value: 'View Profile', url: contact.twitterUrl },
    contact.personalWebsite && { label: 'Website', value: contact.personalWebsite, url: contact.personalWebsite },
  ].filter(Boolean) as { label: string; value: string; url: string }[];

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backIcon}>{'\u2190'}</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{contact.fullName}</Text>
          {(contact.title || contact.organization) && (
            <Text style={styles.titleOrg}>
              {contact.title ? `${contact.title} at ${contact.organization}` : contact.organization}
            </Text>
          )}

          {/* Badges row */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{contact.contactType}</Text>
            </View>
            {contact.organizationType && (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>{contact.organizationType}</Text>
              </View>
            )}
          </View>

          {/* Warmth */}
          {renderWarmthBar(contact.warmthScore)}
        </View>

        {/* Contact Links */}
        {contactLinks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.card}>
              {contactLinks.map((link, i) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => openLink(link.url)}
                  style={[
                    styles.contactRow,
                    i === contactLinks.length - 1 && styles.contactRowLast,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactLabel}>{link.label}</Text>
                  <Text style={styles.contactValue} numberOfLines={1}>{link.value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AI Research Profile */}
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
                <View key={i} style={styles.achievementRow}>
                  <View style={styles.achievementDot} />
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Why They Matter */}
        {contact.potentialValue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why They Matter</Text>
            <View style={[styles.card, styles.highlightCard]}>
              <Text style={styles.bodyText}>{contact.potentialValue}</Text>
            </View>
          </View>
        )}

        {/* Mutual Interests */}
        {contact.mutualInterests && contact.mutualInterests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mutual Interests</Text>
            <View style={styles.tagContainer}>
              {contact.mutualInterests.map((interest, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interaction History */}
        {contact.interactions && contact.interactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Interactions ({contact.interactions.length})
            </Text>
            {contact.interactions.map((interaction) => (
              <View key={interaction.id} style={[styles.card, styles.interactionCard]}>
                <View style={styles.interactionHeader}>
                  <View style={styles.interactionTypeBadge}>
                    <Text style={styles.interactionTypeText}>{interaction.type}</Text>
                  </View>
                  <Text style={styles.interactionDate}>
                    {new Date(interaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
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
            <Text style={styles.sectionTitle}>Added to Network</Text>
            <View style={styles.card}>
              <View style={styles.onboardedRow}>
                <View style={styles.onboardedAvatar}>
                  <Text style={styles.onboardedAvatarText}>
                    {contact.onboardedBy.name[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.onboardedName}>{contact.onboardedBy.name}</Text>
                  <Text style={styles.onboardedDate}>
                    {new Date(contact.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Navigation
  nav: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  backIcon: {
    color: colors.foreground,
    fontSize: 20,
  },
  backText: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '500',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  titleOrg: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeSecondary: {
    backgroundColor: colors.backgroundCard,
  },
  badgeText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Warmth
  warmthContainer: {
    width: '100%',
    maxWidth: 200,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  warmthBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  warmthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  warmthLabel: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: spacing.sm,
  },

  // Sections
  section: {
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

  // Cards
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightCard: {
    borderColor: colors.warmGold,
    borderWidth: 1,
    backgroundColor: '#FFFDF7',
  },

  // Contact Links
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  contactRowLast: {
    borderBottomWidth: 0,
  },
  contactLabel: {
    color: colors.foregroundMuted,
    fontSize: fontSize.sm,
    fontWeight: '400',
  },
  contactValue: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // Body Text
  bodyText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },

  // Achievements
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  achievementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.foregroundMuted,
    marginTop: 8,
    marginRight: spacing.md,
  },
  achievementText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    lineHeight: 22,
    flex: 1,
  },

  // Tags
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  tagText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    fontWeight: '400',
  },

  // Interactions
  interactionCard: {
    marginBottom: spacing.sm,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  interactionTypeBadge: {
    backgroundColor: colors.backgroundSubtle,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  interactionTypeText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  interactionDate: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
  },
  interactionMember: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Onboarded By
  onboardedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  onboardedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardedAvatarText: {
    color: colors.foregroundSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  onboardedName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  onboardedDate: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
