/**
 * Demo data for Network & Security Controls
 * Dates around 5 Oct 2026. Strictly ASCII-only.
 */

export const NETWORK_SECURITY_DEMO = [
  {
    id: 'NET-CTL-001',
    control: 'TLS 1.3 / 1.2 Minimum Protocol Enforcement',
    scope: 'Edge Load Balancers & Gateways',
    owner: 'Platform Security Operations',
    status: 'Compliant',
    last_evidence_date: '2026-09-28T14:00:00Z',
    evidence_ref: 'EVD-SEC-TLS-202609',
    standard: 'NIST SP 800-52r2',
    description: 'Disallow SSLv3, TLS 1.0, TLS 1.1 across all public ingress interfaces; enforce forward secrecy cipher suites.',
    exceptions_count: 0
  },
  {
    id: 'NET-CTL-002',
    control: 'Administrative IP Allow-List & Boundary Peering',
    scope: 'Platform Control Plane APIs',
    owner: 'Platform Infrastructure Engineering',
    status: 'Compliant',
    last_evidence_date: '2026-09-20T10:30:00Z',
    evidence_ref: 'EVD-SEC-ALLOWLIST-202609',
    standard: 'CIS Benchmark 4.1',
    description: 'Restrict administrative access to authorized enterprise egress CIDRs and verified Bastion host proxies.',
    exceptions_count: 0
  },
  {
    id: 'NET-CTL-003',
    control: 'Private Service Connect & VPC Service Controls',
    scope: 'Database & Storage Subnets',
    owner: 'Database Reliability Team',
    status: 'Compliant',
    last_evidence_date: '2026-10-02T16:45:00Z',
    evidence_ref: 'EVD-SEC-VPC-PSC-202610',
    standard: 'ISO 27001 A.13.1',
    description: 'All internal relational storage and object stores accessible solely over private IP endpoints without public routing.',
    exceptions_count: 0
  },
  {
    id: 'NET-CTL-004',
    control: 'Web Application Firewall (WAF) OWASP Core Rules',
    scope: 'Public API Gateways & Portal',
    owner: 'Platform Security Operations',
    status: 'Compliant',
    last_evidence_date: '2026-09-15T09:00:00Z',
    evidence_ref: 'EVD-SEC-WAF-202609',
    standard: 'OWASP Top 10 Mitigation',
    description: 'Automated block mode enabled for SQL injection, cross-site scripting, and request rate anomalies.',
    exceptions_count: 0
  },
  {
    id: 'NET-CTL-005',
    control: 'Inter-Service Mutual TLS (mTLS) Mesh',
    scope: 'Internal Microservices Mesh',
    owner: 'Core Infrastructure Ops',
    status: 'Compliant',
    last_evidence_date: '2026-06-15T11:00:00Z',
    evidence_ref: 'EVD-SEC-MTLS-202606',
    standard: 'Zero Trust Architecture NIST 800-207',
    description: 'Strict cryptographic identity validation between internal microservice pods via SPIFFE/SPIRE certificates.',
    exceptions_count: 0
  },
  {
    id: 'NET-CTL-006',
    control: 'Legacy Ingestion Port Egress Lockdown',
    scope: 'State Agency Batch Ingress',
    owner: 'Exchange Foundation Team',
    status: 'Exception',
    last_evidence_date: '2026-09-10T13:20:00Z',
    evidence_ref: 'EXC-NET-202609-02',
    standard: 'Internal Security Policy SEC-NET-07',
    description: 'Time-bound exception permitting outbound SFTP port 22 to State Dept of Education pending API connector cutover.',
    exceptions_count: 1
  },
  {
    id: 'NET-CTL-007',
    control: 'DDoS Rate-Limiting & Ingress Shielding',
    scope: 'Edge CDN & DNS Gateways',
    owner: 'Platform Reliability Operations',
    status: 'Under review',
    last_evidence_date: '2026-10-04T12:00:00Z',
    evidence_ref: 'EVD-SEC-DDOS-202610',
    standard: 'SOC 2 CC6.6',
    description: 'Global threshold monitoring and automatic synthetic challenge invocation under sustained request spikes.',
    exceptions_count: 0
  },
  {
    id: 'NET-CTL-008',
    control: 'Outbound Egress Filtering & DNS Tunneling Protection',
    scope: 'Worker & Transformation Clusters',
    owner: 'Platform Security Operations',
    status: 'Non-compliant',
    last_evidence_date: '2026-06-25T08:00:00Z',
    evidence_ref: 'EVD-SEC-EGRESS-202606',
    standard: 'CIS Benchmark 4.4',
    description: 'Inspect outbound worker traffic against malicious external domains and drop non-whitelisted FQDN queries.',
    exceptions_count: 0
  }
];
