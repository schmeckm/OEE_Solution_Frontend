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
const BASE_URL = validateEnvVar(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL').replace(/\/+$/, ''); // Remove trailing slashes
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

// Axios Instance Configuration
const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/settings/env`, // Combine the base URL with the endpoint
    headers: {
        'x-api-key': API_KEY, // API key for authentication
        'Content-Type': 'application/json', // Expected data format
    },
});

// Centralized Error Handling
async function handleAxiosError(error, customMessage) {
    const status = error.response?.status || 'Unknown';
    const message = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`[ERROR] ${customMessage} (Status: ${status}): ${message}`);
    throw new Error(`${customMessage}. Details: ${message}`);
}

// Environment Configuration Service
const EnvironmentService = {
    // Fetch All Environment Configurations
    async getEnvironmentConfigs() {
        try {
            console.log(`[INFO] GET Request URL: ${axiosInstance.defaults.baseURL}`); // Debugging
            const response = await axiosInstance.get(); // GET Request
            console.log('[INFO] Fetched Environment Configurations:', response.data); // Debugging
            return response.data;
        } catch (error) {
            await handleAxiosError(error, 'Error fetching environment configurations');
        }
    },

    // Create a New Environment Configuration
    async createEnvironmentConfig(key, value) {
        if (!key || value === undefined) {
            throw new Error('Invalid key or value for creating environment configuration.');
        }
        try {
            const response = await axiosInstance.post('', { key, value }); // POST Request
            console.log('[INFO] Created Environment Configuration:', response.data); // Debugging
            return response.data;
        } catch (error) {
            await handleAxiosError(error, 'Error creating environment configuration');
        }
    },

    // Update an Existing Environment Configuration
    async updateEnvironmentConfig(key, value) {
        if (!key || value === undefined) {
            throw new Error('Invalid key or value for updating environment configuration.');
        }
        try {
            console.log(`[INFO] Updating Environment Configuration with key: ${key}`); // Debugging
            const response = await axiosInstance.put(`/${key}`, { value }); // PUT Request
            console.log('[INFO] Updated Environment Configuration:', response.data); // Debugging
            return response.data;
        } catch (error) {
            await handleAxiosError(error, 'Error updating environment configuration');
        }
    },

    // Delete an Environment Configuration
    async deleteEnvironmentConfig(key) {
        if (!key) {
            throw new Error('Invalid key for deleting environment configuration.');
        }
        try {
            console.log(`[INFO] Deleting Environment Configuration with key: ${key}`); // Debugging
            const response = await axiosInstance.delete(`/${key}`); // DELETE Request
            console.log('[INFO] Deleted Environment Configuration:', response.data); // Debugging
            return response.data;
        } catch (error) {
            await handleAxiosError(error, 'Error deleting environment configuration');
        }
    },
};

// Export Service
export default EnvironmentService;
