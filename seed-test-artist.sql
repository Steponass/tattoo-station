INSERT INTO artists (slug, display_name, role, email, instagram_handle, profile_image_key, sort_order, is_active)
VALUES ('steponas', 'Steponas', 'tattoo', 'steponas.dabuzinskas@gmail.com', '@steponasd', NULL, 100, 1);

INSERT INTO artist_translations (artist_id, locale, bio, bio_excerpt)
VALUES
  ((SELECT id FROM artists WHERE slug = 'steponas'), 'en', 'Full English bio goes here.Full English bio goes here.Full English bio goes here.Full English bio goes here.Full English bio goes here.Full English bio goes here.Full English bio goes here.Full English bio goes here.Full English bio goes here. ', 'Short English excerpt.'),
  ((SELECT id FROM artists WHERE slug = 'steponas'), 'lt', 'Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.Pilnas lietuviškas bio tekstas.', 'Trumpa lietuviška ištrauka.');