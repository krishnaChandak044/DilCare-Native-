import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';

const CommunityScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'groups' | 'challenges' | 'notifications'>('leaderboard');

    const tabs = [
        { key: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
        { key: 'groups', label: 'Groups', icon: 'people' },
        { key: 'challenges', label: 'Challenges', icon: 'flag' },
        { key: 'notifications', label: 'Alerts', icon: 'notifications' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key as 'leaderboard' | 'groups' | 'challenges' | 'notifications')}
                    >
                        <Ionicons name={tab.icon as keyof typeof Ionicons.glyphMap} size={16} color={activeTab === tab.key ? Colors.white : Colors.mutedForeground} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'leaderboard' && (
                    <View style={styles.emptyState}>
                        <Ionicons name="trophy-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Leaderboard</Text>
                        <Text style={styles.emptySubtitle}>Connect to see how you rank among friends and family</Text>

                        {/* Placeholder leaderboard visual */}
                        <View style={{ width: '100%', marginTop: 24 }}>
                            {['1st Place', '2nd Place', '3rd Place'].map((_place, i) => (
                                <Card key={i} style={[styles.leaderCard, i === 0 && styles.leaderCardGold]}>
                                    <CardContent>
                                        <View style={styles.leaderRow}>
                                            <View style={[styles.rankCircle, { backgroundColor: [Colors.amber500, Colors.mutedForeground, Colors.orange600][i] + '20' }]}>
                                                <Text style={[styles.rankText, { color: [Colors.amber500, Colors.mutedForeground, Colors.orange600][i] }]}>
                                                    {['🥇', '🥈', '🥉'][i]}
                                                </Text>
                                            </View>
                                            <View style={styles.leaderInfo}>
                                                <Text style={styles.leaderName}>--</Text>
                                                <Text style={styles.leaderSteps}>-- steps</Text>
                                            </View>
                                            <Text style={styles.leaderRank}>#{i + 1}</Text>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'groups' && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Groups</Text>
                        <Text style={styles.emptySubtitle}>Create or join groups to track health together</Text>
                        <Button variant="gradient" gradientColors={Gradients.primary} style={{ marginTop: 16 }}
                            icon={<Ionicons name="add" size={18} color={Colors.white} />}>
                            Create Group
                        </Button>
                    </View>
                )}

                {activeTab === 'challenges' && (
                    <View style={styles.emptyState}>
                        <Ionicons name="flag-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Challenges</Text>
                        <Text style={styles.emptySubtitle}>Join health challenges to stay motivated</Text>

                        {/* Placeholder challenges */}
                        <View style={{ width: '100%', marginTop: 24 }}>
                            {[
                                { title: 'Family 50K Steps', desc: 'Walk 50,000 steps this week as a family', icon: 'footsteps', color: Colors.orange500, progress: 0 },
                                { title: 'Hydration Week', desc: 'Drink 8 glasses daily for 7 days', icon: 'water', color: Colors.blue500, progress: 0 },
                                { title: 'Meditation Master', desc: 'Meditate 5 minutes daily for a week', icon: 'leaf', color: Colors.purple500, progress: 0 },
                            ].map((challenge, i) => (
                                <Card key={i} style={styles.challengeCard}>
                                    <CardContent>
                                        <View style={styles.challengeRow}>
                                            <View style={[styles.challengeIcon, { backgroundColor: challenge.color + '15' }]}>
                                                <Ionicons name={challenge.icon as keyof typeof Ionicons.glyphMap} size={22} color={challenge.color} />
                                            </View>
                                            <View style={styles.challengeContent}>
                                                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                                                <Text style={styles.challengeDesc}>{challenge.desc}</Text>
                                                <ProgressBar progress={challenge.progress} color={challenge.color} height={6} style={{ marginTop: 8 }} />
                                            </View>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'notifications' && (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>Community notifications will appear here</Text>
                    </View>
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
    tabScroll: { maxHeight: 52 },
    tabContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.secondary,
    },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground },
    tabTextActive: { color: Colors.white },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center' },
    leaderCard: { marginBottom: 8 },
    leaderCardGold: { borderWidth: 1, borderColor: Colors.amber500 + '30' },
    leaderRow: { flexDirection: 'row', alignItems: 'center' },
    rankCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { fontSize: 18 },
    leaderInfo: { flex: 1 },
    leaderName: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    leaderSteps: { fontSize: 12, color: Colors.mutedForeground },
    leaderRank: { fontSize: 16, fontWeight: '700', color: Colors.mutedForeground },
    challengeCard: { marginBottom: 10 },
    challengeRow: { flexDirection: 'row' },
    challengeIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    challengeContent: { flex: 1 },
    challengeTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
    challengeDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
});

export default CommunityScreen;
