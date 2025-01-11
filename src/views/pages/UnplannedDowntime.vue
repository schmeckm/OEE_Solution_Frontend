<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import UnplannedDowntimeService from '@/service/UnplannedDowntimeService';

const toast = useToast();
const unplannedDowntimes = ref([]);
const machines = ref([]);
const selectedUnplannedDowntimes = ref([]);
const downtimeDialog = ref(false);
const deleteDowntimeDialog = ref(false);
const deleteDowntimesDialog = ref(false);
const unplannedDowntime = ref({});
const submitted = ref(false);

onMounted(async () => {
    console.log('[DEBUG] Component Mounted');
    await fetchMachines();
    await fetchUnplannedDowntimes();
});

// Fetch all unplanned downtimes with machine details
async function fetchUnplannedDowntimes() {
    try {
        console.log('[DEBUG] Fetching unplanned downtimes...');
        unplannedDowntimes.value = await UnplannedDowntimeService.getUnplannedDowntimesWithMachines();
        console.log('[DEBUG] Unplanned downtimes fetched:', JSON.parse(JSON.stringify(unplannedDowntimes.value)));
    } catch (error) {
        console.error('[ERROR] Failed to load unplanned downtimes:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load unplanned downtimes.',
            life: 3000,
        });
    }
}

// Fetch all machines
async function fetchMachines() {
    try {
        console.log('[DEBUG] Fetching machines...');
        machines.value = await UnplannedDowntimeService.getMachines();
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

// Open dialog for adding or editing an unplanned downtime
function openDialogForDowntime(downtime = null) {
    if (downtime) {
        console.log('[DEBUG] Opening dialog to edit downtime:', JSON.parse(JSON.stringify(downtime)));
        unplannedDowntime.value = {
            ...downtime,
            start_date: new Date(downtime.start_date),
            end_date: new Date(downtime.end_date),
        };
    } else {
        console.log('[DEBUG] Opening dialog for new downtime.');
        unplannedDowntime.value = {
            plannedOrder_ID: null,
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
    unplannedDowntime.value = {};
    submitted.value = false;
}

// Save unplanned downtime
async function saveUnplannedDowntime() {
    submitted.value = true;

    const { order_id, start_date, end_date, workcenter_id, durationInMinutes } = unplannedDowntime.value;
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
            start_date: unplannedDowntime.value.start_date.toISOString(),
            end_date: unplannedDowntime.value.end_date.toISOString(),
            workcenter_id,
            durationInMinutes,
        };

        if (unplannedDowntime.value.plannedOrder_ID) {
            console.log('[DEBUG] Updating downtime:', formattedDowntime);
            await UnplannedDowntimeService.updateUnplannedDowntime(
                unplannedDowntime.value.plannedOrder_ID,
                formattedDowntime
            );
            toast.add({
                severity: 'success',
                summary: 'Updated',
                detail: 'Unplanned downtime updated successfully.',
                life: 3000,
            });
        } else {
            console.log('[DEBUG] Creating downtime:', formattedDowntime);
            await UnplannedDowntimeService.createUnplannedDowntime(formattedDowntime);
            toast.add({
                severity: 'success',
                summary: 'Created',
                detail: 'Unplanned downtime created successfully.',
                life: 3000,
            });
        }
        closeDialog();
        await fetchUnplannedDowntimes();
    } catch (error) {
        console.error('[ERROR] Failed to save unplanned downtime:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data || 'Failed to save unplanned downtime.',
            life: 3000,
        });
    }
}

// Confirm delete of a single downtime
function confirmDeleteDowntime(downtime) {
    unplannedDowntime.value = downtime;
    deleteDowntimeDialog.value = true;
}

// Delete a single unplanned downtime
async function deleteSingleUnplannedDowntime() {
    try {
        console.log('[DEBUG] Deleting downtime:', unplannedDowntime.value.plannedOrder_ID);
        await UnplannedDowntimeService.deleteUnplannedDowntime(unplannedDowntime.value.plannedOrder_ID);
        deleteDowntimeDialog.value = false;
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Unplanned downtime deleted.',
            life: 3000,
        });
        await fetchUnplannedDowntimes();
    } catch (error) {
        console.error('[ERROR] Failed to delete unplanned downtime:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete unplanned downtime.',
            life: 3000,
        });
    }
}

// Confirm delete of selected downtimes
function confirmDeleteSelected() {
    if (selectedUnplannedDowntimes.value.length > 0) {
        deleteDowntimesDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select unplanned downtimes to delete.',
            life: 3000,
        });
    }
}

// Delete selected unplanned downtimes
async function deleteSelectedUnplannedDowntimes() {
    try {
        const deletePromises = selectedUnplannedDowntimes.value.map((downtime) =>
            UnplannedDowntimeService.deleteUnplannedDowntime(downtime.plannedOrder_ID)
        );
        console.log('[DEBUG] Deleting selected downtimes:', selectedUnplannedDowntimes.value);
        await Promise.all(deletePromises);
        deleteDowntimesDialog.value = false;
        selectedUnplannedDowntimes.value = [];
        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Selected unplanned downtimes deleted.',
            life: 3000,
        });
        await fetchUnplannedDowntimes();
    } catch (error) {
        console.error('[ERROR] Failed to delete selected downtimes:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete selected unplanned downtimes.',
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
                        :disabled="!selectedUnplannedDowntimes.length"
                    />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedUnplannedDowntimes"
                :value="unplannedDowntimes"
                dataKey="plannedOrder_ID"
                paginator
                :rows="10"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} unplanned downtimes"
            >
                <template #header>
                    <h4 class="m-0">Manage Unplanned Downtimes</h4>
                </template>
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="plannedOrder_ID" header="UnplannedOrder ID" sortable></Column>
                <Column field="start_date" header="Start" sortable>
                    <template #body="slotProps">{{ new Date(slotProps.data.start_date).toLocaleString() }}</template>
                </Column>
                <Column field="end_date" header="End" sortable>
                    <template #body="slotProps">{{ new Date(slotProps.data.end_date).toLocaleString() }}</template>
                </Column>
                <Column header="Machine Name" sortable>
                    <template #body="slotProps">{{ slotProps.data.machineDetails?.name || 'Unknown' }}</template>
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

        <!-- Dialog for adding or editing an unplanned downtime -->
        <Dialog
            v-model:visible="downtimeDialog"
            :header="unplannedDowntime.plannedOrder_ID ? 'Edit Unplanned Downtime' : 'New Unplanned Downtime'"
            :style="{ width: '40vw' }"
            modal
        >
            <div>
                <div class="field mb-3">
                    <label for="PlannedOrder ID" class="required-label">Order ID</label>
                    <InputText
                        id="plannedOrder_ID"
                        v-model="unplannedDowntime.plannedOrder_ID"
                        class="w-full required-field"
                        required
                    />
                </div>
                <div class="field mb-3">
                    <label for="start_date" class="required-label">Start</label>
                    <Calendar
                        id="start_date"
                        v-model="unplannedDowntime.start_date"
                        showTime
                        class="w-full required-field"
                        required
                    />
                </div>
                <div class="field mb-3">
                    <label for="end_date" class="required-label">End</label>
                    <Calendar
                        id="end_date"
                        v-model="unplannedDowntime.end_date"
                        showTime
                        class="w-full required-field"
                        required
                    />
                </div>
                <div class="field mb-3">
                    <label for="workcenter_id" class="required-label">Machine</label>
                    <Dropdown
                        id="workcenter_id"
                        v-model="unplannedDowntime.workcenter_id"
                        :options="machines"
                        optionLabel="name"
                        option-value="workcenter_id"
                        class="w-full required-field"
                        placeholder="Select a Machine"
                        required
                    />
                </div>
                <div class="field mb-3">
                    <label for="durationInMinutes" class="required-label">Duration (Minutes)</label>
                    <InputNumber
                        id="durationInMinutes"
                        v-model="unplannedDowntime.durationInMinutes"
                        class="w-full required-field"
                        required
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveUnplannedDowntime" />
            </template>
        </Dialog>

        <!-- Dialog for confirming deletion of a single downtime -->
        <Dialog v-model:visible="deleteDowntimeDialog" header="Confirm" modal>
            <p>
                Are you sure you want to delete <strong>{{ unplannedDowntime.order_id }}</strong
                >?
            </p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSingleUnplannedDowntime" />
            </template>
        </Dialog>

        <!-- Dialog for confirming deletion of selected downtimes -->
        <Dialog v-model:visible="deleteDowntimesDialog" header="Confirm" modal>
            <p>Are you sure you want to delete the selected unplanned downtimes?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedUnplannedDowntimes" />
            </template>
        </Dialog>
    </div>
</template>
