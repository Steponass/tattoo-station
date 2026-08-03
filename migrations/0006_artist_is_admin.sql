-- 0006_artist_is_admin.sql
--
-- Adds an is_admin boolean flag to the artists table so that admin identity
-- can be managed from within the admin UI (a checkbox on the artist form)
-- rather than from a Wrangler secret. Named to avoid collision with
-- artists.role, which is service specialization ('tattoo' | 'piercing' |
-- 'both') and unrelated to identity.
--
-- After this migration:
--   - resolveActor() reads artists.is_admin instead of the ADMIN_EMAILS
--     allowlist secret;
--   - the ADMIN_EMAILS secret becomes dead config and is deleted separately;
--   - every authenticated user must have a row in `artists` — an email
--     admitted by Cloudflare Access but not present in this table resolves
--     to { kind: "unknown" } and is denied.
--
-- Symmetric with the existing is_active flag: INTEGER 0/1 with a CHECK,
-- matching the schema convention rather than introducing a new pattern.

ALTER TABLE artists
  ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0
  CHECK (is_admin IN (0, 1));


-- Seed the two admins. This is the one-time promotion; subsequent changes
-- happen through the admin UI.
--
-- Both emails are lowercased here because artists.email has no normalization
-- constraint. The resolver lowercases before comparison, but seeding with
-- lowercase avoids any ambiguity when someone edits the row by hand later.

UPDATE artists
   SET is_admin = 1
 WHERE email IN (
   'steponas.dabuzinskas@gmail.com',
   'grunskisraimundas@gmail.com'
 );


-- Hide the steponas row from the public roster. The row remains for identity
-- purposes (login resolves to { kind: "admin" }) but is excluded from every
-- public surface that filters by is_active. Existing artist_photos, avatar,
-- and translations are retained as smoke-test seed data.

UPDATE artists
   SET is_active = 0
 WHERE email = 'steponas.dabuzinskas@gmail.com';
