// UN Statistics Division M49 country and area names for the Africa region.
// https://unstats.un.org/unsd/methodology/m49
export const AFRICAN_COUNTRY_AREAS = [
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'British Indian Ocean Territory',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Comoros',
  'Congo',
  'Côte d’Ivoire',
  'Democratic Republic of the Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Eswatini',
  'Ethiopia',
  'French Southern Territories',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Madagascar',
  'Malawi',
  'Mali',
  'Mauritania',
  'Mauritius',
  'Mayotte',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Réunion',
  'Rwanda',
  'Saint Helena',
  'Saint Helena, Ascension and Tristan da Cunha',
  'Sao Tome and Principe',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Tanzania',
  'Togo',
  'Tunisia',
  'Uganda',
  'Western Sahara',
  'Zambia',
  'Zimbabwe'
] as const;

// M49 regions and common English variants used in collection metadata.
export const AFRICAN_GEOGRAPHIC_REGIONS = [
  'North Africa',
  'Northern Africa',
  'West Africa',
  'Western Africa',
  'Central Africa',
  'Middle Africa',
  'East Africa',
  'Eastern Africa',
  'Southern Africa',
  'Sub-Saharan Africa',
  'Maghreb',
  'Nubia',
  'Sahel',
  'Kingdom of Benin'
] as const;

export const AFRICAN_COUNTRY_ALIASES = [
  'Cape Verde',
  'Ivory Coast',
  'Republic of the Congo',
  'São Tomé and Príncipe',
  'Swaziland',
  'The Gambia',
  'United Republic of Tanzania'
] as const;

// Historical regions, polities, and cultural groups found in museum metadata.
export const AFRICAN_CULTURAL_TERMS = [
  'Akan',
  'Aksum',
  'Edo',
  'Fulani',
  'Hausa',
  'Igbo',
  'Kongo',
  'Luba',
  'Swahili',
  'Yoruba',
  'Zulu'
] as const;

export const AFRICAN_SEARCH_TERMS = [
  ...AFRICAN_COUNTRY_AREAS,
  ...AFRICAN_COUNTRY_ALIASES,
  ...AFRICAN_GEOGRAPHIC_REGIONS,
  ...AFRICAN_CULTURAL_TERMS
];

const geographicTerms = new Set(
  [...AFRICAN_COUNTRY_AREAS, ...AFRICAN_COUNTRY_ALIASES, ...AFRICAN_GEOGRAPHIC_REGIONS].map(
    normalizeGeography
  )
);
const allAfricanTerms = new Set(AFRICAN_SEARCH_TERMS.map(normalizeGeography));

export function classifyAfricanGeography(
  countryAndRegion: readonly string[],
  otherFields?: readonly string[]
): 'african' | 'ambiguous' | 'not-african' {
  if (otherFields === undefined) {
    if (containsTerm(countryAndRegion, allAfricanTerms)) return 'african';
    return mentionsAfrica(countryAndRegion) ? 'ambiguous' : 'not-african';
  }

  if (containsTerm(countryAndRegion, geographicTerms)) return 'african';
  if (containsTerm(otherFields, allAfricanTerms)) return 'african';
  if (mentionsAfrica(countryAndRegion) || mentionsAfrica(otherFields)) return 'ambiguous';
  return 'not-african';
}

function normalizeGeography(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function containsTerm(values: readonly string[], terms: ReadonlySet<string>) {
  return values.some((value) => {
    const normalized = ` ${normalizeGeography(value)} `;
    for (const term of terms) {
      if (normalized.includes(` ${term} `)) return true;
    }
    return false;
  });
}

function mentionsAfrica(values: readonly string[]) {
  return values.some((value) => {
    const normalized = ` ${normalizeGeography(value)} `;
    return normalized.includes(' africa ') || normalized.includes(' african ');
  });
}
