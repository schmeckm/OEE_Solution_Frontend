import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

const ReasonCodeService = {
    // Fetch all reason codes
    async getReasonCodes() {
        try {
            const response = await axiosInstance.get('/ratings'); // API-Endpunkt für Reason Codes
            console.log('[DEBUG] Reason codes fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error fetching reason codes');
        }
    },

    // Create a new reason code
    async createReasonCode(reasonCode) {
        if (!reasonCode || typeof reasonCode !== 'object') {
            throw new Error('[ERROR] Invalid reason code data: Reason code must be an object.');
        }
        try {
            const response = await axiosInstance.post('/ratings', reasonCode);
            console.log('[DEBUG] Reason code created successfully:', response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, 'Error creating reason code');
        }
    },

    // Update an existing reason code
    async updateReasonCode(id, reasonCode) {
        if (!id || !reasonCode || typeof reasonCode !== 'object') {
            throw new Error('[ERROR] Invalid input: ID and reason code data are required.');
        }
        try {
            const response = await axiosInstance.put(`/ratings/${id}`, reasonCode);
            console.log(`[DEBUG] Reason code with ID ${id} updated successfully:`, response.data);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error updating reason code with ID ${id}`);
        }
    },

    // Delete a reason code
    async deleteReasonCode(id) {
        if (!id) {
            throw new Error('[ERROR] Missing ID: ID is required for deleting a reason code.');
        }
        try {
            const response = await axiosInstance.delete(`/ratings/${id}`);
            console.log(`[DEBUG] Reason code with ID ${id} deleted successfully.`);
            return response.data;
        } catch (error) {
            handleAxiosError(error, `Error deleting reason code with ID ${id}`);
        }
    },
};

export default ReasonCodeService;
