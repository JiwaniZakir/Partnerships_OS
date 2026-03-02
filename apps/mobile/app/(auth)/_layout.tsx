import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  // Clean, consistent text-based icons
  const icons: Record<string, { icon: string; size: number }> = {
    home: { icon: '\u2302', size: 24 },       // House
    add: { icon: '+', size: 26 },              // Plus
    contacts: { icon: '\u2630', size: 20 },    // Trigram (list-like)
    search: { icon: '\u2315', size: 24 },      // Search
    profile: { icon: '\u25CB', size: 18 },     // Circle outline (avatar)
  };

  const config = icons[name] || { icon: '\u25CF', size: 14 };

  if (name === 'add') {
    return (
      <View style={[styles.addIconContainer, focused && styles.addIconContainerActive]}>
        <Text style={[styles.addIcon, focused && styles.addIconFocused]}>
          {config.icon}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabIconContainer}>
      <Text
        style={[
          styles.icon,
          { fontSize: config.size },
          focused ? styles.iconFocused : styles.iconInactive,
        ]}
      >
        {name === 'profile' ? (focused ? '\u25CF' : '\u25CB') : config.icon}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function AuthLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.foregroundMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ focused }) => <TabIcon name="add" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ focused }) => <TabIcon name="contacts" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contact-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    width: 28,
  },
  icon: {
    fontSize: 22,
  },
  iconFocused: {
    color: colors.foreground,
  },
  iconInactive: {
    color: colors.foregroundMuted,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.foreground,
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainerActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  addIcon: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.foreground,
    marginTop: -1,
  },
  addIconFocused: {
    color: '#FFFFFF',
  },
});
