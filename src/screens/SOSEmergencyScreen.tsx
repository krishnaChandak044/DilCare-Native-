import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Linking, Alert, Animated, Dimensions,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { Colors, Gradients, Shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { sosService, EmergencyContactData } from '../services/api';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const CARD_GAP = 10;
const EMERG_CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;

const SOSEmergencyScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [contacts, setContacts] = useState<EmergencyContactData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRelation, setNewRelation] = useState('');
    const [saving, setSaving] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdTimer = useRef<ReturnType<typeof setInterval>>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // ── fetch contacts ──────────────────────────────────────────────────────
    const fetchContacts = useCallback(async () => {
        const res = await sosService.getEmergencyContacts();
        if (res.data) setContacts(res.data);
    }, []);

    useEffect(() => {
        fetchContacts().finally(() => setLoading(false));
    }, [fetchContacts]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchContacts();
        setRefreshing(false);
    };

    // Pulsing animation for SOS button
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (holdTimer.current) clearInterval(holdTimer.current);
        };
    }, []);

    const handleEmergencyPress = () => {
        setIsHolding(true);
        setHoldProgress(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        let progress = 0;
        holdTimer.current = setInterval(() => {
            progress += 3.33;
            setHoldProgress(progress);
            if (progress >= 100) {
                clearInterval(holdTimer.current!);
                triggerSOS();
            }
        }, 100);
    };

    const handleEmergencyRelease = () => {
        setIsHolding(false);
        setHoldProgress(0);
        if (holdTimer.current) clearInterval(holdTimer.current);
    };

    const triggerSOS = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        const res = await sosService.triggerSOS();
        if (res.data) {
            const count = res.data.notified_contacts?.length ?? 0;
            Alert.alert('🚨 SOS Triggered', `Emergency alert sent! ${count} contact(s) notified.`);
        } else {
            Alert.alert('🚨 SOS Triggered', 'Emergency contacts will be notified with your location.');
        }
    };

    const addContact = async () => {
        if (!newName.trim() || !newPhone.trim()) return;
        setSaving(true);
        const res = await sosService.addEmergencyContact({
            name: newName.trim(),
            phone: newPhone.trim(),
            relationship: newRelation.trim(),
            is_primary: contacts.length === 0,
        });
        setSaving(false);
        if (res.data) {
            setContacts(prev => [...prev, res.data!]);
            setNewName(''); setNewPhone(''); setNewRelation('');
            setShowAddContact(false);
        } else {
            Alert.alert('Error', res.error ?? 'Failed to add contact.');
        }
    };

    const deleteContact = (id: string, name: string) => {
        Alert.alert('Delete Contact', `Remove ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    const res = await sosService.deleteEmergencyContact(id);
                    if (res.status === 204 || !res.error) {
                        setContacts(prev => prev.filter(c => c.id !== id));
                    }
                },
            },
        ]);
    };

    const callNumber = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const emergencyNumbers = [
        { name: 'Police', number: '100', icon: 'shield', color: Colors.blue600 },
        { name: 'Ambulance', number: '108', icon: 'medkit', color: Colors.red500 },
        { name: 'Fire', number: '101', icon: 'flame', color: Colors.orange500 },
        { name: 'Women Helpline', number: '181', icon: 'people', color: Colors.purple500 },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency SOS</Text>
                <TouchableOpacity onPress={() => setShowAddContact(true)}>
                    <Ionicons name="person-add" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {/* SOS Button */}
                <View style={styles.sosSection}>
                    <Text style={styles.sosInstruction}>Hold for 3 seconds to trigger SOS</Text>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            onPressIn={handleEmergencyPress}
                            onPressOut={handleEmergencyRelease}
                            activeOpacity={0.9}
                            style={styles.sosButton}
                        >
                            <View style={[styles.sosInner, isHolding && styles.sosInnerActive]}>
                                <Ionicons name="alert" size={40} color={Colors.white} />
                                <Text style={styles.sosText}>SOS</Text>
                                {isHolding && <Text style={styles.sosProgress}>{Math.round(holdProgress)}%</Text>}
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.sosHint}>Your location will be shared with emergency contacts</Text>
                </View>

                {/* Emergency Numbers */}
                <Text style={styles.sectionTitle}>Emergency Numbers</Text>
                <View style={styles.emergencyGrid}>
                    {emergencyNumbers.map((num) => (
                        <TouchableOpacity key={num.number} style={styles.emergencyItem} onPress={() => callNumber(num.number)}>
                            <Card style={styles.emergencyCard}>
                                <CardContent style={{ alignItems: 'center', paddingVertical: 14 }}>
                                    <View style={[styles.emergencyIcon, { backgroundColor: num.color + '15' }]}>
                                        <Ionicons name={num.icon as keyof typeof Ionicons.glyphMap} size={22} color={num.color} />
                                    </View>
                                    <Text style={styles.emergencyName}>{num.name}</Text>
                                    <Text style={[styles.emergencyNumber, { color: num.color }]}>{num.number}</Text>
                                </CardContent>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Your Contacts */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Contacts</Text>
                    <TouchableOpacity onPress={() => setShowAddContact(true)}>
                        <Ionicons name="add-circle" size={26} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <>
                        <Skeleton width={'100%'} height={70} style={{ borderRadius: 12, marginBottom: 8 }} />
                        <Skeleton width={'100%'} height={70} style={{ borderRadius: 12, marginBottom: 8 }} />
                    </>
                ) : contacts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
                        <Text style={styles.emptySubtitle}>Add contacts for quick emergency access</Text>
                        <Button variant="gradient" gradientColors={Gradients.primary} onPress={() => setShowAddContact(true)} style={{ marginTop: 16 }}
                            icon={<Ionicons name="person-add" size={16} color={Colors.white} />}>
                            Add Contact
                        </Button>
                    </View>
                ) : (
                    contacts.map((contact) => (
                        <Card key={contact.id} style={styles.contactCard}>
                            <CardContent>
                                <View style={styles.contactRow}>
                                    <View style={styles.contactInfo}>
                                        <View style={styles.contactAvatar}>
                                            <Text style={styles.contactInitial}>{contact.name[0]}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.contactName}>{contact.name}</Text>
                                            <Text style={styles.contactRelation}>{contact.relationship}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.contactActions}>
                                        <TouchableOpacity onPress={() => callNumber(contact.phone)} style={styles.callBtn}>
                                            <Ionicons name="call" size={18} color={Colors.success} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteContact(contact.id, contact.name)}>
                                            <Ionicons name="trash" size={18} color={Colors.destructive} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </CardContent>
                        </Card>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showAddContact} onClose={() => setShowAddContact(false)} title="Add Emergency Contact">
                <Input label="Name" placeholder="Contact name" value={newName} onChangeText={setNewName} />
                <Input label="Phone Number" placeholder="+91 XXXXX XXXXX" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
                <Input label="Relationship" placeholder="e.g., Father, Mother" value={newRelation} onChangeText={setNewRelation} />
                <Button variant="gradient" gradientColors={Gradients.red} onPress={addContact} disabled={saving} style={{ marginTop: 8 }}>
                    {saving ? 'Saving…' : 'Save Contact'}
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
    sosSection: { alignItems: 'center', marginBottom: 32 },
    sosInstruction: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 20, fontWeight: '500' },
    sosButton: { width: 160, height: 160, borderRadius: 80 },
    sosInner: {
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: Colors.destructive, alignItems: 'center', justifyContent: 'center',
        ...Shadows.premiumLg,
    },
    sosInnerActive: { backgroundColor: '#B91C1C' },
    sosText: { fontSize: 28, fontWeight: '800', color: Colors.white, marginTop: 4 },
    sosProgress: { fontSize: 14, color: Colors.white, fontWeight: '600', marginTop: 4 },
    sosHint: { fontSize: 12, color: Colors.mutedForeground, marginTop: 16, textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    emergencyItem: { width: EMERG_CARD_WIDTH },
    emergencyCard: {},
    emergencyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    emergencyName: { fontSize: 13, fontWeight: '600', color: Colors.foreground },
    emergencyNumber: { fontSize: 18, fontWeight: '700', marginTop: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 32 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginTop: 12 },
    emptySubtitle: { fontSize: 12, color: Colors.mutedForeground, marginTop: 4 },
    contactCard: { marginBottom: 8 },
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    contactInitial: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    contactName: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    contactRelation: { fontSize: 12, color: Colors.mutedForeground },
    contactActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    callBtn: { padding: 6, backgroundColor: Colors.emerald50, borderRadius: 8 },
});

export default SOSEmergencyScreen;
