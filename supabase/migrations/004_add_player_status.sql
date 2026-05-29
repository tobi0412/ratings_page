-- =============================================================================
-- Migration 004: Add player approval status
-- =============================================================================

-- 1. Add status column to profiles
ALTER TABLE profiles
ADD COLUMN status TEXT NOT NULL
  CHECK (status IN ('pending', 'approved', 'rejected'))
  DEFAULT 'pending';

-- 2. Approve all existing players and the admin
--    (everyone registered before this feature is considered already vetted)
UPDATE profiles SET status = 'approved';

-- 3. Index for fast filtering by status in admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);

-- 4. Update the ratings INSERT policy to require approved status
DROP POLICY IF EXISTS "Players vote for others in active sessions" ON ratings;

CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND voter_id != receiver_id
    AND EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true
    )
    AND (SELECT status FROM profiles WHERE auth_id = (SELECT auth.uid())) = 'approved'
  );
