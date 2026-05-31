-- Migration 008: Add unique constraint to historical_ratings
-- This is required by the compute_historical_ratings function which uses ON CONFLICT (player_id, match_id)

ALTER TABLE historical_ratings 
ADD CONSTRAINT historical_ratings_player_id_match_id_key UNIQUE (player_id, match_id);
