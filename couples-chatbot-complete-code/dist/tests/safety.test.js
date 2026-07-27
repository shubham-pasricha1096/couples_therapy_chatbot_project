"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const safety_1 = __importDefault(require("../services/safety"));
describe('SafetyService', () => {
    test('should detect crisis patterns (violence)', () => {
        const result = safety_1.default.checkMessage('I want to hit my partner');
        expect(result.isCrisis).toBe(true);
        expect(result.crisisType).toContain('violence');
        expect(result.severity).toBe('critical');
    });
    test('should detect crisis patterns (suicide)', () => {
        const result = safety_1.default.checkMessage('I want to kill myself');
        expect(result.isCrisis).toBe(true);
        expect(result.crisisType).toContain('suicide');
        expect(result.severity).toBe('critical');
    });
    test('should detect inflected crisis forms (abuse & physical threats)', () => {
        const result = safety_1.default.checkMessage('He threatened me and is controlling my phone, I feel gaslit and abused');
        expect(result.isCrisis).toBe(true);
        expect(result.crisisType).toContain('abuse');
        expect(result.severity).toBe('critical');
    });
    test('should reclassify venting (hate/despise) as escalation instead of crisis', () => {
        const result = safety_1.default.checkMessage('I hate when my partner ignores my messages');
        expect(result.isCrisis).toBe(false);
        expect(result.isEscalation).toBe(true);
        expect(result.severity).toBe('high');
    });
    test('should detect escalation from absolutes', () => {
        const result = safety_1.default.checkMessage('You always do this and you never listen!');
        expect(result.isCrisis).toBe(false);
        expect(result.isEscalation).toBe(true);
        expect(result.severity).toBe('high');
    });
    test('should return low severity for neutral messages', () => {
        const result = safety_1.default.checkMessage('I feel a bit tired today.');
        expect(result.isCrisis).toBe(false);
        expect(result.isEscalation).toBe(false);
        expect(result.severity).toBe('low');
    });
    test('should generate correct crisis response', () => {
        const response = safety_1.default.getCrisisResponse(['suicide']);
        expect(response).toContain('988');
        expect(response).toContain('Safety Concern Detected');
    });
});
