<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProcessOrderService from '@/service/ProcessOrderService';
import { parseISO, format } from 'date-fns'; // Für benutzerdefinierte Datumsformatierung

// Dynamisches Datumformat aus .env
const dateFormat = import.meta.env.VITE_DATE_FORMAT || 'yyyy-MM-dd HH:mm:ss';

const toast = useToast();
const processOrders = ref([]);
const machines = ref([]);
const processOrderDialog = ref(false);
const deleteProcessOrderDialog = ref(false);
const deleteProcessOrdersDialog = ref(false);
const processOrder = ref({});
const selectedProcessOrders = ref([]);
const submitted = ref(false);

const statusOptions = [
    { label: 'Released', value: 'REL' },
    { label: 'Created', value: 'CRD' },
];

onMounted(async () => {
    await fetchMachines();
    await fetchProcessOrders();
});

// Maschinen laden
async function fetchMachines() {
    try {
        machines.value = await ProcessOrderService.getMachines();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Prozessaufträge laden und Datum formatieren
async function fetchProcessOrders() {
    try {
        const rawOrders = await ProcessOrderService.getProcessOrders();
        processOrders.value = rawOrders.map((order) => ({
            ...order,
            machineName: order.machineName || 'Unknown', // Maschinenname übernehmen
            start_date_formatted: formatDate(order.start_date), // Nur für die Tabelle
            end_date_formatted: formatDate(order.end_date), // Nur für die Tabelle
            start_date: order.start_date ? new Date(order.start_date) : null,
            end_date: order.end_date ? new Date(order.end_date) : null,
            actualprocessorderstart: order.actualprocessorderstart ? new Date(order.actualprocessorderstart) : null,
            actualprocessorderend: order.actualprocessorderend ? new Date(order.actualprocessorderend) : null,
        }));

        console.log('Process Orders with Machines:', processOrders.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load process orders: ' + error.message,
            life: 3000,
        });
    }
}

function formatDate(dateStr) {
    console.log('Received date:', dateStr); // Log the input to see what is being received
    if (!dateStr) {
        console.log('No date provided'); // Log when no date is provided
        return 'No date provided';
    }

    try {
        const parsedDate = parseISO(dateStr); // Parse the ISO string to a Date object
        const formattedDate = format(parsedDate, dateFormat); // Format the parsed date
        console.log('Formatted date:', formattedDate); // Log the formatted date
        return formattedDate;
    } catch (error) {
        console.error('Error parsing or formatting date:', error); // Log any errors encountered during formatting
        return 'Error formatting date';
    }
}

// Neuer Prozessauftrag
function openNew() {
    processOrder.value = {
        processorderstatus: 'PEND',
        start_date: new Date(),
        end_date: new Date(),
        actualprocessorderstart: null,
        actualprocessorderend: null,
        setuptime: 0,
        processingtime: 0,
        teardowntime: 0,
        plannedproductionquantity: 0,
        confirmedproductionquantity: 0,
        targetperformance: 0,
        workcenter_id: null,
    };
    processOrderDialog.value = true;
    submitted.value = false;
}

function editProcessOrder(order) {
    processOrder.value = {
        ...order,
        start_date: order.start_date ? new Date(order.start_date) : null,
        end_date: order.end_date ? new Date(order.end_date) : null,
        actualprocessorderstart: order.actualprocessorderstart ? new Date(order.actualprocessorderstart) : null,
        actualprocessorderend: order.actualprocessorderend ? new Date(order.actualprocessorderend) : null,
    };

    console.log('Converted Process Order:', processOrder.value);
    processOrderDialog.value = true;
}

// Dialog schließen
function closeDialog() {
    processOrderDialog.value = false;
    processOrder.value = {};
    submitted.value = false;
}

// Prozessauftrag speichern
async function saveProcessOrder() {
    submitted.value = true;

    if (
        !processOrder.value.processordernumber ||
        !processOrder.value.materialnumber ||
        !processOrder.value.materialdescription
    ) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields.',
            life: 3000,
        });
        return;
    }

    try {
        const payload = {
            ...processOrder.value,
            start_date: processOrder.value.start_date ? processOrder.value.start_date.toISOString() : null,
            end_date: processOrder.value.end_date ? processOrder.value.end_date.toISOString() : null,
            actualprocessorderstart: processOrder.value.actualprocessorderstart
                ? processOrder.value.actualprocessorderstart.toISOString()
                : null,
            actualprocessorderend: processOrder.value.actualprocessorderend
                ? processOrder.value.actualprocessorderend.toISOString()
                : null,
        };

        if (processOrder.value.order_id) {
            await ProcessOrderService.updateProcessOrder(processOrder.value.order_id, payload);
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Process Order Updated', life: 3000 });
        } else {
            await ProcessOrderService.createProcessOrder(payload);
            toast.add({ severity: 'success', summary: 'Created', detail: 'Process Order Created', life: 3000 });
        }
        closeDialog();
        await fetchProcessOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Confirm delete of a single process order
function confirmDeleteProcessOrder(order) {
    processOrder.value = order;
    deleteProcessOrderDialog.value = true;
}

// Delete a single process order
async function deleteSingleProcessOrder() {
    if (!processOrder.value.order_id) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Process Order ID is missing.',
            life: 3000,
        });
        deleteProcessOrderDialog.value = false;
        return;
    }

    try {
        await ProcessOrderService.deleteProcessOrder(processOrder.value.order_id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Process Order deleted.', life: 3000 });
        deleteProcessOrderDialog.value = false;
        await fetchProcessOrders();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}

// Confirm delete of selected process orders
function confirmDeleteSelected() {
    if (selectedProcessOrders.value.length > 0) {
        deleteProcessOrdersDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select process orders to delete.',
            life: 3000,
        });
    }
}

// Delete selected process orders
async function deleteSelectedProcessOrders() {
    if (selectedProcessOrders.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select process orders to delete.',
            life: 3000,
        });
        return;
    }

    try {
        // Löschen aller ausgewählten Prozessaufträge
        const deletePromises = selectedProcessOrders.value.map((order) =>
            ProcessOrderService.deleteProcessOrder(order.order_id)
        );
        console.log('[DEBUG] Deleting selected process orders:', selectedProcessOrders.value);
        await Promise.all(deletePromises);

        toast.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Selected process orders deleted.',
            life: 3000,
        });

        // Tabelle aktualisieren
        selectedProcessOrders.value = [];
        await fetchProcessOrders();
    } catch (error) {
        console.error('[ERROR] Failed to delete selected process orders:', error.message);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete selected process orders.',
            life: 3000,
        });
    }
}

// Close delete dialogs
function closeDeleteDialog() {
    deleteProcessOrderDialog.value = false;
    deleteProcessOrdersDialog.value = false;
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
                        :disabled="!selectedProcessOrders.length"
                    />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedProcessOrders"
                :value="processOrders"
                data-key="order_id"
                paginator
                :rows="10"
                current-page-report-template="Showing {first} to {last} of {totalRecords} process orders"
            >
                <Column selection-mode="multiple" style="width: 3rem" :exportable="false"></Column>
                <template #header>
                    <h4 class="m-0">Manage Process Orders</h4>
                </template>
                <Column field="processordernumber" header="Order Number" sortable></Column>
                <Column field="materialnumber" header="Material Number" sortable></Column>
                <Column field="materialdescription" header="Description"></Column>
                <Column field="machineName" header="Machine Name" sortable></Column>
                <Column field="processorderstatus" header="Status"></Column>
                <Column field="start_date_formatted" header="Planned Start" sortable></Column>
                <Column field="end_date_formatted" header="Planned End" sortable></Column>
                <Column field="setuptime" header="Setup Time (min)" sortable></Column>
                <Column field="processingtime" header="Processing Time (min)" sortable></Column>
                <Column field="teardowntime" header="Teardown Time (min)" sortable></Column>
                <Column field="plannedproductionquantity" header="Planned Quantity" sortable></Column>
                <Column field="confirmedproductionquantity" header="Confirmed Quantity" sortable></Column>
                <Column field="targetperformance" header="Target Performance (%)" sortable></Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            outlined
                            rounded
                            class="mr-2"
                            @click="editProcessOrder(slotProps.data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            outlined
                            rounded
                            severity="danger"
                            @click="confirmDeleteProcessOrder(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="processOrderDialog"
            :header="processOrder.order_id ? 'Edit Process Order' : 'New Process Order'"
            :style="{ width: '50vw' }"
        >
            <div>
                <div class="field mb-3">
                    <label for="workcenter_id" class="block font-bold mb-2 required-label">Work Center ID</label>
                    <Dropdown
                        id="workcenter_id"
                        v-model="processOrder.workcenter_id"
                        :options="machines"
                        option-label="name"
                        option-value="workcenter_id"
                        class="w-full required-field"
                        placeholder="Select a Machine"
                        required
                    />
                </div>

                <div class="field mb-3">
                    <label for="processordernumber" class="block font-bold mb-2 required-label">Order Number</label>
                    <InputText
                        id="processordernumber"
                        v-model="processOrder.processordernumber"
                        required
                        class="w-full required-field"
                    />
                </div>

                <div class="field mb-3">
                    <label for="materialnumber" class="block font-bold mb-2 required-label">Material Number</label>
                    <InputText
                        id="materialnumber"
                        v-model="processOrder.materialnumber"
                        required
                        class="w-full required-field"
                    />
                </div>

                <div class="field mb-3">
                    <label for="materialdescription" class="block font-bold mb-2 required-label"
                        >Material Description</label
                    >
                    <InputText
                        id="materialdescription"
                        v-model="processOrder.materialdescription"
                        required
                        class="w-full required-field"
                    />
                </div>

                <div class="field mb-3">
                    <label for="start_date" class="block font-bold mb-2 required-label">Planned Start</label>
                    <Calendar
                        id="start_date"
                        v-model="processOrder.start_date"
                        show-time
                        :date-format="dateFormat"
                        class="w-full required-field"
                        required
                    />
                </div>

                <div class="field mb-3">
                    <label for="end_date" class="block font-bold mb-2 required-label">Planned End</label>
                    <Calendar
                        id="end_date"
                        v-model="processOrder.end_date"
                        show-time
                        :date-format="dateFormat"
                        class="w-full required-field"
                        required
                    />
                </div>

                <div class="field mb-3">
                    <label for="setuptime" class="block font-bold mb-2">Setup Time (min)</label>
                    <InputNumber id="setuptime" v-model="processOrder.setuptime" mode="decimal" class="w-full" />
                </div>

                <div class="field mb-3">
                    <label for="processingtime" class="block font-bold mb-2">Processing Time (min)</label>
                    <InputNumber
                        id="processingtime"
                        v-model="processOrder.processingtime"
                        mode="decimal"
                        class="w-full"
                    />
                </div>

                <div class="field mb-3">
                    <label for="teardowntime" class="block font-bold mb-2">Teardown Time (min)</label>
                    <InputNumber id="teardowntime" v-model="processOrder.teardowntime" mode="decimal" class="w-full" />
                </div>

                <div class="field mb-3">
                    <label for="plannedproductionquantity" class="block font-bold mb-2">Planned Quantity</label>
                    <InputNumber
                        id="plannedproductionquantity"
                        v-model="processOrder.plannedproductionquantity"
                        mode="decimal"
                        class="w-full"
                    />
                </div>

                <div class="field mb-3">
                    <label for="confirmedproductionquantity" class="block font-bold mb-2">Confirmed Quantity</label>
                    <InputNumber
                        id="confirmedproductionquantity"
                        v-model="processOrder.confirmedproductionquantity"
                        mode="decimal"
                        class="w-full"
                    />
                </div>

                <div class="field mb-3">
                    <label for="targetperformance" class="block font-bold mb-2">Target Performance (%)</label>
                    <InputNumber
                        id="targetperformance"
                        v-model="processOrder.targetperformance"
                        mode="decimal"
                        class="w-full"
                    />
                </div>

                <div class="field mb-3">
                    <label for="processorderstatus" class="block font-bold mb-2 required-label">Status</label>
                    <Dropdown
                        id="processorderstatus"
                        v-model="processOrder.processorderstatus"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full required-field"
                        required
                    />
                </div>

                <div class="field mb-3">
                    <label for="actualprocessorderstart" class="block font-bold mb-2">Actual Start</label>
                    <Calendar
                        id="actualprocessorderstart"
                        v-model="processOrder.actualprocessorderstart"
                        show-time
                        :date-format="dateFormat"
                        class="w-full"
                    />
                </div>

                <div class="field mb-3">
                    <label for="actualprocessorderend" class="block font-bold mb-2">Actual End</label>
                    <Calendar
                        id="actualprocessorderend"
                        v-model="processOrder.actualprocessorderend"
                        showTime
                        :dateFormat="dateFormat"
                        class="w-full"
                    />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveProcessOrder" />
            </template>
        </Dialog>

        <!-- Delete Process Order Dialog -->
        <Dialog v-model:visible="deleteProcessOrderDialog" header="Confirm Delete" modal>
            <p>Are you sure you want to delete the process order with ID: {{ processOrder.order_id }}?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSingleProcessOrder" />
            </template>
        </Dialog>

        <!-- Delete Selected Process Orders Dialog -->
        <Dialog v-model:visible="deleteProcessOrdersDialog" header="Confirm Delete" modal>
            <p>Are you sure you want to delete the selected process orders?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDeleteDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedProcessOrders" />
            </template>
        </Dialog>
    </div>
</template>
