import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, SegmentedButtons, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: (diff: number, mode: 'add' | 'reduce' | 'set') => void;
    item: any;
};

export default function QuantityAdjustmentModal({ visible, onDismiss, onConfirm, item }: Props) {
    const [mode, setMode] = useState<'add' | 'reduce' | 'set'>('reduce');
    const [value, setValue] = useState('');

    // Quick chips logic
    const QUICK_AMUNTS = mode === 'set' ? [0, 1, 5, 10] : [1, 5, 10, 50, 100];

    useEffect(() => {
        if (visible) setValue('');
    }, [visible, mode]);

    const currentQty = item?.quantity || 0;
    const numVal = parseInt(value) || 0;

    let newQty = currentQty;
    let diff = 0;

    if (mode === 'add') {
        newQty = currentQty + numVal;
        diff = numVal;
    } else if (mode === 'reduce') {
        newQty = Math.max(0, currentQty - numVal);
        diff = -numVal;
    } else {
        newQty = numVal;
        diff = numVal - currentQty;
    }

    const handleConfirm = () => {
        if (!value && mode !== 'set') return; // allowable to set to 0 if typed
        onConfirm(diff, mode);
        onDismiss();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <Surface style={styles.container} elevation={5}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Adjust Quantity</Text>
                        <TouchableOpacity onPress={onDismiss}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.itemName}>
                        {item?.name} <Text style={{ color: theme.colors.textSecondary }}>({currentQty})</Text>
                    </Text>

                    <SegmentedButtons
                        value={mode}
                        onValueChange={val => setMode(val as any)}
                        buttons={[
                            { value: 'reduce', label: 'Reduce', icon: 'minus' },
                            { value: 'set', label: 'Set To', icon: 'equal' },
                            { value: 'add', label: 'Add', icon: 'plus' },
                        ]}
                        style={styles.segments}
                    />

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="number-pad"
                            value={value}
                            onChangeText={setValue}
                            autoFocus
                        />
                        {mode === 'reduce' && <Text style={styles.inputLabel}>consumed</Text>}
                        {mode === 'add' && <Text style={styles.inputLabel}>bought</Text>}
                        {mode === 'set' && <Text style={styles.inputLabel}>total left</Text>}
                    </View>

                    {/* Quick Chips */}
                    <View style={styles.chipRow}>
                        {QUICK_AMUNTS.map(amt => (
                            <TouchableOpacity key={amt} onPress={() => setValue(String(amt))} style={styles.chip}>
                                <Text style={styles.chipText}>{mode === 'set' ? '' : '+'}{amt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Preview */}
                    <View style={styles.previewBox}>
                        <Text style={styles.previewText}>
                            Result: <Text style={{ fontWeight: '800', color: theme.colors.primary }}>{newQty}</Text>
                        </Text>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleConfirm}
                        style={styles.confirmBtn}
                        contentStyle={{ height: 48 }}
                        labelStyle={{ fontSize: 16, fontWeight: '700' }}
                    >
                        Confirm {mode === 'reduce' ? 'Reduction' : mode === 'add' ? 'Addition' : 'Change'}
                    </Button>

                </Surface>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    itemName: { fontSize: 16, color: theme.colors.text, marginBottom: 20, textAlign: 'center' },
    segments: { marginBottom: 24 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    input: { fontSize: 40, fontWeight: '800', color: theme.colors.text, textAlign: 'center', minWidth: 80, borderBottomWidth: 2, borderBottomColor: '#f1f5f9' },
    inputLabel: { marginLeft: 12, fontSize: 16, color: theme.colors.textSecondary, fontWeight: '600' },
    chipRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
    chip: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    chipText: { fontWeight: '700', color: theme.colors.text },
    previewBox: { alignItems: 'center', marginBottom: 24, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
    previewText: { fontSize: 15, color: theme.colors.textSecondary },
    confirmBtn: { borderRadius: 12, backgroundColor: theme.colors.primary }
});
