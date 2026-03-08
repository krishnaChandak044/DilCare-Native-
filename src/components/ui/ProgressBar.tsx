import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface ProgressBarProps {
    progress: number; // 0-100
    color?: string;
    backgroundColor?: string;
    height?: number;
    style?: StyleProp<ViewStyle>;
    animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color,
    backgroundColor,
    height = 8,
    style,
    animated = true,
}) => {
    const { colors } = useTheme();
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const barColor = color || colors.primary;
    const trackColor = backgroundColor || colors.secondary;

    useEffect(() => {
        if (animated) {
            Animated.timing(animatedWidth, {
                toValue: Math.min(Math.max(progress, 0), 100),
                duration: 600,
                useNativeDriver: false,
            }).start();
        } else {
            animatedWidth.setValue(Math.min(Math.max(progress, 0), 100));
        }
    }, [progress, animated]);

    return (
        <View style={[styles.container, { height, backgroundColor: trackColor }, style]}>
            <Animated.View
                style={[
                    styles.fill,
                    {
                        height,
                        backgroundColor: barColor,
                        width: animatedWidth.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                        }),
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        width: '100%',
    },
    fill: {
        borderRadius: BorderRadius.full,
    },
});
