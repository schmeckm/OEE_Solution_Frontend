import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = process.env.NODE_ENV !== 'production'; // Debug nur in Entwicklungsumgebungen

function debugLog(...args) {
    if (isDebug) {
        console.log('[DEBUG]', ...args);
    }
}

const MicrostopService = {
    cache: {},

    // API-Aufruf-Funktion mit generischer Methode
    async apiCall(method, url, payload = null) {
        try {
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
            return handleAxiosError(error, `Fehler bei ${method.toUpperCase()} ${url}`);
        }
    },

    // Alle Microstops abrufen
    async fetchMicrostops() {
        debugLog('Abrufen der Microstops...');
        const data = await this.apiCall('get', '/microstops');
        this.cache.allMicrostops = data; // Cache aktualisieren
        return data;
    },

    // Microstops für eine bestimmte Order ID abrufen
    async fetchMicrostopsByOrderId(orderId) {
        debugLog(`Abrufen der Microstops für Order ID: ${orderId}`);
        if (this.cache[`order_${orderId}`]) {
            debugLog(`Verwenden des gecachten Ergebnisses für Order ID: ${orderId}`);
            return this.cache[`order_${orderId}`];
        }
        const data = await this.apiCall('get', '/microstops', { order_id: orderId });
        this.cache[`order_${orderId}`] = data; // Cache speichern
        return data;
    },

    // Einen Microstop abrufen
    async getMicrostop(id) {
        debugLog(`Abrufen eines Microstops mit ID: ${id}`);
        return this.apiCall('get', `/microstops/${id}`);
    },

    // Einen neuen Microstop erstellen
    async createMicrostop(microstop) {
        debugLog('Erstellen eines neuen Microstops:', microstop);
        return this.apiCall('post', '/microstops', microstop);
    },

    // Einen bestehenden Microstop aktualisieren
    async updateMicrostop(id, microstop) {
        debugLog(`Aktualisieren eines Microstops mit ID: ${id}`, microstop);
        return this.apiCall('put', `/microstops/${id}`, microstop);
    },

    // Einen Microstop löschen
    async deleteMicrostop(id) {
        debugLog(`Löschen eines Microstops mit ID: ${id}`);
        return this.apiCall('delete', `/microstops/${id}`);
    },

    // Dauer für Microstops berechnen
    calculateDurations(microstops) {
        debugLog('Berechnen der Dauer für Microstops...');
        return microstops.map((stop) => {
            const start = new Date(stop.start_date);
            const end = new Date(stop.end_date);
            const duration = (end - start) / 1000; // Dauer in Sekunden
            return { ...stop, duration };
        });
    },

    // Microstops nach Grund (reason) gruppieren
    groupByReason(microstops) {
        debugLog('Gruppieren der Microstops nach Grund...');
        return microstops.reduce((acc, curr) => {
            if (!acc[curr.reason]) acc[curr.reason] = 0;
            acc[curr.reason] += curr.duration; // Dauer summieren
            return acc;
        }, {});
    },

    // Kombinierte Methode: Microstops laden, filtern, Dauer berechnen und gruppieren
    async loadAndProcessMicrostops(orderId) {
        debugLog(`Laden und Verarbeiten der Microstops für Order ID: ${orderId}`);
        const data = await this.fetchMicrostopsByOrderId(orderId);
        const withDurations = this.calculateDurations(data);
        const grouped = this.groupByReason(withDurations);
        return { microstops: withDurations, grouped };
    },

    // Cache leeren
    clearCache() {
        debugLog('Leeren des gesamten Caches...');
        this.cache = {};
    },

    // Cache für eine bestimmte Order ID leeren
    clearCacheForOrder(orderId) {
        debugLog(`Löschen des Caches für Order ID: ${orderId}`);
        delete this.cache[`order_${orderId}`];
    },
};

export default MicrostopService;
