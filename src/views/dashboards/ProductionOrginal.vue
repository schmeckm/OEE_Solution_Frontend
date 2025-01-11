<script setup>
import { ref, watch } from 'vue';
import axios from 'axios'; // Für API-Aufrufe
import { useLayout } from '@/layout/composables/layout';
import { FilterMatchMode } from '@primevue/core/api';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);
const chart1 = ref(null);
const chartOptions1 = ref(null);
const pieData = ref(null);
const pieOptions = ref(null);
const menu = ref(null);
const menu2 = ref(null);
const expandedRows = ref([]);

const filterSalesTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Linienauswahl
const lineOptions = ref([
    { label: 'Linie A', value: 'lineA' },
    { label: 'Linie B', value: 'lineB' },
    { label: 'Linie C', value: 'lineC' }
]);

const selectedLine = ref(null); // Die ausgewählte Linie
const lineData = ref(null); // Daten, die aus der API zurückkommen

const orders = ref({
    monthlyData: {
        dateRange: 'last 12 month',
        orders: [122, 584, 646, 221, 135, 453, 111, 158, 425, 156, 454, 456],
        orderUnits: [145, 584, 676, 281, 137, 459, 136, 178, 435, 176, 456, 480],
        avarageUnitByOrder: 1.2,
        avarageSalesByOrder: '$28.00',
        totalSales: '$109,788.00'
    }
});

// API-Aufruf auslösen, wenn sich die Auswahl ändert
watch(selectedLine, async (newLine) => {
    if (newLine) {
        try {
            console.log(`Fetching data for ${newLine}`);
            const response = await axios.get(`/api/line/${newLine}`); // Beispiel-API-Endpunkt
            lineData.value = response.data;
            console.log('Daten erfolgreich abgerufen:', lineData.value);
        } catch (error) {
            console.error('Fehler beim Abrufen der Linien-Daten:', error);
        }
    }
});

const initChart = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    chartData.value = {
        labels: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
        datasets: [
            {
                label: 'Orders',
                data: orders.value.monthlyData.orders,
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                borderRadius: 6
            }
        ]
    };
    chartOptions.value = {
        animation: {
            duration: 0
        },
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    boxHeight: 15,
                    pointStyleWidth: 17,
                    padding: 14
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
};

watch(
    [getPrimary, getSurface, isDarkTheme],
    () => {
        initChart();
    },
    { immediate: true }
);
</script>

<template>
    <div class="grid grid-cols-12">
        <!-- Linienauswahl -->
        <div class="col-span-12 p-4">
            <div class="card">
                <div class="flex items-center">
                    <label for="lineSelector" class="mr-4 font-semibold">Linienauswahl:</label>
                    <Select id="lineSelector" :options="lineOptions" v-model="selectedLine" placeholder="Linie auswählen" optionLabel="label" class="w-48"></Select>
                </div>
            </div>
        </div>

        <!-- Anzeige der Linien-Daten -->
        <div class="col-span-12 xl:col-span-8 p-4">
            <div v-if="lineData" class="card">
                <h3 class="text-xl font-semibold">Daten der Linie: {{ selectedLine }}</h3>
                <pre>{{ lineData }}</pre>
            </div>
            <div v-else class="card">
                <p>Wählen Sie eine Linie aus, um die Daten zu laden.</p>
            </div>
        </div>

        <!-- Beispiel-Chart -->
        <div class="col-span-12 xl:col-span-4 p-4">
            <div class="card">
                <h3 class="text-xl font-semibold">Chart</h3>
                <Chart type="bar" :data="chartData" :options="chartOptions"></Chart>
            </div>
        </div>
    </div>
</template>
