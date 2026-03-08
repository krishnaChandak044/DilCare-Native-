/**
 * API Service Layer - All backend API placeholders
 * Replace these with real API calls when backend is ready
 */

const API_BASE_URL = 'https://api.dilcare.com/v1'; // TODO: Replace with real URL

// Generic API helper placeholder
async function apiCall<T>(endpoint: string, _options?: any): Promise<T | null> {
    // TODO: Implement real API call
    // const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    //   headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    //   ...options,
    // });
    // return response.json();
    console.log(`[API Placeholder] ${endpoint}`);
    return null;
}

// ============ Health Service ============
export const healthService = {
    getHealthReadings: async () => apiCall('/health/readings'),
    addHealthReading: async (reading: any) => apiCall('/health/readings', { method: 'POST', body: JSON.stringify(reading) }),
    getHealthSummary: async () => apiCall('/health/summary'),
};

// ============ Medicine Service ============
export const medicineService = {
    getMedicines: async () => apiCall('/medicines'),
    addMedicine: async (medicine: any) => apiCall('/medicines', { method: 'POST', body: JSON.stringify(medicine) }),
    toggleMedicineTaken: async (id: string) => apiCall(`/medicines/${id}/toggle`, { method: 'PATCH' }),
    deleteMedicine: async (id: string) => apiCall(`/medicines/${id}`, { method: 'DELETE' }),
    getPrescriptions: async () => apiCall('/prescriptions'),
    addPrescription: async (prescription: any) => apiCall('/prescriptions', { method: 'POST', body: JSON.stringify(prescription) }),
    deletePrescription: async (id: string) => apiCall(`/prescriptions/${id}`, { method: 'DELETE' }),
};

// ============ Step Service ============
export const stepService = {
    getStepData: async () => apiCall('/steps'),
    addManualSteps: async (steps: number) => apiCall('/steps/manual', { method: 'POST', body: JSON.stringify({ steps }) }),
    getStepGoals: async () => apiCall('/steps/goals'),
    updateStepGoal: async (goal: number) => apiCall('/steps/goals', { method: 'PUT', body: JSON.stringify({ goal }) }),
    connectGoogleFit: async () => apiCall('/steps/google-fit/connect', { method: 'POST' }),
    disconnectGoogleFit: async () => apiCall('/steps/google-fit/disconnect', { method: 'POST' }),
};

// ============ Water Service ============
export const waterService = {
    getWaterData: async () => apiCall('/water'),
    addGlass: async () => apiCall('/water/add', { method: 'POST' }),
    removeGlass: async () => apiCall('/water/remove', { method: 'POST' }),
    getWaterHistory: async () => apiCall('/water/history'),
};

// ============ User Service ============
export const userService = {
    getProfile: async () => apiCall('/user/profile'),
    updateProfile: async (profile: any) => apiCall('/user/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    getParentLinkCode: async () => apiCall('/user/link-code'),
};

// ============ Family Service ============
export const familyService = {
    linkParent: async (linkCode: string) => apiCall('/family/link', { method: 'POST', body: JSON.stringify({ linkCode }) }),
    unlinkParent: async (parentId: string) => apiCall(`/family/unlink/${parentId}`, { method: 'DELETE' }),
    getLinkedParents: async () => apiCall('/family/parents'),
    getParentHealth: async (parentId: string) => apiCall(`/family/parents/${parentId}/health`),
};

// ============ Doctor Service ============
export const doctorService = {
    getDoctors: async () => apiCall('/doctors'),
    addDoctor: async (doctor: any) => apiCall('/doctors', { method: 'POST', body: JSON.stringify(doctor) }),
    getAppointments: async () => apiCall('/appointments'),
    addAppointment: async (appointment: any) => apiCall('/appointments', { method: 'POST', body: JSON.stringify(appointment) }),
    getDocuments: async () => apiCall('/documents'),
    generateHealthReport: async () => apiCall('/documents/health-report', { method: 'POST' }),
};

// ============ AI Service ============
export const aiService = {
    sendMessage: async (message: string) => apiCall('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    getConversationHistory: async () => apiCall('/ai/history'),
};

// ============ Community Service ============
export const communityService = {
    getLeaderboard: async () => apiCall('/community/leaderboard'),
    getGroups: async () => apiCall('/community/groups'),
    getChallenges: async () => apiCall('/community/challenges'),
    getNotifications: async () => apiCall('/community/notifications'),
};

// ============ BMI Service ============
export const bmiService = {
    getBMIHistory: async () => apiCall('/bmi/history'),
    saveBMIRecord: async (record: any) => apiCall('/bmi', { method: 'POST', body: JSON.stringify(record) }),
};

// ============ Gyaan/Wellness Service ============
export const gyaanService = {
    getTips: async () => apiCall('/gyaan/tips'),
    toggleFavorite: async (id: string) => apiCall(`/gyaan/tips/${id}/favorite`, { method: 'PATCH' }),
    markComplete: async (id: string) => apiCall(`/gyaan/tips/${id}/complete`, { method: 'PATCH' }),
};

// ============ SOS Service ============
export const sosService = {
    getEmergencyContacts: async () => apiCall('/sos/contacts'),
    addEmergencyContact: async (contact: any) => apiCall('/sos/contacts', { method: 'POST', body: JSON.stringify(contact) }),
    deleteEmergencyContact: async (id: string) => apiCall(`/sos/contacts/${id}`, { method: 'DELETE' }),
    triggerSOS: async (location?: { lat: number; lng: number }) => apiCall('/sos/trigger', { method: 'POST', body: JSON.stringify({ location }) }),
};
