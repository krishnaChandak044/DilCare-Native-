import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Colors, Shadows, BorderRadius, Gradients, Typography } from '../theme';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const GRID_GAP = 12;
const ACTION_CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GRID_GAP) / 2;

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const currentHour = new Date().getHours();

    const getGreeting = () => {
        if (currentHour < 12) return 'Good Morning';
        if (currentHour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getGreetingIcon = (): { name: any; color: string } => {
        if (currentHour < 12) return { name: 'sunny', color: Colors.amber500 };
        if (currentHour < 17) return { name: 'sunny', color: Colors.orange500 };
        return { name: 'moon', color: Colors.blue500 };
    };

    const greetingIcon = getGreetingIcon();

    // Placeholder values — will come from API
    const userName = ''; // Empty - will come from API
    const healthStats = [
        { label: 'Steps Today', value: '--', trend: '--', icon: 'footsteps' as const, color: Colors.orange600 },
        { label: 'BMI', value: '--', trend: '--', icon: 'fitness' as const, color: Colors.purple600 },
        { label: 'Heart Rate', value: '--', trend: '--', icon: 'heart' as const, color: Colors.blue600 },
    ];

    const quickActions = [
        { screen: 'Medicine', icon: 'medical' as const, label: 'Medications', description: 'Smart Reminders', gradient: Gradients.blue, bgColor: Colors.blue50, iconColor: Colors.blue600, badge: null },
        { screen: 'Steps', icon: 'footsteps' as const, label: 'Step Tracker', description: 'Track Steps', gradient: Gradients.orange, bgColor: Colors.orange50, iconColor: Colors.orange600, badge: null },
        { screen: 'BMI', icon: 'fitness' as const, label: 'BMI Calculator', description: 'Check BMI', gradient: Gradients.purple, bgColor: Colors.purple50, iconColor: Colors.purple600, badge: null },
        { screen: 'Health', icon: 'pulse' as const, label: 'Health Metrics', description: 'Track Progress', gradient: Gradients.emerald, bgColor: Colors.emerald50, iconColor: Colors.emerald600, badge: null },
        { screen: 'SOS', icon: 'shield-checkmark' as const, label: 'Emergency', description: 'Instant Help', gradient: Gradients.red, bgColor: Colors.red50, iconColor: Colors.red600, badge: null },
        { screen: 'Gyaan', icon: 'book' as const, label: 'Wellness', description: 'Expert Tips', gradient: Gradients.purple, bgColor: Colors.purple50, iconColor: Colors.purple600, badge: null },
    ];

    const secondaryActions = [
        { screen: 'AI', icon: 'chatbubble-ellipses' as const, label: 'AI Assistant', color: Colors.primary, bgColor: Colors.primaryLight },
        { screen: 'Doctor', icon: 'medkit' as const, label: 'Doctors', color: Colors.medicineBlue, bgColor: Colors.blue50 },
        { screen: 'Profile', icon: 'person' as const, label: 'Profile', color: Colors.mutedForeground, bgColor: Colors.muted },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Top Header */}
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.menuButton}>
                        <Ionicons name="menu" size={22} color={Colors.mutedForeground} />
                    </TouchableOpacity>
                    <View>
                        <View style={styles.logoRow}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="heart" size={18} color={Colors.white} />
                            </View>
                            <Text style={styles.logoText}>DilCare</Text>
                        </View>
                        <Text style={styles.greetingSmall}>{getGreeting()}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerIcon}
                        onPress={() => navigation.navigate('ChildDashboard')}
                    >
                        <Ionicons name="people" size={22} color={Colors.purple500} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="notifications" size={22} color={Colors.mutedForeground} />
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <LinearGradient colors={Gradients.primary} style={styles.avatar}>
                            <Ionicons name="person" size={16} color={Colors.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting Card */}
                <Card style={styles.greetingCard}>
                    <CardContent>
                        <View style={styles.greetingRow}>
                            <View style={styles.greetingLeft}>
                                <Ionicons name={greetingIcon.name} size={24} color={greetingIcon.color} />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.greetingTitle}>
                                        {getGreeting()}{userName ? `, ${userName}` : ''}
                                    </Text>
                                    <Text style={styles.greetingSubtitle}>Your health companion is ready</Text>
                                </View>
                            </View>
                            <Ionicons name="sparkles" size={28} color={Colors.primary + '60'} />
                        </View>

                        {/* Health Stats Grid */}
                        <View style={styles.statsGrid}>
                            {healthStats.map((stat, index) => (
                                <View key={index} style={styles.statItem}>
                                    <View style={styles.statIcon}>
                                        <Ionicons name={stat.icon} size={14} color={stat.color} />
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                    </View>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={[styles.statTrend, { color: stat.color }]}>{stat.trend}</Text>
                                </View>
                            ))}
                        </View>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>View All</Text>
                        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionsGrid}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.screen}
                            style={styles.actionCard}
                            onPress={() => navigation.navigate(action.screen)}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.actionCardInner}>
                                <CardContent>
                                    <View style={[styles.actionIconBg, { backgroundColor: action.bgColor }]}>
                                        <Ionicons name={action.icon} size={24} color={action.iconColor} />
                                        {action.badge && (
                                            <View style={styles.actionBadge}>
                                                <Text style={styles.actionBadgeText}>{action.badge}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.actionLabel}>{action.label}</Text>
                                    <Text style={styles.actionDescription}>{action.description}</Text>
                                </CardContent>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Today's Insight */}
                <Card style={styles.insightCard}>
                    <CardContent>
                        <View style={styles.insightRow}>
                            <View style={styles.insightIconBg}>
                                <Ionicons name="book" size={24} color={Colors.emerald600} />
                            </View>
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>Today's Health Insight</Text>
                                <Text style={styles.insightText}>
                                    Connect your health data to get personalized daily insights and tips for optimal wellness.
                                </Text>
                                <Button
                                    variant="gradient"
                                    size="sm"
                                    gradientColors={Gradients.emerald}
                                    style={{ marginTop: 12, alignSelf: 'flex-start' }}
                                >
                                    Learn More
                                </Button>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {/* Secondary Actions */}
                <View style={styles.secondaryGrid}>
                    {secondaryActions.map((action) => (
                        <TouchableOpacity
                            key={action.screen}
                            style={styles.secondaryCard}
                            onPress={() => navigation.navigate(action.screen)}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.secondaryCardInner}>
                                <CardContent style={{ alignItems: 'center', paddingVertical: 16 }}>
                                    <View style={[styles.secondaryIconBg, { backgroundColor: action.bgColor }]}>
                                        <Ionicons name={action.icon} size={24} color={action.color} />
                                    </View>
                                    <Text style={styles.secondaryLabel}>{action.label}</Text>
                                </CardContent>
                            </Card>
                        </TouchableOpacity>
                    ))}
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 12,
        backgroundColor: Colors.glassBackground,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuButton: {
        padding: 8,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoCircle: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.foreground,
    },
    greetingSmall: {
        fontSize: 11,
        color: Colors.mutedForeground,
        fontWeight: '500',
        marginTop: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerIcon: {
        padding: 8,
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
    avatarButton: {
        padding: 4,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    greetingCard: {
        marginBottom: 24,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    greetingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    greetingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.foreground,
    },
    greetingSubtitle: {
        fontSize: 13,
        color: Colors.mutedForeground,
        fontWeight: '500',
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statItem: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: BorderRadius.md,
        padding: 14,
        flex: 1,
        minWidth: (SCREEN_WIDTH - H_PAD * 2 - 60) / 2,
    },
    statIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.mutedForeground,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.foreground,
    },
    statTrend: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.foreground,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '500',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: ACTION_CARD_WIDTH,
    },
    actionCardInner: {
        height: '100%',
    },
    actionIconBg: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        position: 'relative',
    },
    actionBadge: {
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    actionBadgeText: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.white,
    },
    actionLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.foreground,
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 12,
        color: Colors.mutedForeground,
    },
    insightCard: {
        marginBottom: 20,
        backgroundColor: Colors.emerald50,
    },
    insightRow: {
        flexDirection: 'row',
        gap: 14,
    },
    insightIconBg: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.emerald50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.emerald600,
        marginBottom: 8,
    },
    insightText: {
        fontSize: 13,
        color: Colors.foreground,
        lineHeight: 20,
    },
    secondaryGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    secondaryCard: {
        flex: 1,
    },
    secondaryCardInner: {},
    secondaryIconBg: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    secondaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.foreground,
        textAlign: 'center',
    },
});

export default HomeScreen;
