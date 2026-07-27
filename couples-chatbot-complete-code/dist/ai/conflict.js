"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectConflict = detectConflict;
function detectConflict(message) {
    const text = message.toLowerCase();
    if (text.includes('always') && text.includes('you'))
        return 'medium';
    if (text.includes('never') && text.includes('you'))
        return 'medium';
    if (text.includes('hate'))
        return 'high';
    return 'low';
}
exports.default = detectConflict;
