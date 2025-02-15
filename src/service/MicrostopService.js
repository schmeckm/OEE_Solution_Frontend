// MicrostopService.js
import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility: Nur in der Entwicklungsumgebung loggen
const isDebug = process.env.NODE_ENV !== 'production';
function debugLog(...args) {
    if (isDebug) {
        console.log('[DEBUG]', ...args);
    }
}

const MicrostopService = {
    // Einfacher Cache für wiederverwendete Ergebnisse
    cache: {},

    /**
     * Generische API-Aufruf-Funktion.
     * Unterstützt GET, POST, PUT und DELETE.
     */
    async apiCall(method, url, payload = null) {
        try {
            if (method === 'get') {
                // GET-Anfragen mit params
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
            // Zentrale Fehlerbehandlung
            return handleAxiosError(error, `Fehler bei ${method.toUpperCase()} ${url}`);
        }
    },

    /**
     * Ruft alle Microstops ab.
     */
    async fetchMicrostops() {
        debugLog('Abrufen der Microstops...');
        const data = await this.apiCall('get', '/microstops');
        // Cache aktualisieren
        this.cache.allMicrostops = data;
        return data;
    },

    /**
     * Ruft Microstops für eine bestimmte Order ID ab.
     * Verwendet einen Cache, um wiederholte Aufrufe zu vermeiden.
     */
    async fetchMicrostopsByOrderId(orderId) {
        debugLog(`Abrufen der Microstops für Order ID: ${orderId}`);
        if (this.cache[`order_${orderId}`]) {
            debugLog(`Verwenden des gecachten Ergebnisses für Order ID: ${orderId}`);
            return this.cache[`order_${orderId}`];
        }
        const data = await this.apiCall('get', '/microstops', { order_id: orderId });
        this.cache[`order_${orderId}`] = data;
        return data;
    },

    /**
     * Ruft einen einzelnen Microstop ab.
     */
    async getMicrostop(id) {
        debugLog(`Abrufen eines Microstops mit ID: ${id}`);
        return this.apiCall('get', `/microstops/${id}`);
    },

    /**
     * Erstellt einen neuen Microstop.
     */
    async createMicrostop(microstop) {
        debugLog('Erstellen eines neuen Microstops:', microstop);
        return this.apiCall('post', '/microstops', microstop);
    },

    /**
     * Aktualisiert einen bestehenden Microstop.
     * Achtung: Stelle sicher, dass die übergebene ID ein primitiver Wert ist!
     */
    async updateMicrostop(id, microstop) {
        // Falls die ID ein Objekt ist, extrahiere den tatsächlichen Wert
        let primitiveId = id;
        if (typeof primitiveId === 'object') {
            // Beispiel: Wenn die ID als { id: "abc" } vorliegt, verwende primitiveId.id
            primitiveId = primitiveId.id || String(primitiveId);
        }
        debugLog(`Aktualisieren eines Microstops mit ID: ${primitiveId}`, microstop);
        return this.apiCall('put', `/microstops/${primitiveId}`, microstop);
    },

    /**
     * Löscht einen Microstop.
     */
    async deleteMicrostop(id) {
        let primitiveId = id;
        if (typeof primitiveId === 'object') {
            primitiveId = primitiveId.id || String(primitiveId);
        }
        debugLog(`Löschen eines Microstops mit ID: ${primitiveId}`);
        return this.apiCall('delete', `/microstops/${primitiveId}`);
    },

    /**
     * Berechnet die Dauer (in Sekunden) für jeden Microstop.
     */
    calculateDurations(microstops) {
        debugLog('Berechnen der Dauer für Microstops...');
        return microstops.map((stop) => {
            const start = new Date(stop.start_date);
            const end = new Date(stop.end_date);
            const duration = (end - start) / 1000; // Dauer in Sekunden
            return { ...stop, duration };
        });
    },

    /**
     * Gruppiert Microstops nach ihrem Grund (reason).
     */
    groupByReason(microstops) {
        debugLog('Gruppieren der Microstops nach Grund...');
        return microstops.reduce((acc, curr) => {
            if (!acc[curr.reason]) acc[curr.reason] = 0;
            acc[curr.reason] += curr.duration; // Summiert die Dauer
            return acc;
        }, {});
    },

    /**
     * Kombinierte Methode: Lädt, berechnet Dauer und gruppiert Microstops.
     */
    async loadAndProcessMicrostops(orderId) {
        debugLog(`Laden und Verarbeiten der Microstops für Order ID: ${orderId}`);
        const data = await this.fetchMicrostopsByOrderId(orderId);
        const withDurations = this.calculateDurations(data);
        const grouped = this.groupByReason(withDurations);
        return { microstops: withDurations, grouped };
    },

    /**
     * Leert den gesamten Cache.
     */
    clearCache() {
        debugLog('Leeren des gesamten Caches...');
        this.cache = {};
    },

    /**
     * Leert den Cache für eine bestimmte Order ID.
     */
    clearCacheForOrder(orderId) {
        debugLog(`Löschen des Caches für Order ID: ${orderId}`);
        delete this.cache[`order_${orderId}`];
    },
};

export default MicrostopService;
