<script setup>
import { ref, onMounted } from 'vue';
import { connectWebSocket } from '@/service/LineOEEService';
import WorkCenterService from '@/service/WorkCenterService';

const workCenters = ref([]);
const loading = ref(false);
const oeeStatus = ref({});
const oeeDetails = ref({}); // Stores detailed OEE data for tooltips

let socket;

// Handle incoming WebSocket messages
const handleWebSocketMessage = (message) => {
    if (message.type === 'OEEData' && message.data?.workcenter_id) {
        const { workcenter_id, availability, performance, quality, oee, processordernumber, materialnumber } =
            message.data;

        // Set the status based on OEE value
        oeeStatus.value[workcenter_id] = oee > 0 ? 'green' : 'red';

        // Save detailed OEE data
        oeeDetails.value[workcenter_id] = {
            availability: availability?.toFixed(2) || 'N/A',
            performance: performance?.toFixed(2) || 'N/A',
            quality: quality?.toFixed(2) || 'N/A',
            oee: oee?.toFixed(2) || 'N/A',
            processordernumber: processordernumber || 'N/A',
            material: materialnumber || 'N/A',
        };
    }
};

// Fetch all work centers
const fetchWorkCenters = async () => {
    loading.value = true;
    try {
        const allWorkCenters = await WorkCenterService.getMachines();
        workCenters.value = allWorkCenters.map((wc) => ({
            ...wc,
            status: oeeStatus.value[wc.workcenter_id] || 'gray',
        }));
    } catch (error) {
        console.error('Error fetching Work Centers:', error.message);
    } finally {
        loading.value = false;
    }
};

// Initialize WebSocket and load work centers
onMounted(() => {
    socket = connectWebSocket(handleWebSocketMessage);
    fetchWorkCenters();
});
</script>

<template>
    <div>
        <h4 class="mb-4">Work Centers</h4>
        <DataTable :value="workCenters" :loading="loading" paginator :rows="10">
            <Column field="workcenter_id" header="ID" />
            <Column field="name" header="Name" />
            <Column field="plant" header="Plant" />
            <Column field="area" header="Area" />
            <Column header="Status">
                <template #body="{ data }">
                    <span
                        :style="{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: oeeStatus[data.workcenter_id] || 'gray',
                            cursor: 'pointer',
                        }"
                        :title="
                            oeeDetails[data.workcenter_id]
                                ? `Availability: ${oeeDetails[data.workcenter_id].availability}%\n
                               Performance: ${oeeDetails[data.workcenter_id].performance}%\n
                               Quality: ${oeeDetails[data.workcenter_id].quality}%\n
                               OEE: ${oeeDetails[data.workcenter_id].oee}%\n
                               Material: ${oeeDetails[data.workcenter_id].material}\n
                               Process Order: ${oeeDetails[data.workcenter_id].processordernumber}`
                                : 'No data available'
                        "
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
