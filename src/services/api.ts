/**
 * API Service Layer - All backend API placeholders
 * Replace these with real API calls when backend is ready
 */

const _API_BASE_URL = 'https://api.dilcare.com/v1'; // TODO: Replace with real URL

interface ApiOptions {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
}

// Generic API helper placeholder
function apiCall<T>(endpoint: string, _options?: ApiOptions): Promise<T | null> {
    // TODO: Implement real API call
    // const response = await fetch(`${_API_BASE_URL}${endpoint}`, {
    //   headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    //   ...options,
    // });
    // return response.json();
    console.log(`[API Placeholder] ${endpoint}`);
    return Promise.resolve(null);
}

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
    getHealthReadings: () => apiCall('/health/readings'),
    addHealthReading: (reading: HealthReading) => apiCall('/health/readings', { method: 'POST', body: JSON.stringify(reading) }),
    getHealthSummary: () => apiCall('/health/summary'),
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
    getMedicines: () => apiCall('/medicines'),
    addMedicine: (medicine: Medicine) => apiCall('/medicines', { method: 'POST', body: JSON.stringify(medicine) }),
    toggleMedicineTaken: (id: string) => apiCall(`/medicines/${id}/toggle`, { method: 'PATCH' }),
    deleteMedicine: (id: string) => apiCall(`/medicines/${id}`, { method: 'DELETE' }),
    getPrescriptions: () => apiCall('/prescriptions'),
    addPrescription: (prescription: Prescription) => apiCall('/prescriptions', { method: 'POST', body: JSON.stringify(prescription) }),
    deletePrescription: (id: string) => apiCall(`/prescriptions/${id}`, { method: 'DELETE' }),
};

// ============ Step Service ============
export const stepService = {
    getStepData: () => apiCall('/steps'),
    addManualSteps: (steps: number) => apiCall('/steps/manual', { method: 'POST', body: JSON.stringify({ steps }) }),
    getStepGoals: () => apiCall('/steps/goals'),
    updateStepGoal: (goal: number) => apiCall('/steps/goals', { method: 'PUT', body: JSON.stringify({ goal }) }),
    connectGoogleFit: () => apiCall('/steps/google-fit/connect', { method: 'POST' }),
    disconnectGoogleFit: () => apiCall('/steps/google-fit/disconnect', { method: 'POST' }),
};

// ============ Water Service ============
export const waterService = {
    getWaterData: () => apiCall('/water'),
    addGlass: () => apiCall('/water/add', { method: 'POST' }),
    removeGlass: () => apiCall('/water/remove', { method: 'POST' }),
    getWaterHistory: () => apiCall('/water/history'),
};

interface UserProfile {
    name?: string;
    age?: string;
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
    bloodGroup?: string;
}

// ============ User Service ============
export const userService = {
    getProfile: () => apiCall('/user/profile'),
    updateProfile: (profile: UserProfile) => apiCall('/user/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    getParentLinkCode: () => apiCall('/user/link-code'),
};

// ============ Family Service ============
export const familyService = {
    linkParent: (linkCode: string) => apiCall('/family/link', { method: 'POST', body: JSON.stringify({ linkCode }) }),
    unlinkParent: (parentId: string) => apiCall(`/family/unlink/${parentId}`, { method: 'DELETE' }),
    getLinkedParents: () => apiCall('/family/parents'),
    getParentHealth: (parentId: string) => apiCall(`/family/parents/${parentId}/health`),
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
    getDoctors: () => apiCall('/doctors'),
    addDoctor: (doctor: Doctor) => apiCall('/doctors', { method: 'POST', body: JSON.stringify(doctor) }),
    getAppointments: () => apiCall('/appointments'),
    addAppointment: (appointment: Appointment) => apiCall('/appointments', { method: 'POST', body: JSON.stringify(appointment) }),
    getDocuments: () => apiCall('/documents'),
    generateHealthReport: () => apiCall('/documents/health-report', { method: 'POST' }),
};

// ============ AI Service ============
export const aiService = {
    sendMessage: (message: string) => apiCall('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    getConversationHistory: () => apiCall('/ai/history'),
};

// ============ Community Service ============
export const communityService = {
    getLeaderboard: () => apiCall('/community/leaderboard'),
    getGroups: () => apiCall('/community/groups'),
    getChallenges: () => apiCall('/community/challenges'),
    getNotifications: () => apiCall('/community/notifications'),
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
    getBMIHistory: () => apiCall('/bmi/history'),
    saveBMIRecord: (record: BMIRecord) => apiCall('/bmi', { method: 'POST', body: JSON.stringify(record) }),
};

// ============ Gyaan/Wellness Service ============
export const gyaanService = {
    getTips: () => apiCall('/gyaan/tips'),
    toggleFavorite: (id: string) => apiCall(`/gyaan/tips/${id}/favorite`, { method: 'PATCH' }),
    markComplete: (id: string) => apiCall(`/gyaan/tips/${id}/complete`, { method: 'PATCH' }),
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
    getEmergencyContacts: () => apiCall('/sos/contacts'),
    addEmergencyContact: (contact: EmergencyContact) => apiCall('/sos/contacts', { method: 'POST', body: JSON.stringify(contact) }),
    deleteEmergencyContact: (id: string) => apiCall(`/sos/contacts/${id}`, { method: 'DELETE' }),
    triggerSOS: (location?: { lat: number; lng: number }) => apiCall('/sos/trigger', { method: 'POST', body: JSON.stringify({ location }) }),
};
