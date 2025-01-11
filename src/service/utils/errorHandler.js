export function handleAxiosError(error, customMessage) {
    const status = error.response?.status || 'Unknown';
    const message = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`${customMessage} (Status: ${status}): ${message}`);
    throw new Error(`${customMessage}. Details: ${message}`);
}
