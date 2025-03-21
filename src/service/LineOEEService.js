// Importiere die zentralisierten Axios-Instanz und den Fehlerhandler
import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Generische API-Aufruf-Funktion
const apiCall = async (method, url, payload = null) => {
    try {
        // Verschiedene HTTP-Methoden unterstützen
        if (method === 'get') {
            return (await axiosInstance.get(url, { params: payload })).data;
        }
        if (method === 'post') {
            return (await axiosInstance.post(url, payload)).data;
        }
        if (method === 'put') {
            return (await axiosInstance.put(url, payload)).data;
        }
        if (method === 'delete') {
            return (await axiosInstance.delete(url)).data;
        }
    } catch (error) {
        // Einheitliches Fehlerhandling
        return handleAxiosError(error, `Fehler bei ${method.toUpperCase()} ${url}`);
    }
};

// Service-Methoden
export const fetchMachines = async () => apiCall('get', '/workcenters');

export const fetchMicrostops = async () => apiCall('get', '/microstops');

export const createMicrostop = async (microstop) => apiCall('post', '/microstops', microstop);

export const updateMicrostop = async (id, microstop) => apiCall('put', `/microstops/${id}`, microstop);

export const deleteMicrostop = async (id) => apiCall('delete', `/microstops/${id}`);

export const fetchReasonCodes = async () => apiCall('get', '/ratings');

export const fetchOEEData = async (machineId) => apiCall('get', `/oee/${machineId}`);

export const fetchPrepareOEEData = async (machineId) => apiCall('get', `/prepareOEE/oee/${machineId}`);

// WebSocket-Verbindung herstellen
export const connectWebSocket = (onMessage, onError, onClose, maxRetries = 5) => {
    let retries = 0;
    const socket = new WebSocket('wss://iotshowroom.de');

    socket.onopen = () => {
        console.log('WebSocket-Verbindung erfolgreich aufgebaut.');
        retries = 0; // Rücksetzen der Wiederholungen
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        onMessage(message);
    };

    socket.onerror = (error) => {
        console.error('WebSocket-Fehler:', error);
        if (onError) onError(error);
    };

    socket.onclose = (event) => {
        console.log(`WebSocket-Verbindung geschlossen: ${event.reason}.`);
        if (onClose) onClose(event);

        if (retries < maxRetries) {
            retries++;
            console.log(`Erneuter Verbindungsversuch (${retries}/${maxRetries})...`);
            setTimeout(() => connectWebSocket(onMessage, onError, onClose, maxRetries), 1000 * retries);
        } else {
            console.error('Maximale Anzahl von Wiederholungen erreicht.');
        }
    };

    return socket;
};
