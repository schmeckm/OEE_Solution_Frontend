import { ref, watch } from 'vue';

export function useParetoChart(groupedMicrostops: any) {
    const paretoData = ref<any>(null);
    const paretoOptions = ref<any>(null);

    // Whenever groupedMicrostops changes, recalculate chart
    watch(
        groupedMicrostops,
        (newVal) => {
            updateParetoChart(newVal);
        },
        { deep: true }
    );

    const updateParetoChart = (grouped: Record<string, number>) => {
        if (!grouped || Object.keys(grouped).length === 0) {
            paretoData.value = { labels: [], datasets: [] };
            return;
        }
        // Sort, compute cumulative, etc.
        const sortedData = Object.entries(grouped)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        const labels = sortedData.map(([reason]) => reason);
        const values = sortedData.map(([, val]) => val);
        const total = values.reduce((acc, v) => acc + v, 0);

        const cumulativePercentages = values.reduce<number[]>((acc, val) => {
            const sum = (acc[acc.length - 1] || 0) + val;
            acc.push((sum / total) * 100);
            return acc;
        }, []);

        paretoData.value = {
            labels,
            datasets: [
                {
                    label: 'Microstops',
                    data: values,
                    // ...
                },
                {
                    label: 'Cumulative %',
                    data: cumulativePercentages,
                    type: 'line',
                    // ...
                },
            ],
        };

        paretoOptions.value = {
            // ...
        };
    };

    return {
        paretoData,
        paretoOptions,
        updateParetoChart,
    };
}
