import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Surface, Button, List, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import { theme } from '../theme';

export default function SupportScreen() {
    const nav = useNavigation();

    const handleEmailSupport = async (subject: string) => {
        const isAvailable = await MailComposer.isAvailableAsync();

        if (isAvailable) {
            await MailComposer.composeAsync({
                recipients: ['support@pantryapp.com'],
                subject: subject,
                body: `\n\n\n---\nApp Version: 1.0.0\nOS: ${Platform.OS}`, // Simple boilerplate
            });
        } else {
            // Fallback for Simulator or devices without mail setup
            Linking.openURL(`mailto:support@pantryapp.com?subject=${subject}`);
        }
    };

    return (
        <View style={styles.container}>
            <Surface style={styles.header} elevation={2}>
                <View style={styles.headerRow}>
                    <Button icon="arrow-left" mode="text" onPress={() => nav.goBack()} textColor={theme.colors.text}>
                        Back
                    </Button>
                    <Text variant="headlineSmall" style={styles.headerTitle}>Help & Support</Text>
                    <View style={{ width: 60 }} />
                </View>
            </Surface>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.heroSection}>
                    <MaterialCommunityIcons name="lifebuoy" size={64} color={theme.colors.primary} />
                    <Text style={styles.heroTitle}>How can we help?</Text>
                    <Text style={styles.heroSub}>
                        We're here to help you get the most out of your pantry.
                    </Text>
                </View>

                <List.Section>
                    <List.Subheader style={styles.subheader}>Contact Us</List.Subheader>
                    <Surface style={styles.card} elevation={1}>
                        <List.Item
                            title="Email Support"
                            description="Get help with your account or app issues"
                            left={props => <List.Icon {...props} icon="email-outline" color={theme.colors.primary} />}
                            onPress={() => handleEmailSupport('Pantry App Support Request')}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                        />
                        <Divider />
                        <List.Item
                            title="Report a Bug"
                            description="found something broken? Let us know!"
                            left={props => <List.Icon {...props} icon="bug-outline" color={theme.colors.error} />}
                            onPress={() => handleEmailSupport('Bug Report: [Short Description]')}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                        />
                        <Divider />
                        <List.Item
                            title="Feature Request"
                            description="Have an idea for the app?"
                            left={props => <List.Icon {...props} icon="lightbulb-on-outline" color="#f59e0b" />}
                            onPress={() => handleEmailSupport('Feature Request')}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                        />
                    </Surface>
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.subheader}>Common Questions</List.Subheader>
                    <Surface style={styles.card} elevation={1}>
                        <List.Accordion title="How do I add items?" left={props => <List.Icon {...props} icon="help-circle-outline" />}>
                            <List.Item title="Tap the '+' button in the Pantry tab." titleNumberOfLines={2} />
                        </List.Accordion>
                        <Divider />
                        <List.Accordion title="How do I share my list?" left={props => <List.Icon {...props} icon="help-circle-outline" />}>
                            <List.Item title="Export your data via the Profile screen." titleNumberOfLines={2} />
                        </List.Accordion>
                        <Divider />
                        <List.Accordion title="Is my data backed up?" left={props => <List.Icon {...props} icon="cloud-check-outline" />}>
                            <List.Item title="Yes, all data is synced to the cloud securely." titleNumberOfLines={2} />
                        </List.Accordion>
                    </Surface>
                </List.Section>

            </ScrollView>
        </View>
    );
}

import { Platform } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontWeight: '800', color: theme.colors.text },
    content: { padding: 16 },
    heroSection: { alignItems: 'center', marginVertical: 20 },
    heroTitle: { fontSize: 24, fontWeight: '800', marginTop: 16, color: theme.colors.text },
    heroSub: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
    subheader: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 8, marginTop: 8 },
    card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' }, // overflow hidden ok here as internal items have no shadows usually
});
