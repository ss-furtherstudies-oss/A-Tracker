// ─── Grade ordering & colors ────────────────────────────────────────────────
export const LETTER_GRADES = ['U', 'E', 'D', 'C', 'B', 'A', 'A*'];
export const IGCSE_LETTER_GRADES = ['U', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'A*'];
export const NUMERIC_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const GRADE_COLORS = {
  'U':  '#ef4444', 'E':  '#f97316', 'D':  '#f59e0b',
  'F':  '#fb7185', 'G':  '#fda4af',
  'C':  '#eab308', 'B':  '#84cc16', 'A':  '#22c55e', 'A*': '#10b981',
  '1':  '#ef4444', '2':  '#f97316', '3':  '#f59e0b', '4':  '#eab308',
  '5':  '#84cc16', '6':  '#22c55e', '7':  '#14b8a6', '8':  '#6366f1', '9':  '#8b5cf6',
};

export const normalizeIGCSEGrade = (grade) => {
  const g = String(grade || '').toUpperCase().trim();
  return IGCSE_LETTER_GRADES.includes(g) ? g : '';
};

export const normalizeIGCSENumericGrade = (grade) => {
  const g = String(grade || '').trim();
  return NUMERIC_GRADES.includes(g) ? g : '';
};

// ─── Program classification ──────────────────────────────────────────────────
export const FIELD_KEYWORDS = {
  'Natural Science':  ['science', 'physics', 'chemistry', 'biology', 'math', 'statistics', 'biochemistry', 'geology', 'environmental', 'computer', 'data', 'it ', 'cs', 'computing', 'biomedical', 'astronomy', 'pharmacology', 'ecology', 'natural', 'pure', 'quantitative'],
  'Social Science':   ['social', 'psychology', 'sociology', 'political', 'geography', 'history', 'law', 'philosophy', 'media', 'communication', 'linguistics', 'education', 'english', 'anthropology', 'criminology', 'international relations', 'public policy', 'theology', 'literature'],
  'Health Science':   ['medicine', 'medical', 'nursing', 'pharmacy', 'health', 'dental', 'physiotherapy', 'nutrition', 'food', 'veterinary', 'radiography', 'optometry', 'surgery', 'clinical'],
  'Business':         ['business', 'bba', 'finance', 'accounting', 'management', 'marketing', 'commerce', 'economics', 'actuarial', 'entrepreneurship', 'hospitality', 'real estate', 'supply chain', 'audit', 'bank'],
  'Engineering':      ['engineering', 'civil', 'mechanical', 'electrical', 'electronic', 'chemical engineering', 'aerospace', 'architecture', 'robotics', 'structural', 'tech'],
  'Arts & Humanities':['art', 'design', 'music', 'film', 'drama', 'fashion', 'visual', 'creative', 'fine art', 'languages', 'translation', 'archaeology', 'classics', 'journalism', 'photography'],
};

export const classifyProgram = (program) => {
  if (!program || program === '-') return 'Inter-disciplinary';
  const p = program.toLowerCase();
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if (keywords.some(k => p.includes(k))) return field;
  }
  return 'Inter-disciplinary';
};

// ─── Country mapping from university name ────────────────────────────────────
export const COUNTRY_KEYWORDS = {
  'Australia':      ['australian', 'melbourne', 'sydney', 'queensland', 'monash', 'unsw', 'anu', 'uwa', 'adelaide', 'macquarie', 'rmit', 'curtin', 'deakin', 'griffith', 'tasmania', 'swinburne', 'uts', 'la trobe', 'wollongong', 'australia', 'au)', '(au'],
  'United Kingdom': ['oxford', 'cambridge', 'imperial', 'ucl', 'london', 'edinburgh', 'manchester', 'bristol', 'warwick', 'exeter', 'bath', 'durham', 'king ', 'queen ', 'nottingham', 'southampton', 'glasgow', 'st andrews', 'lse', 'goldsmiths', 'kingston', 'leeds', 'birmingham', 'sheffield', 'sussex', 'surrey', 'kent', 'leicester', 'reading', 'lancaster', 'loughborough', 'newcastle', 'cardiff', 'swansea', 'aberdeen', 'strathclyde', 'stirling', 'dundee', 'royal holloway', 'city university of london', 'brunel', 'westminster', 'hertfordshire', 'anglia ruskin', 'northumbria', 'plymouth', 'central lancashire', 'salford', 'portsmouth', 'brighton', 'huddersfield', 'lincoln', 'roehampton', 'gloucestershire', 'coventry', 'york', 'liverpool', 'uk)', '(uk'],
  'Hong Kong SAR':  ['hong kong', 'hku', 'cuhk', 'hkust', 'polyu', 'cityu', 'lingnan', 'chu hai', 'hkbu', 'shue yan', 'hkmu', 'hsuhk', 'hkapa', 'twc', 'vtc', 'hk)', '(hk'],
  'United States':  ['harvard', 'mit', 'stanford', 'yale', 'princeton', 'columbia', 'chicago', 'pennsylvania', 'cornell', 'university of california', 'uc ', 'ucla', 'usc', 'duke', 'johns hopkins', 'purdue', 'davis', 'san diego', 'michigan', 'northwestern', 'nyu', 'carnegie', 'georgia tech', 'caltech', 'penn state', 'texas', 'florida', 'wisconsin', 'maryland', 'boston', 'ohio state', 'washington', 'minnesota', 'purdue', 'rice', 'notre dame', 'vanderbilt', 'emory', 'us)', '(us'],
  'Canada':         ['toronto', 'mcgill', 'ubc', 'waterloo', 'alberta', 'queens', 'dalhousie', 'ottawa', 'western', 'montreal', 'calgary', 'simon fraser', 'mcmaster', 'victoria', 'saskatchewan', 'york u', 'concordia', 'canada', 'ca)', '(ca'],
  'Singapore':      ['singapore', 'nus', 'ntu', 'smu', 'sutd', 'sg)', '(sg'],
  'Netherlands':    ['delft', 'netherlands', 'leiden', 'amsterdam', 'rotterdam', 'eindhoven', 'twente', 'utrecht', 'groningen', 'maastricht', 'wageningen', 'nijmegen', 'nl)', '(nl'],
  'Japan':          ['tokyo', 'kyoto', 'osaka', 'waseda', 'keio', 'nagoya', 'hiroshima', 'tohoku', 'kyushu', 'hokudai', 'tokyotech', 'japan', 'jp)', '(jp'],
  'Germany':        ['munich', 'berlin', 'heidelberg', 'hamburg', 'frankfurt', 'bonn', 'tübingen', 'freiburg', 'lmu', 'rwth', 'karlsruhe', 'dresden', 'stuttgart', 'germany', 'de)', '(de'],
  'China Mainland': ['peking', 'tsinghua', 'fudan', 'zhejiang', 'nanjing', 'tongji', 'wuhan', 'renmin', 'sun yat', 'sjtu', 'ustc', 'harbin', 'xian jiaotong', 'sichuan', 'shandong', 'beihang', 'china', 'cn)', '(cn'],
  'Taiwan':         ['taiwan', 'nthu', 'ntu', 'ncku', 'yuan ze', 'tamkang', 'nctu', 'nsysu', 'ntust', 'tw)', '(tw'],
};

export const inferCountry = (uniName) => {
  if (!uniName || uniName === '-') return null;
  const name = uniName.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some(k => name.includes(k))) return country;
  }
  return 'Other';
};

export const FIELD_COLORS = {
  'Natural Science':  '#14b8a6',
  'Social Science':   '#6366f1',
  'Health Science':   '#f43f5e',
  'Business':         '#f59e0b',
  'Engineering':      '#3b82f6',
  'Arts & Humanities':'#a855f7',
  'Inter-disciplinary': '#94a3b8',
};
