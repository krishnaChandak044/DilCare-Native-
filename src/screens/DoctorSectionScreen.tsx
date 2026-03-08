import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { doctorService, Doctor, Appointment, MedicalDocument } from '../services/api';

const DoctorSectionScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [activeTab, setActiveTab] = useState<'doctors' | 'appointments' | 'documents'>('doctors');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [adding, setAdding] = useState(false);
    
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showAddAppointment, setShowAddAppointment] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [newDocSpecialty, setNewDocSpecialty] = useState('general');
    const [newDocPhone, setNewDocPhone] = useState('');
    const [newDocHospital, setNewDocHospital] = useState('');
    const [newDocAddress, setNewDocAddress] = useState('');
    
    const [newApptDoctor, setNewApptDoctor] = useState('');
    const [newApptDate, setNewApptDate] = useState('');
    const [newApptTime, setNewApptTime] = useState('');
    const [newApptReason, setNewApptReason] = useState('');
    const [newApptLocation, setNewApptLocation] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [doctorsRes, appointmentsRes, documentsRes] = await Promise.all([
                doctorService.getDoctors(),
                doctorService.getAppointments(),
                doctorService.getDocuments(),
            ]);

            if (doctorsRes.data) setDoctors(doctorsRes.data);
            if (appointmentsRes.data) setAppointments(appointmentsRes.data);
            if (documentsRes.data) setDocuments(documentsRes.data);
        } catch (error) {
            console.error('Failed to fetch doctor data:', error);
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

    const addDoctor = async () => {
        if (!newDocName.trim()) {
            Alert.alert('Error', 'Please enter doctor name');
            return;
        }
        
        setAdding(true);
        try {
            const res = await doctorService.addDoctor({
                name: newDocName.trim(),
                specialty: newDocSpecialty,
                phone: newDocPhone.trim(),
                hospital: newDocHospital.trim(),
                address: newDocAddress.trim(),
                is_primary: doctors.length === 0,
            } as Partial<Doctor>);
            
            if (res.data) {
                setDoctors(prev => [...prev, res.data!]);
                setNewDocName('');
                setNewDocSpecialty('general');
                setNewDocPhone('');
                setNewDocHospital('');
                setNewDocAddress('');
                setShowAddDoctor(false);
                Alert.alert('Success', 'Doctor added successfully!');
            } else {
                Alert.alert('Error', res.error || 'Failed to add doctor');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add doctor');
        } finally {
            setAdding(false);
        }
    };

    const addAppointment = async () => {
        if (!newApptDate.trim()) {
            Alert.alert('Error', 'Please enter appointment date');
            return;
        }
        
        setAdding(true);
        try {
            const res = await doctorService.addAppointment({
                doctor: newApptDoctor || null,
                appointment_date: newApptDate,
                appointment_time: newApptTime || null,
                reason: newApptReason,
                location: newApptLocation,
                status: 'scheduled',
            } as Partial<Appointment>);
            
            if (res.data) {
                setAppointments(prev => [...prev, res.data!]);
                setNewApptDoctor('');
                setNewApptDate('');
                setNewApptTime('');
                setNewApptReason('');
                setNewApptLocation('');
                setShowAddAppointment(false);
                Alert.alert('Success', 'Appointment booked successfully!');
            } else {
                Alert.alert('Error', res.error || 'Failed to book appointment');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to book appointment');
        } finally {
            setAdding(false);
        }
    };

    const deleteDoctor = (doctorId: string, doctorName: string) => {
        Alert.alert('Delete Doctor', `Are you sure you want to delete Dr. ${doctorName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    const res = await doctorService.deleteDoctor(doctorId);
                    if (res.error) {
                        Alert.alert('Error', 'Failed to delete doctor');
                    } else {
                        setDoctors(prev => prev.filter(d => d.id !== doctorId));
                    }
                },
            },
        ]);
    };

    const deleteAppointment = (apptId: string) => {
        Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    const res = await doctorService.deleteAppointment(apptId);
                    if (res.error) {
                        Alert.alert('Error', 'Failed to delete appointment');
                    } else {
                        setAppointments(prev => prev.filter(a => a.id !== apptId));
                    }
                },
            },
        ]);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'scheduled': return 'info';
            case 'completed': return 'success';
            case 'cancelled': return 'danger';
            case 'missed': return 'warning';
            default: return 'default';
        }
    };

    const tabs = [
        { key: 'doctors', label: 'Doctors', icon: 'medkit' },
        { key: 'appointments', label: 'Appointments', icon: 'calendar' },
        { key: 'documents', label: 'Documents', icon: 'document-text' },
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
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
                <Text style={styles.headerTitle}>Doctors</Text>
                <TouchableOpacity onPress={() => activeTab === 'doctors' ? setShowAddDoctor(true) : activeTab === 'appointments' ? setShowAddAppointment(true) : {}}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key as 'doctors' | 'appointments' | 'documents')}
                    >
                        <Ionicons name={tab.icon as keyof typeof Ionicons.glyphMap} size={16} color={activeTab === tab.key ? Colors.white : Colors.mutedForeground} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
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
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={styles.docName}>Dr. {doc.name}</Text>
                                                    {doc.is_primary && <Badge variant="info">Primary</Badge>}
                                                </View>
                                                <Text style={styles.docSpecialty}>{doc.specialty_display}</Text>
                                                {doc.phone && (
                                                    <View style={styles.docMeta}>
                                                        <Ionicons name="call" size={12} color={Colors.mutedForeground} />
                                                        <Text style={styles.docMetaText}>{doc.phone}</Text>
                                                    </View>
                                                )}
                                                {doc.hospital && (
                                                    <View style={styles.docMeta}>
                                                        <Ionicons name="business" size={12} color={Colors.mutedForeground} />
                                                        <Text style={styles.docMetaText}>{doc.hospital}</Text>
                                                    </View>
                                                )}
                                                {doc.address && (
                                                    <View style={styles.docMeta}>
                                                        <Ionicons name="location" size={12} color={Colors.mutedForeground} />
                                                        <Text style={styles.docMetaText} numberOfLines={1}>{doc.address}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <TouchableOpacity onPress={() => deleteDoctor(doc.id, doc.name)} style={{ padding: 8 }}>
                                                <Ionicons name="trash-outline" size={18} color={Colors.destructive} />
                                            </TouchableOpacity>
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
                                                <Text style={styles.apptDateNum}>{new Date(appt.appointment_date).getDate()}</Text>
                                                <Text style={styles.apptDateMonth}>{new Date(appt.appointment_date).toLocaleDateString('en', { month: 'short' })}</Text>
                                            </View>
                                            <View style={styles.apptInfo}>
                                                <Text style={styles.apptReason}>{appt.reason || 'General Checkup'}</Text>
                                                <Text style={styles.apptDoctor}>{appt.doctor_name}</Text>
                                                {appt.appointment_time && <Text style={styles.apptTime}>{appt.appointment_time}</Text>}
                                                {appt.location && (
                                                    <View style={styles.docMeta}>
                                                        <Ionicons name="location" size={10} color={Colors.mutedForeground} />
                                                        <Text style={styles.docMetaText} numberOfLines={1}>{appt.location}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                                <Badge variant={getStatusBadgeVariant(appt.status)}>
                                                    {appt.status_display}
                                                </Badge>
                                                <TouchableOpacity onPress={() => deleteAppointment(appt.id)} style={{ padding: 4 }}>
                                                    <Ionicons name="trash-outline" size={16} color={Colors.destructive} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'documents' && (
                    <>
                        {documents.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={64} color={Colors.border} />
                                <Text style={styles.emptyTitle}>No Documents</Text>
                                <Text style={styles.emptySubtitle}>Medical documents will appear here</Text>
                            </View>
                        ) : (
                            documents.map((doc) => (
                                <Card key={doc.id} style={styles.docCard}>
                                    <CardContent>
                                        <View style={styles.docRow}>
                                            <View style={styles.docAvatar}>
                                                <Ionicons name="document-text" size={22} color={Colors.primary} />
                                            </View>
                                            <View style={styles.docInfo}>
                                                <Text style={styles.docName}>{doc.title}</Text>
                                                <Text style={styles.docSpecialty}>{doc.document_type_display}</Text>
                                                <Text style={styles.apptTime}>{new Date(doc.document_date).toLocaleDateString()}</Text>
                                                {doc.doctor_name && (
                                                    <View style={styles.docMeta}>
                                                        <MaterialCommunityIcons name="stethoscope" size={12} color={Colors.mutedForeground} />
                                                        <Text style={styles.docMetaText}>{doc.doctor_name}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showAddDoctor} onClose={() => setShowAddDoctor(false)} title="Add Doctor">
                <Input label="Doctor Name" placeholder="e.g., Sharma" value={newDocName} onChangeText={setNewDocName} />
                <Input label="Specialty" placeholder="e.g., Cardiologist" value={newDocSpecialty} onChangeText={setNewDocSpecialty} />
                <Input label="Phone" placeholder="+91 XXXXX XXXXX" value={newDocPhone} onChangeText={setNewDocPhone} keyboardType="phone-pad" />
                <Input label="Hospital" placeholder="Hospital name" value={newDocHospital} onChangeText={setNewDocHospital} />
                <Input label="Address" placeholder="Clinic address" value={newDocAddress} onChangeText={setNewDocAddress} />
                <Button 
                    variant="gradient" 
                    gradientColors={Gradients.primary} 
                    onPress={addDoctor} 
                    style={{ marginTop: 8 }}
                    disabled={adding}
                >
                    {adding ? 'Saving...' : 'Save Doctor'}
                </Button>
            </Modal>

            <Modal visible={showAddAppointment} onClose={() => setShowAddAppointment(false)} title="Book Appointment">
                <Input label="Date (YYYY-MM-DD)" placeholder="2024-03-15" value={newApptDate} onChangeText={setNewApptDate} />
                <Input label="Time (HH:MM)" placeholder="10:00" value={newApptTime} onChangeText={setNewApptTime} />
                <Input label="Reason" placeholder="e.g., Regular checkup" value={newApptReason} onChangeText={setNewApptReason} />
                <Input label="Location" placeholder="Clinic address" value={newApptLocation} onChangeText={setNewApptLocation} />
                <Button 
                    variant="gradient" 
                    gradientColors={Gradients.primary} 
                    onPress={addAppointment} 
                    style={{ marginTop: 8 }}
                    disabled={adding}
                >
                    {adding ? 'Booking...' : 'Book Appointment'}
                </Button>
            </Modal>
        </View>
    );
};
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
    docMetaText: { fontSize: 11, color: Colors.mutedForeground, flex: 1 },
    apptCard: { marginBottom: 10 },
    apptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    apptDateBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    apptDateNum: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    apptDateMonth: { fontSize: 9, color: Colors.primary, fontWeight: '500', textTransform: 'uppercase' },
    apptInfo: { flex: 1 },
    apptReason: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
    apptDoctor: { fontSize: 13, color: Colors.primary, fontWeight: '500', marginTop: 2 },
    apptTime: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
});

export default DoctorSectionScreen;
