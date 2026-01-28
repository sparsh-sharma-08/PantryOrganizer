import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    PhoneAuthProvider,
    signInWithPhoneNumber,
    ApplicationVerifier,
    ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from '../firebaseConfig';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
    user: FirebaseUser | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    signup: (name: string, email: string, pass: string) => Promise<boolean>;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithPhone: (phoneNumber: string, appVerifier: ApplicationVerifier) => Promise<ConfirmationResult | null>;
};

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '864571708865-r915j1jq1m0vk22mdmteftqk7l5ash2v.apps.googleusercontent.com', // Web Client ID
        // expo-auth-session automatically handles the redirect URI
    });

    useEffect(() => {
        // Real-time listener for auth state
        const unsubscribe = onAuthStateChanged(auth, (usr) => {
            setUser(usr);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    // Handle Google Response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then(async (cred) => {
                    // Check if user doc exists, if not create it
                    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, 'users', cred.user.uid), {
                            displayName: cred.user.displayName || 'Google User',
                            email: cred.user.email,
                            createdAt: Date.now(),
                            role: 'user',
                            photoURL: cred.user.photoURL
                        });
                    }
                })
                .catch((e) => Alert.alert('Google Sign-In Error', e.message));
        }
    }, [response]);

    const signInWithGoogle = async () => {
        if (!request) {
            Alert.alert('Configuration Warning', 'Google Auth is initializing...');
            return;
        }

        try {
            await promptAsync();
        } catch (e: any) {
            Alert.alert('Google Sign-In Error', e.message);
        }
    };

    const signInWithPhone = async (phoneNumber: string, appVerifier: ApplicationVerifier) => {
        try {
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return confirmation;
        } catch (error: any) {
            console.warn(error);
            Alert.alert('Phone Auth Error', error.message);
            return null;
        }
    };

    const login = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            return true;
        } catch (e: any) {
            console.warn('Login Error:', e.message);
            Alert.alert('Login Failed', e.message);
            return false;
        }
    };

    const signup = async (name: string, email: string, pass: string) => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            // Update display name
            if (cred.user) {
                await updateProfile(cred.user, { displayName: name });
                // Force refresh user object
                setUser({ ...cred.user, displayName: name });

                // Create User Document in Firestore
                await setDoc(doc(db, 'users', cred.user.uid), {
                    displayName: name,
                    email: email,
                    createdAt: Date.now(),
                    role: 'user'
                });
            }
            return true;
        } catch (e: any) {
            console.warn('Signup Error:', e.message);
            Alert.alert('Signup Failed', e.message);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.warn(e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout, signInWithGoogle, signInWithPhone }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
