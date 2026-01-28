import * as React from 'react';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import storage from '../storage/store';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function AddItem() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const editItem = route.params?.item;

  const [name, setName] = useState(editItem?.name || '');
  const [quantity, setQuantity] = useState<string>(editItem?.quantity ? String(editItem?.quantity) : '1');
  const [location, setLocation] = useState(editItem?.location || '');

  // Handle labels: they might be an array or string in the store
  const initialLabels = Array.isArray(editItem?.labels)
    ? editItem.labels.join(', ')
    : (editItem?.labels || '');
  const [labelsText, setLabelsText] = useState(initialLabels);

  const [description, setDescription] = useState(editItem?.description || '');
  const [expiry, setExpiry] = useState<Date | null>(editItem?.expires ? new Date(editItem.expires) : null);

  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonLocations = ['Pantry', 'Fridge', 'Freezer', 'Snack Bar'];
  const commonLabels = ['Dairy', 'Grains', 'Produce', 'Meat', 'Beverages'];

  function toggleLabelChip(label: string) {
    const arr = labelsText.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (arr.includes(label)) {
      setLabelsText(arr.filter((a: string) => a !== label).join(', '));
    } else {
      arr.push(label);
      setLabelsText(arr.join(', '));
    }
  }

  async function onSave() {
    setError(null);
    if (!name.trim()) {
      setError('Please enter an item name.');
      return;
    }

    const qty = parseFloat(quantity) || 1;
    const labels = labelsText
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        quantity: qty,
        location: location.trim() || null,
        labels,
        description: description.trim() || null,
        expires: expiry ? expiry.toISOString() : null,
      };

      if (editItem) {
        await storage.update({
          id: editItem.id,
          ...payload,
        });
      } else {
        await storage.add({
          ...payload,
          createdAt: Date.now(),
        });
      }
      nav.goBack();
    } catch (e) {
      setError('Failed to save item.');
      console.warn('AddItem.save error', e);
    } finally {
      setSaving(false);
    }
  }

  // Determine if a chip is selected
  const isLabelSelected = (l: string) => labelsText.split(',').map((s: string) => s.trim()).includes(l);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.text}
          onPress={() => nav.goBack()}
          style={{ marginLeft: -8 }}
        />
        <Text style={styles.headerTitle}>{editItem ? 'Edit Item' : 'Add New Item'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Name Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionLabel}>What are we stocking?</Text>
          <TextInput
            placeholder="Item name (e.g. Avocado)"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.mainInput}
            outlineStyle={{ borderRadius: theme.borderRadius.m, borderColor: theme.colors.border }}
            textColor={theme.colors.text}
            placeholderTextColor={theme.colors.textSecondary}
            left={<TextInput.Icon icon="food-apple-outline" color={theme.colors.primary} />}
          />
          <HelperText type="error" visible={!!error && !name.trim()}>
            {(!name.trim() && error) ? error : ''}
          </HelperText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.row}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.sectionLabel}>Quantity</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input} // standard height
              outlineStyle={{ borderRadius: theme.borderRadius.m, borderColor: theme.colors.border }}
              textColor={theme.colors.text}
              left={<TextInput.Icon icon="counter" color={theme.colors.textSecondary} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>Category</Text>
            <TouchableOpacity onPress={() => setShowDate(true)} activeOpacity={0.8}>
              <View style={[styles.dateInput, expiry && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' }]}>
                <MaterialCommunityIcons
                  name={expiry ? "calendar-check" : "calendar-blank-outline"}
                  size={20}
                  color={expiry ? theme.colors.primary : theme.colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.dateText, expiry && { color: theme.colors.primary, fontWeight: '600' }]}>
                  {expiry ? expiry.toLocaleDateString() : 'Expiry Date'}
                </Text>
                {expiry && (
                  <TouchableOpacity onPress={() => setExpiry(null)} hitSlop={10}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Location Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Where is it stored?</Text>
          <View style={styles.chipRow}>
            {commonLocations.map(loc => {
              const isActive = location === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setLocation(isActive ? '' : loc)}
                  style={[
                    styles.chip,
                    isActive && styles.chipActive
                  ]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              );
            })}
            <TextInput
              placeholder="Or type a custom location..."
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={[styles.input, { flex: 1, minWidth: 150 }]}
              outlineStyle={{ borderRadius: theme.borderRadius.m, borderColor: theme.colors.border }}
              dense
            />
          </View>

        </Animated.View>

        {/* Labels Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Tags & Labels</Text>
          <View style={styles.chipRow}>
            {commonLabels.map(l => {
              const active = isLabelSelected(l);
              return (
                <TouchableOpacity
                  key={l}
                  onPress={() => toggleLabelChip(l)}
                  style={[styles.chip, active && styles.chipActive, { borderColor: active ? theme.colors.secondary : theme.colors.border, backgroundColor: active ? theme.colors.secondary : theme.colors.surface }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            placeholder="Add custom tags (comma separated)"
            value={labelsText}
            onChangeText={setLabelsText}
            mode="outlined"
            style={[styles.input, { marginTop: 8 }]}
            outlineStyle={{ borderRadius: theme.borderRadius.m, borderColor: theme.colors.border }}
            dense
          />
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            placeholder="Any extra details..."
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, { height: 80 }]}
            outlineStyle={{ borderRadius: theme.borderRadius.m, borderColor: theme.colors.border }}
            textColor={theme.colors.text}
          />
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action / Bottom Bar */}
      <Animated.View
        entering={FadeIn.delay(600)}
        style={styles.bottomBar}
      >
        <Button
          mode="text"
          onPress={() => nav.goBack()}
          style={{ flex: 1, marginRight: 16 }}
          labelStyle={{ color: theme.colors.textSecondary, fontWeight: '600' }}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          loading={saving}
          style={styles.saveBtn}
          contentStyle={{ height: 50 }}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
          icon="check"
        >
          Save Item
        </Button>
      </Animated.View>

      <DateTimePickerModal
        isVisible={showDate}
        mode="date"
        onConfirm={(d: Date) => { setShowDate(false); setExpiry(d); }}
        onCancel={() => setShowDate(false)}
        minimumDate={new Date()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  mainInput: {
    backgroundColor: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.surface,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    marginTop: 6, // align visually with text input
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    ...theme.shadows.float,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveBtn: {
    flex: 2,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.primary,
  },
});