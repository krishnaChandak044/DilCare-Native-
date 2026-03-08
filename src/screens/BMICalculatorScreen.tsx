import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Input } from '../components/ui/Input';
import { Colors, BorderRadius, Gradients, Shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { bmiService } from '../services/api';

interface BMIRecord {
    id: string; weight: number; height: number; bmi: number; date: string; category: string;
}

const calculateBMI = (weight: number, height: number) => {
    const heightM = height / 100;
    return parseFloat((weight / (heightM * heightM)).toFixed(1));
};

const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: Colors.warning, emoji: '⚠️' };
    if (bmi < 25) return { label: 'Normal', color: Colors.success, emoji: '✅' };
    if (bmi < 30) return { label: 'Overweight', color: Colors.orange500, emoji: '⚡' };
    return { label: 'Obese', color: Colors.destructive, emoji: '🔴' };
};

const BMICalculatorScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [currentBMI, setCurrentBMI] = useState<number | null>(null);
    const [history, setHistory] = useState<BMIRecord[]>([]);

    const calculateAndSave = async () => {
        const w = parseFloat(weight); const h = parseFloat(height);
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
        const bmi = calculateBMI(w, h);
        const category = getBMICategory(bmi);
        const record: BMIRecord = {
            id: Date.now().toString(), weight: w, height: h, bmi,
            date: new Date().toLocaleDateString(), category: category.label,
        };
        setCurrentBMI(bmi);
        setHistory(prev => [record, ...prev]);
        await bmiService.saveBMIRecord(record);
    };

    const bmiInfo = currentBMI ? getBMICategory(currentBMI) : null;

    const bmiScale = [
        { label: 'Underweight', range: '< 18.5', color: Colors.warning, min: 0, max: 18.5 },
        { label: 'Normal', range: '18.5 - 24.9', color: Colors.success, min: 18.5, max: 25 },
        { label: 'Overweight', range: '25 - 29.9', color: Colors.orange500, min: 25, max: 30 },
        { label: 'Obese', range: '≥ 30', color: Colors.destructive, min: 30, max: 50 },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>BMI Calculator</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Input Card */}
                <Card style={styles.inputCard}>
                    <CardContent>
                        <View style={styles.inputRow}>
                            <View style={{ flex: 1 }}>
                                <Input label="Weight (kg)" placeholder="e.g., 70" value={weight} onChangeText={setWeight} keyboardType="numeric" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input label="Height (cm)" placeholder="e.g., 170" value={height} onChangeText={setHeight} keyboardType="numeric" />
                            </View>
                        </View>
                        <Button variant="gradient" gradientColors={Gradients.purple} onPress={calculateAndSave}
                            icon={<Ionicons name="calculator" size={18} color={Colors.white} />}>
                            Calculate BMI
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Card */}
                {currentBMI && bmiInfo && (
                    <Card style={[styles.resultCard, { borderLeftColor: bmiInfo.color, borderLeftWidth: 4 }]}>
                        <CardContent>
                            <View style={styles.resultCenter}>
                                <Text style={styles.resultEmoji}>{bmiInfo.emoji}</Text>
                                <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{currentBMI}</Text>
                                <Badge variant={bmiInfo.color === Colors.success ? 'success' : bmiInfo.color === Colors.warning ? 'warning' : 'danger'}>
                                    {bmiInfo.label}
                                </Badge>
                            </View>

                            {/* BMI Scale */}
                            <View style={styles.scaleContainer}>
                                {bmiScale.map((s, i) => (
                                    <View key={i} style={styles.scaleItem}>
                                        <View style={[styles.scaleBar, { backgroundColor: s.color }]} />
                                        <Text style={styles.scaleLabel}>{s.label}</Text>
                                        <Text style={styles.scaleRange}>{s.range}</Text>
                                    </View>
                                ))}
                            </View>
                        </CardContent>
                    </Card>
                )}

                {!currentBMI && (
                    <View style={styles.emptyState}>
                        <Ionicons name="fitness-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Check Your BMI</Text>
                        <Text style={styles.emptySubtitle}>Enter your weight and height to calculate your Body Mass Index</Text>
                    </View>
                )}

                {/* History */}
                {history.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>History</Text>
                        {history.map((record) => {
                            const cat = getBMICategory(record.bmi);
                            return (
                                <Card key={record.id} style={styles.historyCard}>
                                    <CardContent>
                                        <View style={styles.historyRow}>
                                            <View>
                                                <Text style={styles.historyDate}>{record.date}</Text>
                                                <Text style={styles.historyDetails}>{record.weight}kg • {record.height}cm</Text>
                                            </View>
                                            <View style={styles.historyRight}>
                                                <Text style={[styles.historyBmi, { color: cat.color }]}>{record.bmi}</Text>
                                                <Badge variant={cat.color === Colors.success ? 'success' : 'warning'}>{cat.label}</Badge>
                                            </View>
                                        </View>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </>
                )}

                {/* Tips */}
                <Card style={styles.tipsCard}>
                    <CardContent>
                        <Text style={styles.tipsTitle}>💡 Health Tips</Text>
                        <Text style={styles.tipText}>• Maintain a balanced diet rich in fruits and vegetables</Text>
                        <Text style={styles.tipText}>• Exercise at least 30 minutes daily</Text>
                        <Text style={styles.tipText}>• Stay hydrated — drink 8 glasses of water</Text>
                        <Text style={styles.tipText}>• Get 7-8 hours of quality sleep</Text>
                    </CardContent>
                </Card>

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
    inputCard: { marginBottom: 16 },
    inputRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    resultCard: { marginBottom: 20 },
    resultCenter: { alignItems: 'center', marginBottom: 20 },
    resultEmoji: { fontSize: 40 },
    bmiValue: { fontSize: 48, fontWeight: '800', marginTop: 8 },
    scaleContainer: { flexDirection: 'row', gap: 6 },
    scaleItem: { flex: 1, alignItems: 'center' },
    scaleBar: { height: 6, width: '100%', borderRadius: 3, marginBottom: 6 },
    scaleLabel: { fontSize: 9, fontWeight: '600', color: Colors.foreground, textAlign: 'center' },
    scaleRange: { fontSize: 8, color: Colors.mutedForeground, textAlign: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
    historyCard: { marginBottom: 8 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyDate: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
    historyDetails: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    historyRight: { alignItems: 'flex-end', gap: 4 },
    historyBmi: { fontSize: 20, fontWeight: '700' },
    tipsCard: { marginTop: 16, backgroundColor: Colors.emerald50 },
    tipsTitle: { fontSize: 16, fontWeight: '700', color: Colors.emerald600, marginBottom: 10 },
    tipText: { fontSize: 13, color: Colors.foreground, lineHeight: 22 },
});

export default BMICalculatorScreen;
