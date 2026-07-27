"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEmotion = detectEmotion;
function detectEmotion(message) {
    const text = message.toLowerCase();
    if (text.includes('angry') || text.includes('mad'))
        return 'anger';
    if (text.includes('sad') || text.includes('hurt'))
        return 'sadness';
    if (text.includes('frustrated'))
        return 'frustration';
    if (text.includes('worried') || text.includes('anxious'))
        return 'anxiety';
    return 'neutral';
}
exports.default = detectEmotion;
