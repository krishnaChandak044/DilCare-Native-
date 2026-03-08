import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { familyService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const HEALTH_GAP = 8;
const HEALTH_ITEM_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - 40 - HEALTH_GAP) / 2;

interface LinkedParent {
    id: string; name: string; linkCode: string; relationship: string;
    healthData: {
        bloodPressure?: { systolic: number; diastolic: number };
        bloodSugar?: number;
        stepsToday?: number;
        waterIntake?: number;
        medicinesTaken?: number;
        medicinesTotal?: number;
    };
    alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }>;
}

const ChildDashboardScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [linkedParents, setLinkedParents] = useState<LinkedParent[]>([]);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkCode, setLinkCode] = useState('');

    const handleLinkParent = async () => {
        if (!linkCode.trim() || linkCode.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter a 6-character link code');
            return;
        }
        // API call placeholder
        await familyService.linkParent(linkCode);
        Alert.alert('Linking...', 'Parent linking will work after backend integration');
        setLinkCode('');
        setShowLinkModal(false);
    };

    const handleUnlinkParent = (parentCode: string) => {
        Alert.alert('Unlink Parent', 'Are you sure you want to unlink this parent?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Unlink', style: 'destructive',
                onPress: () => {
                    setLinkedParents(prev => prev.filter(p => p.linkCode !== parentCode));
                    familyService.unlinkParent(parentCode);
                },
            },
        ]);
    };

    const getRelationEmoji = (rel: string) => {
        const map: Record<string, string> = { father: '👨', mother: '👩', grandfather: '👴', grandmother: '👵' };
        return map[rel.toLowerCase()] || '👤';
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="heart" size={20} color={Colors.pink500} />
                    <Text style={styles.headerTitle}>Family Dashboard</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLinkModal(true)}>
                    <Ionicons name="person-add" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Info Card */}
                <Card style={styles.infoCard}>
                    <CardContent>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="heart-circle" size={28} color={Colors.pink500} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoTitle}>Monitor Your Parents' Health</Text>
                                <Text style={styles.infoDesc}>
                                    Link your parents' DilCare accounts using their unique code to see their health data here.
                                </Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {linkedParents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIllustration}>
                            <Ionicons name="people-outline" size={80} color={Colors.border} />
                        </View>
                        <Text style={styles.emptyTitle}>No Parents Linked</Text>
                        <Text style={styles.emptySubtitle}>
                            Ask your parents for their DilCare link code and enter it here to start monitoring their health.
                        </Text>
                        <Button
                            variant="gradient"
                            gradientColors={Gradients.primary}
                            onPress={() => setShowLinkModal(true)}
                            style={{ marginTop: 20 }}
                            icon={<Ionicons name="link" size={18} color={Colors.white} />}
                        >
                            Link a Parent
                        </Button>

                        {/* How it Works */}
                        <View style={styles.howItWorks}>
                            <Text style={styles.howTitle}>How it works</Text>
                            {[
                                { step: '1', text: 'Ask your parent to open their DilCare Profile', icon: 'person' },
                                { step: '2', text: 'They will find their unique 6-digit code', icon: 'key' },
                                { step: '3', text: 'Enter that code here to link & monitor', icon: 'link' },
                            ].map((item, i) => (
                                <View key={i} style={styles.howStep}>
                                    <View style={styles.stepCircle}>
                                        <Text style={styles.stepNumber}>{item.step}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{item.text}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    linkedParents.map((parent) => (
                        <Card key={parent.id} style={styles.parentCard}>
                            <CardContent>
                                {/* Parent Header */}
                                <View style={styles.parentHeader}>
                                    <View style={styles.parentInfo}>
                                        <Text style={styles.parentEmoji}>{getRelationEmoji(parent.relationship)}</Text>
                                        <View>
                                            <Text style={styles.parentName}>{parent.name}</Text>
                                            <Text style={styles.parentRelation}>{parent.relationship}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => handleUnlinkParent(parent.linkCode)}>
                                        <Ionicons name="close-circle" size={22} color={Colors.destructive} />
                                    </TouchableOpacity>
                                </View>

                                {/* Alerts */}
                                {parent.alerts.length > 0 && (
                                    <View style={styles.alertsContainer}>
                                        {parent.alerts.map((alert, i) => (
                                            <View key={i} style={[styles.alertBadge, { backgroundColor: alert.type === 'danger' ? Colors.red50 : alert.type === 'warning' ? Colors.orange50 : Colors.blue50 }]}>
                                                <Ionicons
                                                    name={alert.type === 'danger' ? 'alert-circle' : alert.type === 'warning' ? 'warning' : 'information-circle'}
                                                    size={14}
                                                    color={alert.type === 'danger' ? Colors.red500 : alert.type === 'warning' ? Colors.orange500 : Colors.blue500}
                                                />
                                                <Text style={[styles.alertText, {
                                                    color: alert.type === 'danger' ? Colors.red600 : alert.type === 'warning' ? Colors.orange600 : Colors.blue600,
                                                }]}>{alert.message}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Health Data Grid */}
                                <View style={styles.healthGrid}>
                                    <View style={styles.healthItem}>
                                        <Ionicons name="heart" size={16} color={Colors.destructive} />
                                        <Text style={styles.healthLabel}>BP</Text>
                                        <Text style={styles.healthValue}>
                                            {parent.healthData.bloodPressure ? `${parent.healthData.bloodPressure.systolic}/${parent.healthData.bloodPressure.diastolic}` : '--'}
                                        </Text>
                                    </View>
                                    <View style={styles.healthItem}>
                                        <Ionicons name="water" size={16} color={Colors.warning} />
                                        <Text style={styles.healthLabel}>Sugar</Text>
                                        <Text style={styles.healthValue}>{parent.healthData.bloodSugar || '--'}</Text>
                                    </View>
                                    <View style={styles.healthItem}>
                                        <Ionicons name="footsteps" size={16} color={Colors.orange500} />
                                        <Text style={styles.healthLabel}>Steps</Text>
                                        <Text style={styles.healthValue}>{parent.healthData.stepsToday || '--'}</Text>
                                    </View>
                                    <View style={styles.healthItem}>
                                        <Ionicons name="medical" size={16} color={Colors.primary} />
                                        <Text style={styles.healthLabel}>Medicine</Text>
                                        <Text style={styles.healthValue}>
                                            {parent.healthData.medicinesTaken !== undefined ? `${parent.healthData.medicinesTaken}/${parent.healthData.medicinesTotal}` : '--'}
                                        </Text>
                                    </View>
                                </View>
                            </CardContent>
                        </Card>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Link Parent Modal */}
            <Modal visible={showLinkModal} onClose={() => setShowLinkModal(false)} title="Link a Parent">
                <View style={styles.linkModalContent}>
                    <Ionicons name="link" size={40} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
                    <Text style={styles.linkModalDesc}>
                        Enter the 6-digit link code from your parent's DilCare Profile page.
                    </Text>
                    <Input
                        label="Link Code"
                        placeholder="e.g., ABC123"
                        value={linkCode}
                        onChangeText={(t) => setLinkCode(t.toUpperCase())}
                        maxLength={6}
                        autoCapitalize="characters"
                        style={{ fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 6 }}
                    />
                    <Button variant="gradient" gradientColors={Gradients.primary} onPress={handleLinkParent} style={{ marginTop: 8 }}>
                        Link Parent
                    </Button>
                </View>
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
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.foreground },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    infoCard: { marginBottom: 16, backgroundColor: Colors.pink500 + '08' },
    infoRow: { flexDirection: 'row', gap: 12 },
    infoIcon: { marginTop: 2 },
    infoTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
    infoDesc: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
    emptyState: { alignItems: 'center', paddingVertical: 24 },
    emptyIllustration: { marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.foreground },
    emptySubtitle: { fontSize: 14, color: Colors.mutedForeground, marginTop: 6, textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 },
    howItWorks: { width: '100%', marginTop: 32, paddingHorizontal: 8 },
    howTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 16 },
    howStep: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    stepNumber: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    stepText: { fontSize: 14, color: Colors.foreground, flex: 1 },
    parentCard: { marginBottom: 16 },
    parentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    parentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    parentEmoji: { fontSize: 28 },
    parentName: { fontSize: 17, fontWeight: '700', color: Colors.foreground },
    parentRelation: { fontSize: 12, color: Colors.mutedForeground },
    alertsContainer: { gap: 6, marginBottom: 14 },
    alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    alertText: { fontSize: 12, fontWeight: '500', flex: 1 },
    healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    healthItem: { width: HEALTH_ITEM_WIDTH, backgroundColor: Colors.secondary, borderRadius: BorderRadius.md, padding: 12, alignItems: 'center', gap: 4 },
    healthLabel: { fontSize: 11, color: Colors.mutedForeground, fontWeight: '500' },
    healthValue: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
    linkModalContent: {},
    linkModalDesc: { fontSize: 14, color: Colors.mutedForeground, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
});

export default ChildDashboardScreen;
