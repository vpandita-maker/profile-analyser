CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  linkedin_id TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  invites_required INT DEFAULT 1,
  invites_fulfilled INT DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  friend_email TEXT NOT NULL,
  invite_token TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  linkedin_id TEXT NOT NULL,
  name TEXT,
  headline TEXT,
  profile_photo_url TEXT,
  overall_score INT,
  goal TEXT,
  geography TEXT,
  seniority TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_invites_analysis_id ON invites(analysis_id);
CREATE INDEX idx_invites_friend_email ON invites(friend_email);
CREATE INDEX idx_leaderboard_goal_geo_score ON leaderboard(goal, geography, overall_score DESC);
