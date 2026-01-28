import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Switch, Divider, Surface, Button } from 'react-native-paper';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export default function SettingsScreen() {
    const nav = useNavigation();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [useHaptics, setUseHaptics] = React.useState(true);
    const [sortByExpiry, setSortByExpiry] = React.useState(true);
    const [alertDays, setAlertDays] = React.useState(7); // Default 7 days

    // Load settings (simulated for now, would use AsyncStorage in real app)
    React.useEffect(() => {
        // localized storage load logic here
    }, []);

    const toggleNotifications = async () => {
        if (!notificationsEnabled) {
            // Turning ON
            const granted = await registerForPushNotificationsAsync();
            if (granted) {
                setNotificationsEnabled(true);
            } else {
                Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
                setNotificationsEnabled(false);
            }
        } else {
            // Turning OFF
            setNotificationsEnabled(false);
        }
    };

    const toggleHaptics = () => setUseHaptics(!useHaptics);
    const toggleSort = () => setSortByExpiry(!sortByExpiry);

    return (
        <View style={styles.container}>
            {/* Header */}
            <Surface style={styles.header} elevation={2}>
                <Text variant="headlineSmall" style={styles.headerTitle}>Settings</Text>
            </Surface>

            <ScrollView contentContainerStyle={styles.content}>

                <List.Section>
                    <List.Subheader style={styles.subheader}>Pantry Alerts</List.Subheader>
                    <Surface style={styles.sectionSurface} elevation={1}>
                        <List.Item
                            title="Expiring Soon Alerts"
                            description="Get notified before items expire"
                            left={props => <List.Icon {...props} icon="bell-ring-outline" color={theme.colors.primary} />}
                            right={() => <Switch value={notificationsEnabled} onValueChange={toggleNotifications} color={theme.colors.primary} />}
                        />
                        <Divider />
                        <List.Item
                            title="Alert Timing"
                            description={`Notify ${alertDays} days before expiry`}
                            left={props => <List.Icon {...props} icon="clock-outline" color={theme.colors.primary} />}
                            onPress={() => {
                                Alert.alert('Alert Timing', 'Change days before expiry', [
                                    { text: '3 Days', onPress: () => setAlertDays(3) },
                                    { text: '7 Days', onPress: () => setAlertDays(7) },
                                    { text: '14 Days', onPress: () => setAlertDays(14) },
                                    { text: 'Cancel', style: 'cancel' }
                                ])
                            }}
                        />
                    </Surface>
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.subheader}>Preferences</List.Subheader>
                    <Surface style={styles.sectionSurface} elevation={1}>
                        <List.Item
                            title="Sort by Expiry"
                            description="Show expiring items first by default"
                            left={props => <List.Icon {...props} icon="sort-clock-ascending-outline" color={theme.colors.primary} />}
                            right={() => <Switch value={sortByExpiry} onValueChange={toggleSort} color={theme.colors.primary} />}
                        />
                        <Divider />
                        <List.Item
                            title="Haptic Feedback"
                            description="Vibrate on interactions"
                            left={props => <List.Icon {...props} icon="vibrate" color={theme.colors.primary} />}
                            right={() => <Switch value={useHaptics} onValueChange={toggleHaptics} color={theme.colors.primary} />}
                        />
                    </Surface>
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.subheader}>App Info</List.Subheader>
                    <Surface style={styles.sectionSurface} elevation={1}>
                        <List.Item
                            title="Version"
                            description="1.0.0 (Beta)"
                            left={props => <List.Icon {...props} icon="information-outline" color={theme.colors.textSecondary} />}
                        />
                        <Divider />
                        <List.Item
                            title="Suggest a Feature"
                            description="Help us improve the app"
                            left={props => <List.Icon {...props} icon="lightbulb-on-outline" color="#f59e0b" />}
                            onPress={() => Alert.alert('Coming Soon', 'Feature suggestion form will be available soon!')}
                        />
                        <Divider />
                        <List.Item
                            title="Log Out"
                            titleStyle={{ color: theme.colors.error, fontWeight: '700' }}
                            left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
                            onPress={() => Alert.alert('Log Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive' }])}
                        />
                    </Surface>
                </List.Section>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Button mode="contained" onPress={() => nav.goBack()} style={styles.backBtn} buttonColor={theme.colors.primary}>
                Done
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24
    },
    headerTitle: { fontWeight: '800', color: theme.colors.text },
    content: { padding: 16 },
    subheader: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 8, marginTop: 8 },
    sectionSurface: { backgroundColor: '#fff', borderRadius: 16 },
    backBtn: { margin: 20, borderRadius: 12, paddingVertical: 6 }
});
