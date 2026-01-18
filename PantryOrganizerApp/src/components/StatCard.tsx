import * as React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  colors: [string, string];
  label: string;
  value: string;
  badge?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | string;
  onPress?: () => void;
};

export default function StatCard({ colors, label, value, badge, icon, onPress }: Props) {
  const Content = (
    <LinearGradient colors={colors} start={[0, 0]} end={[1, 1]} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          {icon ? (
            <MaterialCommunityIcons name={icon as any} size={20} color="rgba(255,255,255,0.95)" />
          ) : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrapper}>
        {Content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{Content}</View>;
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 6, minHeight: 110 },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  badgeText: { color: 'white', fontWeight: '700', fontSize: 12 },
  value: { color: 'white', fontSize: 34, fontWeight: '800', marginTop: 6 },
  label: { color: 'rgba(255,255,255,0.95)', marginTop: 4, fontSize: 14 },
});