import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  parseExcelFile, deriveFilters, applyFilters,
  getQuestionIndex, getCategorizedQuestions,
  detectResponseType, parseNumeric, shortName,
} from './utils/dataUtils.js';
import FilterPanel from './components/FilterPanel.jsx';
import ChartCard from './components/ChartCard.jsx';
import DataTable from './components/DataTable.jsx';
import styles from './App.module.css';

function MultiDropdown({ label, options, selected, onChange, renderLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const allSelected = selected.length === options.length;
  const noneSelected = selected.length === 0;
  const summary = noneSelected
    ? `No ${label} selected`
    : allSelected
    ? `All ${label}`
    : `${selected.length} of ${options.length} ${label}`;

  return (
    <div className={styles.mdWrap} ref={ref}>
      <button
        type="button"
        className={styles.mdTrigger + (open ? ' ' + styles.mdTriggerOpen : '')}
        onClick={() => setOpen(o => !o)}
      >
        <span>{summary}</span>
        <span className={styles.mdArrow}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className={styles.mdPanel}>
          <div className={styles.mdControls}>
            <button type="button" className={styles.mdCtrlBtn} onClick={() => onChange([...options])}>
              Select All
            </button>
            <button type="button" className={styles.mdCtrlBtn} onClick={() => onChange([])}>
              Deselect All
            </button>
          </div>
          <div className={styles.mdList}>
            {options.map(opt => {
              const checked = selected.includes(opt);
              return (
                <label key={String(opt)} className={styles.mdItem}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(selected.filter(o => o !== opt));
                      else onChange([...selected, opt]);
                    }}
                  />
                  <span className={styles.mdItemLabel}>
                    {renderLabel ? renderLabel(opt) : String(opt)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const COLORS = [
  '#2c4a6e','#8b4513','#2d5a27','#6b4c8b','#4a7a8a','#8a6b2c',
  '#c05a2e','#3a6b5a','#5a3a6b','#6b7a2c','#2e5a8a','#8a2e5a',
];
const color = i => COLORS[i % COLORS.length];

export default function App() {
  const [data, setData] = useState([]);
  const [options, setOptions] = useState({ years: [], institutions: [] });
  const [filters, setFilters] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);

  // Explore tab
  const [exploreQuestion, setExploreQuestion] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [chartView, setChartView] = useState('combined');

  // Trends tab
  const [trendsQuestion, setTrendsQuestion] = useState('');

  // Raw Data tab — independent filters
  const [rawYears, setRawYears] = useState([]);
  const [rawInsts, setRawInsts] = useState([]);
  const [rawQSet, setRawQSet] = useState(null); // null = all questions selected
  const [rawExpanded, setRawExpanded] = useState(new Set());

  const filteredData = useMemo(
    () => (filters ? applyFilters(data, filters) : data),
    [data, filters]
  );

  const questionIndex = useMemo(() => getQuestionIndex(filteredData), [filteredData]);
  const categorizedQuestions = useMemo(() => getCategorizedQuestions(questionIndex), [questionIndex]);

  const rawCategorized = useMemo(() => getCategorizedQuestions(getQuestionIndex(data)), [data]);

  const totalRawQCount = useMemo(
    () => rawCategorized.reduce((n, g) => n + g.questions.length, 0),
    [rawCategorized]
  );

  const rawData = useMemo(() => {
    return data.filter(row => {
      if (rawYears.length > 0 && !rawYears.includes(row.year)) return false;
      if (rawInsts.length > 0 && !rawInsts.includes(row.institution)) return false;
      if (rawQSet !== null && !rawQSet.has(row.question)) return false;
      return true;
    });
  }, [data, rawYears, rawInsts, rawQSet]);

  const filterStats = useMemo(() => {
    const insts = new Set(filteredData.map(r => r.institution));
    const yrs = new Set(filteredData.map(r => r.year));
    return { institutions: insts.size, years: yrs.size };
  }, [filteredData]);

  const selectedRows = useMemo(
    () => filteredData.filter(r => r.question === exploreQuestion),
    [filteredData, exploreQuestion]
  );

  const responseType = useMemo(() => detectResponseType(selectedRows), [selectedRows]);

  const numericQuestions = useMemo(() => {
    return questionIndex.filter(q => {
      if (q.years.length < 2) return false;
      const rows = filteredData.filter(r => r.question === q.question);
      return detectResponseType(rows) === 'numeric';
    });
  }, [questionIndex, filteredData]);

  const trendsRows = useMemo(
    () => filteredData.filter(r => r.question === trendsQuestion),
    [filteredData, trendsQuestion]
  );

  const coverageGrid = useMemo(() => {
    const years = options.years;
    const instSet = new Set(filteredData.map(r => r.institution));
    const insts = [...instSet].sort();
    const grid = {};
    filteredData.forEach(r => {
      if (!grid[r.institution]) grid[r.institution] = new Set();
      grid[r.institution].add(r.year);
    });
    return { years, insts, grid };
  }, [filteredData, options.years]);

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({ years: [], institutions: [] });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const rows = await parseExcelFile(file);
      const opts = deriveFilters(rows);
      setData(rows);
      setOptions(opts);
      setFilters({ years: [], institutions: [] });
      setExploreQuestion('');
      setQuestionSearch('');
      setTrendsQuestion('');
      setRawYears(opts.years);
      setRawInsts(opts.institutions);
      setRawQSet(null);
      setRawExpanded(new Set());
    } catch {
      alert('Could not read file. Please upload the master Excel file.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const toggleRawSection = useCallback((sectionQuestions) => {
    const qNames = sectionQuestions.map(q => q.question);
    setRawQSet(prev => {
      if (prev === null) {
        const allQNames = rawCategorized.flatMap(g => g.questions.map(q => q.question));
        return new Set(allQNames.filter(n => !qNames.includes(n)));
      }
      const allIn = qNames.every(n => prev.has(n));
      if (allIn) {
        return new Set([...prev].filter(n => !qNames.includes(n)));
      } else {
        const next = new Set([...prev, ...qNames]);
        return next.size >= totalRawQCount ? null : next;
      }
    });
  }, [rawCategorized, totalRawQCount]);

  const toggleRawQuestion = useCallback((qName) => {
    setRawQSet(prev => {
      if (prev === null) {
        const allQNames = rawCategorized.flatMap(g => g.questions.map(q => q.question));
        return new Set(allQNames.filter(n => n !== qName));
      }
      if (prev.has(qName)) {
        return new Set([...prev].filter(n => n !== qName));
      } else {
        const next = new Set([...prev, qName]);
        return next.size >= totalRawQCount ? null : next;
      }
    });
  }, [rawCategorized, totalRawQCount]);

  const resetRawFilters = useCallback(() => {
    setRawYears(options.years);
    setRawInsts(options.institutions);
    setRawQSet(null);
  }, [options.years, options.institutions]);

  // ── Chart components ──────────────────────────────────────────────────────

  function NumericChart({ rows }) {
    const years = [...new Set(rows.map(r => r.year))].sort();
    const insts = [...new Set(rows.map(r => r.institution))].sort();

    // Side-by-side: one bar chart per year
    if (chartView === 'split' && years.length > 1) {
      return (
        <div className={styles.splitGrid}>
          {years.map(yr => {
            const barData = insts
              .map(inst => {
                const row = rows.find(r => r.institution === inst && r.year === yr);
                return { inst: shortName(inst), value: row ? parseNumeric(row.response) : null };
              })
              .filter(d => d.value !== null)
              .sort((a, b) => b.value - a.value);
            return (
              <ChartCard key={yr} title={String(yr)} subtitle={exploreQuestion} chartId={`chart-split-${yr}`}>
                <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 22)}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d8d4cc" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => v?.toLocaleString()} />
                    <YAxis type="category" dataKey="inst" tick={{ fontSize: 10 }} width={88} />
                    <Tooltip formatter={v => v?.toLocaleString()} contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="value" name="Value" radius={[0, 2, 2, 0]}>
                      {barData.map((_, i) => <Cell key={i} fill={color(i)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            );
          })}
        </div>
      );
    }

    // Combined multi-year: line chart
    if (years.length >= 2) {
      const lineData = years.map(yr => {
        const point = { year: String(yr) };
        insts.forEach(inst => {
          const row = rows.find(r => r.institution === inst && r.year === yr);
          point[shortName(inst)] = row ? parseNumeric(row.response) : null;
        });
        return point;
      });
      return (
        <ChartCard title={exploreQuestion} subtitle="Year-over-year by institution" chartId="chart-explore-trend">
          <ResponsiveContainer width="100%" height={Math.max(280, insts.length * 18)}>
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8d4cc" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v?.toLocaleString()} />
              <Tooltip formatter={v => v?.toLocaleString()} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {insts.map((inst, i) => (
                <Line
                  key={inst}
                  type="monotone"
                  dataKey={shortName(inst)}
                  stroke={color(i)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    }

    // Single year: horizontal bar chart
    const yr = years[0];
    const barData = insts
      .map(inst => {
        const row = rows.find(r => r.institution === inst && r.year === yr);
        return { inst: shortName(inst), value: row ? parseNumeric(row.response) : null };
      })
      .filter(d => d.value !== null)
      .sort((a, b) => b.value - a.value);

    return (
      <ChartCard title={exploreQuestion} subtitle={`${yr} — all institutions`} chartId="chart-explore-bar">
        <ResponsiveContainer width="100%" height={Math.max(260, barData.length * 26)}>
          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8d4cc" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => v?.toLocaleString()} />
            <YAxis type="category" dataKey="inst" tick={{ fontSize: 11 }} width={88} />
            <Tooltip formatter={v => v?.toLocaleString()} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="value" name="Value" radius={[0, 2, 2, 0]}>
              {barData.map((_, i) => <Cell key={i} fill={color(i)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  function CategoricalChart({ rows }) {
    const years = [...new Set(rows.map(r => r.year))].sort();
    const allValues = [...new Set(rows.map(r => String(r.response || '').trim()).filter(Boolean))].sort();

    const chartData = years.map(yr => {
      const point = { year: String(yr) };
      const yearRows = rows.filter(r => r.year === yr);
      allValues.forEach(val => {
        point[val] = yearRows.filter(r => String(r.response || '').trim() === val).length;
      });
      return point;
    });

    return (
      <ChartCard title={exploreQuestion} subtitle="Response counts by year" chartId="chart-explore-cat">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8d4cc" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {allValues.map((val, i) => (
              <Bar key={val} dataKey={val} stackId="a" fill={color(i)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  function MultiselectChart({ rows }) {
    const freq = {};
    rows.forEach(r => {
      if (!r.response) return;
      String(r.response).split('|').forEach(opt => {
        const o = opt.trim();
        if (o) freq[o] = (freq[o] || 0) + 1;
      });
    });
    const chartData = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([option, count]) => ({
        option: option.length > 50 ? option.slice(0, 50) + '…' : option,
        count,
      }));

    return (
      <ChartCard title={exploreQuestion} subtitle="Option frequency (top 15)" chartId="chart-explore-multi">
        <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 28)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 240, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8d4cc" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="option" tick={{ fontSize: 10 }} width={238} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" name="Selections" fill="#2c4a6e" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  function FreetextSamples({ rows }) {
    return (
      <div className={styles.textSample}>
        <h3 className={styles.sampleTitle}>{exploreQuestion}</h3>
        <div className={styles.sampleList}>
          {rows.filter(r => r.response).slice(0, 20).map((r, i) => (
            <div key={i} className={styles.sampleItem}>
              <span className={styles.sampleMeta}>{r.year} · {shortName(r.institution)}</span>
              <p className={styles.sampleText}>{String(r.response)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Upload state ──────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div>
              <p className={styles.kicker}>CUNY Library Systems Office</p>
              <h1 className={styles.title}>ACRL Benchmark Dashboard</h1>
              <p className={styles.subtitle}>Academic library survey data · All CUNY campuses</p>
            </div>
          </div>
        </header>
        <div className={styles.uploadPrompt}>
          <div className={styles.uploadCard}>
            <p className={styles.uploadIcon}>↑</p>
            <h2 className={styles.uploadHeading}>Upload the master Excel file</h2>
            <p className={styles.uploadHint}>
              Select <strong>2026 Survey 2015-2025_ACRL_master.xlsx</strong>.<br />
              The file is read locally — nothing is sent to a server.
            </p>
            <label className={styles.uploadBtn}>
              <input
                type="file"
                accept=".xlsx,.xls"
                className={styles.fileInput}
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading ? 'Loading…' : 'Choose File'}
            </label>
          </div>
        </div>
        <footer className={styles.footer}>
          <p>ACRL Benchmark Dashboard · CUNY Library Systems Office</p>
        </footer>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'explore',  label: 'Explore' },
    { id: 'trends',   label: 'Trends' },
    { id: 'data',     label: 'Raw Data' },
  ];

  const selectedYears = filters.years.length > 0 ? filters.years : options.years;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.kicker}>CUNY Library Systems Office</p>
            <h1 className={styles.title}>ACRL Benchmark Dashboard</h1>
            <p className={styles.subtitle}>
              {options.years[0]}–{options.years[options.years.length - 1]} ·{' '}
              {options.institutions.length} institutions · {questionIndex.length} questions
            </p>
          </div>
          <label className={styles.uploadLabel + ' no-print'}>
            <input
              type="file"
              accept=".xlsx,.xls"
              className={styles.fileInput}
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading ? 'Loading…' : '↑ Load New File'}
          </label>
        </div>
      </header>

      <div className={styles.layout}>
        <FilterPanel
          filters={filters}
          options={options}
          onChange={handleFilterChange}
          stats={filterStats}
        />

        <main className={styles.main}>
          <nav className={styles.tabs + ' no-print'}>
            {tabs.map(t => (
              <button
                key={t.id}
                className={styles.tab + (activeTab === t.id ? ' ' + styles.tabActive : '')}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className={styles.section}>
              <div className={styles.statsRow}>
                {[
                  { label: 'Institutions', value: filterStats.institutions },
                  { label: 'Years', value: filterStats.years },
                  { label: 'Questions', value: questionIndex.length },
                  { label: 'Data Points', value: filteredData.length.toLocaleString() },
                ].map(s => (
                  <div key={s.label} className={styles.statCard}>
                    <div className={styles.statValue}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Data Coverage by Institution and Year</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.coverageTable}>
                    <thead>
                      <tr>
                        <th className={styles.covTh}>Institution</th>
                        {coverageGrid.years.map(yr => (
                          <th key={yr} className={styles.covTh}>{yr}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coverageGrid.insts.map(inst => (
                        <tr key={inst}>
                          <td className={styles.covInstCell}>{shortName(inst)}</td>
                          {coverageGrid.years.map(yr => (
                            <td key={yr} className={styles.covCell}>
                              {coverageGrid.grid[inst]?.has(yr) ? (
                                <span className={styles.covCheck}>✓</span>
                              ) : (
                                <span className={styles.covMiss}>—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── EXPLORE ── */}
          {activeTab === 'explore' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <div className={styles.pickerLabel}>Select a question</div>
                <div className={styles.questionPickerWrap}>
                  <input
                    type="text"
                    className={styles.questionSearch}
                    placeholder="Type to search questions…"
                    value={questionSearch}
                    onChange={e => setQuestionSearch(e.target.value)}
                  />
                  <select
                    className={styles.questionSelect}
                    size="12"
                    value={exploreQuestion}
                    onChange={e => {
                      setExploreQuestion(e.target.value);
                      setChartView('combined');
                    }}
                  >
                    {categorizedQuestions.map(group => {
                      const filtered = group.questions.filter(q =>
                        !questionSearch ||
                        q.question.toLowerCase().includes(questionSearch.toLowerCase())
                      );
                      if (!filtered.length) return null;
                      return (
                        <optgroup
                          key={group.label}
                          label={`${group.type === 'core' ? '● CORE' : '○ OPTIONAL'} — ${group.label}`}
                        >
                          {filtered.map(q => (
                            <option key={q.question} value={q.question}>
                              {q.question}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              </div>

              {!exploreQuestion && (
                <div className={styles.emptyHint}>
                  Search or scroll the list above to select a question.
                </div>
              )}

              {exploreQuestion && responseType === 'numeric' && selectedRows.length > 0 && (
                <div className={styles.chartToggleRow + ' no-print'}>
                  {['combined', 'split'].map(v => (
                    <button
                      key={v}
                      className={styles.toggleBtn + (chartView === v ? ' ' + styles.toggleBtnActive : '')}
                      onClick={() => setChartView(v)}
                    >
                      {v === 'combined' ? 'Combined' : 'Side by Side'}
                    </button>
                  ))}
                </div>
              )}

              {exploreQuestion && responseType === 'numeric' && <NumericChart rows={selectedRows} />}
              {exploreQuestion && responseType === 'categorical' && <CategoricalChart rows={selectedRows} />}
              {exploreQuestion && responseType === 'multiselect' && <MultiselectChart rows={selectedRows} />}
              {exploreQuestion && responseType === 'freetext' && <FreetextSamples rows={selectedRows} />}
              {exploreQuestion && responseType === 'empty' && (
                <div className={styles.emptyHint}>No responses for this question in the current filter.</div>
              )}
            </div>
          )}

          {/* ── TRENDS ── */}
          {activeTab === 'trends' && (
            <div className={styles.section}>
              <div className={styles.card}>
                <div className={styles.explorePickers}>
                  <div className={styles.pickerGroup} style={{ flex: 2 }}>
                    <label className={styles.pickerLabel}>
                      Numeric question with data in multiple years
                    </label>
                    <select
                      className={styles.pickerSelect}
                      value={trendsQuestion}
                      onChange={e => setTrendsQuestion(e.target.value)}
                    >
                      <option value="">— Choose question —</option>
                      {numericQuestions.map(q => (
                        <option key={q.question} value={q.question}>
                          [{q.section}] {q.question}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {numericQuestions.length === 0 && (
                  <p className={styles.emptyHint} style={{ marginTop: '0.5rem' }}>
                    No numeric questions with multiple years in the current filter.
                  </p>
                )}
              </div>

              {trendsQuestion && (() => {
                const insts = [...new Set(trendsRows.map(r => r.institution))].sort();
                const years = [...new Set(trendsRows.map(r => r.year))].sort();
                const lineData = years.map(yr => {
                  const point = { year: String(yr) };
                  insts.forEach(inst => {
                    const row = trendsRows.find(r => r.institution === inst && r.year === yr);
                    point[shortName(inst)] = row ? parseNumeric(row.response) : null;
                  });
                  return point;
                });
                return (
                  <ChartCard
                    title={trendsQuestion}
                    subtitle="Year-over-year by institution"
                    chartId="chart-trends-main"
                  >
                    <ResponsiveContainer width="100%" height={Math.max(300, insts.length * 16)}>
                      <LineChart data={lineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d8d4cc" />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v?.toLocaleString()} />
                        <Tooltip formatter={v => v?.toLocaleString()} contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {insts.map((inst, i) => (
                          <Line
                            key={inst}
                            type="monotone"
                            dataKey={shortName(inst)}
                            stroke={color(i)}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                );
              })()}

              {!trendsQuestion && numericQuestions.length > 0 && (
                <div className={styles.emptyHint}>Select a question above to see the trend.</div>
              )}
            </div>
          )}

          {/* ── RAW DATA ── */}
          {activeTab === 'data' && (
            <div className={styles.section}>

              {/* Year + Institution dropdowns */}
              <div className={styles.rawFilterBar}>
                <MultiDropdown
                  label="Years"
                  options={options.years}
                  selected={rawYears}
                  onChange={setRawYears}
                />
                <MultiDropdown
                  label="Institutions"
                  options={options.institutions}
                  selected={rawInsts}
                  onChange={setRawInsts}
                  renderLabel={shortName}
                />
                <button type="button" className={styles.rawResetBtn} onClick={resetRawFilters}>
                  Reset Filters
                </button>
              </div>

              {/* Section / question accordion */}
              <div className={styles.rawQCard}>
                <div className={styles.rawQHeader}>
                  <span className={styles.cardTitle} style={{ marginBottom: 0 }}>Questions</span>
                  <span className={styles.rawQCount}>
                    {rawQSet === null ? totalRawQCount : rawQSet.size} of {totalRawQCount} selected
                  </span>
                  <div className={styles.rawQGlobalBtns}>
                    <button type="button" className={styles.rawGlobalBtn} onClick={() => setRawQSet(null)}>All</button>
                    <button type="button" className={styles.rawGlobalBtn} onClick={() => setRawQSet(new Set())}>None</button>
                  </div>
                </div>

                {rawCategorized.map(group => {
                  const qNames = group.questions.map(q => q.question);
                  const expanded = rawExpanded.has(group.label);
                  const checkedCount = rawQSet === null
                    ? qNames.length
                    : qNames.filter(n => rawQSet.has(n)).length;
                  const sectionChecked = checkedCount === qNames.length;
                  const sectionIndeterminate = checkedCount > 0 && checkedCount < qNames.length;

                  return (
                    <div key={group.label} className={styles.rawSection}>
                      <div className={styles.rawSectionHeader}>
                        <button
                          type="button"
                          className={styles.rawExpandBtn}
                          onClick={() => setRawExpanded(prev => {
                            const next = new Set(prev);
                            next.has(group.label) ? next.delete(group.label) : next.add(group.label);
                            return next;
                          })}
                        >
                          {expanded ? '▾' : '▸'}
                        </button>
                        <input
                          type="checkbox"
                          checked={sectionChecked}
                          ref={el => { if (el) el.indeterminate = sectionIndeterminate; }}
                          onChange={() => toggleRawSection(group.questions)}
                        />
                        <span className={styles.rawSectionLabel}>
                          {group.type === 'core' ? '● ' : '○ '}{group.label}
                        </span>
                        <span className={styles.rawSectionCount}>{checkedCount}/{qNames.length}</span>
                      </div>

                      {expanded && (
                        <div className={styles.rawQList}>
                          {group.questions.map(q => {
                            const checked = rawQSet === null || rawQSet.has(q.question);
                            return (
                              <label key={q.question} className={styles.rawQItem}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleRawQuestion(q.question)}
                                />
                                <span className={styles.rawQLabel}>{q.question}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <DataTable data={rawData} />
            </div>
          )}
        </main>
      </div>

      <footer className={styles.footer}>
        <p>ACRL Benchmark Dashboard · CUNY Library Systems Office</p>
      </footer>
    </div>
  );
}
