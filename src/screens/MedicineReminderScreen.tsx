import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { medicineService } from '../services/api';

interface TodayMedicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    taken: boolean;
    missed: boolean;
    intake_id: string | null;
}

interface Prescription {
    id: string;
    name: string;
    doctor_name: string;
    prescription_date: string | null;
    file_type: 'image' | 'pdf' | 'other';
}

interface MedicineSummary {
    total_medicines: number;
    today_total: number;
    today_taken: number;
    today_missed: number;
    today_pending: number;
}

const MedicineReminderScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [medicines, setMedicines] = useState<TodayMedicine[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [summary, setSummary] = useState<MedicineSummary | null>(null);
    const [showAddMedicine, setShowAddMedicine] = useState(false);
    const [_showAddPrescription, _setShowAddPrescription] = useState(false);
    const [activeTab, setActiveTab] = useState<'today' | 'prescriptions'>('today');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [adding, setAdding] = useState(false);

    // Form state
    const [newName, setNewName] = useState('');
    const [newDosage, setNewDosage] = useState('');
    const [newFrequency, setNewFrequency] = useState('');
    const [newTime, setNewTime] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [todayRes, prescriptionsRes, summaryRes] = await Promise.all([
                medicineService.getTodayMedicines(),
                medicineService.getPrescriptions(),
                medicineService.getSummary(),
            ]);

            if (todayRes.data) setMedicines(todayRes.data);
            if (prescriptionsRes.data) setPrescriptions(prescriptionsRes.data);
            if (summaryRes.data) setSummary(summaryRes.data);
        } catch (error) {
            console.error('Failed to fetch medicine data:', error);
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

    const toggleMedicineTaken = async (intakeId: string | null) => {
        if (!intakeId) return;

        // Optimistic update
        setMedicines(prev =>
            prev.map(m => m.intake_id === intakeId ? { ...m, taken: !m.taken, missed: false } : m)
        );

        try {
            await medicineService.toggleMedicineIntake(intakeId);
            // Refresh summary
            const summaryRes = await medicineService.getSummary();
            if (summaryRes.data) setSummary(summaryRes.data);
        } catch (error) {
            console.error('Failed to toggle medicine:', error);
            // Revert on error
            fetchData();
        }
    };

    const addMedicine = async () => {
        if (!newName.trim()) return;

        setAdding(true);
        try {
            // Convert time to HH:MM format
            const scheduleTime = newTime.trim() || '08:00';

            await medicineService.addMedicine({
                name: newName.trim(),
                dosage: newDosage.trim() || undefined,
                frequency: mapFrequency(newFrequency),
                schedule_times: scheduleTime,
            });

            setNewName('');
            setNewDosage('');
            setNewFrequency('');
            setNewTime('');
            setShowAddMedicine(false);

            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Failed to add medicine:', error);
        } finally {
            setAdding(false);
        }
    };

    const deletePrescription = async (id: string) => {
        try {
            await medicineService.deletePrescription(id);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete prescription:', error);
        }
    };

    // Map user-friendly frequency to backend value
    const mapFrequency = (freq: string): string => {
        const lower = freq.toLowerCase();
        if (lower.includes('once')) return 'once_daily';
        if (lower.includes('twice')) return 'twice_daily';
        if (lower.includes('three') || lower.includes('thrice')) return 'thrice_daily';
        if (lower.includes('four')) return 'four_times';
        if (lower.includes('week')) return 'weekly';
        if (lower.includes('need')) return 'as_needed';
        return 'once_daily';
    };

    const takenCount = summary?.today_taken ?? medicines.filter(m => m.taken).length;
    const missedCount = summary?.today_missed ?? medicines.filter(m => m.missed).length;
    const totalCount = summary?.total_medicines ?? medicines.length;

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medicine Reminder</Text>
                <TouchableOpacity onPress={() => setShowAddMedicine(true)}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'today' && styles.tabActive]}
                    onPress={() => setActiveTab('today')}
                >
                    <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today's Medicines</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'prescriptions' && styles.tabActive]}
                    onPress={() => setActiveTab('prescriptions')}
                >
                    <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.tabTextActive]}>Prescriptions</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Summary Card */}
                <Card style={styles.summaryCard}>
                    <CardContent>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Ionicons name="medical" size={20} color={Colors.primary} />
                                <Text style={styles.summaryValue}>{totalCount}</Text>
                                <Text style={styles.summaryLabel}>Total</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                <Text style={styles.summaryValue}>{takenCount}</Text>
                                <Text style={styles.summaryLabel}>Taken</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Ionicons name="alert-circle" size={20} color={Colors.destructive} />
                                <Text style={styles.summaryValue}>{missedCount}</Text>
                                <Text style={styles.summaryLabel}>Missed</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {activeTab === 'today' ? (
                    <>
                        {medicines.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="medical-outline" size={64} color={Colors.border} />
                                <Text style={styles.emptyTitle}>No Medicines Added</Text>
                                <Text style={styles.emptySubtitle}>Add your medicines to get daily reminders</Text>
                                <Button
                                    variant="gradient"
                                    gradientColors={Gradients.primary}
                                    onPress={() => setShowAddMedicine(true)}
                                    style={{ marginTop: 16 }}
                                    icon={<Ionicons name="add" size={18} color={Colors.white} />}
                                >
                                    Add Medicine
                                </Button>
                            </View>
                        ) : (
                            medicines.map((medicine, index) => (
                                <TouchableOpacity key={`${medicine.id}-${medicine.time}-${index}`} onPress={() => toggleMedicineTaken(medicine.intake_id)} activeOpacity={0.7}>
                                    <Card style={[styles.medicineCard, medicine.taken && styles.medicineTaken]}>
                                        <CardContent>
                                            <View style={styles.medicineRow}>
                                                <View style={styles.medicineInfo}>
                                                    <View style={[styles.medicineIcon, medicine.taken && styles.medicineIconTaken]}>
                                                        <Ionicons
                                                            name={medicine.taken ? 'checkmark-circle' : 'medical'}
                                                            size={24}
                                                            color={medicine.taken ? Colors.success : Colors.primary}
                                                        />
                                                    </View>
                                                    <View style={styles.medicineDetails}>
                                                        <Text style={[styles.medicineName, medicine.taken && styles.medicineNameTaken]}>{medicine.name}</Text>
                                                        <Text style={styles.medicineDosage}>{medicine.dosage || 'No dosage'} • {medicine.frequency}</Text>
                                                        <View style={styles.timeRow}>
                                                            <Ionicons name="time" size={12} color={Colors.mutedForeground} />
                                                            <Text style={styles.medicineTime}>{medicine.time}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <Badge variant={medicine.taken ? 'success' : 'default'}>
                                                    {medicine.taken ? 'Taken' : 'Pending'}
                                                </Badge>
                                            </View>
                                        </CardContent>
                                    </Card>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        {prescriptions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={64} color={Colors.border} />
                                <Text style={styles.emptyTitle}>No Prescriptions</Text>
                                <Text style={styles.emptySubtitle}>Upload prescriptions for easy access</Text>
                                <Button
                                    variant="gradient"
                                    gradientColors={Gradients.primary}
                                    onPress={() => setShowAddPrescription(true)}
                                    style={{ marginTop: 16 }}
                                    icon={<Ionicons name="cloud-upload" size={18} color={Colors.white} />}
                                >
                                    Upload Prescription
                                </Button>
                            </View>
                        ) : (
                            prescriptions.map((rx) => (
                                <Card key={rx.id} style={styles.prescriptionCard}>
                                    <CardContent>
                                        <View style={styles.prescriptionRow}>
                                            <Ionicons name="document-text" size={24} color={Colors.primary} />
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.prescriptionName}>{rx.name}</Text>
                                                {rx.doctor_name ? (
                                                    <Text style={styles.prescriptionDoctor}>Dr. {rx.doctor_name}</Text>
                                                ) : null}
                                                {rx.prescription_date ? (
                                                    <Text style={styles.prescriptionDate}>{rx.prescription_date}</Text>
                                                ) : null}
                                            </View>
                                            <TouchableOpacity onPress={() => deletePrescription(rx.id)}>
                                                <Ionicons name="trash" size={20} color={Colors.destructive} />
                                            </TouchableOpacity>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add Medicine Modal */}
            <Modal visible={showAddMedicine} onClose={() => setShowAddMedicine(false)} title="Add Medicine">
                <Input label="Medicine Name" placeholder="e.g., Metformin" value={newName} onChangeText={setNewName} />
                <Input label="Dosage" placeholder="e.g., 500mg" value={newDosage} onChangeText={setNewDosage} />
                <Input label="Frequency" placeholder="e.g., Twice daily" value={newFrequency} onChangeText={setNewFrequency} />
                <Input label="Time (HH:MM)" placeholder="e.g., 08:00" value={newTime} onChangeText={setNewTime} />
                <Button 
                    variant="gradient" 
                    gradientColors={Gradients.primary} 
                    onPress={addMedicine} 
                    style={{ marginTop: 8 }}
                    disabled={adding || !newName.trim()}
                >
                    {adding ? 'Adding...' : 'Add Medicine'}
                </Button>
            </Modal>
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
    tabs: {
        flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8,
    },
    tab: {
        flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md,
        backgroundColor: Colors.secondary, alignItems: 'center',
    },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.mutedForeground },
    tabTextActive: { color: Colors.white },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    summaryCard: { marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center', gap: 6 },
    summaryValue: { fontSize: 24, fontWeight: '700', color: Colors.foreground },
    summaryLabel: { fontSize: 12, color: Colors.mutedForeground },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4 },
    medicineCard: { marginBottom: 10 },
    medicineTaken: { opacity: 0.7 },
    medicineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    medicineInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    medicineIcon: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue50,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    medicineIconTaken: { backgroundColor: Colors.emerald50 },
    medicineDetails: { flex: 1 },
    medicineName: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    medicineNameTaken: { textDecorationLine: 'line-through', color: Colors.mutedForeground },
    medicineDosage: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    medicineTime: { fontSize: 11, color: Colors.mutedForeground },
    prescriptionCard: { marginBottom: 10 },
    prescriptionRow: { flexDirection: 'row', alignItems: 'center' },
    prescriptionName: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    prescriptionDoctor: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    prescriptionDate: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },
});

export default MedicineReminderScreen;
