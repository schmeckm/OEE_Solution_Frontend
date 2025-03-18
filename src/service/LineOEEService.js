// LineOEEService.js (or .ts)

// ----------------------------
//  1) Imports
// ----------------------------
import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

//
// ────────────────────────────────────────────────────────────────────────────
//   SECTION A:  AXIOS HELPERS & GENERIC API CALLS
// ────────────────────────────────────────────────────────────────────────────
//

/**
 * A small helper that standardizes calling an API endpoint with axios
 * and handles errors in a single place.
 */
const apiCall = async (method, url, payload = null) => {
    try {
        switch (method.toLowerCase()) {
            case 'get':
                return (await axiosInstance.get(url, { params: payload })).data;
            case 'post':
                return (await axiosInstance.post(url, payload)).data;
            case 'put':
                return (await axiosInstance.put(url, payload)).data;
            case 'delete':
                return (await axiosInstance.delete(url)).data;
            default:
                throw new Error(`❌ Ungültige HTTP-Methode: ${method}`);
        }
    } catch (error) {
        // Central place to handle or log errors
        return handleAxiosError(error, `Fehler bei ${method.toUpperCase()} ${url}`);
    }
};

//
// ────────────────────────────────────────────────────────────────────────────
//   SECTION B:  REST ENDPOINT SERVICE METHODS
// ────────────────────────────────────────────────────────────────────────────
//

// Workcenters / Machines
export const fetchMachines = async () => apiCall('get', '/workcenters');

// Microstops
export const fetchMicrostops = async () => apiCall('get', '/microstops');
export const createMicrostop = async (microstop) => apiCall('post', '/microstops', microstop);
export const updateMicrostop = async (id, microstop) => apiCall('put', `/microstops/${id}`, microstop);
export const deleteMicrostop = async (id) => apiCall('delete', `/microstops/${id}`);

// Reason codes
export const fetchReasonCodes = async () => apiCall('get', '/ratings');

// OEE
export const fetchOEEData = async (machineId) => apiCall('get', `/oee/${machineId}`);
export const fetchPrepareOEEData = async (machineId) => apiCall('get', `/prepareOEE/oee/${machineId}`);

//
// ────────────────────────────────────────────────────────────────────────────
//   SECTION C:  WEBSOCKET CONNECTION & RECONNECT LOGIC
// ────────────────────────────────────────────────────────────────────────────
//

/**
 * Establish a WebSocket connection to wss://iotshowroom.de
 * with built-in retry logic (maxRetries).
 *
 * @param {Function} onMessage  callback for incoming messages
 * @param {Function} onError    callback for WebSocket errors
 * @param {Function} onClose    callback for WebSocket close event
 * @param {number} maxRetries   how many times to attempt reconnect
 * @returns {WebSocket}         the active WebSocket instance
 */
export const connectWebSocket = (onMessage, onError, onClose, maxRetries = 5) => {
    let retries = 0;
    let socket = new WebSocket('wss://iotshowroom.de');

    socket.onopen = () => {
        console.log('✅ WebSocket-Verbindung erfolgreich aufgebaut.');
        retries = 0;
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (onMessage) onMessage(message);
    };

    socket.onerror = (error) => {
        console.error('❌ WebSocket-Fehler:', error);
        if (onError) onError(error);
    };

    socket.onclose = (event) => {
        console.log(`⚠️ WebSocket-Verbindung geschlossen: ${event.reason || 'Keine Angabe'}`);
        if (onClose) onClose(event);

        socket = null; // set the old instance to null

        if (retries < maxRetries) {
            retries++;
            console.log(`🔄 Erneuter Verbindungsversuch (${retries}/${maxRetries})...`);
            setTimeout(
                () => {
                    // recursively call connectWebSocket
                    socket = connectWebSocket(onMessage, onError, onClose, maxRetries);
                },
                Math.min(1000 * retries, 5000) // up to 5s wait
            );
        } else {
            console.error('⛔ Maximale Anzahl von Wiederholungen erreicht.');
        }
    };

    return socket;
};
