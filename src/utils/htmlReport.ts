import { BudgetSummary, Customer, SystemSettings } from '../types';
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
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 48px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', Roboto, sans-serif;
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
    font-size: 22px;
    margin: 0 0 4px;
  }
  .header p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }
  .badge {
    font-size: 11px;
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
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .kpi .value {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .kpi .sub {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 4px;
  }
  section { margin-bottom: 32px; }
  h2 {
    font-size: 14px;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th, td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid #f1f5f9;
  }
  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
    font-size: 11px;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:hover { background: #f8fafc; }
  .footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
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
      <span class="badge">2026 통합 시스템</span>
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
        <thead>
          <tr>
            <th>조직명</th>
            <th class="num">인원</th>
            <th class="num">배정 예산</th>
            <th class="num">사용 실적</th>
            <th class="num">잔여 포인트</th>
            <th class="num">사용률</th>
          </tr>
        </thead>
        <tbody>${orgRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">데이터가 없습니다.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>회원별 포인트 사용 현황 (${customers.length}명)</h2>
      <table>
        <thead>
          <tr>
            <th>조직명</th>
            <th>소속</th>
            <th>성함</th>
            <th>직책</th>
            <th class="num">배정포인트</th>
            <th class="num">사용실적</th>
            <th class="num">잔여포인트</th>
            <th class="num">사용률</th>
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
