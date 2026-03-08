import { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions,
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
import { stepService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const G_GAP = 10;
const ACHV_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - G_GAP) / 2;

const StepTrackerScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [steps, setSteps] = useState(0);
    const [goal, setGoal] = useState(10000);
    const [showManualInput, setShowManualInput] = useState(false);
    const [showGoalInput, setShowGoalInput] = useState(false);
    const [manualSteps, setManualSteps] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [googleFitConnected, setGoogleFitConnected] = useState(false);
    const screenWidth = Dimensions.get('window').width;

    const progressPercent = Math.min((steps / goal) * 100, 100);
    const caloriesBurned = Math.round(steps * 0.04);
    const distanceKm = (steps * 0.000762).toFixed(1);
    const activeMinutes = Math.round(steps / 100);

    const addManualSteps = async () => {
        const num = parseInt(manualSteps);
        if (isNaN(num) || num <= 0) return;
        setSteps(prev => prev + num);
        setManualSteps('');
        setShowManualInput(false);
        await stepService.addManualSteps(num);
    };

    const updateGoal = async () => {
        const num = parseInt(newGoal);
        if (isNaN(num) || num <= 0) return;
        setGoal(num);
        setNewGoal('');
        setShowGoalInput(false);
        await stepService.updateStepGoal(num);
    };

    const getMotivationalMessage = () => {
        if (progressPercent >= 100) return '🎉 Goal achieved! Amazing work!';
        if (progressPercent >= 75) return '🔥 Almost there! Keep pushing!';
        if (progressPercent >= 50) return '💪 Great progress! Halfway done!';
        if (progressPercent >= 25) return '👣 Good start! Keep moving!';
        return '🌅 Start your day with a walk!';
    };

    const weeklyData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, steps > 0 ? steps : 0] }],
    };

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

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                                <Text style={styles.statValue}>{caloriesBurned}</Text>
                                <Text style={styles.statLabel}>Calories</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="map" size={18} color={Colors.blue500} />
                                <Text style={styles.statValue}>{distanceKm}</Text>
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
                        onPress={() => setSteps(prev => prev + 100)}
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

                {/* Google Fit Connection */}
                <Card style={styles.fitCard}>
                    <CardContent>
                        <View style={styles.fitRow}>
                            <View style={styles.fitInfo}>
                                <Ionicons name="fitness" size={24} color={googleFitConnected ? Colors.success : Colors.mutedForeground} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.fitTitle}>Google Fit</Text>
                                    <Text style={styles.fitSubtitle}>
                                        {googleFitConnected ? 'Connected & syncing' : 'Connect to auto-sync steps'}
                                    </Text>
                                </View>
                            </View>
                            <Button
                                variant={googleFitConnected ? 'secondary' : 'primary'}
                                size="sm"
                                onPress={() => setGoogleFitConnected(!googleFitConnected)}
                            >
                                {googleFitConnected ? 'Disconnect' : 'Connect'}
                            </Button>
                        </View>
                    </CardContent>
                </Card>

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
                    {['First Steps', '5K Steps', '10K Steps', 'Week Streak'].map((badge, i) => (
                        <Card key={badge} style={styles.achievementCard}>
                            <CardContent style={{ alignItems: 'center', paddingVertical: 14 }}>
                                <Ionicons name="trophy" size={24} color={steps > 0 && i === 0 ? Colors.amber500 : Colors.border} />
                                <Text style={[styles.achievementText, steps > 0 && i === 0 && { color: Colors.foreground }]}>{badge}</Text>
                            </CardContent>
                        </Card>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showManualInput} onClose={() => setShowManualInput(false)} title="Add Steps Manually">
                <Input label="Number of Steps" placeholder="e.g., 500" value={manualSteps} onChangeText={setManualSteps} keyboardType="numeric" />
                <Button variant="gradient" gradientColors={Gradients.orange} onPress={addManualSteps} style={{ marginTop: 8 }}>Add Steps</Button>
            </Modal>

            <Modal visible={showGoalInput} onClose={() => setShowGoalInput(false)} title="Set Daily Goal">
                <Input label="Step Goal" placeholder="e.g., 10000" value={newGoal} onChangeText={setNewGoal} keyboardType="numeric" />
                <Button variant="gradient" gradientColors={Gradients.primary} onPress={updateGoal} style={{ marginTop: 8 }}>Update Goal</Button>
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
    chartCard: { marginBottom: 20 },
    chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    chart: { borderRadius: BorderRadius.md, marginLeft: -16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    achievementCard: { width: ACHV_WIDTH },
    achievementText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, marginTop: 6, textAlign: 'center' },
});

export default StepTrackerScreen;
