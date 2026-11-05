export const AFRICAN_REGIONS = {
  north: ['Algeria', 'Egypt', 'Libya', 'Morocco', 'Sudan', 'Tunisia', 'Nubia', 'Maghreb'],
  west: ['Benin', 'Burkina Faso', 'Ghana', 'Guinea', 'Ivory Coast', 'Mali', 'Nigeria', 'Senegal', 'Yoruba', 'Akan', 'Sahel'],
  central: ['Cameroon', 'Central African Republic', 'Congo', 'Gabon', 'Kongo', 'Luba'],
  east: ['Ethiopia', 'Eritrea', 'Kenya', 'Somalia', 'Tanzania', 'Uganda', 'Aksum', 'Swahili'],
  southern: ['Angola', 'Botswana', 'Mozambique', 'Namibia', 'South Africa', 'Zambia', 'Zimbabwe', 'Zulu']
} as const;

const recognizedTerms = new Set(Object.values(AFRICAN_REGIONS).flat().map((term) => term.toLowerCase()));

export function classifyAfricanGeography(values: readonly string[]): 'african' | 'ambiguous' | 'not-african' {
  const normalized = values.map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (normalized.some((value) => recognizedTerms.has(value))) return 'african';
  if (normalized.some((value) => value.includes('africa'))) return 'ambiguous';
  return 'not-african';
}
