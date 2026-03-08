import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Colors, BorderRadius, Gradients } from '../theme';
import { useUserMode } from '../hooks/useUserMode';
import { useTheme } from '../hooks/useTheme';
import { userService } from '../services/api';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import * as Clipboard from 'expo-clipboard';

interface UserProfile {
    name: string; age: string; phone: string; email: string;
    address: string; emergencyContact: string; bloodGroup: string;
}

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { parentLinkCode, generateNewLinkCode } = useUserMode();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        name: '', age: '', phone: '', email: '', address: '', emergencyContact: '', bloodGroup: '',
    });
    const [codeCopied, setCodeCopied] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const { t, i18n } = useTranslation();
    const { isDark, colors, toggleTheme } = useTheme();

    const saveProfile = async () => {
        setIsEditing(false);
        await userService.updateProfile(profile);
    };

    const copyLinkCode = async () => {
        await Clipboard.setStringAsync(parentLinkCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const settingsItems = [
        { icon: 'notifications', label: t('profile.notifications'), color: Colors.warning },
        { icon: 'shield-checkmark', label: t('profile.privacy'), color: Colors.success },
        { icon: 'language', label: t('profile.language'), color: Colors.primary, onPress: () => setShowLanguageModal(true) },
        { icon: 'moon', label: t('profile.darkMode'), color: Colors.calmPurple, onPress: toggleTheme, toggle: true },
        { icon: 'help-circle', label: t('profile.help'), color: Colors.primary },
        { icon: 'information-circle', label: t('profile.about'), color: Colors.calmPurple },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => isEditing ? saveProfile() : setIsEditing(true)}>
                    <Ionicons name={isEditing ? 'checkmark' : 'create-outline'} size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <LinearGradient colors={Gradients.primary} style={styles.avatarLarge}>
                        <Ionicons name="person" size={36} color={Colors.white} />
                    </LinearGradient>
                    <Text style={styles.profileName}>{profile.name || 'Your Name'}</Text>
                    <Text style={styles.profileSub}>{profile.email || 'Add your email'}</Text>
                </View>

                {/* Family Link Code */}
                <Card style={styles.linkCodeCard}>
                    <CardContent>
                        <View style={styles.linkCodeHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="link" size={20} color={Colors.purple500} />
                                <Text style={styles.linkCodeTitle}>Family Link Code</Text>
                            </View>
                            <TouchableOpacity onPress={generateNewLinkCode}>
                                <Ionicons name="refresh" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.linkCodeDescription}>
                            Share this code with family members to link their DilCare app
                        </Text>
                        <TouchableOpacity style={styles.codeBox} onPress={copyLinkCode} activeOpacity={0.7}>
                            <Text style={styles.codeText}>{parentLinkCode || 'Generating...'}</Text>
                            <Ionicons name={codeCopied ? 'checkmark-circle' : 'copy'} size={20} color={codeCopied ? Colors.success : Colors.primary} />
                        </TouchableOpacity>
                        {codeCopied && <Text style={styles.copiedText}>✓ Copied to clipboard!</Text>}
                    </CardContent>
                </Card>

                {/* Profile Fields */}
                <Card style={styles.fieldsCard}>
                    <CardContent>
                        <Text style={styles.sectionLabel}>Personal Information</Text>
                        {isEditing ? (
                            <>
                                <Input label="Full Name" placeholder="Enter your name" value={profile.name} onChangeText={(v) => setProfile(p => ({ ...p, name: v }))} />
                                <Input label="Age" placeholder="Your age" value={profile.age} onChangeText={(v) => setProfile(p => ({ ...p, age: v }))} keyboardType="numeric" />
                                <Input label="Phone" placeholder="+91 XXXXX XXXXX" value={profile.phone} onChangeText={(v) => setProfile(p => ({ ...p, phone: v }))} keyboardType="phone-pad" />
                                <Input label="Email" placeholder="your@email.com" value={profile.email} onChangeText={(v) => setProfile(p => ({ ...p, email: v }))} keyboardType="email-address" />
                                <Input label="Address" placeholder="Your address" value={profile.address} onChangeText={(v) => setProfile(p => ({ ...p, address: v }))} />
                                <Input label="Emergency Contact" placeholder="Emergency phone" value={profile.emergencyContact} onChangeText={(v) => setProfile(p => ({ ...p, emergencyContact: v }))} keyboardType="phone-pad" />
                                <Input label="Blood Group" placeholder="e.g., O+" value={profile.bloodGroup} onChangeText={(v) => setProfile(p => ({ ...p, bloodGroup: v }))} />
                                <Button variant="gradient" gradientColors={Gradients.primary} onPress={saveProfile} style={{ marginTop: 8 }}>
                                    Save Profile
                                </Button>
                            </>
                        ) : (
                            <>
                                {[
                                    { icon: 'person', label: 'Name', value: profile.name },
                                    { icon: 'calendar', label: 'Age', value: profile.age ? `${profile.age} years` : '' },
                                    { icon: 'call', label: 'Phone', value: profile.phone },
                                    { icon: 'mail', label: 'Email', value: profile.email },
                                    { icon: 'location', label: 'Address', value: profile.address },
                                    { icon: 'alert-circle', label: 'Emergency', value: profile.emergencyContact },
                                    { icon: 'water', label: 'Blood Group', value: profile.bloodGroup },
                                ].map((field, i) => (
                                    <View key={i} style={styles.fieldRow}>
                                        <View style={styles.fieldIcon}>
                                            <Ionicons name={field.icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.primary} />
                                        </View>
                                        <View style={styles.fieldContent}>
                                            <Text style={styles.fieldLabel}>{field.label}</Text>
                                            <Text style={styles.fieldValue}>{field.value || 'Not set'}</Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Settings */}
                <Card style={styles.settingsCard}>
                    <CardContent>
                        <Text style={styles.sectionLabel}>Settings</Text>
                        {settingsItems.map((item, i) => (
                            <TouchableOpacity key={i} style={styles.settingRow} onPress={item.onPress}>
                                <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
                                </View>
                                <Text style={styles.settingLabel}>{item.label}</Text>
                                {item.toggle ? (
                                    <View style={[styles.toggleDot, isDark && styles.toggleDotActive]}>
                                        <View style={[styles.toggleKnob, isDark && styles.toggleKnobActive]} />
                                    </View>
                                ) : (
                                    <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </CardContent>
                </Card>

                {/* Logout */}
                <Button variant="destructive" onPress={() => Alert.alert('Logout', 'Logout will be available after backend integration')}
                    icon={<Ionicons name="log-out" size={18} color={Colors.white} />} style={{ marginTop: 8 }}>
                    Log Out
                </Button>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Language Picker Modal */}
            <Modal visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} title={t('profile.language')}>
                {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        style={[styles.langRow, i18n.language === lang.code && styles.langRowActive]}
                        onPress={() => { i18n.changeLanguage(lang.code); setShowLanguageModal(false); }}
                    >
                        <Text style={[styles.langLabel, i18n.language === lang.code && styles.langLabelActive]}>
                            {lang.nativeLabel}
                        </Text>
                        <Text style={styles.langSub}>{lang.label}</Text>
                        {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                    </TouchableOpacity>
                ))}
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
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    profileName: { fontSize: 22, fontWeight: '700', color: Colors.foreground },
    profileSub: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
    linkCodeCard: { marginBottom: 16, backgroundColor: Colors.purple50 },
    linkCodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    linkCodeTitle: { fontSize: 16, fontWeight: '700', color: Colors.purple600 },
    linkCodeDescription: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 12 },
    codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.purple500 + '30' },
    codeText: { fontSize: 24, fontWeight: '800', color: Colors.purple600, letterSpacing: 4 },
    copiedText: { fontSize: 12, color: Colors.success, marginTop: 6, fontWeight: '500' },
    fieldsCard: { marginBottom: 16 },
    sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 16 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
    fieldIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: 11, color: Colors.mutedForeground, fontWeight: '500' },
    fieldValue: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginTop: 2 },
    settingsCard: { marginBottom: 16 },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
    settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    settingLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.foreground },
    toggleDot: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border, justifyContent: 'center', paddingHorizontal: 2 },
    toggleDotActive: { backgroundColor: Colors.primary },
    toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white },
    toggleKnobActive: { alignSelf: 'flex-end' },
    langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 8 },
    langRowActive: { backgroundColor: Colors.primaryLight, marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 8 },
    langLabel: { fontSize: 16, fontWeight: '600', color: Colors.foreground, flex: 1 },
    langLabelActive: { color: Colors.primary },
    langSub: { fontSize: 13, color: Colors.mutedForeground },
});

export default ProfileScreen;
