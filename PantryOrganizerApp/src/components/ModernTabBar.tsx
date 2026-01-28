import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { theme } from '../theme';

export default function ModernTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const focusedTint = theme.colors.primary;
    const unfocusedTint = theme.colors.textSecondary;

    const onCenterPress = () => {
        const parent = (navigation as any).getParent?.();
        if (parent && typeof parent.navigate === 'function') {
            parent.navigate('AddItem');
        } else {
            navigation.navigate('Items', { screen: 'AddItem' });
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                {state.routes.map((route, index) => {
                    const isCenter = route.name === 'CenterPlaceholder';
                    if (isCenter) {
                        return (
                            <View key="center-fab" style={styles.centerContainer} pointerEvents="box-none">
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={onCenterPress}
                                    style={styles.fabButton}
                                >
                                    <MaterialCommunityIcons name="plus" size={32} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const label = route.name;

                    let iconName: any = 'circle';
                    if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
                    if (route.name === 'Plan') iconName = isFocused ? 'calendar-month' : 'calendar-month-outline';
                    if (route.name === 'Items') iconName = isFocused ? 'format-list-bulleted' : 'format-list-bulleted';
                    if (route.name === 'Shop') iconName = isFocused ? 'cart' : 'cart-outline';
                    if (route.name === 'Stats') iconName = isFocused ? 'chart-box' : 'chart-box-outline';

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const animatedIconStyle = useAnimatedStyle(() => {
                        return {
                            transform: [
                                { scale: withSpring(isFocused ? 1.1 : 1, { stiffness: 200, damping: 20 }) },
                                { translateY: withSpring(isFocused ? -4 : 0, { stiffness: 200, damping: 20 }) }
                            ]
                        };
                    });

                    const animatedLabelStyle = useAnimatedStyle(() => {
                        return {
                            opacity: withTiming(isFocused ? 1 : 0.6),
                            transform: [{ scale: withTiming(isFocused ? 1 : 0.9) }]
                        };
                    });

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            onPress={onPress}
                            style={styles.tabButton}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[{ alignItems: 'center' }, animatedIconStyle]}>
                                <MaterialCommunityIcons
                                    name={iconName}
                                    size={26}
                                    color={isFocused ? focusedTint : unfocusedTint}
                                />
                                <Animated.Text
                                    style={[styles.tabLabel, { color: isFocused ? focusedTint : unfocusedTint }, animatedLabelStyle]}
                                >
                                    {label}
                                </Animated.Text>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0, // removed container shadow to focus on the bar itself if we wanted floating, 
        // but here we are doing a semi-floating look or just clean solid background.
        // Let's go with a solid white background with top border for clean look,
        // or we can make it floating. Let's stick to clean white with shadow for now to be safe.
        backgroundColor: 'transparent',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        ...theme.shadows.float, // Floating shadow effect
        paddingTop: 12,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContainer: {
        width: 60,
        alignItems: 'center',
        zIndex: 10,
    },
    fabButton: {
        top: -30, // Move it up to float
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.float,
        shadowColor: theme.colors.primary, // Colored shadow for button
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
});
