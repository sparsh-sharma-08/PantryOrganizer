import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, Surface, Button, Portal, Modal, TextInput, ProgressBar } from 'react-native-paper';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '../storage/store';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const CHART_CONFIG = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(91, 108, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false
};

export default function StatsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [budget, setBudget] = useState(0);
  const [editingBudget, setEditingBudget] = useState('0');
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const nav = useNavigation<any>();

  const loadData = async () => {
    const all = await storage.getAll();
    setItems(all || []);
    const b = await storage.getBudget();
    setBudget(b || 0);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const sub = storage.subscribe(loadData);
    return () => { sub.remove(); };
  }, []);

  const saveBudget = async () => {
    const val = parseFloat(editingBudget) || 0;
    await storage.setBudget(val);
    setBudget(val);
    setBudgetModalVisible(false);
  };

  const openBudgetModal = () => {
    setEditingBudget(String(budget));
    setBudgetModalVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Metrics
  const inPantry = items.filter(i => !i.onShoppingList && !i.purchased && !i.consumedAt).length;
  const shoppingListCount = items.filter(i => i.onShoppingList && !i.purchased).length;
  const consumedLast7Days = items.filter(i => i.consumedAt && (Date.now() - i.consumedAt < 7 * 24 * 60 * 60 * 1000)).length;

  const expiringSoonCount = items.filter(i => {
    if (!i.expires || i.consumedAt || i.onShoppingList) return false;
    const diff = new Date(i.expires).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 7 && days > 0;
  }).length;

  const expiredCount = items.filter(i => {
    if (!i.expires || i.consumedAt || i.onShoppingList) return false;
    return new Date(i.expires).getTime() < Date.now();
  }).length;

  // Category Data for Pie Chart
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => {
      // Only count actual pantry items
      if (i.onShoppingList || i.consumedAt) return;
      const cat = i.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
    ];

    const data = Object.keys(counts).map((cat, index) => ({
      name: cat,
      population: counts[cat],
      color: colors[index % colors.length],
      legendFontColor: "#7f7f7f",
      legendFontSize: 12
    })).sort((a, b) => b.population - a.population);

    if (data.length === 0) {
      // Fallback for empty
      return [{ name: 'Empty', population: 1, color: '#e5e7eb', legendFontColor: '#7f7f7f', legendFontSize: 12 }];
    }
    return data;
  }, [items]);

  // Consumption History (Last 6 months)
  const consumptionData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const labels = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);

      // Count items consumed in this month
      const count = items.filter(item => {
        if (!item.consumedAt) return false;
        const cDate = new Date(item.consumedAt);
        return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear();
      }).length;
      data.push(count);
    }

    return {
      labels,
      datasets: [{ data }]
    };
  }, [items]);

  // Financial Metrics
  const pantryValue = useMemo(() => {
    return items.reduce((sum, i) => {
      // Logic: Only sum up items IN PANTRY (not shopping list, not consumed)
      if (i.onShoppingList || i.consumedAt) return sum;
      return sum + (i.price || 0);
    }, 0);
  }, [items]);

  const monthlySpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return items.reduce((sum, i) => {
      // Check if purchased this month
      // Use purchasedAt if available, else updateAt if purchased=true
      if (!i.purchased) return sum;

      const dateVal = i.purchasedAt || i.updatedAt;
      if (!dateVal) return sum;

      const d = new Date(dateVal);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return sum + (i.price || 0);
      }
      return sum;
    }, 0);
  }, [items]);

  // Spending History (Last 6 months)
  const spendingHistory = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const labels = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);

      const total = items.reduce((sum, item) => {
        if (!item.purchased) return sum;
        const dateVal = item.purchasedAt || item.updatedAt;
        if (!dateVal) return sum;
        const iDate = new Date(dateVal);

        if (iDate.getMonth() === d.getMonth() && iDate.getFullYear() === d.getFullYear()) {
          return sum + (item.price || 0);
        }
        return sum;
      }, 0);

      data.push(total);
    }

    return {
      labels,
      datasets: [{ data }]
    };
  }, [items]);

  // Top Consumed Items (This Month)
  const topConsumed = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const counts: Record<string, number> = {};

    items.forEach(i => {
      // Check if consumed
      if (!i.consumedAt) return;
      const d = new Date(i.consumedAt);
      // Filter for this month
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const name = i.name.trim(); // Case sensitive? Maybe standardize
        counts[name] = (counts[name] || 0) + 1;
      }
    });

    return Object.keys(counts)
      .map(name => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [items]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, '#818cf8']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Overview of your pantry habits</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Quick Stats Grid */}
        <View style={styles.grid}>
          <Surface style={styles.statCard} elevation={2}>
            <MaterialCommunityIcons name="food-variant" size={28} color={theme.colors.primary} />
            <Text style={styles.statValue}>{inPantry}</Text>
            <Text style={styles.statLabel}>In Pantry</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={2}>
            <MaterialCommunityIcons name="cart-outline" size={28} color="#f59e0b" />
            <Text style={styles.statValue}>{shoppingListCount}</Text>
            <Text style={styles.statLabel}>Shopping</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={2}>
            <MaterialCommunityIcons name="check-circle-outline" size={28} color="#10b981" />
            <Text style={styles.statValue}>{consumedLast7Days}</Text>
            <Text style={styles.statLabel}>Consumed (7d)</Text>
          </Surface>
        </View>

        {/* Finance Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionHeader}>Finance & Budget</Text>
            <Button mode="text" compact onPress={openBudgetModal}>Set Budget</Button>
          </View>

          {/* Budget Progress */}
          <Surface style={styles.financeCard} elevation={1}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.financeTitle}>Monthly Budget</Text>
              <Text style={styles.financeValue}>₹{monthlySpending} / ₹{budget}</Text>
            </View>
            <ProgressBar progress={budget > 0 ? Math.min(monthlySpending / budget, 1) : 0} color={monthlySpending > budget ? theme.colors.error : theme.colors.primary} style={{ height: 10, borderRadius: 5 }} />
            <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              {budget > 0 ? `${Math.round((monthlySpending / budget) * 100)}% used` : 'No budget set'}
            </Text>
          </Surface>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Surface style={[styles.financeSmallCard, { marginRight: 12 }]} elevation={1}>
              <Text style={styles.financeLabel}>Pantry Value</Text>
              <Text style={styles.financeBigValue}>₹{pantryValue}</Text>
            </Surface>
            <Surface style={styles.financeSmallCard} elevation={1}>
              <Text style={styles.financeLabel}>Spent (Month)</Text>
              <Text style={styles.financeBigValue}>₹{monthlySpending}</Text>
            </Surface>
          </View>
        </View>

        {/* Feeding the stored consumption logic back in if wanted, but prioritizing Finance logic in display order */}

        {/* Alerts Section */}
        {(expiringSoonCount > 0 || expiredCount > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Alerts</Text>
            {expiredCount > 0 && (
              <Card style={[styles.alertCard, { borderColor: '#fee2e2', backgroundColor: '#fef2f2' }]}>
                <Card.Content style={styles.alertRow}>
                  <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>{expiredCount} Expired Items</Text>
                    <Text style={styles.alertDesc}>Remove them to keep pantry fresh.</Text>
                  </View>
                </Card.Content>
              </Card>
            )}
            {expiringSoonCount > 0 && (
              <Card style={[styles.alertCard, { marginTop: 8, borderColor: '#ffedd5', backgroundColor: '#fff7ed' }]}>
                <Card.Content style={styles.alertRow}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#f97316" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>{expiringSoonCount} Items Expiring Soon</Text>
                    <Text style={styles.alertDesc}>Plan to use these within 7 days.</Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {/* Spending Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Spending Trend</Text>
          <Surface style={styles.chartCard} elevation={1}>
            <BarChart
              data={spendingHistory}
              width={width - 56}
              height={220}
              yAxisLabel="₹"
              yAxisSuffix=""
              chartConfig={{
                ...CHART_CONFIG,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Emerald Green
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.7,
              }}
              verticalLabelRotation={0}
              showValuesOnTopOfBars
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </Surface>
        </View>

        {/* Consumption Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Consumption Trend</Text>
          <Surface style={styles.chartCard} elevation={1}>
            {consumptionData.datasets[0].data.some(x => x > 0) ? (
              <LineChart
                data={consumptionData}
                width={width - 56}
                height={220}
                chartConfig={{
                  ...CHART_CONFIG,
                  decimalPlaces: 0,
                  propsForDots: { r: "5", strokeWidth: "2", stroke: theme.colors.primary }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            ) : (
              <View style={styles.emptyChart}>
                <MaterialCommunityIcons name="chart-line-variant" size={48} color="#e5e7eb" />
                <Text style={styles.emptyText}>No consumption data yet.</Text>
              </View>
            )}
          </Surface>
        </View>

        {/* Inventory Breakdown Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Pantry Composition</Text>
          <Surface style={styles.chartCard} elevation={1}>
            <PieChart
              data={categoryData}
              width={width - 40}
              height={220}
              chartConfig={CHART_CONFIG}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[0, 0]}
              absolute={false}
            />
          </Surface>
        </View>

        {/* Top Consumed Section */}
        {topConsumed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Top Consumed (This Month)</Text>
            {topConsumed.map((t, index) => (
              <Surface key={t.name} style={styles.rankRow} elevation={1}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#f59e0b' : '#e5e7eb' }]}>
                    <Text style={[styles.rankText, index === 0 && { color: '#fff' }]}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.rankName}>{t.name}</Text>
                </View>
                <Text style={styles.rankCount}>{t.count} times</Text>
              </Surface>
            ))}
          </View>
        )
        }
      </ScrollView >

      {/* Budget Modal */}
      <Portal>
        <Modal visible={budgetModalVisible} onDismiss={() => setBudgetModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Set Monthly Budget (₹)</Text>
          <TextInput
            label="Budget Amount"
            value={editingBudget}
            onChangeText={setEditingBudget}
            keyboardType="numeric"
            mode="outlined"
            style={{ marginBottom: 16, backgroundColor: '#fff' }}
            left={<TextInput.Affix text="₹" />}
          />
          <Button mode="contained" onPress={saveBudget} buttonColor={theme.colors.primary}>
            Save Budget
          </Button>
        </Modal>
      </Portal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerGradient: { padding: 20, paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, marginTop: -20 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', width: (width - 48) / 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 8, alignItems: 'center' },

  alertCard: { borderWidth: 1, borderRadius: 12, elevation: 0 },
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  alertTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  alertDesc: { fontSize: 13, color: '#6b7280' },

  emptyChart: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9ca3af', marginTop: 12 },

  rankRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8
  },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontWeight: '700', fontSize: 12, color: '#6b7280' },
  rankName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  rankCount: { fontWeight: '700', color: theme.colors.primary },

  financeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 0 },
  financeTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  financeValue: { fontSize: 16, fontWeight: '700', color: '#111827' },

  financeSmallCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  financeLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  financeBigValue: { fontSize: 22, fontWeight: '800', color: '#111827' },

  modalContainer: { backgroundColor: '#fff', padding: 24, margin: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
});