export const IGCSE_BOARDS = ["CIE", "Pearson Edexcel", "AQA", "OCR", "Other"];
export const IAS_BOARDS = ["Pearson Edexcel", "CIE", "AQA International", "AQA (UK)", "OCR", "Other"];
export const IAL_BOARDS = ["Pearson Edexcel", "CIE", "AQA International", "AQA (UK)", "OCR", "Other"];

// IGCSE Lists
export const IGCSE_SUBJECTS_LIST_CIE = ["0580", "0610", "0620", "0625", "0478", "0500", "0450", "0455", "0400", "0510", "0511"];
export const IGCSE_SUBJECTS_LIST_EDEXCEL = ["4MA0", "4BI0", "4CH0", "4PH0", "4BS0", "4EA0", "4FA0"];

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
export const IGCSE_SUBJECTS_LIST = Array.from(new Set([...IGCSE_SUBJECTS_LIST_CIE, ...IGCSE_SUBJECTS_LIST_EDEXCEL, "ENG", "MA", "PH", "CM", "BO"]));
export const IAS_SUBJECTS_LIST = Array.from(new Set([...IAS_IAL_LIST_CIE, ...IAS_IAL_LIST_EDEXCEL_IAS, ...IAS_IAL_LIST_AQA_UK, ...IAS_IAL_LIST_AQA_INTL, "MA", "PH", "CM", "BO"]));
export const IAL_SUBJECTS_LIST = Array.from(new Set([...IAS_IAL_LIST_CIE, ...IAS_IAL_LIST_EDEXCEL_IAL, ...IAS_IAL_LIST_AQA_UK, ...IAS_IAL_LIST_AQA_INTL, "MA", "PH", "CM", "BO"]));

export const SUBJECT_FULL_NAMES = {
  // CIE IGCSE
  "0580": "Mathematics", "0610": "Biology", "0620": "Chemistry", "0625": "Physics",
  "0478": "Computer Science", "0500": "First Language English", "0450": "Business Studies",
  "0455": "Economics", "0400": "Art & Design",
  "0510": "English as a Second Language (Speaking Endorsement)",
  "0511": "English as a Second Language (Count-in Speaking)",
  // Edexcel IGCSE
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
