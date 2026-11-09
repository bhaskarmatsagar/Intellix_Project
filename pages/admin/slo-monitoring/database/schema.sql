-- =====================================================================
-- EduData Exchange — SLO Monitoring & Reliability Assurance
-- MySQL 8.0.16+ (CHECK constraints are enforced from 8.0.16)
-- Run:  mysql -u root -p < schema.sql      then   mysql -u root -p < seed.sql
-- All timestamps are stored in UTC.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS edx_slo_monitoring
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edx_slo_monitoring;

-- Drop in dependency order so the script can be re-run during development.
DROP VIEW  IF EXISTS v_monitoring_dashboard;
DROP VIEW  IF EXISTS v_followup_register;
DROP TABLE IF EXISTS followup_review_rounds;
DROP TABLE IF EXISTS followup_evidence_returns;
DROP TABLE IF EXISTS followups;
DROP TABLE IF EXISTS measurement_snapshots;
DROP TABLE IF EXISTS snapshot_batches;
DROP TABLE IF EXISTS portfolio_meta;
DROP TABLE IF EXISTS slo_definitions;
DROP TABLE IF EXISTS governance_history;
DROP TABLE IF EXISTS reviewers;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS services;

-- ---------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------
CREATE TABLE services (
  service_id       VARCHAR(40)  NOT NULL,
  name             VARCHAR(120) NOT NULL,
  tier             VARCHAR(20)  NOT NULL,
  status           VARCHAR(30)  NOT NULL,
  customer_impact  TEXT,
  PRIMARY KEY (service_id)
);

CREATE TABLE incidents (
  incident_id        VARCHAR(40)  NOT NULL,
  title              VARCHAR(200) NOT NULL,
  severity           VARCHAR(30)  NOT NULL,
  operational_state  VARCHAR(40),
  PRIMARY KEY (incident_id)
);

-- People allowed to review evidence. Names are the natural key (the JSON stores names).
CREATE TABLE reviewers (
  display_name  VARCHAR(120) NOT NULL,
  PRIMARY KEY (display_name)
);

-- Page-level facts (product name, role boundary, data classification, methodology ...). Value is JSON text.
CREATE TABLE portfolio_meta (
  meta_key    VARCHAR(60) NOT NULL,
  meta_value  TEXT        NOT NULL,
  PRIMARY KEY (meta_key)
);

-- One row per published measurement batch (replaces the page-level constants in the JSON).
CREATE TABLE snapshot_batches (
  snapshot_id          VARCHAR(40)  NOT NULL,                -- e.g. OBS-20261005-1430
  finalized_at         DATETIME     NOT NULL,
  measurement_source   VARCHAR(200) NOT NULL,
  business_signoff     TEXT,
  version              INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (snapshot_id)
);

-- ---------------------------------------------------------------------
-- SLO standard and current reported position
-- ---------------------------------------------------------------------
CREATE TABLE slo_definitions (
  slo_id                       VARCHAR(40)   NOT NULL,
  service_id                   VARCHAR(40)   NOT NULL,
  name                         VARCHAR(160)  NOT NULL,
  version                      VARCHAR(10)   NOT NULL,
  service_tier                 VARCHAR(20)   NOT NULL,
  sli_definition               TEXT          NOT NULL,
  target_display               VARCHAR(20)   NOT NULL,          -- e.g. '≥ 99.90%'
  target_pct                   DECIMAL(5,2)  NOT NULL,
  window_label                 VARCHAR(40)   NOT NULL,          -- e.g. 'Rolling 30 days'
  current_pct                  DECIMAL(5,2)  NOT NULL,          -- reported value
  status                       ENUM('On Target','At Risk','Breached') NOT NULL,
  -- Separately sourced period aggregates. NEVER derive these from current_pct.
  error_budget_remaining_pct   DECIMAL(5,2)  NULL,
  burn_1h                      DECIMAL(5,2)  NULL,              -- NULL = 'N/A'
  burn_6h                      DECIMAL(5,2)  NULL,
  burn_24h                     DECIMAL(5,2)  NULL,
  breach_forecast              VARCHAR(120),
  specialist_owner             VARCHAR(120)  NOT NULL,
  business_owner               VARCHAR(120),
  PRIMARY KEY (slo_id),
  CONSTRAINT fk_slo_service FOREIGN KEY (service_id) REFERENCES services (service_id),
  CONSTRAINT ck_slo_pct CHECK (target_pct BETWEEN 0 AND 100 AND current_pct BETWEEN 0 AND 100),
  CONSTRAINT ck_slo_budget CHECK (error_budget_remaining_pct IS NULL OR error_budget_remaining_pct BETWEEN 0 AND 100)
);

-- ---------------------------------------------------------------------
-- Measurement evidence (one row per SLO per observation snapshot)
-- ---------------------------------------------------------------------
CREATE TABLE measurement_snapshots (
  snapshot_id             VARCHAR(40)  NOT NULL,                -- e.g. OBS-20261005-1430
  slo_id                  VARCHAR(40)  NOT NULL,
  service_id              VARCHAR(40)  NOT NULL,
  source_reference        VARCHAR(80)  NOT NULL,
  source_owner            VARCHAR(120) NOT NULL,
  observed_at             DATETIME     NOT NULL,
  window_label            VARCHAR(40)  NOT NULL,
  population              TEXT         NOT NULL,
  eligible_count          INT UNSIGNED NOT NULL,
  successful_count        INT UNSIGNED NOT NULL,
  excluded_count          INT UNSIGNED NOT NULL DEFAULT 0,       -- reported separately, never added or removed from eligible
  exclusion_basis         TEXT,
  exclusion_evidence      VARCHAR(80)  NULL,                    -- NULL = no evidence on record
  quality                 VARCHAR(40)  NOT NULL,                -- 'Validated', 'Evidence Limited', ...
  quality_note            TEXT,
  incident_id              VARCHAR(40) NULL,                    -- no FK: some ids (e.g. PLAT-INC-ONCALL) have no incident row
  measurement_treatment   TEXT,
  expected_rate_pct       DECIMAL(5,2) NULL,
  -- SLI = successful eligible / total eligible * 100  (computed, never typed in)
  sli_pct DECIMAL(9,4) GENERATED ALWAYS AS (
    CASE WHEN eligible_count = 0 THEN NULL ELSE ROUND(successful_count * 100 / eligible_count, 4) END
  ) STORED,
  PRIMARY KEY (snapshot_id, slo_id),
  CONSTRAINT fk_snap_batch   FOREIGN KEY (snapshot_id) REFERENCES snapshot_batches (snapshot_id),
  CONSTRAINT fk_snap_slo     FOREIGN KEY (slo_id)     REFERENCES slo_definitions (slo_id),
  CONSTRAINT fk_snap_service FOREIGN KEY (service_id) REFERENCES services (service_id),
  CONSTRAINT ck_snap_counts  CHECK (successful_count <= eligible_count)
);

-- ---------------------------------------------------------------------
-- Follow-up register
-- ---------------------------------------------------------------------
CREATE TABLE followups (
  followup_id                VARCHAR(40)  NOT NULL,
  slo_id                     VARCHAR(40)  NOT NULL,
  title                      VARCHAR(200) NOT NULL,
  priority                   ENUM('P0','P1','P2') NOT NULL,
  status                     ENUM('Awaiting Specialist Evidence',
                                  'Evidence Returned — Review Required',
                                  'Returned — Additional Specialist Evidence Required',
                                  'Closed — Independently Verified') NOT NULL,
  requested_by               VARCHAR(120) NOT NULL,
  requested_at               DATETIME     NOT NULL,
  specialist_owner           VARCHAR(120) NOT NULL,
  due_at                     DATETIME     NOT NULL,
  rationale                  TEXT         NOT NULL,
  -- Summary of the CURRENT review. The full history lives in followup_review_rounds.
  independent_reviewer       VARCHAR(120) NULL,
  review_evidence            VARCHAR(80)  NULL,
  reviewed_at                DATETIME     NULL,
  review_rationale           TEXT         NULL,
  PRIMARY KEY (followup_id),
  CONSTRAINT fk_fup_slo       FOREIGN KEY (slo_id)               REFERENCES slo_definitions (slo_id),
  CONSTRAINT fk_fup_requester FOREIGN KEY (requested_by)         REFERENCES reviewers (display_name),
  CONSTRAINT fk_fup_reviewer  FOREIGN KEY (independent_reviewer) REFERENCES reviewers (display_name),
  CONSTRAINT ck_fup_due           CHECK (due_at > requested_at),
  CONSTRAINT ck_fup_independence  CHECK (independent_reviewer IS NULL OR independent_reviewer <> requested_by),
  CONSTRAINT ck_fup_closed_review CHECK (status <> 'Closed — Independently Verified' OR independent_reviewer IS NOT NULL)
);

-- Every specialist evidence return (append-only: nothing is cleared when evidence is sent back).
CREATE TABLE followup_evidence_returns (
  return_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  followup_id    VARCHAR(40)  NOT NULL,
  evidence_ref   VARCHAR(80)  NOT NULL,
  returned_by    VARCHAR(120) NULL,
  returned_at    DATETIME     NULL,
  PRIMARY KEY (return_id),
  UNIQUE KEY uq_return_ref (followup_id, evidence_ref),          -- a reference cannot be reused on a follow-up
  CONSTRAINT fk_return_fup FOREIGN KEY (followup_id) REFERENCES followups (followup_id)
);

-- Independent review history (append-only).
CREATE TABLE followup_review_rounds (
  round_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  followup_id      VARCHAR(40)  NOT NULL,
  round_no         TINYINT UNSIGNED NOT NULL,
  outcome          ENUM('Closed — Independently Verified',
                        'Returned — Additional Specialist Evidence Required') NOT NULL,
  reviewer         VARCHAR(120) NOT NULL,
  review_evidence  VARCHAR(80)  NOT NULL,
  source_evidence  VARCHAR(80)  NOT NULL,                        -- the specialist evidence that was reviewed
  reviewed_at      DATETIME     NOT NULL,
  rationale        TEXT         NOT NULL,
  PRIMARY KEY (round_id),
  UNIQUE KEY uq_round_no  (followup_id, round_no),
  UNIQUE KEY uq_round_ref (followup_id, review_evidence),
  CONSTRAINT fk_round_fup      FOREIGN KEY (followup_id) REFERENCES followups (followup_id),
  CONSTRAINT fk_round_reviewer FOREIGN KEY (reviewer)    REFERENCES reviewers (display_name),
  CONSTRAINT ck_round_separate CHECK (review_evidence <> source_evidence)
);

-- Rounds can be added, never changed or removed.
CREATE TRIGGER trg_rounds_no_update BEFORE UPDATE ON followup_review_rounds
  FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Review rounds are append-only';
CREATE TRIGGER trg_rounds_no_delete BEFORE DELETE ON followup_review_rounds
  FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Review rounds are append-only';
CREATE TRIGGER trg_returns_no_update BEFORE UPDATE ON followup_evidence_returns
  FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Evidence returns are append-only';
CREATE TRIGGER trg_returns_no_delete BEFORE DELETE ON followup_evidence_returns
  FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Evidence returns are append-only';

-- ---------------------------------------------------------------------
-- Governance decision history (shared pattern with the rest of the module)
-- ---------------------------------------------------------------------
CREATE TABLE governance_history (
  history_id             VARCHAR(40)  NOT NULL,
  domain                 VARCHAR(60)  NOT NULL,
  subject                VARCHAR(200) NOT NULL,
  subject_id             VARCHAR(60)  NOT NULL,
  decision               VARCHAR(200) NOT NULL,
  assurance              VARCHAR(100),
  specialist_owner       VARCHAR(120),
  source_evidence        VARCHAR(80),
  decision_evidence      VARCHAR(80),
  verification_evidence  VARCHAR(80),
  checkpoint             DATETIME NULL,
  recorded_by            VARCHAR(120) NOT NULL,
  recorded_at            DATETIME     NOT NULL,
  status                 ENUM('Open','Closed') NOT NULL,
  PRIMARY KEY (history_id),
  KEY ix_history_subject (subject_id),
  KEY ix_history_recorded (recorded_at)
);

-- ---------------------------------------------------------------------
-- Views used by the API
-- ---------------------------------------------------------------------
-- Dashboard: latest snapshot joined with the SLO position.
CREATE VIEW v_monitoring_dashboard AS
SELECT s.slo_id, s.name AS slo_name, s.service_id, sv.name AS service_name,
       s.target_display, s.target_pct, s.current_pct, s.status,
       s.error_budget_remaining_pct, s.burn_1h, s.burn_6h, s.burn_24h, s.breach_forecast,
       s.specialist_owner, s.window_label,
       m.snapshot_id, m.source_reference, m.eligible_count, m.successful_count, m.excluded_count,
       m.exclusion_evidence, m.quality, m.sli_pct,
       (ABS(m.sli_pct - s.current_pct) < 0.005) AS sli_reconciled,
       (m.excluded_count > 0 AND m.exclusion_evidence IS NULL) AS exclusion_evidence_missing
FROM slo_definitions s
JOIN services sv              ON sv.service_id = s.service_id
JOIN measurement_snapshots m  ON m.slo_id = s.slo_id
WHERE m.snapshot_id = (SELECT snapshot_id FROM snapshot_batches ORDER BY finalized_at DESC LIMIT 1);

