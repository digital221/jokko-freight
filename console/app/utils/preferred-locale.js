const STORAGE_KEY = 'jokko.locale';
const DEFAULT_LOCALE = 'fr-fr';

/**
 * Normalise a stored choice. The browser language is never consulted:
 * Jokko stays French until the person picks English.
 *
 * @param {string} value
 * @return {string|null}
 */
export function normalizeLocale(value) {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/_/g, '-');

    if (normalized === 'en' || normalized === 'en-us' || normalized === 'en-gb') {
        return 'en-us';
    }

    if (normalized === 'fr' || normalized === 'fr-fr' || normalized === 'fr-sn') {
        return 'fr-fr';
    }

    return null;
}

/**
 * @param {Storage} [storage]
 * @return {string}
 */
export function readPreferredLocale(storage = globalThis.localStorage) {
    try {
        return normalizeLocale(storage?.getItem(STORAGE_KEY)) || DEFAULT_LOCALE;
    } catch {
        return DEFAULT_LOCALE;
    }
}

/**
 * @param {string} locale
 * @param {Storage} [storage]
 * @return {string}
 */
export function writePreferredLocale(locale, storage = globalThis.localStorage) {
    const normalized = normalizeLocale(locale) || DEFAULT_LOCALE;

    try {
        storage?.setItem(STORAGE_KEY, normalized);
    } catch {
        // Private mode can reject storage; the in-memory intl locale still changes.
    }

    return normalized;
}

/**
 * @param {string} locale
 * @return {string}
 */
export function htmlLang(locale) {
    return normalizeLocale(locale) === 'en-us' ? 'en' : 'fr';
}

export { DEFAULT_LOCALE, STORAGE_KEY };
