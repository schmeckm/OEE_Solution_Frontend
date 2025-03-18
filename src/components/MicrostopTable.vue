<template>
    <DataTable
        :selection="selectedMicrostops"
        @update:selection="$emit('update:selectedMicrostops', $event)"
        :value="filteredMicrostops"
        data-key="microstop_ID"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        current-page-report-template="Showing {first} to {last} of {totalRecords} microstops"
    >
        <template #header>
            <h4 class="m-0">Manage Microstops</h4>
        </template>
        <Column selection-mode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="microstop_ID" header="Microstop ID" sortable filter filterPlaceholder="Search by ID"></Column>
        <Column field="order_id" header="Order ID" sortable filter filterPlaceholder="Search by Order ID"></Column>
        <Column
            field="start_date"
            header="Start Time"
            sortable
            filter
            filterPlaceholder="Search by Start Time"
        ></Column>
        <Column field="end_date" header="End Time" sortable filter filterPlaceholder="Search by End Time"></Column>
        <Column field="reason" header="Reason" sortable filter filterPlaceholder="Search by Reason"></Column>
        <Column field="differenz" header="Duration" sortable filter filterPlaceholder="Search by Duration"></Column>
        <Column :exportable="false">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editMicrostop(slotProps.data)" />
                <Button
                    icon="pi pi-trash"
                    outlined
                    rounded
                    severity="danger"
                    @click="confirmDeleteMicrostop(slotProps.data)"
                />
            </template>
        </Column>
    </DataTable>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    filteredMicrostops: {
        type: Array,
        required: true,
    },
    selectedMicrostops: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits(['update:selectedMicrostops', 'edit', 'delete']);

const editMicrostop = (data: any) => {
    emit('edit', data);
};

const confirmDeleteMicrostop = (data: any) => {
    emit('delete', data);
};
</script>
