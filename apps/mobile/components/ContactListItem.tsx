import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
      ? '#22C55E'
      : warmthScore >= 0.4
        ? '#EAB308'
        : '#6B7280';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.detail}>
          {title ? `${title} at ` : ''}
          {organization}
        </Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.warmthDot, { backgroundColor: warmthColor }]} />
        <Text style={styles.type}>{contactType}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F1F',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D2D5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initials: {
    color: '#A5B4FC',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  warmthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  type: {
    color: '#6B7280',
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
