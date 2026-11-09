import { warn } from '@ember/debug';
import { isEmpty } from '@ember/utils';
import { labelForCode } from '../status-labels';

/**
 * ember-intl calls this when a key is absent. Known Jokko codes used as the
 * last segment of `bourse.labels.*` become a French or English label.
 * Anything else keeps the library warning so real omissions stay visible.
 *
 * @param {string} key
 * @param {string[]} locales
 * @return {string}
 */
export default function missingMessage(key, locales) {
    const localeNames = Array.isArray(locales) ? locales : [locales];
    const locale = localeNames[0];
    const code = String(key || '').split('.').pop();
    const jokkoKey = String(key || '').startsWith('bourse.');
    const label = jokkoKey ? labelForCode(code, locale) : null;

    if (label) {
        return label;
    }

    if (isEmpty(localeNames)) {
        return `No locale defined.  Unable to resolve translation: "${key}"`;
    }

    const joined = localeNames.join(', ');
    warn(`[ember-intl] translation: "${key}" on locale: "${joined}" was not found.`, false, {
        id: 'ember-intl-missing-translation',
    });

    return `Missing translation "${key}" for locale "${joined}"`;
}
