import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  item: any;
  onConsume?: () => void;
  onAddToCart?: () => void;
  onPress?: () => void;
};

export default function ItemCard({ item, onConsume, onAddToCart, onPress }: Props) {
  const days = typeof item.daysLeft === 'number' ? item.daysLeft : null;

  // border / badge colors based on urgency
  let borderColor = theme.colors.border;
  let badgeBg = theme.colors.surface;
  let badgeText = theme.colors.textSecondary;

  if (days !== null) {
    if (days <= 2) {
      borderColor = theme.colors.error;
      badgeBg = '#fef2f2';
      badgeText = theme.colors.error;
    } else if (days <= 4) {
      borderColor = theme.colors.warning;
      badgeBg = '#fffbeb';
      badgeText = theme.colors.warning;
    } else {
      borderColor = theme.colors.success;
      badgeBg = '#f0fdf4';
      badgeText = theme.colors.success;
    }
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.wrapper, { borderColor }]}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={item.icon || 'food-apple'} size={26} color={theme.colors.warning} />
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>Qty: {item.quantity || 1} • {item.location || 'Pantry'}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.consumeBtn} activeOpacity={0.85} onPress={onConsume}>
            <MaterialCommunityIcons name="check" size={16} color="#fff" />
            <Text style={styles.consumeText}> Consume</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cartBtn} activeOpacity={0.85} onPress={onAddToCart}>
            <MaterialCommunityIcons name="cart-outline" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {days !== null && (
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>{Math.abs(days)} {days === 1 || days === -1 ? 'day' : 'days'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    position: 'relative',
    ...theme.shadows.card,
  },
  left: { marginRight: 12 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  consumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.s,
    elevation: 1,
  },
  consumeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cartBtn: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 12,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.m,
  },
  badgeText: { fontWeight: '700', fontSize: 13 },
});