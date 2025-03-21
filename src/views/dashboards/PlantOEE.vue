<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { connectWebSocket } from '@/composables/websocket';
import Chart from 'primevue/chart';
import { useLayout } from '@/layout/composables/layout';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

// Interface für die OEE-Daten
interface OEEData {
    workcenter_id: string;
    processordernumber: string;
    availability: number;
    performance: number;
    quality: number;
    oee: number;
    materialnumber: string;
    materialdescription: string;
    lineId: string;
    actualTakt: number;
    remainingTime: number;
    plannedproductionquantity: number; // Target
    ActualProductionQuantity: number; // Actual
    status: string; // Status des Workcenters
    chartData: any; // Chart-Daten für das Donut-Diagramm
    classification: string; // Klassifizierung
}

// Reactive State
const workcenters = ref<OEEData[]>([]);

const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeoutId); // Vorherigen Timeout löschen
        timeoutId = setTimeout(() => func(...args), delay); // Neuen Timeout setzen
    };
};

// Chart-Daten für das Donut-Diagramm
const donutChartOptions = ref({
    cutout: '70%',
    plugins: {
        legend: {
            position: 'bottom',
            labels: { color: '' }, // Wird dynamisch gesetzt
        },
        tooltip: {
            enabled: false,
        },
        datalabels: {
            display: false,
        },
        beforeDraw: (chart: any) => {
            if (chart.config.options?.centerText) {
                const { ctx } = chart;
                const { centerText } = chart.config.options;
                const { text, color, font } = centerText;

                const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

                ctx.save();
                ctx.font = font || '20px Arial';
                ctx.fillStyle = color || '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, centerX, centerY);
                ctx.restore();
            }
        },
    },
});

// Chart-Daten für den Fortschrittsbalken
const progressChartOptions = ref({
    scales: {
        y: {
            min: 0,
            max: 100,
            ticks: {
                color: isDarkTheme.value ? '#ffffff' : '#000000',
            },
            grid: {
                color: isDarkTheme.value ? '#ffffff33' : '#00000033',
            },
        },
        x: {
            display: false, // X-Achse ausblenden
        },
    },
    plugins: {
        legend: {
            display: false, // Legende ausblenden
        },
        tooltip: {
            enabled: false, // Tooltips deaktivieren
        },
    },
});

// Funktion zum Erstellen der Fortschrittsdaten
const getProgressChartData = (workcenter: OEEData) => {
    const progress = (workcenter.ActualProductionQuantity / workcenter.plannedproductionquantity) * 100;
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500').trim(); // Primärfarbe für den Balken

    return {
        labels: ['Fortschritt'],
        datasets: [
            {
                label: 'Fortschritt',
                data: [progress],
                backgroundColor: primaryColor, // Dynamische Farbe basierend auf dem Theme
                borderColor: primaryColor,
                borderWidth: 1,
            },
        ],
    };
};

// Funktion zum Aktualisieren der Chart-Farben
const updateChartColors = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColors = [
        documentStyle.getPropertyValue('--p-primary-300').trim(),
        documentStyle.getPropertyValue('--p-primary-400').trim(),
        documentStyle.getPropertyValue('--p-primary-500').trim(),
    ];

    // Aktualisiere die Farben für alle Workcenter
    workcenters.value.forEach((workcenter) => {
        workcenter.chartData.datasets[0].backgroundColor = primaryColors;
        workcenter.chartData.datasets[0].hoverBackgroundColor = primaryColors;
    });

    // Aktualisiere die Legendenfarbe
    donutChartOptions.value.plugins.legend.labels.color = documentStyle.getPropertyValue('--text-color').trim();
};

// WebSocket-Verbindung herstellen
let socket: WebSocket;

onMounted(() => {
    // WebSocket-Verbindung herstellen
    socket = connectWebSocket(
        (message) => handleWebSocketMessage(message),
        (error) => console.error('WebSocket error:', error),
        () => console.log('WebSocket connection closed.')
    );

    // Chart-Farben beim Mounten aktualisieren
    updateChartColors();
});

onUnmounted(() => {
    if (socket) socket.close();
});

// Watch für Theme-Änderungen
watch([getPrimary, getSurface, isDarkTheme], () => {
    console.log('Theme or color changed. Updating charts...');
    updateChartColors();
});

// WebSocket-Nachrichten verarbeiten
const handleWebSocketMessage = (message: any) => {
    try {
        // Überprüfen, ob die Nachricht den Typ "OEEData" hat
        if (message.type === 'OEEData') {
            const oeeData = message.data;

            // Finde den Index des Workcenters in der Liste
            const workcenterIndex = workcenters.value.findIndex((wc) => wc.workcenter_id === oeeData.workcenter_id);

            if (workcenterIndex !== -1) {
                // Aktualisiere die OEE-Daten für das bestehende Workcenter
                workcenters.value[workcenterIndex] = {
                    ...workcenters.value[workcenterIndex],
                    ...oeeData,
                    status: 'Running', // Setze den Status auf "Running"
                };
            } else {
                // Füge ein neues Workcenter hinzu
                workcenters.value.push({
                    ...oeeData,
                    status: 'Running', // Setze den Status auf "Running"
                    chartData: {
                        labels: ['Availability', 'Performance', 'Quality'],
                        datasets: [
                            {
                                data: [oeeData.availability, oeeData.performance, oeeData.quality],
                                backgroundColor: [], // Wird dynamisch gesetzt
                                hoverBackgroundColor: [], // Wird dynamisch gesetzt
                            },
                        ],
                    },
                });
            }

            // Aktualisiere die Chart-Farben
            updateChartColors();
        }
    } catch (error) {
        console.error('Failed to process WebSocket message:', error);
    }
};
</script>
<template>
    <div class="flex justify-center">
        <div class="w-full md:w-[100%]">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                <!-- Dynamische Karten für jedes Workcenter -->
                <div
                    v-for="workcenter in workcenters"
                    :key="workcenter.workcenter_id"
                    class="card p-card p-component"
                    :style="{
                        backgroundColor: getSurface,
                        color: isDarkTheme ? '#ffffff' : '#000000',
                        border: `2px solid ${isDarkTheme ? '#ffffff' : '#000000'}`,
                        borderRadius: '10px',
                        width: '100%', // Gleiche Breite
                        height: '400px', // Gleiche Höhe
                    }"
                >
                    <!-- Grid-Layout für die Karte -->
                    <div class="grid grid-cols-2 gap-4 h-full">
                        <!-- Linke Spalte: Donut-Diagramm und OEE-Metriken -->
                        <div class="col-span-1">
                            <!-- Titel der Karte -->
                            <div class="text-xl font-semibold mb-4">
                                {{ workcenter.lineId }}
                            </div>

                            <!-- Prozessauftragsnummer -->
                            <div class="text-sm text-surface-500 dark:text-surface-400 mb-4">
                                Prozessauftrag: {{ workcenter.processordernumber }}
                            </div>

                            <!-- Donut-Diagramm -->
                            <div class="flex flex-row justify-center" style="height: 150px">
                                <Chart
                                    type="doughnut"
                                    :data="workcenter.chartData"
                                    :options="donutChartOptions"
                                ></Chart>
                            </div>

                            <!-- OEE-Metriken -->
                            <div class="mt-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <div class="text-sm text-surface-500 dark:text-surface-400">Availability</div>
                                        <div class="text-lg font-semibold">
                                            {{ workcenter.availability.toFixed(2) }}%
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-surface-500 dark:text-surface-400">Performance</div>
                                        <div class="text-lg font-semibold">
                                            {{ workcenter.performance.toFixed(2) }}%
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-surface-500 dark:text-surface-400">Quality</div>
                                        <div class="text-lg font-semibold">{{ workcenter.quality.toFixed(2) }}%</div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-surface-500 dark:text-surface-400">OEE</div>
                                        <div class="text-lg font-semibold">{{ workcenter.oee.toFixed(2) }}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Rechte Spalte: Fortschrittsbalken und Status -->
                        <div class="col-span-1 flex flex-col justify-between">
                            <!-- Fortschrittsbalken (BarChart) -->
                            <div>
                                <div class="text-sm text-surface-500 dark:text-surface-400">Progress</div>
                                <Chart
                                    type="bar"
                                    :data="getProgressChartData(workcenter)"
                                    :options="progressChartOptions"
                                    style="height: 150px; width: 100%"
                                ></Chart>
                            </div>

                            <!-- Status -->
                            <div class="text-center">
                                <div class="text-sm text-surface-500 dark:text-surface-400">Status</div>
                                <div class="text-lg font-semibold">{{ workcenter.status }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Klassifizierung ganz unten links -->
                    <div class="absolute bottom-4 left-4 text-sm text-surface-500 dark:text-surface-400">
                        Klassifizierung: {{ workcenter.classification }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
