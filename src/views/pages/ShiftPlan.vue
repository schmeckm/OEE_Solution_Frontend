<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import ShiftPlanService from '@/service/ShiftPlanService';
import MachineService from '@/service/WorkCenterService'; // Korrigierter Import

// Initialize toast for user notifications
const toast = useToast();

// Reactive state variables
const shiftPlans = ref([]);
const machineOptions = ref([]);
const shiftOptions = ref([
    { label: 'Morning Shift', value: 'Morning Shift' },
    { label: 'Evening Shift', value: 'Evening Shift' },
    { label: 'Night Shift', value: 'Night Shift' },
]);

const shiftPlanDialog = ref(false);
const deleteShiftPlanDialog = ref(false);
const deleteShiftPlansDialog = ref(false);
const shiftPlan = ref({});
const selectedShiftPlans = ref([]);
const submitted = ref(false);
const loading = ref(true);

// Computed property for machine mapping (ID to Label)
const machineMap = computed(() => {
    const map = new Map();
    machineOptions.value.forEach((machine) => {
        map.set(machine.value, machine.label);
    });
    return map;
});

// Hilfsfunktion zum Parsen von "HH:mm" in ein Date-Objekt
function parseTime(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Hilfsfunktion zum Formatieren eines Date-Objekts in "HH:mm" String
function formatTimeString(date) {
    if (!date) return null;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Formatierungsfunktion für die Anzeige in der Tabelle
function formatTime(time) {
    if (!time) return 'N/A';
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Lifecycle hook to fetch data on component mount
onMounted(async () => {
    try {
        await fetchMachines();
        await fetchShiftPlans();
    } finally {
        loading.value = false;
    }
});

// Fetch machines for the dropdown
async function fetchMachines() {
    try {
        const machines = await MachineService.getMachines();
        machineOptions.value = machines.map((machine) => ({
            label: machine.name, // Maschinenname als Anzeige
            value: machine.workcenter_id, // Workcenter ID als Wert
        }));
        console.log('[DEBUG] Machines loaded:', machineOptions.value);
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }
}

// Fetch shift plans
async function fetchShiftPlans() {
    try {
        const fetchedShiftPlans = await ShiftPlanService.getShiftPlans();
        // Konvertiere Zeitstrings zu Date-Objekten
        shiftPlans.value = fetchedShiftPlans.map((sp) => ({
            ...sp,
            shift_start_time: parseTime(sp.shift_start_time),
            shift_end_time: parseTime(sp.shift_end_time),
            break_start: parseTime(sp.break_start),
            break_end: parseTime(sp.break_end),
        }));
        console.log('Fetched Shift Plans:', shiftPlans.value); // Debugging
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }
}

// Open dialog to create a new shift plan
function openNew() {
    shiftPlan.value = {
        shift_name: null,
        shift_start_time: null,
        shift_end_time: null,
        break_start: null,
        break_end: null,
        machine_id: null,
    };
    submitted.value = false;
    shiftPlanDialog.value = true;
}

// Close any open dialog
function closeDialog() {
    shiftPlanDialog.value = false;
    shiftPlan.value = {};
    submitted.value = false;
}

// Validate shift plan data
function isValidShiftPlan(plan) {
    const { shift_start_time, shift_end_time, break_start, break_end } = plan;
    if (shift_start_time && shift_end_time && shift_start_time >= shift_end_time) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Shift end time must be after shift start time.',
            life: 3000,
        });
        return false;
    }
    if (break_start && break_end && break_start >= break_end) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Break end time must be after break start time.',
            life: 3000,
        });
        return false;
    }
    // Additional validations can be added here
    return true;
}

// Save or update a shift plan
async function saveShiftPlan() {
    submitted.value = true;

    // Basic required fields validation
    if (
        !shiftPlan.value.shift_name ||
        !shiftPlan.value.shift_start_time ||
        !shiftPlan.value.shift_end_time ||
        !shiftPlan.value.machine_id
    ) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields.',
            life: 3000,
        });
        return;
    }

    // Logical validation
    if (!isValidShiftPlan(shiftPlan.value)) {
        return;
    }

    // Erstelle eine Kopie des shiftPlan und konvertiere Date-Objekte zu Strings
    const shiftPlanToSave = {
        ...shiftPlan.value,
        shift_start_time: formatTimeString(shiftPlan.value.shift_start_time),
        shift_end_time: formatTimeString(shiftPlan.value.shift_end_time),
        break_start: formatTimeString(shiftPlan.value.break_start),
        break_end: formatTimeString(shiftPlan.value.break_end),
    };

    try {
        if (shiftPlan.value.shift_id) {
            await ShiftPlanService.updateShiftPlan(shiftPlan.value.shift_id, shiftPlanToSave);
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Shift Plan Updated', life: 3000 });
        } else {
            await ShiftPlanService.createShiftPlan(shiftPlanToSave);
            toast.add({ severity: 'success', summary: 'Created', detail: 'Shift Plan Created', life: 3000 });
        }
        closeDialog();
        await fetchShiftPlans();
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }
}

// Open dialog to edit an existing shift plan
function editShiftPlan(sp) {
    shiftPlan.value = {
        ...sp,
        shift_start_time: new Date(sp.shift_start_time), // ISO-String zu Date-Objekt konvertieren
        shift_end_time: new Date(sp.shift_end_time),
        break_start: sp.break_start ? new Date(sp.break_start) : null,
        break_end: sp.break_end ? new Date(sp.break_end) : null,
        machine_id: sp.workcenter_id, // Maschine vorbelegen
    };
    console.log('[DEBUG] Editing shift plan:', shiftPlan.value);
    shiftPlanDialog.value = true;
}

// Confirm deletion of a single shift plan
function confirmDeleteShiftPlan(sp) {
    shiftPlan.value = sp;
    deleteShiftPlanDialog.value = true;
}

// Delete a single shift plan
async function deleteSingleShiftPlan() {
    try {
        await ShiftPlanService.deleteShiftPlan(shiftPlan.value.shift_id);
        deleteShiftPlanDialog.value = false;
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Shift Plan Deleted', life: 3000 });
        await fetchShiftPlans();
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }
}

// Confirm deletion of selected shift plans
function confirmDeleteSelected() {
    if (selectedShiftPlans.value.length > 0) {
        deleteShiftPlansDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select shift plans to delete.',
            life: 3000,
        });
    }
}

// Delete selected shift plans (batch deletion)
async function deleteSelectedShiftPlans() {
    try {
        const shiftIds = selectedShiftPlans.value.map((sp) => sp.shift_id);
        await ShiftPlanService.deleteShiftPlans(shiftIds); // Stellen Sie sicher, dass diese Methode existiert
        deleteShiftPlansDialog.value = false;
        selectedShiftPlans.value = [];
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Selected Shift Plans Deleted', life: 3000 });
        await fetchShiftPlans();
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }
}

// Close delete confirmation dialogs
function closeDeleteDialog() {
    deleteShiftPlanDialog.value = false;
    deleteShiftPlansDialog.value = false;
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
                        :disabled="!selectedShiftPlans.length"
                        @click="confirmDeleteSelected"
                    />
                </template>
            </Toolbar>

            <!-- Loading Indicator -->
            <div v-if="loading" class="flex justify-center">
                <ProgressSpinner />
            </div>

            <!-- Data Table -->
            <div v-else>
                <DataTable
                    ref="dt"
                    v-model:selection="selectedShiftPlans"
                    :value="shiftPlans"
                    data-key="shift_id"
                    :paginator="true"
                    :rows="10"
                    current-page-report-template="Showing {first} to {last} of {totalRecords} shift plans"
                >
                    <template #header>
                        <h4 class="m-0">Manage Shift Plans</h4>
                    </template>

                    <!-- Shift Name Column -->
                    <Column field="shift_name" header="Shift Name" sortable></Column>

                    <!-- Machine Column with Label Mapping -->
                    <Column field="workcenter_id" header="Machine">
                        <template #body="slotProps">
                            {{ machineMap.get(slotProps.data.workcenter_id) || 'Unknown' }}
                        </template>
                    </Column>

                    <!-- Start Time Column -->
                    <Column field="shift_start_time" header="Start Time" sortable>
                        <template #body="slotProps">
                            {{ formatTime(slotProps.data.shift_start_time) }}
                        </template>
                    </Column>

                    <!-- End Time Column -->
                    <Column field="shift_end_time" header="End Time" sortable>
                        <template #body="slotProps">
                            {{ formatTime(slotProps.data.shift_end_time) }}
                        </template>
                    </Column>

                    <!-- Break Start Column -->
                    <Column field="break_start" header="Break Start">
                        <template #body="slotProps">
                            {{ formatTime(slotProps.data.break_start) }}
                        </template>
                    </Column>

                    <!-- Break End Column -->
                    <Column field="break_end" header="Break End">
                        <template #body="slotProps">
                            {{ formatTime(slotProps.data.break_end) }}
                        </template>
                    </Column>

                    <!-- Action Buttons Column -->
                    <Column :exportable="false">
                        <template #body="slotProps">
                            <Button
                                icon="pi pi-pencil"
                                outlined
                                rounded
                                class="mr-2"
                                aria-label="Edit Shift Plan"
                                @click="editShiftPlan(slotProps.data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                outlined
                                rounded
                                severity="danger"
                                aria-label="Delete Shift Plan"
                                @click="confirmDeleteShiftPlan(slotProps.data)"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Delete Single Shift Plan Confirmation Dialog -->
        <Dialog v-model:visible="deleteShiftPlanDialog" header="Confirm Delete" modal>
            <p>
                Are you sure you want to delete the shift plan "<strong>{{ shiftPlan.shift_name }}</strong
                >" (ID: {{ shiftPlan.shift_id }})?
            </p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSingleShiftPlan" />
            </template>
        </Dialog>

        <!-- Delete Selected Shift Plans Confirmation Dialog -->
        <Dialog v-model:visible="deleteShiftPlansDialog" header="Confirm Delete" modal>
            <p>Are you sure you want to delete the selected shift plans?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedShiftPlans" />
            </template>
        </Dialog>

        <!-- Shift Plan Create/Edit Dialog -->
        <Dialog
            v-model:visible="shiftPlanDialog"
            :header="shiftPlan.shift_id ? 'Edit Shift Plan' : 'New Shift Plan'"
            :style="{ width: '50vw' }"
        >
            <form @submit.prevent="saveShiftPlan">
                <!-- Shift Name Dropdown -->
                <div class="field mb-3">
                    <label for="shift_name" class="block font-bold mb-2">Shift Name</label>
                    <Dropdown
                        id="shift_name"
                        v-model="shiftPlan.shift_name"
                        :options="shiftOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        placeholder="Select Shift"
                        required
                        aria-required="true"
                    />
                </div>

                <!-- Machine Selection Dropdown -->
                <div class="field mb-3">
                    <label for="machine" class="block font-bold mb-2">Machine</label>
                    <Dropdown
                        id="machine"
                        v-model="shiftPlan.machine_id"
                        :options="machineOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        placeholder="Select Machine"
                        required
                        aria-required="true"
                    />
                </div>

                <!-- Shift Start Time Picker -->
                <div class="field mb-3">
                    <label for="shift_start_time" class="block font-bold mb-2">Shift Start Time</label>
                    <Calendar
                        id="shift_start_time"
                        v-model="shiftPlan.shift_start_time"
                        time-only
                        time-format="HH:mm"
                        hour-format="24"
                        placeholder="Select Start Time"
                        class="w-full"
                        required
                        aria-required="true"
                    />
                </div>

                <!-- Shift End Time Picker -->
                <div class="field mb-3">
                    <label for="shift_end_time" class="block font-bold mb-2">Shift End Time</label>
                    <Calendar
                        id="shift_end_time"
                        v-model="shiftPlan.shift_end_time"
                        time-only
                        time-format="HH:mm"
                        hour-format="24"
                        placeholder="Select End Time"
                        class="w-full"
                        required
                        aria-required="true"
                    />
                </div>

                <!-- Break Start Time Picker -->
                <div class="field mb-3">
                    <label for="break_start" class="block font-bold mb-2">Break Start Time</label>
                    <Calendar
                        id="break_start"
                        v-model="shiftPlan.break_start"
                        time-only
                        time-format="HH:mm"
                        hour-format="24"
                        placeholder="Select Break Start Time"
                        class="w-full"
                    />
                </div>

                <!-- Break End Time Picker -->
                <div class="field mb-3">
                    <label for="break_end" class="block font-bold mb-2">Break End Time</label>
                    <Calendar
                        id="break_end"
                        v-model="shiftPlan.break_end"
                        time-only
                        time-format="HH:mm"
                        hour-format="24"
                        placeholder="Select Break End Time"
                        class="w-full"
                    />
                </div>
            </form>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" :disabled="submitted" @click="saveShiftPlan" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
