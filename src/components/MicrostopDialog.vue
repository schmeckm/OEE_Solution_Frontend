<template>
    <Dialog
        :visible="visible"
        @update:visible="$emit('update:visible', $event)"
        :header="microstop.microstop_ID ? 'Edit Microstop' : 'New Microstop'"
        :style="{ width: '40vw' }"
        modal
        @hide="closeDialog"
    >
        <div>
            <div>
                <label for="reason">Reason</label>
                <Select
                    id="reason"
                    v-model="microstop.reason"
                    :options="reasonCodes"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Reason"
                    class="w-full"
                />
            </div>
            <div>
                <label for="start_date">Start Date</label>
                <DatePicker id="start_date" v-model="microstop.start_date" show-time />
            </div>
            <div>
                <label for="end_date">End Date</label>
                <Calendar id="end_date" v-model="microstop.end_date" show-time />
            </div>
            <div>
                <label for="differenz">Differenz</label>
                <InputNumber
                    id="differenz"
                    v-model="microstop.differenz"
                    mode="decimal"
                    placeholder="Enter Differenz"
                    class="w-full"
                />
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" @click="closeDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveMicrostop" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    microstop: {
        type: Object,
        required: true,
    },
    reasonCodes: {
        type: Array,
        required: true,
    },
    visible: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(['update:visible', 'close', 'save']);

const closeDialog = () => {
    emit('close');
};

const saveMicrostop = () => {
    emit('save', props.microstop);
};
</script>
