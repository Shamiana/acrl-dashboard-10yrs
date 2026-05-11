import React from 'react';
import { shortName } from '../utils/dataUtils.js';
import styles from './FilterPanel.module.css';

export default function FilterPanel({ filters, options, onChange, stats }) {
  const { years, institutions } = options;

  const allYearsSelected = filters.years.length === 0;
  const allInstsSelected = filters.institutions.length === 0;

  function toggleYear(yr) {
    if (allYearsSelected) {
      onChange('years', years.filter(y => y !== yr));
    } else if (filters.years.includes(yr)) {
      const next = filters.years.filter(y => y !== yr);
      onChange('years', next.length === 0 ? [] : next);
    } else {
      const next = [...filters.years, yr];
      onChange('years', next.length === years.length ? [] : next);
    }
  }

  function toggleInstitution(inst) {
    if (allInstsSelected) {
      onChange('institutions', institutions.filter(i => i !== inst));
    } else if (filters.institutions.includes(inst)) {
      const next = filters.institutions.filter(i => i !== inst);
      onChange('institutions', next.length === 0 ? [] : next);
    } else {
      const next = [...filters.institutions, inst];
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

      {/* Years */}
      <div className={styles.filterGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Years</label>
          <div className={styles.checkControls}>
            <button
              className={styles.microBtn + (allYearsSelected ? ' ' + styles.microBtnActive : '')}
              onClick={() => onChange('years', [])}
            >All</button>
          </div>
        </div>
        <div className={styles.checkList}>
          {years.map(yr => {
            const checked = allYearsSelected || filters.years.includes(yr);
            return (
              <label key={yr} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleYear(yr)}
                />
                <span className={styles.checkLabel}>{yr}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Institutions */}
      <div className={styles.filterGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Institutions</label>
          <div className={styles.checkControls}>
            <button
              className={styles.microBtn + (allInstsSelected ? ' ' + styles.microBtnActive : '')}
              onClick={() => onChange('institutions', [])}
            >All</button>
          </div>
        </div>
        <div className={styles.checkList}>
          {institutions.map(inst => {
            const checked = allInstsSelected || filters.institutions.includes(inst);
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
