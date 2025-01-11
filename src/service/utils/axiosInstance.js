import axios from 'axios';

function createAxiosInstance(baseURL, apiKey, timeout = 10000) {
    return axios.create({
        baseURL,
        headers: {
            'x-api-key': apiKey,
            accept: 'application/json',
        },
        timeout,
    });
}

export default createAxiosInstance;
