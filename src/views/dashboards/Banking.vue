<script setup>
import { ref, watch, watchEffect, onMounted } from 'vue';
import { fetchMachines, fetchOEEData } from '@/service/LineOEEService';

// Karten-Daten
const availability = ref(0);
const performance = ref(0);
const quality = ref(0);
const oee = ref(0);

// Maschinen-Daten
const machineOptions = ref([]);
const selectedMachine = ref(null);

// Chart-Daten
const chartData = ref(null);
const chartOptions = ref(null);

// Maschinen abrufen
const loadMachines = async () => {
    try {
        const machines = await fetchMachines();
        machineOptions.value = machines.map((machine) => ({
            name: machine.name,
            id: machine.machine_id
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

        updateCharts(); // Aktualisiere die Charts
    } catch (error) {
        console.error('Fehler beim Laden der OEE-Daten:', error.message);
    }
};

// Charts aktualisieren
const updateCharts = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-300').trim();
    const secondaryColor = documentStyle.getPropertyValue('--p-primary-400').trim();
    const tertiaryColor = documentStyle.getPropertyValue('--p-primary-500').trim();
    const textColor = documentStyle.getPropertyValue('--text-color').trim();
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border').trim();

    chartData.value = {
        labels: ['Availability', 'Performance', 'Quality'],
        datasets: [
            {
                label: 'OEE Metrics',
                data: [availability.value, performance.value, quality.value],
                backgroundColor: [primaryColor, secondaryColor, tertiaryColor],
                borderRadius: 6
            }
        ]
    };

    chartOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColor
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                ticks: {
                    color: textColor
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
};

// CSS-Änderungen überwachen und Charts aktualisieren
watchEffect(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-300').trim();
    const secondaryColor = documentStyle.getPropertyValue('--p-primary-400').trim();

    console.log('Primärfarben geändert:', primaryColor, secondaryColor);

    updateCharts(); // Aktualisiere die Charts
});

// Auswahl der Maschine überwachen
watch(selectedMachine, (newMachine) => {
    if (newMachine && newMachine.id) {
        loadOEEData(newMachine.id);
    }
});

// Initialisierung
onMounted(() => {
    loadMachines();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <!-- Dropdown für Maschinen -->
        <div class="col-span-12">
            <Select :options="machineOptions" v-model="selectedMachine" placeholder="Maschine auswählen" optionLabel="name" class="w-full" />
        </div>

        <!-- Karten -->
        <div class="col-span-12 flex flex-wrap gap-4 mt-4">
            <div class="card bg-surface-0 text-surface-500 flex justify-between pt-6 h-full" style="min-width: 17rem">
                <div>
                    <div class="text-lg font-semibold">Availability</div>
                    <div class="text-4xl font-semibold">{{ availability }}%</div>
                </div>
                <i class="pi pi-clock !text-3xl"></i>
            </div>
            <div class="card bg-surface-0 text-surface-500 flex justify-between pt-6 h-full" style="min-width: 17rem">
                <div>
                    <div class="text-lg font-semibold">Performance</div>
                    <div class="text-4xl font-semibold">{{ performance }}%</div>
                </div>
                <i class="pi pi-chart-line !text-3xl"></i>
            </div>
            <div class="card bg-surface-0 text-surface-500 flex justify-between pt-6 h-full" style="min-width: 17rem">
                <div>
                    <div class="text-lg font-semibold">Quality</div>
                    <div class="text-4xl font-semibold">{{ quality }}%</div>
                </div>
                <i class="pi pi-search-plus !text-3xl"></i>
            </div>
        </div>

        <!-- Diagramm -->
        <div class="col-span-12 mt-6">
            <div class="card">
                <Chart type="bar" :data="chartData" :options="chartOptions" class="h-96" />
            </div>
        </div>
    </div>
</template>
