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
const BASE_URL = validateEnvVar(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL').replace(/\/+$/, '');
const API_KEY = validateEnvVar(import.meta.env.VITE_API_KEY, 'VITE_API_KEY');

validateUrl(BASE_URL);

// Axios Instance Configuration
const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/settings/env`, // Combine the base URL with the endpoint
    headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
    },
});

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';
const debugLog = (...args) => {
    if (isDebug) console.log('[DEBUG]', ...args);
};

// Centralized Error Handling
const handleAxiosError = async (error, customMessage) => {
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

// Environment Configuration Service
const EnvironmentService = {
    /**
     * Fetch all environment configurations
     * @returns {Promise<Array>} List of environment configurations
     */
    async getEnvironmentConfigs() {
        debugLog('Fetching environment configurations...');
        return apiCall('get', '');
    },

    /**
     * Create a new environment configuration
     * @param {string} key - Environment configuration key
     * @param {string} value - Environment configuration value
     * @returns {Promise<Object>} Created environment configuration
     */
    async createEnvironmentConfig(key, value) {
        if (!key || value === undefined) {
            throw new Error('Invalid key or value for creating environment configuration.');
        }
        debugLog('Creating environment configuration:', { key, value });
        return apiCall('post', '', { key, value });
    },

    /**
     * Update an existing environment configuration
     * @param {string} key - Environment configuration key
     * @param {string} value - Updated environment configuration value
     * @returns {Promise<Object>} Updated environment configuration
     */
    async updateEnvironmentConfig(key, value) {
        if (!key || value === undefined) {
            throw new Error('Invalid key or value for updating environment configuration.');
        }
        debugLog(`Updating environment configuration with key: ${key}`, { value });
        return apiCall('put', `/${key}`, { value });
    },

    /**
     * Delete an environment configuration
     * @param {string} key - Environment configuration key
     * @returns {Promise<Object>} Deletion result
     */
    async deleteEnvironmentConfig(key) {
        if (!key) {
            throw new Error('Invalid key for deleting environment configuration.');
        }
        debugLog(`Deleting environment configuration with key: ${key}`);
        return apiCall('delete', `/${key}`);
    },
};

export default EnvironmentService;
