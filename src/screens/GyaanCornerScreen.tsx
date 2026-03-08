import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Colors, BorderRadius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { gyaanService } from '../services/api';

interface GyaanTip {
    id: string;
    category: 'nutrition' | 'exercise' | 'meditation' | 'ayurveda';
    title: string;
    description: string;
    content: string;
    duration?: number;
    completed: boolean;
    favorite: boolean;
}

const CATEGORIES = [
    { key: 'all', label: 'All', icon: 'apps', color: Colors.primary },
    { key: 'nutrition', label: 'Nutrition', icon: 'nutrition', color: Colors.emerald500 },
    { key: 'exercise', label: 'Exercise', icon: 'barbell', color: Colors.orange500 },
    { key: 'meditation', label: 'Meditation', icon: 'leaf', color: Colors.purple500 },
    { key: 'ayurveda', label: 'Ayurveda', icon: 'heart', color: Colors.destructive },
];

const GyaanCornerScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [tips, setTips] = useState<GyaanTip[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [timerActive, setTimerActive] = useState<string | null>(null);
    const [timerSeconds, setTimerSeconds] = useState(0);

    const filteredTips = selectedCategory === 'all' ? tips : tips.filter(t => t.category === selectedCategory);

    const toggleComplete = (id: string) => {
        setTips(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        gyaanService.markComplete(id);
    };

    const toggleFavorite = (id: string) => {
        setTips(prev => prev.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t));
        gyaanService.toggleFavorite(id);
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timerActive && timerSeconds > 0) {
            interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
        } else if (timerSeconds === 0 && timerActive) {
            setTimerActive(null);
        }
        return () => clearInterval(interval);
    }, [timerActive, timerSeconds]);

    const startTimer = (id: string, duration: number) => {
        setTimerActive(id);
        setTimerSeconds(duration * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gyaan Corner</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={[styles.categoryChip, selectedCategory === cat.key && { backgroundColor: cat.color }]}
                        onPress={() => setSelectedCategory(cat.key)}
                    >
                        <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color={selectedCategory === cat.key ? Colors.white : cat.color} />
                        <Text style={[styles.categoryText, selectedCategory === cat.key && { color: Colors.white }]}>{cat.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Timer Card - if active */}
                {timerActive && (
                    <Card style={styles.timerCard}>
                        <CardContent>
                            <View style={styles.timerCenter}>
                                <Text style={styles.timerTitle}>🧘 Meditation Timer</Text>
                                <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
                                <ProgressBar
                                    progress={((timerSeconds) / (5 * 60)) * 100}
                                    color={Colors.purple500}
                                    height={6}
                                    style={{ marginTop: 12, width: '80%' }}
                                />
                                <Button variant="secondary" size="sm" onPress={() => { setTimerActive(null); setTimerSeconds(0); }} style={{ marginTop: 12 }}>
                                    Stop
                                </Button>
                            </View>
                        </CardContent>
                    </Card>
                )}

                {/* Empty state or Tips */}
                {filteredTips.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Wellness Tips Coming Soon</Text>
                        <Text style={styles.emptySubtitle}>Connect to get personalized wellness tips for nutrition, exercise, meditation, and ayurveda</Text>

                        {/* Placeholder tips for visual */}
                        <View style={{ width: '100%', marginTop: 24 }}>
                            {[
                                { cat: 'nutrition', title: 'Start Your Day Right', desc: 'A balanced breakfast sets the tone for your day', icon: 'nutrition', color: Colors.emerald500 },
                                { cat: 'exercise', title: '30-Min Walking', desc: 'Daily walking reduces heart disease risk by 35%', icon: 'walk', color: Colors.orange500 },
                                { cat: 'meditation', title: 'Deep Breathing', desc: '5 minutes of deep breathing reduces stress hormones', icon: 'leaf', color: Colors.purple500, timer: 5 },
                                { cat: 'ayurveda', title: 'Warm Water & Turmeric', desc: 'Ancient remedy for immunity and digestion', icon: 'heart', color: Colors.destructive },
                            ].map((tip, i) => (
                                <Card key={i} style={styles.tipCard}>
                                    <CardContent>
                                        <View style={styles.tipRow}>
                                            <View style={[styles.tipIcon, { backgroundColor: tip.color + '15' }]}>
                                                <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={22} color={tip.color} />
                                            </View>
                                            <View style={styles.tipContent}>
                                                <Text style={styles.tipTitle}>{tip.title}</Text>
                                                <Text style={styles.tipDesc}>{tip.desc}</Text>
                                                <View style={styles.tipActions}>
                                                    {tip.timer && (
                                                        <TouchableOpacity
                                                            style={styles.timerBtn}
                                                            onPress={() => startTimer(`placeholder-${i}`, tip.timer!)}
                                                        >
                                                            <Ionicons name="play" size={14} color={Colors.purple500} />
                                                            <Text style={styles.timerBtnText}>{tip.timer} min</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))}
                        </View>
                    </View>
                ) : (
                    filteredTips.map((tip) => (
                        <Card key={tip.id} style={[styles.tipCard, tip.completed && { opacity: 0.6 }]}>
                            <CardContent>
                                <View style={styles.tipRow}>
                                    <View style={[styles.tipIcon, { backgroundColor: CATEGORIES.find(c => c.key === tip.category)?.color + '15' }]}>
                                        <Ionicons name={CATEGORIES.find(c => c.key === tip.category)?.icon as keyof typeof Ionicons.glyphMap || 'book'} size={22} color={CATEGORIES.find(c => c.key === tip.category)?.color} />
                                    </View>
                                    <View style={styles.tipContent}>
                                        <Text style={styles.tipTitle}>{tip.title}</Text>
                                        <Text style={styles.tipDesc}>{tip.description}</Text>
                                        <View style={styles.tipActions}>
                                            <TouchableOpacity onPress={() => toggleComplete(tip.id)}>
                                                <Ionicons name={tip.completed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={tip.completed ? Colors.success : Colors.mutedForeground} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => toggleFavorite(tip.id)}>
                                                <Ionicons name={tip.favorite ? 'star' : 'star-outline'} size={22} color={tip.favorite ? Colors.amber500 : Colors.mutedForeground} />
                                            </TouchableOpacity>
                                            {tip.duration && (
                                                <TouchableOpacity style={styles.timerBtn} onPress={() => startTimer(tip.id, tip.duration!)}>
                                                    <Ionicons name="play" size={14} color={Colors.purple500} />
                                                    <Text style={styles.timerBtnText}>{tip.duration} min</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </CardContent>
                        </Card>
                    ))
                )}
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
    categoryScroll: { maxHeight: 52 },
    categoryContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' },
    categoryChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
        backgroundColor: Colors.secondary,
    },
    categoryText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
    timerCard: { marginBottom: 16, backgroundColor: Colors.purple50 },
    timerCenter: { alignItems: 'center' },
    timerTitle: { fontSize: 16, fontWeight: '700', color: Colors.purple600 },
    timerDisplay: { fontSize: 48, fontWeight: '800', color: Colors.purple600, marginTop: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
    tipCard: { marginBottom: 10 },
    tipRow: { flexDirection: 'row' },
    tipIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    tipContent: { flex: 1 },
    tipTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
    tipDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 4, lineHeight: 18 },
    tipActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    timerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.purple50, borderRadius: BorderRadius.full },
    timerBtnText: { fontSize: 11, fontWeight: '600', color: Colors.purple500 },
});

export default GyaanCornerScreen;
