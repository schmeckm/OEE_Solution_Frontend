import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// Unplanned Downtime Service
const UnplannedDowntimeService = {
    // Fetch all unplanned downtimes with machine details
    getUnplannedDowntimesWithMachines: async function () {
        if (isDebug) console.log('[DEBUG] Fetching unplanned downtimes with machine details...');
        try {
            const [downtimeResponse, machinesResponse] = await Promise.all([
                axiosInstance.get('/unplanneddowntime'),
                axiosInstance.get('/workcenters'),
            ]);

            const downtimes = downtimeResponse.data;
            const machines = machinesResponse.data;

            // Optimize mapping with a Map for better performance
            const machineMap = new Map(machines.map((machine) => [machine.workcenter_id, machine]));

            const enrichedDowntimes = downtimes.map((downtime) => ({
                ...downtime,
                machineName: machineMap.get(downtime.workcenter_id)?.name || 'Unknown',
                machineDetails: machineMap.get(downtime.workcenter_id) || null,
            }));

            if (isDebug) console.log('[DEBUG] Enriched unplanned downtimes:', enrichedDowntimes);
            return enrichedDowntimes;
        } catch (error) {
            handleAxiosError(error, 'Error fetching unplanned downtimes with machines');
        }
    },

    // Create a new unplanned downtime
    createUnplannedDowntime: async function (downtime) {
        if (isDebug) console.log('[DEBUG] Creating unplanned downtime:', downtime);
        try {
            const response = await axiosInstance.post('/unplanneddowntime', downtime);
            if (isDebug) console.log('[DEBUG] Unplanned downtime created successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error creating unplanned downtime');
        }
    },

    // Update an existing unplanned downtime
    updateUnplannedDowntime: async function (id, downtime) {
        if (isDebug) console.log(`[DEBUG] Updating unplanned downtime with ID: ${id}`, downtime);
        try {
            const response = await axiosInstance.put(`/unplanneddowntime/${id}`, downtime);
            if (isDebug) console.log(`[DEBUG] Unplanned downtime with ID ${id} updated successfully:`, response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error updating unplanned downtime with ID ${id}`);
        }
    },

    // Delete an unplanned downtime
    deleteUnplannedDowntime: async function (id) {
        if (isDebug) console.log(`[DEBUG] Deleting unplanned downtime with ID: ${id}`);
        try {
            const response = await axiosInstance.delete(`/unplanneddowntime/${id}`);
            if (isDebug) console.log(`[DEBUG] Unplanned downtime with ID ${id} deleted successfully.`);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error deleting unplanned downtime with ID ${id}`);
        }
    },

    // Fetch all machines
    getMachines: async function () {
        if (isDebug) console.log('[DEBUG] Fetching machines...');
        try {
            const response = await axiosInstance.get('/workcenters');
            if (isDebug) console.log('[DEBUG] Machines fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error fetching machines');
        }
    },
};

export default UnplannedDowntimeService;
