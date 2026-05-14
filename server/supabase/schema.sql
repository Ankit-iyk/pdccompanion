-- PDCompanion Supabase Schema
-- Run this in your Supabase SQL Editor
-- NOTE: Existing 'telemetry' table from Celanor AI is preserved

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pd_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('patient', 'caretaker', 'doctor', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pd_patients (
  id                TEXT PRIMARY KEY,       -- e.g. "PD001"
  user_id           UUID REFERENCES pd_users(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  age               INTEGER NOT NULL,
  diagnosis_stage   INTEGER CHECK (diagnosis_stage BETWEEN 1 AND 5),
  emergency_contact TEXT,
  avatar_initials   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DEVICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pd_devices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       TEXT REFERENCES pd_patients(id) ON DELETE CASCADE,
  device_type      TEXT NOT NULL CHECK (device_type IN ('cap', 'wristband')),
  battery_level    INTEGER DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
  status           TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'charging')),
  firmware_version TEXT DEFAULT '1.0.0',
  last_seen        TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TELEMETRY  (new table — original kept intact)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pd_telemetry (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     TEXT REFERENCES pd_patients(id) ON DELETE CASCADE,
  heart_rate     NUMERIC(5,1),
  tremor_score   NUMERIC(4,2),
  temperature    NUMERIC(4,1),
  fall_detected  BOOLEAN DEFAULT FALSE,
  latitude       NUMERIC(10,6),
  longitude      NUMERIC(10,6),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast patient telemetry queries
CREATE INDEX IF NOT EXISTS idx_pd_telemetry_patient_time
  ON pd_telemetry (patient_id, created_at DESC);

-- ─────────────────────────────────────────────
-- ALERTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pd_alerts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT REFERENCES pd_patients(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  severity   TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message    TEXT NOT NULL,
  resolved   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pd_alerts_patient
  ON pd_alerts (patient_id, created_at DESC);

-- ─────────────────────────────────────────────
-- AI PREDICTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pd_ai_predictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      TEXT REFERENCES pd_patients(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  confidence      NUMERIC(4,2) CHECK (confidence BETWEEN 0 AND 1),
  result          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DISABLE RLS for hackathon dev (re-enable for production)
-- ─────────────────────────────────────────────
ALTER TABLE pd_users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE pd_patients        DISABLE ROW LEVEL SECURITY;
ALTER TABLE pd_devices         DISABLE ROW LEVEL SECURITY;
ALTER TABLE pd_telemetry       DISABLE ROW LEVEL SECURITY;
ALTER TABLE pd_alerts          DISABLE ROW LEVEL SECURITY;
ALTER TABLE pd_ai_predictions  DISABLE ROW LEVEL SECURITY;
