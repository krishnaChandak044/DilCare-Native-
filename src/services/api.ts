/**
 * API Service Layer — DilCare Backend
 * Connects to the Django REST Framework backend.
 *
 * Phase 1: userService is LIVE (real API calls)
 * Phase 2+: remaining services still return placeholders
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configuration ─────────────────────────────────────────────────
// For Android emulator use 10.0.2.2, for iOS simulator use localhost
// For physical device use your machine's local IP (e.g. 192.168.x.x)
const API_BASE_URL = 'http://localhost:8000/api/v1';

const TOKEN_KEY = '@dilcare_access_token';
const REFRESH_KEY = '@dilcare_refresh_token';

// ─── Token Management ──────────────────────────────────────────────
export const tokenManager = {
    getAccessToken: () => AsyncStorage.getItem(TOKEN_KEY),
    getRefreshToken: () => AsyncStorage.getItem(REFRESH_KEY),

    setTokens: async (access: string, refresh: string) => {
        await AsyncStorage.multiSet([
            [TOKEN_KEY, access],
            [REFRESH_KEY, refresh],
        ]);
    },

    clearTokens: async () => {
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
    },
};

// ─── HTTP Client ───────────────────────────────────────────────────
interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    status: number;
}

async function apiCall<T>(
    endpoint: string,
    options: {
        method?: string;
        body?: Record<string, unknown> | string;
        auth?: boolean;
    } = {},
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, auth = true } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Attach JWT token if auth is required
    if (auth) {
        const token = await tokenManager.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        });

        // Handle 401 → try refresh token
        if (response.status === 401 && auth) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                // Retry the original request with new token
                const newToken = await tokenManager.getAccessToken();
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method,
                    headers,
                    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
                });
                const retryData = retryResponse.ok ? await retryResponse.json() : null;
                return { data: retryData, error: retryResponse.ok ? null : 'Request failed', status: retryResponse.status };
            }
            return { data: null, error: 'Session expired', status: 401 };
        }

        const data = response.ok ? await response.json().catch(() => null) : null;
        const error = response.ok ? null : await response.text().catch(() => 'Request failed');
        return { data, error, status: response.status };
    } catch (err) {
        console.error(`[API Error] ${endpoint}:`, err);
        return { data: null, error: 'Network error', status: 0 };
    }
}

async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            await tokenManager.setTokens(data.access, data.refresh || refreshToken);
            return true;
        }
    } catch (err) {
        console.error('[Token Refresh Error]:', err);
    }
    return false;
}

// ─── Placeholder helper for services not yet connected ─────────────
function placeholder<T>(endpoint: string): Promise<ApiResponse<T>> {
    console.log(`[API Placeholder] ${endpoint}`);
    return Promise.resolve({ data: null, error: null, status: 200 });
}

// ════════════════════════════════════════════════════════════════════
// AUTH SERVICE (LIVE ✅)
// ════════════════════════════════════════════════════════════════════
export const authService = {
    register: async (email: string, password: string, name?: string) => {
        const resp = await apiCall<{
            message: string;
            user: Record<string, unknown>;
            tokens: { access: string; refresh: string };
        }>('/auth/register/', {
            method: 'POST',
            body: { email, password, password_confirm: password, name: name || '' },
            auth: false,
        });
        if (resp.data?.tokens) {
            await tokenManager.setTokens(resp.data.tokens.access, resp.data.tokens.refresh);
        }
        return resp;
    },

    login: async (email: string, password: string) => {
        const resp = await apiCall<{ access: string; refresh: string }>('/auth/login/', {
            method: 'POST',
            body: { email, password },
            auth: false,
        });
        if (resp.data) {
            await tokenManager.setTokens(resp.data.access, resp.data.refresh);
        }
        return resp;
    },

    logout: async () => {
        // Blacklist the refresh token on the server
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
            await apiCall('/auth/logout/', {
                method: 'POST',
                body: { refresh: refreshToken },
            });
        }
        await tokenManager.clearTokens();
    },

    isLoggedIn: async () => {
        const token = await tokenManager.getAccessToken();
        return !!token;
    },
};

// ════════════════════════════════════════════════════════════════════
// USER SERVICE (LIVE ✅)
// ════════════════════════════════════════════════════════════════════
interface UserSettings {
    language?: string;
    notifications_enabled?: boolean;
    medicine_reminders?: boolean;
    appointment_reminders?: boolean;
    health_tips_enabled?: boolean;
    dark_mode?: boolean;
    units?: 'metric' | 'imperial';
    daily_step_goal?: number;
    daily_water_goal?: number;
}

interface UserProfile {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    age?: string;
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
    bloodGroup?: string;
    parentLinkCode?: string;
    dateJoined?: string;
    settings?: UserSettings;
}

interface UserDevice {
    id?: string;
    device_token: string;
    device_type: 'ios' | 'android' | 'web';
    device_name?: string;
    is_active?: boolean;
    created_at?: string;
}

export const userService = {
    // Quick auth check
    me: () => apiCall<{ id: string; email: string; name: string; is_authenticated: boolean }>('/user/me/'),

    // Profile management
    getProfile: () => apiCall<UserProfile>('/user/profile/'),

    updateProfile: (profile: Partial<UserProfile>) => {
        // Map frontend camelCase to backend snake_case
        const payload: Record<string, unknown> = {};
        if (profile.name !== undefined) payload.name = profile.name;
        if (profile.firstName !== undefined) payload.first_name = profile.firstName;
        if (profile.lastName !== undefined) payload.last_name = profile.lastName;
        if (profile.age !== undefined) payload.age = profile.age;
        if (profile.phone !== undefined) payload.phone = profile.phone;
        if (profile.address !== undefined) payload.address = profile.address;
        if (profile.emergencyContact !== undefined) payload.emergency_contact = profile.emergencyContact;
        if (profile.bloodGroup !== undefined) payload.blood_group = profile.bloodGroup;
        return apiCall<UserProfile>('/user/profile/', { method: 'PATCH', body: payload });
    },

    // Link code for family linking
    getParentLinkCode: () => apiCall<{ parent_link_code: string }>('/user/link-code/'),
    regenerateLinkCode: () => apiCall<{ parent_link_code: string }>('/user/link-code/regenerate/', { method: 'POST' }),

    // User settings
    getSettings: () => apiCall<UserSettings>('/user/settings/'),
    updateSettings: (settings: Partial<UserSettings>) => apiCall<UserSettings>('/user/settings/', { method: 'PATCH', body: settings }),

    // Password management
    changePassword: (currentPassword: string, newPassword: string) =>
        apiCall<{ message: string }>('/user/change-password/', {
            method: 'POST',
            body: {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirm: newPassword,
            },
        }),

    // Device management (for push notifications)
    getDevices: () => apiCall<UserDevice[]>('/user/devices/'),
    registerDevice: (device: Omit<UserDevice, 'id' | 'is_active' | 'created_at'>) =>
        apiCall<UserDevice>('/user/devices/', { method: 'POST', body: device }),
    removeDevice: (token: string) => apiCall<void>(`/user/devices/${encodeURIComponent(token)}/`, { method: 'DELETE' }),
};

// ════════════════════════════════════════════════════════════════════
// SERVICES BELOW ARE PLACEHOLDERS — will be connected in future phases
// ════════════════════════════════════════════════════════════════════

interface HealthReading {
    id: string;
    type: string;
    value: string;
    date: string;
    time: string;
    status: string;
}

// ============ Health Service ============
export const healthService = {
    getHealthReadings: () => placeholder('/health/readings'),
    addHealthReading: (reading: HealthReading) => placeholder('/health/readings'),
    getHealthSummary: () => placeholder('/health/summary'),
};

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    taken: boolean;
}

interface Prescription {
    id: string;
    name: string;
    doctorName?: string;
    date?: string;
}

// ============ Medicine Service ============
export const medicineService = {
    getMedicines: () => placeholder('/medicines'),
    addMedicine: (medicine: Medicine) => placeholder('/medicines'),
    toggleMedicineTaken: (id: string) => placeholder(`/medicines/${id}/toggle`),
    deleteMedicine: (id: string) => placeholder(`/medicines/${id}`),
    getPrescriptions: () => placeholder('/prescriptions'),
    addPrescription: (prescription: Prescription) => placeholder('/prescriptions'),
    deletePrescription: (id: string) => placeholder(`/prescriptions/${id}`),
};

// ============ Step Service ============
export const stepService = {
    getStepData: () => placeholder('/steps'),
    addManualSteps: (steps: number) => placeholder('/steps/manual'),
    getStepGoals: () => placeholder('/steps/goals'),
    updateStepGoal: (goal: number) => placeholder('/steps/goals'),
    connectGoogleFit: () => placeholder('/steps/google-fit/connect'),
    disconnectGoogleFit: () => placeholder('/steps/google-fit/disconnect'),
};

// ============ Water Service ============
export const waterService = {
    getWaterData: () => placeholder('/water'),
    addGlass: () => placeholder('/water/add'),
    removeGlass: () => placeholder('/water/remove'),
    getWaterHistory: () => placeholder('/water/history'),
};

// ============ Family Service ============
export const familyService = {
    linkParent: (linkCode: string) => placeholder('/family/link'),
    unlinkParent: (parentId: string) => placeholder(`/family/unlink/${parentId}`),
    getLinkedParents: () => placeholder('/family/parents'),
    getParentHealth: (parentId: string) => placeholder(`/family/parents/${parentId}/health`),
};

interface Doctor {
    id: string;
    name: string;
    specialty?: string;
    phone?: string;
    address?: string;
    isPrimary?: boolean;
}

interface Appointment {
    id: string;
    doctorId?: string;
    date: string;
    time?: string;
    reason?: string;
    status?: string;
}

// ============ Doctor Service ============
export const doctorService = {
    getDoctors: () => placeholder('/doctors'),
    addDoctor: (doctor: Doctor) => placeholder('/doctors'),
    getAppointments: () => placeholder('/appointments'),
    addAppointment: (appointment: Appointment) => placeholder('/appointments'),
    getDocuments: () => placeholder('/documents'),
    generateHealthReport: () => placeholder('/documents/health-report'),
};

// ============ AI Service ============
export const aiService = {
    sendMessage: (message: string) => placeholder('/ai/chat'),
    getConversationHistory: () => placeholder('/ai/history'),
};

// ============ Community Service ============
export const communityService = {
    getLeaderboard: () => placeholder('/community/leaderboard'),
    getGroups: () => placeholder('/community/groups'),
    getChallenges: () => placeholder('/community/challenges'),
    getNotifications: () => placeholder('/community/notifications'),
};

interface BMIRecord {
    id: string;
    weight: number;
    height: number;
    bmi: number;
    date: string;
    category: string;
}

// ============ BMI Service ============
export const bmiService = {
    getBMIHistory: () => placeholder('/bmi/history'),
    saveBMIRecord: (record: BMIRecord) => placeholder('/bmi'),
};

// ============ Gyaan/Wellness Service ============
export const gyaanService = {
    getTips: () => placeholder('/gyaan/tips'),
    toggleFavorite: (id: string) => placeholder(`/gyaan/tips/${id}/favorite`),
    markComplete: (id: string) => placeholder(`/gyaan/tips/${id}/complete`),
};

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship?: string;
    isPrimary?: boolean;
}

// ============ SOS Service ============
export const sosService = {
    getEmergencyContacts: () => placeholder('/sos/contacts'),
    addEmergencyContact: (contact: EmergencyContact) => placeholder('/sos/contacts'),
    deleteEmergencyContact: (id: string) => placeholder(`/sos/contacts/${id}`),
    triggerSOS: (location?: { lat: number; lng: number }) => placeholder('/sos/trigger'),
};
