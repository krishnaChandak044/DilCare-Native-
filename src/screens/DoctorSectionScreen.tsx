import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, BorderRadius, Gradients, Shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { doctorService } from '../services/api';

interface Doctor { id: string; name: string; specialty: string; phone: string; address: string; isPrimary: boolean; }
interface Appointment { id: string; doctorId: string; date: string; time: string; reason: string; status: 'upcoming' | 'completed' | 'cancelled'; }

const DoctorSectionScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activeTab, setActiveTab] = useState<'doctors' | 'appointments' | 'documents'>('doctors');
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showAddAppointment, setShowAddAppointment] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [newDocSpecialty, setNewDocSpecialty] = useState('');
    const [newDocPhone, setNewDocPhone] = useState('');
    const [newDocAddress, setNewDocAddress] = useState('');
    const [newApptDate, setNewApptDate] = useState('');
    const [newApptTime, setNewApptTime] = useState('');
    const [newApptReason, setNewApptReason] = useState('');

    const addDoctor = async () => {
        if (!newDocName.trim()) return;
        const doc: Doctor = {
            id: Date.now().toString(), name: newDocName, specialty: newDocSpecialty,
            phone: newDocPhone, address: newDocAddress, isPrimary: doctors.length === 0,
        };
        setDoctors(prev => [...prev, doc]);
        setNewDocName(''); setNewDocSpecialty(''); setNewDocPhone(''); setNewDocAddress('');
        setShowAddDoctor(false);
        await doctorService.addDoctor(doc);
    };

    const addAppointment = async () => {
        if (!newApptDate.trim()) return;
        const appt: Appointment = {
            id: Date.now().toString(), doctorId: doctors[0]?.id || '',
            date: newApptDate, time: newApptTime, reason: newApptReason, status: 'upcoming',
        };
        setAppointments(prev => [...prev, appt]);
        setNewApptDate(''); setNewApptTime(''); setNewApptReason('');
        setShowAddAppointment(false);
        await doctorService.addAppointment(appt);
    };

    const tabs = [
        { key: 'doctors', label: 'Doctors', icon: 'medkit' },
        { key: 'appointments', label: 'Appointments', icon: 'calendar' },
        { key: 'documents', label: 'Documents', icon: 'document-text' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Doctors</Text>
                <TouchableOpacity onPress={() => activeTab === 'doctors' ? setShowAddDoctor(true) : setShowAddAppointment(true)}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key as any)}
                    >
                        <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? Colors.white : Colors.mutedForeground} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'doctors' && (
                    <>
                        {doctors.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="stethoscope" size={64} color={Colors.border} />
                                <Text style={styles.emptyTitle}>No Doctors Added</Text>
                                <Text style={styles.emptySubtitle}>Add your doctors for quick access</Text>
                                <Button variant="gradient" gradientColors={Gradients.primary} onPress={() => setShowAddDoctor(true)} style={{ marginTop: 16 }}>
                                    Add Doctor
                                </Button>
                            </View>
                        ) : (
                            doctors.map((doc) => (
                                <Card key={doc.id} style={styles.docCard}>
                                    <CardContent>
                                        <View style={styles.docRow}>
                                            <View style={styles.docAvatar}>
                                                <MaterialCommunityIcons name="stethoscope" size={22} color={Colors.medicineBlue} />
                                            </View>
                                            <View style={styles.docInfo}>
                                                <Text style={styles.docName}>Dr. {doc.name}</Text>
                                                <Text style={styles.docSpecialty}>{doc.specialty}</Text>
                                                <View style={styles.docMeta}>
                                                    <Ionicons name="call" size={12} color={Colors.mutedForeground} />
                                                    <Text style={styles.docMetaText}>{doc.phone}</Text>
                                                </View>
                                                <View style={styles.docMeta}>
                                                    <Ionicons name="location" size={12} color={Colors.mutedForeground} />
                                                    <Text style={styles.docMetaText}>{doc.address}</Text>
                                                </View>
                                            </View>
                                            {doc.isPrimary && <Badge variant="info">Primary</Badge>}
                                        </View>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'appointments' && (
                    <>
                        {appointments.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={64} color={Colors.border} />
                                <Text style={styles.emptyTitle}>No Appointments</Text>
                                <Text style={styles.emptySubtitle}>Schedule appointments with your doctors</Text>
                                <Button variant="gradient" gradientColors={Gradients.primary} onPress={() => setShowAddAppointment(true)} style={{ marginTop: 16 }}>
                                    Book Appointment
                                </Button>
                            </View>
                        ) : (
                            appointments.map((appt) => (
                                <Card key={appt.id} style={styles.apptCard}>
                                    <CardContent>
                                        <View style={styles.apptRow}>
                                            <View style={styles.apptDateBox}>
                                                <Text style={styles.apptDateNum}>{appt.date.split('/')[0] || '--'}</Text>
                                                <Text style={styles.apptDateMonth}>Date</Text>
                                            </View>
                                            <View style={styles.apptInfo}>
                                                <Text style={styles.apptReason}>{appt.reason || 'General Checkup'}</Text>
                                                <Text style={styles.apptTime}>{appt.time}</Text>
                                            </View>
                                            <Badge variant={appt.status === 'upcoming' ? 'info' : appt.status === 'completed' ? 'success' : 'danger'}>
                                                {appt.status}
                                            </Badge>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'documents' && (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Documents</Text>
                        <Text style={styles.emptySubtitle}>Medical documents will appear here</Text>
                        <Button variant="outline" onPress={() => { }} style={{ marginTop: 16 }}
                            icon={<Ionicons name="cloud-upload" size={16} color={Colors.foreground} />}>
                            Upload Document
                        </Button>
                        <Button variant="gradient" gradientColors={Gradients.emerald} onPress={() => { }} style={{ marginTop: 10 }}
                            icon={<Ionicons name="document-text" size={16} color={Colors.white} />}>
                            Generate Health Report
                        </Button>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showAddDoctor} onClose={() => setShowAddDoctor(false)} title="Add Doctor">
                <Input label="Doctor Name" placeholder="e.g., Sharma" value={newDocName} onChangeText={setNewDocName} />
                <Input label="Specialty" placeholder="e.g., Cardiologist" value={newDocSpecialty} onChangeText={setNewDocSpecialty} />
                <Input label="Phone" placeholder="+91 XXXXX XXXXX" value={newDocPhone} onChangeText={setNewDocPhone} keyboardType="phone-pad" />
                <Input label="Address" placeholder="Clinic address" value={newDocAddress} onChangeText={setNewDocAddress} />
                <Button variant="gradient" gradientColors={Gradients.primary} onPress={addDoctor} style={{ marginTop: 8 }}>Save Doctor</Button>
            </Modal>

            <Modal visible={showAddAppointment} onClose={() => setShowAddAppointment(false)} title="Book Appointment">
                <Input label="Date" placeholder="DD/MM/YYYY" value={newApptDate} onChangeText={setNewApptDate} />
                <Input label="Time" placeholder="e.g., 10:00 AM" value={newApptTime} onChangeText={setNewApptTime} />
                <Input label="Reason" placeholder="e.g., Regular checkup" value={newApptReason} onChangeText={setNewApptReason} />
                <Button variant="gradient" gradientColors={Gradients.primary} onPress={addAppointment} style={{ marginTop: 8 }}>Book Appointment</Button>
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
    tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 6 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.secondary },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground },
    tabTextActive: { color: Colors.white },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4 },
    docCard: { marginBottom: 10 },
    docRow: { flexDirection: 'row', alignItems: 'flex-start' },
    docAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.blue50, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    docInfo: { flex: 1 },
    docName: { fontSize: 16, fontWeight: '700', color: Colors.foreground },
    docSpecialty: { fontSize: 13, color: Colors.primary, fontWeight: '500', marginTop: 2 },
    docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    docMetaText: { fontSize: 11, color: Colors.mutedForeground },
    apptCard: { marginBottom: 10 },
    apptRow: { flexDirection: 'row', alignItems: 'center' },
    apptDateBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    apptDateNum: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    apptDateMonth: { fontSize: 9, color: Colors.primary, fontWeight: '500' },
    apptInfo: { flex: 1 },
    apptReason: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    apptTime: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
});

export default DoctorSectionScreen;
