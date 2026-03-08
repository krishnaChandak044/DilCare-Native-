import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface BadgeProps {
    children: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    style,
    textStyle,
}) => {
    const { colors } = useTheme();

    const variantStyles: Record<string, { bg: string; text: string; borderColor?: string }> = {
        default: { bg: colors.primaryLight, text: colors.primary },
        success: { bg: Colors.emerald50, text: Colors.emerald600 },
        warning: { bg: Colors.orange50, text: Colors.orange600 },
        danger: { bg: Colors.red50, text: Colors.red600 },
        info: { bg: Colors.blue50, text: Colors.blue600 },
        outline: { bg: 'transparent', text: colors.mutedForeground, borderColor: colors.border },
    };

    const v = variantStyles[variant];

    return (
        <View style={[
            styles.badge,
            { backgroundColor: v.bg },
            v.borderColor ? { borderWidth: 1, borderColor: v.borderColor } : undefined,
            style,
        ]}>
            <Text style={[styles.text, { color: v.text }, textStyle]}>
                {children}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semiBold,
    },
});
