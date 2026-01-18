import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Text as RNText } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  title: string;
  subtitle?: string;
  type?: 'add' | 'consume' | 'shopping' | 'info';
  onPress?: () => void;
};

export default function ActivityItem({ title, subtitle, type = 'info', onPress }: Props) {
  const bgMap: Record<string, string> = {
    add: '#dcfce7',
    consume: '#e8f0ff',
    shopping: '#fff4e6',
    info: '#eef2ff',
  };
  const iconMap: Record<string, string> = {
    add: 'plus',
    consume: 'check',
    shopping: 'cart',
    info: 'information',
  };
  const iconColorMap: Record<string, string> = {
    add: '#059669',
    consume: '#2563eb',
    shopping: '#f59e0b',
    info: '#6366f1',
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <View style={[styles.dot, { backgroundColor: bgMap[type] }]}>
        <MaterialCommunityIcons name={iconMap[type] as any} size={18} color={iconColorMap[type]} />
      </View>

      <View style={styles.content}>
        <RNText style={styles.title}>{title}</RNText>
        {subtitle ? <RNText style={styles.subtitle}>{subtitle}</RNText> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f1724' },
  subtitle: { marginTop: 4, color: '#6b7280', fontSize: 13 },
});