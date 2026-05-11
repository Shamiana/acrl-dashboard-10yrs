import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Export filtered data as CSV
export function exportCSV(data, filename = 'survey_data_filtered.csv') {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h];
    // Wrap in quotes if contains comma or quote
    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

// Export filtered data as Excel
export function exportExcel(data, filename = 'survey_data_filtered.xlsx') {
  if (!data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey Data');
  // Column widths
  const cols = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 12) }));
  worksheet['!cols'] = cols;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, filename);
}

// Export chart as PNG using html2canvas
export async function exportChartPNG(elementId, filename = 'chart.png') {
  const { default: html2canvas } = await import('html2canvas');
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element, {
    backgroundColor: '#fdfcf9',
    scale: 2,
    logging: false,
  });
  canvas.toBlob(blob => {
    saveAs(blob, filename);
  });
}

// Export chart as SVG (grabs the SVG element directly)
export function exportChartSVG(elementId, filename = 'chart.svg') {
  const container = document.getElementById(elementId);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, filename);
}
