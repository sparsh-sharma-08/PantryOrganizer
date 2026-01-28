import * as React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import {
  Text,
  Menu,
  Button,
  IconButton,
  Chip,
  Surface,
  TextInput,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import storage from '../storage/store';
import ItemCardLarge from '../components/ItemCardLarge';

type FilterType = 'all' | 'expired' | 'expiring' | 'shopping' | 'recent';

export default function ItemsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [items, setItems] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'expirySoon' | 'expiryLatest' | 'name'>('newest');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => setItems(await storage.getAll());
    load();
    const sub = storage.subscribe(() => { load(); });
    return () => { sub.remove(); };
  }, []);

  const now = Date.now();

  const labels = useMemo(() => {
    const s = new Set<string>();
    items.forEach(it => {
      if (Array.isArray(it.labels)) it.labels.forEach((l: string) => s.add(l));
      else if (it.labels) String(it.labels).split(',').map((t: string) => t.trim()).forEach((l: string) => s.add(l));
    });
    return Array.from(s);
  }, [items]);

  const filteredSorted = useMemo(() => {
    let list = (items || []).slice();

    // filter type
    if (filterType === 'expired') {
      list = list.filter(i => i.expires && new Date(i.expires).getTime() < now);
    } else if (filterType === 'expiring') {
      list = list.filter(i => i.expires && (() => {
        const days = Math.ceil((new Date(i.expires).getTime() - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      })());
    } else if (filterType === 'shopping') {
      list = list.filter(i => i.onShoppingList);
    } else if (filterType === 'recent') {
      // show by updatedAt/createdAt descending, will be applied by sort below
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }

    // label filter
    if (activeLabel) {
      list = list.filter(i => {
        const arr = Array.isArray(i.labels) ? i.labels : (i.labels ? String(i.labels).split(',').map((s: string) => s.trim()) : []);
        return arr.includes(activeLabel);
      });
    }

    // compute daysLeft
    list = list.map(i => ({ ...i, daysLeft: i.expires ? Math.ceil((new Date(i.expires).getTime() - now) / (1000 * 60 * 60 * 24)) : undefined }));

    // sorting
    if (sortBy === 'newest') list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
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
  }, [items, filterType, sortBy, activeLabel, search, now]);

  function openAdd() {
    // navigate using parent to avoid switching tab accidentally
    const parent = (nav as any).getParent?.();
    if (parent && typeof parent.navigate === 'function') parent.navigate('AddItem' as any);
    else nav.navigate('AddItem' as any);
  }

  function openDetail(id: string) {
    const parent = (nav as any).getParent?.();
    if (parent && typeof parent.navigate === 'function') parent.navigate('ItemDetail' as any, { id });
    else nav.navigate('Items' as any, { screen: 'ItemDetail', params: { id } });
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Items</Text>
          <View style={{ width: 8 }} />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" uppercase={false} onPress={() => setMenuVisible(true)} ref={anchorRef}>
                {filterType === 'all' ? 'Total Items' :
                  filterType === 'expired' ? 'Expired' :
                    filterType === 'expiring' ? 'Expiring Soon' :
                      filterType === 'shopping' ? 'Shopping List' : 'Recent'}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setMenuVisible(false); setFilterType('all'); }} title="Total Items" />
            <Menu.Item onPress={() => { setMenuVisible(false); setFilterType('expired'); }} title="Expired Items" />
            <Menu.Item onPress={() => { setMenuVisible(false); setFilterType('expiring'); }} title="Expiring Soon" />
            <Menu.Item onPress={() => { setMenuVisible(false); setFilterType('shopping'); }} title="Shopping List" />
            <Menu.Item onPress={() => { setMenuVisible(false); setFilterType('recent'); }} title="Recently Updated" />
          </Menu>
        </View>

        <View style={styles.headerRight}>
          <IconButton icon="filter-variant" onPress={() => {/* reserved for future */ }} />
          <IconButton icon="plus" iconColor="#fff" style={styles.addFab} onPress={openAdd} />
        </View>
      </Surface>

      <View style={styles.controls}>
        <TextInput
          placeholder="Search name or description..."
          value={search}
          onChangeText={setSearch}
          mode="flat"
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <TouchableOpacity style={[styles.sortChip, sortBy === 'newest' && styles.sortChipActive]} onPress={() => setSortBy('newest')}>
            <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortChip, sortBy === 'oldest' && styles.sortChipActive]} onPress={() => setSortBy('oldest')}>
            <Text style={[styles.sortText, sortBy === 'oldest' && styles.sortTextActive]}>Oldest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortChip, sortBy === 'expirySoon' && styles.sortChipActive]} onPress={() => setSortBy('expirySoon')}>
            <Text style={[styles.sortText, sortBy === 'expirySoon' && styles.sortTextActive]}>Expiry Soon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortChip, sortBy === 'expiryLatest' && styles.sortChipActive]} onPress={() => setSortBy('expiryLatest')}>
            <Text style={[styles.sortText, sortBy === 'expiryLatest' && styles.sortTextActive]}>Expiry Latest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortChip, sortBy === 'name' && styles.sortChipActive]} onPress={() => setSortBy('name')}>
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>Name A‑Z</Text>
          </TouchableOpacity>
        </ScrollView>

        {labels.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <Chip mode="outlined" selected={activeLabel === null} onPress={() => setActiveLabel(null)} style={styles.labelChip}>
              All
            </Chip>
            {labels.map((l: string) => (
              <Chip key={l} mode="outlined" selected={activeLabel === l} onPress={() => setActiveLabel(activeLabel === l ? null : l)} style={styles.labelChip}>
                {l}
              </Chip>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filteredSorted}
        keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `items-${index}`}
        renderItem={({ item }) => (
          <ItemCardLarge
            item={item}
            onPress={() => openDetail(item.id)}
            onConsume={async () => { await storage.remove(item.id); }}
            onToggleCart={async () => { await storage.update({ ...item, onShoppingList: !item.onShoppingList }); }}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={<View style={{ padding: 20 }}><Text style={{ color: '#666' }}>No items</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  addFab: { backgroundColor: '#2f6bf6' },
  controls: { paddingHorizontal: 16, paddingTop: 8 },
  searchInput: { height: 44, borderRadius: 8, backgroundColor: '#f8fafc' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f3f4f6', marginRight: 8 },
  sortChipActive: { backgroundColor: '#2f6bf6' },
  sortText: { color: '#111827', fontWeight: '700' },
  sortTextActive: { color: '#fff' },
  labelChip: { marginRight: 8 },
});