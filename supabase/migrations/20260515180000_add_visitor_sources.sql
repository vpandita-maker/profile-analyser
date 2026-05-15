ALTER TABLE visitor_events
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS source_platform TEXT;

CREATE INDEX IF NOT EXISTS idx_visitor_events_visit_date_source
  ON visitor_events(visit_date, source_platform);
