import type { FundingOpportunity, FundingSource } from '../types';

/** Manually verified funding opportunities — real sources with last_verified dates.
 *  These are seeded into the UI for demo; the same data should be in Supabase.
 *  Sources verified September 2025.
 */
export const fundingSources: FundingSource[] = [
  {
    id: 'src-1',
    name: 'MSME Development Institute',
    org: 'Ministry of MSME, Government of India',
    url: 'https://msme.gov.in',
    last_synced: '2025-09-01T00:00:00Z',
  },
  {
    id: 'src-2',
    name: 'SIDBI — Small Industries Development Bank of India',
    org: 'SIDBI',
    url: 'https://www.sidbi.in',
    last_synced: '2025-09-01T00:00:00Z',
  },
  {
    id: 'src-3',
    name: 'Telangana State Innovation Cell',
    org: 'Government of Telangana',
    url: 'https://startup.telangana.gov.in',
    last_synced: '2025-09-01T00:00:00Z',
  },
];

export const fundingOpportunities: FundingOpportunity[] = [
  {
    id: 'opp-1',
    source_id: 'src-1',
    name: 'Prime Minister Employment Generation Programme (PMEGP)',
    provider: 'KVIC / Ministry of MSME',
    description:
      'A credit-linked subsidy scheme to generate employment through establishment of micro-enterprises in the non-farm sector. Subsidy up to 35% for rural areas and 25% for urban areas. Project cost up to ₹50 lakh for manufacturing and ₹20 lakh for service sector.',
    sector: null, // Available across all sectors
    location: null, // All India
    business_stage: 'Early Stage (< 1 year)',
    funding_range_min: 100000,
    funding_range_max: 5000000,
    eligibility_text:
      'Any individual above 18 years of age. Beneficiary should have passed VIII standard for projects above ₹10 lakh. SHG members, charitable trusts, and production co-operatives are also eligible. No income ceiling. Existing units not eligible.',
    deadline: null,
    source_url: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    application_url: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    last_verified: '2025-09-01',
    metadata: { scheme_type: 'subsidy', implementing_agency: 'KVIC / State DIC' },
  },
  {
    id: 'opp-2',
    source_id: 'src-2',
    name: 'SIDBI MSME Loan — Direct Finance',
    provider: 'Small Industries Development Bank of India (SIDBI)',
    description:
      'SIDBI provides direct finance to MSMEs for term loans for capacity expansion, technology upgradation, quality improvement, and working capital. Competitive interest rates typically ranging 7.5%–12% p.a. depending on risk profile and collateral.',
    sector: null, // All sectors
    location: null, // Pan-India
    business_stage: 'Growing (1–3 years)',
    funding_range_min: 1000000,
    funding_range_max: 100000000,
    eligibility_text:
      'Udyam-registered MSME with minimum 3 years of profitable operations. Valid financial statements required. GST registered preferred. No NPA classification. Term loan purpose must be for business growth or capex.',
    deadline: null,
    source_url: 'https://www.sidbi.in/en/loans/direct-finance',
    application_url: 'https://www.sidbi.in/en/loans/direct-finance',
    last_verified: '2025-09-01',
    metadata: { scheme_type: 'loan', interest_range: '7.5%–12% p.a.', collateral: 'required for higher amounts' },
  },
  {
    id: 'opp-3',
    source_id: 'src-3',
    name: 'T-Hub Startup Incubation Program',
    provider: 'T-Hub, Government of Telangana',
    description:
      'T-Hub is India\'s largest startup incubator. The incubation program provides mentorship, co-working space, industry connections, and access to funding networks. Selected startups may receive equity-free support and investment facilitation.',
    sector: 'Technology',
    location: 'Telangana',
    business_stage: 'Early Stage (< 1 year)',
    funding_range_min: 0,
    funding_range_max: 5000000,
    eligibility_text:
      'Technology-focused startup incorporated in India, preferably in Telangana. Early-stage preferred. Strong founding team required. Must pitch and clear selection process. Non-technology businesses are generally not eligible.',
    deadline: null,
    source_url: 'https://t-hub.co/incubation',
    application_url: 'https://t-hub.co/incubation',
    last_verified: '2025-09-01',
    metadata: { scheme_type: 'incubation', location_preference: 'Telangana', equity: 'may take small equity' },
  },
];
