<template>
    <div class="card bg-surface-0 text-surface-500 flex justify-between pt-6 h-full">
        <div>
            <div class="text-lg font-semibold">{{ title }}</div>
            <div class="text-4xl font-semibold">{{ value }}%</div>
        </div>
        <i :class="iconClass" class="text-3xl"></i>
    </div>
</template>

<script setup lang="ts">
defineProps({
    title: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    iconClass: {
        type: String,
        required: true,
    },
});
</script>
