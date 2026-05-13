import * as XLSX from 'xlsx';

// Contact/metadata fields and non-metric questions — exclude from dashboard entirely
const QUESTION_BLOCKLIST = new Set([
  'CARNEGIE CLASSIFICATION',
  'CARNEGIE CLASSIFICATION DETAILED OPTIONAL QUESTION',
  'CITY',
  "CONTACT'S NAME",
  'CONTRIBUTING LIBRARY IN FY 2017',
  'COUNTRY',
  'CURRENCY EXCHANGE RATE',
  'CURRENCY LOCAL',
  'CURRENCY LOCAL - CONVERSION',
  'EMAIL ADDRESS',
  'FISCAL YEAR END DATE',
  'IPEDS UNIT ID',
  'LOCATION',
  'PHONE NUMBER',
  'REPORTING INSTITUTION',
  'SHORT NAME FOR REPORTING INSTITUTION',
  'STATE/PROVINCE',
  'STREET ADDRESS',
  'TITLE',
  'YOUR EMAIL',
  'YOUR NAME',
  'YOUR PHONE NUMBER',
  'YOUR TITLE',
  'ZIP/POSTAL CODE',
  '27. ARE EXPENSES REPORTED IN CANADIAN DOLLARS?',
]);

// Questions that changed wording across years but measure the same thing — map old wording → canonical
const QUESTION_ALIASES = {
  '76 BEFORE COVID-19, NUMBER OF HOURS OPEN DURING A TYPICAL WEEK IN AN ACADEMIC SESSION':
    '76. NUMBER OF HOURS OPEN DURING A TYPICAL WEEK IN AN ACADEMIC SESSION',
  '1#1 DOES YOUR LIBRARY HAVE FORMAL, WRITTEN GOALS FOR EQUITY, DIV':
    '1.1 DOES YOUR LIBRARY HAVE FORMAL, WRITTEN GOALS FOR EQUITY, DIVERSITY, AND INCLUSION (EDI)?',
  '6H. WORKSHOPS':
    'WORKSHOPS',
};

// Short display labels for charts — strips "CUNY " prefix where a cleaner name exists
export const INST_SHORT = {
  'CUNY Bernard M Baruch College': 'Baruch',
  'CUNY Borough of Manhattan Community College': 'BMCC',
  'CUNY Bronx Community College': 'Bronx CC',
  'CUNY Brooklyn College': 'Brooklyn',
  'CUNY City College': 'City College',
  'CUNY College of Staten Island': 'Staten Island',
  'CUNY Craig Newmark Graduate School of Journalism': 'Journalism',
  'CUNY Graduate School and University Center': 'Grad Center',
  'CUNY Guttman Community College': 'Guttman',
  'CUNY Hostos Community College': 'Hostos',
  'CUNY Hunter College': 'Hunter',
  'CUNY John Jay College Criminal Justice': 'John Jay',
  'CUNY Kingsborough Community College': 'Kingsborough',
  'CUNY LaGuardia Community College': 'LaGuardia',
  'CUNY Lehman College': 'Lehman',
  'CUNY Medgar Evers College': 'Medgar Evers',
  'CUNY New York City College of Technology': 'City Tech',
  'CUNY Queens College': 'Queens',
  'CUNY Queensborough Community College': 'Queensborough',
  'CUNY School of Law': 'School of Law',
  'CUNY York College': 'York',
};

export function shortName(institution) {
  const t = String(institution).trim();
  return INST_SHORT[t] || t.replace(/^CUNY\s+/, '');
}

// Parse the uploaded master Excel file.
// Reads all sheets named as 4-digit years (e.g. "2023", "2024") and combines them.
// Falls back to the Combination sheet, then the first sheet.
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

        const yearSheets = workbook.SheetNames.filter(s => /^\d{4}$/.test(s.trim()));

        let rows;
        if (yearSheets.length > 0) {
          // Combine all year tabs — most reliable source
          rows = yearSheets.flatMap(s =>
            XLSX.utils.sheet_to_json(workbook.Sheets[s], { defval: null })
          );
        } else {
          // Fall back to Combination sheet or first sheet
          const sheetName =
            workbook.SheetNames.find(s => s.toLowerCase() === 'combination') ||
            workbook.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
        }

        resolve(normalizeRows(rows));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRows(rows) {
  return rows
    .map(row => {
      const rawQuestion = String(
        row['Question Name_2nd_clean'] ||
        row['Question Name_clean'] ||
        row['Question Name'] || ''
      ).trim().replace(/^\*+/, '');
      const question = QUESTION_ALIASES[rawQuestion] || rawQuestion;
      return {
        year: Number(row['Year']),
        institution: String(row['Institution Name'] || '').trim(),
        section: String(row['Section Name_clean'] || row['Section Name'] || '').trim(),
        questionGroup: String(row['Question Group_clean'] || row['Question Group'] || '').trim(),
        question,
        response: row['Response_clean'] ?? row['Response'],
      };
    })
    .filter(r => r.year && r.institution && r.question && !QUESTION_BLOCKLIST.has(r.question));
}

export function deriveFilters(data) {
  const years = [...new Set(data.map(r => r.year))].sort((a, b) => a - b);
  const institutions = [...new Set(data.map(r => r.institution))].sort();
  return { years, institutions };
}

// Core sections always shown in question picker
export const CORE_SECTIONS = [
  'EXPENSES (EXCLUDE STAFF)',
  'LIBRARY COLLECTIONS',
  'LIBRARY SERVICES',
  'STAFFING TYPES, FTES AND EXPENSES',
];

// Questions reassigned to specific optional subsections regardless of their original section
const OPTIONAL_OVERRIDES = {
  '67A V-01 EMAIL REFERENCE': 'Virtual Reference Breakdowns',
  '67B V-02 CHAT REFERENCE, COMMERCIAL SERVICES': 'Virtual Reference Breakdowns',
  '67C V-03 CHAT REFERENCE, INSTANT MESSAGING APPLICATIONS': 'Virtual Reference Breakdowns',
  '67D V-04 SHORT MESSAGE SERVICE (SMS) OR TEXT MESSAGING': 'Virtual Reference Breakdowns',
  '67E V-05 ONLINE CONFERENCING': 'Virtual Reference Breakdowns',
  '22# ONE-TIME ELECTRONIC RESOURCE PURCHASES': 'One-Time Electronic Purchases',
  '9# OTHER OPERATING EXPENDITURES': 'One-Time Electronic Purchases',
  'TOTAL LIBRARY MATERIALS EXPENDITURES RETIRED': 'One-Time Electronic Purchases',
  '77. NUMBER OF WEEKS THE MAIN LIBRARY WAS CLOSED DUE TO COVID-19': 'COVID-Related Questions',
  '78. NUMBER OF WEEKS THE MAIN LIBRARY HAD LIMITED OCCUPANCY DUE TO COVID-19': 'COVID-Related Questions',
  '61B. E-BOOK USAGE (COUNTER 4 BR1 & MR1 OR OTHER IF NEEDED)': 'COUNTER 4',
  '62B. E-BOOK USAGE (COUNTER 4 BR2 & MR2 OR OTHER IF NEEDED)': 'COUNTER 4',
};

const HIDDEN_SECTIONS = new Set(['FINAL COMMENTS']);

const OPTIONAL_SECTION_ORDER = [
  'Notes',
  'COVID-Related Questions',
  'COUNTER 4',
  'Virtual Reference Breakdowns',
  'One-Time Electronic Purchases',
  'Annual Trends',
  'Selected IPEDS Metrics',
  'Library Characteristics',
  'Local Characteristics',
];

// Returns questions grouped into core and optional subsections for the picker UI
export function getCategorizedQuestions(questionIndex) {
  const coreMap = new Map(CORE_SECTIONS.map(s => [s, []]));
  const optionalMap = new Map();

  questionIndex.forEach(q => {
    if (HIDDEN_SECTIONS.has(q.section)) return;

    if (OPTIONAL_OVERRIDES[q.question]) {
      const label = OPTIONAL_OVERRIDES[q.question];
      if (!optionalMap.has(label)) optionalMap.set(label, []);
      optionalMap.get(label).push(q);
      return;
    }

    if (q.question.startsWith('NOTES -')) {
      if (!optionalMap.has('Notes')) optionalMap.set('Notes', []);
      optionalMap.get('Notes').push(q);
      return;
    }

    if (coreMap.has(q.section)) {
      coreMap.get(q.section).push(q);
      return;
    }

    let label;
    if (/^\d{4} TRENDS:/.test(q.section) || q.section === 'TRENDS QUESTIONS' || q.section === 'SPECIAL SECTION: ACCESSIBILITY') {
      label = 'Annual Trends';
    } else if (q.section === 'SELECTED IPEDS METRICS') {
      label = 'Selected IPEDS Metrics';
    } else if (q.section === 'LIBRARY CHARACTERISTICS') {
      label = 'Library Characteristics';
    } else if (q.section === 'LOCAL CHARACTERISTICS') {
      label = 'Local Characteristics';
    } else {
      label = q.section || 'Other';
    }

    if (!optionalMap.has(label)) optionalMap.set(label, []);
    optionalMap.get(label).push(q);
  });

  function minQNum(questions) {
    const nums = questions.map(q => {
      const m = q.question.match(/^(\d+)/);
      return m ? parseInt(m[1], 10) : Infinity;
    });
    return Math.min(...nums);
  }

  const coreGroups = [];
  CORE_SECTIONS.forEach(section => {
    const qs = coreMap.get(section);
    if (qs && qs.length > 0) coreGroups.push({ type: 'core', label: section, questions: qs });
  });
  coreGroups.sort((a, b) => minQNum(a.questions) - minQNum(b.questions));

  const optionalGroups = [];
  optionalMap.forEach((qs, label) => {
    if (qs.length > 0) optionalGroups.push({ type: 'optional', label, questions: qs });
  });
  optionalGroups.sort((a, b) => {
    const na = minQNum(a.questions), nb = minQNum(b.questions);
    if (na === Infinity && nb === Infinity) return a.label.localeCompare(b.label);
    if (na === Infinity) return 1;
    if (nb === Infinity) return -1;
    return na - nb;
  });

  return [...coreGroups, ...optionalGroups];
}

export function applyFilters(data, filters) {
  return data.filter(row => {
    if (!filters.years.includes(row.year)) return false;
    if (!filters.institutions.includes(row.institution)) return false;
    return true;
  });
}

// Returns questions sorted by section → group → name, with year coverage noted
export function getQuestionIndex(data) {
  const map = new Map();
  data.forEach(r => {
    if (!map.has(r.question)) {
      map.set(r.question, {
        question: r.question,
        section: r.section,
        questionGroup: r.questionGroup,
        years: new Set(),
      });
    }
    map.get(r.question).years.add(r.year);
  });
  function numKey(str) {
    const m = str.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : Infinity;
  }
  return [...map.values()]
    .map(q => ({ ...q, years: [...q.years].sort() }))
    .sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      const na = numKey(a.question), nb = numKey(b.question);
      if (na !== nb) return na - nb;
      return a.question.localeCompare(b.question);
    });
}

// Detect the response type for a set of rows for one question
export function detectResponseType(rows) {
  const values = rows
    .map(r => r.response)
    .filter(v => v != null && String(v).trim() !== '');
  if (!values.length) return 'empty';
  if (values.some(v => String(v).includes('|'))) return 'multiselect';
  const numeric = values.map(v => parseFloat(String(v).replace(/[$,\s]/g, '')));
  if (numeric.every(v => !isNaN(v))) return 'numeric';
  const unique = [...new Set(values.map(v => String(v).trim()))];
  if (unique.length <= 8) return 'categorical';
  if (values.some(v => String(v).length > 120)) return 'freetext';
  return 'categorical';
}

export function parseNumeric(val) {
  if (val == null) return null;
  const n = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isNaN(n) ? null : n;
}
