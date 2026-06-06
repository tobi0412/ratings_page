-- Migration 016: Make match_id nullable in economy_bets for pre-session betting and update RLS
ALTER TABLE economy_bets ALTER COLUMN match_id DROP NOT NULL;

DROP POLICY IF EXISTS "Players insert own bets" ON economy_bets;
CREATE POLICY "Players insert own bets" ON economy_bets FOR INSERT TO authenticated 
  WITH CHECK (
    player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND match_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM match_sessions WHERE is_active = true)
  );
