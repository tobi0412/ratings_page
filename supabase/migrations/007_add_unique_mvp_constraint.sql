-- Migration 007: Add unique constraint for single MVP per voter/match

CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_mvp_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_mvp = true);
