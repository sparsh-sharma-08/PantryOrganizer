import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, Dimensions, StatusBar, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, Button, IconButton, Surface, Chip, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

import storage from '../storage/store';
import { theme } from '../theme';
import { AdjustmentHistory } from '../types';
import QuantityAdjustmentModal from '../components/QuantityAdjustmentModal';

const { width } = Dimensions.get('window');

export default function ItemDetail() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const [item, setItem] = useState<any>(null);
  const [history, setHistory] = useState<AdjustmentHistory[]>([]);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [manualQty, setManualQty] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const all = await storage.getAll();
      const found = all.find((i: any) => i.id === id);
      if (mounted) setItem(found || null);
    };
    load();
    const sub = storage.subscribe(() => load());
    return () => { mounted = false; sub.remove(); };
  }, [id]);

  const details = useMemo(() => {
    if (!item) return null;

    // Labels logic
    const labels = Array.isArray(item.labels)
      ? item.labels
      : (item.labels ? String(item.labels).split(',').map((t: string) => t.trim()) : []);

    // Expiry logic
    let daysLeft = null;
    let statusColor = theme.colors.success;
    let statusText = 'Fresh';
    let urgency = 0; // 0 = fresh, 1 = warning, 2 = critical

    if (item.expires) {
      const diff = new Date(item.expires).getTime() - Date.now();
      daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        statusColor = theme.colors.error;
        statusText = 'Expired';
        urgency = 2;
      } else if (daysLeft <= 3) {
        statusColor = theme.colors.error;
        statusText = 'Expiring Soon';
        urgency = 2;
      } else if (daysLeft <= 7) {
        statusColor = theme.colors.warning;
        statusText = 'Use Soon';
        urgency = 1;
      }
    }

    return { labels, daysLeft, statusColor, statusText, urgency };
  }, [item]);

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: theme.colors.textSecondary }}>Item not found...</Text>
        <Button mode="text" onPress={() => nav.goBack()}>Go Back</Button>
      </View>
    );
  }

  const { labels, daysLeft, statusColor, statusText, urgency } = details!;

  const onConsume = () => {
    Alert.alert('Consume Item', `Mark ${item.name} as consumed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Yum!',
        onPress: async () => {
          // Mark as consumed, do not remove immediately so it shows in history
          await storage.update({ id: item.id, consumedAt: Date.now() });
          nav.goBack();
        }
      }
    ]);
  };

  const onToggleShop = async () => {
    await storage.update({ ...item, onShoppingList: !item.onShoppingList });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Immersive Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[theme.colors.primaryDark, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        />

        <View style={styles.headerToolbar}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={() => nav.goBack()}
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          />
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon="pencil-outline"
              iconColor="#fff"
              size={24}
              onPress={() => nav.navigate('AddItem', { item })}
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            />
          </View>
        </View>

        <Animated.View entering={ZoomIn.duration(500)} style={styles.iconCircle}>
          <MaterialCommunityIcons name="food-apple-outline" size={60} color={theme.colors.primaryDark} />
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Title & Main Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.titleSection}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusText}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.colors.secondary + '20', marginLeft: 8 }]}>
              <Text style={[styles.badgeText, { color: theme.colors.secondary }]}>{item.location || 'Pantry'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Highlight Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.statsGrid}>
          <Surface style={styles.statBox} elevation={1}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color={theme.colors.primary} />
            <Text style={styles.statLabel}>Quantity</Text>
            <Text style={styles.statValue}>{item.quantity || 1}</Text>
          </Surface>

          <Surface style={styles.statBox} elevation={1}>
            <MaterialCommunityIcons
              name={urgency === 2 ? "calendar-alert" : "calendar-clock"}
              size={24}
              color={statusColor}
            />
            <Text style={styles.statLabel}>Days Left</Text>
            <Text style={[styles.statValue, { color: statusColor }]}>
              {daysLeft !== null ? (daysLeft < 0 ? 'Overdue' : `${daysLeft}d`) : '—'}
            </Text>
          </Surface>

          <Surface style={styles.statBox} elevation={1}>
            <MaterialCommunityIcons name="basket-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>{item.onShoppingList ? 'On List' : 'Stocked'}</Text>
          </Surface>
        </Animated.View>

        {/* Expiry Details Card */}
        {item.expires && item.expires !== 'undefined' && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>Expiration Date</Text>
                <Text style={styles.infoValue}>{new Date(item.expires).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </View>
              <MaterialCommunityIcons name="calendar-check" size={28} color={theme.colors.textSecondary} style={{ opacity: 0.5 }} />
            </View>
            {/* Visual Progress Bar for freshness could go here */}
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                {
                  backgroundColor: statusColor,
                  width: daysLeft !== null ? `${Math.max(0, Math.min(100, (daysLeft / 14) * 100))}%` : '100%'
                }
              ]} />
            </View>
            <Text style={styles.helperText}>
              {daysLeft !== null && daysLeft <= 3
                ? 'Recommended to consume immediately.'
                : 'Item is still fresh and good to use.'}
            </Text>
          </Animated.View>
        )}

        {/* Description / Notes */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.infoCard}>
          <Text style={styles.cardTitle}>Notes & Details</Text>
          <Text style={styles.bodyText}>
            {item.description || 'No additional notes provided for this item. Add some details to keep track of brands or recipes.'}
          </Text>
        </Animated.View>

        {/* Labels / Tags */}
        {labels.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.infoCard}>
            <Text style={styles.cardTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {labels.map((l: string, i: number) => (
                <Chip key={i} style={styles.tagChip} textStyle={{ fontSize: 12 }}>{l}</Chip>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      <Animated.View entering={FadeIn.delay(700)} style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={onToggleShop}
        >
          <MaterialCommunityIcons
            name={item.onShoppingList ? "cart-off" : "cart-plus"}
            size={22}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            {item.onShoppingList ? 'Remove' : 'To Shop'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={onConsume}
        >
          <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#fff" />
          <Text style={[styles.actionText, { color: '#fff' }]}>Consume</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
    marginBottom: 40,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    height: 180, // Gradient takes up top part
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerToolbar: {
    marginTop: 50,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCircle: {
    position: 'absolute',
    bottom: 0,
    left: width / 2 - 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.float,
    borderWidth: 4,
    borderColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  itemName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    ...theme.shadows.card,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: theme.colors.text,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 8,
  },
  actionBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: theme.colors.surface,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    ...theme.shadows.float,
  },
  actionBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    flexDirection: 'row',
  },
  actionBtnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});