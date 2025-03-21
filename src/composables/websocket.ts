import { Ref } from 'vue';

interface Machine {
    name: string;
    workcenter_id: number;
}

interface OEEDataMessage {
    type: string;
    data: {
        workcenter_id: number;
        availability: number;
        performance: number;
        quality: number;
        oee: number;
        order_id?: number;
        processordernumber?: string;
        materialnumber?: string;
    };
}

export const connectWebSocket = (
    onMessage: (msg: OEEDataMessage) => void,
    onError: (err: unknown) => void,
    onClose: (event: CloseEvent) => void,
    maxRetries = 5
): WebSocket => {
    let retries = 0;
    let socket: WebSocket;

    const connect = () => {
        socket = new WebSocket('wss://iotshowroom.de'); // Passe die URL an

        socket.onopen = () => {
            console.log('✅ WebSocket-Verbindung erfolgreich aufgebaut.');
            retries = 0;
        };

        socket.onmessage = (event) => {
            try {
                console.log('WebSocket message received:', event.data); // Debug-Log
                const message: OEEDataMessage = JSON.parse(event.data);
                onMessage(message);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        socket.onerror = (event) => {
            console.error('❌ WebSocket-Fehler:', event);
            console.error('Fehlerdetails:', event.target.url, event.target.readyState); // Debug-Log
            onError(event);
        };

        socket.onclose = (event) => {
            console.log(`⚠️ WebSocket-Verbindung geschlossen: ${event.reason || 'Keine Angabe'}`);
            console.log('Close Event Details:', event); // Debug-Log
            onClose(event);

            if (retries < maxRetries) {
                retries++;
                console.log(`🔄 Erneuter Verbindungsversuch (${retries}/${maxRetries})...`);
                setTimeout(connect, Math.min(1000 * retries, 5000)); // Bis zu 5 Sekunden warten
            } else {
                console.error('⛔ Maximale Anzahl von Wiederholungen erreicht.');
            }
        };
    };

    connect(); // Initialer Verbindungsversuch
    return socket;
};

export const handleWebSocketMessage = (
    msg: OEEDataMessage,
    selectedMachine: Ref<Machine | null>,
    availability: Ref<number>,
    performance: Ref<number>,
    quality: Ref<number>,
    oee: Ref<number>,
    updateCharts: () => void
) => {
    if (
        msg.type === 'OEEData' &&
        selectedMachine.value &&
        msg.data.workcenter_id === selectedMachine.value.workcenter_id
    ) {
        availability.value = parseFloat((msg.data.availability || 0).toFixed(2));
        performance.value = parseFloat((msg.data.performance || 0).toFixed(2));
        quality.value = parseFloat((msg.data.quality || 0).toFixed(2));
        oee.value = parseFloat((msg.data.oee || 0).toFixed(2));
        updateCharts();
    }
};

export const handleWebSocketError = (err: unknown) => {
    console.error('WebSocket error:', err);
    // Zeige eine Benachrichtigung an den Benutzer an
    toast.add({
        severity: 'error',
        summary: 'Verbindungsfehler',
        detail: 'Die Verbindung zum Server konnte nicht hergestellt werden.',
        life: 5000,
    });
};

export const handleWebSocketClose = (event: CloseEvent) => {
    console.warn('WebSocket closed:', event.reason);
};
