// chartHelpers.ts
import { ref, Ref } from 'vue';

// Hilfsfunktion, um CSS-Variablen zu extrahieren
const getChartStyles = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
        primaryColors: [
            styles.getPropertyValue('--p-primary-300').trim(),
            styles.getPropertyValue('--p-primary-400').trim(),
            styles.getPropertyValue('--p-primary-500').trim(),
        ],
        textColor: styles.getPropertyValue('--text-color').trim(),
        surfaceBorder: styles.getPropertyValue('--surface-border').trim(),
    };
};

// OEE-Chart aktualisieren
export const updateCharts = (
    availability: Ref<number>,
    performance: Ref<number>,
    quality: Ref<number>,
    chartData: Ref<any>,
    chartOptions: Ref<any>
) => {
    const { primaryColors, textColor, surfaceBorder } = getChartStyles();

    chartData.value = {
        labels: ['Availability', 'Performance', 'Quality'],
        datasets: [
            {
                label: 'OEE Metrics',
                data: [availability.value, performance.value, quality.value],
                backgroundColor: primaryColors,
                borderRadius: 6,
            },
        ],
    };

    chartOptions.value = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: textColor },
            },
        },
        scales: {
            x: {
                ticks: { color: textColor },
                grid: { color: surfaceBorder },
            },
            y: {
                ticks: { color: textColor },
                grid: { color: surfaceBorder },
            },
        },
    };
};

// Stacked-Chart aktualisieren
export const updateStackedChart = (
    data: any,
    stackedChartData: Ref<any>,
    stackedChartOptions: Ref<any>,
    DATE_CONFIG: any
) => {
    if (!data?.labels || !data?.datasets) {
        stackedChartData.value = { labels: [], datasets: [] };
        return;
    }

    const { primaryColors, textColor, surfaceBorder } = getChartStyles();

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
            legend: {
                labels: { color: textColor },
            },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw} Einheiten`,
                },
            },
            title: {
                display: true,
                text: 'Gestapeltes Diagramm',
                color: textColor,
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: { top: 10, bottom: 10 },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${
                    data.processordernumber || data.processOrder?.processordernumber || 'Nicht verfügbar'
                }`,
                color: textColor,
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: { top: 0, bottom: 20 },
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: textColor },
                grid: { color: surfaceBorder },
            },
            y: {
                stacked: true,
                ticks: { color: textColor },
                grid: { color: surfaceBorder },
            },
        },
    };
};

// Pareto-Chart aktualisieren
export const updateParetoChart = (
    groupedMicrostops: Ref<Record<string, number>>,
    paretoData: Ref<any>,
    paretoOptions: Ref<any>,
    processOrderNumber: Ref<string>
) => {
    const { primaryColors, textColor } = getChartStyles();

    const sortedData = Object.entries(groupedMicrostops.value)
        .sort(([, valA], [, valB]) => valB - valA)
        .slice(0, 5);

    const labels = sortedData.map(([reason]) => reason);
    const values = sortedData.map(([, v]) => v);
    const total = values.reduce((acc, v) => acc + v, 0);

    // Kumulative %-Daten
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
                color: textColor,
                font: {
                    size: 18,
                    weight: 'bold',
                },
                padding: { top: 10, bottom: 10 },
            },
            subtitle: {
                display: true,
                text: `Order Number: ${processOrderNumber.value}`,
                color: textColor,
                font: {
                    size: 14,
                    weight: 'normal',
                },
                padding: { top: 0, bottom: 20 },
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e0e0e0' } },
            y1: {
                min: 0,
                max: 100,
                ticks: {
                    callback: (val: number) => `${val}%`,
                },
            },
        },
    };
};
