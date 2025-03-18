<template>
    <div class="card h-full">
        <Chart type="bar" :data="paretoData" :options="paretoOptions" class="w-full h-full" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps({
    groupedMicrostops: {
        type: Object,
        required: true,
    },
    processOrderNumber: {
        type: String,
        required: true,
    },
});

const paretoData = ref<any>(null);
const paretoOptions = ref<any>(null);

const updateParetoChart = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColors = [
        documentStyle.getPropertyValue('--p-primary-300').trim(),
        documentStyle.getPropertyValue('--p-primary-400').trim(),
        documentStyle.getPropertyValue('--p-primary-500').trim(),
    ];

    const sortedData = Object.entries(props.groupedMicrostops)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const labels = sortedData.map(([reason]) => reason);
    const values = sortedData.map(([, value]) => value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const cumulativePercentages = values.reduce<number[]>((acc, val) => {
        const cumulativeSum = (acc.slice(-1)[0] || 0) + val;
        acc.push((cumulativeSum / total) * 100);
        return acc;
    }, []);

    paretoData.value = {
        labels,
        datasets: [
            {
                label: 'Microstops',
                data: values,
                backgroundColor: primaryColors.slice(0, values.length),
                yAxisID: 'y',
            },
            {
                label: 'Cumulative %',
                data: cumulativePercentages,
                type: 'line',
                borderColor: '#FF0000',
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                yAxisID: 'y1',
            },
        ],
    };

    paretoOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' },
            title: {
                display: true,
                text: 'Pareto-Diagramm',
                color: documentStyle.getPropertyValue('--text-color').trim(),
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: {
                    top: 10,
                    bottom: 10,
                },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${props.processOrderNumber}`,
                color: documentStyle.getPropertyValue('--text-color').trim(),
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: {
                    top: 0,
                    bottom: 20,
                },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e0e0e0' } },
            y1: { min: 0, max: 100, ticks: { callback: (value: number) => `${value}%` } },
        },
    };
};

watch(() => props.groupedMicrostops, updateParetoChart, { immediate: true });
</script>
