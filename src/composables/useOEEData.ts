import { ref } from 'vue';
import { fetchPrepareOEEData } from '@/service/LineOEEService';

interface OEEData {
    availability: number;
    performance: number;
    quality: number;
    oee: number;
    processOrderNumber?: string;
    materialNumber?: string;
    orderId?: number;
}

const availability = ref<number>(0);
const performance = ref<number>(0);
const quality = ref<number>(0);
const oee = ref<number>(0);
const processOrderNumber = ref<string>('N/A');
const materialNumber = ref<string>('N/A');
const orderId = ref<number | null>(null);

const stackedChartData = ref<any>(null); // ✅ Stacked Chart Daten
const stackedChartOptions = ref<any>(null); // ✅ Stacked Chart Optionen

/**
 * Lädt die OEE-Daten für eine bestimmte Maschine basierend auf der workcenter_id
 * @param {number} machineId - Die ID des Workcenters
 */
const loadOEEData = async (machineId: number) => {
    if (!machineId) return;

    try {
        const data = await fetchPrepareOEEData(machineId);
        if (!data) {
            console.warn('Keine gültigen OEE-Daten erhalten.');
            return;
        }

        availability.value = parseFloat((data.availability || 0).toFixed(2));
        performance.value = parseFloat((data.performance || 0).toFixed(2));
        quality.value = parseFloat((data.quality || 0).toFixed(2));
        oee.value = parseFloat((data.oee || 0).toFixed(2));

        processOrderNumber.value = data.processOrder?.ProcessOrderNumber || 'N/A';
        materialNumber.value = data.processOrder?.MaterialNumber || 'N/A';
        orderId.value = data.processOrder?.order_id || null;

        // ✅ Stacked Chart aktualisieren
        updateStackedChart(data);
    } catch (error) {
        console.error('Fehler beim Laden der OEE-Daten:', error);
    }
};

/**
 * Aktualisiert die Daten für das gestapelte Diagramm
 */
const updateStackedChart = (data: any) => {
    if (!data?.labels || !data?.datasets) {
        console.warn('⚠️ Kein gültiges Datenformat für das Stacked Chart!');
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
            new Date(lbl).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })
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
        },
        scales: {
            x: { stacked: true, ticks: { color: styles.getPropertyValue('--text-color').trim() } },
            y: { stacked: true, ticks: { color: styles.getPropertyValue('--text-color').trim() } },
        },
    };

    console.log('📊 Stacked Chart aktualisiert mit:', stackedChartData.value);
};

export function useOEEData() {
    return {
        availability,
        performance,
        quality,
        oee,
        processOrderNumber,
        materialNumber,
        orderId,
        stackedChartData, // ✅ Stacked Chart hinzufügen
        stackedChartOptions, // ✅ Stacked Chart Optionen hinzufügen
        loadOEEData,
    };
}
