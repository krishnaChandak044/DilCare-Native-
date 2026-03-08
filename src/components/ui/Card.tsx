/**
 * Card component — ShadCN-style card for React Native
 * Dark mode aware via useTheme
 */
import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { Shadows, BorderRadius } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'glass' | 'gradient';
    padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padded = false,
}) => {
    const { colors } = useTheme();
    return (
        <View
            style={[
                styles.card,
                { backgroundColor: colors.card },
                variant === 'glass' && { backgroundColor: colors.glassBackground },
                padded && styles.padded,
                style,
            ]}
        >
            {children}
        </View>
    );
};

export const CardContent: React.FC<{
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => (
    <View style={[styles.content, style]}>{children}</View>
);

export const CardHeader: React.FC<{
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => (
    <View style={[styles.header, style]}>{children}</View>
);

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        ...Shadows.premium,
        overflow: 'hidden',
    },
    padded: {
        padding: 16,
    },
    content: {
        padding: 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
});
