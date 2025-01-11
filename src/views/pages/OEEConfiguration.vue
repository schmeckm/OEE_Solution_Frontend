<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import OEEConfigService from '@/service/OEEConfigService';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';

const toast = useToast();
const oeeConfigs = ref([]);
const oeeConfigDialog = ref(false);
const deleteOeeConfigDialog = ref(false);
const deleteOeeConfigsDialog = ref(false);
const oeeConfig = ref({
    key: '',
    alias: '',
    type: '',
    command: '',
    metadata: {
        unit: '',
        description: '',
    },
    machineConnect: false,
});
const selectedOeeConfigs = ref([]);
const submitted = ref(false);

const typeOptions = [
    { label: 'Number', value: 'number' },
    { label: 'String', value: 'string' },
    { label: 'Int32', value: 'Int32' },
];

const commandOptions = [
    { label: 'DCMD', value: 'DCMD' },
    { label: 'Metrics', value: 'metrics' },
];

const unitOptions = [
    { label: 'Hours', value: 'hours' },
    { label: 'Units', value: 'units' },
    { label: 'Percent', value: 'percent' },
];

onMounted(async () => {
    await fetchOeeConfigs();
});

function showErrorToast(error) {
    const errorMessage = error.response?.data?.message ?? error.message ?? 'An unknown error occurred.';
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
    });
}

async function fetchOeeConfigs() {
    try {
        oeeConfigs.value = await OEEConfigService.getOeeConfigs();
    } catch (error) {
        showErrorToast(error);
    }
}

function openNew() {
    oeeConfig.value = {
        key: '',
        alias: '',
        type: '',
        command: '',
        metadata: {
            unit: '',
            description: '',
        },
        machineConnect: false,
    };
    submitted.value = false;
    oeeConfigDialog.value = true;
}

function closeDialog() {
    oeeConfigDialog.value = false;
    deleteOeeConfigDialog.value = false;
    deleteOeeConfigsDialog.value = false;
    oeeConfig.value = {};
    submitted.value = false;
}

async function saveOeeConfig() {
    submitted.value = true;

    // Setze nur den Wert des Dropdowns und nicht das ganze Objekt
    oeeConfig.value.type = oeeConfig.value.type?.value || oeeConfig.value.type;
    oeeConfig.value.command = oeeConfig.value.command?.value || oeeConfig.value.command;
    oeeConfig.value.metadata.unit = oeeConfig.value.metadata.unit?.value || oeeConfig.value.metadata.unit;

    // Check if all required fields are filled
    const isValid =
        oeeConfig.value.key?.trim() &&
        oeeConfig.value.alias?.trim() &&
        oeeConfig.value.type &&
        oeeConfig.value.command &&
        oeeConfig.value.metadata.unit &&
        oeeConfig.value.metadata.description?.trim();

    if (isValid) {
        try {
            if (oeeConfigs.value.some((config) => config.key === oeeConfig.value.key)) {
                // Update existing configuration
                await OEEConfigService.updateOeeConfig(oeeConfig.value.key, oeeConfig.value);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'OEE configuration updated.',
                    life: 3000,
                });
            } else {
                // Create new configuration
                await OEEConfigService.createOeeConfig(oeeConfig.value);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'OEE configuration created.',
                    life: 3000,
                });
            }
            closeDialog();
            await fetchOeeConfigs();
        } catch (error) {
            showErrorToast(error);
        }
    } else {
        toast.add({
            severity: 'error',
            summary: 'Validation',
            detail: 'Please fill in all required fields.',
            life: 3000,
        });
    }
}

function editOeeConfig(config) {
    // Setze die `value`-Eigenschaften direkt aus den Dropdown-Optionen, nicht das gesamte Objekt
    oeeConfig.value = {
        ...config,
        type: typeOptions.find((option) => option.value === config.type), // Setze den Wert aus den Optionen
        command: commandOptions.find((option) => option.value === config.command), // Setze den Wert aus den Optionen
        metadata: {
            ...config.metadata,
            unit: unitOptions.find((option) => option.value === config.metadata.unit), // Setze den Wert aus den Optionen
        },
    };
    oeeConfigDialog.value = true; // Öffne den Dialog
}

function confirmDeleteOeeConfig(config) {
    oeeConfig.value = config;
    deleteOeeConfigDialog.value = true;
}

async function deleteSingleOeeConfig() {
    try {
        await OEEConfigService.deleteOeeConfig(oeeConfig.value.key);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'OEE configuration deleted.',
            life: 3000,
        });
        closeDialog();
        await fetchOeeConfigs();
    } catch (error) {
        showErrorToast(error);
    }
}

function confirmDeleteSelected() {
    if (selectedOeeConfigs.value.length > 0) {
        deleteOeeConfigsDialog.value = true;
    } else {
        toast.add({
            severity: 'warn',
            summary: 'No Selection',
            detail: 'Please select configurations to delete.',
            life: 3000,
        });
    }
}

async function deleteSelectedOeeConfigs() {
    try {
        const deletePromises = selectedOeeConfigs.value.map((config) => OEEConfigService.deleteOeeConfig(config.key));
        await Promise.all(deletePromises);
        selectedOeeConfigs.value = [];
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Selected configurations deleted.',
            life: 3000,
        });
        closeDialog();
        await fetchOeeConfigs();
    } catch (error) {
        showErrorToast(error);
    }
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
                        :disabled="!selectedOeeConfigs.length"
                    />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedOeeConfigs"
                :value="oeeConfigs"
                dataKey="key"
                :paginator="true"
                :rows="10"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configurations"
            >
                <template #header>
                    <h4 class="m-0">Manage OEE Configurations</h4>
                </template>
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="key" header="Key" sortable></Column>
                <Column field="alias" header="Alias" sortable></Column>

                <!-- Updated Column for Type -->
                <Column header="Type" sortable>
                    <template #body="slotProps">
                        {{ typeOptions.find((option) => option.value === slotProps.data.type)?.label }}
                    </template>
                </Column>

                <!-- Updated Column for Command -->
                <Column header="Command">
                    <template #body="slotProps">
                        {{ commandOptions.find((option) => option.value === slotProps.data.command)?.label }}
                    </template>
                </Column>

                <!-- Updated Column for Unit -->
                <Column header="Unit">
                    <template #body="slotProps">
                        {{ unitOptions.find((option) => option.value === slotProps.data.metadata.unit)?.label }}
                    </template>
                </Column>

                <Column field="metadata.description" header="Description"></Column>
                <Column field="machineConnect" header="Machine Connect">
                    <template #body="slotProps">
                        <i v-if="slotProps.data.machineConnect" class="pi pi-check text-success"></i>
                        <i v-else class="pi pi-times text-danger"></i>
                    </template>
                </Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            outlined
                            rounded
                            class="mr-2"
                            @click="editOeeConfig(slotProps.data)"
                        />
                        <Button
                            icon="pi pi-trash"
                            outlined
                            rounded
                            severity="danger"
                            @click="confirmDeleteOeeConfig(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- OEE Configuration Dialog -->
        <Dialog
            v-model:visible="oeeConfigDialog"
            :header="oeeConfig.key ? 'Edit OEE Configuration' : 'New OEE Configuration'"
            :style="{ width: '40vw' }"
        >
            <div>
                <div class="field mb-3">
                    <label for="key" class="block font-bold mb-2">Key</label>
                    <InputText id="key" v-model="oeeConfig.key" required class="w-full" />
                </div>
                <div class="field mb-3">
                    <label for="alias" class="block font-bold mb-2">Alias</label>
                    <InputText id="alias" v-model="oeeConfig.alias" required class="w-full" />
                </div>
                <div class="field mb-3">
                    <label for="type" class="block font-bold mb-2">Type</label>
                    <Dropdown
                        id="type"
                        v-model="oeeConfig.type"
                        :options="typeOptions"
                        optionLabel="label"
                        placeholder="Select Type"
                        class="w-full"
                    />
                </div>
                <div class="field mb-3">
                    <label for="command" class="block font-bold mb-2">Command</label>
                    <Dropdown
                        id="command"
                        v-model="oeeConfig.command"
                        :options="commandOptions"
                        optionLabel="label"
                        placeholder="Select Command"
                        class="w-full"
                    />
                </div>
                <div class="field mb-3">
                    <label for="unit" class="block font-bold mb-2">Unit</label>
                    <Dropdown
                        id="unit"
                        v-model="oeeConfig.metadata.unit"
                        :options="unitOptions"
                        optionLabel="label"
                        placeholder="Select Unit"
                        class="w-full"
                    />
                </div>
                <div class="field mb-3">
                    <label for="description" class="block font-bold mb-2">Description</label>
                    <InputText id="description" v-model="oeeConfig.metadata.description" class="w-full" />
                </div>
                <div class="field mt-4">
                    <label for="machineConnect" class="block font-bold mb-2">Machine Connect</label>
                    <ToggleSwitch id="machineConnect" v-model="oeeConfig.machineConnect" />
                    <span class="ml-2">{{ oeeConfig.machineConnect ? 'Enabled' : 'Disabled' }}</span>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveOeeConfig" />
            </template>
        </Dialog>

        <!-- Delete Single OEE Configuration Dialog -->
        <Dialog v-model:visible="deleteOeeConfigDialog" header="Confirm Deletion" modal>
            <p>
                Are you sure you want to delete the configuration <strong>{{ oeeConfig.alias }}</strong
                >?
            </p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSingleOeeConfig" />
            </template>
        </Dialog>

        <!-- Delete Multiple OEE Configurations Dialog -->
        <Dialog v-model:visible="deleteOeeConfigsDialog" header="Confirm Multiple Deletions" modal>
            <p>Are you sure you want to delete the selected configurations?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="closeDialog" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteSelectedOeeConfigs" />
            </template>
        </Dialog>
    </div>
</template>
