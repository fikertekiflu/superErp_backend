"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineTemplate = defineTemplate;
function defineTemplate(t) {
    return {
        entities: [],
        ...t,
        trigger: t.trigger ?? 'manual',
        industries: t.industries ?? ['other'],
    };
}
//# sourceMappingURL=template-builder.js.map