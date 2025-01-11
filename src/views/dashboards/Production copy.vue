<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { fetchMachines, fetchOEEData, fetchPrepareOEEData, fetchMicrostops } from '@/service/LineOEEService';
import { DATE_CONFIG } from '@/service/config';
import { useLayout } from '@/layout/composables/layout'; // Für Theme-Überwachung

// Karten-Daten
const availability = ref(0);
const performance = ref(0);
const quality = ref(0);
const oee = ref(0);

// Maschinen-Daten
const machineOptions = ref([]);
const selectedMachine = ref(null);

// Prozess-Daten
const processOrderNumber = ref('N/A');
const materialNumber = ref('N/A');
const orderId = ref(null);

// Microstops-Daten
const microstopsData = ref([]);
const filteredMicrostops = ref([]);
const groupedMicrostops = ref({});

// Chart-Daten
const chartData = ref(null);
const chartOptions = ref(null);

// Gestapeltes Diagramm-Daten
const stackedChartData = ref(null);
const stackedChartOptions = ref(null);

// Pareto-Diagramm-Daten
const paretoData = ref(null);
const paretoOptions = ref(null);

// Theme-Management
const { getPrimary, getSurface, isDarkTheme } = useLayout();

// Maschinen abrufen
const loadMachines = async () => {
    try {
        const machines = await fetchMachines();
        machineOptions.value = machines
            .filter((machine) => machine.OEE)
            .map((machine) => ({
                name: machine.name,
                id: machine.workcenter_id,
            }));
    } catch (error) {
        console.error('Fehler beim Laden der Maschinen:', error.message);
    }
};

// OEE-Daten laden
const loadOEEData = async (machineId) => {
    try {
        const data = await fetchOEEData(machineId);
        availability.value = parseFloat(data.availability || 0).toFixed(1);
        performance.value = parseFloat(data.performance || 0).toFixed(1);
        quality.value = parseFloat(data.quality || 0).toFixed(1);
        oee.value = parseFloat(data.oee || 0).toFixed(1);

        orderId.value = data?.order_id || null;
        console.log(`Geladenes order_id: ${orderId.value}`);

        await nextTick();
        updateCharts();
        filterMicrostops();
    } catch (error) {
        console.error('Fehler beim Laden der OEE-Daten:', error.message);
    }
};

// Prepare-OEE-Daten laden
const loadPrepareOEEData = async (machineId) => {
    try {
        const data = await fetchPrepareOEEData(machineId);
        console.log('Daten von fetchPrepareOEEData:', data);

        if (!data || !data.labels || !Array.isArray(data.datasets)) {
            console.warn('Ungültige oder unvollständige Daten:', data);
            return;
        }

        processOrderNumber.value = data?.processOrder?.ProcessOrderNumber || 'N/A';
        materialNumber.value = data?.processOrder?.MaterialNumber || 'N/A';

        updateStackedChart(data);
    } catch (error) {
        console.error('Fehler beim Laden der Prepare-OEE-Daten:', error.message);
    }
};

// Microstops-Daten laden
const loadMicrostops = async () => {
    try {
        const data = await fetchMicrostops();
        microstopsData.value = data;
        console.log('Microstops-Daten erfolgreich geladen:', microstopsData.value);
        filterMicrostops();
    } catch (error) {
        console.error('Fehler beim Laden der Microstops-Daten:', error.message);
    }
};

// Microstops filtern und gruppieren
const filterMicrostops = () => {
    if (!orderId.value || microstopsData.value.length === 0) {
        console.log('Keine order_id oder Microstops-Daten verfügbar.');
        return;
    }

    filteredMicrostops.value = microstopsData.value.filter((stop) => stop.order_id === orderId.value);

    groupedMicrostops.value = filteredMicrostops.value.reduce((acc, curr) => {
        if (!acc[curr.reason]) {
            acc[curr.reason] = 0;
        }
        acc[curr.reason] += curr.differenz;
        return acc;
    }, {});

    console.log('=== Filtered Microstops ===', groupedMicrostops.value);

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

// Stacked Chart aktualisieren
const updateStackedChart = (data) => {
    if (!data || !data.labels || !data.datasets) {
        console.warn('Ungültige Daten für das gestapelte Diagramm:', data);
        stackedChartData.value = { labels: [], datasets: [] };
        return;
    }

    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColors = [
        documentStyle.getPropertyValue('--p-primary-300').trim(),
        documentStyle.getPropertyValue('--p-primary-400').trim(),
        documentStyle.getPropertyValue('--p-primary-500').trim(),
    ];

    stackedChartData.value = {
        labels: data.labels.map((label) =>
            new Date(label).toLocaleString(DATE_CONFIG.locale, DATE_CONFIG.formatOptions)
        ),
        datasets: data.datasets.map((dataset, index) => ({
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
};

// Pareto-Diagramm aktualisieren
const updateParetoChart = () => {
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
    const cumulativePercentages = values.reduce((acc, val) => {
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
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e0e0e0' } },
            y1: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } },
        },
    };
};

// Session Storage Logik
const saveSelectedMachineToSession = (machine) => {
    sessionStorage.setItem('selectedMachine', JSON.stringify(machine));
};

const loadSelectedMachineFromSession = () => {
    const storedMachine = sessionStorage.getItem('selectedMachine');
    return storedMachine ? JSON.parse(storedMachine) : null;
};

// Überwachung von Theme-Änderungen
watch([getPrimary, getSurface, isDarkTheme], () => {
    updateCharts();
    updateStackedChart(stackedChartData.value);
    updateParetoChart();
});

// Auswahl der Maschine überwachen
watch(selectedMachine, (newMachine) => {
    if (newMachine) {
        saveSelectedMachineToSession(newMachine); // Auswahl speichern
        loadOEEData(newMachine.id);
        loadPrepareOEEData(newMachine.id);
    }
});

// Initialisierung
onMounted(() => {
    loadMachines();
    const storedMachine = loadSelectedMachineFromSession(); // Gespeicherte Maschine laden
    if (storedMachine) selectedMachine.value = storedMachine;
    loadMicrostops();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <!-- Dropdown für Maschinen -->
        <div class="col-span-12 flex justify-start px-4">
            <Select
                :options="machineOptions"
                v-model="selectedMachine"
                placeholder="Select Machine"
                optionLabel="name"
                class="w-full text-lg"
            ></Select>
        </div>

        <!-- Karten oben -->
        <div class="col-span-12 flex flex-wrap gap-4">
            <div class="w-full md:w-1/2 lg:w-1/5 p-2">
                <div
                    class="card bg-surface-0 text-surface-500 flex justify-between pt-6 h-full"
                    style="min-width: 17rem"
                >
                    <div class="overview-info">
                        <div class="text-lg font-semibold">Availability</div>
                        <div class="text-4xl font-semibold">{{ availability }}%</div>
                    </div>
                    <i class="pi pi-clock !text-3xl"></i>
                </div>
            </div>
            <div class="w-full md:w-1/2 lg:w-1/5 p-2">
                <div class="card bg-gray-400 text-white flex justify-between pt-6 h-full" style="min-width: 17rem">
                    <div class="overview-info">
                        <div class="text-lg font-semibold">Performance</div>
                        <div class="text-4xl font-semibold">{{ performance }}%</div>
                    </div>
                    <i class="pi pi-chart-line !text-3xl"></i>
                </div>
            </div>
            <div class="w-full md:w-1/2 lg:w-1/5 p-2">
                <div class="card bg-gray-600 text-white flex justify-between pt-6 h-full" style="min-width: 17rem">
                    <div class="overview-info">
                        <div class="text-lg font-semibold">Quality</div>
                        <div class="text-4xl font-semibold">{{ quality }}%</div>
                    </div>
                    <i class="pi pi-search-plus !text-3xl"></i>
                </div>
            </div>
            <div class="w-full md:w-1/2 lg:w-1/5 p-2">
                <div
                    class="card text-white flex justify-between pt-6 h-full"
                    style="background-color: var(--p-primary-300); min-width: 17rem"
                >
                    <div class="overview-info">
                        <div class="text-lg font-semibold">OEE</div>
                        <div class="text-4xl font-semibold">{{ oee }}%</div>
                    </div>
                    <i class="pi pi-chart-pie !text-3xl"></i>
                </div>
            </div>
        </div>
        <!-- Stacked Bar Chart -->
        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card h-full">
                <div class="card-header">
                    <div class="card-title">
                        <div class="font-semibold text-lg">Stacked OEE Analysis</div>
                        <p class="subtitle text-sm">Order: {{ processOrderNumber }} | Material: {{ materialNumber }}</p>
                    </div>
                </div>
                <Chart type="bar" :data="stackedChartData" :options="stackedChartOptions" class="h-[520px]" />
            </div>
        </div>

        <!-- Pareto Chart for Microstops -->
        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card h-full">
                <div class="card-header">
                    <div class="card-title">
                        <div class="font-semibold text-lg">Pareto Chart of Microstops</div>
                        <p class="subtitle text-sm">Process Order: {{ processOrderNumber || 'Nicht geladen' }}</p>
                    </div>
                </div>
                <Chart type="bar" :data="paretoData" :options="paretoOptions" class="w-full h-[400px]" />
            </div>
        </div>
    </div>
</template>
