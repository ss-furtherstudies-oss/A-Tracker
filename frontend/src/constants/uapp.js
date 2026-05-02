// Shared constants and utility functions for University Applications

export const LOCATION_MAP = {
  'HK': 'Hong Kong SAR',
  'UK': 'United Kingdom',
  'US': 'United States',
  'CA': 'Canada',
  'AU': 'Australia',
  'CN': 'China Mainland',
  'TW': 'Taiwan',
  'JP': 'Japan'
};

export const REVERSE_LOCATION_MAP = Object.entries(LOCATION_MAP).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {});

export const isTruthyCell = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
};

export const normalizeCountry = (val) => {
  if (!val) return '';
  const loc = String(val).toLowerCase().trim();
  const map = {
    'hk': 'Hong Kong SAR', 'hong kong': 'Hong Kong SAR', 'hong kong sar': 'Hong Kong SAR', 'hong kong sar, china': 'Hong Kong SAR',
    'uk': 'United Kingdom', 'united kingdom': 'United Kingdom', 'great britain': 'United Kingdom',
    'us': 'United States', 'usa': 'United States', 'united states': 'United States', 'united states of america': 'United States',
    'ca': 'Canada', 'canada': 'Canada',
    'au': 'Australia', 'australia': 'Australia',
    'cn': 'China Mainland', 'china': 'China Mainland', 'mainland china': 'China Mainland', 'china (mainland)': 'China Mainland',
    'tw': 'Taiwan', 'taiwan': 'Taiwan', 'taiwan, china': 'Taiwan',
    'jp': 'Japan', 'japan': 'Japan',
    'sg': 'Singapore', 'singapore': 'Singapore',
    'nl': 'Netherlands', 'netherlands': 'Netherlands',
    'de': 'Germany', 'germany': 'Germany',
    'kr': 'South Korea', 'south korea': 'South Korea', 'korea, south': 'South Korea', 'republic of korea': 'South Korea',
    'ch': 'Switzerland', 'switzerland': 'Switzerland'
  };
  return map[loc] || String(val).trim();
};

export const deriveStatus = (offerType, decision) => {
  if (isTruthyCell(offerType)) return 'OFFER';
  const d = String(decision || '').toLowerCase();
  if (d.includes('rej') || d.includes('declined')) return 'REJECTED';
  if (d.includes('wait')) return 'WAITLIST';
  if (d.includes('withdrawn')) return 'WITHDRAWN';
  return 'PENDING';
};

export const normalizeUniKey = (value) => String(value ?? '').trim().toUpperCase();
