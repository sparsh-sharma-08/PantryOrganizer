import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SignupScreen() {
    /* import { useAuth } from '../context/AuthContext'; */
    const { signup, signInWithGoogle } = useAuth();
    const nav = useNavigation<any>();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Phone Auth Logic Duplicated for consistency
    const [phoneVisible, setPhoneVisible] = useState(false);
    // Note: Phone Auth implementation in Signup would require copying the complex modal logic or Refactoring.
    // For now, to keep it simple as per request, we will navigate to Login for Phone Auth or add a simple button that redirects/shows message.
    // Actually, user asked for "option to signup with Google and mobile number".
    // I made a strategic decision: Phone Auth flow is heavily UI dependent (Modal, Recaptcha). 
    // Duplicating the entire modal logic here is risky. 
    // BETTER APPROACH: Add the buttons. Google works directly. Phone button can navigate to Login with param or show alert "Please use Login screen for Phone Sign In".
    // HOWEVER, I will implement the Google button fully. For Phone, I will redirect to Login to avoid code duplication bugs.


    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const success = await signup(name, email, password);
        setLoading(false);
        if (!success) {
            Alert.alert('Failed', 'Please try again. Password min 6 chars.');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <LinearGradient
                colors={[theme.colors.primary, '#818cf8']}
                style={styles.container}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <Surface style={styles.card} elevation={4}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Pantry Organizer</Text>
                    </View>

                    <TextInput
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="account" />}
                    />
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                        left={<TextInput.Icon icon="email" />}
                    />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                        left={<TextInput.Icon icon="lock" />}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSignup}
                        loading={loading}
                        style={styles.btn}
                        contentStyle={{ paddingVertical: 6 }}
                    >
                        Sign Up
                    </Button>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20, width: '100%' }}>
                        <Divider style={{ flex: 1 }} />
                        <Text style={{ marginHorizontal: 10, color: '#9ca3af' }}>OR</Text>
                        <Divider style={{ flex: 1 }} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                        <TouchableOpacity style={styles.socialBtn} onPress={signInWithGoogle}>
                            <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.socialBtn} onPress={() => {
                            Alert.alert('Phone Signup', 'Please use the Login screen for Phone verification.', [
                                { text: 'Go to Login', onPress: () => nav.goBack() },
                                { text: 'Cancel', style: 'cancel' }
                            ])
                        }}>
                            <MaterialCommunityIcons name="phone" size={24} color="#34B7F1" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => nav.goBack()} style={styles.link}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Already have an account? Log In</Text>
                    </TouchableOpacity>
                </Surface>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
    subtitle: { color: '#6b7280', fontSize: 16, marginTop: 4 },
    input: { width: '100%', marginBottom: 16, backgroundColor: '#fff' },
    btn: { width: '100%', marginTop: 8, borderRadius: 12, backgroundColor: theme.colors.primary },
    link: { marginTop: 24 },
    socialBtn: {
        width: 50, height: 50,
        borderRadius: 25, backgroundColor: '#f3f4f6',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#e5e7eb'
    },
});
