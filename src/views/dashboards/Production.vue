<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { fetchMachines, fetchPrepareOEEData, connectWebSocket, fetchReasonCodes } from '@/service/LineOEEService';
import MicrostopService from '@/service/MicrostopService';
import { DATE_CONFIG } from '@/service/config';
import { useLayout } from '@/layout/composables/layout';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

// Definiere showSuccess, um Erfolgsmeldungen anzuzeigen
const showSuccess = (message: string) => {
    toast.add({
        severity: 'success',
        summary: 'Erfolg',
        detail: message,
        life: 3000,
    });
};

// Interfaces definieren
interface Machine {
    name: string;
    workcenter_id: number;
}

interface Microstop {
    microstop_ID: number | null;
    reason: string;
    start_date: Date | null;
    end_date: Date | null;
    order_id?: number;
    differenz?: number;
    duration?: number;
    processOrderNumber?: string;
    materialNumber?: string;
}

interface OEEDataMessage {
    type: string;
    data: {
        workcenter_id: number;
        availability: number;
        performance: number;
        quality: number;
        oee: number;
        order_id?: number;
        processordernumber?: string;
        materialnumber?: string;
    };
}

interface PrepareOEEData {
    labels: string[];
    datasets: any[];
    processOrder?: {
        ProcessOrderNumber: string; // Achten Sie auf die korrekte Groß-/Kleinschreibung
        MaterialNumber: string;
    };
}

// Zustände definieren
const availability = ref<number>(0);
const performance = ref<number>(0);
const quality = ref<number>(0);
const oee = ref<number>(0);

const machineOptions = ref<Machine[]>([]);
const selectedMachine = ref<Machine | null>(null);

const processOrderNumber = ref<string>('N/A');
const materialNumber = ref<string>('N/A');
const orderId = ref<number | null>(null);

const filteredMicrostops = ref<Microstop[]>([]);
const groupedMicrostops = ref<Record<string, number>>({});

const chartData = ref<any>(null);
const chartOptions = ref<any>(null);

const stackedChartData = ref<any>(null);
const stackedChartOptions = ref<any>(null);

const paretoData = ref<any>(null);
const paretoOptions = ref<any>(null);

const microstop = ref<Microstop>({
    microstop_ID: null,
    reason: '',
    start_date: null,
    end_date: null,
});

const microstops = ref<Microstop[]>([]);
const selectedMicrostops = ref<Microstop[]>([]);
const microstopDialog = ref<boolean>(false);
const deleteSingleMicrostopDialog = ref<boolean>(false);
const deleteMicrostopsDialog = ref<boolean>(false);

const { getPrimary, getSurface, isDarkTheme } = useLayout();

let socket: WebSocket;

// WebSocket-Nachrichtenbehandlung
const handleWebSocketMessage = async (message: OEEDataMessage) => {
    if (
        message.type === 'OEEData' &&
        selectedMachine.value &&
        message.data.workcenter_id === selectedMachine.value.workcenter_id
    ) {
        console.log('WebSocket-Daten für aktuelle Maschine empfangen:', message.data);

        // Aktualisiere nur die OEE-Metriken, keine Order ID
        availability.value = parseFloat((message.data.availability || 0).toFixed(2));
        performance.value = parseFloat((message.data.performance || 0).toFixed(2));
        quality.value = parseFloat((message.data.quality || 0).toFixed(2));
        oee.value = parseFloat((message.data.oee || 0).toFixed(2));

        console.log('OEE-Metriken aktualisiert:');
        console.log({ availability: availability.value, performance: performance.value, quality: quality.value });

        updateCharts();
    }
};

watch(
    [getPrimary, getSurface, isDarkTheme], // Beobachte Farb- und Theme-Änderungen
    () => {
        console.log('Farben oder Theme geändert. Aktualisiere Diagramme...');
        updateCharts();
        updateParetoChart();
        if (selectedMachine.value) {
            loadPrepareOEEData(selectedMachine.value.workcenter_id);
        }
    }
);

// Watcher für ausgewählte Maschine
watch(selectedMachine, async (newMachine: Machine | null) => {
    if (newMachine) {
        console.log('Neue Maschine ausgewählt:', newMachine);

        // Lade OEE-Daten und setze die Order ID
        await loadPrepareOEEData(newMachine.workcenter_id);

        // Prüfen, ob die Order ID aktualisiert wurde
        console.log('Aktuelle Order ID nach Auswahl der Linie:', orderId.value);

        if (orderId.value) {
            // Lade Microstops für die neue Order ID
            console.log(`Lade Microstops für Order ID: ${orderId.value}`);
            await loadMicrostops(orderId.value);

            // Aktualisiere das Pareto-Diagramm
            updateParetoChart();
        } else {
            console.warn('Keine Order ID gefunden, Tabelle wird geleert.');
            microstops.value = [];
            filteredMicrostops.value = [];
            updateParetoChart();
        }
    } else {
        console.warn('Keine Maschine ausgewählt, Daten werden zurückgesetzt.');
        orderId.value = null;
        microstops.value = [];
        filteredMicrostops.value = [];
        updateParetoChart();
    }
});

// Watcher für Order ID
watch(orderId, async (newOrderId: number | null) => {
    if (newOrderId) {
        await loadMicrostops(newOrderId);
    } else {
        microstops.value = [];
        filteredMicrostops.value = [];
    }
});

// Methoden definieren
const saveMicrostop = async () => {
    try {
        if (microstop.value.microstop_ID) {
            // Update bestehender Microstop
            await MicrostopService.updateMicrostop(microstop.value.microstop_ID, microstop.value);
            showSuccess('Microstop erfolgreich aktualisiert.');

            // Tabelle lokal aktualisieren
            microstops.value = microstops.value.map((stop) =>
                stop.microstop_ID === microstop.value.microstop_ID ? { ...microstop.value } : stop
            );
        } else {
            // Neuer Microstop
            const newMicrostop = await MicrostopService.createMicrostop(microstop.value);
            showSuccess('Microstop erfolgreich erstellt.');
            microstops.value = [...microstops.value, newMicrostop];
        }

        // Filter aktualisieren
        filterMicrostops();

        // Pareto-Diagramm aktualisieren
        updateParetoChart();

        // Dialog schließen
        microstopDialog.value = false;
    } catch (error) {
        console.error('Fehler beim Speichern des Microstops:', error);
    }
};

const editMicrostop = async (data: Microstop) => {
    microstop.value = { ...data };
    await loadReasonCodes(); // Lade Reason Codes beim Bearbeiten eines Microstops
    microstopDialog.value = true;
};

const deleteSingleMicrostop = async () => {
    if (!microstop.value?.microstop_ID) {
        console.warn('Keine Microstop ID zum Löschen gefunden.');
        return;
    }

    try {
        console.log(`Lösche Microstop mit ID: ${microstop.value.microstop_ID}`);
        await MicrostopService.deleteMicrostop(microstop.value.microstop_ID); // API-Aufruf
        console.log('Microstop erfolgreich gelöscht.');

        // Entferne den Datensatz manuell aus der Tabelle
        microstops.value = microstops.value.filter((stop) => stop.microstop_ID !== microstop.value.microstop_ID);

        // Filter und Pareto-Diagramm aktualisieren
        filterMicrostops();
    } catch (error) {
        console.error('Fehler beim Löschen des Microstops:', error.message);
    } finally {
        deleteMicrostopsDialog.value = false; // Dialog schließen
    }
};

const handleDeleteMicrostop = async () => {
    if (selectedMicrostops.value.length > 1) {
        // Mehrere Microstops löschen
        await deleteSelectedMicrostops();
    } else if (selectedMicrostops.value.length === 1) {
        // Einzelnes Microstop löschen
        microstop.value = selectedMicrostops.value[0]; // Setze das einzelne Microstop
        await deleteSingleMicrostop();
    } else if (microstop.value.microstop_ID) {
        // Einzelnes Microstop (über Zeile) löschen
        await deleteSingleMicrostop();
    } else {
        console.warn('Keine Microstops zum Löschen ausgewählt.');
    }
};

const confirmDeleteMicrostop = (data: Microstop) => {
    microstop.value = data;
    deleteMicrostopsDialog.value = true;
};

const deleteSelectedMicrostops = async () => {
    if (!selectedMicrostops.value.length) {
        console.warn('Keine Microstops zum Löschen ausgewählt.');
        return;
    }

    try {
        console.log('Lösche ausgewählte Microstops:', selectedMicrostops.value);

        // Lösche alle ausgewählten Microstops
        const deletePromises = selectedMicrostops.value.map((stop) =>
            MicrostopService.deleteMicrostop(stop.microstop_ID)
        );

        await Promise.all(deletePromises); // Warte auf alle Löschvorgänge
        console.log('Ausgewählte Microstops erfolgreich gelöscht.');

        // Aktualisiere Tabelle und Pareto-Diagramm durch Nachladen der Daten
        await loadMicrostops(orderId.value);
    } catch (error) {
        console.error('Fehler beim Löschen der ausgewählten Microstops:', error.message);
    } finally {
        selectedMicrostops.value = []; // Auswahl zurücksetzen
        deleteMicrostopsDialog.value = false; // Dialog schließen
    }
};

// WebSocket-Fehlerbehandlung
const handleWebSocketError = (error: unknown) => {
    if (import.meta.env.MODE === 'development') {
        console.error('WebSocket error:', error);
    }
};

const handleWebSocketClose = (event: CloseEvent) => {
    if (import.meta.env.MODE === 'development') {
        console.log(`WebSocket connection closed: ${event.reason}. Reconnecting...`);
    }
};

// Laden der Maschinen
const loadMachines = async () => {
    try {
        const machines = await fetchMachines();
        machineOptions.value = machines
            .filter((machine) => machine.OEE)
            .map((machine) => ({
                name: machine.name,
                workcenter_id: machine.workcenter_id,
            }));
        if (import.meta.env.MODE === 'development') {
            console.log('Loaded machines:', machines);
        }
    } catch (error: any) {
        console.error('Fehler beim Laden der Maschinen:', error.message);
    }
};

const reasonCodes = ref<{ label: string; value: string; color: string }[]>([]);

const loadReasonCodes = async () => {
    try {
        const codes = await fetchReasonCodes(); // API-Aufruf
        reasonCodes.value = codes.map((code) => ({
            label: code.description, // Beschreibung wird als Label verwendet
            value: code.description, // Beschreibung wird als Value verwendet
            color: code.color, // Optional: Farbe für spätere Nutzung
        }));
        console.log('Geladene Reason Codes:', reasonCodes.value);
    } catch (error) {
        console.error('Fehler beim Laden der Reason Codes:', error.message);
        reasonCodes.value = [];
    }
};

// Laden der vorbereiteten OEE-Daten
const loadPrepareOEEData = async (machineId: number) => {
    console.log('Lade Prepare OEE-Daten für Maschine:', machineId);

    try {
        const data = await fetchPrepareOEEData(machineId);
        console.log('Prepare OEE-Daten erhalten:', data);

        if (!data || !data.labels || !Array.isArray(data.datasets)) {
            console.warn('Ungültige oder unvollständige Prepare OEE-Daten:', data);
            return;
        }

        processOrderNumber.value = data.processOrder?.ProcessOrderNumber || 'N/A';
        materialNumber.value = data.processOrder?.MaterialNumber || 'N/A';

        // Aktualisiere die Order ID
        orderId.value = data.processOrder?.order_id || null;
        console.log('Aktualisierte Order ID nach Prepare OEE:', orderId.value);

        updateStackedChart(data);
    } catch (error: any) {
        console.error('Fehler beim Laden der Prepare OEE-Daten:', error.message);
    }
};

// Laden der Microstops basierend auf Order ID
const loadMicrostops = async (orderIdParam: string | null) => {
    console.log(`Lade Microstops für Order ID: ${orderIdParam}`);

    if (!orderIdParam) {
        console.warn('Keine Order ID angegeben. Microstops werden nicht geladen.');
        microstops.value = [];
        filteredMicrostops.value = [];
        groupedMicrostops.value = {};
        return;
    }

    try {
        const { microstops: processedMicrostops } = await MicrostopService.loadAndProcessMicrostops(orderIdParam);
        console.log('Geladene Microstops:', processedMicrostops);
        microstops.value = processedMicrostops || [];

        // Filter anwenden
        filterMicrostops();
    } catch (error) {
        console.error('Fehler beim Laden der Microstops:', error.message);
        microstops.value = [];
        filteredMicrostops.value = [];
        groupedMicrostops.value = {};
    }
};

// Tiefenvergleich für Objekte
const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
};

// Filtern und Gruppieren der Microstops
const filterMicrostops = () => {
    console.log('Filtere Microstops basierend auf Order ID:', orderId.value);

    if (!orderId.value || microstops.value.length === 0) {
        console.warn('Keine Microstops oder keine Order ID verfügbar.');
        filteredMicrostops.value = [];
        groupedMicrostops.value = {};
        updateParetoChart();
        return;
    }

    // Filtere Microstops für die Tabelle
    filteredMicrostops.value = microstops.value.filter((stop) => stop.order_id === orderId.value);
    console.log('Gefilterte Microstops:', filteredMicrostops.value);

    // Gruppiere Daten für das Pareto-Diagramm
    const newGroupedMicrostops = filteredMicrostops.value.reduce<Record<string, number>>((acc, curr) => {
        if (!acc[curr.reason]) {
            acc[curr.reason] = 0;
        }
        acc[curr.reason] += curr.differenz || curr.duration || 0;
        return acc;
    }, {});

    console.log('Gruppierte Microstops für Pareto-Diagramm:', newGroupedMicrostops);

    groupedMicrostops.value = newGroupedMicrostops;
    updateParetoChart();
};

// Charts aktualisieren
const updateCharts = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor300 = documentStyle.getPropertyValue('--p-primary-300').trim();
    const primaryColor400 = documentStyle.getPropertyValue('--p-primary-400').trim();
    const primaryColor500 = documentStyle.getPropertyValue('--p-primary-500').trim();
    const textColor = documentStyle.getPropertyValue('--text-color').trim();
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border').trim();

    chartData.value = {
        labels: ['Availability', 'Performance', 'Quality'],
        datasets: [
            {
                label: 'OEE Metrics',
                data: [availability.value, performance.value, quality.value],
                backgroundColor: [primaryColor300, primaryColor400, primaryColor500],
                borderRadius: 6,
            },
        ],
    };

    chartOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: textColor },
            },
        },
        scales: {
            x: {
                ticks: { color: textColor },
                grid: { color: surfaceBorder },
            },
            y: {
                ticks: { color: textColor },
                grid: { color: surfaceBorder },
            },
        },
    };
};

// Gestapeltes Diagramm aktualisieren
const updateStackedChart = (data: any) => {
    if (!data || !data.labels || !data.datasets) {
        console.warn('Ungültige Daten für das gestapelte Diagramm:', data);
        stackedChartData.value = { labels: [], datasets: [] };
        return;
    }

    console.log('Aktualisiere gestapeltes Diagramm mit:', data);
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColors = [
        documentStyle.getPropertyValue('--p-primary-300').trim(),
        documentStyle.getPropertyValue('--p-primary-400').trim(),
        documentStyle.getPropertyValue('--p-primary-500').trim(),
    ];

    stackedChartData.value = {
        labels: data.labels.map((label: string) =>
            new Date(label).toLocaleString(
                DATE_CONFIG.locale as string | string[],
                {
                    hour: '2-digit',
                    minute: '2-digit',
                    // Weitere Optionen hier
                } as Intl.DateTimeFormatOptions
            )
        ),
        datasets: data.datasets.map((dataset: any, index: number) => ({
            ...dataset,
            backgroundColor: primaryColors[index % primaryColors.length],
        })),
    };

    stackedChartOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: documentStyle.getPropertyValue('--text-color').trim() },
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return context.dataset.label + ': ' + context.raw + ' Einheiten';
                    },
                },
            },
            title: {
                display: true,
                text: 'Gestapeltes Diagramm',
                color: documentStyle.getPropertyValue('--text-color').trim(),
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: {
                    top: 10,
                    bottom: 10,
                },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${data.processordernumber || data.processOrder?.processordernumber || 'Nicht verfügbar'}`,
                color: documentStyle.getPropertyValue('--text-color').trim(),
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: {
                    top: 0,
                    bottom: 20,
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: documentStyle.getPropertyValue('--text-color').trim() },
                grid: { color: documentStyle.getPropertyValue('--surface-border').trim() },
            },
            y: {
                stacked: true,
                ticks: { color: documentStyle.getPropertyValue('--text-color').trim() },
                grid: { color: documentStyle.getPropertyValue('--surface-border').trim() },
            },
        },
    };

    // Debugging: Überprüfen Sie den Wert von processOrderNumber
    if (import.meta.env.MODE === 'development') {
        console.log('Aktuelle Auftragsnummer (gestapeltes Diagramm):', processOrderNumber.value);
    }
};
// Pareto-Diagramm aktualisieren
const updateParetoChart = () => {
    if (import.meta.env.MODE === 'development') {
        console.log('Pareto-Chart aktualisiert mit:', groupedMicrostops.value);
    }

    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColors = [
        documentStyle.getPropertyValue('--p-primary-300').trim(),
        documentStyle.getPropertyValue('--p-primary-400').trim(),
        documentStyle.getPropertyValue('--p-primary-500').trim(),
    ];

    const sortedData = Object.entries(groupedMicrostops.value)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const labels = sortedData.map(([reason]) => reason);
    const values = sortedData.map(([, value]) => value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const cumulativePercentages = values.reduce<number[]>((acc, val) => {
        const cumulativeSum = (acc.slice(-1)[0] || 0) + val;
        acc.push((cumulativeSum / total) * 100);
        return acc;
    }, []);

    paretoData.value = {
        labels,
        datasets: [
            {
                label: 'Microstops',
                data: values,
                backgroundColor: primaryColors.slice(0, values.length),
                yAxisID: 'y',
            },
            {
                label: 'Cumulative %',
                data: cumulativePercentages,
                type: 'line',
                borderColor: '#FF0000',
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                yAxisID: 'y1',
            },
        ],
    };

    paretoOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' },
            title: {
                // Hinzugefügt
                display: true,
                text: 'Pareto-Diagramm',
                color: documentStyle.getPropertyValue('--text-color').trim(),
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: {
                    top: 10,
                    bottom: 10,
                },
            },
            subtitle: {
                // Hinzugefügt
                display: true,
                text: `Order Number: ${processOrderNumber.value}`,
                color: documentStyle.getPropertyValue('--text-color').trim(),
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: {
                    top: 0,
                    bottom: 20,
                },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e0e0e0' } },
            y1: { min: 0, max: 100, ticks: { callback: (value: number) => `${value}%` } },
        },
    };
};
// Session Storage Logik
const saveSelectedMachineToSession = (machine: Machine) => {
    sessionStorage.setItem('selectedMachine', JSON.stringify(machine));
};

const loadSelectedMachineFromSession = (): Machine | null => {
    const storedMachine = sessionStorage.getItem('selectedMachine');
    return storedMachine ? JSON.parse(storedMachine) : null;
};

// Initialisierung
onMounted(() => {
    loadMachines();
    loadMicrostops(orderId.value); // Microstops beim Laden der Seite abrufen
    const storedMachine = loadSelectedMachineFromSession();
    if (storedMachine) selectedMachine.value = storedMachine;
    socket = connectWebSocket(handleWebSocketMessage, handleWebSocketError, handleWebSocketClose);
});

onUnmounted(() => {
    if (socket) {
        socket.close();
    }
});

// Zusätzliche Methoden für Dialoge
const closeDialog = () => {
    microstopDialog.value = false;
};

const openNew = async () => {
    microstop.value = {
        microstop_ID: null,
        reason: '',
        start_date: null,
        end_date: null,
    };
    await loadReasonCodes(); // Lade Reason Codes beim Öffnen des Dialogs
    microstopDialog.value = true;
};
</script>
<template>
    <div class="grid grid-cols-12 gap-4">
        <!-- Machine Dropdown -->
        <div class="col-span-12 flex justify-start px-4">
            <Select
                v-model="selectedMachine"
                :options="machineOptions"
                placeholder="Select Machine"
                option-label="name"
                class="w-full text-lg"
            ></Select>
        </div>

        <!-- OEE Metrics Cards -->
        <div class="col-span-12 flex flex-wrap gap-4">
            <!-- Availability -->
            <div class="w-full md:w-1/2 lg:w-1/4 p-2">
                <div class="card bg-surface-0 text-surface-500 flex justify-between pt-6 h-full">
                    <div>
                        <div class="text-lg font-semibold">Availability</div>
                        <div class="text-4xl font-semibold">{{ availability }}%</div>
                    </div>
                    <i class="pi pi-clock text-3xl"></i>
                </div>
            </div>
            <!-- Performance -->
            <div class="w-full md:w-1/2 lg:w-1/4 p-2">
                <div class="card bg-gray-400 text-white flex justify-between pt-6 h-full">
                    <div>
                        <div class="text-lg font-semibold">Performance</div>
                        <div class="text-4xl font-semibold">{{ performance }}%</div>
                    </div>
                    <i class="pi pi-chart-line text-3xl"></i>
                </div>
            </div>
            <!-- Quality -->
            <div class="w-full md:w-1/2 lg:w-1/4 p-2">
                <div class="card bg-gray-600 text-white flex justify-between pt-6 h-full">
                    <div>
                        <div class="text-lg font-semibold">Quality</div>
                        <div class="text-4xl font-semibold">{{ quality }}%</div>
                    </div>
                    <i class="pi pi-search-plus text-3xl"></i>
                </div>
            </div>
            <!-- OEE -->
            <div class="w-full md:w-1/2 lg:w-1/4 p-2">
                <div class="card bg-primary-300 text-white flex justify-between pt-6 h-full">
                    <div>
                        <div class="text-lg font-semibold">OEE</div>
                        <div class="text-4xl font-semibold">{{ oee }}%</div>
                    </div>
                    <i class="pi pi-chart-pie text-3xl"></i>
                </div>
            </div>
        </div>

        <!-- Stacked Bar Chart -->
        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card h-full">
                <Chart type="bar" :data="stackedChartData" :options="stackedChartOptions" class="h-full" />
            </div>
        </div>

        <!-- Pareto Chart for Microstops -->
        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card h-full">
                <Chart type="bar" :data="paretoData" :options="paretoOptions" class="w-full h-full" />
            </div>
        </div>
    </div>

    <!-- Toolbar und Tabelle -->
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    :disabled="!selectedMicrostops.length && !microstop.microstop_ID"
                    @click="handleDeleteMicrostop"
                />
            </template>
        </Toolbar>

        <DataTable
            v-model:selection="selectedMicrostops"
            :value="filteredMicrostops"
            data-key="microstop_ID"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            current-page-report-template="Showing {first} to {last} of {totalRecords} microstops"
        >
            <template #header>
                <h4 class="m-0">Manage Microstops</h4>
            </template>
            <Column selection-mode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column
                field="microstop_ID"
                header="Microstop ID"
                sortable
                filter
                filterPlaceholder="Search by ID"
            ></Column>
            <Column field="order_id" header="Order ID" sortable filter filterPlaceholder="Search by Order ID"></Column>
            <Column
                field="start_date"
                header="Start Time"
                sortable
                filter
                filterPlaceholder="Search by Start Time"
            ></Column>
            <Column field="end_date" header="End Time" sortable filter filterPlaceholder="Search by End Time"></Column>
            <Column field="reason" header="Reason" sortable filter filterPlaceholder="Search by Reason"></Column>
            <Column field="differenz" header="Duration" sortable filter filterPlaceholder="Search by Duration"></Column>
            <Column :exportable="false">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMicrostop(slotProps.data)" />
                    <Button
                        icon="pi pi-trash"
                        outlined
                        rounded
                        severity="danger"
                        @click="confirmDeleteMicrostop(slotProps.data)"
                    />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Microstop Dialog -->
    <Dialog
        v-model:visible="microstopDialog"
        :header="microstop.microstop_ID ? 'Edit Microstop' : 'New Microstop'"
        :style="{ width: '40vw' }"
        modal
        @hide="closeDialog"
    >
        <div>
            <div>
                <label for="reason">Reason</label>
                <Select
                    id="reason"
                    v-model="microstop.reason"
                    :options="reasonCodes"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Reason"
                    class="w-full"
                />
            </div>
            <div>
                <label for="start_date">Start Date</label>
                <DatePicker id="start_date" v-model="microstop.start_date" show-time />
            </div>
            <div>
                <label for="end_date">End Date</label>
                <Calendar id="end_date" v-model="microstop.end_date" show-time />
            </div>
            <div>
                <label for="differenz">Differenz</label>
                <InputNumber
                    id="differenz"
                    v-model="microstop.differenz"
                    mode="decimal"
                    placeholder="Enter Differenz"
                    class="w-full"
                />
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" @click="closeDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveMicrostop" />
        </template>
    </Dialog>

    <!-- Delete Microstop Dialog -->
    <Dialog v-model:visible="deleteMicrostopsDialog" header="Confirm Delete" modal>
        <p>Are you sure you want to delete this microstop?</p>
        <template #footer>
            <Button label="No" icon="pi pi-times" @click="closeDialog" />
            <Button label="Yes" icon="pi pi-check" @click="deleteSingleMicrostop" />
        </template>
    </Dialog>
</template>
