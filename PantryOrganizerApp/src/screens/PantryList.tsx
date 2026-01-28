import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput, ScrollView, Dimensions, StatusBar } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn, Layout, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import storage from '../storage/store';
import ItemCardLarge from '../components/ItemCardLarge';
import QuantityAdjustmentModal from '../components/QuantityAdjustmentModal';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Items', icon: 'food-variant' },
  { id: 'fresh', label: 'Fresh', icon: 'leaf' },
  { id: 'expiring', label: 'Expiring', icon: 'clock-alert-outline' },
  { id: 'expired', label: 'Expired', icon: 'alert-circle-outline' },
  { id: 'consumed', label: 'History', icon: 'history' },
];

export default function PantryList() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [items, setItems] = useState<Array<any>>([]);
  const [search, setSearch] = useState('');

  const [adjModalVisible, setAdjModalVisible] = useState(false);
  const [adjItem, setAdjItem] = useState<any>(null);

  // Single source of truth for the active filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'expired' | 'expiring' | 'fresh' | 'consumed'>(
    () => (route.params?.filter as any) ?? 'all'
  );

  // Sync route params with local state if navigating from Home
  useEffect(() => {
    if (route.params?.filter) {
      setActiveFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await storage.getAll();
      console.log('[PantryList] Loaded items:', all.length);
      setItems(all);
      setLoading(false);
    };
    load();
    const sub = storage.subscribe(() => { console.log('[PantryList] Store update received'); load(); });
    return () => { sub.remove(); };
  }, []);

  function onClearHistory() {
    Alert.alert(
      'Clear History',
      'Choose an option to clear your consumption history:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Older than 1 Month',
          onPress: async () => {
            await storage.cleanupHistory(30);
            Alert.alert("Success", "Cleaned up items older than 30 days.");
          }
        },
        {
          text: 'Clear All History',
          style: 'destructive',
          onPress: async () => {
            const all = await storage.getAll();
            const consumed = all.filter((i: any) => i.consumedAt);
            for (const c of consumed) {
              await storage.remove(c.id);
            }
          }
        }
      ]
    );
  }

  const filteredSorted = useMemo(() => {
    // 1. Filter by status (Consumed vs Active)
    // Active means NOT consumed AND Quantity > 0
    // STRICT REQUIREMENT: "All Items" must NOT show consumed items.
    let list = items.filter(i => {
      if (activeFilter === 'consumed') return !!i.consumedAt || (i.quantity || 0) <= 0;
      // For 'all', 'fresh', 'expiring', 'expired' -> MUST be active (not consumed)
      return !i.consumedAt && (i.quantity || 0) > 0;
    });
    const now = Date.now();

    // 2. Apply specific filters
    if (activeFilter === 'expired') {
      list = list.filter(i => i.expires && new Date(i.expires).getTime() < now);
    } else if (activeFilter === 'expiring') {
      list = list.filter(i => i.expires && (() => {
        const diff = new Date(i.expires).getTime() - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      })());
    } else if (activeFilter === 'fresh') {
      // Fresh = no expiry or > 7 days
      list = list.filter(i => {
        if (!i.expires) return true;
        const diff = new Date(i.expires).getTime() - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 7;
      });
    }

    // 3. Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => (i.name || '').toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q));
    }

    // 4. Default Sort: "Actionable first" (Expiring soon -> Expired -> Fresh)
    // But for "History", sort by consumedAt (newest first)
    if (activeFilter === 'consumed') {
      list.sort((a, b) => (b.consumedAt || 0) - (a.consumedAt || 0));
    } else {
      list.sort((a, b) => {
        // Prioritize items with expiry dates
        if (a.expires && !b.expires) return -1;
        if (!a.expires && b.expires) return 1;
        if (a.expires && b.expires) return new Date(a.expires).getTime() - new Date(b.expires).getTime();
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    }

    return list;
  }, [items, search, activeFilter]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Immersive Header Background */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[theme.colors.primaryDark, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>My Pantry</Text>
              {activeFilter === 'consumed' && (
                <TouchableOpacity onPress={onClearHistory} style={styles.clearBtn}>
                  <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Bar Embedded in Header */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search your items..."
                placeholderTextColor={theme.colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Horizontal Filters - Floating over/under header */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            decelerationRate="fast"
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setActiveFilter(opt.id as any)}
                  activeOpacity={0.7}
                  delayPressIn={50} // slight delay to prioritize scroll
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={18}
                    color={isActive ? '#fff' : theme.colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={loading ? [] : filteredSorted}
        keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `fallback-${index}`}
        ListHeaderComponent={
          loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>Checking shelves...</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInUp.delay(index * 50).springify()}
            layout={Layout.springify()}
            style={{ marginBottom: 16 }}
          >
            <ItemCardLarge
              item={item}
              onPress={() => nav.navigate('ItemDetail', { id: item.id })}
              onConsume={async () => {
                await storage.update({ id: item.id, consumedAt: Date.now() });
              }}
              onToggleCart={async () => { await storage.update({ ...item, onShoppingList: !item.onShoppingList }); }}
              onIncrement={async () => { await storage.adjustQuantity(item.id, 1); }}
              onDecrement={async () => { await storage.adjustQuantity(item.id, -1); }}
              onLongPressQuantity={() => {
                setAdjItem(item);
                setAdjModalVisible(true);
              }}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Animated.View entering={ZoomIn.delay(200)} style={styles.emptyState}>
            <Surface style={styles.emptyIconCircle} elevation={0}>
              <MaterialCommunityIcons
                name={activeFilter === 'consumed' ? "history" : "food-apple-outline"}
                size={48}
                color={theme.colors.primary}
                style={{ opacity: 0.5 }}
              />
            </Surface>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'consumed' ? 'No history yet' : 'Pantry is empty'}
            </Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'consumed'
                ? "Items you mark as 'Consumed' will appear here."
                : "Tap the + button to start stocking up!"}
            </Text>
          </Animated.View>
        }
      />

      <QuantityAdjustmentModal
        visible={adjModalVisible}
        onDismiss={() => setAdjModalVisible(false)}
        item={adjItem}
        onConfirm={async (diff, mode) => {
          if (!adjItem) return;
          let reason: any = 'manual';
          if (mode === 'reduce') reason = 'consumption';
          if (mode === 'add') reason = 'purchase';
          if (mode === 'set') reason = 'correction';
          await storage.adjustQuantity(adjItem.id, diff, reason);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerContainer: {
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
    zIndex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...theme.shadows.card,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  clearBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    ...theme.shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
  },
  filterContainer: {
    marginTop: -24, // Pull up to overlap gradient
    zIndex: 10,
    elevation: 10, // Ensure it sits on top of the gradient on Android
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 30,
    marginRight: 10,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: theme.colors.text, // Dark pill for active
    ...theme.shadows.card,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 22,
  },
});