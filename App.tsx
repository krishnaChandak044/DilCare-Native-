import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { UserModeProvider } from './src/hooks/useUserMode';
import { ThemeProvider } from './src/hooks/useTheme';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import { tokenManager, authService } from './src/services/api';
import { Colors } from './src/theme';
import './src/i18n';

const ONBOARDING_KEY = '@dilcare_onboarding_done';

// ── Auth context so any screen can trigger logout ──
type AuthContextType = { logout: () => Promise<void> };
export const AuthContext = createContext<AuthContextType>({ logout: async () => {} });
export const useAuth = () => useContext(AuthContext);

type AppState = 'loading' | 'onboarding' | 'auth' | 'app';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      // Check onboarding
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (onboardingDone !== 'true') {
        setAppState('onboarding');
        return;
      }
      // Check auth token
      const isLoggedIn = await authService.isLoggedIn();
      setAppState(isLoggedIn ? 'app' : 'auth');
    } catch {
      setAppState('auth');
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setAppState('auth');
  };

  const handleAuthSuccess = useCallback(() => {
    setAppState('app');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    setAppState('auth');
  }, []);

  if (appState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserModeProvider>
            <AuthContext.Provider value={{ logout: handleLogout }}>
              <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
              {appState === 'onboarding' && (
                <OnboardingScreen onComplete={handleOnboardingComplete} />
              )}
              {appState === 'auth' && (
                <AuthScreen onAuthSuccess={handleAuthSuccess} />
              )}
              {appState === 'app' && (
                <AppNavigator />
              )}
            </AuthContext.Provider>
          </UserModeProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
