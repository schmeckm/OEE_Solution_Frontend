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
const UnplannedDowntimeService = {
    /**
     * Fetch all unplanned downtimes and enrich them with machine details
     * @returns {Promise<Array>} Enriched list of unplanned downtimes
     */
    async getUnplannedDowntimesWithMachines() {
        debugLog('Fetching unplanned downtimes with machine details...');
        try {
            // Paralleler Abruf von Downtimes und Maschinen
            const [downtimes, machines] = await Promise.all([
                apiCall('get', '/unplanneddowntime'),
                apiCall('get', '/workcenters'),
            ]);

            // Map für Maschinen-Zuordnung
            const machineMap = new Map(machines.map((machine) => [machine.workcenter_id, machine]));

            // Enrich Downtimes mit Maschinen-Details
            const enrichedDowntimes = downtimes.map((downtime) => ({
                ...downtime,
                machineName: machineMap.get(downtime.workcenter_id)?.name || 'Unknown',
                machineDetails: machineMap.get(downtime.workcenter_id) || null,
            }));

            debugLog('Enriched unplanned downtimes:', enrichedDowntimes);
            return enrichedDowntimes;
        } catch (error) {
            return handleAxiosError(error, 'Error fetching unplanned downtimes with machines');
        }
    },

    /**
     * Create a new unplanned downtime
     * @param {Object} downtime - Downtime object
     * @returns {Promise<Object>} Created downtime
     */
    async createUnplannedDowntime(downtime) {
        debugLog('Creating unplanned downtime:', downtime);
        return apiCall('post', '/unplanneddowntime', downtime);
    },

    /**
     * Update an existing unplanned downtime
     * @param {string} id - Downtime ID
     * @param {Object} downtime - Updated downtime object
     * @returns {Promise<Object>} Updated downtime
     */
    async updateUnplannedDowntime(id, downtime) {
        debugLog(`Updating unplanned downtime with ID: ${id}`, downtime);
        return apiCall('put', `/unplanneddowntime/${id}`, downtime);
    },

    /**
     * Delete an unplanned downtime by ID
     * @param {string} id - Downtime ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteUnplannedDowntime(id) {
        debugLog(`Deleting unplanned downtime with ID: ${id}`);
        return apiCall('delete', `/unplanneddowntime/${id}`);
    },

    /**
     * Fetch all machines
     * @returns {Promise<Array>} List of machines
     */
    async getMachines() {
        debugLog('Fetching machines...');
        return apiCall('get', '/workcenters');
    },
};

export default UnplannedDowntimeService;
