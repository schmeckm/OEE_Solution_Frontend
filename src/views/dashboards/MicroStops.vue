<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import MicrostopService from '@/service/MicrostopService';
import ProcessOrderService from '@/service/ProcessOrderService';
import ReasonCodeService from '@/service/ReasonCodeService'; // API für Reason-Codes
import { useLayout } from '@/layout/composables/layout';
import { parseISO, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from 'primevue/usetoast';

// Helper-Funktion, um Erfolgsmeldungen anzuzeigen
const showSuccess = (message: string) => {
    toast.add({
        severity: 'success',
        summary: 'Erfolg',
        detail: message,
        life: 3000,
    });
};

// TypeScript-Interface für Microstop
interface Microstop {
    microstop_ID: number;
    reason: string; // z. B. "defekt", "wartung", etc.
    start_date: string; // ISO-String
    end_date?: string | null;
    differenz: number;
    start_date_formatted?: string;
    order_id: number | string;
}

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const toast = useToast();
const dateFormat = import.meta.env.VITE_DATE_FORMAT || 'yyyy-MM-dd HH:mm:ss';

// Hilfsfunktion zur Formatierung von Datum-Strings
function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Kein Datum angegeben';
    try {
        const parsedDate = parseISO(dateStr);
        return format(parsedDate, dateFormat, { locale: de });
    } catch (error) {
        console.error('Fehler beim Formatieren des Datums:', error);
        return 'Ungültiges Datum';
    }
}

// Reaktive States
const allMicrostops = ref<Microstop[]>([]);
const filteredMicrostops = ref<Microstop[]>([]);
const chartData = ref<any>(null);
const chartOptions = ref<any>(null);
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const selectedOrders = ref<any[]>([]);
const reasonOptions = ref<any[]>([]);
const orderOptions = ref<any[]>([]);
const selectedMicrostops = ref<Microstop[]>([]);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

// currentMicrostop als ref – analog zum funktionierenden Maschinen-View
const currentMicrostop = ref({
    reason: '',
    start_date: new Date(),
    end_date: null,
    differenz: 0,
    order_id: 0,
});

// Reason-Optionen, die per API geladen werden

async function loadReasons() {
    try {
        const reasonCodes = await ReasonCodeService.getReasonCodes();
        // Erwartet wird, dass jedes Element "description" und "code" besitzt.
        reasonOptions.value = reasonCodes.map((item: any) => ({
            label: item.description,
            value: item.code,
        }));
    } catch (error) {
        console.error('Error loading reason codes:', error);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Lade Reason Codes fehlgeschlagen',
            life: 3000,
        });
    }
}

// Lädt Microstops und Process Orders
async function loadMicrostopsAndOrders() {
    try {
        const microstops = await MicrostopService.fetchMicrostops();
        allMicrostops.value = microstops.map((microstop: Microstop) => ({
            ...microstop,
            start_date_formatted: formatDate(microstop.start_date),
        }));

        const processOrders = await ProcessOrderService.getProcessOrders();
        const orderMap = new Map(processOrders.map((order: any) => [order.order_id, order.processordernumber]));

        const uniqueOrders = [...new Set(microstops.map((item: Microstop) => item.order_id))];
        orderOptions.value = uniqueOrders.map((orderId) => ({
            name: orderMap.get(orderId) || `Unknown (${orderId})`,
            value: orderId,
        }));

        // Falls keine Filter gesetzt sind, leere Tabelle
        filteredMicrostops.value = [];
        applyFilters();
    } catch (error) {
        console.error('Error loading data:', error);
        toast.add({
            severity: 'error',
            summary: 'Laden fehlgeschlagen',
            detail: 'Daten konnten nicht geladen werden',
            life: 3000,
        });
    }
}

function initChartStyles() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color').trim();
    chartData.value = {
        labels: [],
        datasets: [
            {
                label: 'Microstop Reasons',
                data: [],
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-primary-300').trim(),
                    documentStyle.getPropertyValue('--p-primary-400').trim(),
                    documentStyle.getPropertyValue('--p-primary-500').trim(),
                ],
            },
        ],
    };

    chartOptions.value = {
        plugins: {
            legend: {
                labels: { color: textColor },
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.label}: ${context.raw}`,
                },
            },
        },
    };
}

async function applyFilters() {
    if (!startDate.value && !endDate.value && selectedOrders.value.length === 0) {
        filteredMicrostops.value = [];
        updateChartData([]);
        return;
    }

    let filtered = [...allMicrostops.value];

    if (startDate.value && endDate.value) {
        const start = startDate.value;
        const end = endDate.value;
        filtered = filtered.filter((item) => {
            const itemDate = new Date(item.start_date);
            return itemDate >= start && itemDate <= end;
        });
    }

    if (selectedOrders.value.length) {
        const selectedOrderIds = new Set(selectedOrders.value.map((order: any) => order.value));
        filtered = filtered.filter((item) => selectedOrderIds.has(item.order_id));
    }

    filteredMicrostops.value = filtered;
    await nextTick();
    updateChartData(filtered);
}

function updateChartData(data: Microstop[]) {
    const reasons = data.reduce((acc: Record<string, number>, cur) => {
        acc[cur.reason] = (acc[cur.reason] || 0) + cur.differenz;
        return acc;
    }, {});
    chartData.value.labels = Object.keys(reasons);
    chartData.value.datasets[0].data = Object.values(reasons);
}

function editMicrostop(data: Partial<Microstop>) {
    if (!data.microstop_ID) {
        currentMicrostop.value = {
            reason: '',
            start_date: new Date(),
            end_date: null,
            differenz: 0,
            order_id: 0,
        };
    } else {
        currentMicrostop.value = {
            ...data,
            start_date: data.start_date ? new Date(data.start_date) : new Date(),
            end_date: data.end_date ? new Date(data.end_date) : null,
        };
    }
    editDialogVisible.value = true;
}

const saveMicrostop = async () => {
    try {
        // Erstelle eine Kopie des zu speichernden Objekts und konvertiere Datumswerte in ISO-Strings
        const microstopToSave = { ...currentMicrostop.value };

        if (microstopToSave.start_date instanceof Date) {
            microstopToSave.start_date = microstopToSave.start_date.toISOString();
        }
        if (microstopToSave.end_date instanceof Date) {
            microstopToSave.end_date = microstopToSave.end_date.toISOString();
        }

        if (microstopToSave.microstop_ID) {
            // Update eines bestehenden Microstops
            await MicrostopService.updateMicrostop(microstopToSave.microstop_ID, microstopToSave);
            showSuccess('Microstop erfolgreich aktualisiert.');

            // Aktualisiere die lokale Liste – falls vorhanden
            allMicrostops.value = allMicrostops.value.map((stop) =>
                stop.microstop_ID === microstopToSave.microstop_ID ? { ...microstopToSave } : stop
            );
        } else {
            // Neuen Microstop erstellen
            const newMicrostop = await MicrostopService.createMicrostop(microstopToSave);
            showSuccess('Microstop erfolgreich erstellt.');
            allMicrostops.value = [...allMicrostops.value, newMicrostop];
        }
        loadMicrostopsAndOrders();
        // Dialog schließen
        editDialogVisible.value = false;
    } catch (error) {
        console.error('Fehler beim Speichern des Microstops:', error);
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Speichern fehlgeschlagen',
            life: 3000,
        });
    }
};

function confirmDeleteMicrostop(data: Microstop) {
    currentMicrostop.value = { ...data };
    deleteDialogVisible.value = true;
}

async function deleteMicrostop() {
    try {
        allMicrostops.value = allMicrostops.value.filter(
            (item) => item.microstop_ID !== currentMicrostop.value.microstop_ID
        );
        toast.add({
            severity: 'success',
            summary: 'Gelöscht',
            detail: 'Microstop entfernt',
            life: 3000,
        });
        deleteDialogVisible.value = false;
        loadMicrostopsAndOrders();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Löschen fehlgeschlagen',
            life: 3000,
        });
    }
}

onMounted(() => {
    initChartStyles();
    loadMicrostopsAndOrders();
    loadReasons();
});

watch([startDate, endDate, selectedOrders, getPrimary, getSurface, isDarkTheme], () => {
    initChartStyles();
    applyFilters();
});
</script>

<template>
    <Fluid class="grid grid-cols-12 gap-6">
        <!-- Filter Box -->
        <div class="col-span-12">
            <div class="card">
                <h4 class="text-lg font-bold text-primary mb-2">Filters</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Calendar
                        v-model="startDate"
                        show-time
                        :date-format="dateFormat"
                        class="w-full"
                        placeholder="Start Date"
                    />
                    <Calendar
                        v-model="endDate"
                        show-time
                        :date-format="dateFormat"
                        class="w-full"
                        placeholder="End Date"
                    />
                    <MultiSelect
                        v-model="selectedOrders"
                        :options="orderOptions"
                        option-label="name"
                        placeholder="Select Process Orders"
                        :max-selected-labels="3"
                        filter
                    />
                </div>
                <Button label="Apply Filters" class="mt-4" @click="applyFilters" />
            </div>
        </div>

        <!-- Donut Chart -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card flex flex-col items-center">
                <h4 class="font-semibold text-xl mb-4">Microstop Reasons</h4>
                <Chart type="doughnut" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem]" />
            </div>
        </div>

        <!-- Data Table -->
        <div class="col-span-12 p-4">
            <div class="card">
                <Toolbar class="mb-4">
                    <template #start>
                        <Button
                            label="New"
                            icon="pi pi-plus"
                            severity="secondary"
                            class="mr-2"
                            @click="editMicrostop({})"
                        />
                        <Button
                            label="Delete"
                            icon="pi pi-trash"
                            severity="secondary"
                            :disabled="!selectedMicrostops.length"
                            @click="confirmDeleteMicrostop(selectedMicrostops[0])"
                        />
                    </template>
                    <template #end>
                        <Button label="Export" icon="pi pi-upload" class="p-button-secondary" @click="exportCSV" />
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
                    responsive-layout="scroll"
                >
                    <template #header>
                        <h4 class="m-0">Microstop Details</h4>
                    </template>
                    <Column selection-mode="multiple" style="width: 3rem"></Column>
                    <Column field="microstop_ID" header="Microstop ID" sortable filter></Column>
                    <Column field="reason" header="Reason" sortable filter></Column>
                    <Column field="start_date" header="Start Date" sortable filter></Column>
                    <Column field="end_date" header="End Date" sortable filter></Column>
                    <Column field="differenz" header="Duration (min)" sortable filter></Column>
                    <Column header="Status">
                        <template #body="{ data }">
                            <i
                                :class="data.end_date ? 'pi pi-check text-green-500' : 'pi pi-clock text-red-500'"
                                class="text-lg"
                                :title="`
                  Start: ${data.start_date_formatted}
                  End: ${data.end_date || 'Noch aktiv'}
                  Dauer: ${data.differenz} min
                  Grund: ${data.reason}
                `"
                            />
                        </template>
                    </Column>
                    <Column :exportable="false">
                        <template #body="slotProps">
                            <Button
                                icon="pi pi-pencil"
                                class="p-button-rounded p-button-outlined p-button-secondary mr-2"
                                @click="editMicrostop(slotProps.data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                class="p-button-rounded p-button-outlined p-button-danger"
                                @click="confirmDeleteMicrostop(slotProps.data)"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </Fluid>

    <!-- Edit Microstop Dialog -->
    <Dialog v-model:visible="editDialogVisible" header="Edit Microstop" :modal="true" style="width: 50vw">
        <div>
            <label for="reason" class="required-label">Reason:</label>
            <Dropdown
                id="reason"
                v-model="currentMicrostop.reason"
                :options="reasonOptions"
                optionLabel="label"
                optionValue="label"
                class="w-full required-field"
                required
            />

            <label for="start_date" class="required-label">Start Date:</label>
            <Calendar
                id="start_date"
                v-model="currentMicrostop.start_date"
                show-time
                :date-format="dateFormat"
                class="w-full required-field"
            />

            <label for="end_date" class="required-label">End Date:</label>
            <Calendar
                id="end_date"
                v-model="currentMicrostop.end_date"
                show-time
                :date-format="dateFormat"
                class="w-full required-field"
            />

            <label for="duration" class="required-label">Duration (min):</label>
            <InputNumber v-model="currentMicrostop.differenz" id="duration" class="w-full" />
        </div>
        <template #footer>
            <Button label="Save" icon="pi pi-check" class="p-button-primary mr-2" @click="saveMicrostop" />
            <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="editDialogVisible = false" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialogVisible" header="Confirm Delete" modal>
        <p>Are you sure you want to delete this microstop?</p>
        <template #footer>
            <Button label="No" icon="pi pi-times" text @click="deleteDialogVisible = false" />
            <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteMicrostop" />
        </template>
    </Dialog>
</template>
