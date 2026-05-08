CREATE TABLE IF NOT EXISTS relationships (
  id BIGSERIAL PRIMARY KEY,
  relationship_code VARCHAR(32) NOT NULL UNIQUE,
  partner1 BIGINT NOT NULL,
  partner2 BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  sender BIGINT NOT NULL,
  content TEXT NOT NULL,
  emotion VARCHAR(64),
  conflict_level VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_relationship_id ON messages (relationship_id);
CREATE INDEX IF NOT EXISTS idx_relationships_partner1 ON relationships (partner1);
CREATE INDEX IF NOT EXISTS idx_relationships_partner2 ON relationships (partner2);
