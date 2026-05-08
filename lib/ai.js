import { AzureOpenAI } from 'openai';

/**
 * Azure OpenAI client configured for the couples therapy chatbot.
 */
const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
});

const SYSTEM_PROMPT = `You are a compassionate, professional AI relationship counselor. Your role is to help couples communicate better, resolve conflicts constructively, and strengthen their emotional bond.

## Core Principles

1. **Absolute Neutrality**: You NEVER take sides. You never assign blame. You validate both partners' feelings equally. If one partner complains about the other, acknowledge their feelings without agreeing that the other partner is at fault.

2. **Gender-Neutral Language**: Always use "your partner" instead of he/she/him/her or any gendered pronouns. Never assume gender roles, stereotypes, or heteronormative dynamics.

3. **Evidence-Based Approach**: Use techniques from:
   - **Gottman Method**: The Four Horsemen (criticism, contempt, defensiveness, stonewalling) and their antidotes
   - **Nonviolent Communication (NVC)**: Observations, feelings, needs, requests
   - **Emotionally Focused Therapy (EFT)**: Attachment needs and emotional cycles
   - **Active Listening**: Reflecting, paraphrasing, validating

4. **De-Escalation First**: If a partner expresses anger, frustration, or hostility:
   - Validate the emotion ("I can hear how frustrated you are")
   - Reframe away from blame ("It sounds like you have an unmet need for...")
   - NEVER repeat or amplify inflammatory language
   - Suggest a cooling-off period if emotions are very high

5. **Therapeutic Boundaries**:
   - You are NOT a replacement for a licensed therapist
   - For serious issues (addiction, trauma, mental health), recommend professional help
   - Never diagnose conditions or prescribe treatment
   - Encourage both partners to consider couples counseling for deeper issues

6. **Privacy Between Partners**: You maintain context from both partners' conversations to understand the relationship dynamics, but you NEVER directly quote what one partner has said to the other. You may reference themes or patterns without attribution.

7. **Constructive Guidance**: Always end responses with something actionable — a question to reflect on, a communication technique to try, or a small exercise to practice together.

## Response Style
- Warm but professional tone
- Keep responses concise (2-4 paragraphs maximum)
- Use empathetic language
- Ask open-ended follow-up questions
- Suggest specific, practical steps
- Celebrate positive efforts and progress

## What You Must NEVER Do
- Take sides or say one partner is "right" or "wrong"
- Use gendered language or assume gender roles
- Encourage separation or divorce (suggest professional counseling instead)
- Share what one partner said with the other directly
- Make assumptions about the relationship dynamic
- Use clinical jargon without explanation
- Be preachy, condescending, or lecture the user`;

/**
 * Builds the conversation context from both partners' messages.
 * @param {Array} messages - Array of messages from the database
 * @param {string} currentRole - The current partner's role (PARTNER_A or PARTNER_B)
 * @returns {Array} - OpenAI-formatted messages array
 */
export function buildContext(messages, currentRole) {
    const aiRole = currentRole === 'PARTNER_A' ? 'AI_TO_A' : 'AI_TO_B';
    const otherRole = currentRole === 'PARTNER_A' ? 'PARTNER_B' : 'PARTNER_A';
    const otherAiRole = currentRole === 'PARTNER_A' ? 'AI_TO_B' : 'AI_TO_A';

    const contextMessages = [{ role: 'system', content: SYSTEM_PROMPT }];

    // Add context note about other partner's themes (without direct quotes)
    const otherPartnerMessages = messages.filter(
        (m) => m.senderRole === otherRole || m.senderRole === otherAiRole
    );

    if (otherPartnerMessages.length > 0) {
        contextMessages.push({
            role: 'system',
            content: `[Internal context — do NOT reveal this directly] The other partner has also been chatting with you. Be aware of the full relationship dynamic. There are ${otherPartnerMessages.length} messages from the other partner's conversation. Use this awareness to provide balanced, informed guidance, but never quote or reference specific things the other partner said.`,
        });
    }

    // Add the current partner's conversation thread
    for (const msg of messages) {
        if (msg.senderRole === currentRole) {
            contextMessages.push({ role: 'user', content: msg.content });
        } else if (msg.senderRole === aiRole) {
            contextMessages.push({ role: 'assistant', content: msg.content });
        }
        // Skip messages from other partner (context is handled above)
    }

    return contextMessages;
}

/**
 * Generate an AI response for a partner's message.
 * @param {Array} contextMessages - OpenAI-formatted messages
 * @returns {Promise<string>} - The AI's response
 */
export async function generateResponse(contextMessages) {
    const completion = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
        messages: contextMessages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || 'I\'m here to listen. Could you share more about what\'s on your mind?';
}

/**
 * Exercise templates that the AI can suggest based on conversation themes.
 */
export const EXERCISE_TEMPLATES = [
    {
        category: 'COMMUNICATION',
        title: 'Active Listening Practice',
        prompt: 'Take turns sharing something important to you for 3 minutes each. The listener should only reflect back what they heard — no advice, no rebuttals. Start with: "What I heard you say is..."',
    },
    {
        category: 'GRATITUDE',
        title: 'Daily Appreciation',
        prompt: 'Each day this week, share one specific thing you appreciate about your partner. Be concrete — instead of "you\'re nice," try "I appreciated how you made coffee for me this morning."',
    },
    {
        category: 'CONFLICT_RESOLUTION',
        title: 'Gentle Start-Up Practice',
        prompt: 'Think of a recent concern. Rephrase it using this format: "I feel [emotion] about [specific situation]. I need [your need]. Would you be willing to [specific request]?"',
    },
    {
        category: 'EMPATHY',
        title: 'Walk in Their Shoes',
        prompt: 'Write a short paragraph describing a recent disagreement from your partner\'s perspective. What might they have been feeling? What need might have been unmet for them?',
    },
    {
        category: 'BONDING',
        title: 'Dream Sharing',
        prompt: 'Share one dream or goal you have for your future together. Ask your partner about theirs. Find one shared dream you can start planning for together, no matter how small.',
    },
    {
        category: 'WEEKLY_CHECKIN',
        title: 'Weekly Relationship Check-In',
        prompt: 'Answer these together: (1) What went well this week between us? (2) Was there a moment I felt disconnected? (3) What\'s one thing I\'d like us to try differently next week?',
    },
    {
        category: 'COMMUNICATION',
        title: 'The "I Feel" Exercise',
        prompt: 'Practice replacing "You always..." or "You never..." statements with "I feel... when...". Write down 3 common complaints and reframe each one using feeling-based language.',
    },
    {
        category: 'CONFLICT_RESOLUTION',
        title: 'Timeout Protocol',
        prompt: 'Agree on a timeout signal (a word or gesture) that either of you can use when emotions get too high. During timeout: take 20 minutes apart, self-soothe, then return to the conversation calmly.',
    },
    {
        category: 'EMPATHY',
        title: 'Emotional Check-In',
        prompt: 'Ask your partner: "On a scale of 1-10, how are you feeling today?" Then ask: "What would make it a point higher?" Listen without trying to fix — just understand.',
    },
    {
        category: 'BONDING',
        title: 'Memory Lane',
        prompt: 'Share your favorite memory together. What made that moment special? What feelings does it bring up? Use this to remind yourselves of the foundation you\'ve built.',
    },
];
