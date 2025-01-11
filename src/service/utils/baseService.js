import createAxiosInstance from './axiosInstance';
import { validateEnvVar } from './envValidator';

const BASE_URL = validateEnvVar(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL').replace(/\/$/, '');
const API_KEY = validateEnvVar(import.meta.env.VITE_API_KEY, 'VITE_API_KEY');
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

export const axiosInstance = createAxiosInstance(BASE_URL, API_KEY, TIMEOUT);
