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
const WorkCenterService = {
    /**
     * Get all machines
     * @returns {Promise<Array>} List of machines
     */
    async getMachines() {
        debugLog('Fetching machines...');
        return apiCall('get', '/workcenters');
    },

    /**
     * Create a new machine
     * @param {Object} machine - Machine data
     * @returns {Promise<Object>} Created machine
     */
    async createMachine(machine) {
        debugLog('Creating machine:', machine);
        return apiCall('post', '/workcenters', machine);
    },

    /**
     * Update an existing machine
     * @param {string} id - Machine ID
     * @param {Object} machine - Updated machine data
     * @returns {Promise<Object>} Updated machine
     */
    async updateMachine(id, machine) {
        debugLog(`Updating machine with ID: ${id}`, machine);
        return apiCall('put', `/workcenters/${id}`, machine);
    },

    /**
     * Delete a machine
     * @param {string} id - Machine ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteMachine(id) {
        if (!id) {
            throw new Error('[ERROR] Missing ID: ID is required for deleting a machine');
        }
        debugLog(`Deleting machine with ID: ${id}`);
        return apiCall('delete', `/workcenters/${id}`);
    },
};

export default WorkCenterService;
