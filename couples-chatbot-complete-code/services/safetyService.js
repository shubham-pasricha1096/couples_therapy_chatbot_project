const logger = require('../utils/logger').logger || console;

class SafetyService {
  constructor() {
    this.crisisPatterns = {
      violence: /(\bhit(ting|s)?\b|\bhurt(ing|s)?\b|\bviolence\b|\bphysical\s*harm\b|\bweapon\b|\bkill(ing|s)?\b)/i,
      suicide: /(\bsuicide\b|\bkill(ing)?\s*myself\b|\bend(ing)?\s*it\s*all\b|\bnot\s*worth\s*living\b|\bwant(ing)?\s*to\s*die\b)/i,
      abuse: /(\babuse[sd]?\b|\babusing\b|\babusive\b|\bmanipulat(e|ed|ing|ion)\b|\bgaslight(ed|ing)?\b|\bgaslit\b|\bcontrol(led|ling)?\b|\bthreaten(ed|ing|s)?\b)/i
    };

    this.escalationPatterns = {
      severe: /(\bhate[ds]?\b|\bhating\b|\bdespise[ds]?\b|\bdespising\b|\brevenge\b|\bget(ting)?\s*back\s*at\b)/i
    };

    this.escalationIndicators = [
      'always',
      'never',
      'you always',
      'you never',
      'your fault',
      'blame you',
      'all your fault'
    ];
  }

  checkMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    let isCrisis = false;
    const crisisType = [];
    let severity = 'low';

    // Check crisis patterns (violence, suicide, abuse)
    for (const [type, pattern] of Object.entries(this.crisisPatterns)) {
      if (pattern.test(message)) {
        isCrisis = true;
        crisisType.push(type);
        severity = 'critical';
        
        if (logger.warn) {
          logger.warn('Crisis pattern detected', {
            type,
            messageExcerpt: message.substring(0, 100)
          });
        }
      }
    }

    // Check escalation indicators & severe venting words
    let escalationCount = 0;
    for (const indicator of this.escalationIndicators) {
      if (lowerMessage.includes(indicator)) {
        escalationCount++;
      }
    }

    let isEscalation = escalationCount >= 2;
    if (this.escalationPatterns.severe.test(message)) {
      isEscalation = true;
    }

    if (isEscalation && !isCrisis) {
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

  getCrisisResponse(crisisTypes) {
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

  getDeEscalationPrompt(message) {
    return `
IMPORTANT: The user's message shows signs of escalation (blame language, absolutes, or strong negative emotion).

Your response should:
1. Validate their feelings without agreeing with blame
2. Gently reframe from "you" statements to "I feel" statements
3. Ask clarifying questions about underlying needs
4. Avoid taking sides or appearing to agree with harsh characterizations
5. Guide toward constructive communication

User message: "${message}"`;
  }
}

const safetyService = new SafetyService();
module.exports = { SafetyService, safetyService, default: safetyService };
