# HANDOFF.md — Survey Dashboard Project Log

This file is the living context document for this project.
Update it after every significant session so the next Claude Code session has full context.

---

## Project Summary

An interactive React dashboard for 10 years of academic library survey data collected
by a public university and submitted annually to ACRL (Association of College & Research Libraries).
Built with Vite + React + Recharts. Designed to deploy to GitHub Pages.

---

## Current Status

- [x] Project scaffolded (Vite + React)
- [x] Dummy data generated (realistic ACRL-style fields)
- [x] Filter panel (year range, region, gender, income, employment)
- [x] 5 tabs: Overview, Trends, Demographics, Open Responses, Raw Data
- [x] Chart exports (PNG, SVG per chart)
- [x] Data exports (CSV, Excel)
- [x] Paginated sortable data table
- [x] Excel file upload (runtime, no rebuild needed)
- [x] Academic / report visual style
- [x] README with deploy instructions
- [ ] Real data not yet connected — awaiting column mapping
- [ ] GitHub repo not yet created
- [ ] GitHub Pages not yet deployed
- [ ] Institution name and ACRL attribution not yet added
- [ ] Data governance / IRB sign-off not yet confirmed

---

## ⚠️ Data Governance — DO NOT SKIP

Before deploying publicly or committing real data to GitHub:

- This data is submitted to ACRL but ACRL only publishes **aggregated** results
- Row-level respondent data may **not** be intended for public release
- Actions required before public deploy:
  1. Confirm with IRB or data governance office that row-level data can be hosted publicly
  2. Review ACRL data submission agreement for redistribution restrictions
  3. Strip any PII or re-identifying fields if present
  4. Decide: public GitHub repo vs. private repo with restricted access

---

## Data File

- **Format**: Excel (.xlsx), one sheet, all years combined
- **Year column**: `Year` (numeric, e.g. 2014–2023)
- **Current state**: Using generated dummy data (`src/data/generateData.js`)
- **Real file**: Not yet uploaded — when provided, map columns in `src/utils/dataUtils.js`
  and update all chart references in `src/App.jsx`

### Expected / Dummy Column Names
| Column | Type | Notes |
|---|---|---|
| Year | Number | 2014–2023 |
| RespondentID | Text | Unique per row |
| Age | Number | 18–85 |
| Income | Text | Categorical brackets |
| Gender | Text | Categorical |
| Region | Text | Geographic |
| EmploymentStatus | Text | Categorical |
| HasHealthInsurance | Yes/No | |
| OwnHome | Yes/No | |
| SatisfactionScore | Number 1–5 | |
| TrustInstitutions | Number 1–5 | |
| OpenFeedback | Text | Free response |

> ⚠️ These are dummy column names. Real ACRL column names will differ.
> Update this table when the real file is provided.

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
├── HANDOFF.md               ← You are here. Keep this updated.
├── README.md                ← End-user deploy instructions
├── index.html
├── vite.config.js           ← Set base: '/your-repo-name/' before deploy
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx              ← All tabs, chart logic, filter wiring
    ├── App.module.css       ← Layout and academic styles
    ├── index.css            ← CSS variables, global reset
    ├── components/
    │   ├── FilterPanel.jsx  ← Sidebar: year slider + dropdowns
    │   ├── FilterPanel.module.css
    │   ├── ChartCard.jsx    ← Chart wrapper with PNG/SVG export
    │   ├── ChartCard.module.css
    │   ├── DataTable.jsx    ← Paginated sortable table + CSV/Excel export
    │   └── DataTable.module.css
    ├── data/
    │   └── generateData.js  ← Dummy data generator (replace with real data)
    └── utils/
        ├── dataUtils.js     ← loadDummyData, parseExcelFile, applyFilters
        └── exportUtils.js   ← exportCSV, exportExcel, exportChartPNG/SVG
```

---

## Key Design Decisions

- **Runtime Excel upload** — users can upload their own Excel file in the browser
  without triggering a rebuild. This is intentional.
- **Academic / report style** — muted colors, serif headings (Libre Baskerville),
  print-friendly layout. Do not drift toward bright/modern UI styles.
- **GitHub Pages = static only** — no backend, no authentication, no server-side logic.
  If access control is needed, the architecture must change significantly.
- **CSS Modules** — all component styles use `.module.css` files. Do not mix with
  global styles except for variables defined in `index.css`.

---

## Pending Decisions

- [ ] Should the Raw Data tab be public, or suppressed / aggregated only?
- [ ] Should the dashboard be password-protected or public?
- [ ] What is the institution name for the header and footer?
- [ ] What is the exact ACRL survey name to display?
- [ ] Should the GitHub repo be public or private?
- [ ] Are there columns in the real data that should be excluded from display?

---

## Session Log

### Session 1 — Initial Build
- Scaffolded full Vite + React project
- Built dummy data generator with realistic ACRL-style fields
- Built FilterPanel, ChartCard, DataTable components
- Implemented CSV, Excel, PNG, SVG exports
- Academic report visual style applied
- README and deploy instructions written
- Identified data governance concern — ACRL publishes aggregated data only
- Real data not yet connected
- Next step: upload real Excel file and remap columns

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
