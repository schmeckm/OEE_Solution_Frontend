// utils/dateUtils.js
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const dateFormat = import.meta.env.VITE_DATE_FORMAT || 'dd.MM.yyyy, HH:mm';
const locale = import.meta.env.VITE_DATE_LOCALE || de;

/**
 * Formatieren eines Datums zur Anzeige
 */
export function formatDisplayDate(date) {
    if (!date) return '';
    return format(new Date(date), dateFormat, { locale });
}

/**
 * Konvertieren eines Datums ins API-Format
 */
export function toAPIDate(date) {
    if (!date) return null;
    return new Date(date).toISOString();
}
