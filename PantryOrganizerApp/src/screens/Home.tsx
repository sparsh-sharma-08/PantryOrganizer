import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import storage from '../storage/store';
import StatCard from '../components/StatCard';
import ItemCard from '../components/ItemCard';
// Activity feed removed

export default function Home() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, expiringSoon: 0, shoppingList: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await storage.getAll();

      // Filter strictly for ACTIVE pantry items (including those on shopping list if they are in stock)
      // "Entire Pantry" means everything we HAVE (qty > 0) that is not consumed.
      const activePantry = all.filter(i => !i.consumedAt && (i.quantity || 0) > 0);

      const expiring = activePantry
        .filter(i => i.expires)
        .map(i => ({ ...i, daysLeft: Math.ceil((new Date(i.expires as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }))
        .filter(i => i.daysLeft >= 0 && i.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3); // Keep only the top 3 for display

      setItems(activePantry); // Set items to only active pantry items
      setStats({
        totalItems: activePantry.length,
        expiringSoon: expiring.length,
        shoppingList: all.filter(i => i.onShoppingList).length
      });
      setLoading(false);
    };
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

  const totalItems = stats.totalItems;
  const shoppingCount = stats.shoppingList;
  const expiringCount = stats.expiringSoon;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5b6cff" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading your pantry...</Text>
      </View>
    );
  }

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
            colors={['#7e22ce', '#a855f7']}
            label="My Insights"
            value="View"
            badge="Trends"
            icon="chart-bar"
            onPress={() => nav.navigate('Stats')}
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
              expiringSoon.map((item, index) => (
                <ItemCard
                  key={item.id ? `${item.id}-${index}` : `expire-${index}`}
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
                    await storage.update({ id: item.id, consumedAt: Date.now() });
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
    minHeight: 110, // keep the card visible even when empty; grows with content
  },
  activityCard: {
    marginBottom: 24,
    borderRadius: 12,
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