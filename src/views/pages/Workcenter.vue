<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import WorkCenterService from '@/service/WorkCenterService';

const toast = useToast();
const workCenters = ref([]);
const selectedWorkCenters = ref([]);
const workCenterDialog = ref(false);
const deleteWorkCenterDialog = ref(false);
const deleteWorkCentersDialog = ref(false);
const workCenter = ref({});
const submitted = ref(false);

onMounted(async () => {
    await fetchWorkCenters();
});

// Fetch all work centers
async function fetchWorkCenters() {
    try {
        workCenters.value = await WorkCenterService.getMachines();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Open dialog for adding a new work center
function openNew() {
    workCenter.value = {
        plant: '',
        area: '',
        name: '',
        description: '', // Neues Feld hinzugefügt
        OEE: false,
    };
    submitted.value = false;
    workCenterDialog.value = true;
}

// Open dialog for editing a work center
function editWorkCenter(wc) {
    workCenter.value = { ...wc };
    workCenterDialog.value = true;
}

// Close dialog
function closeDialog() {
    workCenterDialog.value = false;
    workCenter.value = {};
    submitted.value = false;
}

// Save work center
async function saveWorkCenter() {
    submitted.value = true;

    if (!workCenter.value.plant || !workCenter.value.name) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please fill all required fields.',
            life: 3000,
        });
        return;
    }

    try {
        if (workCenter.value.workcenter_id) {
            // Update existing work center
            await WorkCenterService.updateMachine(workCenter.value.workcenter_id, workCenter.value);
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Work Center updated.', life: 3000 });
        } else {
            // Create new work center
            await WorkCenterService.createMachine(workCenter.value);
            toast.add({ severity: 'success', summary: 'Created', detail: 'Work Center created.', life: 3000 });
        }
        workCenterDialog.value = false;
        await fetchWorkCenters();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Confirm delete of a single work center
function confirmDeleteWorkCenter(wc) {
    workCenter.value = wc;
    deleteWorkCenterDialog.value = true;
}

// Delete a single work center
async function deleteSingleWorkCenter() {
    if (!workCenter.value.workcenter_id) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Work Center ID is missing.',
            life: 3000,
        });
        deleteWorkCenterDialog.value = false;
        return;
    }

    try {
        await WorkCenterService.deleteMachine(workCenter.value.workcenter_id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Work Center deleted.', life: 3000 });
        deleteWorkCenterDialog.value = false;
        await fetchWorkCenters();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Confirm delete of selected work centers
function confirmDeleteSelected() {
    if (selectedWorkCenters.value.length > 0) {
        deleteWorkCentersDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select work centers to delete.',
            life: 3000,
        });
    }
}

// Delete selected work centers
async function deleteSelectedWorkCenters() {
    if (selectedWorkCenters.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select work centers to delete.',
            life: 3000,
        });
        return;
    }

    try {
        const deletePromises = selectedWorkCenters.value.map((wc) => WorkCenterService.deleteMachine(wc.workcenter_id));
        await Promise.all(deletePromises);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Selected Work Centers deleted.', life: 3000 });
        deleteWorkCentersDialog.value = false;
        selectedWorkCenters.value = [];
        await fetchWorkCenters();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Close delete dialogs
function closeDeleteDialog() {
    deleteWorkCenterDialog.value = false;
    deleteWorkCentersDialog.value = false;
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button
                        label="Delete"
                        icon="pi pi-trash"
                        severity="secondary"
                        :disabled="!selectedWorkCenters.length"
                        @click="confirmDeleteSelected"
                    />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedWorkCenters"
                :value="workCenters"
                data-key="workcenter_id"
                paginator
                :rows="10"
                current-page-report-template="Showing {first} to {last} of {totalRecords} work centers"
            >
                <template #header>
                    <h4 class="m-0">Manage Work Centers</h4>
                </template>
                <Column selection-mode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="workcenter_id" header="ID" sortable></Column>
                <Column field="plant" header="Plant" sortable></Column>
                <Column field="area" header="Area" sortable></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="description" header="Description" sortable></Column>
                <!-- Neues Feld hinzugefügt -->
                <Column field="OEE" header="OEE Status">
                    <template #body="slotProps">
                        <span>{{ slotProps.data.OEE ? 'Enabled' : 'Disabled' }}</span>
                    </template>
                </Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            outlined
                            rounded
                            class="mr-2"
                            @click="editWorkCenter(slotProps.data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            outlined
                            rounded
                            severity="danger"
                            @click="confirmDeleteWorkCenter(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Work Center Dialog -->
        <Dialog
            v-model:visible="workCenterDialog"
            :header="workCenter.workcenter_id ? 'Edit Work Center' : 'New Work Center'"
            :style="{ width: '40vw' }"
            modal
            @hide="closeDialog"
        >
            <div>
                <div v-if="workCenter.workcenter_id">
                    <label for="workcenter_id" class="block font-bold mb-2">ID</label>
                    <InputText id="workcenter_id" v-model="workCenter.workcenter_id" class="w-full" readonly />
                </div>
                <div>
                    <label for="plant" class="block font-bold mb-2">Plant</label>
                    <InputText id="plant" v-model="workCenter.plant" class="w-full" required />
                </div>
                <div>
                    <label for="area" class="block font-bold mb-2">Area</label>
                    <InputText id="area" v-model="workCenter.area" class="w-full" />
                </div>
                <div>
                    <label for="name" class="block font-bold mb-2">Name</label>
                    <InputText id="name" v-model="workCenter.name" class="w-full" required />
                </div>
                <div>
                    <label for="description" class="block font-bold mb-2">Description</label>
                    <!-- Neues Feld hinzugefügt -->
                    <InputText id="description" v-model="workCenter.description" class="w-full" />
                </div>
                <div>
                    <label for="OEE" class="block font-bold mb-2">OEE Status</label>
                    <Dropdown
                        id="OEE"
                        v-model="workCenter.OEE"
                        :options="[
                            { label: 'Enabled', value: true },
                            { label: 'Disabled', value: false },
                        ]"
                        option-label="label"
                        option-value="value"
                        placeholder="Select OEE Status"
                        required
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveWorkCenter" />
            </template>
        </Dialog>

        <!-- Delete Work Center Dialog -->
        <Dialog v-model:visible="deleteWorkCenterDialog" header="Confirm Delete" modal>
            <p>Are you sure you want to delete the work center with ID: {{ workCenter.workcenter_id }}?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSingleWorkCenter" />
            </template>
        </Dialog>

        <!-- Delete Selected Work Centers Dialog -->
        <Dialog v-model:visible="deleteWorkCentersDialog" header="Confirm Delete" modal>
            <p>Are you sure you want to delete the selected work centers?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedWorkCenters" />
            </template>
        </Dialog>
    </div>
</template>
