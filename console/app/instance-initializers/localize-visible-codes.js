import { labelForVisibleText } from '@fleetbase/console/utils/status-labels';
import { readPreferredLocale } from '@fleetbase/console/utils/preferred-locale';

const SKIPPED = new Set(['INPUT', 'TEXTAREA', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);

function activeLocale(owner) {
    const intl = owner.lookup('service:intl');
    const [primary] = intl?.locales || [];
    return primary || intl?.primaryLocale || readPreferredLocale();
}

function parentAllowsRewrite(node) {
    const parent = node.parentElement;
    if (!parent || SKIPPED.has(parent.tagName)) {
        return false;
    }

    if (parent.closest('input, textarea, select, [contenteditable="true"]')) {
        return false;
    }

    return true;
}

function rewriteTree(root, locale) {
    if (!root) {
        return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
        if (parentAllowsRewrite(node)) {
            const next = labelForVisibleText(node.nodeValue, locale);
            if (next !== null) {
                node.nodeValue = next;
            }
        }
        node = walker.nextNode();
    }
}

export function initialize(owner) {
    if (typeof document === 'undefined' || !document.body) {
        return;
    }

    const apply = () => rewriteTree(document.body, activeLocale(owner));
    const observer = new MutationObserver((records) => {
        const locale = activeLocale(owner);
        records.forEach((record) => {
            if (record.type === 'characterData' && record.target.nodeType === Node.TEXT_NODE) {
                const next = parentAllowsRewrite(record.target) ? labelForVisibleText(record.target.nodeValue, locale) : null;
                if (next !== null) {
                    record.target.nodeValue = next;
                }
                return;
            }

            record.addedNodes.forEach((added) => {
                if (added.nodeType === Node.TEXT_NODE && parentAllowsRewrite(added)) {
                    const next = labelForVisibleText(added.nodeValue, locale);
                    if (next !== null) {
                        added.nodeValue = next;
                    }
                } else if (added.nodeType === Node.ELEMENT_NODE) {
                    rewriteTree(added, locale);
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener('jokko:locale', apply);
    apply();
}

export default {
    name: 'localize-visible-codes',
    initialize,
};
