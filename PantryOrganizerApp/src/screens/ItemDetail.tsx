import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Avatar, Button, Card } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import storage from '../storage/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ItemDetail() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const all = await storage.getAll();
      const found = all.find((i: any) => i.id === id);
      if (mounted) setItem(found || null);
    };
    load();
    const sub = storage.subscribe(() => load());
    return () => { mounted = false; sub.remove(); };
  }, [id]);

  if (!item) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#666' }}>Item not found</Text>
      </View>
    );
  }

  const labels = Array.isArray(item.labels) ? item.labels : (item.labels ? String(item.labels).split(',').map((t: string) => t.trim()) : []);
  const expiresAt = item.expires ? new Date(item.expires).toLocaleDateString() : '—';

  const onConsume = () => {
    Alert.alert('Consume', 'Mark this item as consumed and remove from pantry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Consume', style: 'destructive', onPress: async () => { await storage.remove(item.id); nav.goBack(); } }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar.Icon size={64} icon={item.icon || 'food-apple'} style={{ backgroundColor: '#f3f4f6' }} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{item.name}</Text>
            <Text style={{ color: '#6b7280', marginTop: 6 }}>{item.quantity ? `Qty: ${item.quantity}` : 'Qty: 1'} • {item.location || 'Pantry'}</Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontWeight: '700', color: '#d14343' }}>{item.expires ? expiresAt : ''}</Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
        </View>
      </View>

      <Card style={{ marginTop: 16, borderRadius: 12 }}>
        <Card.Content>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Description</Text>
          <Text style={{ color: '#374151' }}>{item.description || 'No description provided.'}</Text>

          {labels.length > 0 && (
            <>
              <Text style={{ fontWeight: '700', marginTop: 12 }}>Labels</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                {labels.map((l: string) => (
                  <View key={l} style={{ backgroundColor: '#eef2f8', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ fontWeight: '700' }}>{l}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Button mode="contained" onPress={onConsume} style={{ marginRight: 12 }}>Consume</Button>
            <Button mode="outlined" onPress={() => storage.update({ ...item, onShoppingList: !item.onShoppingList })}>
              {item.onShoppingList ? 'In Shopping' : 'Add to Shopping'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});