import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { Text, TextInput, Button, Surface, Divider, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from '../components/FirebaseRecaptcha';
import { auth, firebaseConfig } from '../firebaseConfig';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

export default function LoginScreen() {
    const { login, signInWithGoogle, signInWithPhone } = useAuth();
    const nav = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Phone Auth State
    const [phoneVisible, setPhoneVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const recaptchaVerifier = useRef(null);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);
        if (!success) {

        }
    };

    const handleSendCode = async () => {
        if (!phoneNumber) return;
        if (!recaptchaVerifier.current) return; // Verify ref exists

        // Format phone number: ensure it starts with + for E.164
        const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        try {
            const confirmation = await signInWithPhone(formattedPhoneNumber, recaptchaVerifier.current);
            if (confirmation) {
                setVerificationId(confirmation.verificationId);
                Alert.alert('Code Sent', 'Check your SMS');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleVerifyCode = async () => {
        try {
            const credential = PhoneAuthProvider.credential(
                verificationId,
                verificationCode
            );
            await signInWithCredential(auth, credential);
            setPhoneVisible(false);
        } catch (e: any) {
            Alert.alert('Verification Failed', e.message);
        }
    };

    // Simpler View for now
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <LinearGradient
                colors={[theme.colors.primary, '#818cf8']}
                style={styles.container}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <Surface style={styles.card} elevation={4}>
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="food-apple" size={48} color={theme.colors.primary} />
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Log in to your pantry</Text>
                    </View>

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
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.btn}
                        contentStyle={{ paddingVertical: 6 }}
                    >
                        Log In
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

                        <TouchableOpacity style={styles.socialBtn} onPress={() => setPhoneVisible(true)}>
                            <MaterialCommunityIcons name="phone" size={24} color="#34B7F1" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => nav.navigate('Signup')} style={styles.link}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Don't have an account? Sign Up</Text>
                    </TouchableOpacity>
                </Surface>

                <FirebaseRecaptchaVerifierModal
                    ref={recaptchaVerifier}
                    firebaseConfig={firebaseConfig}
                    title='Prove you are human!' // optional title
                    cancelLabel='Close' // optional cancel label
                />

                {/* Phone Auth Modal */}
                <Modal visible={phoneVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Phone Sign In</Text>

                            {!verificationId ? (
                                <>
                                    <TextInput
                                        label="Phone Number (+1...)"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        mode="outlined"
                                        keyboardType="phone-pad"
                                        style={styles.input}
                                    />
                                    <Button mode="contained" onPress={handleSendCode} style={styles.btn}>Send Code</Button>
                                </>
                            ) : (
                                <>
                                    <TextInput
                                        label="Verification Code"
                                        value={verificationCode}
                                        onChangeText={setVerificationCode}
                                        mode="outlined"
                                        keyboardType="number-pad"
                                        style={styles.input}
                                    />
                                    <Button mode="contained" onPress={() => Alert.alert("Implement Verify")} style={styles.btn}>Verify & Login</Button>
                                </>
                            )}

                            <Button onPress={() => setPhoneVisible(false)} style={{ marginTop: 10 }}>Cancel</Button>
                        </View>
                    </View>
                </Modal>

            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '800', color: '#1f2937', marginTop: 12 },
    subtitle: { color: '#6b7280', fontSize: 16 },
    input: { width: '100%', marginBottom: 16, backgroundColor: '#fff' },
    btn: { width: '100%', marginTop: 8, borderRadius: 12, backgroundColor: theme.colors.primary },
    link: { marginTop: 24 },
    socialBtn: {
        width: 50, height: 50,
        borderRadius: 25, backgroundColor: '#f3f4f6',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#e5e7eb'
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }
});
