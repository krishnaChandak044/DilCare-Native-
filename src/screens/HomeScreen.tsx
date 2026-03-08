import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Colors, BorderRadius, Gradients, Shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import {
    userService,
    waterService,
    stepService,
    bmiService,
    medicineService,
    healthService,
    gyaanService,
} from '../services/api';
import { useAuth } from '../../App';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const GRID_GAP = 12;
const ACTION_CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GRID_GAP) / 2;

// ── Dashboard data types ──
interface DashboardData {
    userName: string;
    stepsToday: number;
    stepGoal: number;
    waterGlasses: number;
    waterGoal: number;
    latestBMI: number | null;
    bmiCategory: string | null;
    medicinePending: number;
    medicineTaken: number;
    lastBP: string | null;
    lastHeartRate: string | null;
    tipOfTheDay: string | null;
}

const DEFAULT_DASHBOARD: DashboardData = {
    userName: '',
    stepsToday: 0,
    stepGoal: 10000,
    waterGlasses: 0,
    waterGoal: 8,
    latestBMI: null,
    bmiCategory: null,
    medicinePending: 0,
    medicineTaken: 0,
    lastBP: null,
    lastHeartRate: null,
    tipOfTheDay: null,
};

const HomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
    const { colors } = useTheme();
    const { logout } = useAuth();
    const currentHour = new Date().getHours();

    const [data, setData] = useState<DashboardData>(DEFAULT_DASHBOARD);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const getGreeting = () => {
        if (currentHour < 12) return 'Good Morning';
        if (currentHour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getGreetingIcon = (): { name: keyof typeof Ionicons.glyphMap; color: string } => {
        if (currentHour < 12) return { name: 'sunny', color: Colors.amber500 };
        if (currentHour < 17) return { name: 'sunny', color: Colors.orange500 };
        return { name: 'moon', color: Colors.blue500 };
    };

    const greetingIcon = getGreetingIcon();

    // ── Fetch all dashboard data in parallel ──
    const fetchDashboard = useCallback(async () => {
        try {
            const [profileRes, waterRes, stepsRes, bmiRes, medRes, healthRes, gyaanRes] = await Promise.all([
                userService.getProfile(),
                waterService.getWaterData(),
                stepService.getStepData(),
                bmiService.getStats(),
                medicineService.getSummary(),
                healthService.getHealthSummary(),
                gyaanService.getTips(),
            ]);

            const d: DashboardData = { ...DEFAULT_DASHBOARD };

            // Profile
            if (profileRes.data) {
                const p = profileRes.data as any;
                d.userName = p.name || p.first_name || '';
            }

            // Water
            if (waterRes.data) {
                const w = waterRes.data as any;
                d.waterGlasses = w.glasses ?? 0;
                d.waterGoal = w.goal_glasses ?? 8;
            }

            // Steps
            if (stepsRes.data) {
                const s = stepsRes.data as any;
                d.stepsToday = s.total_steps ?? 0;
                d.stepGoal = s.goal ?? 10000;
            }

            // BMI
            if (bmiRes.data) {
                const b = bmiRes.data as any;
                d.latestBMI = b.latest_bmi ?? null;
                d.bmiCategory = b.latest_category ?? null;
            }

            // Medicine
            if (medRes.data) {
                const m = medRes.data as any;
                d.medicineTaken = m.taken_today ?? 0;
                d.medicinePending = m.pending_today ?? 0;
            }

            // Health readings — find BP and heart_rate
            if (healthRes.data && Array.isArray(healthRes.data)) {
                for (const reading of healthRes.data as any[]) {
                    if (reading.reading_type === 'bp') d.lastBP = reading.value;
                    if (reading.reading_type === 'heart_rate') d.lastHeartRate = reading.value;
                }
            }

            // Gyaan tip of the day
            if (gyaanRes.data) {
                const tips = Array.isArray(gyaanRes.data) ? gyaanRes.data : (gyaanRes.data as any).results ?? [];
                if (tips.length > 0) {
                    const randomTip = tips[Math.floor(Math.random() * Math.min(tips.length, 5))];
                    d.tipOfTheDay = randomTip?.title || null;
                }
            }

            setData(d);
        } catch (err) {
            console.error('[HomeScreen] dashboard fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    // ── Dynamic stats ──
    const stepsPercent = data.stepGoal > 0 ? Math.min(100, Math.round((data.stepsToday / data.stepGoal) * 100)) : 0;
    const waterPercent = data.waterGoal > 0 ? Math.min(100, Math.round((data.waterGlasses / data.waterGoal) * 100)) : 0;

    const healthStats = [
        {
            label: 'Steps Today',
            value: data.stepsToday > 0 ? data.stepsToday.toLocaleString() : '--',
            trend: data.stepsToday > 0 ? `${stepsPercent}% of goal` : '--',
            icon: 'footsteps' as const,
            color: Colors.orange600,
        },
        {
            label: 'Water',
            value: data.waterGlasses > 0 ? `${data.waterGlasses}/${data.waterGoal}` : '--',
            trend: data.waterGlasses > 0 ? `${waterPercent}% done` : '--',
            icon: 'water' as const,
            color: Colors.blue600,
        },
        {
            label: 'BMI',
            value: data.latestBMI ? data.latestBMI.toFixed(1) : '--',
            trend: data.bmiCategory || '--',
            icon: 'fitness' as const,
            color: Colors.purple600,
        },
    ];

    const quickActions = [
        {
            screen: 'Medicine', icon: 'medical' as const, label: 'Medications',
            description: data.medicinePending > 0 ? `${data.medicinePending} pending` : 'All done ✓',
            gradient: Gradients.blue, bgColor: Colors.blue50, iconColor: Colors.blue600,
            badge: data.medicinePending > 0 ? `${data.medicinePending}` : null,
        },
        {
            screen: 'Steps', icon: 'footsteps' as const, label: 'Step Tracker',
            description: data.stepsToday > 0 ? `${data.stepsToday.toLocaleString()} steps` : 'Track Steps',
            gradient: Gradients.orange, bgColor: Colors.orange50, iconColor: Colors.orange600, badge: null,
        },
        {
            screen: 'BMI', icon: 'fitness' as const, label: 'BMI Calculator',
            description: data.latestBMI ? `BMI ${data.latestBMI.toFixed(1)}` : 'Check BMI',
            gradient: Gradients.purple, bgColor: Colors.purple50, iconColor: Colors.purple600, badge: null,
        },
        {
            screen: 'Health', icon: 'pulse' as const, label: 'Health Metrics',
            description: data.lastBP ? `BP ${data.lastBP}` : 'Track Progress',
            gradient: Gradients.emerald, bgColor: Colors.emerald50, iconColor: Colors.emerald600, badge: null,
        },
        {
            screen: 'SOS', icon: 'shield-checkmark' as const, label: 'Emergency',
            description: 'Instant Help', gradient: Gradients.red, bgColor: Colors.red50, iconColor: Colors.red600, badge: null,
        },
        {
            screen: 'Water', icon: 'water' as const, label: 'Water Tracker',
            description: data.waterGlasses > 0 ? `${data.waterGlasses} glasses` : 'Stay Hydrated',
            gradient: Gradients.blue, bgColor: Colors.blue50, iconColor: Colors.blue600, badge: null,
        },
    ];

    const secondaryActions = [
        { screen: 'AI', icon: 'chatbubble-ellipses' as const, label: 'AI Assistant', color: Colors.primary, bgColor: Colors.primaryLight },
        { screen: 'Doctor', icon: 'medkit' as const, label: 'Doctors', color: Colors.medicineBlue, bgColor: Colors.blue50 },
        { screen: 'Community', icon: 'people' as const, label: 'Community', color: Colors.emerald600, bgColor: Colors.emerald50 },
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
                        {data.medicinePending > 0 && <View style={styles.notificationDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <LinearGradient colors={Gradients.primary} style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {data.userName ? data.userName.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
                }
            >
                {/* Greeting Card */}
                <Card style={styles.greetingCard}>
                    <CardContent>
                        <View style={styles.greetingRow}>
                            <View style={styles.greetingLeft}>
                                <Ionicons name={greetingIcon.name} size={24} color={greetingIcon.color} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.greetingTitle}>
                                        {getGreeting()}{data.userName ? `, ${data.userName}` : ''} 👋
                                    </Text>
                                    <Text style={styles.greetingSubtitle}>
                                        {data.medicinePending > 0
                                            ? `${data.medicinePending} medicine${data.medicinePending > 1 ? 's' : ''} pending today`
                                            : 'Your health companion is ready'}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="sparkles" size={28} color={Colors.primary + '60'} />
                        </View>

                        {/* Health Stats Grid */}
                        {loading ? (
                            <View style={styles.statsLoading}>
                                <ActivityIndicator color={Colors.primary} size="small" />
                                <Text style={styles.statsLoadingText}>Loading your health data…</Text>
                            </View>
                        ) : (
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
                        )}
                    </CardContent>
                </Card>

                {/* Daily Progress Ring */}
                {!loading && (data.stepsToday > 0 || data.waterGlasses > 0 || data.medicineTaken > 0) && (
                    <View style={styles.progressRow}>
                        {/* Steps progress */}
                        <View style={styles.progressItem}>
                            <View style={[styles.progressCircle, { borderColor: Colors.orange500 }]}>
                                <Ionicons name="footsteps" size={18} color={Colors.orange500} />
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${stepsPercent}%`, backgroundColor: Colors.orange500 }]} />
                            </View>
                            <Text style={styles.progressPercent}>{stepsPercent}%</Text>
                        </View>
                        {/* Water progress */}
                        <View style={styles.progressItem}>
                            <View style={[styles.progressCircle, { borderColor: Colors.blue500 }]}>
                                <Ionicons name="water" size={18} color={Colors.blue500} />
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${waterPercent}%`, backgroundColor: Colors.blue500 }]} />
                            </View>
                            <Text style={styles.progressPercent}>{waterPercent}%</Text>
                        </View>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('More' as any)}>
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
                                <Text style={styles.insightTitle}>
                                    {data.tipOfTheDay ? '💡 Tip of the Day' : "Today's Health Insight"}
                                </Text>
                                <Text style={styles.insightText}>
                                    {data.tipOfTheDay
                                        ? data.tipOfTheDay
                                        : 'Explore Gyaan Corner for personalized daily wellness tips and expert advice.'}
                                </Text>
                                <Button
                                    variant="gradient"
                                    size="sm"
                                    gradientColors={Gradients.emerald}
                                    style={{ marginTop: 12, alignSelf: 'flex-start' }}
                                    onPress={() => navigation.navigate('Gyaan')}
                                >
                                    Explore Tips
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

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={18} color={Colors.destructive} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
};
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
    avatarText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.white,
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

    // ── Progress row ──
    progressRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    progressItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        ...Shadows.sm,
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.muted,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressPercent: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.foreground,
        minWidth: 30,
        textAlign: 'right',
    },

    // ── Loading ──
    statsLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    statsLoadingText: {
        fontSize: 13,
        color: Colors.mutedForeground,
        fontWeight: '500',
    },

    // ── Logout ──
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        marginTop: 8,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.destructive + '30',
        backgroundColor: Colors.red50,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.destructive,
    },
});

export default HomeScreen;
