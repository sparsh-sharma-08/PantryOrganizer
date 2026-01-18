import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function Header() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <View style={styles.left}>
          <View style={styles.logoWrap}>
            <MaterialCommunityIcons name="chef-hat" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.greeting}>Hello, Chef! 👋</Text>
            <Text style={styles.subtitle}>Let's get cooking</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.right} onPress={() => nav.navigate('Profile')}>
          <Avatar.Image size={40} source={{ uri: 'https://placehold.co/100x100/6366f1/ffffff.png?text=S' }} style={{ backgroundColor: theme.colors.border }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background, // Match screen background so it blends
    paddingBottom: theme.spacing.s,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
    ...theme.shadows.soft,
  },
  greeting: {
    ...(theme.typography.subHeader as any),
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  right: {
    ...theme.shadows.soft,
  },
});