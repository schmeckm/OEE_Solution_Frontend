<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import ReasonCodeService from '@/service/ReasonCodeService';

const toast = useToast();
const reasonCodes = ref([]);
const reasonCodeDialog = ref(false);
const deleteReasonCodeDialog = ref(false);
const deleteReasonCodesDialog = ref(false);
const reasonCode = ref({});
const selectedReasonCodes = ref([]);
const submitted = ref(false);

onMounted(async () => {
    await fetchReasonCodes();
});

// Fetch all Reason Codes
async function fetchReasonCodes() {
    try {
        reasonCodes.value = await ReasonCodeService.getReasonCodes();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Open dialog for new Reason Code
function openNew() {
    reasonCode.value = {};
    submitted.value = false;
    reasonCodeDialog.value = true;
}

// Edit a Reason Code
function editReasonCode(rc) {
    reasonCode.value = { ...rc };
    reasonCodeDialog.value = true;
}

// Close Dialog
function closeDialog() {
    reasonCodeDialog.value = false;
    reasonCode.value = {};
}

// Save Reason Code
async function saveReasonCode() {
    submitted.value = true;

    if (reasonCode.value.description?.trim() && reasonCode.value.color?.trim()) {
        try {
            if (reasonCode.value.id) {
                // Update existing Reason Code
                await ReasonCodeService.updateReasonCode(reasonCode.value.id, reasonCode.value);
                toast.add({ severity: 'success', summary: 'Updated', detail: 'Reason Code Updated', life: 3000 });
            } else {
                // Create new Reason Code
                await ReasonCodeService.createReasonCode(reasonCode.value);
                toast.add({ severity: 'success', summary: 'Created', detail: 'Reason Code Created', life: 3000 });
            }
            reasonCodeDialog.value = false;
            await fetchReasonCodes();
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        }
    }
}

// Confirm delete dialog for a single Reason Code
function confirmDeleteReasonCode(rc) {
    reasonCode.value = rc;
    deleteReasonCodeDialog.value = true;
}

// Delete single Reason Code
async function deleteSingleReasonCode() {
    try {
        await ReasonCodeService.deleteReasonCode(reasonCode.value.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Reason Code Deleted', life: 3000 });
        deleteReasonCodeDialog.value = false;
        await fetchReasonCodes();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Confirm delete dialog for selected Reason Codes
function confirmDeleteSelected() {
    if (selectedReasonCodes.value.length > 0) {
        deleteReasonCodesDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select reason codes to delete.',
            life: 3000,
        });
    }
}

// Delete selected Reason Codes
async function deleteSelectedReasonCodes() {
    try {
        const deletePromises = selectedReasonCodes.value.map((rc) => ReasonCodeService.deleteReasonCode(rc.id));
        await Promise.all(deletePromises);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Selected Reason Codes Deleted', life: 3000 });
        deleteReasonCodesDialog.value = false;
        selectedReasonCodes.value = [];
        await fetchReasonCodes();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Export Reason Codes as CSV
function exportCSV() {
    const headers = ['ID', 'Description', 'Color'];
    const rows = reasonCodes.value.map((rc) => [rc.id, rc.description, rc.color]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reason_codes.csv';
    link.click();
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
                        @click="confirmDeleteSelected"
                        :disabled="!selectedReasonCodes.length"
                    />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedReasonCodes"
                :value="reasonCodes"
                dataKey="id"
                :paginator="true"
                :rows="10"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reason codes"
            >
                <template #header>
                    <h4 class="m-0">Manage Reason Codes</h4>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="description" header="Description" sortable></Column>
                <Column field="color" header="Color" sortable>
                    <template #body="slotProps">
                        <div
                            :style="{
                                backgroundColor: slotProps.data.color,
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                            }"
                        ></div>
                    </template>
                </Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            outlined
                            rounded
                            class="mr-2"
                            @click="editReasonCode(slotProps.data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            outlined
                            rounded
                            severity="danger"
                            @click="confirmDeleteReasonCode(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Reason Code Dialog -->
        <Dialog
            v-model:visible="reasonCodeDialog"
            :header="reasonCode.id ? 'Edit Reason Code' : 'New Reason Code'"
            :style="{ width: '30vw' }"
        >
            <div>
                <div class="field mb-3">
                    <label for="description" class="block font-bold mb-2">Description</label>
                    <InputText id="description" v-model="reasonCode.description" required class="w-full" />
                </div>
                <div class="field mb-3">
                    <label for="color" class="block font-bold mb-2">Color</label>
                    <input id="color" type="color" v-model="reasonCode.color" class="w-full h-10 border rounded" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveReasonCode" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteReasonCodeDialog" header="Confirm" modal>
            <p>
                Are you sure you want to delete <strong>{{ reasonCode.description }}</strong
                >?
            </p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteReasonCodeDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSingleReasonCode" />
            </template>
        </Dialog>

        <!-- Multiple Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteReasonCodesDialog" header="Confirm" modal>
            <p>Are you sure you want to delete the selected reason codes?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteReasonCodesDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedReasonCodes" />
            </template>
        </Dialog>
    </div>
</template>
