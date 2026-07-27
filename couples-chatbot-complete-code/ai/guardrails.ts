export function applyGuardrails(text: string): string {
  let safe = text;

  safe = safe.replace(/your partner is wrong/gi, 'there may be different perspectives');
  safe = safe.replace(/you should/gi, 'it might help to');

  return safe;
}

export default applyGuardrails;
