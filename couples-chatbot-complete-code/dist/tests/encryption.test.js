"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("../utils/encryption");
describe('Encryption Utility', () => {
    test('should encrypt and decrypt a message correctly', () => {
        const originalText = 'Hello, this is a secret message!';
        const encryptedText = (0, encryption_1.encrypt)(originalText);
        expect(encryptedText).not.toBe(originalText);
        const decryptedText = (0, encryption_1.decrypt)(encryptedText);
        expect(decryptedText).toBe(originalText);
    });
    test('should return empty string when decrypting invalid cipher', () => {
        const decryptedText = (0, encryption_1.decrypt)('invalid-cipher');
        expect(decryptedText).toBe('');
    });
});
