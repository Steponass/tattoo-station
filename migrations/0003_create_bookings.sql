-- Migration number: 0003 	 2026-07-21T13:10:50.429Z
-- Migration 0002: booking requests

CREATE TABLE bookings (
  id                     TEXT    PRIMARY KEY,
  reference              TEXT    NOT NULL UNIQUE,
  draft_id               TEXT    NOT NULL,
  created_at             TEXT    NOT NULL,
  purge_after            TEXT    NOT NULL,

  -- Personal
  customer_name          TEXT    NOT NULL,
  customer_email         TEXT    NOT NULL,
  customer_phone         TEXT    NOT NULL,

  -- Appointment
  service_category       TEXT    NOT NULL
                           CHECK (service_category IN ('tattoo', 'piercing', 'other')),
  service_type           TEXT,
  artist_selection       TEXT    NOT NULL
                           CHECK (artist_selection IN ('specific', 'not_specified')),
  artist_id              INTEGER REFERENCES artists(id),
  preferred_times        TEXT,

  -- Design
  description            TEXT    NOT NULL,
  body_placement         TEXT,
  reference_link         TEXT,
  preferred_style        TEXT,
  approx_size_cm         TEXT,
  budget_range           TEXT,
  photos                 TEXT    NOT NULL DEFAULT '[]',

  -- Consent
  is_first_time          INTEGER NOT NULL DEFAULT 0 CHECK (is_first_time IN (0, 1)),
  marketing_consent      INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0, 1)),
  privacy_consent_at     TEXT    NOT NULL,

  -- Attribution
  source                 TEXT,
  utm_source             TEXT,
  utm_medium             TEXT,
  utm_campaign           TEXT,

  -- Notifications
  notification_status    TEXT    NOT NULL DEFAULT 'pending'
                           CHECK (notification_status IN ('pending', 'sent', 'partial', 'failed')),
  notification_error     TEXT,

  -- An artist is recorded only when one was specifically chosen.
  CHECK (
    (artist_selection = 'specific'      AND artist_id IS NOT NULL) OR
    (artist_selection = 'not_specified' AND artist_id IS NULL)
  ),

  -- 'other' has no subtype; the other two always do.
  CHECK (
    (service_category = 'other' AND service_type IS NULL) OR
    (service_category <> 'other' AND service_type IS NOT NULL)
  )
);

CREATE INDEX idx_bookings_purge_after ON bookings (purge_after);
CREATE INDEX idx_bookings_notification_status ON bookings (notification_status);
CREATE INDEX idx_bookings_artist_created ON bookings (artist_id, created_at DESC);