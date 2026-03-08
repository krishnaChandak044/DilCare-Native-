import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, Shadows, BorderRadius, Gradients } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { healthService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const METRIC_GAP = 10;
const METRIC_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - METRIC_GAP) / 2;

interface HealthReading {
    id: string;
    type: 'bp' | 'sugar' | 'weight' | 'heartRate';
    value: string;
    date: string;
    time: string;
    status: 'normal' | 'warning' | 'danger';
}

const HEALTH_TYPES = [
    { key: 'bp', label: 'Blood Pressure', icon: 'heart' as const, color: Colors.destructive, unit: 'mmHg' },
    { key: 'sugar', label: 'Blood Sugar', icon: 'water' as const, color: Colors.warning, unit: 'mg/dL' },
    { key: 'weight', label: 'Weight', icon: 'fitness' as const, color: Colors.accent, unit: 'kg' },
    { key: 'heartRate', label: 'Heart Rate', icon: 'pulse' as const, color: Colors.primary, unit: 'BPM' },
];

const HealthTrackerScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [readings, setReadings] = useState<HealthReading[]>([]);
    const [showAddReading, setShowAddReading] = useState(false);
    const [selectedType, setSelectedType] = useState('bp');
    const [newValue, setNewValue] = useState('');
    const screenWidth = Dimensions.get('window').width;

    const addReading = async () => {
        if (!newValue.trim()) return;
        const reading: HealthReading = {
            id: Date.now().toString(),
            type: selectedType as any,
            value: newValue,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'normal',
        };
        setReadings(prev => [reading, ...prev]);
        setNewValue('');
        setShowAddReading(false);
        await healthService.addHealthReading(reading);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'normal': return Colors.success;
            case 'warning': return Colors.warning;
            case 'danger': return Colors.destructive;
            default: return Colors.mutedForeground;
        }
    };

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: () => Colors.primary, strokeWidth: 2 }],
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Health Tracker</Text>
                <TouchableOpacity onPress={() => setShowAddReading(true)}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Metric Cards */}
                <View style={styles.metricsGrid}>
                    {HEALTH_TYPES.map((type) => (
                        <Card key={type.key} style={styles.metricCard}>
                            <CardContent style={styles.metricContent}>
                                <View style={[styles.metricIcon, { backgroundColor: type.color + '15' }]}>
                                    <Ionicons name={type.icon as any} size={20} color={type.color} />
                                </View>
                                <Text style={styles.metricLabel}>{type.label}</Text>
                                <Text style={styles.metricValue}>--</Text>
                                <Text style={styles.metricUnit}>{type.unit}</Text>
                            </CardContent>
                        </Card>
                    ))}
                </View>

                {/* Chart */}
                <Card style={styles.chartCard}>
                    <CardContent>
                        <Text style={styles.chartTitle}>Weekly Trends</Text>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 80}
                            height={180}
                            chartConfig={{
                                backgroundColor: Colors.card,
                                backgroundGradientFrom: Colors.card,
                                backgroundGradientTo: Colors.card,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                labelColor: () => Colors.mutedForeground,
                                propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </CardContent>
                </Card>

                {/* Readings List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Readings</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="download" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="share-social" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {readings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="pulse-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No Readings Yet</Text>
                        <Text style={styles.emptySubtitle}>Add your health readings to track your progress</Text>
                        <Button variant="gradient" gradientColors={Gradients.primary} onPress={() => setShowAddReading(true)} style={{ marginTop: 16 }}>
                            Add First Reading
                        </Button>
                    </View>
                ) : (
                    readings.map((reading) => {
                        const typeInfo = HEALTH_TYPES.find(t => t.key === reading.type);
                        return (
                            <Card key={reading.id} style={styles.readingCard}>
                                <CardContent>
                                    <View style={styles.readingRow}>
                                        <View style={[styles.readingIcon, { backgroundColor: typeInfo?.color + '15' }]}>
                                            <Ionicons name={typeInfo?.icon as any || 'pulse'} size={20} color={typeInfo?.color} />
                                        </View>
                                        <View style={styles.readingInfo}>
                                            <Text style={styles.readingType}>{typeInfo?.label}</Text>
                                            <Text style={styles.readingDateTime}>{reading.date} • {reading.time}</Text>
                                        </View>
                                        <View style={styles.readingValueContainer}>
                                            <Text style={styles.readingValue}>{reading.value}</Text>
                                            <Text style={styles.readingUnit}>{typeInfo?.unit}</Text>
                                        </View>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(reading.status) }]} />
                                    </View>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showAddReading} onClose={() => setShowAddReading(false)} title="Add Health Reading">
                <Text style={styles.modalLabel}>Select Type</Text>
                <View style={styles.typeGrid}>
                    {HEALTH_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.key}
                            style={[styles.typeOption, selectedType === type.key && { borderColor: type.color, backgroundColor: type.color + '10' }]}
                            onPress={() => setSelectedType(type.key)}
                        >
                            <Ionicons name={type.icon as any} size={20} color={type.color} />
                            <Text style={[styles.typeLabel, selectedType === type.key && { color: type.color }]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Input label="Value" placeholder={`Enter value`} value={newValue} onChangeText={setNewValue} keyboardType="numeric" />
                <Button variant="gradient" gradientColors={Gradients.primary} onPress={addReading} style={{ marginTop: 8 }}>
                    Save Reading
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
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    metricCard: { width: METRIC_WIDTH },
    metricContent: { alignItems: 'center', paddingVertical: 16 },
    metricIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    metricLabel: { fontSize: 11, color: Colors.mutedForeground, fontWeight: '500' },
    metricValue: { fontSize: 22, fontWeight: '700', color: Colors.foreground, marginTop: 4 },
    metricUnit: { fontSize: 10, color: Colors.mutedForeground },
    chartCard: { marginBottom: 20 },
    chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    chart: { borderRadius: BorderRadius.md, marginLeft: -16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8, backgroundColor: Colors.primaryLight, borderRadius: 8 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center' },
    readingCard: { marginBottom: 10 },
    readingRow: { flexDirection: 'row', alignItems: 'center' },
    readingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    readingInfo: { flex: 1 },
    readingType: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
    readingDateTime: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },
    readingValueContainer: { alignItems: 'flex-end', marginRight: 10 },
    readingValue: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
    readingUnit: { fontSize: 10, color: Colors.mutedForeground },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    modalLabel: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 10 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    typeOption: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, width: METRIC_WIDTH },
    typeLabel: { fontSize: 12, fontWeight: '500', color: Colors.mutedForeground },
});

export default HealthTrackerScreen;
