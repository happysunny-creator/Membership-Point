import { BudgetSummary, Customer, SystemSettings, Transaction } from '../types';
import { calculateBurnRate, formatPercent, formatPoints, sortByOrgPriority } from './formatters';
import { separateNameAndPosition } from './nameParser';

interface StatusReportParams {
  customers: Customer[];
  settings: SystemSettings;
  summary: BudgetSummary;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Builds a single self-contained HTML file (inline CSS, no external requests) so it can be
// opened, emailed, or printed to PDF from any browser without the app or an internet connection.
export function generateStatusReportHtml({
  customers,
  settings,
  summary,
}: StatusReportParams): string {
  const now = new Date();
  const generatedAt = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const todayStr = now.toISOString().slice(0, 10);
  const reportTitle = `멤버십 포인트 사용 현황 보고서(${todayStr})`;

  const orgMap: Record<string, { company: string; customers: Customer[]; totalBudget: number; totalUsed: number; totalRemaining: number }> = {};
  customers.forEach(c => {
    const orgName = c.company.trim() || '미지정 조직';
    if (!orgMap[orgName]) {
      orgMap[orgName] = { company: orgName, customers: [], totalBudget: 0, totalUsed: 0, totalRemaining: 0 };
    }
    orgMap[orgName].customers.push(c);
    orgMap[orgName].totalBudget += c.totalBudget;
    orgMap[orgName].totalUsed += c.usedPoints;
    orgMap[orgName].totalRemaining += c.remainingPoints;
  });

  const orgList = sortByOrgPriority(
    Object.values(orgMap).map(org => ({ ...org, burnRate: calculateBurnRate(org.totalUsed, org.totalBudget) })),
    settings.orgPriorityOrder,
    (a, b) => b.totalBudget - a.totalBudget
  );

  const orgRows = orgList
    .map(org => {
      const rate = org.burnRate;
      return `
        <tr>
          <td>${escapeHtml(org.company)}</td>
          <td class="num">${org.customers.length}명</td>
          <td class="num">${escapeHtml(formatPoints(org.totalBudget))}</td>
          <td class="num">${escapeHtml(formatPoints(org.totalUsed))}</td>
          <td class="num">${escapeHtml(formatPoints(org.totalRemaining))}</td>
          <td class="num">${escapeHtml(formatPercent(rate))}</td>
        </tr>`;
    })
    .join('');

  const memberRows = orgList
    .flatMap(org =>
      org.customers.map(cust => {
        const { name: cleanName, position: cleanPosition } = separateNameAndPosition(cust.name, cust.position);
        const rate = calculateBurnRate(cust.usedPoints, cust.totalBudget);
        return `
        <tr>
          <td>${escapeHtml(org.company)}</td>
          <td>${escapeHtml(cust.department || '-')}</td>
          <td>${escapeHtml(cleanName || cust.name)}</td>
          <td>${escapeHtml(cleanPosition || '-')}</td>
          <td class="num">${escapeHtml(formatPoints(cust.totalBudget))}</td>
          <td class="num">${escapeHtml(formatPoints(cust.usedPoints))}</td>
          <td class="num">${escapeHtml(formatPoints(cust.remainingPoints))}</td>
          <td class="num">${escapeHtml(formatPercent(rate))}</td>
        </tr>`;
      })
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(reportTitle)}</title>
<style>
  * { box-sizing: border-box; font-family: inherit; }
  body {
    margin: 0;
    padding: 40px 48px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', Roboto, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #f1f5f9;
  }
  .sheet {
    max-width: 960px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 40px 44px 48px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 18px;
    margin-bottom: 28px;
  }
  .header h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
  }
  .header p {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    color: #64748b;
  }
  .badge {
    font-size: 12px;
    font-weight: 700;
    color: #4338ca;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .kpi .label {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .kpi .value {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .kpi .sub {
    font-size: 12px;
    font-weight: 400;
    color: #94a3b8;
    margin-top: 4px;
  }
  section { margin-bottom: 32px; }
  h2 {
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 13px;
    font-weight: 400;
  }
  th, td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid #f1f5f9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
    font-size: 12px;
    text-align: center;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: #f8fafc; }
  .footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: 400;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; max-width: none; padding: 0; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1>${escapeHtml(reportTitle)}</h1>
        <p>보고서 생성일시: ${escapeHtml(generatedAt)}</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">총 배정 예산</div>
        <div class="value">${escapeHtml(formatPoints(summary.totalBudget))}</div>
        <div class="sub">소속 ${summary.totalCustomers}명 · 총 ${orgList.length}개 조직</div>
      </div>
      <div class="kpi">
        <div class="label">총 포인트 사용실적</div>
        <div class="value" style="color:#2563eb;">${escapeHtml(formatPoints(summary.totalUsed))}</div>
        <div class="sub">누적 실적 합계</div>
      </div>
      <div class="kpi">
        <div class="label">총 잔여 포인트</div>
        <div class="value" style="color:#059669;">${escapeHtml(formatPoints(summary.totalRemaining))}</div>
        <div class="sub">잔여 비율 ${escapeHtml(formatPercent(Math.max(100 - summary.overallBurnRate, 0)))}</div>
      </div>
      <div class="kpi">
        <div class="label">포인트 사용률</div>
        <div class="value" style="color:#e11d48;">${escapeHtml(formatPercent(summary.overallBurnRate))}</div>
        <div class="sub">누적 사용률</div>
      </div>
    </div>

    <section>
      <h2>조직별 배정 및 사용 실적 현황 (${orgList.length}개 조직)</h2>
      <table>
        <colgroup>
          <col style="width:26%" />
          <col style="width:10%" />
          <col style="width:16%" />
          <col style="width:16%" />
          <col style="width:16%" />
          <col style="width:16%" />
        </colgroup>
        <thead>
          <tr>
            <th>조직명</th>
            <th>인원</th>
            <th>배정 예산</th>
            <th>사용 실적</th>
            <th>잔여 포인트</th>
            <th>사용률</th>
          </tr>
        </thead>
        <tbody>${orgRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">데이터가 없습니다.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>회원별 포인트 사용 현황 (${customers.length}명)</h2>
      <table>
        <colgroup>
          <col style="width:15%" />
          <col style="width:15%" />
          <col style="width:10%" />
          <col style="width:10%" />
          <col style="width:12.5%" />
          <col style="width:12.5%" />
          <col style="width:12.5%" />
          <col style="width:12.5%" />
        </colgroup>
        <thead>
          <tr>
            <th>조직명</th>
            <th>소속</th>
            <th>성함</th>
            <th>직책</th>
            <th>배정포인트</th>
            <th>사용실적</th>
            <th>잔여포인트</th>
            <th>사용률</th>
          </tr>
        </thead>
        <tbody>${memberRows || '<tr><td colspan="8" style="text-align:center;color:#94a3b8;">데이터가 없습니다.</td></tr>'}</tbody>
      </table>
    </section>

    <div class="footer">
      <span>남산 리더십센터 / 스마일즈 멤버십 포인트 관리 Dashboard</span>
      <span>본 문서는 ${escapeHtml(generatedAt)} 기준 시스템 데이터를 바탕으로 자동 생성되었습니다.</span>
    </div>
  </div>
</body>
</html>`;
}

interface MemberUsageReportParams {
  customer: Customer;
  transactions: Transaction[];
}

// 회원 1인용 실적 안내 보고서 — "사용률 단계별 회원 현황"의 "사용 실적 알림" 버튼에서
// 사용된다. 회원명/배정/실적/잔액/사용률과, 지금까지 사용한 포인트의 승인 내역
// (실적관리(상세)에서 등록된 SPEND 거래만, BUDGET_ALLOCATION 등 배정성 거래는 제외)을 담는다.
export function generateMemberUsageReportHtml({ customer, transactions }: MemberUsageReportParams): string {
  const now = new Date();
  const generatedAt = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const todayStr = now.toISOString().slice(0, 10);
  const { name: cleanName, position: cleanPosition } = separateNameAndPosition(customer.name, customer.position);
  const displayName = cleanName || customer.name;
  const reportTitle = `${displayName}님 포인트 사용 실적 안내(${todayStr})`;
  const rate = calculateBurnRate(customer.usedPoints, customer.totalBudget);

  const history = transactions
    .filter(t => t.customerId === customer.id && t.type === 'SPEND')
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const historyRows = history
    .map(
      t => `
        <tr>
          <td>${escapeHtml(t.timestamp)}</td>
          <td>${escapeHtml(t.merchant || '-')}</td>
          <td class="num">${escapeHtml(formatPoints(t.amount))}</td>
          <td>${escapeHtml(t.status === 'COMPLETED' ? '승인 완료' : t.status === 'PENDING' ? '승인 대기' : '취소')}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(reportTitle)}</title>
<style>
  * { box-sizing: border-box; font-family: inherit; }
  body {
    margin: 0;
    padding: 40px 48px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', Roboto, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #f1f5f9;
  }
  .sheet {
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 40px 44px 48px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 18px;
    margin-bottom: 8px;
  }
  .header h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
    text-align: left;
  }
  .header p {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    color: #64748b;
  }
  .header p.greeting {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    margin: 4px 0 6px;
  }
  .badge {
    font-size: 12px;
    font-weight: 700;
    color: #4338ca;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .profile {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0 24px;
    font-size: 13px;
    color: #475569;
  }
  .profile strong { color: #0f172a; font-size: 14px; }
  .profile .sep { color: #cbd5e1; }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .kpi .label {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .kpi .value {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  section { margin-bottom: 32px; }
  h2 {
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 13px;
    font-weight: 400;
  }
  th, td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid #f1f5f9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
    font-size: 12px;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: #f8fafc; }
  .footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: 400;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; max-width: none; padding: 0; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1>${escapeHtml(reportTitle)}</h1>
        <p class="greeting">남산 리더십센터 / 스마일즈 멤버십 포인트 사용 현황을 안내드립니다.</p>
        <p>보고서 생성일시: ${escapeHtml(generatedAt)}</p>
      </div>
    </div>

    <div class="profile">
      <span>${escapeHtml(customer.company || '-')}</span>
      <span class="sep">|</span>
      <span>${escapeHtml(customer.department || '-')}</span>
      <span class="sep">|</span>
      <strong>${escapeHtml(displayName)}</strong>
      <span class="sep">|</span>
      <span>${escapeHtml(cleanPosition || customer.position || '-')}</span>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">포인트 배정</div>
        <div class="value">${escapeHtml(formatPoints(customer.totalBudget))}</div>
      </div>
      <div class="kpi">
        <div class="label">사용 실적</div>
        <div class="value" style="color:#2563eb;">${escapeHtml(formatPoints(customer.usedPoints))}</div>
      </div>
      <div class="kpi">
        <div class="label">잔액</div>
        <div class="value" style="color:#059669;">${escapeHtml(formatPoints(customer.remainingPoints))}</div>
      </div>
      <div class="kpi">
        <div class="label">사용률</div>
        <div class="value" style="color:#e11d48;">${escapeHtml(formatPercent(rate))}</div>
      </div>
    </div>

    <section>
      <h2>지금까지 사용한 포인트 승인 내역 (${history.length}건)</h2>
      <table>
        <colgroup>
          <col style="width:28%" />
          <col style="width:34%" />
          <col style="width:20%" />
          <col style="width:18%" />
        </colgroup>
        <thead>
          <tr>
            <th>사용일시</th>
            <th>사용처</th>
            <th class="num">사용금액</th>
            <th>승인상태</th>
          </tr>
        </thead>
        <tbody>${historyRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">사용 내역이 없습니다.</td></tr>'}</tbody>
      </table>
    </section>

    <div class="footer">
      <span>본 문서는 멤버십 포인트 관리 시스템을 통해 자동으로 발송되었습니다.</span>
    </div>
  </div>
</body>
</html>`;
}

export async function downloadMemberUsageReportPdf(params: MemberUsageReportParams): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const html = generateMemberUsageReportHtml(params);
  const { name: cleanName } = separateNameAndPosition(params.customer.name, params.customer.position);
  const displayName = cleanName || params.customer.name;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = '820px';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('보고서 렌더링에 실패했습니다.'));
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    const sheet = doc?.querySelector('.sheet') as HTMLElement | null;
    if (!doc || !sheet) throw new Error('보고서 내용을 찾을 수 없습니다.');

    await new Promise(resolve => setTimeout(resolve, 50));
    iframe.style.height = `${doc.body.scrollHeight}px`;

    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff' });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`${displayName}_포인트_사용_실적_안내_${dateStr}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

export function downloadStatusReportHtml(params: StatusReportParams): void {
  const html = generateStatusReportHtml(params);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `포인트_운영_현황_보고서_${dateStr}.html`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Renders the report into a hidden iframe, rasterizes it with html2canvas, and paginates the
// image into a multi-page A4 PDF with jsPDF — then saves it straight to disk (same silent
// blob-download mechanism as the HTML/Excel exports), with no print dialog in the way.
export async function downloadStatusReportPdf(params: StatusReportParams): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const html = generateStatusReportHtml(params);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = '960px';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('보고서 렌더링에 실패했습니다.'));
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    const sheet = doc?.querySelector('.sheet') as HTMLElement | null;
    if (!doc || !sheet) throw new Error('보고서 내용을 찾을 수 없습니다.');

    // Let webfonts/layout settle, then size the iframe to the real content height so
    // html2canvas captures the full report instead of a clipped viewport.
    await new Promise(resolve => setTimeout(resolve, 50));
    iframe.style.height = `${doc.body.scrollHeight}px`;

    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff' });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`포인트_운영_현황_보고서_${dateStr}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
