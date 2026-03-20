import { useState, useMemo, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc';

function getNestedValue(obj: unknown, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 20,
  searchable = false,
  searchPlaceholder = '검색...',
  onSearch,
  actions,
  emptyMessage = '데이터가 없습니다.',
  loading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
    onSearch?.(value);
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      const cmp = strA.localeCompare(strB, 'ko');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(
    () => sorted.slice(page * pageSize, (page + 1) * pageSize),
    [sorted, page, pageSize]
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const hasActions = !!actions;
  const allColumns = columns;

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse" role="status" aria-label="데이터 로딩 중">
          <div className="h-12 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50 dark:border-gray-800">
              {allColumns.map((col) => (
                <div key={col.key} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ))}
          <span className="sr-only">데이터를 불러오는 중입니다</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                type="button"
                aria-label="검색어 지우기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden datatable-card-layout">
          {/* Count header */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              총 <strong className="text-gray-700 dark:text-gray-200">{sorted.length}</strong>건
            </span>
            {totalPages > 1 && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {page + 1} / {totalPages} 페이지
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr role="row">
                  {allColumns.map((col) => (
                    <th
                      key={col.key}
                      role="columnheader"
                      aria-sort={
                        col.sortable && sortKey === col.key
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : col.sortable
                            ? 'none'
                            : undefined
                      }
                      className={`text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap ${
                        col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''
                      }`}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.sortable && sortKey === col.key && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            {sortDir === 'asc' ? (
                              <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" />
                            ) : (
                              <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" />
                            )}
                          </svg>
                        )}
                      </span>
                    </th>
                  ))}
                  {hasActions && (
                    <th role="columnheader" className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      작업
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paged.map((row, idx) => (
                  <tr key={(row as Record<string, unknown>).id as string ?? idx} role="row" className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {allColumns.map((col) => (
                      <td key={col.key} role="cell" data-label={col.label} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {col.render
                          ? col.render(row)
                          : (getNestedValue(row, col.key) as ReactNode) ?? '-'}
                      </td>
                    ))}
                    {hasActions && (
                      <td role="cell" data-label="작업" className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="이전 페이지"
              >
                이전
              </button>
              <div className="flex items-center gap-1" role="navigation" aria-label="페이지 네비게이션">
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => {
                    // Show first, last, current, and neighbors
                    if (i === 0 || i === totalPages - 1) return true;
                    if (Math.abs(i - page) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, val) => {
                    const prev = acc[acc.length - 1];
                    if (typeof prev === 'number' && val - prev > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(val);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-2 text-gray-400 dark:text-gray-500 text-sm" aria-hidden="true">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        aria-label={`${item + 1} 페이지`}
                        aria-current={page === item ? 'page' : undefined}
                        className={`w-8 h-8 text-sm rounded-lg ${
                          page === item
                            ? 'bg-teal-600 text-white font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {item + 1}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="다음 페이지"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
