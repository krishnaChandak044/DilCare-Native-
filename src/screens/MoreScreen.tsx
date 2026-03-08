/**
 * More Screen — Premium redesign as a services hub
 * Proper standalone component (not inline in navigator)
 */
import React from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardContent } from '../components/ui/Card';
import { Colors, Shadows, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * 2) / 3;

type Feature = {
    name: string;
    icon: string;
    screen: string;
    color: string;
    gradient: readonly [string, string, ...string[]];
    description: string;
    isMaterial?: boolean;
};

const FEATURED_SERVICES: Feature[] = [
    {
        name: 'AI Assistant',
        icon: 'chatbubble-ellipses',
        screen: 'AI',
        color: Colors.primary,
        gradient: Gradients.primary,
        description: 'Get instant health advice',
    },
    {
        name: 'Emergency SOS',
        icon: 'shield-checkmark',
        screen: 'SOS',
        color: Colors.red500,
        gradient: Gradients.red,
        description: 'One-tap emergency help',
    },
];

const ALL_SERVICES: Feature[] = [
    {
        name: 'Water',
        icon: 'water',
        screen: 'Water',
        color: Colors.blue500,
        gradient: Gradients.blue,
        description: 'Track hydration',
    },
    {
        name: 'BMI',
        icon: 'scale-bathroom',
        screen: 'BMI',
        color: Colors.purple500,
        gradient: Gradients.purple,
        description: 'Check your BMI',
        isMaterial: true,
    },
    {
        name: 'Wellness',
        icon: 'book-open-variant',
        screen: 'Gyaan',
        color: Colors.emerald500,
        gradient: Gradients.emerald,
        description: 'Health tips',
        isMaterial: true,
    },
    {
        name: 'Doctors',
        icon: 'stethoscope',
        screen: 'Doctor',
        color: Colors.medicineBlue,
        gradient: Gradients.blue,
        description: 'Manage doctors',
        isMaterial: true,
    },
    {
        name: 'Community',
        icon: 'people',
        screen: 'Community',
        color: Colors.orange500,
        gradient: Gradients.orange,
        description: 'Health together',
    },
    {
        name: 'Family',
        icon: 'heart',
        screen: 'ChildDashboard',
        color: Colors.pink500,
        gradient: ['#EC4899', '#DB2777'] as readonly [string, string],
        description: 'Monitor family',
    },
];

const SETTINGS_SERVICES: Feature[] = [
    {
        name: 'Profile',
        icon: 'person',
        screen: 'Profile',
        color: Colors.mutedForeground,
        gradient: Gradients.secondary,
        description: 'Your account',
    },
];

const MoreScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();

    const renderServiceIcon = (feature: Feature, size: number) => {
        if (feature.isMaterial) {
            return <MaterialCommunityIcons name={feature.icon as any} size={size} color={feature.color} />;
        }
        return <Ionicons name={feature.icon as any} size={size} color={feature.color} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <View>
                    <Text style={styles.title}>All Services</Text>
                    <Text style={styles.subtitle}>Everything DilCare offers</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.7}
                >
                    <LinearGradient colors={Gradients.primary} style={styles.profileGradient}>
                        <Ionicons name="person" size={16} color={Colors.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured — larger cards */}
                <Text style={styles.sectionLabel}>FEATURED</Text>
                <View style={styles.featuredRow}>
                    {FEATURED_SERVICES.map((feature) => (
                        <TouchableOpacity
                            key={feature.screen}
                            style={styles.featuredCard}
                            onPress={() => navigation.navigate(feature.screen)}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={feature.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.featuredGradient}
                            >
                                <View style={styles.featuredIconBg}>
                                    <Ionicons name={feature.icon as any} size={24} color={Colors.white} />
                                </View>
                                <Text style={styles.featuredName}>{feature.name}</Text>
                                <Text style={styles.featuredDesc}>{feature.description}</Text>
                                <View style={styles.featuredArrow}>
                                    <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* All Services — grid */}
                <Text style={styles.sectionLabel}>SERVICES</Text>
                <View style={styles.servicesGrid}>
                    {ALL_SERVICES.map((feature) => (
                        <TouchableOpacity
                            key={feature.screen}
                            style={styles.serviceCard}
                            onPress={() => navigation.navigate(feature.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.serviceInner}>
                                <View style={[styles.serviceIconBg, { backgroundColor: feature.color + '12' }]}>
                                    {renderServiceIcon(feature, 24)}
                                </View>
                                <Text style={styles.serviceName} numberOfLines={1}>{feature.name}</Text>
                                <Text style={styles.serviceDesc} numberOfLines={1}>{feature.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Account */}
                <Text style={styles.sectionLabel}>ACCOUNT</Text>
                <TouchableOpacity
                    style={styles.accountCard}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.7}
                >
                    <View style={styles.accountRow}>
                        <View style={styles.accountLeft}>
                            <View style={[styles.accountIcon, { backgroundColor: Colors.primaryLight }]}>
                                <Ionicons name="person" size={22} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.accountName}>Profile & Settings</Text>
                                <Text style={styles.accountDesc}>Manage your account, link code, preferences</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.mutedForeground} />
                    </View>
                </TouchableOpacity>

                {/* App info */}
                <View style={styles.footer}>
                    <View style={styles.footerLogo}>
                        <Ionicons name="heart" size={14} color={Colors.primary} />
                        <Text style={styles.footerText}>DilCare</Text>
                    </View>
                    <Text style={styles.footerVersion}>v1.0.0 • Made with ❤️ for your health</Text>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 12,
        backgroundColor: Colors.glassBackground,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.foreground,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.mutedForeground,
        fontWeight: '500',
        marginTop: 2,
    },
    profileButton: {},
    profileGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.mutedForeground,
        letterSpacing: 1.2,
        marginBottom: 12,
        marginTop: 4,
    },

    // Featured cards — side by side banners
    featuredRow: {
        flexDirection: 'row',
        gap: CARD_GAP,
        marginBottom: 28,
    },
    featuredCard: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadows.premium,
    },
    featuredGradient: {
        padding: 18,
        paddingBottom: 16,
        minHeight: 140,
        justifyContent: 'space-between',
    },
    featuredIconBg: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featuredName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },
    featuredDesc: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 2,
    },
    featuredArrow: {
        position: 'absolute',
        top: 18,
        right: 16,
    },

    // Services grid — 3 columns (calculated width)
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
        marginBottom: 28,
    },
    serviceCard: {
        width: CARD_WIDTH,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.card,
        ...Shadows.sm,
        overflow: 'hidden',
    },
    serviceInner: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 8,
    },
    serviceIconBg: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    serviceName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.foreground,
        textAlign: 'center',
    },
    serviceDesc: {
        fontSize: 10,
        color: Colors.mutedForeground,
        textAlign: 'center',
        marginTop: 2,
    },

    // Account section
    accountCard: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        ...Shadows.sm,
        marginBottom: 28,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    accountLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    accountIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accountName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.foreground,
    },
    accountDesc: {
        fontSize: 11,
        color: Colors.mutedForeground,
        marginTop: 2,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    footerLogo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    footerVersion: {
        fontSize: 11,
        color: Colors.mutedForeground,
    },
});

export default MoreScreen;
