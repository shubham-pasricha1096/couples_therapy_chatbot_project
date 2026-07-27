export function detectConflict(message: string): string {
  const text = message.toLowerCase();

  if (text.includes('always') && text.includes('you')) return 'medium';
  if (text.includes('never') && text.includes('you')) return 'medium';
  if (text.includes('hate')) return 'high';

  return 'low';
}

export default detectConflict;
