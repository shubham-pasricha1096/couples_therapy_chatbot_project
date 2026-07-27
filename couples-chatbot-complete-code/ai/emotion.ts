export function detectEmotion(message: string): string {
  const text = message.toLowerCase();

  if (text.includes('angry') || text.includes('mad')) return 'anger';
  if (text.includes('sad') || text.includes('hurt')) return 'sadness';
  if (text.includes('frustrated')) return 'frustration';
  if (text.includes('worried') || text.includes('anxious')) return 'anxiety';

  return 'neutral';
}

export default detectEmotion;
