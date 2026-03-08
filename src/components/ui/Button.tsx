import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    StyleProp,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    gradientColors?: readonly [string, string, ...string[]];
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    gradientColors,
    icon,
}) => {
    const { colors } = useTheme();

    const sizeStyles = {
        sm: { paddingVertical: 8, paddingHorizontal: 14 },
        md: { paddingVertical: 12, paddingHorizontal: 20 },
        lg: { paddingVertical: 16, paddingHorizontal: 28 },
    };

    const variantBg: Record<string, ViewStyle> = {
        primary: { backgroundColor: colors.primary },
        secondary: { backgroundColor: colors.secondary },
        ghost: { backgroundColor: 'transparent' },
        destructive: { backgroundColor: Colors.destructive },
        outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
        gradient: {},
    };

    const variantTextColor: Record<string, string> = {
        primary: Colors.primaryForeground,
        secondary: colors.secondaryForeground,
        ghost: colors.primary,
        destructive: Colors.destructiveForeground,
        outline: colors.foreground,
        gradient: Colors.white,
    };

    const buttonContent = (
        <>
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'ghost' || variant === 'outline' ? colors.primary : Colors.white}
                />
            ) : (
                <>
                    {icon}
                    {typeof children === 'string' ? (
                        <Text
                            style={[
                                styles.text,
                                { color: variantTextColor[variant] },
                                size === 'sm' && styles.textSm,
                                size === 'lg' && styles.textLg,
                                textStyle,
                            ]}
                        >
                            {children}
                        </Text>
                    ) : (
                        children
                    )}
                </>
            )}
        </>
    );

    if (variant === 'gradient' && gradientColors) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.7}
                style={[{ opacity: disabled ? 0.5 : 1 }, style]}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.button,
                        sizeStyles[size],
                        { borderRadius: BorderRadius.md },
                    ]}
                >
                    {buttonContent}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.button,
                sizeStyles[size],
                variantBg[variant],
                disabled && styles.disabled,
                style,
            ]}
        >
            {buttonContent}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        gap: 8,
        minHeight: 44,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semiBold,
    },
    textSm: {
        fontSize: Typography.fontSize.sm,
    },
    textLg: {
        fontSize: Typography.fontSize.lg,
    },
});
