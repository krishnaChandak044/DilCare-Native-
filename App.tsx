import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { UserModeProvider } from './src/hooks/useUserMode';
import { ThemeProvider } from './src/hooks/useTheme';
import OnboardingScreen from './src/screens/OnboardingScreen';
import './src/i18n';

const ONBOARDING_KEY = '@dilcare_onboarding_done';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(val !== 'true');
    });
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding === null) return null; // loading

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserModeProvider>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            {showOnboarding ? (
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            ) : (
              <AppNavigator />
            )}
          </UserModeProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
