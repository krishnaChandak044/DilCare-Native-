import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';
import {
    communityService,
    Leaderboard, LeaderboardEntry,
    CommunityGroupData, ChallengeData,
    CommunityNotificationData,
} from '../services/api';

type TabKey = 'leaderboard' | 'groups' | 'challenges' | 'notifications';

const CommunityScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
    const [lbPeriod, setLbPeriod] = useState<'today' | 'week' | 'month'>('week');

    // Groups
    const [groups, setGroups] = useState<CommunityGroupData[]>([]);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    // Challenges
    const [challenges, setChallenges] = useState<ChallengeData[]>([]);

    // Notifications
    const [notifications, setNotifications] = useState<CommunityNotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // ── Data fetching ──────────────────────────────────────────
    const fetchLeaderboard = useCallback(async () => {
        const res = await communityService.getLeaderboard(lbPeriod);
        if (res.data) setLeaderboard(res.data);
    }, [lbPeriod]);

    const fetchGroups = useCallback(async () => {
        const res = await communityService.getGroups();
        if (res.data) setGroups(res.data);
    }, []);

    const fetchChallenges = useCallback(async () => {
        const res = await communityService.getChallenges({ status: 'active' });
        if (res.data) setChallenges(res.data);
    }, []);

    const fetchNotifications = useCallback(async () => {
        const [notifRes, countRes] = await Promise.all([
            communityService.getNotifications(),
            communityService.getUnreadCount(),
        ]);
        if (notifRes.data) setNotifications(notifRes.data);
        if (countRes.data) setUnreadCount(countRes.data.unread_count);
    }, []);

    const fetchTabData = useCallback(async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'leaderboard': await fetchLeaderboard(); break;
                case 'groups': await fetchGroups(); break;
                case 'challenges': await fetchChallenges(); break;
                case 'notifications': await fetchNotifications(); break;
            }
        } finally {
            setLoading(false);
        }
    }, [activeTab, fetchLeaderboard, fetchGroups, fetchChallenges, fetchNotifications]);

    useEffect(() => { fetchTabData(); }, [fetchTabData]);

    // Refetch leaderboard when period changes
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            fetchLeaderboard();
        }
    }, [lbPeriod, fetchLeaderboard, activeTab]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTabData();
        setRefreshing(false);
    }, [fetchTabData]);

    // ── Actions ────────────────────────────────────────────────
    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) return;
        const res = await communityService.joinGroup(inviteCode.trim());
        if (res.error) {
            Alert.alert('Error', res.error);
        } else {
            setShowJoinModal(false);
            setInviteCode('');
            fetchGroups();
        }
    };

    const handleJoinChallenge = async (id: string) => {
        const res = await communityService.joinChallenge(id);
        if (res.error) {
            Alert.alert('Error', res.error);
        } else {
            fetchChallenges();
        }
    };

    const handleMarkRead = async (id: string) => {
        await communityService.markNotificationRead(id);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        await communityService.markAllNotificationsRead();
        fetchNotifications();
    };

    // ── Rendering helpers ──────────────────────────────────────
    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return Colors.amber500;
        if (rank === 2) return Colors.mutedForeground;
        if (rank === 3) return Colors.orange600;
        return Colors.mutedForeground;
    };

    const getChallengeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'steps': return 'footsteps';
            case 'water': return 'water';
            case 'medicine': return 'medkit';
            default: return 'flag';
        }
    };

    const formatSteps = (steps: number) =>
        steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`;

    const tabs = [
        { key: 'leaderboard' as TabKey, label: 'Leaderboard', icon: 'trophy' },
        { key: 'groups' as TabKey, label: 'Groups', icon: 'people' },
        { key: 'challenges' as TabKey, label: 'Challenges', icon: 'flag' },
        { key: 'notifications' as TabKey, label: 'Alerts', icon: 'notifications', badge: unreadCount },
    ];

    // ── Skeleton loaders ───────────────────────────────────────
    const renderSkeleton = () => (
        <View style={{ gap: 10, paddingTop: 8 }}>
            {[1, 2, 3].map(i => (
                <Skeleton key={i} width="100%" height={72} borderRadius={BorderRadius.lg} />
            ))}
        </View>
    );

    // ── Leaderboard tab ────────────────────────────────────────
    const renderLeaderboard = () => {
        if (loading) return renderSkeleton();

        return (
            <View>
                {/* Period selector */}
                <View style={styles.periodRow}>
                    {(['today', 'week', 'month'] as const).map(p => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.periodChip, lbPeriod === p && styles.periodChipActive]}
                            onPress={() => setLbPeriod(p)}
                        >
                            <Text style={[styles.periodText, lbPeriod === p && styles.periodTextActive]}>
                                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* My rank card */}
                {leaderboard && (
                    <Card style={styles.myRankCard}>
                        <CardContent>
                            <Text style={styles.myRankLabel}>Your Rank</Text>
                            <View style={styles.myRankRow}>
                                <Text style={styles.myRankNumber}>
                                    {leaderboard.my_rank ? `#${leaderboard.my_rank}` : '--'}
                                </Text>
                                <View style={styles.myRankStats}>
                                    <Text style={styles.myRankSteps}>
                                        {formatSteps(leaderboard.my_steps)} steps
                                    </Text>
                                    <Text style={styles.myRankPeriod}>{leaderboard.period_label}</Text>
                                </View>
                            </View>
                        </CardContent>
                    </Card>
                )}

                {/* Leaderboard entries */}
                {(!leaderboard || leaderboard.entries.length === 0) ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="trophy-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Data Yet</Text>
                        <Text style={styles.emptySubtitle}>Start tracking steps to appear on the leaderboard</Text>
                    </View>
                ) : (
                    leaderboard.entries.map((entry: LeaderboardEntry) => (
                        <Card
                            key={entry.user_id}
                            style={[
                                styles.leaderCard,
                                entry.rank === 1 && styles.leaderCardGold,
                                entry.is_self && styles.leaderCardSelf,
                            ]}
                        >
                            <CardContent>
                                <View style={styles.leaderRow}>
                                    <View style={[styles.rankCircle, { backgroundColor: getRankColor(entry.rank) + '20' }]}>
                                        <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
                                            {getRankEmoji(entry.rank)}
                                        </Text>
                                    </View>
                                    <View style={styles.leaderInfo}>
                                        <Text style={styles.leaderName}>
                                            {entry.user_name}{entry.is_self ? ' (You)' : ''}
                                        </Text>
                                        <Text style={styles.leaderSteps}>
                                            {formatSteps(entry.total_steps)} steps · {entry.days_active}d active
                                        </Text>
                                    </View>
                                    <Text style={styles.leaderRank}>#{entry.rank}</Text>
                                </View>
                            </CardContent>
                        </Card>
                    ))
                )}
            </View>
        );
    };

    // ── Groups tab ─────────────────────────────────────────────
    const renderGroups = () => {
        if (loading) return renderSkeleton();

        return (
            <View>
                {/* Action buttons */}
                <View style={styles.groupActions}>
                    <Button
                        variant="gradient"
                        gradientColors={Gradients.primary}
                        style={{ flex: 1, marginRight: 8 }}
                        icon={<Ionicons name="add" size={18} color={Colors.white} />}
                        onPress={() => Alert.alert('Coming Soon', 'Group creation screen will be available soon.')}
                    >
                        Create Group
                    </Button>
                    <Button
                        variant="outline"
                        style={{ flex: 1 }}
                        icon={<Ionicons name="enter-outline" size={18} color={Colors.primary} />}
                        onPress={() => setShowJoinModal(!showJoinModal)}
                    >
                        Join Group
                    </Button>
                </View>

                {/* Join by invite code */}
                {showJoinModal && (
                    <Card style={styles.joinCard}>
                        <CardContent>
                            <Text style={styles.joinTitle}>Enter Invite Code</Text>
                            <TextInput
                                style={styles.joinInput}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                placeholder="e.g. AB12CD34"
                                placeholderTextColor={Colors.mutedForeground}
                                autoCapitalize="characters"
                                maxLength={8}
                            />
                            <Button variant="gradient" gradientColors={Gradients.primary} onPress={handleJoinGroup}>
                                Join
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Group list */}
                {groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Groups</Text>
                        <Text style={styles.emptySubtitle}>Create or join a group to track health together</Text>
                    </View>
                ) : (
                    groups.map(group => (
                        <Card key={group.id} style={styles.groupCard}>
                            <CardContent>
                                <View style={styles.groupRow}>
                                    <View style={[styles.groupIcon, { backgroundColor: group.color + '15' }]}>
                                        <Ionicons
                                            name={(group.icon || 'people') as keyof typeof Ionicons.glyphMap}
                                            size={22}
                                            color={group.color}
                                        />
                                    </View>
                                    <View style={styles.groupInfo}>
                                        <Text style={styles.groupName}>{group.name}</Text>
                                        <Text style={styles.groupMeta}>
                                            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                                            {group.is_member && ' · Joined'}
                                        </Text>
                                        {group.description ? (
                                            <Text style={styles.groupDesc} numberOfLines={1}>{group.description}</Text>
                                        ) : null}
                                    </View>
                                    {group.is_member && (
                                        <View style={[styles.badge, { backgroundColor: Colors.emerald500 + '20' }]}>
                                            <Text style={[styles.badgeText, { color: Colors.emerald500 }]}>
                                                {group.my_role === 'admin' ? 'Admin' : 'Member'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {group.is_member && group.invite_code && (
                                    <View style={styles.inviteRow}>
                                        <Text style={styles.inviteLabel}>Invite Code:</Text>
                                        <Text style={styles.inviteCode}>{group.invite_code}</Text>
                                    </View>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </View>
        );
    };

    // ── Challenges tab ─────────────────────────────────────────
    const renderChallenges = () => {
        if (loading) return renderSkeleton();

        return (
            <View>
                {challenges.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="flag-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Active Challenges</Text>
                        <Text style={styles.emptySubtitle}>Create or join challenges to stay motivated</Text>
                        <Button
                            variant="gradient"
                            gradientColors={Gradients.primary}
                            style={{ marginTop: 16 }}
                            icon={<Ionicons name="add" size={18} color={Colors.white} />}
                            onPress={() => Alert.alert('Coming Soon', 'Challenge creation screen will be available soon.')}
                        >
                            Create Challenge
                        </Button>
                    </View>
                ) : (
                    challenges.map(challenge => (
                        <Card key={challenge.id} style={styles.challengeCard}>
                            <CardContent>
                                <View style={styles.challengeRow}>
                                    <View style={[styles.challengeIcon, { backgroundColor: (challenge.color || Colors.orange500) + '15' }]}>
                                        <Ionicons
                                            name={getChallengeIcon(challenge.challenge_type)}
                                            size={22}
                                            color={challenge.color || Colors.orange500}
                                        />
                                    </View>
                                    <View style={styles.challengeContent}>
                                        <View style={styles.challengeHeader}>
                                            <Text style={styles.challengeTitle}>{challenge.title}</Text>
                                            {challenge.days_remaining > 0 && (
                                                <Text style={styles.challengeDays}>
                                                    {challenge.days_remaining}d left
                                                </Text>
                                            )}
                                        </View>
                                        {challenge.description ? (
                                            <Text style={styles.challengeDesc} numberOfLines={2}>{challenge.description}</Text>
                                        ) : null}

                                        {/* Progress */}
                                        <View style={styles.challengeProgress}>
                                            <ProgressBar
                                                progress={challenge.is_joined ? challenge.my_progress_percent / 100 : 0}
                                                color={challenge.color || Colors.orange500}
                                                height={6}
                                            />
                                            <Text style={styles.challengeProgressText}>
                                                {challenge.is_joined
                                                    ? `${formatSteps(challenge.my_progress)} / ${formatSteps(challenge.target_value)} ${challenge.target_unit}`
                                                    : `${challenge.participant_count} participant${challenge.participant_count !== 1 ? 's' : ''}`
                                                }
                                            </Text>
                                        </View>

                                        {/* Join button */}
                                        {!challenge.is_joined && (
                                            <Button
                                                variant="outline"
                                                style={{ marginTop: 8, alignSelf: 'flex-start' }}
                                                onPress={() => handleJoinChallenge(challenge.id)}
                                            >
                                                Join Challenge
                                            </Button>
                                        )}
                                    </View>
                                </View>
                            </CardContent>
                        </Card>
                    ))
                )}
            </View>
        );
    };

    // ── Notifications tab ──────────────────────────────────────
    const renderNotifications = () => {
        if (loading) return renderSkeleton();

        return (
            <View>
                {notifications.length > 0 && unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllRead} onPress={handleMarkAllRead}>
                        <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                        <Text style={styles.markAllReadText}>Mark all as read</Text>
                    </TouchableOpacity>
                )}

                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>Community notifications will appear here</Text>
                    </View>
                ) : (
                    notifications.map(notif => (
                        <TouchableOpacity
                            key={notif.id}
                            onPress={() => !notif.is_read && handleMarkRead(notif.id)}
                            activeOpacity={0.7}
                        >
                            <Card style={[styles.notifCard, !notif.is_read && styles.notifCardUnread]}>
                                <CardContent>
                                    <View style={styles.notifRow}>
                                        <View style={[styles.notifDot, { backgroundColor: notif.is_read ? 'transparent' : Colors.primary }]} />
                                        <View style={styles.notifContent}>
                                            <Text style={[styles.notifTitle, !notif.is_read && { fontWeight: '700' }]}>
                                                {notif.title}
                                            </Text>
                                            {notif.message ? (
                                                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                                            ) : null}
                                            <Text style={styles.notifTime}>
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        );
    };

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
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons name={tab.icon as keyof typeof Ionicons.glyphMap} size={16} color={activeTab === tab.key ? Colors.white : Colors.mutedForeground} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        {tab.badge && tab.badge > 0 ? (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {activeTab === 'leaderboard' && renderLeaderboard()}
                {activeTab === 'groups' && renderGroups()}
                {activeTab === 'challenges' && renderChallenges()}
                {activeTab === 'notifications' && renderNotifications()}
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
    tabBadge: {
        backgroundColor: Colors.destructive, borderRadius: 10, minWidth: 18, height: 18,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginLeft: 2,
    },
    tabBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center' },

    // ── Leaderboard ────────
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    periodChip: {
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full,
        backgroundColor: Colors.secondary,
    },
    periodChipActive: { backgroundColor: Colors.primary },
    periodText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground },
    periodTextActive: { color: Colors.white },
    myRankCard: { marginBottom: 12, borderWidth: 1, borderColor: Colors.primary + '30' },
    myRankLabel: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 4 },
    myRankRow: { flexDirection: 'row', alignItems: 'center' },
    myRankNumber: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginRight: 16 },
    myRankStats: {},
    myRankSteps: { fontSize: 16, fontWeight: '600', color: Colors.foreground },
    myRankPeriod: { fontSize: 12, color: Colors.mutedForeground },
    leaderCard: { marginBottom: 8 },
    leaderCardGold: { borderWidth: 1, borderColor: Colors.amber500 + '30' },
    leaderCardSelf: { borderWidth: 1, borderColor: Colors.primary + '30' },
    leaderRow: { flexDirection: 'row', alignItems: 'center' },
    rankCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { fontSize: 18 },
    leaderInfo: { flex: 1 },
    leaderName: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    leaderSteps: { fontSize: 12, color: Colors.mutedForeground },
    leaderRank: { fontSize: 16, fontWeight: '700', color: Colors.mutedForeground },

    // ── Groups ─────────────
    groupActions: { flexDirection: 'row', marginBottom: 12 },
    joinCard: { marginBottom: 12 },
    joinTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
    joinInput: {
        borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: Colors.foreground,
        marginBottom: 10, backgroundColor: Colors.background, letterSpacing: 2,
    },
    groupCard: { marginBottom: 8 },
    groupRow: { flexDirection: 'row', alignItems: 'center' },
    groupIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    groupInfo: { flex: 1 },
    groupName: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
    groupMeta: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    groupDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
    badgeText: { fontSize: 11, fontWeight: '600' },
    inviteRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8,
        borderTopWidth: 0.5, borderTopColor: Colors.border,
    },
    inviteLabel: { fontSize: 12, color: Colors.mutedForeground, marginRight: 6 },
    inviteCode: { fontSize: 14, fontWeight: '700', color: Colors.primary, letterSpacing: 2 },

    //  Challenges 
    challengeCard: { marginBottom: 10 },
    challengeRow: { flexDirection: 'row' },
    challengeIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    challengeContent: { flex: 1 },
    challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    challengeTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
    challengeDays: { fontSize: 11, fontWeight: '600', color: Colors.orange500 },
    challengeDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    challengeProgress: { marginTop: 8 },
    challengeProgressText: { fontSize: 11, color: Colors.mutedForeground, marginTop: 4 },

    // ── Notifications ──────
    markAllRead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10, alignSelf: 'flex-end' },
    markAllReadText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
    notifCard: { marginBottom: 6 },
    notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
    notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
    notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 10 },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 14, fontWeight: '500', color: Colors.foreground },
    notifMessage: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    notifTime: { fontSize: 11, color: Colors.mutedForeground, marginTop: 4 },
});

export default CommunityScreen;
