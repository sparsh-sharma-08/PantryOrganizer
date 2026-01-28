import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Card, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  item: any;
  onPress?: () => void;
  onConsume?: () => void;
  onToggleCart?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onLongPressQuantity?: () => void;
};

export default function ItemCardLarge({ item, onPress, onConsume, onToggleCart, onIncrement, onDecrement, onLongPressQuantity }: Props) {
  const daysLeft = item.daysLeft ?? (item.expires ? Math.ceil((new Date(item.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined);
  let borderColor = theme.colors.border;
  let badgeBg = theme.colors.surface;
  let badgeText = theme.colors.textSecondary;

  if (typeof daysLeft === 'number') {
    if (daysLeft <= 0) { borderColor = theme.colors.error; badgeBg = '#fef2f2'; badgeText = theme.colors.error; }
    else if (daysLeft <= 3) { borderColor = theme.colors.warning; badgeBg = '#fffbeb'; badgeText = theme.colors.warning; }
    else { borderColor = theme.colors.success; badgeBg = '#f0fdf4'; badgeText = theme.colors.success; }
  }

  const labels = Array.isArray(item.labels) ? item.labels : (item.labels ? String(item.labels).split(',').map((s: string) => s.trim()) : []);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ marginBottom: theme.spacing.m }}>
      <Card mode="elevated" style={[styles.card, { borderColor }]} contentStyle={{ backgroundColor: theme.colors.surface }}>
        <Card.Content style={styles.contentContainer}>

          {/* Top Row: Icon + Title + Quantity Stepper */}
          <View style={styles.topRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name={item.icon || 'food-apple'} size={28} color={theme.colors.warning} />
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.locationText}>{item.location || 'Pantry'}</Text>
            </View>

            {/* Quantity Stepper */}
            {!item.consumedAt && (
              <View style={styles.stepperContainer}>
                <TouchableOpacity onPress={onDecrement} style={styles.stepperBtn}>
                  <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onLongPress={onLongPressQuantity} delayLongPress={300}>
                  <Text style={styles.quantityText}>{item.quantity ?? 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onIncrement} style={styles.stepperBtn}>
                  <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Middle: Tags + Days Left Badge */}
          <View style={styles.midRow}>
            <View style={styles.tagsWrapper}>
              {labels.slice(0, 2).map((l: string) => (
                <View key={l} style={styles.chip}>
                  <Text style={styles.chipText}>{l}</Text>
                </View>
              ))}
            </View>
            {typeof daysLeft === 'number' && (
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeText }]}>
                  {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Actions Row */}
          <View style={styles.actionRow}>
            {item.consumedAt ? (
              <View style={[styles.consumeBtn, { backgroundColor: theme.colors.background, paddingVertical: 6 }]}>
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '700' }}>Consumed</Text>
              </View>
            ) : (item.quantity || 0) <= 0 ? (
              <View style={[styles.consumeBtn, { backgroundColor: '#fee2e2', paddingVertical: 6 }]}>
                <Text style={{ color: theme.colors.error, fontWeight: '700' }}>Out of Stock</Text>
              </View>
            ) : (
              <Button mode="contained" compact onPress={onConsume} style={styles.consumeBtn} labelStyle={{ fontWeight: '700', fontSize: 12 }} buttonColor={theme.colors.primary}>
                Consume
              </Button>
            )}

            <TouchableOpacity onPress={onToggleCart} style={[styles.actionIconBtn, item.onShoppingList && styles.actionIconBtnActive]}>
              <MaterialCommunityIcons name={item.onShoppingList ? 'cart' : 'cart-outline'} size={20} color={item.onShoppingList ? theme.colors.primary : theme.colors.text} />
            </TouchableOpacity>
          </View>

        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.2,
    borderRadius: 16,
    ...theme.shadows.card,
  },
  contentContainer: { paddingVertical: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  titleColumn: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  locationText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 },

  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 12, padding: 4 },
  stepperBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', ...theme.shadows.soft },
  quantityText: { paddingHorizontal: 12, fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  midRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6 },
  chipText: { color: theme.colors.text, fontWeight: '600', fontSize: 11 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: '700', fontSize: 12 },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  consumeBtn: { borderRadius: 8, marginRight: 12, minWidth: 100 },
  actionIconBtn: { width: 40, height: 36, borderRadius: 8, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  actionIconBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' }
});