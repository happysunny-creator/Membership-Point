import { Customer } from '../types';
import { formatPoints, formatPercent, calculateBurnRate } from './formatters';

export interface ManagerSummary {
  manager: string;
  managerEmail: string;
  members: Customer[];
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  burnRate: number;
}

/**
 * 담당자(manager) 기준으로 회원을 그룹핑해 담당자별 실적 요약을 만든다.
 * 담당자 이메일은 같은 담당자를 가진 회원들 중 처음 발견된 값을 사용한다.
 */
export function buildManagerSummaries(customers: Customer[]): ManagerSummary[] {
  const map: Record<string, ManagerSummary> = {};

  customers.forEach(c => {
    const manager = (c.manager || '').trim() || '담당자 미지정';
    if (!map[manager]) {
      map[manager] = {
        manager,
        managerEmail: '',
        members: [],
        totalBudget: 0,
        totalUsed: 0,
        totalRemaining: 0,
        burnRate: 0,
      };
    }
    const group = map[manager];
    if (!group.managerEmail && c.managerEmail && c.managerEmail.trim()) {
      group.managerEmail = c.managerEmail.trim();
    }
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
 * 담당자에게 보낼 실적 안내 이메일 초안(mailto: 링크)을 만든다. 실제 발송은 사용자가
 * 자신의 메일 클라이언트에서 직접 눌러야 하며, 이 앱에서 대신 전송하지 않는다.
 */
export function buildManagerMailtoLink(summary: ManagerSummary): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const subject = `[포인트 운영] ${summary.manager}님 담당 회원 실적 안내 (${dateStr})`;

  const lines: string[] = [];
  lines.push(`${summary.manager}님, 안녕하세요.`);
  lines.push('');
  lines.push(`담당하고 계신 회원분들의 포인트 사용 실적을 안내드립니다. (기준일: ${dateStr})`);
  lines.push('');
  summary.members.forEach(m => {
    const rate = calculateBurnRate(m.usedPoints, m.totalBudget);
    const org = [m.company, m.department].filter(Boolean).join(' · ');
    lines.push(
      `- ${m.name} (${org}): 배정 ${formatPoints(m.totalBudget)} / 사용 ${formatPoints(m.usedPoints)} / 잔여 ${formatPoints(m.remainingPoints)} / 사용률 ${formatPercent(rate)}`
    );
  });
  lines.push('');
  lines.push(
    `전체 담당 ${summary.members.length}명 · 총 배정 ${formatPoints(summary.totalBudget)} · 총 사용 ${formatPoints(summary.totalUsed)} · 사용률 ${formatPercent(summary.burnRate)}`
  );
  lines.push('');
  lines.push('감사합니다.');

  const body = lines.join('\r\n');
  return `mailto:${summary.managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
