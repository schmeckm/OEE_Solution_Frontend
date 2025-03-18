import { ref } from 'vue';
import { DATE_CONFIG } from '@/service/config';

// 📊 Reaktive Zustände für Charts
const stackedChartData = ref<any>(null);
const stackedChartOptions = ref<any>(null);
const paretoData = ref<any>(null);
const paretoOptions = ref<any>(null);

// 🔄 Stapel-Balkendiagramm aktualisieren
const updateStackedChart = (data: any) => {
    if (!data?.labels || !data?.datasets) {
        stackedChartData.value = { labels: [], datasets: [] };
        return;
    }

    const styles = getComputedStyle(document.documentElement);
    const primaryColors = [
        styles.getPropertyValue('--p-primary-300').trim(),
        styles.getPropertyValue('--p-primary-400').trim(),
        styles.getPropertyValue('--p-primary-500').trim(),
    ];

    stackedChartData.value = {
        labels: data.labels.map((lbl: string) =>
            new Date(lbl).toLocaleString(DATE_CONFIG.locale as string | string[], {
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
            legend: { labels: { color: styles.getPropertyValue('--text-color').trim() } },
            tooltip: {
                callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} Einheiten` },
            },
            title: {
                display: true,
                text: 'Gestapeltes Diagramm',
                color: styles.getPropertyValue('--text-color').trim(),
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 },
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: styles.getPropertyValue('--text-color').trim() },
                grid: { color: styles.getPropertyValue('--surface-border').trim() },
            },
            y: {
                stacked: true,
                ticks: { color: styles.getPropertyValue('--text-color').trim() },
                grid: { color: styles.getPropertyValue('--surface-border').trim() },
            },
        },
    };
};

// 🔄 Pareto-Diagramm aktualisieren
const updateParetoChart = (groupedMicrostops: Record<string, number>, processOrderNumber: string) => {
    const styles = getComputedStyle(document.documentElement);
    const primaryColors = [
        styles.getPropertyValue('--p-primary-300').trim(),
        styles.getPropertyValue('--p-primary-400').trim(),
        styles.getPropertyValue('--p-primary-500').trim(),
    ];

    // 📊 Top 5 Microstops nach Dauer sortieren
    const sortedData = Object.entries(groupedMicrostops)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const labels = sortedData.map(([reason]) => reason);
    const values = sortedData.map(([, value]) => value);
    const total = values.reduce((acc, value) => acc + value, 0);

    // 🔢 Kumulative Prozentberechnung für die Pareto-Kurve
    const cumulativePercentages = values.reduce<number[]>((acc, value, index) => {
        acc.push((((acc[index - 1] || 0) + value) / total) * 100);
        return acc;
    }, []);

    // 📊 Diagramm-Daten setzen
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

    // 🎨 Diagramm-Optionen setzen
    paretoOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' },
            title: {
                display: true,
                text: 'Pareto-Diagramm',
                color: styles.getPropertyValue('--text-color').trim(),
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 10 },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${processOrderNumber}`,
                color: styles.getPropertyValue('--text-color').trim(),
                font: { size: 14, weight: 'normal' },
                padding: { top: 0, bottom: 20 },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e0e0e0' } },
            y1: {
                min: 0,
                max: 100,
                ticks: { callback: (val) => `${val}%` },
            },
        },
    };
};

// ✅ Export für `setup()`
export function useCharts() {
    return { stackedChartData, stackedChartOptions, paretoData, paretoOptions, updateStackedChart, updateParetoChart };
}
