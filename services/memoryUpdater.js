const db = require("../database/db");

async function updateConflictCount(relId) {

  await db.query(
    `UPDATE relationship_memory
     SET conflict_count = conflict_count + 1
     WHERE relationship_id=$1`,
    [relId]
  );

}

module.exports = updateConflictCount;