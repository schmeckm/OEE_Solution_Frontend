<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useLayout } from '@/layout/composables/layout';
import { fetchMachines, fetchPrepareOEEData, connectWebSocket, fetchReasonCodes } from '@/service/LineOEEService';
import MicrostopService from '@/service/MicrostopService';
import { DATE_CONFIG } from '@/service/config';

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
        ProcessOrderNumber: string;
        MaterialNumber: string;
        order_id?: number;
    };
}

// -- Local state
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

// -- Microstop Management
const microstop = ref<Microstop>({
    microstop_ID: null,
    reason: '',
    start_date: null,
    end_date: null,
});

const microstops = ref<Microstop[]>([]);
const selectedMicrostops = ref<Microstop[]>([]);
const microstopDialog = ref<boolean>(false);
const deleteMicrostopsDialog = ref<boolean>(false);

const toast = useToast();
const { getPrimary, getSurface, isDarkTheme } = useLayout();

let socket: WebSocket;

// Show success message
const showSuccess = (message: string) => {
    toast.add({
        severity: 'success',
        summary: 'Erfolg',
        detail: message,
        life: 3000,
    });
};

// -- Lifecycle
onMounted(() => {
    loadMachines();
    // If you want to auto-load microstops right away (even if orderId is null, it won't fetch anything)
    loadMicrostops(orderId.value);

    // Reload the previously selected machine (if any) from session
    const storedMachine = loadSelectedMachineFromSession();
    if (storedMachine) {
        selectedMachine.value = storedMachine;
    }

    // Connect WebSocket
    socket = connectWebSocket(handleWebSocketMessage, handleWebSocketError, handleWebSocketClose);
});

onUnmounted(() => {
    if (socket) {
        socket.close();
    }
});

// -- Watchers
watch([getPrimary, getSurface, isDarkTheme], () => {
    console.log('Theme or color changed. Updating charts...');
    updateCharts();
    updateParetoChart();
    if (selectedMachine.value) {
        loadPrepareOEEData(selectedMachine.value.workcenter_id);
    }
});

watch(selectedMachine, async (newMachine: Machine | null) => {
    if (newMachine) {
        console.log('Machine selected:', newMachine);
        await loadPrepareOEEData(newMachine.workcenter_id);

        if (orderId.value) {
            await loadMicrostops(orderId.value);
            updateParetoChart();
        } else {
            microstops.value = [];
            filteredMicrostops.value = [];
            updateParetoChart();
        }
    } else {
        orderId.value = null;
        microstops.value = [];
        filteredMicrostops.value = [];
        updateParetoChart();
    }
});

watch(orderId, async (newOrderId: number | null) => {
    if (newOrderId) {
        await loadMicrostops(newOrderId);
    } else {
        microstops.value = [];
        filteredMicrostops.value = [];
    }
});

// -- Methods

// 1) Machines
const loadMachines = async () => {
    try {
        const machines = await fetchMachines();
        machineOptions.value = machines
            .filter((m) => m.OEE)
            .map((m) => ({
                name: m.name,
                workcenter_id: m.workcenter_id,
            }));
    } catch (err: any) {
        console.error('Failed to load machines:', err.message);
    }
};

// 2) Reason Codes
const reasonCodes = ref<{ label: string; value: string; color: string }[]>([]);

const loadReasonCodes = async () => {
    try {
        const codes = await fetchReasonCodes();
        reasonCodes.value = codes.map((c) => ({
            label: c.description,
            value: c.description,
            color: c.color,
        }));
    } catch (error) {
        reasonCodes.value = [];
        console.error('Failed to load reason codes:', (error as Error).message);
    }
};

// 3) OEE Data
const loadPrepareOEEData = async (machineId: number) => {
    try {
        const data = await fetchPrepareOEEData(machineId);
        if (!data || !data.labels || !Array.isArray(data.datasets)) {
            console.warn('Invalid prepare OEE data:', data);
            return;
        }
        processOrderNumber.value = data.processOrder?.ProcessOrderNumber || 'N/A';
        materialNumber.value = data.processOrder?.MaterialNumber || 'N/A';
        orderId.value = data.processOrder?.order_id || null;

        updateStackedChart(data);
    } catch (err: any) {
        console.error('Failed to load OEE data:', err.message);
    }
};

// 4) Microstops
const loadMicrostops = async (orderIdParam: number | null) => {
    if (!orderIdParam) {
        microstops.value = [];
        filteredMicrostops.value = [];
        groupedMicrostops.value = {};
        return;
    }
    try {
        const { microstops: processed } = await MicrostopService.loadAndProcessMicrostops(orderIdParam);
        microstops.value = processed || [];
        filterMicrostops();
    } catch (err: any) {
        microstops.value = [];
        filteredMicrostops.value = [];
        groupedMicrostops.value = {};
        console.error('Failed to load microstops:', err.message);
    }
};

const saveMicrostop = async () => {
    try {
        if (microstop.value.microstop_ID) {
            // Update
            await MicrostopService.updateMicrostop(microstop.value.microstop_ID, microstop.value);
            showSuccess('Microstop erfolgreich aktualisiert.');
            microstops.value = microstops.value.map((stop) =>
                stop.microstop_ID === microstop.value.microstop_ID ? { ...microstop.value } : stop
            );
        } else {
            // Create
            const newMicrostop = await MicrostopService.createMicrostop(microstop.value);
            showSuccess('Microstop erfolgreich erstellt.');
            microstops.value.push(newMicrostop);
        }
        filterMicrostops();
        updateParetoChart();
        microstopDialog.value = false;
    } catch (err) {
        console.error('Error saving microstop:', err);
    }
};

const editMicrostop = async (data: Microstop) => {
    microstop.value = { ...data };
    await loadReasonCodes();
    microstopDialog.value = true;
};

const openNew = async () => {
    // Reset microstop for new entry
    microstop.value = {
        microstop_ID: null,
        reason: '',
        start_date: null,
        end_date: null,
    };
    await loadReasonCodes();
    microstopDialog.value = true;
};

// -- Deletion logic
const deleteSingleMicrostop = async () => {
    const id = microstop.value?.microstop_ID;
    if (!id) {
        console.warn('No microstop ID to delete.');
        return;
    }
    try {
        await MicrostopService.deleteMicrostop(id);
        console.log(`Microstop ${id} deleted.`);
        microstops.value = microstops.value.filter((m) => m.microstop_ID !== id);

        filterMicrostops();
    } catch (err: any) {
        console.error('Error deleting single microstop:', err.message);
    } finally {
        deleteMicrostopsDialog.value = false;
    }
};

const deleteSelectedMicrostops = async () => {
    if (!selectedMicrostops.value.length) return;

    try {
        // 1) Delete from server
        const promises = selectedMicrostops.value.map((m) => MicrostopService.deleteMicrostop(m.microstop_ID));
        await Promise.all(promises);

        // 2) Re-fetch all microstops from API
        if (orderId.value) {
            await loadMicrostops(orderId.value);
        }

        // 3) Reset selection
        selectedMicrostops.value = [];
    } catch (error) {
        console.error(error);
    } finally {
        deleteMicrostopsDialog.value = false;
    }
};

/**
 * handleDeleteMicrostop():
 * Called after user presses "Yes" in the confirmation dialog.
 * Decides if single or multiple items are deleted.
 */
const handleDeleteMicrostop = async () => {
    if (selectedMicrostops.value.length > 1) {
        // Multiple
        await deleteSelectedMicrostops();
    } else if (selectedMicrostops.value.length === 1) {
        // Single selected
        microstop.value = selectedMicrostops.value[0];
        await deleteSingleMicrostop();
    } else if (microstop.value.microstop_ID) {
        // Single (row-based) if no selection
        await deleteSingleMicrostop();
    } else {
        console.warn('No microstops to delete.');
    }
};

/**
 * confirmDeleteMicrostop():
 * Opens the confirmation dialog. If user clicked the row trash icon, pass that row's microstop.
 * If user clicked the toolbar "Delete" button to remove multiple items, call with no argument.
 */
const confirmDeleteMicrostop = (data?: Microstop) => {
    if (data) {
        // Row-based single microstop
        microstop.value = data;
    }
    deleteMicrostopsDialog.value = true;
};

// -- Chart logic
const filterMicrostops = () => {
    if (!orderId.value || !microstops.value.length) {
        filteredMicrostops.value = [];
        groupedMicrostops.value = {};
        updateParetoChart();
        return;
    }
    filteredMicrostops.value = microstops.value.filter((m) => m.order_id === orderId.value);

    // Group for Pareto
    const newGrouped: Record<string, number> = {};
    filteredMicrostops.value.forEach((m) => {
        if (!newGrouped[m.reason]) {
            newGrouped[m.reason] = 0;
        }
        newGrouped[m.reason] += m.differenz || m.duration || 0;
    });
    groupedMicrostops.value = newGrouped;
    updateParetoChart();
};

const updateCharts = () => {
    const styles = getComputedStyle(document.documentElement);
    const pc300 = styles.getPropertyValue('--p-primary-300').trim();
    const pc400 = styles.getPropertyValue('--p-primary-400').trim();
    const pc500 = styles.getPropertyValue('--p-primary-500').trim();
    const textColor = styles.getPropertyValue('--text-color').trim();
    const surfaceBorder = styles.getPropertyValue('--surface-border').trim();

    chartData.value = {
        labels: ['Availability', 'Performance', 'Quality'],
        datasets: [
            {
                label: 'OEE Metrics',
                data: [availability.value, performance.value, quality.value],
                backgroundColor: [pc300, pc400, pc500],
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

const updateStackedChart = (data: any) => {
    if (!data?.labels || !data?.datasets) {
        stackedChartData.value = { labels: [], datasets: [] };
        return;
    }
    const styles = getComputedStyle(document.documentElement);
    const primaryColors = [
        styles.getPropertyValue('--p-primary-300').trim(),
        styles.getPropertyValue('--p-primary-400').trim(),
        styles.getPropertyValue('--p-primary-500').trim(),
    ];

    stackedChartData.value = {
        labels: data.labels.map((lbl: string) =>
            new Date(lbl).toLocaleString(DATE_CONFIG.locale as string | string[], {
                hour: '2-digit',
                minute: '2-digit',
            })
        ),
        datasets: data.datasets.map((ds: any, i: number) => ({
            ...ds,
            backgroundColor: primaryColors[i % primaryColors.length],
        })),
    };
    stackedChartOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: styles.getPropertyValue('--text-color').trim() },
            },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw} Einheiten`,
                },
            },
            title: {
                display: true,
                text: 'Gestapeltes Diagramm',
                color: styles.getPropertyValue('--text-color').trim(),
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: { top: 10, bottom: 10 },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${
                    data.processordernumber || data.processOrder?.processordernumber || 'Nicht verfügbar'
                }`,
                color: styles.getPropertyValue('--text-color').trim(),
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: { top: 0, bottom: 20 },
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: styles.getPropertyValue('--text-color').trim() },
                grid: { color: styles.getPropertyValue('--surface-border').trim() },
            },
            y: {
                stacked: true,
                ticks: { color: styles.getPropertyValue('--text-color').trim() },
                grid: { color: styles.getPropertyValue('--surface-border').trim() },
            },
        },
    };
};

const updateParetoChart = () => {
    const styles = getComputedStyle(document.documentElement);
    const primaryColors = [
        styles.getPropertyValue('--p-primary-300').trim(),
        styles.getPropertyValue('--p-primary-400').trim(),
        styles.getPropertyValue('--p-primary-500').trim(),
    ];

    const sortedData = Object.entries(groupedMicrostops.value)
        .sort(([, valA], [, valB]) => valB - valA)
        .slice(0, 5);

    const labels = sortedData.map(([reason]) => reason);
    const values = sortedData.map(([, v]) => v);
    const total = values.reduce((acc, v) => acc + v, 0);

    // cumulative % data
    const cumulativePercentages = values.reduce<number[]>((acc, val) => {
        const sum = (acc[acc.length - 1] || 0) + val;
        acc.push((sum / total) * 100);
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
                display: true,
                text: 'Pareto-Diagramm',
                color: styles.getPropertyValue('--text-color').trim(),
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: { top: 10, bottom: 10 },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${processOrderNumber.value}`,
                color: styles.getPropertyValue('--text-color').trim(),
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: { top: 0, bottom: 20 },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e0e0e0' } },
            y1: {
                min: 0,
                max: 100,
                ticks: {
                    callback: (val: number) => `${val}%`,
                },
            },
        },
    };
};

// -- Session Storage
const saveSelectedMachineToSession = (machine: Machine) => {
    sessionStorage.setItem('selectedMachine', JSON.stringify(machine));
};

const loadSelectedMachineFromSession = (): Machine | null => {
    const stored = sessionStorage.getItem('selectedMachine');
    return stored ? JSON.parse(stored) : null;
};

// -- WebSocket
const handleWebSocketMessage = async (msg: OEEDataMessage) => {
    if (
        msg.type === 'OEEData' &&
        selectedMachine.value &&
        msg.data.workcenter_id === selectedMachine.value.workcenter_id
    ) {
        availability.value = parseFloat((msg.data.availability || 0).toFixed(2));
        performance.value = parseFloat((msg.data.performance || 0).toFixed(2));
        quality.value = parseFloat((msg.data.quality || 0).toFixed(2));
        oee.value = parseFloat((msg.data.oee || 0).toFixed(2));
        updateCharts();
    }
};
const handleWebSocketError = (err: unknown) => console.error('WebSocket error:', err);
const handleWebSocketClose = (event: CloseEvent) => {
    console.warn('WebSocket closed:', event.reason);
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <!-- MACHINE DROPDOWN -->
        <div class="col-span-12 flex justify-start px-4">
            <Select
                v-model="selectedMachine"
                :options="machineOptions"
                placeholder="Select Machine"
                option-label="name"
                class="w-full text-lg"
            />
        </div>

        <!-- OEE METRICS CARDS -->
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

        <!-- STACKED BAR CHART -->
        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card h-full">
                <Chart type="bar" :data="stackedChartData" :options="stackedChartOptions" class="h-full" />
            </div>
        </div>

        <!-- PARETO CHART FOR MICROSTOPS -->
        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card h-full">
                <Chart type="bar" :data="paretoData" :options="paretoOptions" class="w-full h-full" />
            </div>
        </div>
    </div>

    <!-- TOOLBAR & TABLE -->
    <div class="card">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    :disabled="!selectedMicrostops.length && !microstop.microstop_ID"
                    @click="confirmDeleteMicrostop()"
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

            <Column selection-mode="multiple" style="width: 3rem" :exportable="false" />

            <Column field="microstop_ID" header="Microstop ID" sortable filter filterPlaceholder="Search by ID" />
            <Column field="order_id" header="Order ID" sortable filter filterPlaceholder="Search by Order ID" />
            <Column field="start_date" header="Start Time" sortable filter filterPlaceholder="Search by Start Time" />
            <Column field="end_date" header="End Time" sortable filter filterPlaceholder="Search by End Time" />
            <Column field="reason" header="Reason" sortable filter filterPlaceholder="Search by Reason" />
            <Column field="differenz" header="Duration" sortable filter filterPlaceholder="Search by Duration" />
            <Column :exportable="false">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMicrostop(data)" />
                    <Button
                        icon="pi pi-trash"
                        outlined
                        rounded
                        severity="danger"
                        @click="confirmDeleteMicrostop(data)"
                    />
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- MICROSTOP DIALOG -->
    <Dialog
        v-model:visible="microstopDialog"
        :header="microstop.microstop_ID ? 'Edit Microstop' : 'New Microstop'"
        :style="{ width: '40vw' }"
        modal
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
                <Calendar id="start_date" v-model="microstop.start_date" show-time />
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
            <Button label="Cancel" icon="pi pi-times" @click="microstopDialog = false" />
            <Button label="Save" icon="pi pi-check" @click="saveMicrostop" />
        </template>
    </Dialog>

    <!-- DELETE CONFIRMATION DIALOG -->
    <Dialog v-model:visible="deleteMicrostopsDialog" header="Confirm Delete" modal>
        <p>
            Are you sure you want to delete
            {{ selectedMicrostops.length > 1 ? 'these microstops?' : 'this microstop?' }}
        </p>

        <template #footer>
            <Button label="No" icon="pi pi-times" @click="deleteMicrostopsDialog = false" />
            <Button label="Yes" icon="pi pi-check" @click="handleDeleteMicrostop" />
        </template>
    </Dialog>
</template>
