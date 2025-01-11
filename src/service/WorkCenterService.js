import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Work Center Service
const WorkCenterService = {
    // Get all machines
    async getMachines() {
        console.log('[DEBUG] Fetching machines...');
        try {
            const response = await axiosInstance.get('/workcenters');
            console.log('[DEBUG] Machines fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error fetching machines');
        }
    },
    // Create a new machine
    async createMachine(machine) {
        console.log('[DEBUG] Creating machine:', machine);
        try {
            const response = await axiosInstance.post('/workcenters', machine);
            console.log('[DEBUG] Machine created successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error creating machine');
        }
    },
    // Update an existing machine
    async updateMachine(id, machine) {
        console.log(`[DEBUG] Updating machine with ID: ${id}`, machine);
        try {
            const response = await axiosInstance.put(`/workcenters/${id}`, machine);
            console.log(`[DEBUG] Machine with ID ${id} updated successfully:`, response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error updating machine with ID ${id}`);
        }
    },
    // Delete a machine
    async deleteMachine(id) {
        if (!id) {
            throw new Error('[ERROR] Missing ID: ID is required for deleting a machine');
        }
        console.log(`[DEBUG] Deleting machine with ID: ${id}`);
        try {
            const response = await axiosInstance.delete(`/workcenters/${id}`);
            console.log(`[DEBUG] Machine with ID ${id} deleted successfully.`);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error deleting machine with ID ${id}`);
        }
    },
};

export default WorkCenterService;
