import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput as RNTextInput,
  ScrollView,
  Dimensions,
  LayoutAnimation,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Portal,
  Modal,
  TextInput,
  Snackbar,
  FAB,
  Avatar,
  Chip,
  RadioButton,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from "react-native-modal-datetime-picker";

import storage from '../storage/store';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const UNITS = ['pcs', 'kg', 'gm', 'mg', 'pack', 'L', 'ml', 'can', 'bottle'];
const DEFAULT_CATEGORIES = ['Produce', 'Dairy & Alternatives', 'Frozen Goods', 'Meat & Seafood', 'Pantry Staples', 'Beverages', 'Other'];
const STORAGE_LOCATIONS = ['Pantry', 'Fridge', 'Freezer'];

export default function ShoppingList() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');

  // Selection State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Modals
  const [addVisible, setAddVisible] = useState(false);
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form State (Add/Edit)
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState(UNITS[0]);
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [formNotes, setFormNotes] = useState('');

  // Purchase Flow State

  // Purchase Flow State
  const [purchaseLocation, setPurchaseLocation] = useState(STORAGE_LOCATIONS[0]);
  const [purchaseExpiry, setPurchaseExpiry] = useState(''); // YYYY-MM-DD
  const [purchaseDate, setPurchaseDate] = useState(''); // YYYY-MM-DD
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [priceMap, setPriceMap] = useState<Record<string, string>>({}); // itemId -> price string

  // Date Picker State
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'purchase' | 'expiry'>('purchase');

  const showDatePicker = (mode: 'purchase' | 'expiry') => {
    setDatePickerMode(mode);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (datePickerMode === 'purchase') {
      setPurchaseDate(dateStr);
    } else {
      setPurchaseExpiry(dateStr);
    }
    hideDatePicker();
  };

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const all = await storage.getAll();
      if (mounted) {
        setItems(all || []);
        setLoading(false);
      }
    };
    load();
    const sub = storage.subscribe(load);
    AsyncStorage.getItem('pantry_categories').then(raw => {
      if (raw) { try { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) setCategories(parsed); } catch { } }
    });
    return () => { mounted = false; sub.remove(); };
  }, []);

  const shoppingList = useMemo(() => items.filter(i => i.onShoppingList && !i.purchased), [items]);

  // Grouping
  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const filtered = shoppingList.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));
    categories.forEach(c => { groups[c] = [] });
    groups['Other'] = [];
    filtered.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    Object.keys(groups).forEach(key => { groups[key].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); });
    return groups;
  }, [shoppingList, categories, search]);

  const activeCategories = useMemo(() => Object.keys(groupedItems).filter(c => groupedItems[c].length > 0), [groupedItems]);

  // Actions
  function toggleSelection(id: string) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function incrementQty(id: string) {
    try {
      const all = await storage.getAll();
      const it = (all || []).find((x: any) => x.id === id);
      if (!it) return;
      await storage.update({ id, quantity: (it.quantity || 0) + 1, updatedAt: Date.now() });
    } catch (e) { console.warn(e); }
  }

  async function decrementQty(id: string) {
    try {
      const all = await storage.getAll();
      const it = (all || []).find((x: any) => x.id === id);
      if (!it) return;
      const next = Math.max(1, (it.quantity || 1) - 1);
      await storage.update({ id, quantity: next, updatedAt: Date.now() });
    } catch (e) { console.warn(e); }
  }

  async function deleteSelected() {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;

    Alert.alert('Delete Items', `Remove ${ids.length} items from shopping list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await Promise.all(ids.map(id => storage.update({ id, onShoppingList: false })));
          setSelectedItems(new Set());
          setSnackMsg('Items removed');
          setSnackVisible(true);
        }
      }
    ]);
  }

  function openPurchaseModal() {
    if (selectedItems.size === 0) return;
    // Reset purchase form
    setPurchaseLocation('Pantry');
    // Default expiry 1 week from now
    const d = new Date(); d.setDate(d.getDate() + 7);
    setPurchaseExpiry(d.toISOString().split('T')[0]);
    setPurchaseNotes('');

    // Init prices (default to 0 or last known price if we had it, but for now 0)
    const initialPrices: Record<string, string> = {};
    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      initialPrices[id] = item?.price ? String(item.price) : '';
    });
    setPriceMap(initialPrices);

    setPurchaseVisible(true);
  }

  async function confirmPurchase() {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;

    try {
      await Promise.all(ids.map(id => storage.update({
        id,
        onShoppingList: false, // removed from list
        purchased: true,       // marked bought for history
        storage_location: purchaseLocation,
        expires: purchaseExpiry || undefined,
        notes: purchaseNotes ? purchaseNotes : undefined, // simple merge
        price: parseFloat(priceMap[id]) || 0,
        currency: 'INR',
        purchasedAt: Date.now(),
        updatedAt: Date.now()
      })));

      setSelectedItems(new Set());
      setPurchaseVisible(false);
      setSnackMsg(`${ids.length} items moved to ${purchaseLocation}`);
      setSnackVisible(true);
    } catch (e) {
      console.warn(e);
      Alert.alert('Error moving items');
    }
  }

  async function onAddItem() {
    if (!formName.trim()) return;
    try {
      const payload = {
        id: editingItem ? editingItem.id : undefined,
        name: formName,
        quantity: parseFloat(formQty) || 1,
        unit: formUnit,
        category: formCategory,
        description: formNotes,
        onShoppingList: true,
        purchased: false,
      };
      // @ts-ignore
      if (editingItem) await storage.update(payload);
      // @ts-ignore
      else await storage.add(payload);

      setSnackMsg(editingItem ? 'Item updated' : 'Item added');
      setSnackVisible(true);
      closeModal();
    } catch (e) { console.warn(e); }
  }

  function openAddModal() { setEditingItem(null); setFormName(''); setFormQty('1'); setFormUnit(UNITS[0]); setFormCategory(DEFAULT_CATEGORIES[0]); setFormNotes(''); setAddVisible(true); }
  function openEditModal(item: any) { setEditingItem(item); setFormName(item.name); setFormQty(String(item.quantity || 1)); setFormUnit(item.unit || UNITS[0]); setFormCategory(item.category || DEFAULT_CATEGORIES[0]); setFormNotes(item.description || ''); setAddVisible(true); }
  function closeModal() { setAddVisible(false); setEditingItem(null); }
  function toggleCollapse(cat: string) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] })); }

  // Smart Suggestions: Items in pantry with low quantity (<= 2) and NOT already on shopping list
  const suggestions = useMemo(() => {
    return items
      .filter(i => !i.onShoppingList && !i.purchased && (i.quantity || 0) <= 2)
      .sort((a, b) => (a.quantity || 0) - (b.quantity || 0)) // Lowest quantity first (0s at top)
      .slice(0, 5) // Limit to 5 suggestions
      .map(i => ({
        id: i.id,
        name: i.name,
        subtitle: (i.quantity || 0) === 0 ? 'Out of Stock' : `Low stock: ${i.quantity} ${i.unit || 'pcs'} remaining`,
        unit: i.unit,
        cat: i.category || 'Other'
      }));
  }, [items]);

  async function addSuggestion(s: any) {
    // Determine if this is a real item ID or just a mock one (though now they are real)
    const existing = items.find(i => i.id === s.id);
    if (existing) {
      await storage.update({ id: existing.id, onShoppingList: true });
    } else {
      // Fallback (shouldn't happen with dynamic logic)
      // @ts-ignore
      await storage.add({ name: s.name, quantity: 1, unit: s.unit || 'pcs', onShoppingList: true, category: s.cat, purchased: false });
    }
    setSnackMsg(`${s.name} added to list`); setSnackVisible(true);
  }

  // Helpers for quick dates
  function setQuickExpiry(days: number) {
    const d = new Date(); d.setDate(d.getDate() + days);
    setPurchaseExpiry(d.toISOString().split('T')[0]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header - White & Clean using SafeArea inset implicitly via padding */}
      <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'ios' ? 30 : 30 }]}>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search Item"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <View style={styles.searchIcons}>
            <TouchableOpacity style={{ marginRight: 12 }}><MaterialCommunityIcons name="camera-outline" size={22} color="#6b7280" /></TouchableOpacity>
            <TouchableOpacity><MaterialCommunityIcons name="microphone-outline" size={22} color="#6b7280" /></TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Smart Suggestions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 24 }}>
              {suggestions.map((s, i) => (
                <Animated.View key={s.id ? `${s.id}-${i}` : `sugg-${i}`} entering={FadeInDown.delay(i * 100)}>
                  <View style={styles.suggestionCard}>
                    <View>
                      <Text style={styles.suggTitle}>{s.name}</Text>
                      <Text style={styles.suggSub}>{s.subtitle}</Text>
                    </View>
                    <TouchableOpacity style={styles.suggBtn} onPress={() => addSuggestion(s)}>
                      <Text style={styles.suggBtnText}>Add to List</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </>
        )}

        {/* My Shopping List Header */}
        <View style={styles.listHeaderRow}>
          <MaterialCommunityIcons name="shopping-outline" size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.listHeaderTitle}>My Shopping List</Text>
        </View>

        {/* Categories */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 12, color: '#666' }}>Loading list...</Text>
          </View>
        ) : activeCategories.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
            <MaterialCommunityIcons name="cart-outline" size={64} color="#ccc" />
            <Text style={{ marginTop: 10, color: '#999' }}>List is empty</Text>
          </View>
        ) : activeCategories.map(cat => (
          <View key={cat} style={styles.categorySection}>
            <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCollapse(cat)} activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.categoryTitle}>{cat}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{groupedItems[cat].length}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name={collapsed[cat] ? "chevron-down" : "chevron-up"} size={20} color="#4b5563" />
            </TouchableOpacity>

            {!collapsed[cat] && (
              <View style={styles.categoryList}>
                {groupedItems[cat].map((item, index) => (
                  <View key={item.id ? `${item.id}-${index}` : `fallback-${index}`} style={styles.itemCard}>
                    {/* Left: Checkbox */}
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => toggleSelection(item.id)}
                    >
                      <View style={[styles.checkbox, selectedItems.has(item.id) && styles.checkboxSelected]}>
                        {selectedItems.has(item.id) && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                      </View>
                    </TouchableOpacity>

                    {/* Middle: Content */}
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={styles.itemDesc} numberOfLines={1}>{item.description || 'Regular'}</Text>
                      </View>
                    </View>

                    {/* Right: Controls */}
                    <View style={styles.itemControls}>
                      {/* Quantity Pill */}
                      <View style={styles.pillControl}>
                        <TouchableOpacity onPress={() => decrementQty(item.id)} style={styles.pillBtn}>
                          <MaterialCommunityIcons name="minus" size={14} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={styles.pillValue}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => incrementQty(item.id)} style={styles.pillBtn}>
                          <MaterialCommunityIcons name="plus" size={14} color="#1f2937" />
                        </TouchableOpacity>
                      </View>

                      {/* Unit Pill */}
                      <TouchableOpacity style={[styles.pillControl, { marginLeft: 8, paddingHorizontal: 8 }]} onPress={() => openEditModal(item)}>
                        <Text style={styles.pillUnitText}>{item.unit || 'pcs'}</Text>
                        <MaterialCommunityIcons name="menu-down" size={16} color="#4b5563" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Selection Bar */}
      {selectedItems.size > 0 ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedItems.size} items selected  </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Button mode="outlined" style={styles.deleteBtn} icon="delete" textColor="#ef4444" onPress={deleteSelected} compact>Delete</Button>
            <Button
              mode="contained"
              style={styles.purchaseBtn}
              buttonColor={theme.colors.primary}
              icon="cart-check"
              onPress={openPurchaseModal}
            >
              Purchased
            </Button>
          </View>
        </Animated.View>
      ) : (
        // Default FAB when nothing selected
        <FAB icon="plus" style={styles.fab} onPress={openAddModal} color="#fff" />
      )}

      {/* Add/Edit Modal */}
      <Portal>
        <Modal visible={addVisible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Product'}</Text>

          <TextInput label="Product Name" value={formName} onChangeText={setFormName} mode="outlined" style={styles.input} />

          <View style={{ flexDirection: 'row' }}>
            <TextInput label="Qty" value={formQty} onChangeText={setFormQty} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginRight: 8 }]} />
            <TextInput label="Unit (e.g. pcs)" value={formUnit} onChangeText={setFormUnit} mode="outlined" style={[styles.input, { flex: 1 }]} />
          </View>

          {/* Category Chips */}
          <Text style={styles.label}>Select Label / Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {categories.map(cat => (
              <Chip
                key={cat}
                selected={formCategory === cat}
                onPress={() => setFormCategory(cat)}
                style={{ marginRight: 8, backgroundColor: formCategory === cat ? '#dbeafe' : '#f3f4f6' }}
                selectedColor={theme.colors.primary}
              >
                {cat}
              </Chip>
            ))}
          </ScrollView>

          <TextInput label="Notes" value={formNotes} onChangeText={setFormNotes} mode="outlined" style={styles.input} />

          <Button mode="contained" onPress={onAddItem} style={styles.modalBtn}>
            {editingItem ? 'Save Changes' : 'Add to List'}
          </Button>
        </Modal>
      </Portal>

      {/* Purchase Details Modal */}
      <Portal>
        <Modal visible={purchaseVisible} onDismiss={() => setPurchaseVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Purchase Details</Text>
          <Text style={{ marginBottom: 16, color: '#666' }}>Moving {selectedItems.size} items to pantry.</Text>

          {/* Price Inputs List */}
          <Text style={styles.label}>Price Paid (₹)</Text>
          <View style={{ maxHeight: 150, marginBottom: 16 }}>
            <ScrollView nestedScrollEnabled style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }}>
              {Array.from(selectedItems).map(id => {
                const item = items.find(i => i.id === id);
                if (!item) return null;
                return (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <Text style={{ flex: 1, fontWeight: '600', color: '#374151' }} numberOfLines={1}>{item.name}</Text>
                    <TextInput
                      value={priceMap[id]}
                      onChangeText={txt => setPriceMap(p => ({ ...p, [id]: txt }))}
                      placeholder="0"
                      keyboardType="numeric"
                      dense
                      mode="outlined"
                      style={{ width: 80, height: 36, backgroundColor: '#fff', fontSize: 14 }}
                      contentStyle={{ paddingVertical: 0 }}
                      right={<TextInput.Affix text="₹" />}
                    />
                  </View>
                )
              })}
            </ScrollView>
          </View>

          <Text style={styles.label}>Storage Location</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {STORAGE_LOCATIONS.map(loc => (
              <Chip
                key={loc}
                selected={purchaseLocation === loc}
                onPress={() => setPurchaseLocation(loc)}
                style={{ marginRight: 8, marginBottom: 8, backgroundColor: purchaseLocation === loc ? '#dbeafe' : '#f3f4f6' }}
                selectedColor={theme.colors.primary}
                showSelectedOverlay
              >
                {loc}
              </Chip>
            ))}
          </View>

          <Text style={styles.label}>Expiry Date</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Button mode="outlined" compact onPress={() => setQuickExpiry(7)} style={{ marginRight: 8 }}>+7 Days</Button>
            <Button mode="outlined" compact onPress={() => setQuickExpiry(14)} style={{ marginRight: 8 }}>+14 Days</Button>
            <Button mode="outlined" compact onPress={() => setQuickExpiry(30)}>+1 Month</Button>
          </View>
          <TouchableOpacity onPress={() => showDatePicker('expiry')}>
            <TextInput
              label="YYYY-MM-DD"
              value={purchaseExpiry}
              editable={false}
              mode="outlined"
              placeholder="YYYY-MM-DD"
              style={styles.input}
              right={<TextInput.Icon icon="calendar" onPress={() => showDatePicker('expiry')} />}
              pointerEvents="none"
            />
          </TouchableOpacity>

          <Button mode="contained" onPress={confirmPurchase} style={styles.modalBtn} buttonColor={theme.colors.primary}>
            Confirm Purchase
          </Button>
        </Modal>
      </Portal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2500}>{snackMsg}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff' },
  searchBar: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    ...theme.shadows.soft,
  },
  searchInput: { flex: 1, height: 50, backgroundColor: 'transparent', fontSize: 16 },
  searchIcons: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },

  scrollContent: { paddingBottom: 40 },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginLeft: 20, marginBottom: 12, color: '#111827', marginTop: 10 },

  // Suggestion Card
  suggestionCard: {
    width: 160,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'space-between',
    ...theme.shadows.soft,
  },
  suggTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4, color: '#111827' },
  suggSub: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  suggBtn: { backgroundColor: '#354bc4ff', borderRadius: 8, paddingVertical: 10, alignItems: 'center', width: '100%' },
  suggBtnText: { color: '#fff', fontWeight: '700' },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12, marginBottom: 16 },
  listHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },

  categorySection: { marginBottom: 16, paddingHorizontal: 20 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  categoryTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  countPill: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 },
  countPillText: { fontSize: 13, fontWeight: '700', color: '#4b5563' },
  categoryList: { marginTop: 4 },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    // shadow
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  checkboxContainer: { marginRight: 12 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#d1d5db', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },

  itemContent: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  itemDesc: { fontSize: 13, color: '#6b7280', flex: 1, marginLeft: 8 },

  itemControls: { alignItems: 'flex-end' },
  pillControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, height: 32 },
  pillBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pillValue: { minWidth: 20, textAlign: 'center', fontWeight: '700', fontSize: 15 },
  pillUnitText: { fontWeight: '700', fontSize: 13, color: '#374151', marginRight: 4 },

  selectionBar: {
    position: 'absolute', bottom: 110, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 12, // Reduced padding
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    zIndex: 100,
  },
  selectionText: { fontWeight: '700', fontSize: 16, flex: 1 }, // Added flex:1 to text to push buttons
  deleteBtn: { marginRight: 8, borderColor: '#ef4444' },
  purchaseBtn: {
    // flex: 1 removed to prevent overflow
  },

  fab: { position: 'absolute', marginRight: 20, marginBottom: 20, right: 0, bottom: 90, backgroundColor: theme.colors.primary },
  modalContainer: { backgroundColor: '#fff', padding: 24, margin: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  modalBtn: { marginTop: 16, paddingVertical: 6 },
  input: { backgroundColor: '#fff', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 4 },
});