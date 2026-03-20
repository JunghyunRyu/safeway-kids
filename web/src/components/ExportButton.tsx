interface ExportColumn {
  key: string;
  label: string;
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
}

function escapeCsvField(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // Escape fields containing commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCsv(data: Record<string, unknown>[], columns: ExportColumn[]): string {
  const header = columns.map((col) => escapeCsvField(col.label)).join(',');
  const rows = data.map((row) =>
    columns.map((col) => escapeCsvField(row[col.key])).join(',')
  );
  return [header, ...rows].join('\r\n');
}

function downloadCsv(csvContent: string, filename: string) {
  // BOM for Korean character support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;
    const csv = generateCsv(data, columns);
    downloadCsv(csv, filename);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
      title="CSV 내보내기"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      CSV 내보내기
    </button>
  );
}
