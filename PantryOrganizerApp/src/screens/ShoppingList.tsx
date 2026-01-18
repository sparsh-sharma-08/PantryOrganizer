import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import {
  Button,
  IconButton,
  Chip,
  Dialog,
  Portal,
  TextInput,
  Surface,
  Avatar,
  Menu,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import storage from '../storage/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_W } = Dimensions.get('window');

// LayoutAnimation is available by default in the new RN architecture.
// The old UIManager.setLayoutAnimationEnabledExperimental call is a no-op now,
// so we omit it to avoid the runtime warning.
// If you need more advanced animations, consider using react-native-reanimated.
//

// moved styles above component definitions so helper components can reference it
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f8fb' },
  searchRow: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  searchInput: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 12, borderWidth: 1, borderColor: '#e6e9ef' },
  suggestionsRow: { paddingHorizontal: 16, paddingBottom: 8 },
  // redesigned suggestion card to match provided mock
  suggestionCard: {
    width: Math.min(SCREEN_W * 0.72, 360),
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    marginRight: 12,
  },
  suggestionContent: { marginBottom: 12 },
  suggestionTitle: { fontWeight: '800', fontSize: 20, color: '#0f1724' },
  suggestionSub: { color: '#6b7280', marginTop: 8, fontSize: 14, lineHeight: 20 },
  suggestionAddBtn: {
    backgroundColor: '#e68020ff',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionAddText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8, marginTop: 6 },
  headerRow: { paddingHorizontal: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '900' },
  categoryCard: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  categoryHeader: { backgroundColor: '#fff', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTitle: { fontSize: 16, fontWeight: '800' },
  countBadge: { fontSize: 13, color: '#2f6bf6', fontWeight: '800' },
  categoryBody: { padding: 12, backgroundColor: '#fff' },
  itemCard: { flexDirection: 'row', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  itemCardBought: { backgroundColor: '#f0fdf4' },
  itemLeft: { marginRight: 12 },
  checkboxOuter: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#2f6bf6', borderColor: '#2f6bf6' },
  itemCenter: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '800' },
  itemTitleBought: { textDecorationLine: 'line-through', color: '#4b5563' },
  itemMeta: { color: '#6b7280', marginTop: 6, fontSize: 13 },
  itemControls: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 6, borderRadius: 8 },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  qtyBtnText: { fontWeight: '800', fontSize: 16 },
  qtyText: { paddingHorizontal: 8, minWidth: 26, textAlign: 'center', fontWeight: '700' },
  fab: { position: 'absolute', right: 18, bottom: 86, width: 56, height: 56, borderRadius: 28, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 68, backgroundColor: '#111827', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

const UNITS = ['kg', 'gm', 'mg', 'Packets', 'Numbers'];
const DEFAULT_CATEGORIES = ['Dairy', 'Produce', 'Bakery', 'Grocery', 'Frozen', 'Other'];

// add an alias so existing references to CATEGORIES work (was undefined)
const CATEGORIES = DEFAULT_CATEGORIES;

const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry / Shelf'];

function SmartSuggestionCard({ title, subtitle, onAdd }: { title: string; subtitle?: string; onAdd: () => void }) {
  return (
    <Surface style={styles.suggestionCard} accessible accessibilityRole="button" accessibilityLabel={`Add ${title}`}>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.suggestionSub}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity activeOpacity={0.86} onPress={onAdd} style={styles.suggestionAddBtn}>
        <Text style={styles.suggestionAddText}>Add</Text>
      </TouchableOpacity>
    </Surface>
  );
}

function AnimatedItemWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: Math.min(120, index * 30),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function ShoppingList() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [filter, setFilter] = useState<'all' | 'active' | 'bought'>('active');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Category management UI
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // add-item dialog state
  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newQuantity, setNewQuantity] = useState<string>('1');
  const [newUnit, setNewUnit] = useState<string>(UNITS[0]);
  const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0]);
  const [adding, setAdding] = useState(false);
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [addErrors, setAddErrors] = useState<{ [k: string]: string }>({});

  // purchase confirmation state
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<any | null>(null);
  const [purchaseExpiry, setPurchaseExpiry] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [purchaseStorage, setPurchaseStorage] = useState<string>(STORAGE_LOCATIONS[0]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // snackbar / undo
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const undoRef = useRef<any>(null);

  // load items
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const all = await storage.getAll();
      if (!mounted) return;
      setItems(all || []);
    };
    load();
    const sub = storage.subscribe(() => load());
    return () => { mounted = false; try { sub.remove(); } catch { } };
  }, []);

  // load categories from AsyncStorage (persisted per-device)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('pantry_categories');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) setCategories(parsed);
        }
      } catch (e) {
        console.warn('Failed to load categories', e);
      }
    })();
  }, []);

  async function persistCategories(next: string[]) {
    try {
      await AsyncStorage.setItem('pantry_categories', JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save categories', e);
    }
  }

  function addCategory(name: string) {
    const trimmed = (name || '').trim();
    if (!trimmed) return Alert.alert('Enter a category name');
    if (categories.includes(trimmed)) return Alert.alert('Category exists');
    const next = [...categories, trimmed];
    setCategories(next);
    persistCategories(next);
    setNewCategoryName('');
  }

  function startEditCategory(idx: number) {
    setEditingCategoryIndex(idx);
    setEditingCategoryName(categories[idx]);
  }

  function renameCategory() {
    if (editingCategoryIndex === null) return;
    const newName = (editingCategoryName || '').trim();
    if (!newName) return Alert.alert('Enter a category name');
    const next = [...categories];
    const old = next[editingCategoryIndex];
    if (old === newName) { setEditingCategoryIndex(null); return; }
    if (next.includes(newName)) return Alert.alert('Category already exists');
    next[editingCategoryIndex] = newName;
    setCategories(next);
    persistCategories(next);
    // update items with the old category to the new name
    (async () => {
      const all = await storage.getAll();
      const toUpdate = all.filter((it: any) => it.category === old);
      await Promise.all(toUpdate.map((it: any) => storage.update({ id: it.id, category: newName, updatedAt: Date.now() })));
      const refreshed = await storage.getAll(); setItems(refreshed || []);
    })();
    setEditingCategoryIndex(null);
  }

  async function deleteCategory(idx: number) {
    const name = categories[idx];
    Alert.alert('Delete category', `Delete "${name}"? Items will be moved to "Other".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const next = categories.filter((_, i) => i !== idx);
          setCategories(next);
          await persistCategories(next);
          // reassign items with this category to 'Other'
          const all = await storage.getAll();
          const affected = all.filter((it: any) => it.category === name);
          await Promise.all(affected.map((it: any) => storage.update({ id: it.id, category: 'Other', updatedAt: Date.now() })));
          const refreshed = await storage.getAll(); setItems(refreshed || []);
        }
      }
    ]);
  }

  const shopping = useMemo(() => (items || []).filter(i => i.onShoppingList), [items]);

  const grouped = useMemo(() => {
    const m: Record<string, any[]> = {};
    // ensure every category exists on map (so empty categories render)
    for (const c of categories) m[c] = [];
    (shopping || []).forEach(it => {
      const cat = (it.category && String(it.category)) || 'Other';
      if (!m[cat]) m[cat] = [];
      m[cat].push(it);
    });
    // sort items per group
    Object.keys(m).forEach(k => {
      m[k].sort((a, b) => {
        if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
        if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    });
    return m;
  }, [shopping, sortBy, categories]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    Object.keys(grouped).forEach(k => { if (collapsed[k] === undefined) map[k] = false; });
    if (Object.keys(map).length) setCollapsed(prev => ({ ...prev, ...map }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(grouped).length]);

  const filteredSorted = useMemo(() => {
    let list = (shopping || []).slice();
    if (filter === 'active') list = list.filter(i => !i.purchased);
    else if (filter === 'bought') list = list.filter(i => !!i.purchased);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [shopping, search, filter]);

  function toggleSelect(id: string, next: boolean) {
    setSelected(s => {
      const copy = { ...s };
      if (next) copy[id] = true;
      else delete copy[id];
      return copy;
    });
  }

  // start purchase flow (ask expiry + storage)
  function startPurchaseFlow(item: any) {
    // suggest expiry based on category (simple defaults)
    const category = item.category || '';
    const today = new Date();
    const suggestionDays: Record<string, number> = {
      Dairy: 7, Produce: 7, Frozen: 180, Bakery: 3, Grocery: 365,
    };
    const days = suggestionDays[category] ?? 30;
    const suggested = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const iso = suggested.toISOString().split('T')[0];
    setPurchaseTarget(item);
    setPurchaseExpiry(iso);
    setPurchaseDate(suggested);
    setPurchaseStorage(STORAGE_LOCATIONS[0]);
    setPurchaseVisible(true);
  }

  async function confirmPurchaseAndMove() {
    if (!purchaseTarget) return;
    // prefer purchaseDate, fallback to purchaseExpiry string
    const expiry = purchaseDate ? purchaseDate.toISOString().split('T')[0] : purchaseExpiry;
    if (!expiry || !purchaseStorage) {
      Alert.alert('Please provide expiry date and storage location');
      return;
    }
    setPurchaseLoading(true);
    try {
      // preserve previous copy for undo
      const prev = { ...purchaseTarget };
      undoRef.current = prev;
      // update item: mark removed from shopping list and set pantry fields
      const payload: any = {
        id: purchaseTarget.id,
        onShoppingList: false,
        purchased: true,
        expiry_date: expiry,
        expires: expiry, // keep both keys for compatibility
        storage_location: purchaseStorage,
        updatedAt: Date.now(),
      };
      await storage.update(payload);

      setPurchaseVisible(false);
      setSnackMessage(`${purchaseTarget.name} added to pantry`);
      setSnackVisible(true);

      // allow undo for short time
      // undoRef.current stores previous object to restore if user requests undo
    } catch (e) {
      console.warn('Failed to move purchased item to pantry', e);
      Alert.alert('Failed to add item to pantry');
    } finally {
      setPurchaseLoading(false);
      setPurchaseTarget(null);
    }
  }

  async function undoPurchase() {
    const prev = undoRef.current;
    if (!prev) return;
    try {
      // restore previous flags
      const payload = {
        id: prev.id,
        onShoppingList: true,
        purchased: prev.purchased || false,
        expiry_date: prev.expiry_date || undefined,
        expires: prev.expires || undefined,
        storage_location: prev.storage_location || undefined,
        updatedAt: Date.now(),
      };
      await storage.update(payload);
      setSnackVisible(false);
      undoRef.current = null;
    } catch (e) {
      console.warn('Undo failed', e);
      Alert.alert('Undo failed');
    }
  }

  async function toggleBoughtQuick(id: string) {
    // legacy toggle — replaced by purchase flow for marking as bought
    const all = await storage.getAll();
    const it = all.find((x: any) => x.id === id);
    if (!it) return;
    if (it.purchased) {
      // unmark purchased
      await storage.update({ id, purchased: false, updatedAt: Date.now() });
    } else {
      // open purchase flow
      startPurchaseFlow(it);
    }
  }

  async function removeFromList(id: string) {
    await storage.update({ id, onShoppingList: false, purchased: false, updatedAt: Date.now() });
  }

  async function addToPantry(id: string) {
    const all = await storage.getAll();
    const it = all.find((x: any) => x.id === id);
    if (!it) return;
    const nextQty = (it.quantity || 0) + 1;
    await storage.update({ id, quantity: nextQty, onShoppingList: false, purchased: false, updatedAt: Date.now() });
  }

  async function bulkAddSelectedToPantry() {
    const ids = Object.keys(selected);
    if (ids.length === 0) return;
    const all = await storage.getAll();
    await Promise.all(ids.map(async id => {
      const it = all.find((x: any) => x.id === id);
      if (!it) return;
      await storage.update({ id, quantity: (it.quantity || 0) + 1, onShoppingList: false, purchased: false, updatedAt: Date.now() });
    }));
    setSelected({});
  }

  async function bulkRemoveSelected() {
    const ids = Object.keys(selected);
    if (ids.length === 0) return;
    await Promise.all(ids.map(id => storage.update({ id, onShoppingList: false, purchased: false, updatedAt: Date.now() })));
    setSelected({});
  }

  function confirmClearBought() {
    Alert.alert('Clear bought items', 'Remove bought items from shopping list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const bought = shopping.filter(i => i.purchased).map(i => i.id);
          await Promise.all(bought.map(id => storage.update({ id, onShoppingList: false, purchased: false, updatedAt: Date.now() })));
        }
      }
    ]);
  }

  // Add new shopping item (validation includes unit & category)
  async function addNewShoppingItem() {
    const name = (newName || '').trim();
    const qty = Number(newQuantity || 0);
    const unit = newUnit;
    const category = newCategory;

    const errors: any = {};
    if (!name) errors.name = 'Name is required';
    if (!qty || Number.isNaN(qty) || qty <= 0) errors.quantity = 'Enter a valid quantity';
    if (!unit) errors.unit = 'Select a unit';
    if (!category) errors.category = 'Select a category';
    setAddErrors(errors);
    if (Object.keys(errors).length) return;

    setAdding(true);
    try {
      const now = Date.now();
      const id = String(now);
      const payload: any = {
        id,
        name,
        quantity: qty,
        unit,
        category,
        description: newNotes || '',
        notes: newNotes || '',
        onShoppingList: true,
        purchased: false,
        createdAt: now,
        updatedAt: now,
      };

      const s = storage as any;
      if (typeof s.create === 'function') await s.create(payload);
      else if (typeof s.add === 'function') await s.add(payload);
      else if (typeof s.save === 'function') await s.save(payload);
      else if (typeof s.update === 'function') await s.update(payload);
      else throw new Error('storage.create/update not available');

      // reset form
      setNewName(''); setNewNotes(''); setNewQuantity('1'); setNewUnit(UNITS[0]); setNewCategory(CATEGORIES[0]);
      setAddVisible(false);
      const all = await storage.getAll(); setItems(all || []);
    } catch (e) {
      console.warn('Failed to add shopping item', e);
      Alert.alert('Failed to add item');
    } finally {
      setAdding(false);
    }
  }

  // toggles collapse with LayoutAnimation
  function toggleCategory(cat: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  // quantity changes
  async function incrementQty(id: string) {
    try {
      const all = await storage.getAll();
      const it = (all || []).find((x: any) => x.id === id);
      if (!it) return;
      await storage.update({ id, quantity: (it.quantity || 0) + 1, updatedAt: Date.now() });
    } catch (e) {
      console.warn('incrementQty failed', e);
    }
  }

  async function decrementQty(id: string) {
    try {
      const all = await storage.getAll();
      const it = (all || []).find((x: any) => x.id === id);
      if (!it) return;
      const next = Math.max(0, (it.quantity || 0) - 1);
      await storage.update({ id, quantity: next, updatedAt: Date.now() });
    } catch (e) {
      console.warn('decrementQty failed', e);
    }
  }

  // edit item flow
  const [editVisible, setEditVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [editUnit, setEditUnit] = useState<string>(UNITS[0]);
  const [editCategory, setEditCategory] = useState<string>(CATEGORIES[0]);
  const [editNotes, setEditNotes] = useState('');

  function openEdit(item: any) {
    setEditTarget(item);
    setEditName(item.name || '');
    setEditQuantity(String(item.quantity || '1'));
    setEditUnit(item.unit || UNITS[0]);
    setEditCategory(item.category || CATEGORIES[0]);
    setEditNotes(item.description || item.notes || '');
    setEditVisible(true);
  }

  async function saveEdit() {
    if (!editTarget) return setEditVisible(false);
    const qty = Number(editQuantity || 0) || 0;
    await storage.update({
      id: editTarget.id,
      name: (editName || '').trim() || editTarget.name,
      quantity: qty,
      unit: editUnit,
      category: editCategory,
      description: editNotes || editTarget.description,
      notes: editNotes || editTarget.notes,
      updatedAt: Date.now(),
    });
    setEditVisible(false);
    setEditTarget(null);
  }

  const suggestions = useMemo(() => {
    const pantry = (items || []).slice().filter(it => !it.onShoppingList);
    // prefer low-stock items first but dedupe by normalized name
    const seen = new Set<string>();
    const out: { title: string; subtitle?: string }[] = [];

    // add low-stock first
    for (const it of pantry) {
      const name = (it.name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      if ((it.quantity || 0) <= 1) {
        seen.add(key);
        out.push({ title: name, subtitle: it.quantity ? `Only ${it.quantity} left` : 'Low stock' });
      }
      if (out.length >= 6) break;
    }

    // then fallback to any unique pantry names
    if (out.length < 6) {
      for (const it of pantry) {
        const name = (it.name || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ title: name, subtitle: 'Suggested' });
        if (out.length >= 6) break;
      }
    }

    return out;
  }, [items]);

  function renderAvatars(item: any) {
    const avatars: string[] = Array.isArray(item.avatars) ? item.avatars.slice(0, 2) : [];
    if (avatars.length === 0) return null;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {avatars.map((a, ai) => (
          <Avatar.Image
            key={ai}
            source={{ uri: a }}
            size={24}
            style={{ backgroundColor: '#e5e7eb', marginRight: ai === avatars.length - 1 ? 0 : 6 }}
          />
        ))}
        {avatars.length > 2 ? <Text style={{ color: '#6b7280', fontSize: 13, marginLeft: 6 }}>+{avatars.length - 2}</Text> : null}
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const cat = item.category || 'Other';
    const isSelected = !!selected[item.id];
    const bought = item.purchased;

    return (
      <AnimatedItemWrapper index={index}>
        <View style={[styles.itemCard, bought ? styles.itemCardBought : null]}>
          <View style={styles.itemLeft}>
            <TouchableOpacity onPress={() => toggleSelect(item.id, !isSelected)}>
              <View style={[styles.checkboxOuter, item.purchased ? styles.checkboxChecked : null]}>
                {item.purchased ? <MaterialCommunityIcons name="check" size={16} color="#fff" /> : null}
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.itemCenter}>
            <Text style={[styles.itemTitle, bought ? styles.itemTitleBought : null]}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.quantity} {item.unit || ''} • {item.category || 'Other'}</Text>
            <View style={styles.itemControls}>
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementQty(item.id)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity || 0}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementQty(item.id)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconButton icon="check-circle-outline" size={20} onPress={() => startPurchaseFlow(item)} accessibilityLabel="Mark purchased" />
                <IconButton icon="pencil" size={20} onPress={() => openEdit(item)} accessibilityLabel="Edit item" />
                <IconButton icon="trash-can-outline" size={20} onPress={() => removeFromList(item.id)} accessibilityLabel="Remove item" />
              </View>
            </View>
          </View>
        </View>
      </AnimatedItemWrapper>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={Object.keys(grouped)}
        renderItem={({ item: catName }) => {
          const itemsInCat = grouped[catName] || [];
          const isCollapsed = !!collapsed[catName];
          return (
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{catName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.countBadge, { marginRight: 8 }]}>{itemsInCat.length}</Text>
                  <TouchableOpacity onPress={() => toggleCategory(catName)}>
                    <MaterialCommunityIcons name={isCollapsed ? "chevron-down" : "chevron-up"} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
              {!isCollapsed && (
                <View style={styles.categoryBody}>
                  {itemsInCat.length === 0 ? <Text style={{ color: '#6b7280' }}>No items</Text> : itemsInCat.map((it, idx) => (
                    <React.Fragment key={it.id}>{renderItem({ item: it, index: idx })}</React.Fragment>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        keyExtractor={item => item}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={() => (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>My Shopping List</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setCatModalVisible(true)} style={{ marginRight: 8 }}>
                  <Text style={{ color: '#2f6bf6', fontWeight: '800' }}>Manage Categories</Text>
                </TouchableOpacity>
                <IconButton icon="plus" onPress={() => setAddVisible(true)} accessibilityLabel="Add shopping item" />
              </View>
            </View>
            <View style={styles.suggestionsRow}>
              <Text style={{ fontWeight: '700', fontSize: 15, marginBottom: 8 }}>Smart Suggestions</Text>
              <FlatList
                data={suggestions}
                renderItem={({ item }) => (
                  <SmartSuggestionCard
                    title={item.title}
                    subtitle={item.subtitle}
                    onAdd={async () => {
                      // Idempotent add: if an item with same name already on shopping list,
                      // increase its qty; otherwise create a new shopping item.
                      try {
                        const all = await storage.getAll();
                        const nameNorm = (item.title || '').trim().toLowerCase();
                        const existing = (all || []).find((x: any) => (x.name || '').trim().toLowerCase() === nameNorm && x.onShoppingList);
                        if (existing) {
                          await storage.update({ id: existing.id, quantity: (existing.quantity || 0) + 1, updatedAt: Date.now() });
                        } else {
                          const now = Date.now();
                          const id = String(now);
                          const payload: any = {
                            id,
                            name: item.title,
                            quantity: 1,
                            unit: UNITS[0],
                            category: CATEGORIES[0],
                            onShoppingList: true,
                            createdAt: now,
                            updatedAt: now,
                          };
                          const s = storage as any;
                          if (typeof s.create === 'function') await s.create(payload);
                          else if (typeof s.add === 'function') await s.add(payload);
                          else await s.update(payload);
                        }
                      } catch (e) {
                        console.warn('Failed to add suggestion', e);
                      }
                    }}
                  />
                )}
                keyExtractor={(item) => (item.title || '').trim().toLowerCase() || Math.random().toString(36).slice(2, 9)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 12, flexDirection: 'row' }}
              />
            </View>
          </>
        )}
      />

      {/* Add Item Dialog */}
      <Portal>
        <Dialog visible={addVisible} onDismiss={() => setAddVisible(false)}>
          <Dialog.Title>Add Shopping Item</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={newName} onChangeText={setNewName} mode="outlined" />
            <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
              <TextInput label="Quantity" value={newQuantity} onChangeText={setNewQuantity} keyboardType="numeric" mode="outlined" style={{ flex: 1, marginRight: 8 }} />
              <Menu
                visible={unitMenuVisible}
                onDismiss={() => setUnitMenuVisible(false)}
                anchor={<Button mode="outlined" onPress={() => setUnitMenuVisible(true)}>{newUnit}</Button>}
              >
                {UNITS.map(u => <Menu.Item key={u} onPress={() => { setNewUnit(u); setUnitMenuVisible(false); }} title={u} />)}
              </Menu>
            </View>
            <View style={{ marginTop: 8 }}>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={<Button mode="outlined" onPress={() => setCategoryMenuVisible(true)}>{newCategory}</Button>}
              >
                {categories.map(c => <Menu.Item key={c} onPress={() => { setNewCategory(c); setCategoryMenuVisible(false); }} title={c} />)}
              </Menu>
            </View>
            <TextInput label="Description (optional)" value={newNotes} onChangeText={setNewNotes} mode="outlined" multiline style={{ marginTop: 8 }} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={addNewShoppingItem}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Item Dialog */}
      <Portal>
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edit Item</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={editName} onChangeText={setEditName} mode="outlined" />
            <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
              <TextInput label="Quantity" value={editQuantity} onChangeText={setEditQuantity} keyboardType="numeric" mode="outlined" style={{ flex: 1, marginRight: 8 }} />
              <Menu
                visible={unitMenuVisible && false ? true : false} /* keep unit menu local if needed */
                onDismiss={() => { }}
                anchor={<Button mode="outlined" onPress={() => setEditUnit(editUnit)}>{editUnit}</Button>}
              >
                {UNITS.map(u => <Menu.Item key={u} onPress={() => setEditUnit(u)} title={u} />)}
              </Menu>
            </View>
            <View style={{ marginTop: 8 }}>
              <Menu
                visible={categoryMenuVisible && false ? true : false}
                onDismiss={() => { }}
                anchor={<Button mode="outlined" onPress={() => setEditCategory(editCategory)}>{editCategory}</Button>}
              >
                {categories.map(c => <Menu.Item key={c} onPress={() => setEditCategory(c)} title={c} />)}
              </Menu>
            </View>
            <TextInput label="Notes" value={editNotes} onChangeText={setEditNotes} mode="outlined" multiline style={{ marginTop: 8 }} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={saveEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Purchase confirmation dialog (expiry + storage) */}
      <Portal>
        <Dialog visible={purchaseVisible} onDismiss={() => setPurchaseVisible(false)}>
          <Dialog.Title>Add to pantry</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 8, color: '#374151' }}>
              Before adding this item to your pantry, tell us where you’ll store it and when it expires.
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{ paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e6e9ef', borderRadius: 8 }}
            >
              <Text style={{ color: purchaseDate ? '#0f1724' : '#6b7280' }}>
                {purchaseDate ? purchaseDate.toISOString().split('T')[0] : 'Select expiry date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={purchaseDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, selectedDate) => {
                  // on Android the first arg is event; selectedDate may be undefined when dismissed
                  const d = selectedDate || purchaseDate;
                  setShowDatePicker(Platform.OS === 'ios'); // keep open on iOS, close on Android
                  if (d) {
                    setPurchaseDate(d);
                    setPurchaseExpiry(d.toISOString().split('T')[0]);
                  }
                }}
              />
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {STORAGE_LOCATIONS.map(loc => (
                <Chip
                  key={loc}
                  style={{ marginRight: 8, marginBottom: 8 }}
                  selected={purchaseStorage === loc}
                  onPress={() => setPurchaseStorage(loc)}
                >
                  {loc}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPurchaseVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={confirmPurchaseAndMove}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Category management modal */}
      <Modal visible={catModalVisible} transparent animationType="slide" onRequestClose={() => setCatModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Manage Categories</Text>
            {categories.map((c, i) => (
              <View key={c} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 16 }}>{c}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => startEditCategory(i)}><Text style={{ color: '#2f6bf6' }}>Rename</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCategory(i)}><Text style={{ color: '#ef4444' }}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            ))}

            {editingCategoryIndex !== null && (
              <View style={{ marginVertical: 8 }}>
                <TextInput value={editingCategoryName} onChangeText={setEditingCategoryName} placeholder="Rename category" style={{ borderWidth: 1, borderColor: '#e6e9ef', padding: 8, borderRadius: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => { setEditingCategoryIndex(null); setEditingCategoryName(''); }} style={{ marginRight: 12 }}><Text>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={renameCategory}><Text style={{ color: '#2f6bf6' }}>Save</Text></TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TextInput placeholder="New category" value={newCategoryName} onChangeText={setNewCategoryName} style={{ flex: 1, borderWidth: 1, borderColor: '#e6e9ef', padding: 8, borderRadius: 8 }} />
              <TouchableOpacity onPress={() => addCategory(newCategoryName)} style={{ backgroundColor: '#2f6bf6', padding: 10, borderRadius: 8, justifyContent: 'center', marginLeft: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}><Text style={{ color: '#6b7280' }}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}