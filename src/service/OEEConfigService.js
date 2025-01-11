// Dependencies
import axios from 'axios';

// Validate Environment Variables
function validateEnvVar(variable, variableName) {
    if (!variable) {
        throw new Error(`Missing required environment variable: ${variableName}`);
    }
    return variable;
}

// Base URL and API Key Configuration
const BASE_URL = validateEnvVar(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL').replace(/\/$/, '');
const API_KEY = validateEnvVar(import.meta.env.VITE_API_KEY, 'VITE_API_KEY');

// Validate URL Format
function validateUrl(url) {
    try {
        new URL(url);
    } catch {
        throw new Error(`Invalid API URL: ${url}`);
    }
}
validateUrl(BASE_URL);

// Create Axios Instance
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-api-key': API_KEY, // API key for authentication
        accept: 'application/json', // Expected data format
    },
});

// Debugging: Log Base URL in Development Mode
if (import.meta.env.MODE === 'development') {
    console.log('Axios Base URL:', axiosInstance.defaults.baseURL);
}

// Centralized Error Handling
function handleError(error, action) {
    const status = error.response?.status || 'Unknown';
    const message = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`Error during ${action} (Status: ${status}): ${message}`);
    throw new Error(`Error during ${action}. Details: ${message}`);
}

// API Function: Fetch OEE Configurations
export const getOeeConfigs = async () => {
    try {
        const response = await axiosInstance.get('/oeeconfig');
        console.log('Fetched OEE configurations:', response.data); // Debugging
        return response.data;
    } catch (error) {
        handleError(error, 'fetching OEE configurations');
    }
};

// API Function: Create a New OEE Configuration
export const createOeeConfig = async (config) => {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration data.');
    }
    try {
        const response = await axiosInstance.post('/oeeconfig', [config]);
        console.log('Created OEE configuration:', response.data); // Debugging
        return response.data;
    } catch (error) {
        handleError(error, 'creating OEE configuration');
    }
};

// API Function: Update an Existing OEE Configuration
export const updateOeeConfig = async (key, config) => {
    if (!key || typeof config !== 'object') {
        throw new Error('Invalid input data for updating.');
    }
    try {
        console.log(`Updating OEE configuration with key: ${key}`, config); // Debugging
        const response = await axiosInstance.put(`/oeeconfig/${key}`, config);
        console.log('Updated OEE configuration:', response.data); // Debugging
        return response.data;
    } catch (error) {
        handleError(error, `updating OEE configuration with key ${key}`);
    }
};

// API Function: Delete an OEE Configuration
export const deleteOeeConfig = async (key) => {
    if (!key) {
        throw new Error('Invalid key for deletion.');
    }
    try {
        console.log(`Deleting OEE configuration with key: ${key}`); // Debugging
        const response = await axiosInstance.delete(`/oeeconfig/${key}`);
        console.log('Deleted OEE configuration:', response.data); // Debugging
        return response.data;
    } catch (error) {
        handleError(error, `deleting OEE configuration with key ${key}`);
    }
};

// Export Service
export default {
    getOeeConfigs,
    createOeeConfig,
    updateOeeConfig,
    deleteOeeConfig,
};
