import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';

const debugLog = (...args) => {
    if (isDebug) console.log('[DEBUG]', ...args);
};

// Caching mechanism for machine data
let machinesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // Cache für 5 Minuten

// Utility to get machines with caching
const getMachinesWithCache = async () => {
    const now = Date.now();
    if (machinesCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
        debugLog('Using cached machines data...');
        return machinesCache;
    }

    debugLog('Fetching machines data from API...');
    try {
        const response = await axiosInstance.get('/workcenters');
        machinesCache = response.data;
        cacheTimestamp = now;
        return machinesCache;
    } catch (error) {
        return handleAxiosError(error, 'Error fetching machines');
    }
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
const ProcessOrderService = {
    /**
     * Fetch all process orders and enrich with machine data
     * @returns {Promise<Array>} Enriched list of process orders
     */
    async getProcessOrders() {
        debugLog('Fetching process orders...');
        try {
            const orders = await apiCall('get', '/processorders');
            const machines = await getMachinesWithCache();

            // Map machine IDs to names for quick lookup
            const machineMap = new Map(
                machines.map((machine) => [machine.workcenter_id.trim().toLowerCase(), machine.name])
            );

            const enrichedOrders = orders.map((order) => ({
                ...order,
                machineName: machineMap.get(order.workcenter_id.trim().toLowerCase()) || 'Unknown',
            }));

            debugLog('Enriched process orders:', enrichedOrders);
            return enrichedOrders;
        } catch (error) {
            return handleAxiosError(error, 'Error fetching process orders');
        }
    },

    /**
     * Fetch all machines
     * @returns {Promise<Array>} List of machines
     */
    async getMachines() {
        return getMachinesWithCache();
    },

    /**
     * Create a new process order
     * @param {Object} order - Process order data
     * @returns {Promise<Object>} Created process order
     */
    async createProcessOrder(order) {
        debugLog('Creating process order:', order);
        return apiCall('post', '/processorders', order);
    },

    /**
     * Update an existing process order
     * @param {string} orderId - Process order ID
     * @param {Object} order - Updated process order data
     * @returns {Promise<Object>} Updated process order
     */
    async updateProcessOrder(orderId, order) {
        debugLog(`Updating process order with ID: ${orderId}`, order);
        return apiCall('put', `/processorders/${orderId}`, order);
    },

    /**
     * Delete a process order
     * @param {string} orderId - Process order ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteProcessOrder(orderId) {
        debugLog(`Deleting process order with ID: ${orderId}`);
        return apiCall('delete', `/processorders/${orderId}`);
    },
};

export default ProcessOrderService;
