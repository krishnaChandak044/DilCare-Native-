/**
 * OnboardingScreen — Premium animated onboarding
 * Features: floating icon, staggered text entrance, decorative orbs,
 * gradient backgrounds per slide, spring button, smooth dot transitions
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    ScrollView, Platform, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '../theme';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
    onComplete: () => void;
}

const SLIDES = [
    {
        icon: 'pulse' as const,
        gradient: ['#3B82F6', '#1D4ED8'] as readonly [string, string],
        accentLight: '#DBEAFE',
        accentMid: '#93C5FD',
        key: 'slide1',
        emoji: '🏥',
        orbColors: ['#60A5FA', '#3B82F6', '#2563EB'],
    },
    {
        icon: 'people' as const,
        gradient: ['#EC4899', '#BE185D'] as readonly [string, string],
        accentLight: '#FCE7F3',
        accentMid: '#F9A8D4',
        key: 'slide2',
        emoji: '👨‍👩‍👧‍👦',
        orbColors: ['#F472B6', '#EC4899', '#DB2777'],
    },
    {
        icon: 'sparkles' as const,
        gradient: ['#8B5CF6', '#6D28D9'] as readonly [string, string],
        accentLight: '#EDE9FE',
        accentMid: '#C4B5FD',
        key: 'slide3',
        emoji: '🤖',
        orbColors: ['#A78BFA', '#8B5CF6', '#7C3AED'],
    },
];

// Floating orb component
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
            toValue: 0.15,
            duration: 800,
            delay,
            useNativeDriver: true,
        }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -20,
                    duration: 2800 + Math.random() * 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: 2800 + Math.random() * 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: 12,
                    duration: 3200 + Math.random() * 1000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: -12,
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

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const buttonScale = useRef(new Animated.Value(1)).current;

    // Per-slide animation values
    const iconScales = useRef(SLIDES.map(() => new Animated.Value(1))).current;
    const iconRotates = useRef(SLIDES.map(() => new Animated.Value(1))).current;
    const textOpacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
    const textTranslateYs = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 0 : 30))).current;
    const descOpacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
    const descTranslateYs = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 0 : 20))).current;
    const pulseAnims = useRef(SLIDES.map(() => new Animated.Value(1))).current;
    const ringScales = useRef(SLIDES.map(() => new Animated.Value(0.8))).current;
    const ringOpacities = useRef(SLIDES.map(() => new Animated.Value(0))).current;

    // Animate the first slide on mount
    useEffect(() => {
        runSlideEntranceAnimation(0);
    }, []);

    const runSlideEntranceAnimation = (index: number) => {
        // Reset values
        iconScales[index].setValue(0.3);
        iconRotates[index].setValue(0);
        textOpacities[index].setValue(0);
        textTranslateYs[index].setValue(30);
        descOpacities[index].setValue(0);
        descTranslateYs[index].setValue(20);

        // Icon entrance — spring scale
        Animated.spring(iconScales[index], {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
        }).start();

        // Icon rotation
        Animated.timing(iconRotates[index], {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
        }).start();

        // Title entrance — staggered
        Animated.parallel([
            Animated.timing(textOpacities[index], {
                toValue: 1,
                duration: 500,
                delay: 250,
                useNativeDriver: true,
            }),
            Animated.spring(textTranslateYs[index], {
                toValue: 0,
                friction: 6,
                tension: 40,
                delay: 250,
                useNativeDriver: true,
            }),
        ]).start();

        // Description — more stagger
        Animated.parallel([
            Animated.timing(descOpacities[index], {
                toValue: 1,
                duration: 500,
                delay: 450,
                useNativeDriver: true,
            }),
            Animated.spring(descTranslateYs[index], {
                toValue: 0,
                friction: 6,
                tension: 40,
                delay: 450,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse ring
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(ringScales[index], {
                        toValue: 1.4,
                        duration: 1800,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacities[index], {
                        toValue: 0.3,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(ringOpacities[index], {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(ringScales[index], {
                    toValue: 0.8,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Gentle breathing
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnims[index], {
                    toValue: 1.05,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnims[index], {
                    toValue: 0.95,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const handleNext = () => {
        // Button press animation
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.92,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(buttonScale, {
                toValue: 1,
                friction: 3,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();

        if (currentIndex < SLIDES.length - 1) {
            const nextIndex = currentIndex + 1;
            scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * nextIndex, animated: true });
            setCurrentIndex(nextIndex);
            runSlideEntranceAnimation(nextIndex);
        } else {
            onComplete();
        }
    };

    const handleScroll = (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
            setCurrentIndex(index);
            runSlideEntranceAnimation(index);
        }
    };

    const currentSlide = SLIDES[currentIndex];

    const renderSlide = (item: typeof SLIDES[0], index: number) => {
        const rotateInterpolate = iconRotates[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['-10deg', '0deg'],
        });

        return (
            <View key={item.key} style={styles.slideContent}>
                {/* Floating orbs background */}
                {item.orbColors.map((color, i) => (
                    <FloatingOrb
                        key={i}
                        size={60 + i * 30}
                        color={color}
                        startX={40 + i * 100}
                        startY={80 + i * 60}
                        delay={i * 300}
                    />
                ))}

                {/* Main icon */}
                <View style={styles.iconSection}>
                    {/* Pulse ring */}
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                borderColor: item.accentMid,
                                transform: [{ scale: ringScales[index] }],
                                opacity: ringOpacities[index],
                            },
                        ]}
                    />

                    <Animated.View
                        style={{
                            transform: [
                                { scale: Animated.multiply(iconScales[index], pulseAnims[index]) },
                                { rotate: rotateInterpolate },
                            ],
                        }}
                    >
                        <LinearGradient
                            colors={item.gradient}
                            style={styles.iconCircle}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.innerGlow} />
                            <Text style={styles.emoji}>{item.emoji}</Text>
                            <Ionicons
                                name={item.icon}
                                size={36}
                                color="rgba(255,255,255,0.15)"
                                style={styles.bgIcon}
                            />
                        </LinearGradient>
                    </Animated.View>

                    {/* Decorative dots */}
                    <View style={[styles.decoCircle, styles.decoTopLeft, { backgroundColor: item.accentMid }]} />
                    <View style={[styles.decoCircle, styles.decoTopRight, { backgroundColor: item.accentLight }]} />
                    <View style={[styles.decoCircle, styles.decoBottomLeft, { backgroundColor: item.accentLight }]} />
                </View>

                {/* Title */}
                <Animated.Text
                    style={[
                        styles.slideTitle,
                        {
                            opacity: textOpacities[index],
                            transform: [{ translateY: textTranslateYs[index] }],
                        },
                    ]}
                >
                    {t(`onboarding.${item.key}Title`)}
                </Animated.Text>

                {/* Description */}
                <Animated.Text
                    style={[
                        styles.slideDesc,
                        {
                            opacity: descOpacities[index],
                            transform: [{ translateY: descTranslateYs[index] }],
                        },
                    ]}
                >
                    {t(`onboarding.${item.key}Desc`)}
                </Animated.Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Gradient background */}
            <LinearGradient
                colors={[currentSlide.accentLight, Colors.background, Colors.background]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
            />

            {/* Skip */}
            <TouchableOpacity style={styles.skipButton} onPress={onComplete} activeOpacity={0.6}>
                <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.mutedForeground} />
            </TouchableOpacity>

            {/* Slides — using ScrollView so all slides render once */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScroll}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {SLIDES.map((item, index) => renderSlide(item, index))}
            </ScrollView>

            {/* Bottom section */}
            <View style={styles.bottomSection}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {SLIDES.map((slide, i) => {
                        const isActive = i === currentIndex;
                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    isActive && [styles.dotActive, { backgroundColor: slide.gradient[0] }],
                                ]}
                            />
                        );
                    })}
                </View>

                {/* CTA Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
                        <LinearGradient
                            colors={currentSlide.gradient}
                            style={styles.nextButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.nextText}>
                                {currentIndex === SLIDES.length - 1
                                    ? t('onboarding.getStarted')
                                    : t('common.next')
                                }
                            </Text>
                            <View style={styles.arrowCircle}>
                                <Ionicons
                                    name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                                    size={18}
                                    color={currentSlide.gradient[0]}
                                />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Page label */}
                <Text style={styles.pageLabel}>
                    {currentIndex + 1} / {SLIDES.length}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
    },
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 40,
        right: 24,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.mutedForeground,
    },
    slideContent: {
        width: SCREEN_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingTop: SCREEN_HEIGHT * 0.12,
        overflow: 'hidden',
    },
    iconSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 48,
        width: 200,
        height: 200,
    },
    pulseRing: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 2,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.premiumLg,
        overflow: 'hidden',
    },
    innerGlow: {
        position: 'absolute',
        top: -20,
        left: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    emoji: {
        fontSize: 56,
    },
    bgIcon: {
        position: 'absolute',
        bottom: 16,
        right: 16,
    },
    decoCircle: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.4,
    },
    decoTopLeft: {
        width: 14,
        height: 14,
        top: 20,
        left: 15,
    },
    decoTopRight: {
        width: 10,
        height: 10,
        top: 10,
        right: 25,
    },
    decoBottomLeft: {
        width: 8,
        height: 8,
        bottom: 30,
        left: 30,
    },
    slideTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors.foreground,
        textAlign: 'center',
        marginBottom: 14,
        letterSpacing: -0.5,
    },
    slideDesc: {
        fontSize: 16,
        color: Colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    bottomSection: {
        paddingHorizontal: 40,
        paddingBottom: Platform.OS === 'ios' ? 50 : 32,
        alignItems: 'center',
        gap: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.border,
    },
    dotActive: {
        width: 28,
        borderRadius: 6,
        height: 8,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingLeft: 32,
        paddingRight: 6,
        paddingVertical: 6,
        borderRadius: 28,
        ...Shadows.premium,
        minWidth: 220,
        height: 56,
    },
    arrowCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextText: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.white,
    },
    pageLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.mutedForeground,
        letterSpacing: 1,
    },
});

export default OnboardingScreen;
