import { pool } from '../database/db';

export interface SafetyMetadata {
  isCrisis?: boolean;
  crisisType?: string[];
  isEscalation?: boolean;
  severity?: string;
}

export async function saveMessage(
  relId: number,
  sender: number,
  emotion: string,
  conflictLevel: string,
  content: string,
  safety?: SafetyMetadata
): Promise<number | null> {
  console.log('💾 Saving message to PostgreSQL...');

  const isCrisis = safety?.isCrisis ?? false;
  const crisisType = safety?.crisisType ? JSON.stringify(safety.crisisType) : null;
  const isEscalation = safety?.isEscalation ?? false;
  const severity = safety?.severity ?? 'low';

  try {
    const result = await pool.query(
      `INSERT INTO messages
      (relationship_id, sender, emotion, conflict_level, content, is_crisis, crisis_type, is_escalation, severity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [relId, sender, emotion, conflictLevel, content, isCrisis, crisisType, isEscalation, severity]
    );
    return result.rows[0].id;
  } catch (err: any) {
    console.log('Error saving message:', err.message);
    return null;
  }
}

export default saveMessage;
