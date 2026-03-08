import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { Colors, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={colors.mutedForeground}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: Typography.fontSize.base,
        minHeight: 48,
    },
    inputError: {
        borderColor: Colors.destructive,
    },
    error: {
        fontSize: Typography.fontSize.xs,
        color: Colors.destructive,
        marginTop: 4,
    },
});
