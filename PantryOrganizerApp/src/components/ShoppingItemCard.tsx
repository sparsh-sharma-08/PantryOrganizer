import * as React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Card, IconButton, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  item: any;
  selected?: boolean;
  onSelect?: (id: string, next: boolean) => void;
  onToggleBought?: (id: string) => void;
  onRemove?: (id: string) => void;
  onAddToPantry?: (id: string) => void;
  onPress?: () => void;
};

export default function ShoppingItemCard({ item, selected = false, onSelect, onToggleBought, onRemove, onAddToPantry, onPress }: Props) {
  const labels = Array.isArray(item.labels) ? item.labels : item.labels ? String(item.labels).split(',').map((s: string) => s.trim()) : [];
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card style={[styles.card, item.purchased ? styles.cardBought : null]}>
        <Card.Content style={styles.row}>
          <View style={styles.left}>
            <Checkbox
              status={selected ? 'checked' : 'unchecked'}
              onPress={() => onSelect?.(item.id, !selected)}
            />
          </View>

          <View style={styles.center}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.title, item.purchased ? styles.titleBought : null]}>{item.name}</Text>
                <Text style={styles.meta}>{item.quantity ? `Qty: ${item.quantity}` : 'Qty: 1'} • {item.location || 'Pantry'}</Text>
              </View>
              <View style={{ marginLeft: 8 }}>
                <MaterialCommunityIcons name={item.icon || 'cart'} size={28} color={item.purchased ? '#10b981' : '#374151'} />
              </View>
            </View>

            <View style={styles.labelsRow}>
              {labels.slice(0, 3).map((l: string) => (
                <View key={l} style={styles.chip}>
                  <Text style={styles.chipText}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon={item.purchased ? 'check-circle' : 'checkbox-blank-circle-outline'}
              size={20}
              onPress={() => onToggleBought?.(item.id)}
              accessibilityLabel={item.purchased ? 'Mark unbought' : 'Mark bought'}
            />
            <IconButton icon="plus" size={20} onPress={() => onAddToPantry?.(item.id)} accessibilityLabel="Add to pantry" />
            <IconButton icon="delete-outline" size={20} onPress={() => onRemove?.(item.id)} accessibilityLabel="Remove from list" />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10, borderRadius: 10 },
  cardBought: { backgroundColor: '#f0fdf4' },
  row: { flexDirection: 'row', alignItems: 'center' },
  left: { marginRight: 8 },
  center: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f1724' },
  titleBought: { textDecorationLine: 'line-through', color: '#4b5563' },
  meta: { color: '#6b7280', marginTop: 4, fontSize: 13 },
  labelsRow: { flexDirection: 'row', marginTop: 8 },
  chip: { backgroundColor: '#eef2f8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: '700', color: '#0f1724' },
  actions: { marginLeft: 8, alignItems: 'flex-end', justifyContent: 'center' },
});