import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';

const debugLog = (...args) => {
    if (isDebug) console.log('[DEBUG]', ...args);
};

// Generische API-Aufruf-Funktion
const apiCall = async (method, url, payload = null) => {
    try {
        if (method === 'get') return (await axiosInstance.get(url, { params: payload })).data;
        if (method === 'post') return (await axiosInstance.post(url, payload)).data;
        if (method === 'put') return (await axiosInstance.put(url, payload)).data;
        if (method === 'delete') return (await axiosInstance.delete(url)).data;
    } catch (error) {
        return handleAxiosError(error, `Error during ${method.toUpperCase()} request to ${url}`);
    }
};

// Service-Methoden
const ShiftPlanService = {
    /**
     * Fetch all shift plans
     * @returns {Promise<Array>} List of shift plans
     */
    async getShiftPlans() {
        debugLog('Fetching shift plans...');
        return apiCall('get', '/shiftmodels');
    },

    /**
     * Create a new shift plan
     * @param {Object} shiftPlan - Shift plan data
     * @returns {Promise<Object>} Created shift plan
     */
    async createShiftPlan(shiftPlan) {
        debugLog('Creating shift plan:', shiftPlan);
        return apiCall('post', '/shiftmodels', shiftPlan);
    },

    /**
     * Update an existing shift plan
     * @param {string} shiftId - Shift plan ID
     * @param {Object} shiftPlan - Updated shift plan data
     * @returns {Promise<Object>} Updated shift plan
     */
    async updateShiftPlan(shiftId, shiftPlan) {
        debugLog(`Updating shift plan with ID: ${shiftId}`, shiftPlan);
        return apiCall('put', `/shiftmodels/${shiftId}`, shiftPlan);
    },

    /**
     * Delete a shift plan
     * @param {string} shiftId - Shift plan ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteShiftPlan(shiftId) {
        if (!shiftId) {
            throw new Error('[ERROR] Missing shiftId: ID is required for deleting a shift plan');
        }
        debugLog(`Deleting shift plan with ID: ${shiftId}`);
        return apiCall('delete', `/shiftmodels/${shiftId}`);
    },
};

export default ShiftPlanService;
