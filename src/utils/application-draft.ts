import type { BusinessProfile, FundingOpportunity, ApplicationDraftContent } from '../types';

const MISSING = (field: string) => `[Missing: ${field} — please provide this information.]`;

/** Fill an application draft template from real profile data.
 *  Any section lacking data renders a [Missing: field] flag — never silently filled.
 */
export function createApplicationDraft(
  opportunity: FundingOpportunity,
  profile: BusinessProfile,
): { content: ApplicationDraftContent; missingFields: string[] } {
  const missingFields: string[] = [];

  const need = (value: string | null | undefined, fieldName: string): string => {
    if (value && value.trim()) return value.trim();
    missingFields.push(fieldName);
    return MISSING(fieldName);
  };

  const optional = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

  const revenue = profile.monthly_revenue
    ? `approximately ₹${profile.monthly_revenue.toLocaleString('en-IN')} per month`
    : null;
  const expenses = profile.monthly_expenses
    ? `approximately ₹${profile.monthly_expenses.toLocaleString('en-IN')} per month`
    : null;

  const content: ApplicationDraftContent = {
    business_overview:
      `${need(profile.business_name, 'Business name')} is a ${optional(profile.business_type, 'business')} in the ${need(profile.sector, 'Sector')} sector, ` +
      `based in ${optional(profile.location, MISSING('City / Location'))}, ${optional(profile.state, MISSING('State'))}. ` +
      `The business is currently in the ${optional(profile.business_stage, 'growth')} stage.`,

    current_business:
      need(profile.description, 'Business description') +
      (revenue ? ` Monthly revenue stands at ${revenue}.` : '') +
      (expenses ? ` Monthly operating expenses are ${expenses}.` : '') +
      (profile.employee_count ? ` The business employs ${profile.employee_count} people.` : ''),

    problem_opportunity:
      `${optional(profile.business_name, 'The business')} seeks to ${need(profile.primary_goal, 'Primary goal')}. ` +
      `This funding opportunity from ${optional(opportunity.provider, 'the provider')} aligns with our growth objectives.`,

    growth_plan:
      `With the requested funding, ${optional(profile.business_name, 'the business')} plans to ${need(profile.use_of_funds, 'Use of funds')}. ` +
      `This will strengthen our position in the ${optional(profile.sector, 'sector')} and create sustainable growth.`,

    funding_requirement:
      profile.funding_requirement
        ? `We are seeking ₹${profile.funding_requirement.toLocaleString('en-IN')} in funding. ` +
          `The opportunity offers a range of ₹${(opportunity.funding_range_min ?? 0).toLocaleString('en-IN')} – ₹${(opportunity.funding_range_max ?? 0).toLocaleString('en-IN')}.`
        : MISSING('Funding requirement amount'),

    use_of_funds:
      need(profile.use_of_funds, 'Use of funds') +
      ` This targeted investment will directly support ${optional(profile.primary_goal, 'our primary business goal')}.`,

    expected_impact:
      `The funding will enable ${optional(profile.business_name, 'the business')} to achieve ${optional(profile.primary_goal, 'its goals')}, ` +
      `contributing positively to the local ${optional(profile.sector, '')} ecosystem in ${optional(profile.state, 'the region')}.`,
  };

  return { content, missingFields };
}
