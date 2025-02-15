<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Chart } from 'primevue/chart';
import { useLayout } from '@/layout/composables/layout';
import { useToast } from 'primevue/usetoast';
import MicrostopService from '@/service/MicrostopService';
import moment from 'moment-timezone';

// Reaktive Zustände
const allMicrostops = ref([]);
const filteredMicrostops = ref([]);
const startDate = ref('');
const endDate = ref('');
const selectedOrders = ref([]);
const orderOptions = ref([]);
const chartData = ref({
    labels: [],
    datasets: [
        {
            data: [],
            backgroundColor: [],
            hoverBackgroundColor: [],
        },
    ],
});
const chartOptions = ref({});

// Toast- und Layout-Funktionen
const toast = useToast();
const { getPrimary, getSurface, isDarkTheme } = useLayout();

// Utility: Konfigurationswerte
const DATE_FORMAT = import.meta.env.VITE_DATE_FORMAT || 'YYYY-MM-DD HH:mm:ss';
const TIMEZONE = import.meta.env.VITE_TIMEZONE || moment.tz.guess();

// Farben initialisieren
function initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColors = [
        documentStyle.getPropertyValue('--p-primary-300').trim(),
        documentStyle.getPropertyValue('--p-primary-400').trim(),
        documentStyle.getPropertyValue('--p-primary-500').trim(),
        documentStyle.getPropertyValue('--p-primary-600').trim(),
        documentStyle.getPropertyValue('--p-primary-700').trim(),
    ];

    chartData.value.datasets[0].backgroundColor = primaryColors;
    chartData.value.datasets[0].hoverBackgroundColor = primaryColors;

    chartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: documentStyle.getPropertyValue('--text-color').trim() },
            },
        },
    };
}

// Daten laden
async function loadAllMicrostops() {
    try {
        const data = await MicrostopService.fetchMicrostops();
        if (!data.length) {
            toast.add({ severity: 'warn', summary: 'No Data', detail: 'No microstops found.', life: 3000 });
            return;
        }

        allMicrostops.value = data;

        const uniqueOrders = [...new Set(data.map((item) => item.order_id))];
        orderOptions.value = uniqueOrders.map((orderId) => ({ name: orderId, value: orderId }));

        filterData();
    } catch (error) {
        console.error('Error loading microstops:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load microstops.', life: 3000 });
    }
}

// Daten filtern
function filterData() {
    let filtered = [...allMicrostops.value];

    if (startDate.value && endDate.value) {
        const start = moment.tz(startDate.value, TIMEZONE).startOf('day').toDate();
        const end = moment.tz(endDate.value, TIMEZONE).endOf('day').toDate();

        filtered = filtered.filter((item) => {
            const itemDate = new Date(item.start_date);
            return itemDate >= start && itemDate <= end;
        });
    }

    if (selectedOrders.value.length) {
        filtered = filtered.filter((item) => selectedOrders.value.includes(item.order_id));
    }

    filteredMicrostops.value = filtered;
    updateChartData(filtered);
}

// Chart-Daten aktualisieren
function updateChartData(data) {
    const reasons = data.reduce((acc, cur) => {
        acc[cur.reason] = (acc[cur.reason] || 0) + cur.differenz;
        return acc;
    }, {});

    chartData.value.labels = Object.keys(reasons);
    chartData.value.datasets[0].data = Object.values(reasons);
}

// Initialisierung
onMounted(() => {
    loadAllMicrostops();
});

// Theme- oder Farbänderungen beobachten
watch([getPrimary, getSurface, isDarkTheme], initChart, { immediate: true });
</script>
<template>
    <div class="grid grid-cols-12 gap-4">
        <!-- Filter Panel -->
        <div class="col-span-12 md:col-span-4 flex flex-col gap-4 p-4">
            <div class="card">
                <h4 class="text-primary">Filters</h4>
                <DatePicker id="start-date" v-model="startDate" placeholder="Start Date" />
                <DatePicker id="end-date" v-model="endDate" placeholder="End Date" />
                <MultiSelect
                    v-model="selectedOrders"
                    :options="orderOptions"
                    optionLabel="name"
                    placeholder="Select Orders"
                    :maxSelectedLabels="3"
                    class="w-full"
                    filter
                />
                <Button label="Apply Filters" class="mt-4" @click="filterData" />
            </div>
        </div>

        <!-- Chart Panel -->
        <div class="col-span-12 md:col-span-8 p-4">
            <div class="card h-full">
                <h4 class="text-primary">Microstop Distribution</h4>
                <Chart type="doughnut" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem]" />
            </div>
        </div>
    </div>
</template>
<style scoped>
.grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
}
.card {
    background-color: var(--surface-0);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 16px;
    box-shadow: var(--shadow-2);
}
.text-primary {
    color: var(--primary-color);
}
</style>
