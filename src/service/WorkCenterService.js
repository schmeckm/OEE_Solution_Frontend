import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';

const debugLog = (...args) => {
    if (isDebug) console.log('[DEBUG]', ...args);
};

// Generic API Call Function
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

// WebSocket Initialization Function
let socket;
const connectWebSocket = (onMessage) => {
    if (socket) socket.close(); // Close any existing connection

    socket = new WebSocket('wss://iotshowroom.de');

    socket.onopen = () => debugLog('[WebSocket] Connection established.');
    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            onMessage(message);
        } catch (error) {
            debugLog('[WebSocket] Error parsing message:', error.message);
        }
    };
    socket.onerror = (error) => debugLog('[WebSocket] Error:', error.message);
    socket.onclose = () => debugLog('[WebSocket] Connection closed.');

    return socket;
};

// Service Methods
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
     * Get topics from the API
     * @returns {Promise<Array>} List of topics
     */
    async getTopics() {
        debugLog('Fetching topics...');
        return apiCall('get', '/topics');
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

    /**
     * Connect to the WebSocket for OEE data
     * @param {Function} onMessage - Callback to handle incoming WebSocket messages
     * @returns {WebSocket} The WebSocket instance
     */
    connectWebSocket,
};

export default WorkCenterService;
