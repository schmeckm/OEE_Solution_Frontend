<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import PlannedDowntimeService from '@/service/PlannedDowntimeService';

const toast = useToast();
const plannedDowntimes = ref([]);
const machines = ref([]);
const selectedPlannedDowntimes = ref([]);
const downtimeDialog = ref(false);
const deleteDowntimeDialog = ref(false);
const deleteDowntimesDialog = ref(false);
const plannedDowntime = ref({});
const submitted = ref(false);

onMounted(async () => {
    console.log('[DEBUG] Component Mounted');
    await fetchMachines();
    await fetchPlannedDowntimes();
});

// Fetch all planned downtimes with machine details
async function fetchPlannedDowntimes() {
    try {
        console.log('[DEBUG] Fetching planned downtimes...');
        plannedDowntimes.value = await PlannedDowntimeService.getPlannedDowntimesWithMachines();
        console.log('[DEBUG] Planned downtimes fetched:', JSON.parse(JSON.stringify(plannedDowntimes.value)));
    } catch (error) {
        console.error('[ERROR] Failed to load planned downtimes:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load planned downtimes.',
            life: 3000,
        });
    }
}

// Fetch all machines
async function fetchMachines() {
    try {
        console.log('[DEBUG] Fetching machines...');
        machines.value = await PlannedDowntimeService.getMachines();
        console.log('[DEBUG] Machines fetched:', machines.value);
    } catch (error) {
        console.error('[ERROR] Failed to load machines:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load machines.',
            life: 3000,
        });
    }
}

// Open dialog for adding or editing a planned downtime
function openDialogForDowntime(downtime = null) {
    if (downtime) {
        console.log('[DEBUG] Opening dialog to edit downtime:', JSON.parse(JSON.stringify(downtime)));
        plannedDowntime.value = {
            ...downtime,
            start_date: new Date(downtime.start_date),
            end_date: new Date(downtime.end_date),
        };
    } else {
        console.log('[DEBUG] Opening dialog for new downtime.');
        plannedDowntime.value = {
            plannedOrder_ID: null, // Ensure ID is null for new downtimes
            order_id: '',
            start_date: new Date(),
            end_date: new Date(),
            workcenter_id: '',
            durationInMinutes: 0,
        };
    }
    downtimeDialog.value = true;
}

// Close dialog
function closeDialog() {
    console.log('[DEBUG] Closing dialog.');
    downtimeDialog.value = false;
    plannedDowntime.value = {};
    submitted.value = false;
}

// Save planned downtime
async function savePlannedDowntime() {
    submitted.value = true;

    const { order_id, start_date, end_date, workcenter_id, durationInMinutes } = plannedDowntime.value;
    if (!order_id || !start_date || !end_date || !workcenter_id || !durationInMinutes) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'All fields are required.',
            life: 3000,
        });
        return;
    }

    try {
        const formattedDowntime = {
            order_id,
            start_date: plannedDowntime.value.start_date.toISOString(),
            end_date: plannedDowntime.value.end_date.toISOString(),
            workcenter_id,
            durationInMinutes,
        };

        if (plannedDowntime.value.plannedOrder_ID) {
            console.log('[DEBUG] Updating downtime:', formattedDowntime);
            await PlannedDowntimeService.updatePlannedDowntime(
                plannedDowntime.value.plannedOrder_ID,
                formattedDowntime
            );
            toast.add({
                severity: 'success',
                summary: 'Updated',
                detail: 'Planned downtime updated successfully.',
                life: 3000,
            });
        } else {
            console.log('[DEBUG] Creating downtime:', formattedDowntime);
            await PlannedDowntimeService.createPlannedDowntime(formattedDowntime);
            toast.add({
                severity: 'success',
                summary: 'Created',
                detail: 'Planned downtime created successfully.',
                life: 3000,
            });
        }
        closeDialog();
        await fetchPlannedDowntimes();
    } catch (error) {
        console.error('[ERROR] Failed to save planned downtime:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || error.message || 'Failed to save planned downtime.',
            life: 3000,
        });
    }
}

// Confirm delete of a single downtime
function confirmDeleteDowntime(downtime) {
    plannedDowntime.value = downtime;
    deleteDowntimeDialog.value = true;
}

// Delete a single planned downtime
async function deleteSinglePlannedDowntime() {
    try {
        console.log('[DEBUG] Deleting downtime:', plannedDowntime.value.plannedOrder_ID);
        await PlannedDowntimeService.deletePlannedDowntime(plannedDowntime.value.plannedOrder_ID);
        deleteDowntimeDialog.value = false;
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Planned downtime deleted.',
            life: 3000,
        });
        await fetchPlannedDowntimes();
    } catch (error) {
        console.error('[ERROR] Failed to delete planned downtime:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete planned downtime.',
            life: 3000,
        });
    }
}

// Confirm delete of selected downtimes
function confirmDeleteSelected() {
    if (selectedPlannedDowntimes.value.length > 0) {
        deleteDowntimesDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select planned downtimes to delete.',
            life: 3000,
        });
    }
}

// Delete selected planned downtimes
async function deleteSelectedPlannedDowntimes() {
    try {
        const deletePromises = selectedPlannedDowntimes.value.map((downtime) =>
            PlannedDowntimeService.deletePlannedDowntime(downtime.plannedOrder_ID)
        );
        console.log('[DEBUG] Deleting selected downtimes:', selectedPlannedDowntimes.value);
        await Promise.all(deletePromises);
        deleteDowntimesDialog.value = false;
        selectedPlannedDowntimes.value = [];
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Selected planned downtimes deleted.',
            life: 3000,
        });
        await fetchPlannedDowntimes();
    } catch (error) {
        console.error('[ERROR] Failed to delete selected downtimes:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete selected planned downtimes.',
            life: 3000,
        });
    }
}

// Close delete dialog
function closeDeleteDialog() {
    deleteDowntimeDialog.value = false;
    deleteDowntimesDialog.value = false;
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button
                        label="New"
                        icon="pi pi-plus"
                        severity="secondary"
                        class="mr-2"
                        @click="openDialogForDowntime"
                    />
                    <Button
                        label="Delete"
                        icon="pi pi-trash"
                        severity="secondary"
                        @click="confirmDeleteSelected"
                        :disabled="!selectedPlannedDowntimes.length"
                    />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedPlannedDowntimes"
                :value="plannedDowntimes"
                data-key="plannedOrder_ID"
                paginator
                :rows="10"
                current-page-report-template="Showing {first} to {last} of {totalRecords} planned downtimes"
            >
                <template #header>
                    <h4 class="m-0">Manage Planned Downtimes</h4>
                </template>
                <Column selection-mode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="plannedOrder_ID" header="PlannedOrder ID" sortable></Column>
                <Column field="start_date" header="Start" sortable>
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.start_date).toLocaleString() }}
                    </template>
                </Column>
                <Column field="end_date" header="End" sortable>
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.end_date).toLocaleString() }}
                    </template>
                </Column>
                <Column header="Machine Name" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.machineDetails?.name || 'Unknown' }}
                    </template>
                </Column>
                <Column field="durationInMinutes" header="Duration (Minutes)" sortable></Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            outlined
                            rounded
                            class="mr-2"
                            @click="openDialogForDowntime(slotProps.data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            outlined
                            rounded
                            severity="danger"
                            @click="confirmDeleteDowntime(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Dialog for New/Edit -->
        <Dialog
            v-model:visible="downtimeDialog"
            :header="plannedDowntime.plannedOrder_ID ? 'Edit Planned Downtime' : 'New Planned Downtime'"
            :style="{ width: '40vw' }"
            modal
        >
            <div>
                <!-- ID (readonly) -->
                <div class="field mb-3" v-if="plannedDowntime.plannedOrder_ID">
                    <label for="plannedOrder_ID">ID</label>
                    <InputText
                        id="plannedOrder_ID"
                        v-model="plannedDowntime.plannedOrder_ID"
                        class="w-full readonly-field"
                        readonly
                    />
                </div>
                <!-- Start -->
                <div class="field mb-3">
                    <label for="start_date" class="required-label">Start</label>
                    <Calendar
                        id="start_date"
                        v-model="plannedDowntime.start_date"
                        show-time
                        class="w-full required-field"
                        required
                    />
                </div>

                <!-- End -->
                <div class="field mb-3">
                    <label for="end_date" class="required-label">End</label>
                    <Calendar
                        id="end_date"
                        v-model="plannedDowntime.end_date"
                        show-time
                        class="w-full required-field"
                        required
                    />
                </div>

                <!-- Machine -->
                <div class="field mb-3">
                    <label for="workcenter_id" class="required-label">Machine</label>
                    <Dropdown
                        id="workcenter_id"
                        v-model="plannedDowntime.workcenter_id"
                        :options="machines"
                        option-label="name"
                        option-value="workcenter_id"
                        class="w-full required-field"
                        placeholder="Select a Machine"
                        required
                    />
                </div>

                <!-- Duration -->
                <div class="field mb-3">
                    <label for="durationInMinutes" class="required-label">Duration (Minutes)</label>
                    <InputNumber
                        id="durationInMinutes"
                        v-model="plannedDowntime.durationInMinutes"
                        mode="decimal"
                        class="w-full required-field"
                        required
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="savePlannedDowntime" />
            </template>
        </Dialog>

        <!-- Confirm Delete Dialogs -->
        <Dialog v-model:visible="deleteDowntimeDialog" header="Confirm" modal>
            <p>
                Are you sure you want to delete <strong>{{ plannedDowntime.order_id }}</strong
                >?
            </p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSinglePlannedDowntime" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteDowntimesDialog" header="Confirm" modal>
            <p>Are you sure you want to delete the selected planned downtimes?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedPlannedDowntimes" />
            </template>
        </Dialog>
    </div>
</template>
