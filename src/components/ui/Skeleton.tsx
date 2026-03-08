/**
 * SkeletonLoader — shimmer loading placeholder
 */
import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

interface SkeletonProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius = BorderRadius.md,
    style,
}) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: Colors.border,
                    opacity,
                },
                style,
            ]}
        />
    );
};

interface SkeletonCardProps {
    style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => (
    <View style={[skeletonStyles.card, style]}>
        <View style={skeletonStyles.row}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={skeletonStyles.textCol}>
                <Skeleton width={120} height={14} />
                <Skeleton width={80} height={10} style={{ marginTop: 6 }} />
            </View>
        </View>
        <Skeleton width="100%" height={8} style={{ marginTop: 16 }} />
    </View>
);

const skeletonStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: 20,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    textCol: {
        flex: 1,
    },
});
