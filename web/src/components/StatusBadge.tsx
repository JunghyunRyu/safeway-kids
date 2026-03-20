interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, { bg: string; text: string }>;
}

const defaultColorMap: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  paid: { bg: 'bg-green-100', text: 'text-green-700' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  boarded: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700' },
  inactive: { bg: 'bg-red-100', text: 'text-red-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const statusLabels: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  paid: '결제완료',
  pending: '대기중',
  scheduled: '예정',
  boarded: '탑승',
  overdue: '연체',
  completed: '완료',
  cancelled: '취소',
};

export default function StatusBadge({ status, colorMap }: StatusBadgeProps) {
  const map = { ...defaultColorMap, ...colorMap };
  const normalized = status.toLowerCase();
  const colors = map[normalized] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  const label = statusLabels[normalized] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
}
