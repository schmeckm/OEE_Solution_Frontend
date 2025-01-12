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
        if (method === 'delete') return (await axiosInstance.delete(url)).data;
    } catch (error) {
        return handleAxiosError(error, `Error during ${method.toUpperCase()} request to ${url}`);
    }
};

// Service-Methoden
const PlannedDowntimeService = {
    /**
     * Fetch all planned downtimes and enrich them with machine details
     * @returns {Promise<Array>} Enriched list of planned downtimes
     */
    async getPlannedDowntimesWithMachines() {
        debugLog('Fetching planned downtimes with machine details...');
        try {
            // Paralleler Abruf von Downtimes und Maschinen
            const [downtimes, machines] = await Promise.all([
                apiCall('get', '/planneddowntime'),
                apiCall('get', '/workcenters'),
            ]);

            // Map für schnelle Zuordnung von Maschinen
            const machineMap = new Map(machines.map((machine) => [machine.workcenter_id, machine]));

            // Enrich Downtimes mit Maschinen-Details
            const enrichedDowntimes = downtimes.map((downtime) => ({
                ...downtime,
                machineName: machineMap.get(downtime.workcenter_id)?.name || 'Unknown',
                machineDetails: machineMap.get(downtime.workcenter_id) || null,
            }));

            debugLog('Enriched planned downtimes:', enrichedDowntimes);
            return enrichedDowntimes;
        } catch (error) {
            return handleAxiosError(error, 'Error fetching planned downtimes with machines');
        }
    },

    /**
     * Create a new planned downtime
     * @param {Object} downtime - Downtime object
     * @returns {Promise<Object>} Created downtime
     */
    async createPlannedDowntime(downtime) {
        debugLog('Creating planned downtime:', downtime);
        return apiCall('post', '/planneddowntime', downtime);
    },

    /**
     * Delete a planned downtime by ID
     * @param {string} id - Downtime ID
     * @returns {Promise<Object>} Deletion result
     */
    async deletePlannedDowntime(id) {
        debugLog(`Deleting planned downtime with ID: ${id}`);
        return apiCall('delete', `/planneddowntime/${id}`);
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

export default PlannedDowntimeService;
