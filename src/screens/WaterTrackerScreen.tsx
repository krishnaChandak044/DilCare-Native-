import { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions,
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

const DAILY_GOAL = 8;
const GLASS_SIZE = 250; // ml

const WaterTrackerScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [glasses, setGlasses] = useState(0);
    const [_streak, _setStreak] = useState(0);
    const [remindersEnabled, setRemindersEnabled] = useState(false);

    const progressPercent = Math.min((glasses / DAILY_GOAL) * 100, 100);
    const totalMl = glasses * GLASS_SIZE;

    const addGlass = async () => {
        if (glasses < 20) {
            setGlasses(prev => prev + 1);
            await waterService.addGlass();
        }
    };

    const removeGlass = async () => {
        if (glasses > 0) {
            setGlasses(prev => prev - 1);
            await waterService.removeGlass();
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
        if (glasses >= DAILY_GOAL) return '🎉 Daily goal achieved! Great job!';
        if (glasses >= 6) return '💪 Almost there! Just a few more glasses!';
        if (glasses >= 4) return '👍 Good progress! Keep drinking!';
        if (glasses >= 2) return '🌊 Nice start! Stay hydrated!';
        return '🌅 Start hydrating your day!';
    };

    const hydration = getHydrationLevel();

    const achievements = [
        { id: '1', name: 'First Glass', icon: '🥤', unlocked: glasses >= 1 },
        { id: '2', name: 'Half Way', icon: '🌊', unlocked: glasses >= DAILY_GOAL / 2 },
        { id: '3', name: 'Goal Reached', icon: '🏆', unlocked: glasses >= DAILY_GOAL },
        { id: '4', name: 'Overachiever', icon: '⭐', unlocked: glasses > DAILY_GOAL },
    ];

    const healthBenefits = [
        { icon: 'heart', color: Colors.destructive, title: 'Heart Health', desc: 'Keeps blood flowing smoothly' },
        { icon: 'brain', color: Colors.purple500, title: 'Brain Function', desc: 'Improves focus and memory' },
        { icon: 'flash', color: Colors.amber500, title: 'Energy Boost', desc: 'Reduces fatigue and tiredness' },
        { icon: 'fitness', color: Colors.emerald500, title: 'Digestion', desc: 'Aids in nutrient absorption' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Water Tracker</Text>
                <TouchableOpacity onPress={() => setRemindersEnabled(!remindersEnabled)}>
                    <Ionicons name={remindersEnabled ? 'notifications' : 'notifications-outline'} size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Main Progress */}
                <Card style={styles.mainCard}>
                    <CardContent>
                        <View style={styles.progressCenter}>
                            <Text style={styles.hydrationEmoji}>{hydration.emoji}</Text>
                            <Text style={styles.glassCount}>{glasses}</Text>
                            <Text style={styles.glassGoal}>/ {DAILY_GOAL} glasses</Text>
                            <Text style={styles.mlCount}>{totalMl} ml</Text>
                            <ProgressBar progress={progressPercent} color={Colors.blue500} height={12} style={{ marginTop: 16, marginBottom: 8 }} />
                            <Badge variant={glasses >= DAILY_GOAL ? 'success' : 'info'}>{hydration.text}</Badge>
                            <Text style={styles.motivational}>{getMotivationalMessage()}</Text>
                        </View>

                        {/* Add/Remove Buttons */}
                        <View style={styles.controlRow}>
                            <TouchableOpacity onPress={removeGlass} style={styles.controlBtn}>
                                <Ionicons name="remove-circle" size={48} color={Colors.destructive} />
                            </TouchableOpacity>
                            <View style={styles.waterAnimation}>
                                <Ionicons name="water" size={48} color={Colors.blue500} />
                            </View>
                            <TouchableOpacity onPress={addGlass} style={styles.controlBtn}>
                                <Ionicons name="add-circle" size={48} color={Colors.blue500} />
                            </TouchableOpacity>
                        </View>
                    </CardContent>
                </Card>

                {/* Quick Add Row */}
                <View style={styles.quickAddRow}>
                    {[1, 2, 3, 4].map(n => (
                        <TouchableOpacity
                            key={n}
                            style={styles.quickAddBtn}
                            onPress={() => setGlasses(prev => Math.min(prev + n, 20))}
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
