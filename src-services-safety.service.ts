// src/services/safety.service.ts

import { logger } from '../utils/logger';

export interface SafetyCheckResult {
  isCrisis: boolean;
  crisisType: string[];
  isEscalation: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  escalationCount: number;
}

export class SafetyService {
  private readonly crisisPatterns = {
    violence: /(\bhit\b|\bhurt\b|\bviolence\b|\bphysical\s*harm\b|\bweapon\b|\bkill\b)/i,
    suicide: /(\bsuicide\b|\bkill\s*myself\b|\bend\s*it\s*all\b|\bnot\s*worth\s*living\b|\bwant\s*to\s*die\b)/i,
    abuse: /(\babuse\b|\bmanipulat(e|ion)\b|\bgaslight\b|\bcontrol\b|\bthreaten\b)/i,
    severe: /(\bhate\b|\bdespise\b|\brevenge\b|\bget\s*back\s*at\b)/i
  };

  private readonly escalationIndicators = [
    'always',
    'never',
    'you always',
    'you never',
    'your fault',
    'blame you',
    'all your fault'
  ];

  /**
   * Check message for crisis patterns and escalation
   */
  public checkMessage(message: string): SafetyCheckResult {
    const lowerMessage = message.toLowerCase();
    
    let isCrisis = false;
    const crisisType: string[] = [];
    let severity: SafetyCheckResult['severity'] = 'low';

    // Check for crisis patterns
    for (const [type, pattern] of Object.entries(this.crisisPatterns)) {
      if (pattern.test(message)) {
        isCrisis = true;
        crisisType.push(type);
        severity = 'critical';
        
        logger.warn('Crisis pattern detected', {
          type,
          messageExcerpt: message.substring(0, 100)
        });
      }
    }

    // Check for escalation
    let escalationCount = 0;
    for (const indicator of this.escalationIndicators) {
      if (lowerMessage.includes(indicator)) {
        escalationCount++;
      }
    }

    const isEscalation = escalationCount >= 2;
    if (isEscalation && severity !== 'critical') {
      severity = 'high';
    }

    return {
      isCrisis,
      crisisType,
      isEscalation,
      severity,
      escalationCount
    };
  }

  /**
   * Generate crisis response message
   */
  public getCrisisResponse(crisisTypes: string[]): string {
    let message = `🚨 **Safety Concern Detected**\n\n`;
    message += `I notice you're expressing some very serious concerns. Your safety and wellbeing are the top priority.\n\n`;

    if (crisisTypes.includes('violence') || crisisTypes.includes('abuse')) {
      message += `**If you're experiencing or witnessing violence/abuse:**\n`;
      message += `• National Domestic Violence Hotline: 1-800-799-7233\n`;
      message += `• Text START to 88788\n`;
      message += `• Online chat: https://www.thehotline.org\n\n`;
    }

    if (crisisTypes.includes('suicide')) {
      message += `**If you're having thoughts of suicide:**\n`;
      message += `• National Suicide Prevention Lifeline: 988\n`;
      message += `• Crisis Text Line: Text HOME to 741741\n`;
      message += `• International: https://findahelpline.com\n\n`;
    }

    message += `**Immediate Danger:** If you or someone else is in immediate danger, please call 911 or your local emergency services.\n\n`;
    message += `Professional crisis counselors are available 24/7 and trained to help. Please reach out to one of these resources.\n\n`;
    message += `When you're ready, we can continue our conversation. Type /help for more options.`;

    return message;
  }

  /**
   * Get de-escalation prompt addition for Claude
   */
  public getDeEscalationPrompt(message: string): string {
    return `
IMPORTANT: The user's message shows signs of escalation (blame language, absolutes).

Your response should:
1. Validate their feelings without agreeing with blame
2. Gently reframe from "you" statements to "I feel" statements
3. Ask clarifying questions about underlying needs
4. Avoid taking sides or appearing to agree with harsh characterizations
5. Guide toward constructive communication

User message: "${message}"`;
  }
}

// Singleton instance
export const safetyService = new SafetyService();
