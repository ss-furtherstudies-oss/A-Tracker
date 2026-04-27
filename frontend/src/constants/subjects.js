export const IGCSE_BOARDS = ["CIE", "Pearson Edexcel", "AQA", "OCR", "Other"];
export const IAS_BOARDS = ["Pearson Edexcel", "CIE", "AQA International", "AQA (UK)", "OCR", "Other"];
export const IAL_BOARDS = ["Pearson Edexcel", "CIE", "AQA International", "AQA (UK)", "OCR", "Other"];

// IGCSE Lists (ordered for Add/Edit form dropdowns)
export const IGCSE_SUBJECTS_LIST_CIE = [
  "0452", "0606", "0610", "0450", "0620", "0455", "0500", "0510", "0460", "0580", "0625",
  "0600", "0508", "0544", "0400", "0538", "0509", "0523", "0547", "0715", "0478",
  "0445", "0411", "0475", "0511", "0680", "0470", "0495",
  "0985", "7180", "0989", "0970", "0986", "0971", "0984", "0979", "0994", "0987", "0990", "0992"
];
export const IGCSE_SUBJECTS_LIST_EDEXCEL = [
  "4FA1", "4CN1",
  "4AC1", "4AA1", "4TD1", "4GC1", "4PY1", "4TE1", "4BA0", "4BN1", "4BI1", "4BS1", "4CH1", "4CM1",
  "4CP0", "4EC1", "4ES1", "4EA1", "4EB1", "4ET1", "4FR1", "4PM1", "4GE1", "4GN1", "4GL1", "4GK1",
  "4HI1", "4HB1", "4IT1", "4IS1", "4MA1", "4MB1", "4PA1", "4PH1", "4RS1", "4SD0", "4SS0", "4SI1",
  "4SP1", "4SW1", "4TA1"
];

// IAS / IAL Lists
export const IAS_IAL_LIST_CIE = ["9709", "9231", "9700", "9701", "9702", "9618", "9609", "9708", "9706", "9093", "9695", "9479", "9483"];
export const IAS_IAL_LIST_EDEXCEL_IAS = ["XMA01", "XFM01", "XPM01", "XBI11", "XCH11", "XPH11", "XBS11", "XEC11", "XAC11", "XIT11"];
export const IAS_IAL_LIST_EDEXCEL_IAL = [
  "YMA01", "YFM01", "YPM01", "YBI11", "YCH11", "YPH11", "YBS11", "YEC11", "YAC11", "YIT11", 
  "9FA0", "ZPJ30", "9CN0", "9EN0", "9ET0", "9EL0", "9MU0"
];
export const IAS_IAL_LIST_AQA_UK = ["7357", "7367", "7402", "7405", "7408", "7517", "7132", "7136", "7127", "7702", "7712", "7202"];
export const IAS_IAL_LIST_AQA_INTL = ["9660", "9665", "9610", "9620", "9630", "9625", "9640", "9670", "9675"];

// Backward Compatibility Lists for Stats/Dashboard
export const IGCSE_SUBJECTS_LIST = Array.from(new Set([...IGCSE_SUBJECTS_LIST_CIE, ...IGCSE_SUBJECTS_LIST_EDEXCEL]));
export const IAS_SUBJECTS_LIST = Array.from(new Set([...IAS_IAL_LIST_CIE, ...IAS_IAL_LIST_EDEXCEL_IAS, ...IAS_IAL_LIST_AQA_UK, ...IAS_IAL_LIST_AQA_INTL]));
export const IAL_SUBJECTS_LIST = Array.from(new Set([...IAS_IAL_LIST_CIE, ...IAS_IAL_LIST_EDEXCEL_IAL, ...IAS_IAL_LIST_AQA_UK, ...IAS_IAL_LIST_AQA_INTL]));

export const SUBJECT_FULL_NAMES = {
  // CIE IGCSE
  "0452": "Accounting",
  "0606": "Additional Mathematics",
  "0610": "Biology",
  "0450": "Business Studies",
  "0620": "Chemistry",
  "0455": "Economics",
  "0500": "English - First Language",
  "0510": "English as a Second Language (Speaking Endorsement)",
  "0460": "Geography",
  "0580": "Mathematics",
  "0625": "Physics",
  "0600": "Agriculture",
  "0508": "Arabic - First Language",
  "0544": "Arabic - Foreign Language",
  "0400": "Art & Design",
  "0538": "Bahasa Indonesia",
  "0509": "Chinese - First Language",
  "0523": "Chinese - Second Language",
  "0547": "Chinese (Mandarin) - Foreign Language",
  "0715": "Commerce",
  "0478": "Computer Science",
  "0445": "Design & Technology",
  "0411": "Drama",
  "0475": "English - Literature",
  "0511": "English as a Second Language (Count-in Speaking)",
  "0680": "Environmental Management",
  "0470": "History",
  "0495": "Sociology",
  "0985": "Accounting (9-1)",
  "7180": "Arabic (9-1)",
  "0989": "Art & Design (9-1)",
  "0970": "Biology (9-1)",
  "0986": "Business Studies (9-1)",
  "0971": "Chemistry (9-1)",
  "0984": "Computer Science (9-1)",
  "0979": "Design & Technology (9-1)",
  "0994": "Drama (9-1)",
  "0987": "Economics (9-1)",
  "0990": "English - First Language (9-1)",
  "0992": "English - Literature (9-1)",
  // Edexcel IGCSE
  "4FA1": "Art and Design: Fine Art",
  "4CN1": "Chinese",
  "4AC1": "Accounting",
  "4AA1": "Arabic (First Language)",
  "4TD1": "Art and Design: 3D Design",
  "4GC1": "Art and Design: Graph Communication",
  "4PY1": "Art and Design: Photography",
  "4TE1": "Art and Design: Textile Design",
  "4BA0": "Bangla",
  "4BN1": "Bangladesh Studies",
  "4BI1": "Biology",
  "4BS1": "Business",
  "4CH1": "Chemistry",
  "4CM1": "Commerce",
  "4CP0": "Computer Science",
  "4EC1": "Economics",
  "4ES1": "English As a Second Language",
  "4EA1": "English Language A",
  "4EB1": "English Language B",
  "4ET1": "English Literature",
  "4FR1": "French",
  "4PM1": "Further Pure Mathematics",
  "4GE1": "Geography",
  "4GN1": "German",
  "4GL1": "Global Citizenship",
  "4GK1": "Greek (First Language)",
  "4HI1": "History",
  "4HB1": "Human Biology",
  "4IT1": "ICT",
  "4IS1": "Islamic Studies",
  "4MA1": "Mathematics A",
  "4MB1": "Mathematics B",
  "4PA1": "Pakistan Studies",
  "4PH1": "Physics",
  "4RS1": "Religious Studies",
  "4SD0": "Science (Double Award)",
  "4SS0": "Science (Single Award)",
  "4SI1": "Sinhala",
  "4SP1": "Spanish",
  "4SW1": "Swahili",
  "4TA1": "Tamil",
  // Legacy Edexcel IGCSE codes (backward compatibility)
  "4MA0": "Mathematics A", "4BI0": "Biology", "4CH0": "Chemistry", "4PH0": "Physics",
  "4BS0": "Business", "4EA0": "English Language A", "4FA0": "Art and Design (Fine Art)",
  // CIE A-Level (9xxx)
  "9709": "Mathematics", "9231": "Further Mathematics", "9700": "Biology", "9701": "Chemistry",
  "9702": "Physics", "9618": "Computer Science", "9609": "Business", "9708": "Economics",
  "9706": "Accounting", "9093": "English Language", "9695": "Literature in English",
  "9479": "Art & Design", "9483": "Music",
  // Edexcel IAS (Xxxx)
  "XMA01": "Mathematics", "XFM01": "Further Mathematics", "XPM01": "Pure Mathematics",
  "XBI11": "Biology", "XCH11": "Chemistry", "XPH11": "Physics", "XBS11": "Business",
  "XEC11": "Economics", "XAC11": "Accounting", "XIT11": "Information Technology",
  // Edexcel IAL (Yxxx, 9xxx, Zxxx)
  "YMA01": "Mathematics", "YFM01": "Further Mathematics", "YPM01": "Pure Mathematics",
  "YBI11": "Biology", "YCH11": "Chemistry", "YPH11": "Physics", "YBS11": "Business",
  "YEC11": "Economics", "YAC11": "Accounting", "YIT11": "Information Technology",
  "9FA0": "Art and Design: Fine Art", "ZPJ30": "EPQ (Level 3 Extended Project)",
  "9CN0": "Chinese", "9EN0": "English Language", "9ET0": "English Literature",
  "9EL0": "English Language and Literature", "9MU0": "Music",
  // AQA UK (7xxx)
  "7357": "Mathematics", "7367": "Further Mathematics", "7402": "Biology", "7405": "Chemistry",
  "7408": "Physics", "7517": "Computer Science", "7132": "Business", "7136": "Economics",
  "7127": "Accounting", "7702": "English Language", "7712": "English Literature A", "7202": "Fine Art",
  // AQA Intl (9xxx)
  "9660": "Mathematics", "9665": "Further Mathematics", "9610": "Biology", "9620": "Chemistry",
  "9630": "Physics", "9625": "Business", "9640": "Economics", "9670": "English Language", "9675": "English Literature",
  // General/Backward Compatibility
  "ENG": "English", "CHI": "Chinese", "MA": "Mathematics", "AMA": "Add Mathematics",
  "PH": "Physics", "CM": "Chemistry", "BO": "Biology", "AC": "Accounting",
  "BS": "Business Studies", "EC": "Economics", "GE": "Geography", "VA": "Visual Arts",
  "FMA": "Further Mathematics"
};

export const CHART_SUBJECT_OPTIONS = {
  igcse: [
    { value: "0452", label: "AC - 0452", aliases: ["AC"], matchKeywords: ["ACCOUNTING"] },
    {
      value: "0606",
      label: "AMA - 0606",
      aliases: ["AMA", "AMS", "0606"],
      matchKeywords: ["ADDITIONAL MATH", "ADDITIONAL MATHEMATICS", "ADD MATH", "ADDMATH", "0606"],
    },
    { value: "0610", label: "BO - 0610", aliases: ["BO"], matchKeywords: ["BIOLOGY"] },
    {
      value: "0450",
      label: "BU - 0450",
      aliases: ["BU", "BUSINESS", "BUS", "4BS1", "4BS0", "0986"],
      matchKeywords: ["BUSINESS STUDIES", "BUSINESS"],
    },
    { value: "0620", label: "CM - 0620", aliases: ["CM"], matchKeywords: ["CHEMISTRY"] },
    { value: "0455", label: "EC - 0455", aliases: ["EC"], matchKeywords: ["ECONOMICS"] },
    {
      value: "0500",
      label: "EFL - 0500",
      aliases: ["EFL", "0500", "0990", "4EA1"],
      matchKeywords: ["FIRST LANGUAGE ENGLISH", "ENGLISH FIRST LANGUAGE", "ENGLISH LANGUAGE A"],
    },
    {
      value: "0510",
      label: "ESL - 0510",
      aliases: ["ESL", "0510", "0511", "4ES1", "4EB1", "ENG"],
      matchKeywords: ["ENGLISH AS A SECOND LANGUAGE", "SECOND LANGUAGE ENGLISH", "ENGLISH LANGUAGE B"],
    },
    { value: "0460", label: "GE - 0460", aliases: ["GE"], matchKeywords: ["GEOGRAPHY"] },
    { value: "0580", label: "MA - 0580", aliases: ["MA"], matchKeywords: ["MATHEMATICS", "MATH"] },
    { value: "0625", label: "PH - 0625", aliases: ["PH"], matchKeywords: ["PHYSICS"] },
    {
      value: "4FA1",
      label: "A&D - 4FA1",
      aliases: ["A&D", "4FA0", "0400", "0989", "4TD1", "4GC1", "4PY1", "4TE1"],
      matchKeywords: ["ART", "FINE ART", "ART & DESIGN"],
    },
    {
      value: "4CN1",
      label: "CN - 4CN1",
      aliases: ["CN", "4CN0", "0509", "0523", "0547", "CHI"],
      matchKeywords: ["CHINESE", "MANDARIN"],
    },
  ],
  ias: [
    { value: "XAC", label: "XAC - Accounting", aliases: ["XAC01", "XAC11", "AC"] },
    { value: "XBI", label: "XBI - Biology", aliases: ["XBI01", "XBI11", "BO", "BI"] },
    { value: "XBS", label: "XBS - Business Studies", aliases: ["XBS01", "XBS11", "BS"] },
    { value: "XCH", label: "XCH - Chemistry", aliases: ["XCH01", "XCH11", "CM", "CH"] },
    { value: "XEC", label: "XEC - Economics", aliases: ["XEC01", "XEC11", "EC"] },
    { value: "XGE", label: "XGE - Geography", aliases: ["XGE01", "XGE11", "GE"] },
    { value: "XEN", label: "XEN - English", aliases: ["XEN01", "XEN11", "ENG", "EN"] },
    { value: "XMA", label: "XMA - Mathematics", aliases: ["XMA01", "XMA11", "MA"] },
    { value: "XPH", label: "XPH - Physics", aliases: ["XPH01", "XPH11", "PH"] },
  ],
  ial: [
    { value: "YAC", label: "YAC - Accounting", aliases: ["YAC01", "YAC11", "AC"] },
    { value: "YBI", label: "YBI - Biology", aliases: ["YBI01", "YBI11", "BO", "BI"] },
    { value: "YBS", label: "YBS - Business Studies", aliases: ["YBS01", "YBS11", "BS"] },
    { value: "YCH", label: "YCH - Chemistry", aliases: ["YCH01", "YCH11", "CM", "CH"] },
    { value: "YEC", label: "YEC - Economics", aliases: ["YEC01", "YEC11", "EC"] },
    { value: "YGE", label: "YGE - Geography", aliases: ["YGE01", "YGE11", "GE"] },
    { value: "YEN", label: "YEN - English", aliases: ["YEN01", "YEN11", "ENG", "EN"] },
    { value: "YMA", label: "YMA - Mathematics", aliases: ["YMA01", "YMA11", "MA"] },
    { value: "YFM", label: "YFM - Further Mathematics", aliases: ["YFM01", "YFM11", "FM", "FMA"] },
    { value: "YPH", label: "YPH - Physics", aliases: ["YPH01", "YPH11", "PH"] },
    { value: "9FA0", label: "9FA - Fine Arts", aliases: ["4FA1", "4FA0", "VA", "IG VA", "9FA"] },
    { value: "9CN0", label: "9CN - Chinese", aliases: ["4CN1", "4CN0", "CHI", "IG CHI", "9CN"] },
    { value: "9EN0", label: "9EN - English", aliases: ["ENG", "IG ENG", "9ET0", "9EL0", "9EN"] },
    { value: "EPQ", label: "EPQ", aliases: ["ZPJ30"] },
  ],
};

export const getChartSubjectOptions = (examKey) => CHART_SUBJECT_OPTIONS[examKey] || [];

export const doesSubjectMatchChartOption = (examKey, selectedValue, subjectValue) => {
  if (!selectedValue || selectedValue === "Overall") return true;
  const rawSubject = String(subjectValue || "").trim().toUpperCase();
  if (!rawSubject) return false;
  const subjectFull = String(SUBJECT_FULL_NAMES[rawSubject] || rawSubject).trim().toUpperCase();

  const options = CHART_SUBJECT_OPTIONS[examKey] || [];
  const selected = options.find((opt) => opt.value === selectedValue);
  if (!selected) {
    const target = String(selectedValue).trim().toUpperCase();
    return rawSubject === target || subjectFull === target;
  }

  const accepted = new Set([selected.value, ...(selected.aliases || [])].map((v) => String(v).trim().toUpperCase()));
  if (accepted.has(rawSubject) || accepted.has(subjectFull)) return true;

  // Prefix matching: XMA covers XMA01/XMA11, YCH covers YCH01/YCH11, etc.
  if (/^[XY][A-Z]{2,3}$/.test(selected.value)) {
    const pref = selected.value.toUpperCase();
    if (rawSubject.startsWith(pref)) return true;
  }

  const keywords = [
    selected.value,
    ...(selected.aliases || []),
    ...(selected.matchKeywords || [])
  ];

  return keywords.some((kw) => {
    const key = String(kw).trim().toUpperCase();
    if (!key) return false;
    return rawSubject.includes(key) || subjectFull.includes(key);
  });
};

export const IGCSE_SUBJECTS = {
  "CIE": IGCSE_SUBJECTS_LIST_CIE,
  "Pearson Edexcel": IGCSE_SUBJECTS_LIST_EDEXCEL,
  "AQA": ["0580", "0610", "0620", "0625"], // Placeholder for general AQA IGCSE
  "Other": []
};

export const IAS_SUBJECTS = {
  "Pearson Edexcel": IAS_IAL_LIST_EDEXCEL_IAS,
  "CIE": IAS_IAL_LIST_CIE,
  "AQA International": IAS_IAL_LIST_AQA_INTL,
  "AQA (UK)": IAS_IAL_LIST_AQA_UK,
  "Other": []
};

export const IAL_SUBJECTS = {
  "Pearson Edexcel": IAS_IAL_LIST_EDEXCEL_IAL,
  "CIE": IAS_IAL_LIST_CIE,
  "AQA International": IAS_IAL_LIST_AQA_INTL,
  "AQA (UK)": IAS_IAL_LIST_AQA_UK,
  "Other": []
};
