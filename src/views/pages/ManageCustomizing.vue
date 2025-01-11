<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import EnvironmentService from '@/service/ManageCustomizing'; // Service für Environment API

const toast = useToast();
const environmentConfigs = ref([]); // Array für Schlüssel-Wert-Paare

// Daten beim Laden abrufen
onMounted(async () => {
    await fetchEnvironmentConfigs();
});

// Environment-Konfigurationen abrufen
async function fetchEnvironmentConfigs() {
    try {
        const response = await EnvironmentService.getEnvironmentConfigs();
        // Antwort als Array von Objekten umstrukturieren
        environmentConfigs.value = Object.entries(response).map(([key, value]) => ({ key, value }));
        console.log('Fetched Environment Configurations:', environmentConfigs.value);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
}
</script>

<template>
    <div>
        <div class="card">
            <h4 class="m-0 mb-4">Environment Configurations</h4>

            <!-- Tabelle für Environment Configurations -->
            <DataTable :value="environmentConfigs" :paginator="true" :rows="10" dataKey="key">
                <template #header>
                    <h4 class="m-0">Environment Configurations</h4>
                </template>
                <Column field="key" header="Key" sortable></Column>
                <Column field="value" header="Value" sortable></Column>
            </DataTable>
        </div>
    </div>
</template>
