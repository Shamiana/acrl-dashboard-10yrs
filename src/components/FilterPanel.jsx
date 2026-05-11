import React from 'react';
import { shortName } from '../utils/dataUtils.js';
import styles from './FilterPanel.module.css';

export default function FilterPanel({ filters, options, onChange, stats }) {
  const { years, institutions } = options;
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  // Empty array means all selected
  const allSelected = filters.institutions.length === 0;

  function toggleInstitution(inst) {
    if (allSelected) {
      // Currently showing all — deselect this one (show all except it)
      onChange('institutions', institutions.filter(i => i !== inst));
    } else if (filters.institutions.includes(inst)) {
      const next = filters.institutions.filter(i => i !== inst);
      // If removing the last one, go back to "all"
      onChange('institutions', next.length === 0 ? [] : next);
    } else {
      const next = [...filters.institutions, inst];
      // If all are now checked, simplify back to []
      onChange('institutions', next.length === institutions.length ? [] : next);
    }
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Filters</h3>
        <span className={styles.count}>
          {stats.institutions} inst · {stats.years} yr
        </span>
      </div>

      {/* Year Range */}
      <div className={styles.filterGroup}>
        <label className={styles.label}>Year Range</label>
        <div className={styles.yearDisplay}>
          <span>{filters.yearMin}</span>
          <span>–</span>
          <span>{filters.yearMax}</span>
        </div>
        <div className={styles.rangeRow}>
          <span className={styles.rangeLabel}>{minYear}</span>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={filters.yearMin}
            className={styles.range}
            onChange={e => {
              const val = parseInt(e.target.value);
              if (val <= filters.yearMax) onChange('yearMin', val);
            }}
          />
        </div>
        <div className={styles.rangeRow}>
          <span className={styles.rangeLabel}>{maxYear}</span>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={filters.yearMax}
            className={styles.range}
            onChange={e => {
              const val = parseInt(e.target.value);
              if (val >= filters.yearMin) onChange('yearMax', val);
            }}
          />
        </div>
      </div>

      {/* Institutions */}
      <div className={styles.filterGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Institutions</label>
          <div className={styles.checkControls}>
            <button
              className={styles.microBtn + (allSelected ? ' ' + styles.microBtnActive : '')}
              onClick={() => onChange('institutions', [])}
            >All</button>
          </div>
        </div>
        <div className={styles.checkList}>
          {institutions.map(inst => {
            const checked = allSelected || filters.institutions.includes(inst);
            return (
              <label key={inst} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleInstitution(inst)}
                />
                <span className={styles.checkLabel}>{shortName(inst)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        className={styles.resetBtn}
        onClick={() => onChange('reset', null)}
      >
        Reset All Filters
      </button>
    </aside>
  );
}
