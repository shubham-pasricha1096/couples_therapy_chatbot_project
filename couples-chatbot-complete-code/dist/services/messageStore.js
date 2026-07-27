"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMessage = saveMessage;
const db_1 = require("../database/db");
async function saveMessage(relId, sender, emotion, conflictLevel, content, safety) {
    console.log('💾 Saving message to PostgreSQL...');
    const isCrisis = safety?.isCrisis ?? false;
    const crisisType = safety?.crisisType ? JSON.stringify(safety.crisisType) : null;
    const isEscalation = safety?.isEscalation ?? false;
    const severity = safety?.severity ?? 'low';
    try {
        const result = await db_1.pool.query(`INSERT INTO messages
      (relationship_id, sender, emotion, conflict_level, content, is_crisis, crisis_type, is_escalation, severity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`, [relId, sender, emotion, conflictLevel, content, isCrisis, crisisType, isEscalation, severity]);
        return result.rows[0].id;
    }
    catch (err) {
        console.log('Error saving message:', err.message);
        return null;
    }
}
exports.default = saveMessage;
