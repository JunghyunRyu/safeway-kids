/**
 * Opens a printable invoice receipt in a new browser tab.
 * The user can then use the browser's print dialog to save as PDF.
 */

interface InvoiceData {
  id: string;
  billing_month: string;
  total_rides: number;
  amount: number;
  status: string;
  due_date?: string;
  paid_at?: string | null;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return '결제 완료';
    case 'pending':
      return '미결제';
    case 'overdue':
      return '연체';
    default:
      return status;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'overdue':
      return 'overdue';
    default:
      return 'pending';
  }
}

export function openInvoiceReceipt(invoice: InvoiceData): void {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <title>SafeWay Kids 청구서 #${invoice.id.slice(0, 8)}</title>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0F7A7A;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header h1 {
      color: #0F7A7A;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .header p {
      color: #666;
      font-size: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
      font-size: 15px;
    }
    th {
      color: #666;
      font-weight: 500;
      width: 140px;
    }
    td {
      color: #333;
      font-weight: 400;
    }
    .total {
      font-size: 28px;
      font-weight: 700;
      color: #0F7A7A;
      text-align: right;
      margin: 24px 0;
      padding-top: 16px;
      border-top: 2px solid #eee;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
    }
    .status.paid { background: #DEF7EC; color: #03543F; }
    .status.pending { background: #FEF3C7; color: #92400E; }
    .status.overdue { background: #FDE8E8; color: #9B1C1C; }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .footer p { margin-bottom: 4px; }
    .print-btn {
      background: #0F7A7A;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      font-family: inherit;
    }
    .print-btn:hover { background: #0d6b6b; }
    .actions { text-align: center; margin-top: 30px; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SafeWay Kids</h1>
    <p>청구서</p>
  </div>
  <table>
    <tr><th>청구서 번호</th><td>${invoice.id.slice(0, 8).toUpperCase()}</td></tr>
    <tr><th>청구 월</th><td>${invoice.billing_month}</td></tr>
    <tr><th>탑승 횟수</th><td>${invoice.total_rides}회</td></tr>
    <tr><th>납부 기한</th><td>${invoice.due_date || '-'}</td></tr>
    <tr><th>상태</th><td><span class="status ${statusClass(invoice.status)}">${statusLabel(invoice.status)}</span></td></tr>
    ${invoice.paid_at ? `<tr><th>결제일</th><td>${invoice.paid_at}</td></tr>` : ''}
  </table>
  <div class="total">${'\u20A9'}${invoice.amount.toLocaleString()}</div>
  <div class="actions no-print">
    <button class="print-btn" onclick="window.print()">인쇄 / PDF 저장</button>
  </div>
  <div class="footer">
    <p>SafeWay Kids</p>
    <p>safeway-kids.kr | privacy@safeway-kids.kr</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
