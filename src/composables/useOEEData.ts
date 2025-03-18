import { ref } from 'vue';
import { fetchPrepareOEEData } from '@/service/LineOEEService';

export function useOEEData() {
    // States
    const availability = ref(0);
    const performance = ref(0);
    const quality = ref(0);
    const oee = ref(0);

    const processOrderNumber = ref<string>('N/A');
    const materialNumber = ref<string>('N/A');
    const orderId = ref<number | null>(null);

    // Methoden
    const loadPrepareOEEData = async (machineId: number) => {
        try {
            const data = await fetchPrepareOEEData(machineId);
            if (!data || !data.labels || !Array.isArray(data.datasets)) {
                console.warn('Invalid prepare OEE data:', data);
                return;
            }
            processOrderNumber.value = data.processOrder?.ProcessOrderNumber || 'N/A';
            materialNumber.value = data.processOrder?.MaterialNumber || 'N/A';
            orderId.value = data.processOrder?.order_id || null;
            // ... update charts, etc.
        } catch (err: any) {
            console.error('Failed to load OEE data:', err.message);
        }
    };

    return {
        availability,
        performance,
        quality,
        oee,
        processOrderNumber,
        materialNumber,
        orderId,
        loadPrepareOEEData,
    };
}
