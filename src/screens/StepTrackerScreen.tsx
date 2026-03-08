import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions,
    ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { stepService, TodaySteps, StepStats, WeeklyChart } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const G_GAP = 10;
const ACHV_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - G_GAP) / 2;

const StepTrackerScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [todayData, setTodayData] = useState<TodaySteps | null>(null);
    const [stats, setStats] = useState<StepStats | null>(null);
    const [weeklyChart, setWeeklyChart] = useState<WeeklyChart | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [adding, setAdding] = useState(false);
    
    const [showManualInput, setShowManualInput] = useState(false);
    const [showGoalInput, setShowGoalInput] = useState(false);
    const [manualSteps, setManualSteps] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const screenWidth = Dimensions.get('window').width;

    const steps = todayData?.total_steps ?? 0;
    const goal = todayData?.goal_steps ?? 10000;
    const progressPercent = todayData?.progress_percent ?? 0;
    const caloriesBurned = todayData?.calories_burned ?? 0;
    const distanceKm = todayData?.distance_km ?? 0;
    const activeMinutes = todayData?.active_minutes ?? 0;

    const fetchData = useCallback(async () => {
        try {
            const [todayRes, statsRes, chartRes] = await Promise.all([
                stepService.getStepData(),
                stepService.getStepStats(),
                stepService.getWeeklyChart(),
            ]);

            if (todayRes.data) setTodayData(todayRes.data);
            if (statsRes.data) setStats(statsRes.data);
            if (chartRes.data) setWeeklyChart(chartRes.data);
        } catch (error) {
            console.error('Failed to fetch step data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const addManualSteps = async () => {
        const num = parseInt(manualSteps);
        if (isNaN(num) || num <= 0) {
            Alert.alert('Invalid', 'Please enter a valid number of steps');
            return;
        }
        
        setAdding(true);
        try {
            const res = await stepService.addManualSteps(num);
            if (res.data) {
                setTodayData(res.data);
                // Refresh stats and chart too
                const [statsRes, chartRes] = await Promise.all([
                    stepService.getStepStats(),
                    stepService.getWeeklyChart(),
                ]);
                if (statsRes.data) setStats(statsRes.data);
                if (chartRes.data) setWeeklyChart(chartRes.data);
            } else {
                Alert.alert('Error', res.error || 'Failed to add steps');
            }
            setManualSteps('');
            setShowManualInput(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to add steps');
        } finally {
            setAdding(false);
        }
    };

    const addQuickSteps = async (count: number) => {
        const res = await stepService.addManualSteps(count);
        if (res.data) {
            setTodayData(res.data);
            const [statsRes, chartRes] = await Promise.all([
                stepService.getStepStats(),
                stepService.getWeeklyChart(),
            ]);
            if (statsRes.data) setStats(statsRes.data);
            if (chartRes.data) setWeeklyChart(chartRes.data);
        }
    };

    const updateGoal = async () => {
        const num = parseInt(newGoal);
        if (isNaN(num) || num <= 0) {
            Alert.alert('Invalid', 'Please enter a valid step goal');
            return;
        }
        
        setAdding(true);
        try {
            const res = await stepService.updateStepGoal({ daily_goal: num });
            if (res.data) {
                // Refresh all data to reflect new goal
                fetchData();
                Alert.alert('Success', `Goal updated to ${num.toLocaleString()} steps`);
            } else {
                Alert.alert('Error', res.error || 'Failed to update goal');
            }
            setNewGoal('');
            setShowGoalInput(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to update goal');
        } finally {
            setAdding(false);
        }
    };

    const getMotivationalMessage = () => {
        if (progressPercent >= 100) return '🎉 Goal achieved! Amazing work!';
        if (progressPercent >= 75) return '🔥 Almost there! Keep pushing!';
        if (progressPercent >= 50) return '💪 Great progress! Halfway done!';
        if (progressPercent >= 25) return '👣 Good start! Keep moving!';
        return '🌅 Start your day with a walk!';
    };

    const weeklyData = weeklyChart ? {
        labels: weeklyChart.labels,
        datasets: [{ data: weeklyChart.data.map(d => d || 0) }],
    } : {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    };

    const achievements = [
        { name: 'First Steps', unlocked: steps > 0 },
        { name: '5K Steps', unlocked: steps >= 5000 },
        { name: '10K Steps', unlocked: steps >= 10000 },
        { name: `${stats?.current_streak ?? 0}d Streak`, unlocked: (stats?.current_streak ?? 0) >= 3 },
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.orange500} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Step Tracker</Text>
                <TouchableOpacity onPress={() => setShowManualInput(true)}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
            >
                {/* Main Progress Card */}
                <Card style={styles.mainCard}>
                    <CardContent>
                        <View style={styles.progressSection}>
                            <View style={styles.circularProgress}>
                                <View style={[styles.circleOuter, { borderColor: Colors.orange500 + '30' }]}>
                                    <View style={styles.circleInner}>
                                        <Ionicons name="footsteps" size={28} color={Colors.orange500} />
                                        <Text style={styles.stepCount}>{steps.toLocaleString()}</Text>
                                        <Text style={styles.goalText}>/ {goal.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>
                            <ProgressBar progress={progressPercent} color={Colors.orange500} height={10} style={{ marginTop: 16 }} />
                            <Text style={styles.motivational}>{getMotivationalMessage()}</Text>
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="flame" size={18} color={Colors.red500} />
                                <Text style={styles.statValue}>{Math.round(caloriesBurned)}</Text>
                                <Text style={styles.statLabel}>Calories</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="map" size={18} color={Colors.blue500} />
                                <Text style={styles.statValue}>{distanceKm.toFixed(1)}</Text>
                                <Text style={styles.statLabel}>km</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="time" size={18} color={Colors.emerald500} />
                                <Text style={styles.statValue}>{activeMinutes}</Text>
                                <Text style={styles.statLabel}>min</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <Button
                        variant="gradient"
                        gradientColors={Gradients.orange}
                        onPress={() => addQuickSteps(100)}
                        icon={<Ionicons name="add" size={18} color={Colors.white} />}
                        style={{ flex: 1 }}
                    >
                        +100 Steps
                    </Button>
                    <Button
                        variant="outline"
                        onPress={() => setShowGoalInput(true)}
                        icon={<Ionicons name="flag" size={18} color={Colors.foreground} />}
                        style={{ flex: 1 }}
                    >
                        Set Goal
                    </Button>
                </View>

                {/* Streaks Card */}
                {stats && (
                    <Card style={styles.fitCard}>
                        <CardContent>
                            <Text style={styles.chartTitle}>Streaks & Summary</Text>
                            <View style={styles.streakRow}>
                                <View style={styles.streakItem}>
                                    <Ionicons name="flame" size={22} color={Colors.orange500} />
                                    <Text style={styles.streakValue}>{stats.current_streak}</Text>
                                    <Text style={styles.streakLabel}>Current</Text>
                                </View>
                                <View style={styles.streakItem}>
                                    <Ionicons name="trophy" size={22} color={Colors.amber500} />
                                    <Text style={styles.streakValue}>{stats.longest_streak}</Text>
                                    <Text style={styles.streakLabel}>Longest</Text>
                                </View>
                                <View style={styles.streakItem}>
                                    <Ionicons name="trending-up" size={22} color={Colors.emerald500} />
                                    <Text style={styles.streakValue}>{stats.week_avg_steps.toLocaleString()}</Text>
                                    <Text style={styles.streakLabel}>Week Avg</Text>
                                </View>
                                <View style={styles.streakItem}>
                                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                                    <Text style={styles.streakValue}>{stats.week_days_goal_met}/7</Text>
                                    <Text style={styles.streakLabel}>Goal Met</Text>
                                </View>
                            </View>
                        </CardContent>
                    </Card>
                )}

                {/* Weekly Chart */}
                <Card style={styles.chartCard}>
                    <CardContent>
                        <Text style={styles.chartTitle}>This Week</Text>
                        <BarChart
                            data={weeklyData}
                            width={screenWidth - 80}
                            height={180}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: Colors.card,
                                backgroundGradientFrom: Colors.card,
                                backgroundGradientTo: Colors.card,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                                labelColor: () => Colors.mutedForeground,
                                barPercentage: 0.6,
                            }}
                            style={styles.chart}
                            showBarTops={false}
                            fromZero
                        />
                    </CardContent>
                </Card>

                {/* Achievements */}
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achievementsGrid}>
                    {achievements.map((badge) => (
                        <Card key={badge.name} style={styles.achievementCard}>
                            <CardContent style={{ alignItems: 'center', paddingVertical: 14 }}>
                                <Ionicons name="trophy" size={24} color={badge.unlocked ? Colors.amber500 : Colors.border} />
                                <Text style={[styles.achievementText, badge.unlocked && { color: Colors.foreground }]}>{badge.name}</Text>
                            </CardContent>
                        </Card>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showManualInput} onClose={() => setShowManualInput(false)} title="Add Steps Manually">
                <Input label="Number of Steps" placeholder="e.g., 500" value={manualSteps} onChangeText={setManualSteps} keyboardType="numeric" />
                <Button variant="gradient" gradientColors={Gradients.orange} onPress={addManualSteps} style={{ marginTop: 8 }} disabled={adding}>
                    {adding ? 'Adding...' : 'Add Steps'}
                </Button>
            </Modal>

            <Modal visible={showGoalInput} onClose={() => setShowGoalInput(false)} title="Set Daily Goal">
                <Input label="Step Goal" placeholder="e.g., 10000" value={newGoal} onChangeText={setNewGoal} keyboardType="numeric" />
                <Button variant="gradient" gradientColors={Gradients.primary} onPress={updateGoal} style={{ marginTop: 8 }} disabled={adding}>
                    {adding ? 'Updating...' : 'Update Goal'}
                </Button>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
        backgroundColor: Colors.glassBackground, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.foreground },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    mainCard: { marginBottom: 16 },
    progressSection: { alignItems: 'center' },
    circularProgress: { alignItems: 'center', marginBottom: 8 },
    circleOuter: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
    circleInner: { alignItems: 'center' },
    stepCount: { fontSize: 32, fontWeight: '800', color: Colors.foreground, marginTop: 4 },
    goalText: { fontSize: 13, color: Colors.mutedForeground },
    motivational: { fontSize: 14, fontWeight: '600', color: Colors.orange600, marginTop: 12, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
    statItem: { alignItems: 'center', gap: 4 },
    statValue: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
    statLabel: { fontSize: 11, color: Colors.mutedForeground },
    statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
    quickActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    fitCard: { marginBottom: 16 },
    fitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fitInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    fitTitle: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    fitSubtitle: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    streakItem: { alignItems: 'center', flex: 1, gap: 4 },
    streakValue: { fontSize: 16, fontWeight: '700', color: Colors.foreground },
    streakLabel: { fontSize: 10, color: Colors.mutedForeground },
    chartCard: { marginBottom: 20 },
    chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    chart: { borderRadius: BorderRadius.md, marginLeft: -16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    achievementCard: { width: ACHV_WIDTH },
    achievementText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, marginTop: 6, textAlign: 'center' },
});

export default StepTrackerScreen;
