import * as XLSX from 'xlsx';

// Contact/metadata fields present in older ACRL exports — not library metrics, exclude from dashboard
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

// institutions: [] means all selected
export function applyFilters(data, filters) {
  return data.filter(row => {
    if (row.year < filters.yearMin || row.year > filters.yearMax) return false;
    if (filters.institutions.length > 0 && !filters.institutions.includes(row.institution)) return false;
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
  return [...map.values()]
    .map(q => ({ ...q, years: [...q.years].sort() }))
    .sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      if (a.questionGroup !== b.questionGroup) return a.questionGroup.localeCompare(b.questionGroup);
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
