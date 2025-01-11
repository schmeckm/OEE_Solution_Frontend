import { defineStore } from 'pinia';
import MicrostopService from '@/service/MicrostopService'; // Korrekte Import
import { fetchMachines, fetchPrepareOEEData } from '@/service/LineOEEService'; // Korrekte Import

export const useProductionStore = defineStore('production', {
    state: () => ({
        availability: 0,
        performance: 0,
        quality: 0,
        oee: 0,
        machineOptions: [],
        selectedMachine: null,
        processOrderNumber: 'N/A',
        materialNumber: 'N/A',
        orderId: null,
        microstopsData: [],
        filteredMicrostops: [],
        groupedMicrostops: {},
        loading: false,
        error: null,
        chartData: {
            stackedChart: {},
            paretoChart: {},
        },
        notifications: [],
        user: null, // Falls Benutzerinformationen benötigt werden
    }),
    actions: {
        // Speichern und Laden der ausgewählten Maschine
        saveSelectedMachine(machine) {
            this.selectedMachine = machine;
            sessionStorage.setItem('selectedMachine', JSON.stringify(machine));
        },
        loadSelectedMachine() {
            const storedMachine = sessionStorage.getItem('selectedMachine');
            this.selectedMachine = storedMachine ? JSON.parse(storedMachine) : null;
        },

        // Maschinen abrufen
        async fetchMachines() {
            this.loading = true;
            try {
                const machines = await fetchMachines();
                this.machineOptions = machines;
                this.error = null;
            } catch (err) {
                this.error = 'Fehler beim Abrufen der Maschinen.';
                console.error(err);
            } finally {
                this.loading = false;
            }
        },

        // Prepare OEE-Daten abrufen
        async fetchPrepareOEE(machineId) {
            this.loading = true;
            try {
                const data = await fetchPrepareOEEData(machineId);
                if (data) {
                    this.processOrderNumber = data.processOrder?.processordernumber || 'N/A';
                    this.materialNumber = data.processOrder?.materialnumber || 'N/A';
                    this.chartData.stackedChart = data.stackedChart;
                    this.chartData.paretoChart = data.paretoChart;
                }
                this.error = null;
            } catch (err) {
                this.error = 'Fehler beim Abrufen der Prepare OEE-Daten.';
                console.error(err);
            } finally {
                this.loading = false;
            }
        },

        // Microstops abrufen
        async fetchMicrostops(orderId) {
            this.loading = true;
            try {
                const data = await MicrostopService.getMicrostops(orderId);
                this.microstopsData = data;
                this.filteredMicrostops = data; // Initial ohne Filter
                this.groupedMicrostops = this.groupMicrostops(data);
                this.error = null;
            } catch (err) {
                this.error = 'Fehler beim Abrufen der Microstops.';
                console.error(err);
            } finally {
                this.loading = false;
            }
        },

        // Microstops gruppieren
        groupMicrostops(data) {
            return data.reduce((groups, microstop) => {
                const key = microstop.category || 'Unkategorisiert';
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(microstop);
                return groups;
            }, {});
        },

        // Bestelldaten setzen
        setOrderData(data) {
            this.orderId = data.order_id || null;
            this.processOrderNumber = data.processordernumber || data.processOrder?.processordernumber || 'N/A';
            this.materialNumber = data.materialnumber || 'N/A';
        },

        // Benachrichtigungen hinzufügen
        addNotification(message, type = 'info') {
            this.notifications.push({ message, type });
        },
        removeNotification(index) {
            this.notifications.splice(index, 1);
        },

        // Fehler setzen
        setError(message) {
            this.error = message;
        },

        // Benutzerinformationen setzen (falls erforderlich)
        setUser(userData) {
            this.user = userData;
        },
    },
    getters: {
        // Beispiel eines Getters für aggregierte Daten
        totalDowntime(state) {
            return state.microstopsData.reduce((total, ms) => total + (ms.duration || 0), 0);
        },
        // Weitere Getter...
    },
});
