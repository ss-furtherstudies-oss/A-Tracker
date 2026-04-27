/**
 * Import/export utility functions extracted from StudentsGrid.jsx.
 * Contains subject normalization logic used during Excel import.
 */
import {
  IGCSE_SUBJECTS, IAS_SUBJECTS, IAL_SUBJECTS,
} from '../constants/subjects';

// ─── Normalization Helpers ──────────────────────────────────────────────────

export const normalizeToken = (value) =>
  String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

// ─── Canonical Subject Code Mapping ─────────────────────────────────────────

export const SUBJECT_CANONICAL_MAP = {
  IG: {
    ENG: { CIE: '0500', 'Pearson Edexcel': '4EA1' },
    CHI: { CIE: '0509', 'Pearson Edexcel': '4CN1' },
    MA: { CIE: '0580', 'Pearson Edexcel': '4MA1' },
    AMA: { CIE: '0606', 'Pearson Edexcel': '4PM1' },
    PH: { CIE: '0625', 'Pearson Edexcel': '4PH1' },
    CM: { CIE: '0620', 'Pearson Edexcel': '4CH1' },
    BO: { CIE: '0610', 'Pearson Edexcel': '4BI1' },
    AC: { CIE: '0452', 'Pearson Edexcel': '4AC1' },
    BS: { CIE: '0450', 'Pearson Edexcel': '4BS1' },
    EC: { CIE: '0455', 'Pearson Edexcel': '4EC1' },
    GE: { CIE: '0460', 'Pearson Edexcel': '4GE1' },
    VA: { CIE: '0400', 'Pearson Edexcel': '4FA1' }
  },
  AS: {
    ENG: { CIE: '9093', 'Pearson Edexcel': 'XEN01' },
    CHI: { CIE: '9093', 'Pearson Edexcel': 'XEN01' },
    MA: { CIE: '9709', 'Pearson Edexcel': 'XMA01' },
    FMA: { CIE: '9231', 'Pearson Edexcel': 'XFM01' },
    PH: { CIE: '9702', 'Pearson Edexcel': 'XPH11' },
    CM: { CIE: '9701', 'Pearson Edexcel': 'XCH11' },
    BO: { CIE: '9700', 'Pearson Edexcel': 'XBI11' },
    AC: { CIE: '9706', 'Pearson Edexcel': 'XAC11' },
    BS: { CIE: '9609', 'Pearson Edexcel': 'XBS11' },
    EC: { CIE: '9708', 'Pearson Edexcel': 'XEC11' },
    GE: { CIE: '9708', 'Pearson Edexcel': 'XGE01' }
  },
  AL: {
    ENG: { CIE: '9093', 'Pearson Edexcel': '9EN0' },
    CHI: { CIE: '9093', 'Pearson Edexcel': '9CN0' },
    MA: { CIE: '9709', 'Pearson Edexcel': 'YMA01' },
    FMA: { CIE: '9231', 'Pearson Edexcel': 'YFM01' },
    PH: { CIE: '9702', 'Pearson Edexcel': 'YPH11' },
    CM: { CIE: '9701', 'Pearson Edexcel': 'YCH11' },
    BO: { CIE: '9700', 'Pearson Edexcel': 'YBI11' },
    AC: { CIE: '9706', 'Pearson Edexcel': 'YAC11' },
    BS: { CIE: '9609', 'Pearson Edexcel': 'YBS11' },
    EC: { CIE: '9708', 'Pearson Edexcel': 'YEC11' },
    GE: { CIE: '9708', 'Pearson Edexcel': 'YGE01' },
    VA: { CIE: '9479', 'Pearson Edexcel': '9FA0' }
  }
};

// ─── Subject Alias → Canonical Key ──────────────────────────────────────────

export const SUBJECT_ALIAS_MAP = {
  ENG: 'ENG', EN: 'ENG', ENGLISH: 'ENG',
  CHI: 'CHI', CN: 'CHI', CHINESE: 'CHI',
  MA: 'MA', MATH: 'MA', MATHS: 'MA', MATHEMATICS: 'MA',
  AMA: 'AMA', ADDITIONALMATHEMATICS: 'AMA', ADDMATH: 'AMA',
  FMA: 'FMA', FM: 'FMA', FURTHERMATHEMATICS: 'FMA',
  PH: 'PH', PHY: 'PH', PHYSICS: 'PH',
  CM: 'CM', CHEM: 'CM', CHEMISTRY: 'CM',
  BO: 'BO', BIO: 'BO', BIOLOGY: 'BO',
  AC: 'AC', ACC: 'AC', ACCOUNTING: 'AC',
  BS: 'BS', BU: 'BS', BUSINESS: 'BS', BUSINESSSTUDIES: 'BS',
  EC: 'EC', ECO: 'EC', ECONOMICS: 'EC',
  GE: 'GE', GEO: 'GE', GEOGRAPHY: 'GE',
  VA: 'VA', VISUALARTS: 'VA', FINEART: 'VA', ART: 'VA'
};

const SUBJECT_MAP_BY_EXAM = {
  IG: IGCSE_SUBJECTS,
  AS: IAS_SUBJECTS,
  AL: IAL_SUBJECTS
};

// ─── Public Functions ───────────────────────────────────────────────────────

/**
 * Resolve a raw subject name from an Excel import into the canonical
 * subject code for the given exam level and board.
 */
export const normalizeSubjectForImport = (examLevel, board, rawSubject) => {
  const boardVal = String(board || '').trim() || 'Other';
  const subjectVal = String(rawSubject || '').replace(/_/g, ' ').trim();
  const boardSubjects = SUBJECT_MAP_BY_EXAM[examLevel]?.[boardVal] || [];
  const subjectToken = normalizeToken(subjectVal);
  if (!subjectToken) return { board: boardVal, subject: '' };

  const directMatch = boardSubjects.find((s) => normalizeToken(s) === subjectToken);
  if (directMatch) return { board: boardVal, subject: directMatch };

  const aliasKey = SUBJECT_ALIAS_MAP[subjectToken] || subjectToken;
  const canonical = SUBJECT_CANONICAL_MAP[examLevel]?.[aliasKey]?.[boardVal];
  if (canonical && boardSubjects.includes(canonical)) {
    return { board: boardVal, subject: canonical };
  }

  const prefixMatch = boardSubjects.find(
    (s) => normalizeToken(s).startsWith(subjectToken) || subjectToken.startsWith(normalizeToken(s))
  );
  if (prefixMatch) return { board: boardVal, subject: prefixMatch };

  return { board: 'Other', subject: subjectVal };
};
