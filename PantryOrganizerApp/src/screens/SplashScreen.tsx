import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        // 1. Fade in & Scale up Logo
        opacity.value = withTiming(1, { duration: 800 });
        scale.value = withSpring(1, { damping: 12 });

        // 2. Fade in Text delay
        setTimeout(() => {
            textOpacity.value = withTiming(1, { duration: 800 });
        }, 500);

        // 3. Finish after 2.5s total
        setTimeout(() => {
            onFinish();
        }, 2500);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    return (
        <LinearGradient
            colors={[theme.colors.primary, '#818cf8']}
            style={styles.container}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <View style={styles.circle}>
                    <MaterialCommunityIcons name="food-apple" size={80} color={theme.colors.primary} />
                </View>
            </Animated.View>

            <Animated.Text style={[styles.text, textStyle]}>
                Pantry Organizer
            </Animated.Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoContainer: { marginBottom: 20 },
    circle: {
        width: 140, height: 140, borderRadius: 70, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center', elevation: 10
    },
    text: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1 },
});
