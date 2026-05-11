// generateData.js — Dummy data matching the expected Excel structure
// Columns: Year, RespondentID, Age, Income, Gender, Region,
//          EmploymentStatus, HasHealthInsurance, OwnHome,
//          SatisfactionScore, TrustInstitutions, OpenFeedback

const regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];
const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const employment = ['Full-time', 'Part-time', 'Unemployed', 'Retired', 'Student'];
const incomeRanges = ['Under $25k', '$25k–$50k', '$50k–$75k', '$75k–$100k', 'Over $100k'];
const openFeedback = [
  'Better community services needed.',
  'Healthcare costs are too high.',
  'Happy with local infrastructure.',
  'More transparency in government.',
  'Education funding should be prioritized.',
  'Economy is improving slowly.',
  'Digital services need improvement.',
  'Public safety is a concern.',
  'Environmental policies are lacking.',
  'Overall satisfied with services.',
  'Need more job opportunities.',
  'Housing is unaffordable.',
  'Transportation infrastructure needs work.',
  'Mental health resources are insufficient.',
  'No major complaints at this time.',
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussianRandom(mean, std) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.round(mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v));
}

export function generateSurveyData() {
  const rows = [];
  let id = 1;

  for (let year = 2014; year <= 2023; year++) {
    const nRespond = 180 + Math.floor(Math.random() * 60); // 180–240 per year
    for (let i = 0; i < nRespond; i++) {
      const age = Math.min(85, Math.max(18, gaussianRandom(42, 14)));
      // Satisfaction trends slightly upward over years
      const baseSat = 2.8 + (year - 2014) * 0.08;
      const satisfaction = Math.min(5, Math.max(1, parseFloat((baseSat + (Math.random() - 0.5) * 2).toFixed(1))));
      const trust = Math.min(5, Math.max(1, parseFloat((2.5 + (Math.random() - 0.5) * 2.5).toFixed(1))));

      rows.push({
        Year: year,
        RespondentID: `R${String(id).padStart(5, '0')}`,
        Age: age,
        Income: getRandom(incomeRanges),
        Gender: getRandom(genders),
        Region: getRandom(regions),
        EmploymentStatus: getRandom(employment),
        HasHealthInsurance: Math.random() > 0.18 ? 'Yes' : 'No',
        OwnHome: Math.random() > 0.42 ? 'Yes' : 'No',
        SatisfactionScore: satisfaction,
        TrustInstitutions: trust,
        OpenFeedback: getRandom(openFeedback),
      });
      id++;
    }
  }
  return rows;
}
