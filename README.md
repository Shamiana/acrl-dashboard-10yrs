# Survey Dashboard — GitHub Pages

A React-based interactive dashboard for 10 years of longitudinal survey data.
Built with Vite, Recharts, and SheetJS. Deployable to GitHub Pages.

---

## Features

- **Year range slider** — slice any 1–10 year window
- **Multi-dimensional filters** — Region, Gender, Income, Employment
- **5 visualization tabs**: Overview, Trends, Demographics, Open Responses, Raw Data
- **Chart exports** — PNG and SVG per chart
- **Data exports** — filtered CSV and Excel downloads
- **Upload your own Excel file** — no rebuild required

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```
Open http://localhost:5173

---

## Swapping in Your Real Data

### Option A — Upload in the browser (easiest)
Click **"↑ Upload Your Excel File"** in the header.
Your file must have these columns (case-sensitive):

| Column | Type | Example |
|---|---|---|
| Year | Number | 2018 |
| RespondentID | Text | R00042 |
| Age | Number | 34 |
| Income | Text | $50k–$75k |
| Gender | Text | Female |
| Region | Text | Northeast |
| EmploymentStatus | Text | Full-time |
| HasHealthInsurance | Yes / No | Yes |
| OwnHome | Yes / No | No |
| SatisfactionScore | Number 1–5 | 3.5 |
| TrustInstitutions | Number 1–5 | 2.8 |
| OpenFeedback | Text | Better services needed. |

> **Tip**: Your column names can differ — update `src/utils/dataUtils.js` and  
> the chart logic in `src/App.jsx` to match your actual column names.

### Option B — Bundle the file at build time
1. Convert your Excel to JSON: `npx xlsx-to-json yourfile.xlsx`
2. Save as `src/data/surveyData.json`
3. In `src/utils/dataUtils.js`, replace `generateSurveyData()` with:
   ```js
   import data from '../data/surveyData.json'
   export function loadDummyData() { return data; }
   ```

---

## Deploying to GitHub Pages

### 1. Create a GitHub repository

Go to https://github.com/new and create a new repo (e.g. `survey-dashboard`).

### 2. Set the base URL

In `vite.config.js`, update `base` to match your repo name:
```js
base: '/survey-dashboard/',  // ← your repo name here
```

### 3. Push your code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/survey-dashboard.git
git push -u origin main
```

### 4. Deploy

```bash
npm run deploy
```

This runs `vite build` then pushes the `dist/` folder to the `gh-pages` branch.

### 5. Enable GitHub Pages

- Go to your repo → **Settings** → **Pages**
- Under **Source**, select **Deploy from a branch**
- Branch: `gh-pages` / folder: `/ (root)`
- Click **Save**

Your site will be live at:  
`https://YOUR_USERNAME.github.io/survey-dashboard/`

### Re-deploying after changes

```bash
npm run deploy
```

---

## Customizing Charts

Charts are in `src/App.jsx`. Each is wrapped in a `<ChartCard>` component
that provides the PNG/SVG export buttons. To add a new chart:

```jsx
<ChartCard title="My New Chart" subtitle="description" chartId="chart-my-new">
  <ResponsiveContainer width="100%" height={280}>
    {/* Recharts component here */}
  </ResponsiveContainer>
</ChartCard>
```

---

## Project Structure

```
survey-dashboard/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx              ← All tabs & chart logic
    ├── App.module.css
    ├── index.css
    ├── components/
    │   ├── FilterPanel.jsx  ← Sidebar filters
    │   ├── ChartCard.jsx    ← Chart wrapper + export
    │   └── DataTable.jsx    ← Paginated sortable table
    ├── data/
    │   └── generateData.js  ← Dummy data (replace with real)
    └── utils/
        ├── dataUtils.js     ← Filter & parse logic
        └── exportUtils.js   ← CSV, Excel, PNG, SVG exports
```

---

## Tech Stack

| Library | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| Recharts | Charts |
| SheetJS (xlsx) | Excel read/write |
| file-saver | Download trigger |
| html2canvas | Chart → PNG |
| gh-pages | Deploy to GitHub Pages |
