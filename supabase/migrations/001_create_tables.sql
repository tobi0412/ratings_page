-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'player')) DEFAULT 'player',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- match_sessions
CREATE TABLE match_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tecnica INT NOT NULL CHECK (tecnica >= 1 AND tecnica <= 10),
  fisico INT NOT NULL CHECK (fisico >= 1 AND fisico <= 10),
  actitud INT NOT NULL CHECK (actitud >= 1 AND actitud <= 10),
  vision_juego INT NOT NULL CHECK (vision_juego >= 1 AND vision_juego <= 10),
  is_mvp BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT voter_not_receiver CHECK (voter_id != receiver_id),
  UNIQUE(match_id, voter_id, receiver_id)
);

-- historical_ratings
CREATE TABLE historical_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  avg_tecnica FLOAT,
  avg_fisico FLOAT,
  avg_actitud FLOAT,
  avg_vision_juego FLOAT,
  avg_total FLOAT,
  mvp_count INT DEFAULT 0,
  computed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- Indexes for performance
CREATE INDEX idx_ratings_match ON ratings(match_id);
CREATE INDEX idx_ratings_voter ON ratings(voter_id);
CREATE INDEX idx_ratings_receiver ON ratings(receiver_id);
CREATE INDEX idx_match_sessions_active ON match_sessions(is_active);
CREATE INDEX idx_historical_player ON historical_ratings(player_id);

-- Enforce only one active session at a time (partial unique index)
CREATE UNIQUE INDEX idx_only_one_active_session ON match_sessions (is_active) WHERE is_active = true;
