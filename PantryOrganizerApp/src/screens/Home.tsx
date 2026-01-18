import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import storage from '../storage/store';
import StatCard from '../components/StatCard';
import ItemCard from '../components/ItemCard';
// Activity feed removed

export default function Home() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  // recent activity feature removed

  useEffect(() => {
    const load = async () => setItems(await storage.getAll());
    load();
    const sub = storage.subscribe(() => { load(); });
    return () => { sub.remove(); };
  }, []);

  const expiringSoon = items
    .filter(i => i.expires)
    .map(i => ({ ...i, daysLeft: Math.ceil((new Date(i.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }))
    .filter(i => i.daysLeft >= 0 && i.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  const totalItems = items.length;
  const shoppingCount = items.filter(i => i.onShoppingList).length || 0;
  const expiringCount = expiringSoon.length;

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.welcome}>Welcome back 👋</Text>

        <View style={styles.statsRow}>
          <StatCard
            colors={['#5b6cff', '#8b45f7']}
            label="Items in pantry"
            value={String(totalItems)}
            badge="Total"
            icon="package-variant-closed"
            onPress={() => nav.navigate('Items') as any}
          />
          <StatCard
            colors={['#ff8a00', '#ff5e3a']}
            label="Expiring soon"
            value={String(expiringCount)}
            badge="Alert"
            icon="clock-outline"
            onPress={() => nav.navigate('Items' as any, { screen: 'ItemsList', params: { filter: 'expiring' } })}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            colors={['#1eae5f', '#1ea46a']}
            label="Shopping list"
            value={String(shoppingCount)}
            badge="Active"
            icon="cart"
            onPress={() => nav.navigate('Shop')}
          />
          <StatCard
            colors={['#b91c1c', '#f43f5e']}
            label="Expired items"
            value={String(items.filter(i => i.expires && new Date(i.expires).getTime() < Date.now()).length)}
            badge="Alert"
            icon="calendar-remove"
            onPress={() => nav.navigate('Items' as any, { screen: 'ItemsList', params: { filter: 'expired' } })}
          />
        </View>

        {/* Expiring Soon header with View All */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Expiring Soon</Text>
          <TouchableOpacity onPress={() => nav.navigate('Items' as any, { screen: 'ItemsList', params: { filter: 'expiring' } })}>
            <Text style={{ color: '#2f6bf6', fontWeight: '700' }}>View All</Text>
          </TouchableOpacity>
        </View>

        <Card mode="outlined" style={styles.expiringCard}>
          <Card.Content>
            {expiringSoon.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ color: '#666' }}>No items expiring soon</Text>
              </View>
            ) : (
              expiringSoon.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    const parent = (nav as any).getParent?.();
                    if (parent && typeof parent.navigate === 'function') {
                      // try root ItemDetail route first (if you register it on root)
                      parent.navigate('ItemDetail' as any, { id: item.id });
                    } else {
                      // fallback to navigating into the Items stack (this will switch tabs)
                      nav.navigate('Items' as any, { screen: 'ItemDetail', params: { id: item.id } });
                    }
                  }}
                  onConsume={async () => {
                    await storage.remove(item.id);
                  }}
                  onAddToCart={async () => {
                    await storage.update({ ...item, onShoppingList: true });
                  }}
                />
              ))
            )}
          </Card.Content>
        </Card>

        {/* Recent Activity removed */}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  welcome: { marginBottom: 8, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionHeader: { marginTop: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  expiringCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 110, // keep the card visible even when empty; grows with content
  },
  activityCard: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityScroll: {
    maxHeight: 280, // keeps the recent activity scrollable when many items exist
  },
  emptyState: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});