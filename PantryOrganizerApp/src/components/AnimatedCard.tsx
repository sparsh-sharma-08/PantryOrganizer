import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    delay?: number;
    onPress?: () => void;
}

export default function AnimatedCard({ children, style, delay = 0, onPress }: AnimatedCardProps) {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).springify().damping(15).stiffness(100)}
            style={[styles.card, style]}
        >
            {onPress ? (
                <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [
                        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                    ]}
                >
                    {children}
                </Pressable>
            ) : (
                children
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l, // 24
        padding: theme.spacing.m,
        ...theme.shadows.card,
        marginBottom: theme.spacing.m,
    },
});
