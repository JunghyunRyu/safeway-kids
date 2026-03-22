import { type ReactNode } from 'react';
import { useModalOverlay } from '../hooks/useModalOverlay';

interface DetailField {
  label: string;
  value: string | ReactNode;
}

interface DetailModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  fields: DetailField[];
  actions?: ReactNode;
}

export default function DetailModal({
  open,
  title,
  onClose,
  fields,
  actions,
}: DetailModalProps) {
  const modalRef = useModalOverlay({
    open,
    onClose,
    focusSelector: 'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        aria-describedby="detail-modal-body"
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 id="detail-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div id="detail-modal-body" className="flex-1 overflow-y-auto px-6 py-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {fields.map((field, idx) => (
              <div key={idx} className="col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{field.label}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{field.value || '-'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          {actions}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
