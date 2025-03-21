import { ref } from 'vue';
import { DATE_CONFIG } from '@/service/config';

export function useCharts() {
    const chartData = ref<any>(null);
    const chartOptions = ref<any>(null);

    const stackedChartData = ref<any>(null);
    const stackedChartOptions = ref<any>(null);

    const paretoData = ref<any>(null);
    const paretoOptions = ref<any>(null);

    const updateOEEChart = (availability: number, performance: number, quality: number) => {
        const styles = getComputedStyle(document.documentElement);
        chartData.value = {
            labels: ['Availability', 'Performance', 'Quality'],
            datasets: [
                {
                    label: 'OEE Metrics',
                    data: [availability, performance, quality],
                    backgroundColor: [
                        styles.getPropertyValue('--p-primary-300').trim(),
                        styles.getPropertyValue('--p-primary-400').trim(),
                        styles.getPropertyValue('--p-primary-500').trim(),
                    ],
                    borderRadius: 6,
                },
            ],
        };
        chartOptions.value = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: styles.getPropertyValue('--text-color').trim() },
                },
            },
        };
    };

    const updateStackedChart = (data: any, processOrderNumber: string) => {
        const styles = getComputedStyle(document.documentElement);
        const primaryColors = [
            styles.getPropertyValue('--p-primary-300').trim(),
            styles.getPropertyValue('--p-primary-400').trim(),
            styles.getPropertyValue('--p-primary-500').trim(),
        ];

        stackedChartData.value = {
            labels: data.labels.map((lbl: string) =>
                new Date(lbl).toLocaleString(DATE_CONFIG.locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                })
            ),
            datasets: data.datasets.map((ds: any, i: number) => ({
                ...ds,
                backgroundColor: primaryColors[i % primaryColors.length],
            })),
        };

        stackedChartOptions.value = {
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gestapeltes Diagramm',
                    color: styles.getPropertyValue('--text-color').trim(),
                },
                subtitle: {
                    display: true,
                    text: `Order Number: ${processOrderNumber}`,
                    color: styles.getPropertyValue('--text-color').trim(),
                },
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true },
            },
        };
    };

    const updateParetoChart = (groupedMicrostops: Record<string, number>, processOrderNumber: string) => {
        const styles = getComputedStyle(document.documentElement);
        const sortedData = Object.entries(groupedMicrostops)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        const labels = sortedData.map(([reason]) => reason);
        const values = sortedData.map(([, val]) => val);
        const total = values.reduce((acc, val) => acc + val, 0);
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
                    backgroundColor: styles.getPropertyValue('--p-primary-400').trim(),
                    yAxisID: 'y',
                },
                {
                    label: 'Cumulative %',
                    data: cumulativePercentages,
                    type: 'line',
                    borderColor: '#FF0000',
                    yAxisID: 'y1',
                },
            ],
        };

        paretoOptions.value = {
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Pareto-Diagramm',
                    color: styles.getPropertyValue('--text-color').trim(),
                },
                subtitle: {
                    display: true,
                    text: `Order Number: ${processOrderNumber}`,
                    color: styles.getPropertyValue('--text-color').trim(),
                },
            },
            scales: {
                y1: {
                    min: 0,
                    max: 100,
                    ticks: { callback: (val: number) => `${val}%` },
                },
            },
        };
    };

    return {
        chartData,
        chartOptions,
        stackedChartData,
        stackedChartOptions,
        paretoData,
        paretoOptions,
        updateOEEChart,
        updateStackedChart,
        updateParetoChart,
    };
}
