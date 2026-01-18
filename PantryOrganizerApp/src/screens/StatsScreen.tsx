import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import storage from '../storage/store';

export default function StatsScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => setItems(await storage.getAll());
    load();
    const sub = storage.subscribe(() => { load(); });
    return () => { sub.remove(); };
  }, []);

  const total = items.length;
  const expiringSoon = items.filter(i => i.expires && (new Date(i.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7).length;
  const shopping = items.filter(i => i.onShoppingList).length;

  // simple heuristic for pantry "utilization"
  const utilization = total === 0 ? 0 : Math.min(1, (total - expiringSoon) / Math.max(1, total));

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={{ fontWeight: '700', marginBottom: 12 }}>Pantry Stats</Text>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge">Total items</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>{total}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge">Expiring soon</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>{expiringSoon}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge">Shopping list</Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>{shopping}</Text>
          <Text variant="bodySmall" style={{ marginTop: 8, color: '#666' }}>Utilization</Text>
          <ProgressBar progress={utilization} style={{ marginTop: 8 }} />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12 },
});