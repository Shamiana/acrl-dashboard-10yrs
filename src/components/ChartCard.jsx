import React, { useRef } from 'react';
import { exportChartPNG, exportChartSVG } from '../utils/exportUtils.js';
import styles from './ChartCard.module.css';

let cardCounter = 0;

export default function ChartCard({ title, subtitle, children, chartId: propId }) {
  const idRef = useRef(propId || `chart-card-${++cardCounter}`);
  const chartId = idRef.current;

  return (
    <div className={styles.card} id={chartId}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.exportBtns + ' no-print'}>
          <button
            className={styles.exportBtn}
            title="Export as PNG"
            onClick={() => exportChartPNG(chartId, `${title.replace(/\s+/g, '_')}.png`)}
          >
            PNG
          </button>
          <button
            className={styles.exportBtn}
            title="Export as SVG"
            onClick={() => exportChartSVG(chartId, `${title.replace(/\s+/g, '_')}.svg`)}
          >
            SVG
          </button>
        </div>
      </div>
      <div className={styles.chartArea}>
        {children}
      </div>
    </div>
  );
}
