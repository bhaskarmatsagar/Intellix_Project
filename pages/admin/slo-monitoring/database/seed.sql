USE edx_slo_monitoring;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO services (service_id, name, tier, status, customer_impact) VALUES
  ('SVC-PLATFORM', 'EduData Exchange Platform', 'Tier 0', 'Healthy', 'No current customer impact.'),
  ('SVC-API', 'Provider API Gateway', 'Tier 0', 'At Risk', 'Connector-management requests show elevated retries; catalog read traffic remains available.'),
  ('SVC-PIPELINE', 'Data Pipeline Orchestration', 'Tier 0', 'Degraded', 'Four tenant batch windows delayed; no confirmed data loss.'),
  ('SVC-IDENTITY', 'Identity & Access Services', 'Tier 0', 'Healthy', 'No current customer impact.'),
  ('SVC-QUERY', 'Query Workbench', 'Tier 1', 'Healthy', 'No material customer impact.'),
  ('SVC-NOTIFY', 'Provider Notification Service', 'Tier 1', 'Healthy', 'No current customer impact.');

INSERT INTO incidents (incident_id, title, severity, operational_state) VALUES
  ('INC-261005-07', 'Pipeline completion rate below SLO', 'P2 High', 'Investigating'),
  ('INC-261005-09', 'API error-budget consumption elevated', 'P2 High', 'Monitoring'),
  ('INC-261003-03', 'SCIM provisioning latency', 'P2 High', 'Closed'),
  ('INC-260928-04', 'Notification delivery degradation', 'P3 Moderate', 'Closed');

INSERT INTO reviewers (display_name) VALUES
  ('Neel Shah — Platform Reliability Governance'),
  ('Maya Sen — Platform Assurance Reviewer'),
  ('Sana Iyer — Platform Control Assurance');

INSERT INTO portfolio_meta (meta_key, meta_value) VALUES
  ('product', '"EduData Exchange"'),
  ('capability', '"SLO & Reliability Governance"'),
  ('role', '"Platform Admin"'),
  ('data_as_of', '"2026-10-05T14:30:00Z"'),
  ('portfolio_scope', '"Provider platform services across K–12, Higher Education and Community College tenants"'),
  ('role_boundary', '"Platform Admin governs SLO standards and versions, reliability exceptions, escalation policy, maintenance SLO treatment, recovery/corrective assurance and evidence. Platform Operations and specialist reliability teams detect, acknowledge, investigate, recover and execute operational changes. Business/CAB authorities retain execution approval and authorized risk acceptance where required."'),
  ('governance_principle', '"Platform Admin governs the reliability control framework and verifies evidence; specialist teams execute operational work and designated business/CAB authorities approve business-risk or maintenance execution decisions."'),
  ('package_version', '"5.1.0"'),
  ('data_classification', '"Governed demonstration snapshot — not a live telemetry feed"'),
  ('monitoring_methodology', '"Observed ratios are computed from eligible successful/total samples; excluded samples require valid recorded exclusion basis. Error-budget remaining and burn ratios are separately sourced period aggregates and must not be extrapolated from sample ratios."');

INSERT INTO snapshot_batches (snapshot_id, finalized_at, measurement_source, business_signoff, version) VALUES
  ('OBS-20261005-1430', '2026-10-05 14:30:00', 'Provider reliability assurance extracts', 'Follow-up decisions record Platform Admin assessment only; operational metrics and specialist returns remain sourced externally.', 1);

INSERT INTO slo_definitions (slo_id, service_id, name, version, service_tier, sli_definition, target_display, target_pct, window_label, current_pct, status, error_budget_remaining_pct, burn_1h, burn_6h, burn_24h, breach_forecast, specialist_owner, business_owner) VALUES
  ('SLO-PLAT-AVAIL-001', 'SVC-PLATFORM', 'Provider Platform Availability', '3.2', 'Tier 0', 'Successful eligible platform availability observations / total eligible observations', '≥ 99.90%', 99.9, 'Rolling 30 days', 99.97, 'On Target', 70.2, 0.42, 0.61, 0.54, 'No breach forecast', 'Platform Reliability', 'VP, Platform Services'),
  ('SLO-API-SUCCESS-001', 'SVC-API', 'API Successful Request Rate', '2.4', 'Tier 0', 'Successful eligible API requests / total eligible API requests', '≥ 99.90%', 99.9, 'Rolling 30 days', 99.91, 'At Risk', 11.8, 1.62, 1.31, 1.09, 'Watch — elevated consumption', 'API Reliability', 'Director, Integration Platform'),
  ('SLO-PIPE-SUCCESS-001', 'SVC-PIPELINE', 'Pipeline Completion Success', '4.1', 'Tier 0', 'Eligible scheduled pipeline runs completed successfully / total eligible runs', '≥ 99.00%', 99.0, 'Rolling 30 days', 98.84, 'Breached', 0.0, 2.8, 2.12, 1.66, 'Currently breached', 'Data Platform Operations', 'VP, Data Platform'),
  ('SLO-ID-AUTH-001', 'SVC-IDENTITY', 'Identity Authentication Success', '3.0', 'Tier 0', 'Successful eligible authentication transactions / total eligible transactions', '≥ 99.95%', 99.95, 'Rolling 30 days', 99.98, 'On Target', 62.0, 0.3, 0.41, 0.39, 'No breach forecast', 'Identity Engineering', 'Director, Platform Security'),
  ('SLO-QUERY-LAT-001', 'SVC-QUERY', 'Query Workbench Latency', '2.2', 'Tier 1', 'Eligible interactive queries completing within 3 seconds', '≥ 95.00%', 95.0, 'Rolling 30 days', 97.4, 'On Target', 48.0, 0.55, 0.61, 0.58, 'No breach forecast', 'Data Access Operations', 'Director, Data Access'),
  ('SLO-RECOVERY-001', 'SVC-PLATFORM', 'Priority Service Recovery Objective', '1.5', 'Tier 0', 'P1/P2 provider incidents restored within 30 minutes', '≥ 95.00%', 95.0, 'Rolling 90 days', 96.2, 'On Target', 24.0, NULL, NULL, NULL, 'No breach forecast', 'Platform Operations', 'VP, Platform Services');

INSERT INTO measurement_snapshots (snapshot_id, slo_id, service_id, source_reference, source_owner, observed_at, window_label, population, eligible_count, successful_count, excluded_count, exclusion_basis, exclusion_evidence, quality, quality_note, incident_id, measurement_treatment, expected_rate_pct) VALUES
  ('OBS-20261005-1430', 'SLO-PLAT-AVAIL-001', 'SVC-PLATFORM', 'EVD-METRICS-PLAT-0510', 'Platform Reliability', '2026-10-05 14:22:00', 'Rolling 30 days', 'Availability checks from the provider platform ingress', 1000000, 999700, 350, 'No unapproved exclusions', 'EVD-EXCL-PLAT-20261005', 'Validated', 'Source observation, scope and denominator reconciled.', 'PLAT-INC-ONCALL', 'Excluded population reconciled to applicable control policy.', 99.97),
  ('OBS-20261005-1430', 'SLO-API-SUCCESS-001', 'SVC-API', 'EVD-METRICS-API-0510', 'API Reliability', '2026-10-05 14:25:00', 'Rolling 30 days', 'Eligible HTTP success responses from the API edge', 1000000, 999100, 1200, 'Authorized planned probe exclusion only', 'EVD-EXCL-API-20261005', 'Validated', 'Source observation, scope and denominator reconciled.', 'INC-261005-09', 'Excluded population reconciled to applicable control policy.', 99.91),
  ('OBS-20261005-1430', 'SLO-PIPE-SUCCESS-001', 'SVC-PIPELINE', 'EVD-METRICS-PIPE-0510', 'Data Platform Operations', '2026-10-05 14:10:00', 'Rolling 30 days', 'Scheduled eligible tenant batch completions', 50000, 49420, 80, '80 specialist-classified test executions excluded; signed exclusion attestation outstanding', NULL, 'Evidence Limited', 'Source aggregation credible; exclusion attestation pending independent review.', 'INC-261005-07', 'Unapproved exclusions cannot be treated as approved SLO exclusions.', 98.84),
  ('OBS-20261005-1430', 'SLO-ID-AUTH-001', 'SVC-IDENTITY', 'EVD-METRICS-ID-0510', 'Identity Engineering', '2026-10-05 14:18:00', 'Rolling 30 days', 'Eligible interactive authentication completions', 500000, 499900, 240, 'Signed synthetic test exclusion record', 'EVD-EXCL-ID-20261005', 'Validated', 'Source observation, scope and denominator reconciled.', 'INC-261003-03', 'Excluded population reconciled to applicable control policy.', 99.98),
  ('OBS-20261005-1430', 'SLO-QUERY-LAT-001', 'SVC-QUERY', 'EVD-METRICS-QUERY-0510', 'Data Access Operations', '2026-10-05 13:25:00', 'Rolling 30 days', 'Eligible queries meeting the governed p95/p99 latency criterion', 100000, 97400, 620, 'Nonproduction benchmark runs excluded', 'EVD-EXCL-QUERY-20261005', 'Validated', 'Source observation, scope and denominator reconciled.', 'INC-260928-04', 'Excluded population reconciled to applicable control policy.', 97.4),
  ('OBS-20261005-1430', 'SLO-RECOVERY-001', 'SVC-PLATFORM', 'EVD-METRICS-RECOVERY-0510', 'Platform Operations', '2026-10-05 14:12:00', 'Rolling 90 days', 'Qualifying recovery objectives verified in rolling 90-day assurance cohort', 500, 481, 0, 'No exclusions', 'EVD-EXCL-RECOVERY-20261005', 'Validated', 'Source observation, scope and denominator reconciled.', 'INC-261003-03', 'Excluded population reconciled to applicable control policy.', 96.2);

INSERT INTO followups (followup_id, slo_id, title, priority, status, requested_by, requested_at, specialist_owner, due_at, rationale, independent_reviewer, review_evidence, reviewed_at, review_rationale) VALUES
  ('FUP-SLO-2601', 'SLO-API-SUCCESS-001', 'API error-budget acceleration and customer impact', 'P0', 'Evidence Returned — Review Required', 'Neel Shah — Platform Reliability Governance', '2026-10-05 13:20:00', 'API Reliability', '2026-10-05 16:00:00', 'Require verified cause, 1h/6h/24h burn trajectory and tenant impact by service tier.', NULL, NULL, NULL, NULL),
  ('FUP-SLO-2602', 'SLO-PIPE-SUCCESS-001', 'Pipeline breached target: exclusion and recovery evidence', 'P0', 'Awaiting Specialist Evidence', 'Neel Shah — Platform Reliability Governance', '2026-10-05 13:40:00', 'Data Platform Operations', '2026-10-05 15:30:00', 'Require exclusion authority, customer backlog and recovery verification. Existing exception request is not a waiver of measured breach.', NULL, NULL, NULL, NULL),
  ('FUP-SLO-2603', 'SLO-PLAT-AVAIL-001', 'Provider availability audit sample verification', 'P2', 'Evidence Returned — Review Required', 'Neel Shah — Platform Reliability Governance', '2026-10-05 10:00:00', 'Platform Reliability', '2026-10-05 17:00:00', 'Confirm observation source and eligibility filters for the provider ingress cohort.', NULL, NULL, NULL, NULL),
  ('FUP-SLO-2604', 'SLO-ID-AUTH-001', 'Authentication synthetic exclusion reconciliation', 'P2', 'Evidence Returned — Review Required', 'Neel Shah — Platform Reliability Governance', '2026-10-05 10:20:00', 'Identity Engineering', '2026-10-05 17:20:00', 'Check synthetic-probe exclusions against published SLI standard.', NULL, NULL, NULL, NULL),
  ('FUP-SLO-2605', 'SLO-QUERY-LAT-001', 'Query latency percentile cohort validation', 'P2', 'Returned — Additional Specialist Evidence Required', 'Neel Shah — Platform Reliability Governance', '2026-10-05 09:00:00', 'Query Reliability', '2026-10-05 18:00:00', 'Source return did not include exclusion sample mapping; specialist evidence required.', 'Maya Sen — Platform Assurance Reviewer', 'EVD-QUERY-RETURN-0510', '2026-10-05 12:45:00', 'Returned evidence lacked signed exclusion mappings.'),
  ('FUP-SLO-2606', 'SLO-RECOVERY-001', 'Recovery cohort objective assurance', 'P2', 'Closed — Independently Verified', 'Neel Shah — Platform Reliability Governance', '2026-10-04 10:00:00', 'Platform Reliability', '2026-10-05 12:00:00', 'Recovery test objective and sampled PIR reconciliation complete.', 'Maya Sen — Platform Assurance Reviewer', 'EVD-RECOVERY-INDEP-0510', '2026-10-05 11:20:00', 'Sample complete with no open treatment discrepancy.');

INSERT INTO followup_evidence_returns (followup_id, evidence_ref, returned_by, returned_at) VALUES
  ('FUP-SLO-2601', 'EVD-API-BURN-DRILLDOWN-0510', 'API Reliability', '2026-10-05 14:10:00'),
  ('FUP-SLO-2603', 'EVD-PLATFORM-AVAIL-SAMPLE-0510', 'Platform Reliability', '2026-10-05 13:45:00'),
  ('FUP-SLO-2604', 'EVD-ID-ELIGIBILITY-0510', 'Identity Engineering', '2026-10-05 14:08:00'),
  ('FUP-SLO-2605', 'EVD-QUERY-INITIAL-0510', 'Query Reliability', NULL),
  ('FUP-SLO-2606', 'EVD-RECOVERY-COHORT-0510', 'Platform Reliability', '2026-10-05 09:30:00');

INSERT INTO followup_review_rounds (followup_id, round_no, outcome, reviewer, review_evidence, source_evidence, reviewed_at, rationale) VALUES
  ('FUP-SLO-2605', 1, 'Returned — Additional Specialist Evidence Required', 'Maya Sen — Platform Assurance Reviewer', 'EVD-QUERY-RETURN-0510', 'EVD-QUERY-INITIAL-0510', '2026-10-05 12:45:00', 'Missing cohort exclusion mapping.'),
  ('FUP-SLO-2606', 1, 'Closed — Independently Verified', 'Maya Sen — Platform Assurance Reviewer', 'EVD-RECOVERY-INDEP-0510', 'EVD-RECOVERY-COHORT-0510', '2026-10-05 11:20:00', 'Sample complete with no open treatment discrepancy.');

INSERT INTO governance_history (history_id, domain, subject, subject_id, decision, assurance, specialist_owner, source_evidence, decision_evidence, verification_evidence, checkpoint, recorded_by, recorded_at, status) VALUES
  ('GOV-20261005-01', 'SLO', 'API Successful Request Rate', 'SLO-API-SUCCESS-001', 'Enhanced Oversight', 'Follow-up Required', 'API Reliability', 'EVD-SLO-API-POSITION-20261005', 'EVD-SLO-API-GOV-DEC-20261005', NULL, '2026-10-05 16:00:00', 'Platform Admin — Reliability Governance', '2026-10-05 14:05:00', 'Open'),
  ('GOV-20261005-02', 'SLO', 'Pipeline Completion Success', 'SLO-PIPE-SUCCESS-001', 'Reliability Exception Under Review', 'Review Required', 'Data Platform Operations', 'EVD-SLO-PIPE-BREACH-20261005', 'EVD-REX-PIPE-REQUEST-20261005', NULL, '2026-10-05 15:30:00', 'Platform Admin — Reliability Governance', '2026-10-05 14:10:00', 'Open'),
  ('GOV-20261005-03', 'Maintenance', 'API gateway certificate rotation', 'MW-261007-01', 'Platform Governance Cleared — Conditions Current', 'Post-Maintenance Reconciliation Required', 'API Reliability', 'EVD-CAB-MW-261007-01-APPROVAL', 'EVD-MW-API-20261005', NULL, '2026-10-07 03:00:00', 'Platform Admin — Reliability Governance', '2026-10-05 13:35:00', 'Open'),
  ('GOV-20261005-04', 'Incident', 'SCIM provisioning latency', 'INC-261003-03', 'Recovery Verified', 'Assurance Current', 'Identity Engineering', 'EVD-INC-SCIM-RECOVERY-20261004', 'EVD-INC-SCIM-ASSURANCE-DEC', 'EVD-PIR-SCIM-20261004', NULL, 'Platform Admin — Reliability Governance', '2026-10-04 16:20:00', 'Closed'),
  ('GOV-20261005-05', 'Corrective Action', 'Provisioning preflight validation', 'CA-261003-688', 'Outcome Verified', 'Assurance Current', 'Identity Engineering', 'EVD-CA-688-RETURN', 'EVD-CA-688-DECISION', 'EVD-CA-688-ASSURANCE', NULL, 'Platform Admin — Reliability Governance', '2026-10-05 10:15:00', 'Closed'),
  ('GOV-20261005-06', 'Alert Escalation', 'Pipeline completion threshold alert', 'ALT-261005-1042', 'Incident Linkage Confirmed — Follow-up Required', 'Follow-up Required', 'Data Platform Operations', 'EVD-ALT-PIPE-20261005', 'EVD-ALT-PIPE-GOV-DEC', 'EVD-INC-LINK-261005-07', '2026-10-05 15:30:00', 'Platform Admin — Reliability Governance', '2026-10-05 14:12:00', 'Open'),
  ('GOV-20261005-07', 'Reliability Exception', 'Pipeline completion reliability risk acceptance request', 'REX-PIPE-20261005-01', 'Decision Pending', 'Authority Review Required', 'Data Platform Operations', 'INC-261005-07', NULL, NULL, '2026-10-05 15:30:00', 'Platform Admin — Reliability Governance', '2026-10-05 14:15:00', 'Open'),
  ('GOV-20260930-08', 'Maintenance Reconciliation', 'Query warehouse driver maintenance', 'MW-260930-04', 'Reconciliation Verified — Overrun Accounted', 'Assurance Current', 'Data Access Operations', 'EVD-MW-260930-EXEC', 'EVD-MW-260930-PRE', 'EVD-MW-260930-RECON', NULL, 'Platform Admin — Reliability Governance', '2026-09-30 04:10:00', 'Closed'),
  ('GOV-20261005-09', 'SLO Standard', 'Identity Authentication Success', 'SLO-ID-AUTH-001', 'Approved Amendment — Effectuation Due', 'Governed Standard Change', 'Identity Engineering', 'EVD-SLO-ID-V30-CURRENT', 'EVD-SLO-ID-V31-AUTH', NULL, '2026-10-05 14:00:00', 'Platform Admin — Reliability Governance', '2026-10-05 13:30:00', 'Open'),
  ('GOV-20261005-10', 'SLO Standard', 'Priority Service Recovery Objective', 'SLO-RECOVERY-001', 'Suspend Authorized — Effective Pending', 'Lifecycle Governance', 'Platform Reliability', 'EVD-SLO-RECOVERY-CURRENT', 'EVD-SLO-RECOVERY-SUSP-20261005', NULL, '2026-10-20 00:00:00', 'Platform Admin — Reliability Governance', '2026-10-05 13:40:00', 'Open'),
  ('GOV-20261005-11', 'Reliability Exception', 'Identity federation transition risk acceptance', 'REX-ID-20261006-02', 'Authorized — Effective Pending', 'Time-Bound Risk Acceptance', 'Identity Engineering', 'EVD-ID-FED-CUTOVER-READINESS', 'EVD-REX-ID-20261006-DEC', NULL, '2026-10-06 00:30:00', 'Platform Admin — Reliability Governance', '2026-10-05 13:50:00', 'Open'),
  ('GOV-20261005-12', 'Reliability Exception', 'API dependency retry risk acceptance', 'REX-API-20261005-03', 'Authorized — Expiry Approaching', 'Time-Bound Risk Acceptance', 'API Reliability', 'EVD-API-UPSTREAM-20261005', 'EVD-REX-API-20261005-DEC', NULL, '2026-10-05 17:00:00', 'Platform Admin — Reliability Governance', '2026-10-05 12:05:00', 'Open'),
  ('GOV-20261005-13', 'Alert Escalation Policy', 'P3 query advisory condition', 'RP-P3-QUERY', 'Amendment Authorized — Effective Pending', 'Policy Governance', 'Platform Reliability Governance', 'EVD-RP-P3-QUERY-V21', 'EVD-RP-P3-QUERY-V22-AUTH', NULL, '2026-10-15 00:00:00', 'Platform Admin — Reliability Governance', '2026-10-05 13:45:00', 'Open');

SET FOREIGN_KEY_CHECKS = 1;
