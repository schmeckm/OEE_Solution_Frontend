import { ref, onMounted, onUnmounted } from 'vue';

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

export function useWebSocketOEE(onOEEDataReceived: (msg: OEEDataMessage) => void) {
    let socket: WebSocket | null = null;

    const connectWebSocket = () => {
        // e.g. wss://your-endpoint
        socket = new WebSocket('ws://your-websocket-endpoint');

        socket.onopen = () => {
            console.log('WebSocket connected');
        };
        socket.onmessage = (event) => {
            const msg: OEEDataMessage = JSON.parse(event.data);
            onOEEDataReceived(msg);
        };
        socket.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
        socket.onclose = (event) => {
            console.warn('WebSocket closed:', event.reason);
            // Optionally: reconnect or handle logic
        };
    };

    const closeWebSocket = () => {
        socket?.close();
    };

    onMounted(() => {
        connectWebSocket();
    });
    onUnmounted(() => {
        closeWebSocket();
    });

    return {
        connectWebSocket,
        closeWebSocket,
    };
}
