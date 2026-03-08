/**
 * ThemeContext — Dark mode support
 * Provides theme toggling, persists to AsyncStorage,
 * and exposes a reactive `colors` object that all screens can use.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as LightColors } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

// Dark color palette — surfaces are dark, text is light
const DarkColors: typeof LightColors = {
    ...LightColors,
    // Core surfaces
    background: '#0F172A',
    foreground: '#F1F5F9',
    card: '#1E293B',
    cardForeground: '#F1F5F9',

    // Secondary
    secondary: '#1E293B',
    secondaryForeground: '#E2E8F0',
    secondaryHover: '#334155',

    // Muted
    muted: '#1E293B',
    mutedForeground: '#94A3B8',

    // Borders
    border: '#334155',
    input: '#334155',

    // Glass
    glassBackground: 'rgba(15, 23, 42, 0.80)',
    glassBorder: 'rgba(51, 65, 85, 0.30)',

    // Feature bg tones (subtle dark versions)
    blue50: '#1E3A5F',
    orange50: '#3D2200',
    purple50: '#2D1B4E',
    emerald50: '#0D3B2E',
    red50: '#3B1111',

    primaryLight: '#1E3A5F',
    accentLight: '#0D3B2E',
};

interface ThemeContextType {
    isDark: boolean;
    themeMode: ThemeMode;
    colors: typeof LightColors;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    themeMode: 'system',
    colors: LightColors,
    setThemeMode: () => { },
    toggleTheme: () => { },
});

const THEME_STORAGE_KEY = '@dilcare_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
            if (stored && ['light', 'dark', 'system'].includes(stored)) {
                setThemeModeState(stored as ThemeMode);
            }
        });
    }, []);

    const setThemeMode = useCallback((mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    }, []);

    const toggleTheme = useCallback(() => {
        const next = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
    }, [themeMode, setThemeMode]);

    const isDark = themeMode === 'system'
        ? systemScheme === 'dark'
        : themeMode === 'dark';

    const colors = useMemo(() => isDark ? DarkColors : LightColors, [isDark]);

    return (
        <ThemeContext.Provider value={{ isDark, themeMode, colors, setThemeMode, toggleTheme }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
