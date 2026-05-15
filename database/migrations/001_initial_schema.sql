CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(32) UNIQUE,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  password_hash TEXT,
  birth_date DATE,
  gender VARCHAR(24),
  address TEXT,
  city VARCHAR(120),
  country VARCHAR(120) NOT NULL DEFAULT 'Burkina Faso',
  role VARCHAR(32) NOT NULL DEFAULT 'utilisateur',
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_verification',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT users_contact_required CHECK (phone IS NOT NULL OR email IS NOT NULL),
  CONSTRAINT users_role_check CHECK (role IN ('utilisateur', 'administrateur_tontine', 'administrateur_plateforme', 'member', 'organizer', 'partner', 'admin', 'super_admin')),
  CONSTRAINT users_status_check CHECK (status IN ('pending_verification', 'active', 'rejected', 'suspended', 'blocked', 'deleted')),
  CONSTRAINT users_trust_score_check CHECK (trust_score >= 0 AND trust_score <= 100)
);

CREATE TABLE IF NOT EXISTS cnib_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cnib_number VARCHAR(80) NOT NULL,
  first_name_extracted VARCHAR(120),
  last_name_extracted VARCHAR(120),
  birth_date_extracted DATE,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  ocr_provider VARCHAR(80),
  ocr_raw JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cnib_verifications_status_check CHECK (status IN ('pending', 'verified', 'rejected', 'manual_review', 'expired'))
);

CREATE TABLE IF NOT EXISTS tontines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  description TEXT,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  contribution_amount NUMERIC(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'XOF',
  frequency VARCHAR(32) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  max_members INTEGER,
  rules JSONB NOT NULL DEFAULT '{}'::JSONB,
  payout_order_locked BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tontines_amount_check CHECK (contribution_amount > 0),
  CONSTRAINT tontines_frequency_check CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  CONSTRAINT tontines_status_check CHECK (status IN ('draft', 'pending_validation', 'active', 'paused', 'completed', 'cancelled')),
  CONSTRAINT tontines_max_members_check CHECK (max_members IS NULL OR max_members > 1)
);

CREATE TABLE IF NOT EXISTS tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_number INTEGER,
  payout_position INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  role VARCHAR(32) NOT NULL DEFAULT 'member',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tontine_members_unique_user UNIQUE (tontine_id, user_id),
  CONSTRAINT tontine_members_unique_number UNIQUE (tontine_id, member_number),
  CONSTRAINT tontine_members_unique_payout_position UNIQUE (tontine_id, payout_position),
  CONSTRAINT tontine_members_role_check CHECK (role IN ('member', 'treasurer', 'administrator', 'organizer', 'observer')),
  CONSTRAINT tontine_members_status_check CHECK (status IN ('pending', 'active', 'up_to_date', 'late', 'payment_default', 'current_beneficiary', 'next_beneficiary', 'suspended', 'left', 'removed'))
);

CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES tontine_members(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  amount_due NUMERIC(14,2) NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(48),
  transaction_reference VARCHAR(160),
  receipt_url TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contributions_unique_cycle_member UNIQUE (tontine_id, member_id, cycle_number),
  CONSTRAINT contributions_amount_due_check CHECK (amount_due > 0),
  CONSTRAINT contributions_amount_paid_check CHECK (amount_paid >= 0),
  CONSTRAINT contributions_status_check CHECK (status IN ('pending', 'paid', 'late', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES tontine_members(id) ON DELETE CASCADE,
  guarantor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  relationship VARCHAR(120),
  guarantee_limit NUMERIC(14,2),
  accepted_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guarantors_unique_member_guarantor UNIQUE (tontine_id, member_id, guarantor_user_id),
  CONSTRAINT guarantors_not_self CHECK (member_id IS NOT NULL),
  CONSTRAINT guarantors_limit_check CHECK (guarantee_limit IS NULL OR guarantee_limit >= 0),
  CONSTRAINT guarantors_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked', 'called', 'released'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
  member_id UUID REFERENCES tontine_members(id) ON DELETE SET NULL,
  contribution_id UUID REFERENCES contributions(id) ON DELETE SET NULL,
  guarantor_id UUID REFERENCES guarantors(id) ON DELETE SET NULL,
  type VARCHAR(48) NOT NULL,
  severity VARCHAR(24) NOT NULL DEFAULT 'medium',
  title VARCHAR(180) NOT NULL,
  description TEXT,
  amount NUMERIC(14,2),
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT incidents_type_check CHECK (type IN ('late_payment', 'default_after_payout', 'guarantor_called', 'dispute', 'rule_violation', 'fraud_suspicion', 'other')),
  CONSTRAINT incidents_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT incidents_status_check CHECK (status IN ('open', 'investigating', 'guarantor_notified', 'resolved', 'dismissed', 'escalated')),
  CONSTRAINT incidents_amount_check CHECK (amount IS NULL OR amount >= 0)
);

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID REFERENCES tontines(id) ON DELETE CASCADE,
  community_project_id UUID,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  type VARCHAR(48) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  quorum_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  allow_multiple_choices BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT votes_type_check CHECK (type IN ('rule_validation', 'payout_order', 'community_project', 'decision', 'incident_resolution', 'member_decision', 'other')),
  CONSTRAINT votes_status_check CHECK (status IN ('draft', 'open', 'closed', 'cancelled', 'approved', 'rejected')),
  CONSTRAINT votes_quorum_check CHECK (quorum_percentage >= 0 AND quorum_percentage <= 100),
  CONSTRAINT votes_dates_check CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at > opens_at)
);

CREATE TABLE IF NOT EXISTS community_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  region VARCHAR(120),
  city VARCHAR(120),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  target_amount NUMERIC(14,2) NOT NULL,
  collected_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'XOF',
  vote_id UUID REFERENCES votes(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  beneficiaries TEXT,
  justification TEXT,
  starts_at DATE,
  ends_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT community_projects_amount_check CHECK (target_amount > 0),
  CONSTRAINT community_projects_collected_check CHECK (collected_amount >= 0),
  CONSTRAINT community_projects_location_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT community_projects_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'votes_community_project_fk'
  ) THEN
    ALTER TABLE votes
      ADD CONSTRAINT votes_community_project_fk
      FOREIGN KEY (community_project_id) REFERENCES community_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vote_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  label VARCHAR(160) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vote_options_unique_position UNIQUE (vote_id, position)
);

CREATE TABLE IF NOT EXISTS vote_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tontine_member_id UUID REFERENCES tontine_members(id) ON DELETE SET NULL,
  comment TEXT,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vote_responses_unique_choice UNIQUE (vote_id, voter_id, option_id)
);

CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(240),
  type VARCHAR(48) NOT NULL DEFAULT 'progress',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  taken_at TIMESTAMPTZ,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_images_type_check CHECK (type IN ('cover', 'cnib', 'receipt', 'before', 'progress', 'after', 'other')),
  CONSTRAINT project_images_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  CONSTRAINT project_images_location_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tontine_id UUID REFERENCES tontines(id) ON DELETE CASCADE,
  project_id UUID REFERENCES community_projects(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'in_app',
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'unread',
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_channel_check CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  CONSTRAINT notifications_status_check CHECK (status IN ('unread', 'read', 'sent', 'failed', 'archived'))
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tontine_id UUID REFERENCES tontines(id) ON DELETE SET NULL,
  project_id UUID REFERENCES community_projects(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'cnib_verifications',
    'tontines',
    'tontine_members',
    'contributions',
    'guarantors',
    'incidents',
    'votes',
    'vote_options',
    'vote_responses',
    'community_projects',
    'project_images',
    'notifications',
    'admin_actions'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cnib_user_status ON cnib_verifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cnib_number ON cnib_verifications(cnib_number);
CREATE INDEX IF NOT EXISTS idx_tontines_organizer_status ON tontines(organizer_id, status);
CREATE INDEX IF NOT EXISTS idx_tontines_dates ON tontines(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tontine_members_user ON tontine_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tontine_members_tontine_status ON tontine_members(tontine_id, status);
CREATE INDEX IF NOT EXISTS idx_contributions_tontine_cycle ON contributions(tontine_id, cycle_number);
CREATE INDEX IF NOT EXISTS idx_contributions_member_status ON contributions(member_id, status);
CREATE INDEX IF NOT EXISTS idx_contributions_due_date ON contributions(due_date);
CREATE INDEX IF NOT EXISTS idx_guarantors_member_status ON guarantors(member_id, status);
CREATE INDEX IF NOT EXISTS idx_guarantors_user_status ON guarantors(guarantor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_tontine_status ON incidents(tontine_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_member_type ON incidents(member_id, type);
CREATE INDEX IF NOT EXISTS idx_votes_tontine_status ON votes(tontine_id, status);
CREATE INDEX IF NOT EXISTS idx_votes_project ON votes(community_project_id);
CREATE INDEX IF NOT EXISTS idx_vote_options_vote ON vote_options(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_vote_voter ON vote_responses(vote_id, voter_id);
CREATE INDEX IF NOT EXISTS idx_community_projects_status ON community_projects(status);
CREATE INDEX IF NOT EXISTS idx_community_projects_location ON community_projects(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_community_projects_submitted_by ON community_projects(submitted_by);
CREATE INDEX IF NOT EXISTS idx_project_images_project_type ON project_images(project_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_created ON admin_actions(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_targets ON admin_actions(target_user_id, tontine_id, project_id);

CREATE TABLE IF NOT EXISTS app_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_health_checks (label)
VALUES ('fasotontine_database_ready')
ON CONFLICT (label) DO NOTHING;
