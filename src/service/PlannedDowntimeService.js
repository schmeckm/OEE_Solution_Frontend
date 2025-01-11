import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// Planned Downtime Service
const PlannedDowntimeService = {
    // Fetch all planned downtimes with machines
    getPlannedDowntimesWithMachines: async function () {
        if (isDebug) console.log('[DEBUG] Fetching planned downtimes with machine details...');
        try {
            const [downtimeResponse, machinesResponse] = await Promise.all([
                axiosInstance.get('/planneddowntime'),
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

            if (isDebug) console.log('[DEBUG] Enriched planned downtimes:', enrichedDowntimes);
            return enrichedDowntimes;
        } catch (error) {
            handleAxiosError(error, 'Error fetching planned downtimes with machines');
        }
    },

    // Create a new planned downtime
    createPlannedDowntime: async function (downtime) {
        if (isDebug) console.log('[DEBUG] Creating planned downtime:', downtime);
        try {
            const response = await axiosInstance.post('/planneddowntime', downtime);
            if (isDebug) console.log('[DEBUG] Planned downtime created successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error creating planned downtime');
        }
    },

    // Delete a planned downtime
    deletePlannedDowntime: async function (id) {
        if (isDebug) console.log(`[DEBUG] Deleting planned downtime with ID: ${id}`);
        try {
            const response = await axiosInstance.delete(`/planneddowntime/${id}`);
            if (isDebug) console.log(`[DEBUG] Planned downtime with ID ${id} deleted successfully.`);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error deleting planned downtime with ID ${id}`);
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

export default PlannedDowntimeService;
