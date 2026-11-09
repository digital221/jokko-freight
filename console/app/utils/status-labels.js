/**
 * Labels for raw Jokko codes. Only unambiguous tokens are rewritten in the
 * page: snake_case codes and the English phrases the bourse engine produces
 * when a translation is missing (`exception_resolved` → "Exception resolved").
 * Common words such as "open" or "paid" are left untouched.
 */
const ENTRIES = [
    { codes: ['paid_out'], en: 'Paid out', fr: 'Versé' },
    { codes: ['settled'], en: 'Settled', fr: 'Réglé' },
    { codes: ['accept_price'], en: 'Accept price', fr: 'Acceptation du prix' },
    { codes: ['exception_resolved'], en: 'Exception resolved', fr: 'Exception résolue' },
    { codes: ['test_mode'], en: 'Test mode', fr: 'Mode test' },
    { codes: ['not_selected'], en: 'Not selected', fr: 'Non retenue' },
    { codes: ['in_transit'], en: 'In transit', fr: 'En transit' },
    { codes: ['awaiting_funds'], en: 'Awaiting funds', fr: 'En attente de fonds' },
    { codes: ['funding_declared'], en: 'Funding declared', fr: 'Paiement déclaré' },
    { codes: ['release_ready'], en: 'Release ready', fr: 'Prêt à verser' },
    { codes: ['partially_refunded'], en: 'Partially refunded', fr: 'Partiellement remboursé' },
    { codes: ['orange_money'], en: 'Orange Money', fr: 'Orange Money' },
    { codes: ['pending_review'], en: 'Pending review', fr: 'En vérification' },
    { codes: ['under_review'], en: 'Under review', fr: 'En examen' },
    { codes: ['reassign_requested'], en: 'Reassign requested', fr: 'Réaffectation demandée' },
    { codes: ['false_alarm'], en: 'False alarm', fr: 'Fausse alerte' },
    { codes: ['contacted_carrier'], en: 'Contacted carrier', fr: 'Transporteur contacté' },
    { codes: ['contacted_driver'], en: 'Contacted driver', fr: 'Chauffeur contacté' },
    { codes: ['contacted_shipper'], en: 'Contacted shipper', fr: 'Chargeur contacté' },
];

const LOOKUP = new Map();

for (const entry of ENTRIES) {
    for (const alias of [entry.codes, entry.en, entry.fr].flat()) {
        LOOKUP.set(alias, entry);
        LOOKUP.set(alias.toLowerCase(), entry);
    }
}

function isFrench(locale) {
    return String(locale || '')
        .toLowerCase()
        .startsWith('fr');
}

function textOf(entry, locale) {
    return isFrench(locale) ? entry.fr : entry.en;
}

/**
 * @param {string} code
 * @param {string} locale
 * @return {string|null}
 */
export function labelForCode(code, locale) {
    const entry = LOOKUP.get(code) || LOOKUP.get(String(code || '').toLowerCase());
    if (!entry) {
        return null;
    }

    return textOf(entry, locale);
}

/**
 * @param {string} text
 * @param {string} locale
 * @return {string|null}
 */
export function labelForVisibleText(text, locale) {
    const raw = String(text ?? '');
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 80 || (!LOOKUP.has(trimmed) && !LOOKUP.has(trimmed.toLowerCase()))) {
        return null;
    }

    const label = labelForCode(trimmed, locale);
    if (!label || label === trimmed) {
        return null;
    }

    const leading = raw.match(/^\s*/)?.[0] ?? '';
    const trailing = raw.match(/\s*$/)?.[0] ?? '';
    return `${leading}${label}${trailing}`;
}
