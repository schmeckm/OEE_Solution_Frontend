import { ref } from 'vue';
import MicrostopService from '@/service/MicrostopService';

export function useMicrostops(orderId) {
    const microstops = ref([]);
    const filteredMicrostops = ref([]);
    const groupedMicrostops = ref({});
    const microstopDialog = ref(false);

    const loadMicrostops = async (orderIdValue) => {
        if (!orderIdValue) {
            microstops.value = [];
            filteredMicrostops.value = [];
            groupedMicrostops.value = {};
            return;
        }

        try {
            const response = await MicrostopService.fetchMicrostops(orderIdValue);
            microstops.value = response || [];
            filterMicrostops();
        } catch (error) {
            console.error('Fehler beim Laden der Microstops:', error);
        }
    };

    const saveMicrostop = async (microstop) => {
        try {
            if (microstop.microstop_ID) {
                // Update
                await MicrostopService.updateMicrostop(microstop.microstop_ID, microstop);
                microstops.value = microstops.value.map((stop) =>
                    stop.microstop_ID === microstop.microstop_ID ? { ...microstop } : stop
                );
            } else {
                // Create
                const newMicrostop = await MicrostopService.createMicrostop(microstop);
                microstops.value.push(newMicrostop);
            }
            filterMicrostops();
            microstopDialog.value = false;
        } catch (err) {
            console.error('Fehler beim Speichern des Microstops:', err);
        }
    };

    const filterMicrostops = () => {
        filteredMicrostops.value = microstops.value.filter((m) => m.order_id === orderId.value);
        groupedMicrostops.value = filteredMicrostops.value.reduce((acc, m) => {
            acc[m.reason] = (acc[m.reason] || 0) + (m.differenz || m.duration || 0);
            return acc;
        }, {});
    };

    return {
        microstops,
        filteredMicrostops,
        groupedMicrostops,
        microstopDialog,
        loadMicrostops,
        saveMicrostop,
    };
}
