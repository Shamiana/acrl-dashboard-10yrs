import React, { useState } from 'react';
import { exportCSV, exportExcel } from '../utils/exportUtils.js';
import styles from './DataTable.module.css';

const PAGE_SIZE = 20;

export default function DataTable({ data }) {
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('year');
  const [sortDir, setSortDir] = useState('asc');

  if (!data.length) return <p className={styles.empty}>No data matches the current filters.</p>;

  const columns = Object.keys(data[0]);

  const sorted = [...data].sort((a, b) => {
    const va = a[sortCol], vb = b[sortCol];
    if (va === vb) return 0;
    const cmp = va < vb ? -1 : 1;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = col => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar + ' no-print'}>
        <span className={styles.info}>
          Showing {((page-1)*PAGE_SIZE+1).toLocaleString()}–{Math.min(page*PAGE_SIZE, sorted.length).toLocaleString()} of {sorted.length.toLocaleString()} rows
        </span>
        <div className={styles.exportGroup}>
          <button className={styles.exportBtn} onClick={() => exportCSV(data)}>
            ↓ CSV
          </button>
          <button className={styles.exportBtn} onClick={() => exportExcel(data)}>
            ↓ Excel
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className={styles.th + (sortCol === col ? ' ' + styles.sorted : '')}
                  onClick={() => handleSort(col)}
                >
                  {col}
                  <span className={styles.sortIcon}>
                    {sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                {columns.map(col => (
                  <td key={col} className={styles.td}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination + ' no-print'}>
        <button
          className={styles.pageBtn}
          disabled={page === 1}
          onClick={() => setPage(1)}
        >«</button>
        <button
          className={styles.pageBtn}
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >‹</button>
        <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
        <button
          className={styles.pageBtn}
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >›</button>
        <button
          className={styles.pageBtn}
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
        >»</button>
      </div>
    </div>
  );
}
