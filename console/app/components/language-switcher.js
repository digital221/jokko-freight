import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { htmlLang, writePreferredLocale } from '@fleetbase/console/utils/preferred-locale';

export default class LanguageSwitcherComponent extends Component {
    @service intl;

    get current() {
        const [primary] = this.intl.locales || [];
        return primary || this.intl.primaryLocale || 'fr-fr';
    }

    @action choose(locale) {
        const next = writePreferredLocale(locale);
        this.intl.setLocale([next]);

        if (typeof document !== 'undefined') {
            document.documentElement.lang = htmlLang(next);
            document.dispatchEvent(new CustomEvent('jokko:locale', { detail: next }));
        }
    }
}
