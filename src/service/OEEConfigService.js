import axios from 'axios';

// Helper Functions
const validateEnvVar = (variable, variableName) => {
    if (!variable) {
        throw new Error(`Missing required environment variable: ${variableName}`);
    }
    return variable;
};

const validateUrl = (url) => {
    try {
        new URL(url);
    } catch {
        throw new Error(`Invalid API URL: ${url}`);
    }
};

// Configuration
const BASE_URL = validateEnvVar(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL').replace(/\/$/, '');
const API_KEY = validateEnvVar(import.meta.env.VITE_API_KEY, 'VITE_API_KEY');

validateUrl(BASE_URL);

// Create Axios Instance
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-api-key': API_KEY,
        accept: 'application/json',
    },
});

// Debug Logging Utility
const isDebug = import.meta.env.MODE === 'development';
const debugLog = (...args) => {
    if (isDebug) console.log('[DEBUG]', ...args);
};

// Centralized Error Handling
const handleAxiosError = (error, customMessage) => {
    const status = error.response?.status || 'Unknown';
    const message = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`[ERROR] ${customMessage} (Status: ${status}): ${message}`);
    throw new Error(`${customMessage}. Details: ${message}`);
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

// OEE Config Service
const OeeConfigService = {
    /**
     * Fetch all OEE configurations
     * @returns {Promise<Array>} List of OEE configurations
     */
    async getOeeConfigs() {
        debugLog('Fetching OEE configurations...');
        return apiCall('get', '/oeeconfig');
    },

    /**
     * Create a new OEE configuration
     * @param {Object} config - Configuration data
     * @returns {Promise<Object>} Created OEE configuration
     */
    async createOeeConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('[ERROR] Invalid configuration data.');
        }
        debugLog('Creating OEE configuration:', config);
        return apiCall('post', '/oeeconfig', [config]);
    },

    /**
     * Update an existing OEE configuration
     * @param {string} key - OEE configuration key
     * @param {Object} config - Updated configuration data
     * @returns {Promise<Object>} Updated OEE configuration
     */
    async updateOeeConfig(key, config) {
        if (!key || typeof config !== 'object') {
            throw new Error('[ERROR] Invalid input data for updating.');
        }
        debugLog(`Updating OEE configuration with key: ${key}`, config);
        return apiCall('put', `/oeeconfig/${key}`, config);
    },

    /**
     * Delete an OEE configuration
     * @param {string} key - OEE configuration key
     * @returns {Promise<Object>} Deletion result
     */
    async deleteOeeConfig(key) {
        if (!key) {
            throw new Error('[ERROR] Invalid key for deletion.');
        }
        debugLog(`Deleting OEE configuration with key: ${key}`);
        return apiCall('delete', `/oeeconfig/${key}`);
    },
};

export default OeeConfigService;
