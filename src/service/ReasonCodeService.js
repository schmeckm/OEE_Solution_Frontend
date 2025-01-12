import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

const isDebug = import.meta.env.VITE_DEBUG === 'true';

const debugLog = (...args) => {
    if (isDebug) console.log('[DEBUG]', ...args);
};

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

const ReasonCodeService = {
    async getReasonCodes() {
        debugLog('Fetching reason codes...');
        return apiCall('get', '/ratings');
    },

    async createReasonCode(reasonCode) {
        if (!reasonCode || typeof reasonCode !== 'object') {
            throw new Error('[ERROR] Invalid reason code data: Reason code must be an object.');
        }
        debugLog('Creating reason code:', reasonCode);
        return apiCall('post', '/ratings', reasonCode);
    },

    async updateReasonCode(id, reasonCode) {
        if (!id || !reasonCode || typeof reasonCode !== 'object') {
            throw new Error('[ERROR] Invalid input: ID and reason code data are required.');
        }

        // Entferne `id` aus dem Request-Body
        const { id: _, ...payload } = reasonCode;

        debugLog(`Updating reason code with ID: ${id}`, payload);
        return apiCall('put', `/ratings/${id}`, payload);
    },

    async deleteReasonCode(id) {
        if (!id) {
            throw new Error('[ERROR] Missing ID: ID is required for deleting a reason code.');
        }
        debugLog(`Deleting reason code with ID: ${id}`);
        return apiCall('delete', `/ratings/${id}`);
    },
};

export default ReasonCodeService;
