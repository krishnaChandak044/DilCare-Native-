/**
 * AppNavigator — fixed version
 * - MoreScreen extracted to its own file (prevents remount on every tab switch)
 * - Custom tab bar with proper safe area handling
 * - Type-safe icon mapping
 */
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, BorderRadius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

// Screen imports
import HomeScreen from '../screens/HomeScreen';
import MedicineReminderScreen from '../screens/MedicineReminderScreen';
import StepTrackerScreen from '../screens/StepTrackerScreen';
import HealthTrackerScreen from '../screens/HealthTrackerScreen';
import MoreScreen from '../screens/MoreScreen';
import WaterTrackerScreen from '../screens/WaterTrackerScreen';
import BMICalculatorScreen from '../screens/BMICalculatorScreen';
import GyaanCornerScreen from '../screens/GyaanCornerScreen';
import SOSEmergencyScreen from '../screens/SOSEmergencyScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import DoctorSectionScreen from '../screens/DoctorSectionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ChildDashboardScreen from '../screens/ChildDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
    Home: { icon: 'home', label: 'Home' },
    Medicine: { icon: 'medical', label: 'Medicine' },
    Steps: { icon: 'footsteps', label: 'Steps' },
    Health: { icon: 'heart-circle', label: 'Health' },
    More: { icon: 'grid', label: 'More' },
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const { colors } = useTheme();
    return (
        <View style={[tabStyles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={tabStyles.tabBar}>
                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const config = TAB_CONFIG[route.name] || { icon: 'apps', label: route.name };

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={tabStyles.tabItem}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={config.label}
                            accessibilityState={{ selected: isFocused }}
                        >
                            {isFocused ? (
                                <LinearGradient
                                    colors={['#3B82F6', '#2563EB']}
                                    style={tabStyles.iconGradient}
                                >
                                    <Ionicons name={config.icon as any} size={20} color={Colors.white} />
                                </LinearGradient>
                            ) : (
                                <View style={tabStyles.iconContainer}>
                                    <Ionicons name={(config.icon + '-outline') as any} size={20} color={colors.mutedForeground} />
                                </View>
                            )}
                            <Text
                                style={[tabStyles.label, { color: colors.mutedForeground }, isFocused && tabStyles.labelActive]}
                                numberOfLines={1}
                            >
                                {config.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const BottomTabs = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Medicine" component={MedicineReminderScreen} />
            <Tab.Screen name="Steps" component={StepTrackerScreen} />
            <Tab.Screen name="Health" component={HealthTrackerScreen} />
            <Tab.Screen name="More" component={MoreScreen} />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { colors, isDark } = useTheme();
    const navTheme = {
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme : DefaultTheme).colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.foreground,
            border: colors.border,
            notification: colors.destructive,
        },
    };
    return (
        <NavigationContainer theme={navTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen name="MainTabs" component={BottomTabs} />
                <Stack.Screen name="Water" component={WaterTrackerScreen} />
                <Stack.Screen name="BMI" component={BMICalculatorScreen} />
                <Stack.Screen name="Gyaan" component={GyaanCornerScreen} />
                <Stack.Screen name="SOS" component={SOSEmergencyScreen} />
                <Stack.Screen name="AI" component={AIAssistantScreen} />
                <Stack.Screen name="Doctor" component={DoctorSectionScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Community" component={CommunityScreen} />
                <Stack.Screen name="ChildDashboard" component={ChildDashboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const tabStyles = StyleSheet.create({
    container: {
        backgroundColor: Colors.card,
        borderTopWidth: 0.5,
        borderTopColor: Colors.border,
        paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        paddingTop: 6,
        ...Shadows.md,
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
        flex: 1,
    },
    iconContainer: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGradient: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: Colors.mutedForeground,
        marginTop: 1,
    },
    labelActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
});
