import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// Caching mechanism for machine data
let machinesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // Cache für 5 Minuten

// Utility to get machines with caching
async function getMachinesWithCache() {
    const now = Date.now();
    if (machinesCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
        return machinesCache;
    }

    try {
        const response = await axiosInstance.get('/workcenters');
        machinesCache = response.data;
        cacheTimestamp = now;
        return machinesCache;
    } catch (error) {
        await handleAxiosError(error, 'Error fetching machines');
    }
}

// Process Order Service
const ProcessOrderService = {
    // Fetch all process orders and enrich with machine data
    async getProcessOrders() {
        try {
            const ordersResponse = await axiosInstance.get('/processorders');
            const machines = await getMachinesWithCache();
            console.log('Fetched machines:', machines);
            // Map machine IDs to names for quick lookup
            const machineMap = new Map(
                machines.map((machine) => [machine.workcenter_id.trim().toLowerCase(), machine.name])
            );

            const enrichedOrders = ordersResponse.data.map((order) => ({
                ...order,
                machineName: machineMap.get(order.workcenter_id.trim().toLowerCase()) || 'Unknown',
            }));

            console.log('Fetched process orders:', enrichedOrders);
            return enrichedOrders;
        } catch (error) {
            await handleAxiosError(error, 'Error fetching process orders');
        }
    },

    // Fetch all machines
    async getMachines() {
        return await getMachinesWithCache();
    },

    // Create a new process order
    async createProcessOrder(order) {
        try {
            const response = await axiosInstance.post('/processorders', order);
            console.log('Created process order:', response.data);
            return response.data;
        } catch (error) {
            await handleAxiosError(error, 'Error creating process order');
        }
    },

    // Update an existing process order
    async updateProcessOrder(orderId, order) {
        try {
            const response = await axiosInstance.put(`/processorders/${orderId}`, order);
            console.log('Updated process order:', response.data);
            return response.data;
        } catch (error) {
            await handleAxiosError(error, `Error updating process order with ID ${orderId}`);
        }
    },

    // Delete a process order
    async deleteProcessOrder(orderId) {
        try {
            const response = await axiosInstance.delete(`/processorders/${orderId}`);
            console.log('Deleted process order:', response.data);
            return response.data;
        } catch (error) {
            await handleAxiosError(error, `Error deleting process order with ID ${orderId}`);
        }
    },
};

export default ProcessOrderService;
