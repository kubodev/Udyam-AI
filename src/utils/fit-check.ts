import type { FundingOpportunity, BusinessProfile, FitCheckResult, FitCheckItem, FitStatus } from '../types';

/** Deterministic fit check — compares opportunity requirements against profile fields.
 *  Returns ✓ / ✗ / ? per criterion. Never a numeric score.
 */
export function checkFundingFit(opportunity: FundingOpportunity, profile: BusinessProfile): FitCheckResult {
  const items: FitCheckItem[] = [];

  const check = (criterion: string, status: FitStatus, profileValue: string | null, requiredValue: string | null) => {
    items.push({ criterion, status, profile_value: profileValue, required_value: requiredValue });
  };

  // 1. Sector match
  if (!opportunity.sector) {
    check('Sector eligibility', 'match', profile.sector, 'All sectors eligible');
  } else {
    const sectorMatch = profile.sector?.toLowerCase().includes(opportunity.sector.toLowerCase())
      || opportunity.sector.toLowerCase().includes(profile.sector?.toLowerCase() ?? '');
    check('Sector match', sectorMatch ? 'match' : 'no_match', profile.sector, opportunity.sector);
  }

  // 2. Location match
  if (!opportunity.location) {
    check('Location eligibility', 'match', profile.location ?? profile.state, 'All India eligible');
  } else {
    const locationMatch = (profile.location ?? '').toLowerCase().includes(opportunity.location.toLowerCase())
      || (profile.state ?? '').toLowerCase().includes(opportunity.location.toLowerCase());
    check('Location match', locationMatch ? 'match' : 'no_match', `${profile.location ?? '?'}, ${profile.state ?? '?'}`, opportunity.location);
  }

  // 3. Business stage
  if (opportunity.business_stage) {
    const stageMatch = profile.business_stage === opportunity.business_stage;
    check('Business stage', stageMatch ? 'match' : 'no_match', profile.business_stage, opportunity.business_stage);
  }

  // 4. Revenue / financial data availability
  if (opportunity.funding_range_min && opportunity.funding_range_min > 2000000) {
    // Large funding amounts typically require documented financials
    const hasFinancials = profile.monthly_revenue !== null;
    check('Financial data available', hasFinancials ? 'match' : 'unknown', hasFinancials ? `₹${profile.monthly_revenue?.toLocaleString('en-IN')}/mo revenue` : null, 'Financial records required');
  }

  // 5. Udyam / MSME registration
  const eligText = (opportunity.eligibility_text ?? '').toLowerCase();
  if (eligText.includes('udyam') || eligText.includes('msme registered')) {
    const status = profile.udyam_status;
    const registered = status === 'Registered';
    const pending = status === 'Registration in progress';
    check(
      'Udyam / MSME registration',
      registered ? 'match' : pending ? 'unknown' : 'no_match',
      status,
      'Udyam registered preferred',
    );
  }

  // 6. GST registration
  if (eligText.includes('gst')) {
    const registered = profile.gst_status === 'Registered';
    const pending = profile.gst_status === 'Registration in progress';
    check(
      'GST registration',
      registered ? 'match' : pending ? 'unknown' : 'no_match',
      profile.gst_status,
      'GST registered required',
    );
  }

  // 7. Profile completeness — does the user have enough data for an application?
  const essentialFields = [profile.business_name, profile.description, profile.location, profile.state];
  const completedEssentials = essentialFields.filter(Boolean).length;
  check(
    'Profile completeness for application',
    completedEssentials === essentialFields.length ? 'match' : completedEssentials >= 2 ? 'unknown' : 'no_match',
    `${completedEssentials}/${essentialFields.length} key fields completed`,
    'Full profile recommended',
  );

  const matches = items.filter((i) => i.status === 'match').length;
  const total = items.length;
  const summary = `${matches} of ${total} criteria met — ${items.filter((i) => i.status === 'unknown').length} require more information`;

  return { opportunity_id: opportunity.id, items, summary };
}
