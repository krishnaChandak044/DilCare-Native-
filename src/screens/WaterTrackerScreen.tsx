import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Colors, BorderRadius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { waterService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const A_GAP = 8;
const ACHV_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - A_GAP * 3) / 4;

interface TodayWater {
    date: string;
    glasses: number;
    goal_glasses: number;
    glass_size_ml: number;
    total_ml: number;
    progress_percent: number;
    goal_reached: boolean;
    streak: number;
    reminder_enabled: boolean;
}

const WaterTrackerScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [waterData, setWaterData] = useState<TodayWater | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await waterService.getWaterData();
            if (res.data) setWaterData(res.data);
        } catch (error) {
            console.error('Failed to fetch water data:', error);
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

    const glasses = waterData?.glasses ?? 0;
    const goalGlasses = waterData?.goal_glasses ?? 8;
    const glassSizeMl = waterData?.glass_size_ml ?? 250;
    const progressPercent = waterData?.progress_percent ?? 0;
    const totalMl = waterData?.total_ml ?? 0;
    const streak = waterData?.streak ?? 0;
    const remindersEnabled = waterData?.reminder_enabled ?? false;

    const addGlass = async (count: number = 1) => {
        if (updating || glasses + count > 30) return;
        
        setUpdating(true);
        // Optimistic update
        setWaterData(prev => prev ? {
            ...prev,
            glasses: prev.glasses + count,
            total_ml: (prev.glasses + count) * prev.glass_size_ml,
            progress_percent: Math.min(((prev.glasses + count) / prev.goal_glasses) * 100, 100),
            goal_reached: (prev.glasses + count) >= prev.goal_glasses,
        } : null);

        try {
            const res = await waterService.addGlass(count);
            if (res.data) setWaterData(res.data);
        } catch (error) {
            console.error('Failed to add glass:', error);
            fetchData(); // Revert on error
        } finally {
            setUpdating(false);
        }
    };

    const removeGlass = async () => {
        if (updating || glasses <= 0) return;
        
        setUpdating(true);
        // Optimistic update
        setWaterData(prev => prev ? {
            ...prev,
            glasses: Math.max(0, prev.glasses - 1),
            total_ml: Math.max(0, prev.glasses - 1) * prev.glass_size_ml,
            progress_percent: Math.min((Math.max(0, prev.glasses - 1) / prev.goal_glasses) * 100, 100),
            goal_reached: Math.max(0, prev.glasses - 1) >= prev.goal_glasses,
        } : null);

        try {
            const res = await waterService.removeGlass(1);
            if (res.data) setWaterData(res.data);
        } catch (error) {
            console.error('Failed to remove glass:', error);
            fetchData(); // Revert on error
        } finally {
            setUpdating(false);
        }
    };

    const getHydrationLevel = () => {
        if (progressPercent >= 100) return { text: 'Fully Hydrated', color: Colors.success, emoji: '💧' };
        if (progressPercent >= 75) return { text: 'Well Hydrated', color: Colors.emerald500, emoji: '💦' };
        if (progressPercent >= 50) return { text: 'Moderate', color: Colors.warning, emoji: '🌊' };
        if (progressPercent >= 25) return { text: 'Low', color: Colors.orange500, emoji: '⚠️' };
        return { text: 'Dehydrated', color: Colors.destructive, emoji: '🔴' };
    };

    const getMotivationalMessage = () => {
        if (glasses >= goalGlasses) return '🎉 Daily goal achieved! Great job!';
        if (glasses >= goalGlasses * 0.75) return '💪 Almost there! Just a few more glasses!';
        if (glasses >= goalGlasses * 0.5) return '👍 Good progress! Keep drinking!';
        if (glasses >= goalGlasses * 0.25) return '🌊 Nice start! Stay hydrated!';
        return '🌅 Start hydrating your day!';
    };

    const hydration = getHydrationLevel();

    const achievements = [
        { id: '1', name: 'First Glass', icon: '🥤', unlocked: glasses >= 1 },
        { id: '2', name: 'Half Way', icon: '🌊', unlocked: glasses >= goalGlasses / 2 },
        { id: '3', name: 'Goal Reached', icon: '🏆', unlocked: glasses >= goalGlasses },
        { id: '4', name: 'Overachiever', icon: '⭐', unlocked: glasses > goalGlasses },
    ];

    const healthBenefits = [
        { icon: 'heart', color: Colors.destructive, title: 'Heart Health', desc: 'Keeps blood flowing smoothly' },
        { icon: 'brain', color: Colors.purple500, title: 'Brain Function', desc: 'Improves focus and memory' },
        { icon: 'flash', color: Colors.amber500, title: 'Energy Boost', desc: 'Reduces fatigue and tiredness' },
        { icon: 'fitness', color: Colors.emerald500, title: 'Digestion', desc: 'Aids in nutrient absorption' },
    ];

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Water Tracker</Text>
                <View>
                    <Ionicons name={remindersEnabled ? 'notifications' : 'notifications-outline'} size={24} color={remindersEnabled ? Colors.primary : Colors.mutedForeground} />
                </View>
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Streak Banner */}
                {streak > 0 && (
                    <Card style={styles.streakCard}>
                        <CardContent>
                            <View style={styles.streakRow}>
                                <Text style={styles.streakEmoji}>🔥</Text>
                                <View>
                                    <Text style={styles.streakValue}>{streak} Day Streak!</Text>
                                    <Text style={styles.streakLabel}>Keep it up!</Text>
                                </View>
                            </View>
                        </CardContent>
                    </Card>
                )}

                {/* Main Progress */}
                <Card style={styles.mainCard}>
                    <CardContent>
                        <View style={styles.progressCenter}>
                            <Text style={styles.hydrationEmoji}>{hydration.emoji}</Text>
                            <Text style={styles.glassCount}>{glasses}</Text>
                            <Text style={styles.glassGoal}>/ {goalGlasses} glasses</Text>
                            <Text style={styles.mlCount}>{totalMl} ml</Text>
                            <ProgressBar progress={progressPercent} color={Colors.blue500} height={12} style={{ marginTop: 16, marginBottom: 8 }} />
                            <Badge variant={glasses >= goalGlasses ? 'success' : 'info'}>{hydration.text}</Badge>
                            <Text style={styles.motivational}>{getMotivationalMessage()}</Text>
                        </View>

                        {/* Add/Remove Buttons */}
                        <View style={styles.controlRow}>
                            <TouchableOpacity onPress={removeGlass} style={styles.controlBtn} disabled={updating}>
                                <Ionicons name="remove-circle" size={48} color={updating ? Colors.mutedForeground : Colors.destructive} />
                            </TouchableOpacity>
                            <View style={styles.waterAnimation}>
                                <Ionicons name="water" size={48} color={Colors.blue500} />
                            </View>
                            <TouchableOpacity onPress={() => addGlass(1)} style={styles.controlBtn} disabled={updating}>
                                <Ionicons name="add-circle" size={48} color={updating ? Colors.mutedForeground : Colors.blue500} />
                            </TouchableOpacity>
                        </View>
                    </CardContent>
                </Card>

                {/* Quick Add Row */}
                <View style={styles.quickAddRow}>
                    {[1, 2, 3, 4].map(n => (
                        <TouchableOpacity
                            key={n}
                            style={[styles.quickAddBtn, updating && { opacity: 0.5 }]}
                            onPress={() => addGlass(n)}
                            disabled={updating}
                        >
                            <Text style={styles.quickAddText}>+{n} 🥤</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Achievements */}
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achievementsRow}>
                    {achievements.map((a) => (
                        <Card key={a.id} style={[styles.achievementCard, !a.unlocked && { opacity: 0.4 }]}>
                            <CardContent style={{ alignItems: 'center', paddingVertical: 12 }}>
                                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                                <Text style={styles.achievementName}>{a.name}</Text>
                                {a.unlocked && <Ionicons name="checkmark-circle" size={14} color={Colors.success} />}
                            </CardContent>
                        </Card>
                    ))}
                </View>

                {/* Health Benefits */}
                <Text style={styles.sectionTitle}>Why Stay Hydrated?</Text>
                {healthBenefits.map((benefit, index) => (
                    <Card key={index} style={styles.benefitCard}>
                        <CardContent>
                            <View style={styles.benefitRow}>
                                <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '15' }]}>
                                    <Ionicons name={benefit.icon as keyof typeof Ionicons.glyphMap} size={20} color={benefit.color} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                    <Text style={styles.benefitDesc}>{benefit.desc}</Text>
                                </View>
                            </View>
                        </CardContent>
                    </Card>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
        backgroundColor: Colors.glassBackground, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.foreground },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    streakCard: { marginBottom: 12, backgroundColor: Colors.warning + '15' },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakEmoji: { fontSize: 32 },
    streakValue: { fontSize: 16, fontWeight: '700', color: Colors.amber500 },
    streakLabel: { fontSize: 12, color: Colors.amber500 },
    mainCard: { marginBottom: 16 },
    progressCenter: { alignItems: 'center' },
    hydrationEmoji: { fontSize: 40 },
    glassCount: { fontSize: 48, fontWeight: '800', color: Colors.foreground, marginTop: 8 },
    glassGoal: { fontSize: 14, color: Colors.mutedForeground },
    mlCount: { fontSize: 13, color: Colors.blue500, fontWeight: '600', marginTop: 4 },
    motivational: { fontSize: 14, fontWeight: '600', color: Colors.blue600, marginTop: 10, textAlign: 'center' },
    controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 20 },
    controlBtn: { padding: 4 },
    waterAnimation: { padding: 8 },
    quickAddRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    quickAddBtn: { flex: 1, paddingVertical: 10, backgroundColor: Colors.blue50, borderRadius: BorderRadius.md, alignItems: 'center' },
    quickAddText: { fontSize: 13, fontWeight: '600', color: Colors.blue600 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    achievementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    achievementCard: { width: ACHV_WIDTH },
    achievementName: { fontSize: 9, fontWeight: '600', color: Colors.foreground, marginTop: 4, textAlign: 'center' },
    benefitCard: { marginBottom: 8 },
    benefitRow: { flexDirection: 'row', alignItems: 'center' },
    benefitIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    benefitTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
    benefitDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
});

export default WaterTrackerScreen;
