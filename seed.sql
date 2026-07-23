DELETE FROM artist_translations;
DELETE FROM artists;
DELETE FROM sqlite_sequence WHERE name = 'artists';

INSERT INTO artists (slug, display_name, role, email, instagram_handle, profile_image_key, sort_order) VALUES
  ('placeholder-one', 'Artist One',  'tattoo',   'one@example.com',   'artist_one', '/artists/placeholder.jpg', 10),
  ('placeholder-two', 'Artist Two',  'piercing', 'two@example.com',   'artist_two', '/artists/placeholder.jpg', 20),
  ('steponiux-uno', 'Artist Three',  'tattoo', 'bassky@gmail.com',   'artist_three', '/artists/placeholder.jpg', 30);

INSERT INTO artist_translations (artist_id, locale, bio, bio_excerpt) VALUES
  (1, 'en', 'Full English bio text goes here.', 'Short hand-written excerpt.'),
  (1, 'lt', 'Pilnas lietuviškas biografijos tekstas.', "NULL"),
  (2, 'en', 'Full English bio text goes here.', NULL),
  (2, 'lt', 'Pilnas lietuviškas biografijos tekstas.', NULL);