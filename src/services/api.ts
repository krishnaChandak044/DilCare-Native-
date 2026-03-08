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
// HEALTH SERVICE (LIVE ✅)
// ════════════════════════════════════════════════════════════════════

interface HealthReading {
    id: string;
    type: 'bp' | 'sugar' | 'weight' | 'heartRate';
    value: string;
    unit: string;
    status: 'normal' | 'warning' | 'danger';
    date: string;
    time: string;
    notes?: string;
    recorded_at: string;
    created_at: string;
}

interface HealthReadingCreate {
    type: 'bp' | 'sugar' | 'weight' | 'heartRate';
    value: string;
    notes?: string;
    recorded_at?: string;
}

interface HealthSummary {
    type: string;
    value: string;
    unit: string;
    status: string;
    recorded_at: string | null;
    date: string | null;
    time: string | null;
}

interface HealthTrends {
    labels: string[];
    data: (number | null)[];
    reading_type: string;
}

interface HealthGoal {
    id: string;
    type: string;
    min_value?: number;
    max_value?: number;
    target_value?: number;
}

export const healthService = {
    // List health readings with optional filters
    getHealthReadings: (params?: { type?: string; start_date?: string; end_date?: string; limit?: number }) => {
        let endpoint = '/health/readings/';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.type) queryParams.append('type', params.type);
            if (params.start_date) queryParams.append('start_date', params.start_date);
            if (params.end_date) queryParams.append('end_date', params.end_date);
            if (params.limit) queryParams.append('limit', params.limit.toString());
            const queryString = queryParams.toString();
            if (queryString) endpoint += `?${queryString}`;
        }
        return apiCall<HealthReading[]>(endpoint);
    },

    // Add a new health reading
    addHealthReading: (reading: HealthReadingCreate) =>
        apiCall<HealthReading>('/health/readings/', { method: 'POST', body: reading as unknown as Record<string, unknown> }),

    // Get a specific reading
    getHealthReading: (id: string) => apiCall<HealthReading>(`/health/readings/${id}/`),

    // Delete a reading (soft delete)
    deleteHealthReading: (id: string) => apiCall<void>(`/health/readings/${id}/`, { method: 'DELETE' }),

    // Get health summary (latest reading of each type)
    getHealthSummary: () => apiCall<HealthSummary[]>('/health/summary/'),

    // Get trends for charts
    getHealthTrends: (type?: string, period?: 'week' | 'month') => {
        let endpoint = '/health/trends/';
        const queryParams = new URLSearchParams();
        if (type) queryParams.append('type', type);
        if (period) queryParams.append('period', period);
        const queryString = queryParams.toString();
        if (queryString) endpoint += `?${queryString}`;
        return apiCall<HealthTrends>(endpoint);
    },

    // Health goals
    getHealthGoals: () => apiCall<HealthGoal[]>('/health/goals/'),
    setHealthGoal: (goal: Omit<HealthGoal, 'id'>) =>
        apiCall<HealthGoal>('/health/goals/', { method: 'POST', body: goal as unknown as Record<string, unknown> }),
};

// ════════════════════════════════════════════════════════════════════
// MEDICINE SERVICE — Connected to /api/v1/medicine/
// ════════════════════════════════════════════════════════════════════

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
    schedule_times: string;
    time_list: string[];
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    reminder_enabled: boolean;
    reminder_minutes_before: number;
    today_status: {
        total: number;
        taken: number;
        missed: number;
        pending: number;
        all_taken: boolean;
    };
    created_at: string;
    updated_at: string;
}

interface MedicineCreate {
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    schedule_times?: string;
    start_date?: string;
    end_date?: string;
    reminder_enabled?: boolean;
    reminder_minutes_before?: number;
}

interface TodayMedicine {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    taken: boolean;
    missed: boolean;
    intake_id: string | null;
}

interface MedicineIntake {
    id: string;
    medicine: string;
    medicine_name: string;
    medicine_dosage: string;
    scheduled_date: string;
    scheduled_time: string;
    status: 'pending' | 'taken' | 'missed' | 'skipped';
    taken_at: string | null;
    notes: string;
    created_at: string;
}

interface MedicineSummary {
    total_medicines: number;
    active_medicines: number;
    today_total: number;
    today_taken: number;
    today_missed: number;
    today_pending: number;
    adherence_rate_7d: number;
    adherence_rate_30d: number;
}

interface Prescription {
    id: string;
    name: string;
    doctor_name: string;
    hospital_name: string;
    prescription_date: string | null;
    file: string | null;
    file_type: 'image' | 'pdf' | 'other';
    file_url: string;
    file_size: number | null;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface PrescriptionCreate {
    name: string;
    doctor_name?: string;
    hospital_name?: string;
    prescription_date?: string;
    file_type?: 'image' | 'pdf' | 'other';
    file_url?: string;
    notes?: string;
}

// ============ Medicine Service ============
export const medicineService = {
    // Medicines CRUD
    getMedicines: (isActive?: boolean) => {
        const params = isActive !== undefined ? `?is_active=${isActive}` : '';
        return apiCall<Medicine[]>(`/medicine/medicines/${params}`);
    },
    getMedicine: (id: string) => apiCall<Medicine>(`/medicine/medicines/${id}/`),
    addMedicine: (medicine: MedicineCreate) =>
        apiCall<Medicine>('/medicine/medicines/', { method: 'POST', body: medicine as unknown as Record<string, unknown> }),
    updateMedicine: (id: string, medicine: Partial<MedicineCreate>) =>
        apiCall<Medicine>(`/medicine/medicines/${id}/`, { method: 'PATCH', body: medicine as unknown as Record<string, unknown> }),
    deleteMedicine: (id: string) =>
        apiCall<void>(`/medicine/medicines/${id}/`, { method: 'DELETE' }),

    // Today's schedule
    getTodayMedicines: (date?: string) => {
        const params = date ? `?date=${date}` : '';
        return apiCall<TodayMedicine[]>(`/medicine/today/${params}`);
    },

    // Intake management
    toggleMedicineIntake: (intakeId: string, status?: 'taken' | 'missed' | 'skipped' | 'pending', notes?: string) =>
        apiCall<MedicineIntake>(`/medicine/intakes/${intakeId}/toggle/`, {
            method: 'POST',
            body: { status, notes } as Record<string, unknown>,
        }),
    getIntakes: (params?: { date?: string; medicine_id?: string; status?: string }) => {
        const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return apiCall<MedicineIntake[]>(`/medicine/intakes/${queryString}`);
    },

    // Summary
    getSummary: () => apiCall<MedicineSummary>('/medicine/summary/'),

    // Prescriptions CRUD
    getPrescriptions: () => apiCall<Prescription[]>('/medicine/prescriptions/'),
    getPrescription: (id: string) => apiCall<Prescription>(`/medicine/prescriptions/${id}/`),
    addPrescription: (prescription: PrescriptionCreate) =>
        apiCall<Prescription>('/medicine/prescriptions/', { method: 'POST', body: prescription as unknown as Record<string, unknown> }),
    updatePrescription: (id: string, prescription: Partial<PrescriptionCreate>) =>
        apiCall<Prescription>(`/medicine/prescriptions/${id}/`, { method: 'PATCH', body: prescription as unknown as Record<string, unknown> }),
    deletePrescription: (id: string) =>
        apiCall<void>(`/medicine/prescriptions/${id}/`, { method: 'DELETE' }),
};

// ════════════════════════════════════════════════════════════════════
// WATER SERVICE — Connected to /api/v1/water/
// ════════════════════════════════════════════════════════════════════

interface TodayWater {
    date: string;
    glasses: number;
    goal_glasses: number;
    glass_size_ml: number;
    total_ml: number;
    progress_percent: number;
    goal_reached: boolean;
    streak: number;
    reminder_enabled: boolean;
}

interface WaterGoal {
    id: string | null;
    daily_glasses: number;
    glass_size_ml: number;
    daily_target_ml: number;
    reminder_enabled: boolean;
    reminder_interval_hours: number;
    is_active: boolean;
}

interface WaterHistory {
    date: string;
    glasses: number;
    goal_glasses: number;
    total_ml: number;
    progress_percent: number;
    goal_reached: boolean;
}

interface WaterStats {
    current_streak: number;
    longest_streak: number;
    total_glasses_7d: number;
    total_glasses_30d: number;
    avg_glasses_7d: number;
    avg_glasses_30d: number;
    goals_met_7d: number;
    goals_met_30d: number;
}

// ============ Water Service ============
export const waterService = {
    // Today's water data
    getWaterData: () => apiCall<TodayWater>('/water/today/'),

    // Add/Remove glasses
    addGlass: (count: number = 1, notes?: string) =>
        apiCall<TodayWater>('/water/add/', {
            method: 'POST',
            body: { count, notes } as Record<string, unknown>,
        }),
    removeGlass: (count: number = 1) =>
        apiCall<TodayWater>('/water/remove/', {
            method: 'POST',
            body: { count } as Record<string, unknown>,
        }),

    // History and stats
    getWaterHistory: (days: number = 7) =>
        apiCall<WaterHistory[]>(`/water/history/?days=${days}`),
    getWaterStats: () => apiCall<WaterStats>('/water/stats/'),

    // Goal management
    getGoal: () => apiCall<WaterGoal>('/water/goal/'),
    updateGoal: (goal: Partial<Omit<WaterGoal, 'id' | 'daily_target_ml'>>) =>
        apiCall<WaterGoal>('/water/goal/', {
            method: 'PUT',
            body: goal as Record<string, unknown>,
        }),
};

// ════════════════════════════════════════════════════════════════════
// STEPS SERVICE — Connected to /api/v1/steps/
// ════════════════════════════════════════════════════════════════════

export interface TodaySteps {
    id: string | null;
    date: string;
    total_steps: number;
    manual_steps: number;
    synced_steps: number;
    goal_steps: number;
    goal_met: boolean;
    calories_burned: number;
    distance_km: number;
    active_minutes: number;
    source: string;
    progress_percent: number;
}

export interface StepGoalData {
    id: string;
    daily_goal: number;
    stride_length_cm: number;
    calories_per_step: number;
    created_at: string;
    updated_at: string;
}

export interface StepStats {
    today_steps: number;
    today_goal: number;
    today_progress: number;
    today_calories: number;
    today_distance_km: number;
    today_active_minutes: number;
    current_streak: number;
    longest_streak: number;
    week_total_steps: number;
    week_avg_steps: number;
    week_days_goal_met: number;
    month_total_steps: number;
    month_avg_steps: number;
    month_days_goal_met: number;
}

export interface WeeklyChart {
    labels: string[];
    data: number[];
    goals: number[];
}

export interface StepEntryData {
    id: string;
    date: string;
    steps: number;
    source: string;
    source_display: string;
    notes: string;
    recorded_at: string;
    created_at: string;
}

// ============ Step Service ============
export const stepService = {
    // Today's step data
    getStepData: () => apiCall<TodaySteps>('/steps/today/'),

    // Add/Remove steps
    addManualSteps: (steps: number, notes?: string) =>
        apiCall<TodaySteps>('/steps/add/', {
            method: 'POST',
            body: { steps, notes } as Record<string, unknown>,
        }),
    removeSteps: (steps: number) =>
        apiCall<TodaySteps>('/steps/remove/', {
            method: 'POST',
            body: { steps } as Record<string, unknown>,
        }),

    // Goal management
    getStepGoal: () => apiCall<StepGoalData>('/steps/goal/'),
    updateStepGoal: (goal: Partial<StepGoalData>) =>
        apiCall<StepGoalData>('/steps/goal/', {
            method: 'PUT',
            body: goal as Record<string, unknown>,
        }),

    // History for charts
    getStepHistory: (days: number = 7) =>
        apiCall<TodaySteps[]>(`/steps/history/?days=${days}`),

    // Stats
    getStepStats: () => apiCall<StepStats>('/steps/stats/'),

    // Weekly chart data
    getWeeklyChart: () => apiCall<WeeklyChart>('/steps/weekly-chart/'),

    // Entries
    getEntries: () => apiCall<StepEntryData[]>('/steps/entries/'),
};

// ============ Types for Family ============
export interface FamilyLink {
    id: string;
    parent_id: string;
    parent_info: {
        id: string;
        email: string;
        full_name: string;
    };
    relationship: string;
    relationship_display: string;
    is_active: boolean;
    linked_at: string;
}

export interface ParentHealthSummary {
    parent_id: string;
    parent_name: string;
    relationship: string;
    latest_bp: string | null;
    bp_status: string | null;
    bp_recorded_at: string | null;
    latest_sugar: string | null;
    sugar_status: string | null;
    sugar_recorded_at: string | null;
    latest_heart_rate: number | null;
    heart_rate_status: string | null;
    heart_rate_recorded_at: string | null;
    medicines_today_total: number;
    medicines_today_taken: number;
    medicine_adherence_percent: number;
    water_glasses_today: number;
    water_goal_today: number;
    overall_status: 'good' | 'warning' | 'danger';
    last_activity: string | null;
}

export interface LinkCodeInfo {
    link_code: string;
    linked_children_count: number;
}

// ============ Family Service ============
export const familyService = {
    // Link to a parent using their code
    linkParent: (linkCode: string, relationship: string = 'other') =>
        apiCall<FamilyLink>('/family/link/', {
            method: 'POST',
            body: { link_code: linkCode, relationship },
        }),

    // Unlink from a parent
    unlinkParent: (parentId: string) =>
        apiCall<{ message: string }>(`/family/unlink/${parentId}/`, {
            method: 'POST',
        }),

    // Get all linked parents
    getLinkedParents: () => apiCall<FamilyLink[]>('/family/parents/'),

    // Get a parent's health summary
    getParentHealth: (parentId: string) =>
        apiCall<ParentHealthSummary>(`/family/parents/${parentId}/health/`),

    // Get my link code (for parents to share with children)
    getMyLinkCode: () => apiCall<LinkCodeInfo>('/family/my-code/'),

    // Regenerate my link code
    regenerateLinkCode: () =>
        apiCall<LinkCodeInfo & { message: string }>('/family/my-code/', {
            method: 'POST',
        }),
};

// ============ Types for Doctor ============
export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    specialty_display: string;
    phone: string;
    email: string;
    hospital: string;
    address: string;
    notes: string;
    is_primary: boolean;
    appointments_count: number;
    created_at: string;
    updated_at: string;
}

export interface Appointment {
    id: string;
    doctor: string | null;
    doctor_name: string;
    specialty: string;
    appointment_date: string;
    appointment_time: string | null;
    reason: string;
    location: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
    status_display: string;
    notes: string;
    reminder_sent: boolean;
    documents_count?: number;
    created_at: string;
    updated_at: string;
}

export interface MedicalDocument {
    id: string;
    doctor: string | null;
    doctor_name: string | null;
    appointment: string | null;
    title: string;
    document_type: string;
    document_type_display: string;
    document_date: string;
    file: string | null;
    file_url: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface AppointmentStats {
    upcoming_count: number;
    completed_count: number;
    cancelled_count: number;
    missed_count: number;
    next_appointment: Appointment | null;
    recent_appointments: Appointment[];
}

// ============ Doctor Service ============
export const doctorService = {
    // Doctors
    getDoctors: () => apiCall<Doctor[]>('/doctor/doctors/'),
    
    getDoctor: (id: string) => apiCall<Doctor>(`/doctor/doctors/${id}/`),
    
    addDoctor: (doctor: Partial<Doctor>) =>
        apiCall<Doctor>('/doctor/doctors/', {
            method: 'POST',
            body: doctor as Record<string, unknown>,
        }),
    
    updateDoctor: (id: string, doctor: Partial<Doctor>) =>
        apiCall<Doctor>(`/doctor/doctors/${id}/`, {
            method: 'PATCH',
            body: doctor as Record<string, unknown>,
        }),
    
    deleteDoctor: (id: string) =>
        apiCall<void>(`/doctor/doctors/${id}/`, {
            method: 'DELETE',
        }),
    
    // Appointments
    getAppointments: (filters?: { status?: string; time?: 'upcoming' | 'past'; doctor?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.time) params.append('time', filters.time);
        if (filters?.doctor) params.append('doctor', filters.doctor);
        const queryString = params.toString();
        return apiCall<Appointment[]>(`/doctor/appointments/${queryString ? `?${queryString}` : ''}`);
    },
    
    getAppointment: (id: string) => apiCall<Appointment>(`/doctor/appointments/${id}/`),
    
    addAppointment: (appointment: Partial<Appointment>) =>
        apiCall<Appointment>('/doctor/appointments/', {
            method: 'POST',
            body: appointment as Record<string, unknown>,
        }),
    
    updateAppointment: (id: string, appointment: Partial<Appointment>) =>
        apiCall<Appointment>(`/doctor/appointments/${id}/`, {
            method: 'PATCH',
            body: appointment as Record<string, unknown>,
        }),
    
    deleteAppointment: (id: string) =>
        apiCall<void>(`/doctor/appointments/${id}/`, {
            method: 'DELETE',
        }),
    
    getAppointmentStats: () => apiCall<AppointmentStats>('/doctor/appointments/stats/'),
    
    // Medical Documents
    getDocuments: (filters?: { type?: string; doctor?: string; appointment?: string }) => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.doctor) params.append('doctor', filters.doctor);
        if (filters?.appointment) params.append('appointment', filters.appointment);
        const queryString = params.toString();
        return apiCall<MedicalDocument[]>(`/doctor/documents/${queryString ? `?${queryString}` : ''}`);
    },
    
    getDocument: (id: string) => apiCall<MedicalDocument>(`/doctor/documents/${id}/`),
    
    addDocument: (document: Partial<MedicalDocument>) =>
        apiCall<MedicalDocument>('/doctor/documents/', {
            method: 'POST',
            body: document as Record<string, unknown>,
        }),
    
    updateDocument: (id: string, document: Partial<MedicalDocument>) =>
        apiCall<MedicalDocument>(`/doctor/documents/${id}/`, {
            method: 'PATCH',
            body: document as Record<string, unknown>,
        }),
    
    deleteDocument: (id: string) =>
        apiCall<void>(`/doctor/documents/${id}/`, {
            method: 'DELETE',
        }),
};

// ════════════════════════════════════════════════════════════════════
// AI SERVICE — Connected to /api/v1/ai/
// ════════════════════════════════════════════════════════════════════

export interface AIMessageData {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_used: number | null;
    model_used: string;
    created_at: string;
}

export interface AIConversationData {
    id: string;
    title: string;
    is_active: boolean;
    last_message: string;
    message_count: number;
    created_at: string;
    updated_at: string;
}

export interface AIConversationDetailData extends AIConversationData {
    messages: AIMessageData[];
}

export interface AIChatResponse {
    conversation_id: string;
    user_message: AIMessageData;
    ai_message: AIMessageData;
}

export interface AIQuickCheckResponse {
    reply: string;
    model: string;
}

export const aiService = {
    // Send a message (creates new conversation or continues existing one)
    sendMessage: (message: string, conversationId?: string) =>
        apiCall<AIChatResponse>('/ai/chat/', {
            method: 'POST',
            body: conversationId
                ? { message, conversation_id: conversationId }
                : { message },
        }),

    // Quick one-shot health check (no conversation saved)
    quickCheck: (message: string) =>
        apiCall<AIQuickCheckResponse>('/ai/quick-check/', {
            method: 'POST',
            body: { message },
        }),

    // List all conversations
    getConversations: () =>
        apiCall<AIConversationData[]>('/ai/conversations/'),

    // Get a single conversation with all messages
    getConversation: (id: string) =>
        apiCall<AIConversationDetailData>(`/ai/conversations/${id}/`),

    // Get just messages for a conversation
    getMessages: (conversationId: string) =>
        apiCall<AIMessageData[]>(`/ai/conversations/${conversationId}/messages/`),

    // Delete a conversation
    deleteConversation: (id: string) =>
        apiCall<void>(`/ai/conversations/${id}/`, {
            method: 'DELETE',
        }),
};

// ════════════════════════════════════════════════════════════════════
// COMMUNITY SERVICE — Connected to /api/v1/community/
// ════════════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    user_name: string;
    total_steps: number;
    avg_steps: number;
    days_active: number;
    is_self: boolean;
}

export interface Leaderboard {
    period: string;
    period_label: string;
    entries: LeaderboardEntry[];
    my_rank: number | null;
    my_steps: number;
    total_participants: number;
}

export interface CommunityGroupData {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    is_public: boolean;
    max_members: number;
    invite_code: string;
    member_count: number;
    created_by: string;
    created_by_name: string;
    is_member: boolean;
    my_role: string | null;
    created_at: string;
    updated_at: string;
}

export interface GroupMember {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    role: string;
    role_display: string;
    is_active: boolean;
    joined_at: string;
}

export interface ChallengeData {
    id: string;
    title: string;
    description: string;
    challenge_type: 'steps' | 'water' | 'medicine' | 'custom';
    type_display: string;
    icon: string;
    color: string;
    target_value: number;
    target_unit: string;
    start_date: string;
    end_date: string;
    status: 'upcoming' | 'active' | 'completed' | 'cancelled';
    status_display: string;
    days_remaining: number;
    created_by: string;
    created_by_name: string;
    group: string | null;
    group_name: string | null;
    is_public: boolean;
    max_participants: number;
    participant_count: number;
    is_joined: boolean;
    my_progress: number;
    my_progress_percent: number;
    created_at: string;
    updated_at: string;
}

export interface ChallengeParticipantData {
    id: string;
    user_id: string;
    user_name: string;
    cached_progress: number;
    progress_percent: number;
    is_completed: boolean;
    joined_at: string;
    last_progress_update: string | null;
}

export interface CommunityNotificationData {
    id: string;
    notification_type: string;
    type_display: string;
    title: string;
    message: string;
    is_read: boolean;
    read_at: string | null;
    challenge_title: string | null;
    group_name: string | null;
    created_at: string;
}

// ============ Community Service ============
export const communityService = {
    // ── Leaderboard (Steps Integration) ──────────────────────
    getLeaderboard: (period: string = 'week', groupId?: string) => {
        const params = new URLSearchParams({ period });
        if (groupId) params.append('group', groupId);
        return apiCall<Leaderboard>(`/community/leaderboard/?${params.toString()}`);
    },

    // ── Groups ───────────────────────────────────────────────
    getGroups: () => apiCall<CommunityGroupData[]>('/community/groups/'),

    getGroup: (id: string) => apiCall<CommunityGroupData>(`/community/groups/${id}/`),

    createGroup: (data: { name: string; description?: string; icon?: string; color?: string; is_public?: boolean; max_members?: number }) =>
        apiCall<CommunityGroupData>('/community/groups/', {
            method: 'POST',
            body: data as Record<string, unknown>,
        }),

    updateGroup: (id: string, data: Partial<{ name: string; description: string; icon: string; color: string; is_public: boolean; max_members: number }>) =>
        apiCall<CommunityGroupData>(`/community/groups/${id}/`, {
            method: 'PATCH',
            body: data as Record<string, unknown>,
        }),

    deleteGroup: (id: string) =>
        apiCall<void>(`/community/groups/${id}/`, { method: 'DELETE' }),

    getGroupMembers: (id: string) =>
        apiCall<GroupMember[]>(`/community/groups/${id}/members/`),

    joinGroup: (inviteCode: string) =>
        apiCall<CommunityGroupData>('/community/groups/join/', {
            method: 'POST',
            body: { invite_code: inviteCode },
        }),

    leaveGroup: (id: string) =>
        apiCall<{ message: string }>(`/community/groups/${id}/leave/`, {
            method: 'POST',
        }),

    // ── Challenges ───────────────────────────────────────────
    getChallenges: (filters?: { status?: string; type?: string; joined?: boolean }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.type) params.append('type', filters.type);
        if (filters?.joined) params.append('joined', 'true');
        const qs = params.toString();
        return apiCall<ChallengeData[]>(`/community/challenges/${qs ? `?${qs}` : ''}`);
    },

    getChallenge: (id: string) =>
        apiCall<ChallengeData>(`/community/challenges/${id}/`),

    createChallenge: (data: {
        title: string; description?: string; challenge_type?: string;
        icon?: string; color?: string;
        target_value: number; target_unit?: string;
        start_date: string; end_date: string;
        group?: string; is_public?: boolean; max_participants?: number;
    }) =>
        apiCall<ChallengeData>('/community/challenges/', {
            method: 'POST',
            body: data as Record<string, unknown>,
        }),

    joinChallenge: (id: string) =>
        apiCall<ChallengeData>(`/community/challenges/${id}/join/`, {
            method: 'POST',
        }),

    leaveChallenge: (id: string) =>
        apiCall<{ message: string }>(`/community/challenges/${id}/leave/`, {
            method: 'POST',
        }),

    getChallengeParticipants: (id: string) =>
        apiCall<ChallengeParticipantData[]>(`/community/challenges/${id}/participants/`),

    refreshChallengeProgress: (id: string) =>
        apiCall<{
            challenge_id: string;
            cached_progress: number;
            target_value: number;
            progress_percent: number;
            is_completed: boolean;
        }>(`/community/challenges/${id}/refresh/`, { method: 'POST' }),

    cancelChallenge: (id: string) =>
        apiCall<{ message: string }>(`/community/challenges/${id}/`, {
            method: 'DELETE',
        }),

    // ── Notifications ────────────────────────────────────────
    getNotifications: (unreadOnly?: boolean) => {
        const params = unreadOnly ? '?unread=true' : '';
        return apiCall<CommunityNotificationData[]>(`/community/notifications/${params}`);
    },

    markNotificationRead: (id: string) =>
        apiCall<CommunityNotificationData>(`/community/notifications/${id}/read/`, {
            method: 'POST',
        }),

    markAllNotificationsRead: () =>
        apiCall<{ message: string }>('/community/notifications/read-all/', {
            method: 'POST',
        }),

    getUnreadCount: () =>
        apiCall<{ unread_count: number }>('/community/notifications/unread-count/'),
};

export interface BMIRecord {
    id: string;
    weight: number;
    height: number;
    bmi: number;
    category: string;
    date: string;         // ISO: YYYY-MM-DD (from backend)
    notes: string;
    created_at: string;
}

export interface CreateBMIRecord {
    weight: number;
    height: number;
    date: string;         // ISO: YYYY-MM-DD
    notes?: string;
}

export interface BMIStats {
    latest_bmi: number | null;
    latest_category: string | null;
    average_bmi: number | null;
    total_records: number;
    trend: 'up' | 'down' | 'stable' | null;
}

// ============ BMI Service ============
export const bmiService = {
    /** List all BMI records for the authenticated user (newest first). */
    getBMIHistory: () =>
        apiCall<BMIRecord[]>('/bmi/'),

    /** Save a new BMI record. Backend computes bmi & category. */
    saveBMIRecord: (record: CreateBMIRecord) =>
        apiCall<BMIRecord>('/bmi/', {
            method: 'POST',
            body: JSON.stringify(record),
        }),

    /** Delete a specific BMI record by id. */
    deleteBMIRecord: (id: string) =>
        apiCall<void>(`/bmi/${id}/`, { method: 'DELETE' }),

    /** Get aggregate stats: latest bmi, average, trend, total records. */
    getStats: () =>
        apiCall<BMIStats>('/bmi/stats/'),
};

// ============ Gyaan/Wellness Service ============

export interface WellnessTipData {
    id: string;
    title: string;
    description: string;
    content: string;
    category: 'nutrition' | 'exercise' | 'meditation' | 'ayurveda';
    icon: string;
    duration: number | null;
    completed: boolean;
    favorite: boolean;
    created_at: string;
}

export interface GyaanStats {
    total_tips: number;
    completed: number;
    favorites: number;
    progress: number;
}

export const gyaanService = {
    /** List all active tips. Optional ?category= filter. */
    getTips: (category?: string) =>
        apiCall<WellnessTipData[]>(`/gyaan/tips/${category ? `?category=${category}` : ''}`),

    /** Get a single tip by id. */
    getTipDetail: (id: string) =>
        apiCall<WellnessTipData>(`/gyaan/tips/${id}/`),

    /** Toggle favourite status for a tip. Returns { favorite: boolean }. */
    toggleFavorite: (id: string) =>
        apiCall<{ favorite: boolean }>(`/gyaan/tips/${id}/favorite/`, { method: 'POST' }),

    /** Toggle completed status for a tip. Returns { completed: boolean }. */
    markComplete: (id: string) =>
        apiCall<{ completed: boolean }>(`/gyaan/tips/${id}/complete/`, { method: 'POST' }),

    /** Get tip stats: total, completed, favorites, progress %. */
    getStats: () =>
        apiCall<GyaanStats>('/gyaan/stats/'),
};

// ============ SOS Service ============

export interface EmergencyContactData {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    is_primary: boolean;
    created_at: string;
}

export interface CreateEmergencyContact {
    name: string;
    phone: string;
    relationship?: string;
    is_primary?: boolean;
}

export interface SOSAlertData {
    id: string;
    latitude: number | null;
    longitude: number | null;
    resolved: boolean;
    resolved_at: string | null;
    notified_contacts: EmergencyContactData[];
    created_at: string;
}

export const sosService = {
    /** List all emergency contacts for the user. */
    getEmergencyContacts: () =>
        apiCall<EmergencyContactData[]>('/sos/contacts/'),

    /** Add a new emergency contact. */
    addEmergencyContact: (contact: CreateEmergencyContact) =>
        apiCall<EmergencyContactData>('/sos/contacts/', {
            method: 'POST',
            body: JSON.stringify(contact),
        }),

    /** Update an emergency contact. */
    updateEmergencyContact: (id: string, data: Partial<CreateEmergencyContact>) =>
        apiCall<EmergencyContactData>(`/sos/contacts/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    /** Delete an emergency contact. */
    deleteEmergencyContact: (id: string) =>
        apiCall<void>(`/sos/contacts/${id}/`, { method: 'DELETE' }),

    /** Trigger an SOS alert. Optional location. */
    triggerSOS: (location?: { latitude: number; longitude: number }) =>
        apiCall<SOSAlertData>('/sos/trigger/', {
            method: 'POST',
            body: JSON.stringify(location ?? {}),
        }),

    /** List all SOS alert history. */
    getAlerts: () =>
        apiCall<SOSAlertData[]>('/sos/alerts/'),

    /** Resolve an SOS alert. */
    resolveAlert: (id: string) =>
        apiCall<SOSAlertData>(`/sos/alerts/${id}/resolve/`, { method: 'POST' }),
};
