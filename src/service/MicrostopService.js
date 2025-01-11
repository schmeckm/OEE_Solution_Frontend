import { axiosInstance } from './utils/baseService';
import { handleAxiosError } from './utils/errorHandler';

// Debug Logging Utility
const isDebug = 'true';

function debugLog(...args) {
    if (isDebug) {
        console.log('[DEBUG]', ...args);
    }
}

const MicrostopService = {
    cache: {},

    // Alle Microstops abrufen
    async fetchMicrostops() {
        debugLog('Abrufen der Microstops...');
        try {
            const response = await axiosInstance.get('/microstops');
            debugLog('Microstops erfolgreich abgerufen:', response.data);
            this.cache.allMicrostops = response.data;
            return response.data;
        } catch (error) {
            return handleAxiosError(error, 'Fehler beim Abrufen der Microstops');
        }
    },

    // Microstops für eine bestimmte Order ID abrufen
    async fetchMicrostopsByOrderId(orderId) {
        console.log('fetchMicrostopsByOrderId aufgerufen mit:', orderId);
        if (this.cache[`order_${orderId}`]) {
            debugLog(`Verwenden des gecachten Microstops für Order ID: ${orderId}`);
            return this.cache[`order_${orderId}`];
        }
        try {
            const response = await axiosInstance.get('/microstops', {
                params: { order_id: orderId },
            });
            this.cache[`order_${orderId}`] = response.data;
            debugLog(`Microstops für Order ID ${orderId} erfolgreich abgerufen:`, response.data);
            return response.data;
        } catch (error) {
            return handleAxiosError(error, `Fehler beim Abrufen der Microstops für Order ID ${orderId}`);
        }
    },

    // Einen Microstop abrufen
    async getMicrostop(id) {
        debugLog(`Abrufen des Microstops mit ID: ${id}`);
        try {
            const response = await axiosInstance.get(`/microstops/${id}`);
            debugLog('Microstop erfolgreich abgerufen:', response.data);
            return response.data;
        } catch (error) {
            return handleAxiosError(error, `Fehler beim Abrufen des Microstops mit ID ${id}`);
        }
    },

    // Einen neuen Microstop erstellen
    async createMicrostop(microstop) {
        debugLog('Erstellen eines neuen Microstops:', microstop);
        try {
            const response = await axiosInstance.post('/microstops', microstop);
            debugLog('Microstop erfolgreich erstellt:', response.data);
            return response.data;
        } catch (error) {
            return handleAxiosError(error, 'Fehler beim Erstellen des Microstops');
        }
    },

    // Einen bestehenden Microstop aktualisieren
    async updateMicrostop(id, microstop) {
        debugLog(`Aktualisieren des Microstops mit ID: ${id}`, microstop);
        try {
            const response = await axiosInstance.put(`/microstops/${id}`, microstop);
            debugLog(`Microstop mit ID ${id} erfolgreich aktualisiert:`, response.data);
            return response.data;
        } catch (error) {
            return handleAxiosError(error, `Fehler beim Aktualisieren des Microstops mit ID ${id}`);
        }
    },

    // Einen Microstop löschen
    async deleteMicrostop(id) {
        debugLog(`Löschen des Microstops mit ID: ${id}`);
        try {
            const response = await axiosInstance.delete(`/microstops/${id}`);
            debugLog(`Microstop mit ID ${id} erfolgreich gelöscht.`);
            return response.data;
        } catch (error) {
            return handleAxiosError(error, `Fehler beim Löschen des Microstops mit ID ${id}`);
        }
    },

    // Dauer für Microstops berechnen
    calculateDurations(microstops) {
        return microstops.map((stop) => {
            const start = new Date(stop.start_date);
            const end = new Date(stop.end_date);
            const duration = (end - start) / 1000; // Dauer in Sekunden
            return {
                ...stop,
                duration,
            };
        });
    },

    // Microstops nach Grund (reason) gruppieren
    groupByReason(microstops) {
        return microstops.reduce((acc, curr) => {
            if (!acc[curr.reason]) acc[curr.reason] = 0;
            acc[curr.reason] += curr.duration; // Dauer summieren
            return acc;
        }, {});
    },

    // Kombinierte Methode: Microstops laden, filtern, Dauer berechnen und gruppieren
    async loadAndProcessMicrostops(orderId) {
        debugLog(`Laden und Verarbeiten der Microstops für Order ID: ${orderId}`);
        try {
            const data = await this.fetchMicrostopsByOrderId(orderId);
            const withDurations = this.calculateDurations(data);
            const grouped = this.groupByReason(withDurations);
            return { microstops: withDurations, grouped };
        } catch (error) {
            return handleAxiosError(error, `Fehler beim Laden und Verarbeiten der Microstops für Order ID ${orderId}`);
        }
    },
};

export default MicrostopService;
