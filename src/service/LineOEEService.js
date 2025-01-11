// Dependencies
import axios from 'axios';
import axiosRetry from 'axios-retry'; // Ensure you have installed axios-retry

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

// Axios Instance Configuration
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-api-key': API_KEY, // API key for authentication
        accept: 'application/json', // Expected data format
    },
    timeout: 10000, // 10 Seconds Timeout
});

// Add retry logic to axios instance
axiosRetry(axiosInstance, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Validate URL Format
function validateUrl(url) {
    try {
        new URL(url);
    } catch {
        throw new Error(`Invalid API URL: ${url}`);
    }
}
validateUrl(BASE_URL);

// Development-only logging
if (import.meta.env.DEV) {
    axiosInstance.interceptors.request.use((request) => {
        console.log('Starting Request', JSON.stringify(request, null, 2));
        return request;
    });

    axiosInstance.interceptors.response.use((response) => {
        console.log('Response:', JSON.stringify(response, null, 2));
        return response;
    });
}

// Centralized Error Handling
async function handleAxiosError(error, customMessage) {
    const status = error.response?.status || 'Unknown';
    const message = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`${customMessage} (Status: ${status}): ${message}`);
    throw new Error(`${customMessage}. Details: ${message}`);
}

// API Endpoints
const ENDPOINTS = {
    WORKCENTERS: '/workcenters',
    OEE: (machineId) => `/oee/${machineId}`,
    PREPARE_OEE: (machineId) => `/prepareOEE/oee/${machineId}`,
    MICROSTOPS: '/microstops',
    Rating: '/ratings',
    WEBSOCKET: 'wss://iotshowroom.de',
};

/**
 * Fetch Machines Data
 * @returns {Promise<Array>} A promise that resolves to an array of machine data.
 */
export const fetchMachines = async () => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.WORKCENTERS);
        return response.data;
    } catch (error) {
        await handleAxiosError(error, 'Error fetching machines');
    }
};

/**
 * Fetch OEE Data for a Machine
 * @param {string} machineId - The ID of the machine.
 * @returns {Promise<Object>} A promise that resolves to the OEE data of the machine.
 */
export const fetchOEEData = async (machineId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.OEE(machineId));
        console.log(`OEE data for machine ${machineId} successfully fetched:`, response.data);
        return response.data;
    } catch (error) {
        await handleAxiosError(error, `Error fetching OEE data for machine ${machineId}`);
    }
};

/**
 * Fetch Prepare-OEE Data for a Machine
 * @param {string} machineId - The ID of the machine.
 * @returns {Promise<Object>} A promise that resolves to the prepared OEE data for the machine.
 */
export const fetchPrepareOEEData = async (machineId) => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.PREPARE_OEE(machineId));
        console.log(`Prepare-OEE data for machine ${machineId} successfully fetched:`, response.data);
        return response.data;
    } catch (error) {
        await handleAxiosError(error, `Error fetching Prepare-OEE data for machine ${machineId}`);
    }
};

/**
 * Fetch Microstops Data
 * @returns {Promise<Array>} A promise that resolves to an array of microstops data.
 */
export const fetchMicrostops = async () => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.MICROSTOPS);
        console.log('Microstops data successfully fetched:', response.data);
        return response.data;
    } catch (error) {
        await handleAxiosError(error, 'Error fetching microstops data');
    }
};

export const fetchReasonCodes = async () => {
    try {
        const response = await axiosInstance.get(ENDPOINTS.Rating);
        return response.data; // Daten zurückgeben
    } catch (error) {
        console.error('Fehler beim Laden der Reason Codes:', error.message);
        throw error;
    }
};

/**
 * Establish a WebSocket connection
 * @param {function} onMessage - Function to handle incoming messages.
 * @param {function} onError - Function to handle errors.
 * @param {function} onClose - Function to handle connection close.
 * @returns {WebSocket} A WebSocket connection.
 */
export const connectWebSocket = (onMessage, onError, onClose) => {
    const socket = new WebSocket(ENDPOINTS.WEBSOCKET);

    socket.onopen = () => {
        console.log('WebSocket connection established.');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        onMessage(message);
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
    };

    socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.reason}. Reconnecting...`);
        if (onClose) onClose(event);
        setTimeout(() => connectWebSocket(onMessage, onError, onClose), 1000);
    };

    return socket;
};
