import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, List } from 'react-native-paper';
import storage from '../storage/store';

export default function ShopScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => setItems(await storage.getAll());
    load();
    const sub = storage.subscribe(() => { load(); });
    return () => { sub.remove(); };
  }, []);

  const shopping = items.filter(i => i.onShoppingList);

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>Shopping List</Text>
          <Text variant="bodyMedium" style={{ color: '#666', marginTop: 4 }}>{shopping.length} items</Text>
        </Card.Content>
      </Card>

      <FlatList
        style={{ flex: 1, marginTop: 12 }}
        data={shopping}
        keyExtractor={(i: any) => i.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`Qty: ${item.quantity || 1}`}
            right={() => <Button compact onPress={async () => { await storage.update({ ...item, onShoppingList: false }); }}>Remove</Button>}
          />
        )}
        ListEmptyComponent={<Text style={{ color: '#666', padding: 16 }}>No items in shopping list</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerCard: { padding: 8 },
});