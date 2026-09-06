import { Customer } from '../types';
import { formatPoints, formatPercent, calculateBurnRate } from './formatters';

export interface OrgManagerContact {
  name: string;
  email: string;
}

export interface OrgSummary {
  company: string;
  managers: OrgManagerContact[];
  members: Customer[];
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  burnRate: number;
}

/**
 * 조직(회사) 기준으로 회원을 그룹핑해 조직별 실적 요약을 만든다. settings.orgManagers에
 * 등록된 담당자(들)만 요약에 포함하며, 이메일이 하나도 등록되지 않은 조직은 이 함수를
 * 호출하는 쪽에서 제외해서 사용한다 (보낼 대상이 없으므로).
 */
export function buildOrgSummaries(
  customers: Customer[],
  orgManagers: Record<string, OrgManagerContact[]> | undefined
): OrgSummary[] {
  const map: Record<string, OrgSummary> = {};

  customers.forEach(c => {
    const company = (c.company || '기타 조직').trim();
    if (!map[company]) {
      map[company] = {
        company,
        managers: (orgManagers?.[company] || []).filter(m => m.email.trim()),
        members: [],
        totalBudget: 0,
        totalUsed: 0,
        totalRemaining: 0,
        burnRate: 0,
      };
    }
    const group = map[company];
    group.members.push(c);
    group.totalBudget += c.totalBudget;
    group.totalUsed += c.usedPoints;
    group.totalRemaining += c.remainingPoints;
  });

  return Object.values(map)
    .map(group => ({ ...group, burnRate: calculateBurnRate(group.totalUsed, group.totalBudget) }))
    .sort((a, b) => b.members.length - a.members.length);
}

/**
 * 조직 담당자(들)에게 보낼 실적 안내 이메일 초안(mailto: 링크)을 만든다. 담당자가 여러
 * 명이면 모두 수신자(To)에 콤마로 나열한다. 실제 발송은 사용자가 자신의 메일 클라이언트
 * 에서 직접 눌러야 하며, 이 앱에서 대신 전송하지 않는다.
 */
export function buildOrgMailtoLink(summary: OrgSummary): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const subject = `[포인트 운영] ${summary.company} 포인트 사용 실적 안내 (${dateStr})`;

  const greetingNames = summary.managers.map(m => m.name.trim()).filter(Boolean).join(', ');

  const lines: string[] = [];
  lines.push(`${greetingNames ? `${greetingNames}님, ` : ''}안녕하세요.`);
  lines.push('');
  lines.push(`[${summary.company}]의 포인트 사용 실적을 안내드립니다. (기준일: ${dateStr})`);
  lines.push('');
  summary.members.forEach(m => {
    const rate = calculateBurnRate(m.usedPoints, m.totalBudget);
    const dept = m.department ? ` · ${m.department}` : '';
    lines.push(
      `- ${m.name}${dept}: 배정 ${formatPoints(m.totalBudget)} / 사용 ${formatPoints(m.usedPoints)} / 잔여 ${formatPoints(m.remainingPoints)} / 사용률 ${formatPercent(rate)}`
    );
  });
  lines.push('');
  lines.push(
    `전체 소속 ${summary.members.length}명 · 총 배정 ${formatPoints(summary.totalBudget)} · 총 사용 ${formatPoints(summary.totalUsed)} · 사용률 ${formatPercent(summary.burnRate)}`
  );
  lines.push('');
  lines.push('감사합니다.');

  const body = lines.join('\r\n');
  const recipients = summary.managers.map(m => m.email.trim()).filter(Boolean).join(',');
  return `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
