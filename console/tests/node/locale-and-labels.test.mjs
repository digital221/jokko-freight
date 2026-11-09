import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function load(path, names) {
    const source = readFileSync(path, 'utf8')
        .replace(/export function /g, 'function ')
        .replace(/export \{[^}]+\};?/g, '');
    const sandbox = { result: null };
    vm.runInNewContext(`${source}\nresult = { ${names.join(', ')} };`, sandbox, { filename: String(path) });
    return sandbox.result;
}

const locale = load(new URL('../../app/utils/preferred-locale.js', import.meta.url), ['normalizeLocale', 'readPreferredLocale', 'writePreferredLocale', 'htmlLang']);
const labels = load(new URL('../../app/utils/status-labels.js', import.meta.url), ['labelForCode', 'labelForVisibleText']);

const memory = () => {
    const data = new Map();
    return {
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
    };
};

assert.equal(locale.normalizeLocale('fr-SN'), 'fr-fr');
assert.equal(locale.normalizeLocale('en-GB'), 'en-us');
assert.equal(locale.normalizeLocale('wo'), null);
assert.equal(locale.readPreferredLocale(memory()), 'fr-fr');

const storage = memory();
storage.setItem('jokko.locale', 'en-us');
assert.equal(locale.readPreferredLocale(storage), 'en-us');
assert.equal(locale.writePreferredLocale('fr', storage), 'fr-fr');
assert.equal(locale.readPreferredLocale(storage), 'fr-fr');
assert.equal(locale.htmlLang('fr-fr'), 'fr');
assert.equal(locale.htmlLang('en-us'), 'en');

assert.equal(labels.labelForCode('paid_out', 'fr-fr'), 'Versé');
assert.equal(labels.labelForCode('accept_price', 'fr-fr'), 'Acceptation du prix');
assert.equal(labels.labelForCode('exception_resolved', 'en-us'), 'Exception resolved');
assert.equal(labels.labelForCode('not_selected', 'fr-fr'), 'Non retenue');
assert.equal(labels.labelForCode('open', 'fr-fr'), null);
assert.equal(labels.labelForVisibleText('  test_mode ', 'fr-fr'), '  Mode test ');
assert.equal(labels.labelForVisibleText('Exception resolved', 'fr-fr'), 'Exception résolue');
assert.equal(labels.labelForVisibleText('Refusée', 'fr-fr'), null);
assert.equal(labels.labelForVisibleText('The paid_out freight', 'fr-fr'), null);

console.log('locale-and-labels: ok');
