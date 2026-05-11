# HANDOFF2.md — Survey Dashboard Project Log (Updated)

This file supersedes HANDOFF.md. Use this as the primary context document.
Update it after every significant session so the next Claude Code session has full context.

---

## Project Summary

An interactive React dashboard for 9 years (and growing) of academic library survey data
collected by a public university and submitted annually to ACRL (Association of College
& Research Libraries). Built with Vite + React + Recharts. Designed to deploy to GitHub Pages.

---

## Current Status

- [x] Project scaffolded (Vite + React)
- [x] Data layer fully rebuilt for long-format institutional data
- [x] Filter panel rebuilt — year range + institution multi-select checkboxes
- [x] 4 tabs: Overview, Explore, Trends, Raw Data
- [x] Chart exports (PNG, SVG per chart)
- [x] Data exports (CSV, Excel)
- [x] Paginated sortable data table
- [x] Excel file upload (runtime, no rebuild needed)
- [x] Academic / report style
- [x] README with deploy instructions
- [x] Real data confirmed: Combination sheet, 2023–2025, 21 CUNY institutions, 178 questions
- [x] Question Name_2nd_clean function isolated (lstrip '*' from Question Name_clean)
- [x] Question Name_2nd_clean column added to all 2017–2022 cleaned files
- [x] vite.config.js base set to '/' for local dev (change to '/repo-name/' before GitHub deploy)
- [x] dataUtils.js fixed to read year tabs (2023/2024/2025) instead of Combination sheet
- [ ] Dashboard not yet tested with real file upload — needs verification session
- [ ] 2017–2022 data not yet added to master — needs Power Query run by user
- [ ] Combination sheets in master need Power Query refresh (currently incomplete — see Session 4)
- [ ] GitHub repo not yet created
- [ ] GitHub Pages not yet deployed
- [ ] Data governance / IRB sign-off not yet confirmed

---

## ⚠️ Critical Architecture Change — Read First

The original code was built assuming **wide format** data (one column per question).
The real data is in **long format**. The entire data layer must be rebuilt before
any charts are remapped.

### What we built for (WRONG — do not use):
| Year | LibraryVisits | StaffFTE | SatisfactionScore |
|---|---|---|---|
| 2018 | 4500 | 12 | 3.8 |
| 2019 | 4800 | 14 | 4.1 |

### What the real data looks like (CORRECT):
| Year | QuestionName | Response |
|---|---|---|
| 2018 | Library Visits | 4500 |
| 2018 | Staff FTE | 12 |
| 2018 | Consortium Member | Yes |
| 2018 | Library Type | Academic |
| 2019 | Library Visits | 4800 |
| 2019 | Staff FTE | 14 |

---

## Real Data Structure — CONFIRMED

- **Master file**: `2026 Survey downloads\cleaned\2017-2025_ACRL_master.xlsx`
- **Sheet to use**: `Combination` (dashboard reads this automatically)
- **Years in master now**: 2023, 2024, 2025 (2017–2022 cleaned but not yet merged via Power Query)
- **Institutions**: 21 CUNY colleges
- **Total rows (2023–2025)**: 6,669
- **Questions**: 178 unique (using `Question Name_2nd_clean`)

### Confirmed Column Names (Combination sheet)
| Column | Use |
|---|---|
| Year | Numeric year |
| IPEDSUnitID | Institution ID (not used in dashboard) |
| Institution Name | Full institution name |
| Section Name_clean | Section grouping |
| Question Group_clean | Sub-group within section |
| Question Name_clean | Clean question name — MAY have leading `*` |
| Response_clean | Cleaned response value (used for charts) |
| **Question Name_2nd_clean** | `Question Name_clean` with leading `*` stripped — **USE THIS** |

### Data Pipeline
1. Raw ACRL annual file → **Python cleaning script** → cleaned file (Year column added, HTML stripped, uppercased)
2. Cleaned file → **Power Query in master workbook** → Combination sheet (re-derives Question Name_clean keeping `*`, adds Question Name_2nd_clean by stripping `*`)

### Question Name_2nd_clean Rule
`Question Name_2nd_clean = Question Name_clean.lstrip('*')`
This was verified with zero mismatches across all 6,669 rows in the Combination sheet.
The 2017–2022 cleaned files had `*` already stripped in their `Question Name_clean`, so their `Question Name_2nd_clean` equals `Question Name_clean` — same end result.

### Response Types (auto-detected by dashboard)
- **Numeric**: strip `$`, `,` → parse float (expenses, staff FTE, counts, etc.)
- **Multi-select**: response contains `|` pipe separator (EDI strategies, AI activities, etc.)
- **Categorical**: ≤8 unique values (Yes/No/N/A, Fully/Partially/Not at all, etc.)
- **Free text**: long responses >120 chars (policy text, descriptions)

---

## ⚠️ Data Governance — DO NOT SKIP

Before deploying publicly or committing real data to GitHub:

- This data is submitted to ACRL but ACRL only publishes **aggregated** results
- Row-level respondent data may **not** be intended for public release
- The long format structure means each row is a question-answer pair, not a respondent —
  clarify whether this changes the privacy risk before deploying
- Actions required before public deploy:
  1. Confirm with IRB or data governance office that this data can be hosted publicly
  2. Review ACRL data submission agreement for redistribution restrictions
  3. Strip any PII or re-identifying fields if present
  4. Decide: public GitHub repo vs. private repo with restricted access

---

## What Claude Code Must Do With the Real File

When the Excel file is provided, Claude Code should perform these steps **in order**
before writing any code:

1. **Load and inspect** the file — confirm exact column names (may differ from
   `Year`, `QuestionName`, `Response` — map whatever the real names are)
2. **Inventory all unique QuestionNames** — list every distinct question in the data
3. **Check year coverage per question** — flag questions missing from certain years
4. **Detect response type per question** — numeric, yes/no, categorical, or free text
5. **Document everything** in the Question Inventory table above in this file
6. **Rebuild the data layer** in `src/utils/dataUtils.js` around long format
7. **Rebuild charts** in `src/App.jsx` using detected question types
8. **Create a human-readable label mapping** — so charts show clean labels
   instead of raw column/question names like `Q14_LibVisits_cleaned`

---

## Prompt to Give Claude Code at Start of Next Session

Copy and paste this exactly:

> "Read HANDOFF2.md. The original data layer was built on the wrong assumption —
> the real data is long format with QuestionName and Response columns, not wide format.
> I am now providing the real Excel master file. Please: (1) confirm exact column names,
> (2) inventory all unique QuestionNames, (3) check which questions are present across
> all years and flag gaps, (4) detect the response type for each question (numeric,
> yes/no, categorical, free text), (5) document all of this in the Question Inventory
> table in HANDOFF2.md, (6) rebuild the data layer from scratch for long format,
> (7) remap all charts and filters to the real questions using the correct chart type
> per response type, (8) create a human-readable label mapping for chart titles.
> Do not deploy or commit anything until I confirm the data governance question."

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| Recharts | 2.10 | Charts |
| SheetJS (xlsx) | 0.18 | Excel read/write |
| file-saver | 2.0 | Download trigger |
| html2canvas | 1.4 | Chart → PNG |
| gh-pages | 6.1 | GitHub Pages deploy |

---

## File Structure

```
survey-dashboard/
├── HANDOFF.md               ← Original handoff — superseded by HANDOFF2.md
├── HANDOFF2.md              ← You are here. Primary context document.
├── README.md                ← End-user deploy instructions
├── index.html
├── vite.config.js           ← Set base: '/your-repo-name/' before deploy
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx              ← All tabs, chart logic — NEEDS REBUILD for long format
    ├── App.module.css       ← Layout and academic styles
    ├── index.css            ← CSS variables, global reset
    ├── components/
    │   ├── FilterPanel.jsx  ← Sidebar filters — NEEDS REBUILD for long format
    │   ├── FilterPanel.module.css
    │   ├── ChartCard.jsx    ← Chart wrapper with PNG/SVG export — reusable as-is
    │   ├── ChartCard.module.css
    │   ├── DataTable.jsx    ← Paginated sortable table — NEEDS REBUILD for long format
    │   └── DataTable.module.css
    ├── data/
    │   └── generateData.js  ← Dummy data in WRONG format — replace entirely
    └── utils/
        ├── dataUtils.js     ← NEEDS FULL REBUILD for long format
        └── exportUtils.js   ← CSV/Excel/PNG/SVG exports — reusable as-is
```

---

## Key Design Decisions

- **Runtime Excel upload** — users upload their Excel file in the browser without
  a rebuild. This is intentional and must be preserved.
- **Academic / report style** — muted colors, serif headings (Libre Baskerville),
  print-friendly. Do not drift toward bright/modern UI styles.
- **GitHub Pages = static only** — no backend, no authentication, no server-side logic.
  If access control is needed, the architecture must change significantly.
- **CSS Modules** — all component styles use `.module.css`. Do not mix with global
  styles except for variables in `index.css`.
- **Dynamic year labels** — year range should be derived from the data automatically,
  never hardcoded.
- **Long format data** — each row is a question-answer pair for a given year,
  not a respondent. The data layer must pivot or group by QuestionName to build charts.

---

## Pending Decisions

- [ ] Exact column names in real file (may not be Year / QuestionName / Response)
- [ ] Should the Raw Data tab be public, or suppressed / aggregated only?
- [ ] Should the dashboard be password-protected or public?
- [ ] What is the institution name for the header and footer?
- [ ] What is the exact ACRL survey name to display?
- [ ] Should the GitHub repo be public or private?
- [ ] Are there questions in the real data that should be excluded from display?
- [ ] Data governance / IRB confirmation — required before public deploy
- [ ] Which questions have enough year coverage to be worth visualizing?

---

## Session Log

### Session 1 — Initial Build
- Scaffolded full Vite + React project
- Built dummy data generator with wide-format ACRL-style fields
- Built FilterPanel, ChartCard, DataTable components
- Implemented CSV, Excel, PNG, SVG exports
- Academic report visual style applied
- README and deploy instructions written
- HANDOFF.md written

### Session 2 — Data Structure Discovery
- Confirmed real data is long format (QuestionName + Response columns), not wide format
- Confirmed Response column is a mix of numeric and text values
- Confirmed columns may have been renamed during cleaning (e.g. `_cleaned` suffix)
- Confirmed 9 years of data, not yet 10 — year labels must be dynamic
- Confirmed ACRL only publishes aggregated data — data governance check required
- Identified that data layer, filter panel, and data table all need full rebuild
- ChartCard and exportUtils are reusable as-is
- HANDOFF2.md written to supersede HANDOFF.md
- Next step: upload real Excel file to Claude Code and run full question inventory

### Session 4 — Environment Fixes and Data Integrity Discovery
- Fixed PowerShell execution policy error: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Fixed blank page: changed `vite.config.js` base from `'/survey-dashboard/'` to `'/'` for local dev
- Fixed Dropbox file-lock error (EBUSY): pause Dropbox sync before running dev server. Permanent fix: move project out of Dropbox folder
- **Critical discovery**: the `Combination` sheet in the master is incomplete:
  - Missing Bronx CC and York College entirely
  - Missing City College for 2023–2024 (only has 2025)
  - `Combination_sperations` has opposite problem — has 2023–2024 for those three but not 2025
  - Root cause: Power Query merge was not refreshed after 2025 data was added
- **Individual year tabs (2023, 2024, 2025) are complete and correct** — all 21 institutions present in each
- Fixed `dataUtils.js`: dashboard now reads all 4-digit-named year tabs and combines them in the browser, bypassing the broken Combination sheets entirely
- This fix is forward-compatible: when 2017–2022 tabs are added via Power Query, dashboard picks them up automatically
- Dev server still not tested with file upload — blocked by Dropbox/PowerShell issues during session
- Next step: upload master file and verify all 4 tabs render correctly

### Session 3 — Data Inspection, Column Work, Dashboard Rebuild
- Inspected `2017-2025_ACRL_master.xlsx`: Combination sheet confirmed, 2023–2025 only, 21 CUNY institutions, 6,669 rows, 178 unique questions
- Confirmed this is **institutional data** (one row = one library's answer to one question), not individual respondent data — entire dashboard concept rebuilt accordingly
- Discovered `Question Name_2nd_clean` function: `lstrip('*')` applied to `Question Name_clean` — verified with zero mismatches
- Added `Question Name_2nd_clean` column to all 2017–2022 cleaned files in `cleaned/` folder
- Clarified full data pipeline: Python script (adds Year + clean cols) → cleaned file → Power Query (re-derives clean cols, adds Question Name_2nd_clean) → Combination sheet
- **Full dashboard rebuild** — replaced all dummy-data logic:
  - `dataUtils.js`: long-format parser, institution short names, response type detection
  - `FilterPanel.jsx/.css`: year range + institution multi-select (21 CUNY colleges)
  - `App.jsx`: Overview (coverage grid), Explore (section→group→question cascade + auto chart), Trends (numeric multi-year line charts), Raw Data table
  - `App.module.css`: all new styles
  - `DataTable.jsx`: fixed default sort key
  - `vite.config.js`: changed base to `'/'` for local dev
- Build passes clean (`npm run build` — zero errors)
- Dev server starts on `http://localhost:5174/` (5173 was still in use from prior run)
- **Not yet tested with real file upload** — session ended before upload test
- Next step: restart, open `http://localhost:5174/`, upload master file, verify all 4 tabs

---

## How to Update This File

After each Claude Code session, add a new entry to the Session Log:

```
### Session N — [Short Title]
- What was done
- What decisions were made
- What was deferred
- Next step
```

Keep the Current Status checkboxes up to date.
Keep the Pending Decisions list current.
Keep the Question Inventory table updated as real column names are confirmed.
