import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    onPrev?: () => void;
    onNext?: () => void;
    onPage?: (offset: number) => void;
  };
}

export function Table<T>({ columns, data, emptyMessage = "No data available.", pagination }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-10 text-center space-y-2">
        <div className="text-slate-300 text-4xl">empty</div>
        <div className="text-slate-400 text-sm italic">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col, i) => (
              <th 
                key={i} 
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={`px-4 py-3 text-sm text-slate-600 ${col.className || ''}`}>
                  {col.accessor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div className="mt-3 flex items-center gap-3">
          <button
            className="px-3 py-1 bg-slate-100 rounded"
            onClick={pagination.onPrev}
            disabled={pagination.offset === 0}
          >
            Prev
          </button>

          <button
            className="px-3 py-1 bg-slate-100 rounded"
            onClick={pagination.onNext}
            disabled={pagination.offset + pagination.limit >= pagination.total}
          >
            Next
          </button>

          <div className="ml-auto text-sm text-slate-500">
            {Math.min(pagination.total, pagination.offset + 1)}–{Math.min(pagination.total, pagination.offset + pagination.limit)} of {pagination.total}
          </div>
        </div>
      )}
    </div>
  );
}
