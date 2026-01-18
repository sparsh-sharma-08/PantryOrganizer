import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Text, Menu, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeIn } from 'react-native-reanimated';
import storage from '../storage/store';
import ItemCardLarge from '../components/ItemCardLarge';
import { theme } from '../theme';
import AnimatedCard from '../components/AnimatedCard';

export default function PantryList() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [items, setItems] = useState<Array<any>>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'expirySoon' | 'expiryLatest' | 'name'>('newest');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'expired' | 'expiring' | 'fresh'>(
    () => (route.params?.filter as any) ?? 'all'
  );

  const [menuVisible, setMenuVisible] = useState(false);

  function handleMenuDismiss() {
    setMenuVisible(false);
  }

  function handleFilterButtonPress() {
    if (!menuVisible) {
      setMenuVisible(true);
      return;
    }
    setMenuVisible(false);
    setTimeout(() => setMenuVisible(true), 80);
  }

  useEffect(() => {
    try {
      if (activeFilter === 'all') nav.setParams?.({ filter: undefined });
      else nav.setParams?.({ filter: activeFilter });
    } catch { }
  }, [activeFilter, nav]);

  useEffect(() => {
    const load = async () => setItems(await storage.getAll());
    load();
    const sub = storage.subscribe(() => { load(); });
    return () => { sub.remove(); };
  }, []);

  function toggleFilter(type: 'all' | 'expired' | 'expiring' | 'fresh') {
    setMenuVisible(false);
    setActiveFilter(prev => (type === 'all' ? 'all' : (prev === type ? 'all' : type)));
  }

  function onClearPantry() {
    Alert.alert(
      'Clear pantry',
      'Are you sure you want to remove all items from the pantry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              setItems([]);
            } catch (e) {
              console.warn('Failed to clear pantry', e);
            }
          },
        },
      ],
    );
  }

  const labels = useMemo(() => {
    const s = new Set<string>();
    items.forEach(it => {
      if (Array.isArray(it.labels)) it.labels.forEach((l: string) => s.add(l));
      else if (it.labels) String(it.labels).split(',').map((t: string) => t.trim()).forEach((l: string) => s.add(l));
    });
    return Array.from(s);
  }, [items]);

  const now = Date.now();
  const filteredSorted = useMemo(() => {
    let list = (items || []).slice();

    if (activeFilter === 'expired') {
      list = list.filter(i => i.expires && new Date(i.expires).getTime() < now);
    } else if (activeFilter === 'expiring') {
      list = list.filter(i => i.expires && (() => {
        const days = Math.ceil((new Date(i.expires).getTime() - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      })());
    } else if (activeFilter === 'fresh') {
      list = list.filter(i => {
        if (!i.expires) return true;
        const days = Math.ceil((new Date(i.expires).getTime() - now) / (1000 * 60 * 60 * 24));
        return days > 7;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }

    if (activeLabel) {
      list = list.filter(i => {
        const arr = Array.isArray(i.labels) ? i.labels : (i.labels ? String(i.labels).split(',').map((s: string) => s.trim()) : []);
        return arr.includes(activeLabel);
      });
    }

    list = list.map(i => ({ ...i, daysLeft: i.expires ? Math.ceil((new Date(i.expires).getTime() - now) / (1000 * 60 * 60 * 24)) : undefined }));

    if (sortBy === 'newest') list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    else if (sortBy === 'oldest') list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    else if (sortBy === 'expirySoon') list.sort((a, b) => {
      const ad = a.expires ? new Date(a.expires).getTime() : Infinity;
      const bd = b.expires ? new Date(b.expires).getTime() : Infinity;
      return ad - bd;
    });
    else if (sortBy === 'expiryLatest') list.sort((a, b) => {
      const ad = a.expires ? new Date(a.expires).getTime() : 0;
      const bd = b.expires ? new Date(b.expires).getTime() : 0;
      return bd - ad;
    });
    else if (sortBy === 'name') list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    return list;
  }, [items, search, activeLabel, sortBy, activeFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Animated.Text
          entering={FadeInLeft.duration(300)}
          style={styles.headerTitle}
        >
          Pantry
        </Animated.Text>

        <View style={{ marginLeft: 12 }}>
          <Menu
            visible={menuVisible}
            onDismiss={handleMenuDismiss}
            anchor={
              <Button
                mode={activeFilter !== 'all' ? 'contained' : 'outlined'}
                onPress={handleFilterButtonPress}
                compact
                contentStyle={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12 }}
                style={{ borderRadius: theme.borderRadius.round, minWidth: 140, borderColor: theme.colors.primary }}
                labelStyle={{ color: activeFilter !== 'all' ? '#fff' : theme.colors.primary }}
                buttonColor={activeFilter !== 'all' ? theme.colors.primary : undefined}
                icon={() => <MaterialCommunityIcons name="filter-variant" size={18} color={activeFilter !== 'all' ? '#fff' : theme.colors.primary} />}
              >
                {activeFilter === 'all' ? 'All items' : activeFilter === 'expired' ? 'Expired' : activeFilter === 'expiring' ? 'Expiring' : 'Fresh'}
              </Button>
            }
          >
            <Menu.Item onPress={() => toggleFilter('all')} title={`${activeFilter === 'all' ? '✓ ' : ''}All items`} />
            <Menu.Item onPress={() => toggleFilter('expired')} title={`${activeFilter === 'expired' ? '✓ ' : ''}Expired items`} />
            <Menu.Item onPress={() => toggleFilter('expiring')} title={`${activeFilter === 'expiring' ? '✓ ' : ''}Expiring soon`} />
            <Menu.Item onPress={() => toggleFilter('fresh')} title={`${activeFilter === 'fresh' ? '✓ ' : ''}Fresh (no/long expiry)`} />
          </Menu>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onClearPantry} style={{ marginRight: 12 }}>
            <Text style={{ color: theme.colors.error, fontWeight: '700' }}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TextInput
          placeholder="Search items..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <View style={styles.sortRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            {[
              { id: 'newest', label: 'Newest' },
              { id: 'oldest', label: 'Oldest' },
              { id: 'expirySoon', label: 'Expiry Soon' },
              { id: 'expiryLatest', label: 'Expiry Latest' },
              { id: 'name', label: 'Name A-Z' },
            ].map((opt, i) => (
              <Animated.View
                key={opt.id}
                entering={FadeIn.delay(i * 50).springify()}
              >
                <TouchableOpacity
                  style={[styles.sortChip, sortBy === opt.id && styles.sortChipActive]}
                  onPress={() => setSortBy(opt.id as any)}
                >
                  <Text style={[styles.sortText, sortBy === opt.id && styles.sortTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {labels.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <TouchableOpacity style={[styles.labelChip, activeLabel === null && styles.labelChipActive]} onPress={() => setActiveLabel(null)}>
              <Text style={[styles.labelText, activeLabel === null && styles.labelTextActive]}>All</Text>
            </TouchableOpacity>
            {labels.map(l => (
              <TouchableOpacity key={l} style={[styles.labelChip, activeLabel === l && styles.labelChipActive]} onPress={() => setActiveLabel(activeLabel === l ? null : l)}>
                <Text style={[styles.labelText, activeLabel === l && styles.labelTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filteredSorted}
        keyExtractor={(i: any) => i.id}
        renderItem={({ item, index }) => (
          <AnimatedCard delay={index * 50} style={{ marginBottom: 0 }}>
            <ItemCardLarge
              item={item}
              onPress={() => {
                const parent = (nav as any).getParent?.();
                if (parent && typeof parent.navigate === 'function') parent.navigate('ItemDetail' as any, { id: item.id });
                else nav.navigate('ItemDetail' as any, { id: item.id });
              }}
              onConsume={async () => { await storage.remove(item.id); }}
              onToggleCart={async () => { await storage.update({ ...item, onShoppingList: !item.onShoppingList }); }}
            />
          </AnimatedCard>
        )}
        ListEmptyComponent={<View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: theme.colors.textSecondary }}>No items found</Text></View>}
        contentContainerStyle={{ padding: theme.spacing.m, paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.m },
  headerTitle: { ...(theme.typography.subHeader as any), color: theme.colors.text },
  controls: { paddingHorizontal: theme.spacing.m },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface
  },
  sortRow: { marginBottom: 6 },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  sortChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortText: { color: theme.colors.textSecondary, fontWeight: '600' },
  sortTextActive: { color: '#fff' },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  labelChipActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  labelText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 12 },
  labelTextActive: { color: '#fff' },
});