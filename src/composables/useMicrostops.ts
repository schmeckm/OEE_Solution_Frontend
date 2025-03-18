import { ref } from 'vue';
import MicrostopService from '@/service/MicrostopService';

// Hier kannst du auch deine `Microstop`-Interface importieren, falls benötigt.

export function useMicrostops() {
    // --- State ---
    const microstops = ref([]);
    const filteredMicrostops = ref([]);
    const groupedMicrostops = ref<Record<string, number>>({});
    const selectedMicrostops = ref([]);
    const microstopDialog = ref(false);
    const deleteMicrostopsDialog = ref(false);

    // Das einzelne "microstop" zum Bearbeiten
    const microstop = ref({
        microstop_ID: null,
        reason: '',
        start_date: null,
        end_date: null,
    });

    // --- Methoden ---
    const loadMicrostops = async (orderIdParam: number | null) => {
        if (!orderIdParam) {
            microstops.value = [];
            filteredMicrostops.value = [];
            groupedMicrostops.value = {};
            return;
        }
        try {
            const { microstops: processed } = await MicrostopService.loadAndProcessMicrostops(orderIdParam);
            microstops.value = processed || [];
            filterMicrostops();
        } catch (err: any) {
            console.error('Failed to load microstops:', err.message);
            microstops.value = [];
            filteredMicrostops.value = [];
            groupedMicrostops.value = {};
        }
    };

    const filterMicrostops = () => {
        // Dein Filter- und Gruppen-Logik aus PlantOEE.vue
        // ...
    };

    const saveMicrostop = async (showSuccess: (msg: string) => void) => {
        try {
            if (microstop.value.microstop_ID) {
                // Update
                await MicrostopService.updateMicrostop(microstop.value.microstop_ID, microstop.value);
                showSuccess('Microstop erfolgreich aktualisiert.');
                microstops.value = microstops.value.map((stop) =>
                    stop.microstop_ID === microstop.value.microstop_ID ? { ...microstop.value } : stop
                );
            } else {
                // Create
                const newMicrostop = await MicrostopService.createMicrostop(microstop.value);
                showSuccess('Microstop erfolgreich erstellt.');
                microstops.value.push(newMicrostop);
            }
            filterMicrostops();
            microstopDialog.value = false;
        } catch (err) {
            console.error('Error saving microstop:', err);
        }
    };

    // Und so weiter: deleteMicrostop, editMicrostop, etc.

    return {
        microstops,
        filteredMicrostops,
        groupedMicrostops,
        selectedMicrostops,
        microstop,
        microstopDialog,
        deleteMicrostopsDialog,
        loadMicrostops,
        filterMicrostops,
        saveMicrostop,
        // ... etc
    };
}
