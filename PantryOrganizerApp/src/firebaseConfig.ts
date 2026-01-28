import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// Note: If using Expo 50+ and firebase 10.x, sometimes getReactNativePersistence is not explicitly exported.
// We will try standard persistence or ignore if it compiles.
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Firebase project config keys from the Console
// https://console.firebase.google.com/
export const firebaseConfig = {
    apiKey: "AIzaSyAV66h7gqKRCiyf1P7bdP6UHcYFdLglOJk",
    authDomain: "pantryorganizer-7f6cd.firebaseapp.com",
    projectId: "pantryorganizer-7f6cd",
    storageBucket: "pantryorganizer-7f6cd.firebasestorage.app",
    messagingSenderId: "864571708865",
    appId: "1:864571708865:web:cb89a3cbd6498455284b40",
    measurementId: "G-MLDQCJDJVQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics (Web only, may crash on native if not handled)
let analytics;
isSupported().then(yes => yes && (analytics = getAnalytics(app))).catch(console.warn);

// Initialize persistence with AsyncStorage (required for Expo/React Native)
// @ts-ignore: getReactNativePersistence is sometimes missing in types but exists in SDK
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
