/**
 * Crisis & Abuse Detection Module
 * Scans messages for indicators of self-harm, domestic violence, 
 * and other dangerous situations. Returns safety metadata.
 */

const CRISIS_KEYWORDS = [
    'kill myself', 'suicide', 'suicidal', 'end my life', 'want to die',
    'self harm', 'self-harm', 'cutting myself', 'overdose',
    'don\'t want to live', 'no reason to live', 'better off dead',
    'hurt myself', 'ending it all',
];

const ABUSE_KEYWORDS = [
    'hit me', 'hits me', 'punched me', 'slapped me', 'beat me',
    'choke me', 'choked me', 'strangled me', 'threatened to kill',
    'threatens me', 'afraid of my partner', 'scared of my partner',
    'controls me', 'won\'t let me leave', 'locked me in',
    'forces me to', 'forced me to', 'sexually assaulted',
    'raped me', 'took my money', 'tracks my phone',
    'isolates me', 'not allowed to see', 'stalking me',
];

const INFLAMMATORY_PATTERNS = [
    /i\s+hate\s+(my\s+)?(partner|spouse|husband|wife|them)/i,
    /they?\s+(deserve|should)\s+(to\s+)?(die|suffer|hurt)/i,
    /i('m|\s+am)\s+going\s+to\s+(hurt|kill|destroy)/i,
];

const CRISIS_RESPONSE = `I'm really concerned about what you've shared. Your safety matters deeply, and I want to make sure you get the right support.

🆘 **If you are in immediate danger, please call 911 (US) or your local emergency number.**

📞 **Crisis Resources:**
• **988 Suicide & Crisis Lifeline**: Call or text **988** (US)
• **Crisis Text Line**: Text **HOME** to **741741**
• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

You are not alone, and reaching out takes courage. A trained professional can provide the support you deserve right now.`;

const ABUSE_RESPONSE = `Thank you for trusting me with this. What you're describing sounds like it could be a safety concern, and I want you to know that you deserve to feel safe.

🆘 **If you are in immediate danger, please call 911 (US) or your local emergency number.**

📞 **Support Resources:**
• **National Domestic Violence Hotline**: **1-800-799-7233** (US) or text **START** to **88788**
• **RAINN** (Sexual Assault): **1-800-656-4673**
• **National Child Abuse Hotline**: **1-800-422-4453**
• **International DV Resources**: https://www.hotpeachpages.net

You are not responsible for someone else's harmful behavior. A professional advocate can help you explore your options safely and confidentially.`;

/**
 * Analyzes a message for safety concerns.
 * @param {string} message - The user's message
 * @returns {{ isSafe: boolean, type: string|null, response: string|null }}
 */
export function analyzeSafety(message) {
    const lowerMsg = message.toLowerCase();

    // Check for crisis indicators
    for (const keyword of CRISIS_KEYWORDS) {
        if (lowerMsg.includes(keyword)) {
            return {
                isSafe: false,
                type: 'CRISIS',
                response: CRISIS_RESPONSE,
            };
        }
    }

    // Check for abuse indicators
    for (const keyword of ABUSE_KEYWORDS) {
        if (lowerMsg.includes(keyword)) {
            return {
                isSafe: false,
                type: 'ABUSE',
                response: ABUSE_RESPONSE,
            };
        }
    }

    // Check for inflammatory patterns
    for (const pattern of INFLAMMATORY_PATTERNS) {
        if (pattern.test(message)) {
            return {
                isSafe: true,
                type: 'INFLAMMATORY',
                response: null, // AI will handle de-escalation
                flagged: true,
            };
        }
    }

    return { isSafe: true, type: null, response: null };
}
