import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize } from '../constants/theme';

interface ContactListItemProps {
  fullName: string;
  organization: string;
  title: string;
  warmthScore: number;
  contactType: string;
  onPress?: () => void;
}

export function ContactListItem({
  fullName,
  organization,
  title,
  warmthScore,
  contactType,
  onPress,
}: ContactListItemProps) {
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const warmthColor =
    warmthScore >= 0.7
      ? colors.success
      : warmthScore >= 0.4
        ? colors.warmGold
        : colors.foregroundTertiary;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {title ? `${title} at ` : ''}
          {organization}
        </Text>
      </View>
      <View style={styles.right}>
        <View style={styles.warmthRow}>
          <View style={[styles.warmthDot, { backgroundColor: warmthColor }]} />
          <Text style={styles.warmthPercent}>{Math.round(warmthScore * 100)}%</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{contactType}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  initials: {
    color: colors.foregroundSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
    lineHeight: 20,
  },
  detail: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  warmthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warmthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  warmthPercent: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: colors.backgroundSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeText: {
    color: colors.foregroundMuted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
