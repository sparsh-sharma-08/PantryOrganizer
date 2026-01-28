import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, Searchbar, Button, IconButton, Checkbox } from 'react-native-paper';
import { theme } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import store from '../storage/store';
import { MealItem, MealIngredient } from '../types';

interface AddMealSelectorProps {
    visible: boolean;
    onDismiss: () => void;
    onSelect: (item: MealItem) => void;
}

export default function AddMealSelector({ visible, onDismiss, onSelect }: AddMealSelectorProps) {
    const [mode, setMode] = useState<'pantry' | 'custom'>('pantry');
    const [pantryItems, setPantryItems] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [customName, setCustomName] = useState('');

    // Compostion State
    const [selectedIngredients, setSelectedIngredients] = useState<Record<string, number>>({}); // itemId -> quantity

    useEffect(() => {
        if (visible) {
            loadPantry();
            setSelectedIngredients({});
            setCustomName('');
            setQuery('');
        }
    }, [visible]);

    const loadPantry = async () => {
        const all = await store.getAll();
        const inPantry = all.filter(i => !i.onShoppingList && (i.quantity || 0) > 0);
        setPantryItems(inPantry);
    };

    const filtered = pantryItems.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

    const toggleIngredient = (id: string) => {
        const next = { ...selectedIngredients };
        if (next[id]) {
            delete next[id];
        } else {
            next[id] = 1; // Default qty
        }
        setSelectedIngredients(next);
    };

    const updateQty = (id: string, qty: string) => {
        const num = parseFloat(qty);
        if (!isNaN(num)) {
            setSelectedIngredients(prev => ({ ...prev, [id]: num }));
        }
    };

    const handleAddComposite = () => {
        const ingredients: MealIngredient[] = [];
        let nameParts = [];

        Object.keys(selectedIngredients).forEach(id => {
            const item = pantryItems.find(p => p.id === id);
            if (item) {
                ingredients.push({
                    pantryItemId: id,
                    name: item.name,
                    quantityUsed: selectedIngredients[id],
                    unit: item.unit
                });
                nameParts.push(item.name);
            }
        });

        if (ingredients.length === 0) return;

        // Auto-generate name or prompt? Let's use custom name if provided, else "Dish with X, Y"
        const finalName = customName.trim() || (ingredients.length === 1 ? ingredients[0].name : "Mixed Dish");

        onSelect({
            id: generateUUID(),
            name: finalName,
            isPantryItem: false, // It's a composite now
            ingredients: ingredients,
            cooked: false
        });
    };

    const handleAddCustom = () => {
        if (!customName.trim()) return;
        onSelect({
            id: generateUUID(),
            name: customName.trim(),
            isPantryItem: false,
            cooked: false
        });
    };

    function generateUUID() {
        return Math.random().toString(36).substring(2, 10);
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add Meal</Text>
                    <IconButton icon="close" onPress={onDismiss} />
                </View>

                <View style={styles.tabs}>
                    <TouchableOpacity style={[styles.tab, mode === 'pantry' && styles.activeTab]} onPress={() => setMode('pantry')}>
                        <Text style={[styles.tabText, mode === 'pantry' && styles.activeTabText]}>Compose Dish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, mode === 'custom' && styles.activeTab]} onPress={() => setMode('custom')}>
                        <Text style={[styles.tabText, mode === 'custom' && styles.activeTabText]}>Simple Text</Text>
                    </TouchableOpacity>
                </View>

                {mode === 'pantry' ? (
                    <View style={styles.content}>
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 12, color: '#666' }}>Name (Optional)</Text>
                            <RNTextInput
                                style={styles.inputSmall}
                                placeholder="e.g. Pasta Night"
                                value={customName}
                                onChangeText={setCustomName}
                            />
                        </View>

                        <Searchbar
                            placeholder="Search ingredients..."
                            value={query}
                            onChangeText={setQuery}
                            style={styles.search}
                        />

                        <FlatList
                            data={filtered}
                            keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `fallback-${index}`}
                            renderItem={({ item }) => {
                                const isSelected = !!selectedIngredients[item.id];
                                return (
                                    <Surface style={[styles.itemCard, isSelected && { borderColor: theme.colors.primary, borderWidth: 1 }]} elevation={1}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Checkbox status={isSelected ? 'checked' : 'unchecked'} onPress={() => toggleIngredient(item.id)} color={theme.colors.primary} />
                                            <View style={{ marginLeft: 8 }}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={{ fontSize: 10, color: '#888' }}>Available: {item.quantity} {item.unit}</Text>
                                            </View>
                                        </View>

                                        {isSelected && (
                                            <View style={styles.qtyRow}>
                                                <Text style={{ fontSize: 12, marginRight: 4 }}>Use:</Text>
                                                <RNTextInput
                                                    style={styles.qtyInput}
                                                    keyboardType="numeric"
                                                    value={String(selectedIngredients[item.id])}
                                                    onChangeText={(t) => updateQty(item.id, t)}
                                                />
                                                <Text style={{ fontSize: 12, marginLeft: 4 }}>{item.unit}</Text>
                                            </View>
                                        )}
                                    </Surface>
                                );
                            }}
                        />
                        <Button mode="contained" onPress={handleAddComposite} style={styles.addBtn} disabled={Object.keys(selectedIngredients).length === 0}>
                            Add Dish ({Object.keys(selectedIngredients).length})
                        </Button>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Text style={styles.label}>Meal Name</Text>
                        <RNTextInput
                            style={styles.input}
                            placeholder="e.g., Pizza Night, Leftovers"
                            value={customName}
                            onChangeText={setCustomName}
                            autoFocus
                        />
                        <Button mode="contained" onPress={handleAddCustom} style={styles.addBtn} disabled={!customName.trim()}>
                            Add to Plan
                        </Button>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    title: { fontSize: 24, fontWeight: '700' },
    tabs: { flexDirection: 'row', padding: 20 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ddd' },
    activeTab: { borderBottomColor: theme.colors.primary },
    tabText: { fontSize: 16, fontWeight: '600', color: '#999' },
    activeTabText: { color: theme.colors.primary },

    content: { flex: 1, padding: 20 },
    search: { marginBottom: 10, backgroundColor: '#fff' },
    itemCard: { padding: 10, marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 16, fontWeight: '500' },
    qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 4, borderRadius: 4 },
    qtyInput: { width: 40, backgroundColor: '#fff', textAlign: 'center', padding: 2, borderRadius: 4, fontSize: 14 },

    label: { marginBottom: 10, fontSize: 16, fontWeight: '600' },
    input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, fontSize: 18, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    inputSmall: { backgroundColor: '#fff', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    addBtn: { borderRadius: 8, paddingVertical: 6, marginTop: 10 }
});
