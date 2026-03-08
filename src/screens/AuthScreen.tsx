/**
 * AuthScreen — Premium Login & Register with matching DilCare UI
 * Features: Animated gradient header, floating orbs, form toggle,
 * input validation, loading states, error display, keyboard-aware
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Easing, KeyboardAvoidingView, Platform, ScrollView,
    Dimensions, ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, BorderRadius, Shadows, Typography, Spacing } from '../theme';
import { authService } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuthScreenProps {
    onAuthSuccess: () => void;
}

// ── Floating orb (reused from OnboardingScreen) ──
const FloatingOrb = ({
    size, color, startX, startY, delay,
}: {
    size: number; color: string; startX: number; startY: number; delay: number;
}) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 0.12,
            duration: 900,
            delay,
            useNativeDriver: true,
        }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -18,
                    duration: 2800 + Math.random() * 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 18,
                    duration: 2800 + Math.random() * 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: 10,
                    duration: 3200 + Math.random() * 1000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: -10,
                    duration: 3200 + Math.random() * 1000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                top: startY,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity,
                transform: [{ translateY }, { translateX }],
            }}
        />
    );
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(40)).current;
    const switchAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entry animations
        Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
        }).start();
        Animated.parallel([
            Animated.timing(formOpacity, {
                toValue: 1,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(formTranslateY, {
                toValue: 0,
                duration: 600,
                delay: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const toggleMode = () => {
        setError('');
        setFieldErrors({});
        setIsLogin(!isLogin);
        Animated.timing(switchAnim, {
            toValue: isLogin ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};

        if (!email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            errors.email = 'Enter a valid email';

        if (!password) errors.password = 'Password is required';
        else if (password.length < 8) errors.password = 'At least 8 characters';

        if (!isLogin) {
            if (!confirmPassword) errors.confirmPassword = 'Confirm your password';
            else if (password !== confirmPassword)
                errors.confirmPassword = 'Passwords do not match';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = useCallback(async () => {
        Keyboard.dismiss();
        if (!validate()) return;
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await authService.login(email.trim().toLowerCase(), password);
                if (res.error) {
                    // Try to parse error for detail
                    try {
                        const parsed = JSON.parse(res.error);
                        setError(parsed.detail || parsed.error || 'Invalid email or password');
                    } catch {
                        setError(res.status === 401 ? 'Invalid email or password' : 'Login failed. Please try again.');
                    }
                    setLoading(false);
                    return;
                }
            } else {
                const res = await authService.register(email.trim().toLowerCase(), password, name.trim());
                if (res.error) {
                    try {
                        const parsed = JSON.parse(res.error);
                        // Handle field-level errors from Django
                        if (parsed.email) setFieldErrors(prev => ({ ...prev, email: Array.isArray(parsed.email) ? parsed.email[0] : parsed.email }));
                        if (parsed.password) setFieldErrors(prev => ({ ...prev, password: Array.isArray(parsed.password) ? parsed.password[0] : parsed.password }));
                        if (parsed.non_field_errors) setError(Array.isArray(parsed.non_field_errors) ? parsed.non_field_errors[0] : parsed.non_field_errors);
                        else if (!parsed.email && !parsed.password) setError(parsed.detail || 'Registration failed');
                    } catch {
                        setError('Registration failed. Please try again.');
                    }
                    setLoading(false);
                    return;
                }
            }
            // Success — tokens are stored by authService
            onAuthSuccess();
        } catch (err) {
            setError('Network error. Check your connection.');
            setLoading(false);
        }
    }, [isLogin, email, password, confirmPassword, name, onAuthSuccess]);

    // ── Styled text input (inline for consistent auth styling) ──
    const renderInput = (opts: {
        icon: keyof typeof Ionicons.glyphMap;
        placeholder: string;
        value: string;
        onChangeText: (t: string) => void;
        secure?: boolean;
        keyboardType?: 'email-address' | 'default';
        autoCapitalize?: 'none' | 'words';
        error?: string;
        showToggle?: boolean;
    }) => (
        <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, opts.error && styles.inputWrapperError]}>
                <Ionicons name={opts.icon} size={20} color={opts.error ? Colors.destructive : Colors.mutedForeground} style={styles.inputIcon} />
                <View style={styles.inputFlex}>
                    <Text style={styles.inputFloatLabel}>{opts.placeholder}</Text>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1 }}>
                            {/* Using raw TextInput import from RN instead of custom Input for tighter control */}
                            <RNTextInput
                                value={opts.value}
                                onChangeText={(t) => { opts.onChangeText(t); if (opts.error) setFieldErrors(prev => { const n = { ...prev }; delete n[opts.placeholder.toLowerCase().replace(/\s/g, '')]; return n; }); }}
                                secureTextEntry={opts.secure && !showPassword}
                                keyboardType={opts.keyboardType || 'default'}
                                autoCapitalize={opts.autoCapitalize || 'none'}
                                placeholder=""
                                placeholderTextColor={Colors.mutedForeground}
                                style={styles.inputText}
                                autoCorrect={false}
                            />
                        </View>
                        {opts.showToggle && (
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.mutedForeground} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            {opts.error && <Text style={styles.fieldError}>{opts.error}</Text>}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={['#3B82F6', '#1D4ED8', '#1E3A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                {/* Floating orbs */}
                <FloatingOrb size={100} color="#60A5FA" startX={-20} startY={30} delay={0} />
                <FloatingOrb size={70} color="#93C5FD" startX={SCREEN_WIDTH - 90} startY={10} delay={200} />
                <FloatingOrb size={50} color="#3B82F6" startX={SCREEN_WIDTH / 2 - 25} startY={80} delay={400} />
                <FloatingOrb size={40} color="#BFDBFE" startX={40} startY={120} delay={600} />

                <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="heart" size={36} color={Colors.white} />
                    </View>
                    <Text style={styles.logoTitle}>DilCare</Text>
                    <Text style={styles.logoSubtitle}>Your Health Companion</Text>
                </Animated.View>
            </LinearGradient>

            {/* Form */}
            <KeyboardAvoidingView
                style={styles.formArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.formScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    <Animated.View style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
                        {/* Toggle tabs */}
                        <View style={styles.tabRow}>
                            <TouchableOpacity
                                style={[styles.tab, isLogin && styles.tabActive]}
                                onPress={() => !isLogin && toggleMode()}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, !isLogin && styles.tabActive]}
                                onPress={() => isLogin && toggleMode()}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Error Banner */}
                        {error ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={18} color={Colors.destructive} />
                                <Text style={styles.errorBannerText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Name (register only) */}
                        {!isLogin && renderInput({
                            icon: 'person-outline',
                            placeholder: 'Full Name',
                            value: name,
                            onChangeText: setName,
                            autoCapitalize: 'words',
                        })}

                        {/* Email */}
                        {renderInput({
                            icon: 'mail-outline',
                            placeholder: 'Email',
                            value: email,
                            onChangeText: setEmail,
                            keyboardType: 'email-address',
                            error: fieldErrors.email,
                        })}

                        {/* Password */}
                        {renderInput({
                            icon: 'lock-closed-outline',
                            placeholder: 'Password',
                            value: password,
                            onChangeText: setPassword,
                            secure: true,
                            showToggle: true,
                            error: fieldErrors.password,
                        })}

                        {/* Confirm Password (register only) */}
                        {!isLogin && renderInput({
                            icon: 'shield-checkmark-outline',
                            placeholder: 'Confirm Password',
                            value: confirmPassword,
                            onChangeText: setConfirmPassword,
                            secure: true,
                            error: fieldErrors.confirmPassword,
                        })}

                        {/* Forgot password (login only) */}
                        {isLogin && (
                            <TouchableOpacity style={styles.forgotRow}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Submit button */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleSubmit}
                            disabled={loading}
                            style={styles.submitTouchable}
                        >
                            <LinearGradient
                                colors={loading ? [Colors.muted, Colors.muted] : Gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                                        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social buttons placeholder */}
                        <View style={styles.socialRow}>
                            {(['logo-google', 'logo-apple', 'finger-print'] as const).map((icon) => (
                                <TouchableOpacity key={icon} style={styles.socialButton}>
                                    <Ionicons name={icon} size={22} color={Colors.foreground} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Bottom toggle */}
                        <View style={styles.bottomRow}>
                            <Text style={styles.bottomText}>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            </Text>
                            <TouchableOpacity onPress={toggleMode}>
                                <Text style={styles.bottomLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ── We need the raw RN TextInput here ──
import { TextInput as RNTextInput } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // ── Header gradient ──
    headerGradient: {
        height: SCREEN_HEIGHT * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logoContainer: {
        alignItems: 'center',
        zIndex: 10,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logoTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    logoSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },

    // ── Form area ──
    formArea: {
        flex: 1,
        marginTop: -30,
    },
    formScroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius['2xl'],
        paddingHorizontal: 24,
        paddingVertical: 28,
        ...Shadows.premium,
    },

    // ── Tabs ──
    tabRow: {
        flexDirection: 'row',
        backgroundColor: Colors.muted,
        borderRadius: BorderRadius.md,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: Colors.white,
        ...Shadows.sm,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.mutedForeground,
    },
    tabTextActive: {
        color: Colors.primary,
    },

    // ── Error ──
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.red50,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: BorderRadius.md,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.destructive + '30',
    },
    errorBannerText: {
        flex: 1,
        fontSize: 13,
        color: Colors.destructive,
        fontWeight: '500',
    },

    // ── Input ──
    inputGroup: {
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        minHeight: 56,
    },
    inputWrapperError: {
        borderColor: Colors.destructive,
        backgroundColor: Colors.red50 + '40',
    },
    inputIcon: {
        marginRight: 12,
    },
    inputFlex: {
        flex: 1,
    },
    inputFloatLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputText: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.foreground,
        paddingVertical: 0,
        minHeight: 22,
    },
    fieldError: {
        fontSize: 11,
        color: Colors.destructive,
        fontWeight: '500',
        marginTop: 4,
        marginLeft: 4,
    },

    // ── Forgot ──
    forgotRow: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        marginTop: -4,
    },
    forgotText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
    },

    // ── Submit ──
    submitTouchable: {
        marginTop: 4,
        marginBottom: 20,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: BorderRadius.md,
        ...Shadows.md,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },

    // ── Divider ──
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        fontSize: 12,
        color: Colors.mutedForeground,
        fontWeight: '500',
        marginHorizontal: 14,
    },

    // ── Social ──
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    socialButton: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },

    // ── Bottom ──
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomText: {
        fontSize: 14,
        color: Colors.mutedForeground,
    },
    bottomLink: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
});

export default AuthScreen;
