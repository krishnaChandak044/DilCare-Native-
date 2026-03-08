/**
 * User Mode Context - Manages parent/child mode switching
 * Ported from web app's useUserMode.tsx
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserMode = 'parent' | 'child';

export interface ParentProfile {
    id: string;
    name: string;
    age: number;
    linkCode: string;
    healthData: {
        bloodPressure?: { systolic: number; diastolic: number };
        bloodSugar?: number;
        stepsToday?: number;
        waterIntake?: number;
    };
    medicines: {
        total: number;
        taken: number;
        nextDue?: { name: string; time: string };
    };
}

interface UserModeContextType {
    mode: UserMode;
    setMode: (mode: UserMode) => void;
    parentLinkCode: string;
    generateNewLinkCode: () => void;
    parentProfile: ParentProfile | null;
    setParentProfile: (profile: ParentProfile) => void;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

const generateLinkCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const MODE_STORAGE_KEY = 'dilcare_user_mode';
const LINK_CODE_STORAGE_KEY = 'dilcare_parent_link_code';
const PARENT_PROFILE_KEY = 'dilcare_parent_profile';

export const UserModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<UserMode>('parent');
    const [parentLinkCode, setParentLinkCode] = useState<string>('');
    const [parentProfile, setParentProfileState] = useState<ParentProfile | null>(null);

    useEffect(() => {
        loadStoredData();
    }, []);

    const loadStoredData = async () => {
        try {
            const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
            const savedLinkCode = await AsyncStorage.getItem(LINK_CODE_STORAGE_KEY);
            const savedProfile = await AsyncStorage.getItem(PARENT_PROFILE_KEY);

            if (savedMode) setModeState(savedMode as UserMode);

            if (savedLinkCode) {
                setParentLinkCode(savedLinkCode);
            } else {
                const newCode = generateLinkCode();
                setParentLinkCode(newCode);
                await AsyncStorage.setItem(LINK_CODE_STORAGE_KEY, newCode);
            }

            if (savedProfile) {
                setParentProfileState(JSON.parse(savedProfile));
            }
        } catch (error) {
            console.error('Error loading user mode data:', error);
        }
    };

    const setMode = async (newMode: UserMode) => {
        setModeState(newMode);
        await AsyncStorage.setItem(MODE_STORAGE_KEY, newMode);
    };

    const generateNewLinkCode = async () => {
        const newCode = generateLinkCode();
        setParentLinkCode(newCode);
        await AsyncStorage.setItem(LINK_CODE_STORAGE_KEY, newCode);
    };

    const setParentProfile = async (profile: ParentProfile) => {
        setParentProfileState(profile);
        await AsyncStorage.setItem(PARENT_PROFILE_KEY, JSON.stringify(profile));
    };

    return (
        <UserModeContext.Provider
            value={{
                mode,
                setMode,
                parentLinkCode,
                generateNewLinkCode,
                parentProfile,
                setParentProfile,
            }}
        >
            {children}
        </UserModeContext.Provider>
    );
};

export const useUserMode = (): UserModeContextType => {
    const context = useContext(UserModeContext);
    if (!context) {
        throw new Error('useUserMode must be used within a UserModeProvider');
    }
    return context;
};

export default UserModeContext;
