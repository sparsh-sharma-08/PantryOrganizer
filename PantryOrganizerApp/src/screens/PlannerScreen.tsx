import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator, Modal, FAB } from 'react-native-paper';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import store from '../storage/store';
import { MealItem, MealPlanDay } from '../types';
import { AddMealSelector } from '../components';

const { width } = Dimensions.get('window');

function getWeekDays(seedDate: Date) {
    const start = new Date(seedDate);
    start.setDate(start.getDate() - start.getDay()); // Start on Sunday
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

function formatDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export default function PlannerScreen() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekDays, setWeekDays] = useState(getWeekDays(new Date()));
    const [plans, setPlans] = useState<Record<string, MealPlanDay>>({});
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [targetSlot, setTargetSlot] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');

    useEffect(() => {
        // Subscribe
        // We just pass a dummy range for now as the listener is generic
        const unsub = store.subscribeToMealPlan('2024-01-01', '2030-12-31', (data) => {
            setPlans(data);
            setLoading(false);
        });
        return () => { unsub && unsub(); };
    }, []);

    const changeWeek = (offset: number) => {
        const newSeed = new Date(selectedDate);
        newSeed.setDate(newSeed.getDate() + (offset * 7));
        setWeekDays(getWeekDays(newSeed));
        // Also move selected date to match the flow? Or keep same day of week?
        const newSelected = new Date(selectedDate);
        newSelected.setDate(newSelected.getDate() + (offset * 7));
        setSelectedDate(newSelected);
    };

    const currentKey = formatDateKey(selectedDate);
    const dayPlan = plans[currentKey] || { breakfast: [], lunch: [], dinner: [] };

    const openAddModal = (slot: 'breakfast' | 'lunch' | 'dinner') => {
        setTargetSlot(slot);
        setModalVisible(true);
    };

    const handleAddMeal = async (item: MealItem) => {
        try {
            if (!item.id || !item.name) {
                console.error("Invalid meal item", item);
                return;
            }
            // Ensure ingredients are clean
            if (item.ingredients) {
                item.ingredients = item.ingredients.map(i => ({
                    pantryItemId: i.pantryItemId,
                    name: i.name,
                    quantityUsed: Number(i.quantityUsed) || 1, // Ensure number
                    unit: i.unit || '' // Ensure string
                }));
            }

            await store.addMeal(currentKey, targetSlot, item);
            setModalVisible(false);
        } catch (e: any) {
            console.error("Add Meal Error", e);
            alert(`Failed to add meal: ${e.message}`);
        }
    };

    const handleCook = async (slot: 'breakfast' | 'lunch' | 'dinner', meal: MealItem) => {
        try {
            if (meal.cooked) {
                // Ask to undo
                const result = await store.uncookMeal(currentKey, slot, meal.id);
                if (result && result.length > 0) {
                    alert(`Un-cooked (Restored)!\n\n${result.join('\n')}`);
                }
            } else {
                const result = await store.cookMeal(currentKey, slot, meal.id);
                // result is array of strings
                if (result && result.length > 0) {
                    alert(`Cooked!\n\n${result.join('\n')}`);
                } else {
                    alert("Cooked! (No linked pantry items were modified)");
                }
            }
        } catch (e: any) {
            console.error("Cook Error", e);
            alert(`Failed to cook: ${e.message}`);
        }
    };

    const removeMeal = (slot: 'breakfast' | 'lunch' | 'dinner', id: string) => {
        store.removeMeal(currentKey, slot, id);
    };

    return (
        <View style={styles.container}>
            {/* Header Week Selector */}
            <Surface style={styles.header} elevation={2}>
                <View style={styles.weekControl}>
                    <IconButton icon="chevron-left" onPress={() => changeWeek(-1)} />
                    <Text style={styles.monthTitle}>
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <IconButton icon="chevron-right" onPress={() => changeWeek(1)} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
                    {weekDays.map((d) => {
                        const isSelected = formatDateKey(d) === currentKey;
                        const isToday = formatDateKey(d) === formatDateKey(new Date());
                        return (
                            <TouchableOpacity key={d.toISOString()} onPress={() => setSelectedDate(d)}>
                                <Surface style={[styles.dayCard, isSelected && styles.dayCardSelected, isToday && styles.dayCardToday]} elevation={isSelected ? 4 : 1}>
                                    <Text style={[styles.dayName, isSelected && styles.textSelected]}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                    <Text style={[styles.dayNum, isSelected && styles.textSelected]}>{d.getDate()}</Text>
                                    {plans[formatDateKey(d)] && <View style={styles.dot} />}
                                </Surface>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Surface>

            <ScrollView style={styles.content}>
                <SlotSection title="Breakfast" icon="coffee-outline" color="#f59e0b" items={dayPlan.breakfast}
                    onAdd={() => openAddModal('breakfast')}
                    onRemove={(id: string) => removeMeal('breakfast', id)}
                    onCook={(m: MealItem) => handleCook('breakfast', m)}
                />
                <SlotSection title="Lunch" icon="food-variant" color="#10b981" items={dayPlan.lunch}
                    onAdd={() => openAddModal('lunch')}
                    onRemove={(id: string) => removeMeal('lunch', id)}
                    onCook={(m: MealItem) => handleCook('lunch', m)}
                />
                <SlotSection title="Dinner" icon="food-turkey" color="#3b82f6" items={dayPlan.dinner}
                    onAdd={() => openAddModal('dinner')}
                    onRemove={(id: string) => removeMeal('dinner', id)}
                    onCook={(m: MealItem) => handleCook('dinner', m)}
                />
                <View style={{ height: 60 }} />
            </ScrollView>

            <AddMealSelector
                visible={modalVisible}
                onDismiss={() => setModalVisible(false)}
                onSelect={handleAddMeal}
            />
        </View>
    );
}

function SlotSection({ title, icon, color, items, onAdd, onRemove, onCook }: any) {
    return (
        <View style={styles.slotContainer}>
            <View style={styles.slotHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name={icon} size={24} color={color} style={{ marginRight: 8 }} />
                    <Text style={styles.slotTitle}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onAdd}>
                    <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.itemsList}>
                {!items || items.length === 0 ? (
                    <Text style={styles.emptyText}>No meals planned</Text>
                ) : (
                    items.map((m: MealItem, index: number) => (
                        <Surface key={m.id ? `${m.id}-${index}` : `meal-${index}`} style={[styles.mealCard, m.cooked && { opacity: 0.7, backgroundColor: '#f0fdf4' }]} elevation={1}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.mealName, m.cooked && { textDecorationLine: 'line-through', color: '#166534' }]}>{m.name}</Text>
                                <Text style={styles.ingredients}>
                                    {m.ingredients ? m.ingredients.map(i => `${i.quantityUsed} ${i.unit || ''} ${i.name}`).join(', ') : (m.isPantryItem ? 'Single Item from Pantry' : '')}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity onPress={() => onCook(m)} style={[styles.cookBtn, m.cooked ? styles.cookedBtn : styles.uncookedBtn]}>
                                    <MaterialCommunityIcons name={m.cooked ? "check" : "fire"} size={16} color="#fff" />
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 2 }}>
                                        {m.cooked ? "DONE" : "COOK"}
                                    </Text>
                                </TouchableOpacity>

                                {!m.cooked && (
                                    <TouchableOpacity onPress={() => onRemove(m.id)}>
                                        <MaterialCommunityIcons name="close" size={20} color="#ccc" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Surface>
                    ))
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { backgroundColor: '#fff', paddingBottom: 16, paddingTop: 50 },
    weekControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    monthTitle: { fontSize: 18, fontWeight: '700' },
    daysRow: { paddingHorizontal: 16 },
    dayCard: { width: 50, height: 70, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#f3f4f6' },
    dayCardSelected: { backgroundColor: theme.colors.primary },
    dayCardToday: { borderWidth: 2, borderColor: theme.colors.primary },
    dayName: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    dayNum: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    textSelected: { color: '#fff' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.secondary, marginTop: 4 },

    content: { padding: 16 },
    slotContainer: { marginBottom: 24 },
    slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    slotTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
    itemsList: { minHeight: 50 },
    emptyText: { color: '#9ca3af', fontStyle: 'italic', marginLeft: 32 },

    mealCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 8, marginLeft: 0 },
    mealName: { fontSize: 16, fontWeight: '600', color: '#333' },
    pantryTag: { fontSize: 10, color: theme.colors.primary, backgroundColor: '#e0e7ff', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
    ingredients: { fontSize: 11, color: '#666', marginTop: 2 },
    cookBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    uncookedBtn: { backgroundColor: theme.colors.secondary },
    cookedBtn: { backgroundColor: '#10b981' }
});
