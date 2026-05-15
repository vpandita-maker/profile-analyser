CREATE TABLE IF NOT EXISTS visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  visit_date DATE NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_path TEXT,
  UNIQUE(visitor_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visit_date ON visitor_events(visit_date);
