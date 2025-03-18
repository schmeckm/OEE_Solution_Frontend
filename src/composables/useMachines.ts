import { ref, watch } from 'vue';
import { fetchMachines } from '@/service/LineOEEService';

export function useMachines() {
    const machineOptions = ref([]);
    const selectedMachine = ref(null);

    const loadMachines = async () => {
        try {
            const machines = await fetchMachines();
            machineOptions.value = machines
                .filter((m) => m.OEE)
                .map((m) => ({
                    name: m.name,
                    workcenter_id: m.workcenter_id,
                }));
        } catch (err: any) {
            console.error('Failed to load machines:', err.message);
        }
    };

    // Example: store / retrieve the selected machine from session storage
    const loadSelectedMachineFromSession = () => {
        const stored = sessionStorage.getItem('selectedMachine');
        if (stored) {
            selectedMachine.value = JSON.parse(stored);
        }
    };

    watch(selectedMachine, (machine) => {
        if (machine) {
            sessionStorage.setItem('selectedMachine', JSON.stringify(machine));
        }
    });

    return {
        machineOptions,
        selectedMachine,
        loadMachines,
        loadSelectedMachineFromSession,
    };
}
