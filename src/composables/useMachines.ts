import { ref, watch, onMounted } from 'vue';
import { fetchMachines } from '@/service/LineOEEService';

interface Machine {
    name: string;
    workcenter_id: number;
}

const machineOptions = ref<Machine[]>([]);
const selectedMachine = ref<Machine | null>(null);

/**
 * Lädt Maschinen aus der API und speichert sie in machineOptions.
 */
const loadMachines = async () => {
    try {
        const machines = await fetchMachines();
        machineOptions.value = machines.map((m) => ({
            name: m.name,
            workcenter_id: m.workcenter_id,
        }));
    } catch (error) {
        console.error('Error loading machines:', error);
    }
};

/**
 * Lädt die zuletzt ausgewählte Maschine aus sessionStorage
 */
const loadSelectedMachineFromSession = (): Machine | null => {
    const storedMachine = sessionStorage.getItem('selectedMachine');
    return storedMachine ? JSON.parse(storedMachine) : null;
};

/**
 * Speichert die ausgewählte Maschine in sessionStorage.
 */
const saveSelectedMachineToSession = (machine: Machine | null) => {
    if (machine) {
        sessionStorage.setItem('selectedMachine', JSON.stringify(machine));
    } else {
        sessionStorage.removeItem('selectedMachine');
    }
};

// Lädt Maschinen beim Mounten
onMounted(() => {
    loadMachines();
    const storedMachine = loadSelectedMachineFromSession();
    if (storedMachine) selectedMachine.value = storedMachine;
});

// Beobachtet die Änderungen an der ausgewählten Maschine und speichert sie in sessionStorage
watch(selectedMachine, (newMachine) => {
    saveSelectedMachineToSession(newMachine);
});

export function useMachines() {
    return {
        machineOptions,
        selectedMachine,
        loadMachines,
    };
}
