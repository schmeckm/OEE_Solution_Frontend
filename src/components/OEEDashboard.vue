<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Chart from 'primevue/chart';
import { useMachines } from '@/composables/useMachines';
import { useMicrostops } from '@/composables/useMicrostops';
import { useCharts } from '@/composables/useCharts';
import { useWebSocket } from '@/composables/useWebSocket';

const { machines, selectedMachine, saveSelectedMachineToSession } = useMachines();
const orderId = ref<number | null>(null);
const { microstops, loadMicrostops, createMicrostop, deleteMicrostop } = useMicrostops(orderId);
const { chartData, chartOptions, updateCharts } = useCharts({ microstops });

const microstopDialog = ref(false);
const microstop = ref({ reason: '', start_date: null, end_date: null, differenz: null });
const selectedMicrostops = ref([]);

useWebSocket((msg) => {
    if (selectedMachine.value && msg.data.workcenter_id === selectedMachine.value.workcenter_id) {
        updateCharts(msg.data);
    }
});

watch(selectedMachine, async (machine) => {
    if (machine) {
        orderId.value = machine.workcenter_id;
        saveSelectedMachineToSession(machine);
        await loadMicrostops();
    } else {
        orderId.value = null;
    }
});

const openNewMicrostop = () => {
    microstop.value = { reason: '', start_date: null, end_date: null, differenz: null };
    microstopDialog.value = true;
};

const saveMicrostop = async () => {
    await createMicrostop(microstop.value);
    microstopDialog.value = false;
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 px-4">
            <Select
                v-model="selectedMachine"
                :options="machines"
                placeholder="Select Machine"
                option-label="name"
                class="w-full text-lg"
            />
        </div>

        <div class="col-span-12 flex gap-4 px-4">
            <div class="card">Availability: {{ chartData.availability }}%</div>
            <div class="card">Performance: {{ chartData.performance }}%</div>
            <div class="card">Quality: {{ chartData.quality }}%</div>
            <div class="card">OEE: {{ chartData.oee }}%</div>
        </div>

        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card">
                <Chart type="bar" :data="chartData.stacked" :options="chartOptions.stacked" />
            </div>
        </div>

        <div class="col-span-12 xl:col-span-6 p-4">
            <div class="card">
                <Chart type="bar" :data="chartData.pareto" :options="chartOptions.pareto" />
            </div>
        </div>

        <div class="col-span-12 p-4">
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="New" icon="pi pi-plus" @click="openNewMicrostop" />
                </template>
            </Toolbar>

            <DataTable :value="microstops" v-model:selection="selectedMicrostops" paginator :rows="10">
                <Column selectionMode="multiple" />
                <Column field="microstop_ID" header="ID" sortable />
                <Column field="reason" header="Reason" sortable />
                <Column field="start_date" header="Start" sortable />
                <Column field="end_date" header="End" sortable />
                <Column field="differenz" header="Duration" sortable />
            </DataTable>
        </div>

        <Dialog v-model:visible="microstopDialog" header="Microstop" modal>
            <div class="grid gap-4">
                <InputText v-model="microstop.reason" placeholder="Reason" />
                <Calendar v-model="microstop.start_date" showTime placeholder="Start Date" />
                <Calendar v-model="microstop.end_date" showTime placeholder="End Date" />
                <InputNumber v-model="microstop.differenz" placeholder="Duration" />
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="microstopDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveMicrostop" />
            </template>
        </Dialog>
    </div>
</template>
