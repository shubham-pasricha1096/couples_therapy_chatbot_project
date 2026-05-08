function buildPrompt(emotion, conflictLevel, message, memory,history) {
const partner1Name = memory?.partner1_name || memory?.partner1Name || "Unknown";
const partner2Name = memory?.partner2_name || memory?.partner2Name || "Unknown";
const partner1History = Array.isArray(memory?.partner1_history) ? memory.partner1_history.slice(-3) : [];
const conversation = history
    .map(m => `${m.sender}: ${m.content}`)
    .join("\n");

const partner2History = Array.isArray(memory?.partner2_history) ? memory.partner2_history.slice(-3) : [];
const formatHistory = (items, label) => {
if (!items.length) return `${label}: none`;
return `${label}:\n${items.map((item) => `- ${String(item)}`).join("\n")}`;
};

return `
You are an impartial relationship mediator.

Context:
Trigger topics: ${memory?.trigger_topics || "unknown"}
Current user name on file: ${memory?.current_user_name || "Unknown"}
Partner name on file: ${memory?.partner_name || "Unknown"}
Other known session names: ${partner1Name}, ${partner2Name}

Recent conversation:
${conversation}

User emotion: ${emotion}
Conflict intensity: ${conflictLevel}

User message:
${message}

Session context:
${formatHistory(partner1History, `${partner1Name} recent messages`)}
${formatHistory(partner2History, `${partner2Name} recent messages`)}

Instructions:
1. Acknowledge the emotion briefly.
2. Reframe the issue neutrally.
3. Encourage understanding between partners.
4. Ask a reflective question that promotes dialogue.

Rules:
- Stay neutral
- Do not assign blame
- Be calm and supportive
- Keep response under 80 words
- Do not reveal partner identity or repeat private partner statements directly
- Do not say you cannot access session context when it is present
- Do not include internal labels or formatting in the reply
- Respond only to the user speaking now
- Respond naturally and avoid repetitive therapy phrasing
`;

}

module.exports = buildPrompt;
