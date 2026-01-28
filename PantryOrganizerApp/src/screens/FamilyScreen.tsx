import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Clipboard, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { Family } from '../types';
import storage from '../storage/store';

export default function FamilyScreen() {
    const { user } = useAuth();
    const nav = useNavigation();
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadFamily();
    }, [user]);

    const loadFamily = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const familyId = userDoc.data()?.familyId;

            if (familyId) {
                const famDoc = await getDoc(doc(db, 'families', familyId));
                if (famDoc.exists()) {
                    setFamily({ id: famDoc.id, ...famDoc.data() } as Family);
                }
            } else {
                setFamily(null);
            }
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    };

    const createFamily = async () => {
        if (!user) return;
        setCreating(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const familyData = {
                name: `${user.displayName || 'User'}'s Family`,
                ownerId: user.uid,
                members: [user.uid],
                inviteCode: code,
                createdAt: Date.now()
            };

            const docRef = await addDoc(collection(db, 'families'), familyData);

            // Copy existing private items to this new family (Preserve original)
            try {
                await storage.copyToFamily(docRef.id);
            } catch (migrationErr) {
                console.warn("Migration failed", migrationErr);
            }

            // Update user
            await updateDoc(doc(db, 'users', user.uid), { familyId: docRef.id });

            Alert.alert('Success', 'Family created! Share the code to invite others.');
            loadFamily();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setCreating(false);
        }
    };

    const joinFamily = async () => {
        if (!joinCode) return;
        setCreating(true);
        try {
            const familyName = await storage.joinFamily(joinCode);
            Alert.alert('Success', `Joined ${familyName}!`);
            loadFamily();
        } catch (e: any) {
            console.error(e);
            if (e.code === 'permission-denied') {
                Alert.alert('Permission Error', 'You cannot join this family. Ask the owner to check their settings or ensuring you are allowed.');
            } else {
                Alert.alert('Error', e.message);
            }
        } finally {
            setCreating(false);
        }
    };

    const leaveFamily = async () => {
        Alert.alert('Leave Family', 'Are you sure? You will lose access to shared items.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave', style: 'destructive', onPress: async () => {
                    try {
                        await storage.leaveFamily();
                        // Local state update handled by listener in store -> updates user -> reloads
                        Alert.alert('Left Family', 'You are now on your private list.');
                    } catch (e: any) {
                        Alert.alert('Error', e.message);
                    }
                }
            }
        ]);
    };

    const deleteFamily = async () => {
        Alert.alert('Delete Family', 'Are you sure? This will remove the family for everyone. This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await storage.deleteFamily();
                        Alert.alert('Family Deleted', 'You have returned to your private list.');
                    } catch (e: any) {
                        Alert.alert('Error', e.message);
                    }
                }
            }
        ]);
    };

    const copyCode = () => {
        if (family?.inviteCode) {
            Clipboard.setString(family.inviteCode);
            Alert.alert('Copied', 'Invite code copied to clipboard');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Surface style={styles.header} elevation={2}>
                <View style={styles.headerRow}>
                    <Button icon="arrow-left" mode="text" onPress={() => nav.goBack()} textColor={theme.colors.text}>Back</Button>
                    <Text variant="headlineSmall" style={styles.headerTitle}>Family Sharing</Text>
                    <View style={{ width: 60 }} />
                </View>
            </Surface>

            <View style={styles.content}>
                {!family ? (
                    <View style={styles.joinContainer}>
                        <MaterialCommunityIcons name="account-group-outline" size={80} color={theme.colors.primary} />
                        <Text style={styles.joinTitle}>Share Your Pantry</Text>
                        <Text style={styles.joinDesc}>
                            Create a family group to sync your pantry and shopping list instantly with others.
                        </Text>

                        <View style={styles.formSection}>
                            <Button mode="contained" onPress={createFamily} loading={creating} disabled={creating}
                                style={styles.mainBtn} contentStyle={{ height: 48 }}>
                                Create New Family
                            </Button>

                            <View style={styles.orRow}>
                                <Divider style={{ flex: 1 }} />
                                <Text style={{ marginHorizontal: 10, color: '#aaa' }}>OR</Text>
                                <Divider style={{ flex: 1 }} />
                            </View>

                            <TextInput
                                label="Enter Invite Code"
                                mode="outlined"
                                value={joinCode}
                                onChangeText={setJoinCode}
                                autoCapitalize="characters"
                                style={styles.input}
                                right={<TextInput.Icon icon="arrow-right" onPress={joinFamily} disabled={!joinCode || creating} />}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.familyContainer}>
                        <Surface style={styles.codeCard} elevation={2}>
                            <Text style={styles.codeLabel}>INVITE CODE</Text>
                            <TouchableOpacity onPress={copyCode}>
                                <Text style={styles.codeValue}>{family.inviteCode}</Text>
                            </TouchableOpacity>
                            <Text style={styles.codeHint}>Tap to copy & share with family</Text>
                        </Surface>

                        <Text style={styles.membersTitle}>Members ({family.members.length})</Text>
                        <Surface style={styles.membersList} elevation={1}>
                            {family.members.map((uid, index) => (
                                <View key={uid} style={styles.memberRow}>
                                    <Avatar.Text size={40} label="U" style={{ backgroundColor: theme.colors.primary }} />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.memberName}>{uid === user?.uid ? 'You' : 'Family Member'}</Text>
                                        {/* Ideally fetch member names if we had a users collection listener */}
                                    </View>
                                </View>
                            ))}
                        </Surface>

                        <Button mode="outlined" onPress={leaveFamily} style={styles.leaveBtn} textColor={theme.colors.error}>
                            Leave Family
                        </Button>

                        {family.ownerId === user?.uid && (
                            <Button mode="contained" onPress={deleteFamily} style={styles.deleteBtn} buttonColor={theme.colors.error}>
                                Delete Family
                            </Button>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontWeight: '800', color: theme.colors.text },
    content: { flex: 1, padding: 24 },

    joinContainer: { alignItems: 'center', marginTop: 40 },
    joinTitle: { fontSize: 24, fontWeight: '800', marginTop: 20, color: '#333' },
    joinDesc: { textAlign: 'center', color: '#666', marginTop: 10, marginBottom: 40, lineHeight: 22 },
    formSection: { width: '100%' },
    input: { backgroundColor: '#fff' },
    mainBtn: { borderRadius: 8, marginBottom: 20 },
    orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },

    familyContainer: { marginTop: 10 },
    codeCard: { backgroundColor: theme.colors.primary, padding: 30, borderRadius: 20, alignItems: 'center', marginBottom: 30 },
    codeLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
    codeValue: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 4 },
    codeHint: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 10 },

    membersTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
    membersList: { backgroundColor: '#fff', borderRadius: 12, padding: 8 },
    memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    memberName: { fontWeight: '600', color: '#333' },

    leaveBtn: { marginTop: 40, borderColor: theme.colors.error },
    deleteBtn: { marginTop: 12 }
});
