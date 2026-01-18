import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  item: any;
  onPress?: () => void;
  onConsume?: () => void;
  onToggleCart?: () => void;
};

export default function ItemCardLarge({ item, onPress, onConsume, onToggleCart }: Props) {
  const daysLeft = item.daysLeft ?? (item.expires ? Math.ceil((new Date(item.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined);
  let borderColor = theme.colors.border;
  let badgeBg = theme.colors.surface;
  let badgeText = theme.colors.textSecondary;

  if (typeof daysLeft === 'number') {
    if (daysLeft <= 2) { borderColor = theme.colors.error; badgeBg = '#fef2f2'; badgeText = theme.colors.error; }
    else if (daysLeft <= 4) { borderColor = theme.colors.warning; badgeBg = '#fffbeb'; badgeText = theme.colors.warning; }
    else { borderColor = theme.colors.success; badgeBg = '#f0fdf4'; badgeText = theme.colors.success; }
  }

  const labels = Array.isArray(item.labels) ? item.labels : (item.labels ? String(item.labels).split(',').map((s: string) => s.trim()) : []);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ marginBottom: theme.spacing.m }}>
      <Card mode="elevated" style={[styles.card, { borderColor }]} contentStyle={{ backgroundColor: theme.colors.surface }}>
        <Card.Content style={styles.row}>
          <View style={styles.left}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name={item.icon || 'food-apple'} size={28} color={theme.colors.warning} />
            </View>
          </View>

          <View style={styles.center}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>
              {item.quantity ? `Qty: ${item.quantity}` : 'Qty: 1'} • {item.location || 'Pantry'}
            </Text>

            <View style={styles.labelRow}>
              {labels.slice(0, 3).map((l: string) => (
                <View key={l} style={styles.chip}>
                  <Text style={styles.chipText}>{l}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Button mode="contained" compact onPress={onConsume} style={styles.consumeBtn} labelStyle={{ fontWeight: '700' }} buttonColor={theme.colors.primary}>
                Consume
              </Button>

              <TouchableOpacity onPress={onToggleCart} style={styles.cartBtn}>
                <MaterialCommunityIcons name={item.onShoppingList ? 'cart' : 'cart-outline'} size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.right}>
            {typeof daysLeft === 'number' && (
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeText }]}>{Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? 'day' : 'days'}</Text>
              </View>
            )}
            <Text style={styles.mutedDate}>{item.expires ? new Date(item.expires).toLocaleDateString() : ''}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.2,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  left: { marginRight: theme.spacing.s },
  iconBox: {
    width: 64, height: 64, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center'
  },
  center: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 13 },
  labelRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  chip: { backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.s, marginRight: 6, marginBottom: 4 },
  chipText: { color: theme.colors.text, fontWeight: '600', fontSize: 11 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  consumeBtn: { borderRadius: theme.borderRadius.s },
  cartBtn: { marginLeft: 10, width: 40, height: 40, borderRadius: theme.borderRadius.s, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  right: { alignItems: 'flex-end', marginLeft: 8, width: 92 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.m },
  badgeText: { fontWeight: '700', fontSize: 13 },
  mutedDate: { marginTop: 8, color: theme.colors.textSecondary, fontSize: 12 },
});