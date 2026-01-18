import * as React from 'react';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import storage from '../storage/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput as PaperTextInput } from 'react-native-paper';

export default function AddItem() {
  const nav = useNavigation<any>();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [location, setLocation] = useState('');
  const [labelsText, setLabelsText] = useState(''); // comma separated input
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState<Date | null>(null);

  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonLocations = ['Pantry', 'Fridge', 'Freezer', 'Bathroom'];
  const commonLabels = ['Dairy', 'Grains', 'Snacks', 'Produce', 'Beverages'];

  function toggleLabelChip(label: string) {
    const arr = labelsText.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.includes(label)) {
      setLabelsText(arr.filter(a => a !== label).join(', '));
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
      .map(s => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await storage.add({
        name: name.trim(),
        quantity: qty,
        location: location.trim() || undefined,
        labels,
        description: description.trim() || undefined,
        expires: expiry ? expiry.toISOString() : undefined,
        createdAt: Date.now(),
      });
      nav.goBack();
    } catch (e) {
      setError('Failed to save item.');
      console.warn('AddItem.save error', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Add item</Text>

        {/* Item name — use TextInput.Icon with a render function */}
        <PaperTextInput
          label="Item name"
          placeholder="e.g. Cheddar Cheese"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<PaperTextInput.Icon icon={() => <MaterialCommunityIcons name="food-apple" size={20} color="#6b7280" />} />}
        />

        <HelperText type="error" visible={!!error && !name.trim()}>
          {(!name.trim() && error) ? error : ''}
        </HelperText>

        <View style={styles.row}>
          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            mode="outlined"
            style={[styles.inputHalf, { marginRight: 8 }]}
            keyboardType="numeric"
          />
          <PaperTextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.inputHalf}
            right={
              location
                ? undefined
                : <PaperTextInput.Icon icon={() => <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />} />
            }
          />
        </View>

        <View style={styles.suggestRow}>
          {commonLocations.map(loc => (
            <Chip
              key={loc}
              compact
              onPress={() => setLocation(loc)}
              style={[styles.suggestChip, location === loc && styles.suggestChipActive]}
            >
              {loc}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Labels (comma separated)"
          placeholder="e.g. Dairy, Breakfast"
          value={labelsText}
          onChangeText={setLabelsText}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.suggestRow}>
          {commonLabels.map(l => (
            <Chip
              key={l}
              compact
              onPress={() => toggleLabelChip(l)}
              style={[styles.suggestChip, labelsText.split(',').map(s => s.trim()).includes(l) && styles.suggestChipActive]}
            >
              {l}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Description (optional)"
          placeholder="Notes — bought at store, brand, pack size..."
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <TouchableOpacity onPress={() => setShowDate(true)} activeOpacity={0.8} style={styles.dateRow}>
          <View>
            <Text style={{ color: '#6b7280', fontWeight: '700' }}>Expiry date</Text>
            <Text style={{ marginTop: 6, color: expiry ? '#111827' : '#9ca3af' }}>
              {expiry ? expiry.toLocaleDateString() : 'Select a date'}
            </Text>
          </View>
          <Button mode="outlined" onPress={() => setShowDate(true)}>Choose</Button>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={showDate}
          mode="date"
          onConfirm={(d: Date) => { setShowDate(false); setExpiry(d); }}
          onCancel={() => setShowDate(false)}
          minimumDate={new Date(2000, 0, 1)}
          maximumDate={new Date(2100, 11, 31)}
        />

        <View style={styles.actions}>
          <Button mode="contained" onPress={onSave} loading={saving} style={styles.saveBtn}>
            Save
          </Button>
          <Button mode="outlined" onPress={() => nav.goBack()} style={styles.cancelBtn}>
            Cancel
          </Button>
        </View>

        {error ? <HelperText type="error" visible>{error}</HelperText> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, paddingBottom: 48 },
  title: { marginBottom: 12, fontWeight: '800' },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  inputHalf: { flex: 1 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  suggestChip: { marginRight: 8, marginBottom: 8, backgroundColor: '#f3f4f6' },
  suggestChipActive: { backgroundColor: '#2f6bf6', color: '#fff' },
  dateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e6e6e9', marginBottom: 16,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { flex: 1, marginRight: 8 },
  cancelBtn: { flex: 1 },
});