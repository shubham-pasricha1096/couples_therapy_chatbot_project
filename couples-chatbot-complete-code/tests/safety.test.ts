import safetyService from '../services/safety';

describe('SafetyService', () => {
  test('should detect crisis patterns (violence)', () => {
    const result = safetyService.checkMessage('I want to hit my partner');
    expect(result.isCrisis).toBe(true);
    expect(result.crisisType).toContain('violence');
    expect(result.severity).toBe('critical');
  });

  test('should detect crisis patterns (suicide)', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    expect(result.isCrisis).toBe(true);
    expect(result.crisisType).toContain('suicide');
    expect(result.severity).toBe('critical');
  });

  test('should detect inflected crisis forms (abuse & physical threats)', () => {
    const result = safetyService.checkMessage('He threatened me and is controlling my phone, I feel gaslit and abused');
    expect(result.isCrisis).toBe(true);
    expect(result.crisisType).toContain('abuse');
    expect(result.severity).toBe('critical');
  });

  test('should reclassify venting (hate/despise) as escalation instead of crisis', () => {
    const result = safetyService.checkMessage('I hate when my partner ignores my messages');
    expect(result.isCrisis).toBe(false);
    expect(result.isEscalation).toBe(true);
    expect(result.severity).toBe('high');
  });

  test('should detect escalation from absolutes', () => {
    const result = safetyService.checkMessage('You always do this and you never listen!');
    expect(result.isCrisis).toBe(false);
    expect(result.isEscalation).toBe(true);
    expect(result.severity).toBe('high');
  });

  test('should return low severity for neutral messages', () => {
    const result = safetyService.checkMessage('I feel a bit tired today.');
    expect(result.isCrisis).toBe(false);
    expect(result.isEscalation).toBe(false);
    expect(result.severity).toBe('low');
  });

  test('should generate correct crisis response', () => {
    const response = safetyService.getCrisisResponse(['suicide']);
    expect(response).toContain('988');
    expect(response).toContain('Safety Concern Detected');
  });
});
