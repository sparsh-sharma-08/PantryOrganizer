import React, { useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    StyleSheet,
    View,
    Dimensions,
    TouchableOpacity,
    Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

type Props = {
    children: React.ReactNode;
    onSwipeLeft?: () => void; // Delete
    onSwipeRight?: () => void; // Buy
    enabled?: boolean;
};

export default function SwipeableItem({
    children,
    onSwipeLeft,
    onSwipeRight,
    enabled = true,
}: Props) {
    const pan = useRef(new Animated.ValueXY()).current;
    const [swiping, setSwiping] = useState(false);

    // Background opacity/color interpolation
    // Right swipe (Buy) -> Green
    const rightOpacity = pan.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Left swipe (Delete) -> Red
    const leftOpacity = pan.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return enabled && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
            },
            onPanResponderGrant: () => {
                setSwiping(true);
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: 0,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: (evt, gestureState) => {
                pan.flattenOffset();

                if (onSwipeRight && gestureState.dx > SWIPE_THRESHOLD) {
                    // Swiped Right -> Buy
                    Animated.spring(pan, {
                        toValue: { x: SCREEN_WIDTH, y: 0 },
                        useNativeDriver: false,
                    }).start(() => {
                        onSwipeRight();
                        // Reset after action (parent should handle removal from view logic)
                        // But if we want to "reset" visually:
                        // pan.setValue({ x: 0, y: 0 }); 
                    });
                } else if (onSwipeLeft && gestureState.dx < -SWIPE_THRESHOLD) {
                    // Swiped Left -> Delete
                    Animated.spring(pan, {
                        toValue: { x: -SCREEN_WIDTH, y: 0 },
                        useNativeDriver: false,
                    }).start(() => {
                        onSwipeLeft();
                    });
                } else {
                    // Cancel
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start(() => setSwiping(false));
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start(() => setSwiping(false));
            },
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Background Layer */}
            <View style={[styles.bgContainer]}>
                {/* Left Action (Delete) - Visible when swiping LEFT (content moves left, revealing right side) */}
                {/* Actually usually swiping left reveals the right side background */}
                <Animated.View style={[styles.bgAction, styles.bgRight, { opacity: leftOpacity }]}>
                    <MaterialCommunityIcons name="trash-can-outline" size={28} color="#fff" />
                </Animated.View>

                {/* Right Action (Buy) - Visible when swiping RIGHT */}
                <Animated.View style={[styles.bgAction, styles.bgLeft, { opacity: rightOpacity }]}>
                    <MaterialCommunityIcons name="cart-check" size={28} color="#fff" />
                </Animated.View>
            </View>

            {/* Foreground Content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [{ translateX: pan.x }],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 10,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#e5e7eb', // Neutral bg
    },
    bgAction: {
        paddingHorizontal: 20,
        width: '50%',
        height: '100%',
        justifyContent: 'center',
    },
    bgLeft: {
        backgroundColor: theme.colors.success, // Buying (Green)
        alignItems: 'flex-start',
    },
    bgRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: theme.colors.error, // Deleting (Red)
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    content: {
        backgroundColor: theme.colors.surface,
    },
});
