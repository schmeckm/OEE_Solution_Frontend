import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

const ShiftPlanService = {
    // Fetch all shift plans
    async getShiftPlans() {
        try {
            const response = await axiosInstance.get('/shiftmodels');
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error fetching shift plans');
        }
    },

    // Create a new shift plan
    async createShiftPlan(shiftPlan) {
        try {
            const response = await axiosInstance.post('/shiftmodels', shiftPlan);
            console.log('[DEBUG] Shift plan created successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error creating shift plan');
        }
    },

    // Update an existing shift plan
    async updateShiftPlan(shiftId, shiftPlan) {
        try {
            const response = await axiosInstance.put(`/shiftmodels/${shiftId}`, shiftPlan);
            console.log(`[DEBUG] Shift plan with ID ${shiftId} updated successfully:`, response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error updating shift plan with ID ${shiftId}`);
        }
    },

    // Delete a shift plan
    async deleteShiftPlan(shiftId) {
        if (!shiftId) {
            throw new Error('[ERROR] Missing shiftId: ID is required for deleting a shift plan');
        }
        try {
            const response = await axiosInstance.delete(`/shiftmodels/${shiftId}`);
            console.log(`[DEBUG] Shift plan with ID ${shiftId} deleted successfully.`);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error deleting shift plan with ID ${shiftId}`);
        }
    },
};

export default ShiftPlanService;
