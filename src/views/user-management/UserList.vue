<script setup>
import { CustomerService } from '@/service/CustomerService';
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const customers = ref([]);
const filterTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(async () => {
    try {
        customers.value = await CustomerService.getCustomersLarge();
    } catch (error) {
        console.error('Error fetching customer data:', error);
    }
});

function formatDate(value) {
    return new Date(value).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function navigateToCreateListPage() {
    router.push({ name: 'user-create' });
}

function navigateToEditPage(customerId) {
    router.push({ name: 'user-edit', params: { id: customerId } });
}

function navigateToDisplayPage(customerId) {
    router.push({ name: 'user-display', params: { id: customerId } });
}
</script>

<template>
    <div class="card">
        <DataTable
            :value="customers"
            paginator
            :rows="10"
            showCurrentPageReport
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['name', 'country.name', 'representative.name']"
            v-model:filters="filterTable"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <IconField class="w-full sm:w-80 order-1 sm:order-none">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="filterTable.global.value" placeholder="Global Search" class="w-full" />
                    </IconField>
                    <Button type="button" icon="pi pi-user-plus" label="Add New" class="w-full sm:w-auto order-none sm:order-1" outlined @click="navigateToCreateListPage" />
                </div>
            </template>
            <Column field="name" header="Name" sortable headerClass="whitespace-nowrap" :style="{ width: '20%' }">
                <template #body="{ data }">
                    {{ data.name }}
                </template>
            </Column>
            <Column field="country.name" header="Country" sortable headerClass="whitespace-nowrap" :style="{ width: '20%' }">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <img :alt="data.country.name" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="'w-8 mr-2 flag flag-' + data.country.code" />
                        <span>{{ data.country.name }}</span>
                    </div>
                </template>
            </Column>
            <Column field="date" header="Join Date" sortable headerClass="whitespace-nowrap" :style="{ width: '15%' }">
                <template #body="{ data }"> {{ formatDate(data.date) }} </template>
            </Column>
            <Column field="representative.name" header="Created By" headerClass="whitespace-nowrap" :style="{ width: '20%' }" sortable>
                <template #body="{ data }">
                    <div class="inline-flex items-center">
                        <img :alt="data.representative.name" :src="`/demo/images/avatar/${data.representative.image}`" class="w-8 mr-2" />
                        <span>{{ data.representative.name }}</span>
                    </div>
                </template>
            </Column>
            <Column field="activity" header="Activity" headerClass="whitespace-nowrap" :style="{ width: '15%' }" sortable>
                <template #body="{ data }">
                    <ProgressBar :value="data.activity" :showValue="false" :style="{ height: '.5rem' }" />
                </template>
            </Column>
            <!-- Actions Column with Display and Edit Buttons -->
            <Column header="Actions" :style="{ width: '10%' }">
                <template #body="{ data }">
                    <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="navigateToDisplayPage(data.id)" label="Display" />
                    <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="navigateToEditPage(data.id)" label="Edit" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
