-- Remove NOT NULL constraint on rating columns to allow blank votes
ALTER TABLE ratings
  ALTER COLUMN tecnica DROP NOT NULL,
  ALTER COLUMN fisico DROP NOT NULL,
  ALTER COLUMN actitud DROP NOT NULL,
  ALTER COLUMN vision_juego DROP NOT NULL;
