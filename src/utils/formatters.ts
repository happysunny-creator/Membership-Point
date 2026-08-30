import { CustomerStatus, CustomerTier, TransactionType } from '../types';

// Currency/unit label used by formatPoints, kept in sync with SystemSettings.currencyUnit
// via setCurrencyUnit() so every point amount in the app reflects the configured unit
// without needing to thread `settings` through every call site.
let currentCurrencyUnit = 'P';

export function setCurrencyUnit(unit: string): void {
  currentCurrencyUnit = unit && unit.trim() ? unit.trim() : 'P';
}

export function formatPoints(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value) + ' ' + currentCurrencyUnit;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function formatPercent(rate: number): string {
  const isNegative = rate < 0;
  const abs = Math.abs(rate);
  const fixed = abs.toFixed(1);
  const parts = fixed.split('.');
  const intPart = parts[0].padStart(2, '0');
  const decPart = parts[1] || '0';
  return `${isNegative ? '-' : ''}${intPart}.${decPart}%`;
}

export function getTierBadgeStyle(tier: CustomerTier): { bg: string; text: string; border: string } {
  switch (tier) {
    case 'VIP':
      return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' };
    case 'Corporate':
      return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' };
    case 'Gold':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 'Silver':
      return { bg: 'bg-slate-200', text: 'text-slate-700', border: 'border-slate-300' };
    case 'Bronze':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  }
}

export type UsageStageKey = 'STAGE_0_30' | 'STAGE_30_50' | 'STAGE_50_70' | 'STAGE_70_PLUS';

export interface UsageStageInfo {
  key: UsageStageKey;
  label: string;
  badgeText: string;
  colorClass: string;
  bgClass: string;
  badgeClass: string;
  barColor: string;
  dotColor: string;
  borderClass: string;
  stageColorName: string;
  description: string;
}

/**
 * 4단계 포인트 관리기준 계산 함수
 * - 0% ~ 30%: 빨간색 (STAGE_0_30)
 * - 30% ~ 50%: 주황색 (STAGE_30_50)
 * - 50% ~ 70%: 초록색 (STAGE_50_70)
 * - 70% 이상 (70% ~ 100%+): 보라색 (STAGE_70_PLUS)
 */
export function getCustomerStatusFromBurnRate(
  rate: number,
  thresholds?: { stage1MaxPercent?: number; stage2MaxPercent?: number; stage3MaxPercent?: number }
): CustomerStatus {
  const stage1Max = thresholds?.stage1MaxPercent ?? 30;
  const stage2Max = thresholds?.stage2MaxPercent ?? 50;
  const stage3Max = thresholds?.stage3MaxPercent ?? 70;

  if (rate >= stage3Max) return 'STAGE_70_PLUS';
  if (rate >= stage2Max) return 'STAGE_50_70';
  if (rate >= stage1Max) return 'STAGE_30_50';
  return 'STAGE_0_30';
}

export function getUsageRateStage(
  rate: number,
  thresholds?: { stage1MaxPercent?: number; stage2MaxPercent?: number; stage3MaxPercent?: number }
): UsageStageInfo {
  const stage1Max = thresholds?.stage1MaxPercent ?? 30;
  const stage2Max = thresholds?.stage2MaxPercent ?? 50;
  const stage3Max = thresholds?.stage3MaxPercent ?? 70;

  if (rate >= stage3Max) {
    return {
      key: 'STAGE_70_PLUS',
      label: '70% 이상 (보라색)',
      badgeText: '70% 이상',
      colorClass: 'text-purple-700 font-bold',
      bgClass: 'bg-purple-50',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      barColor: 'bg-purple-600',
      dotColor: 'bg-purple-500',
      borderClass: 'border-purple-200',
      stageColorName: '보라색',
      description: '포인트 소진율 70% 이상 달성 구간 (최적/목표 달성)',
    };
  }

  if (rate >= stage2Max) {
    return {
      key: 'STAGE_50_70',
      label: '50%~70% (초록색)',
      badgeText: '50%~70%',
      colorClass: 'text-emerald-700 font-bold',
      bgClass: 'bg-emerald-50',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-500',
      dotColor: 'bg-emerald-500',
      borderClass: 'border-emerald-200',
      stageColorName: '초록색',
      description: '포인트 소진율 50%~70% 구간 (표준/양호 진행)',
    };
  }

  if (rate >= stage1Max) {
    return {
      key: 'STAGE_30_50',
      label: '30%~50% (주황색)',
      badgeText: '30%~50%',
      colorClass: 'text-orange-700 font-bold',
      bgClass: 'bg-orange-50',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      barColor: 'bg-orange-500',
      dotColor: 'bg-orange-500',
      borderClass: 'border-orange-200',
      stageColorName: '주황색',
      description: '포인트 소진율 30%~50% 구간 (진행/관심 필요)',
    };
  }

  return {
    key: 'STAGE_0_30',
    label: '0%~30% (빨간색)',
    badgeText: '0%~30%',
    colorClass: 'text-rose-700 font-bold',
    bgClass: 'bg-rose-50',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    barColor: 'bg-rose-500',
    dotColor: 'bg-rose-500',
    borderClass: 'border-rose-200',
    stageColorName: '빨간색',
    description: '포인트 소진율 0%~30% 구간 (초기/소진 독려 필요)',
  };
}

export function getStatusBadge(status: CustomerStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
  bar: string;
  stageColor: string;
} {
  switch (status) {
    case 'STAGE_70_PLUS':
    case 'PERFECT':
    case 'OVER_BUDGET':
      return {
        label: '70% 이상',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dotColor: 'bg-purple-500',
        bar: 'bg-purple-600',
        stageColor: '보라색',
      };
    case 'STAGE_50_70':
    case 'ACTIVE':
      return {
        label: '50% ~ 70%',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dotColor: 'bg-emerald-500',
        bar: 'bg-emerald-500',
        stageColor: '초록색',
      };
    case 'STAGE_30_50':
      return {
        label: '30% ~ 50%',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dotColor: 'bg-orange-500',
        bar: 'bg-orange-500',
        stageColor: '주황색',
      };
    case 'STAGE_0_30':
    case 'WARNING':
      return {
        label: '0% ~ 30%',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dotColor: 'bg-rose-500',
        bar: 'bg-rose-500',
        stageColor: '빨간색',
      };
    case 'INACTIVE':
      return {
        label: '0% (미사용)',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dotColor: 'bg-rose-500',
        bar: 'bg-rose-500',
        stageColor: '빨간색',
      };
    default:
      return {
        label: '0% ~ 30%',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dotColor: 'bg-rose-500',
        bar: 'bg-rose-500',
        stageColor: '빨간색',
      };
  }
}

// 회원별 거래 내역 표의 "내용 / 항목" 칸에 보여줄 텍스트 — 실제 사용(SPEND) 내역은 등록된
// 설명을 그대로 보여주고, 예산 배정/조정(BUDGET_ALLOCATION)이나 충전·환불(RECHARGE/REFUND)처럼
// 시스템이 자동 생성한 거래는 각자 다른 원본 설명 대신 "포인트 배정"/"포인트 회수"로 통일해서 보여준다.
export function getTransactionContentLabel(txn: { type: TransactionType; description: string }): string {
  if (txn.type === 'BUDGET_ALLOCATION') return '포인트 배정';
  if (txn.type === 'RECHARGE' || txn.type === 'REFUND') return '포인트 회수';
  return txn.description;
}

export function getTransactionTypeBadge(type: TransactionType): { label: string; color: string; sign: string } {
  switch (type) {
    case 'SPEND':
      return { label: '포인트 사용', color: 'text-rose-600 bg-rose-50 border-rose-200', sign: '-' };
    case 'RECHARGE':
      return { label: '포인트 충전', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', sign: '+' };
    case 'REFUND':
      return { label: '사용 취소/환불', color: 'text-blue-600 bg-blue-50 border-blue-200', sign: '+' };
    case 'BUDGET_ALLOCATION':
      return { label: '예산 추가배정', color: 'text-purple-600 bg-purple-50 border-purple-200', sign: '+' };
    default:
      return { label: '기타', color: 'text-slate-600 bg-slate-50 border-slate-200', sign: '' };
  }
}

/**
 * Sorts a list of org-like items (anything with a `company` field) according to a
 * user-defined priority order (list of company names, in display order). Items whose
 * company isn't in the priority list keep their relative order and are appended after
 * the prioritized ones — via `fallbackCompare` when provided, otherwise as-is.
 */
export function sortByOrgPriority<T extends { company: string }>(
  items: T[],
  priorityOrder: string[] | undefined,
  fallbackCompare?: (a: T, b: T) => number
): T[] {
  if (!priorityOrder || priorityOrder.length === 0) {
    return fallbackCompare ? [...items].sort(fallbackCompare) : items;
  }
  const rank = new Map(priorityOrder.map((name, idx) => [name, idx]));
  return [...items].sort((a, b) => {
    const rankA = rank.has(a.company) ? rank.get(a.company)! : Number.MAX_SAFE_INTEGER;
    const rankB = rank.has(b.company) ? rank.get(b.company)! : Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return fallbackCompare ? fallbackCompare(a, b) : 0;
  });
}

/**
 * Corporate title seniority order (높은 직위부터), used to sort 직위 columns by
 * hierarchy rather than alphabetically. Titles not in this list rank after all
 * known ones and fall back to Korean locale string order among themselves.
 */
const POSITION_PRIORITY = ['사장', '부사장', '전무', '상무', '담당'];

export function comparePositionRank(a: string | undefined, b: string | undefined): number {
  const posA = (a || '').trim();
  const posB = (b || '').trim();
  const rankA = POSITION_PRIORITY.indexOf(posA);
  const rankB = POSITION_PRIORITY.indexOf(posB);
  const safeRankA = rankA === -1 ? Number.MAX_SAFE_INTEGER : rankA;
  const safeRankB = rankB === -1 ? Number.MAX_SAFE_INTEGER : rankB;
  if (safeRankA !== safeRankB) return safeRankA - safeRankB;
  return posA.localeCompare(posB);
}

export function calculateBurnRate(used: number, budget: number): number {
  if (budget <= 0) return 0;
  const rate = (used / budget) * 100;
  return Math.min(Math.max(rate, 0), 100);
}

/**
 * 4단계 통일 색상 및 스타일 클래스
 * 1. 0% ~ 30%: 빨간색 (Rose/Red)
 * 2. 30% ~ 50%: 주황색 (Orange)
 * 3. 50% ~ 70%: 초록색 (Emerald/Green)
 * 4. 70% 이상 (70% ~ 100%+): 보라색 (Purple)
 */
export function getBurnRateColorClass(
  rate: number,
  thresholds?: { stage1MaxPercent?: number; stage2MaxPercent?: number; stage3MaxPercent?: number }
): {
  bar: string;
  text: string;
  bg: string;
  border: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  stageName: string;
  stageColorName: string;
  hexColor: string;
} {
  const stage1Max = thresholds?.stage1MaxPercent ?? 30;
  const stage2Max = thresholds?.stage2MaxPercent ?? 50;
  const stage3Max = thresholds?.stage3MaxPercent ?? 70;

  if (rate >= stage3Max) {
    return {
      bar: 'bg-purple-600',
      text: 'text-purple-700 font-bold',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      dotColor: 'bg-purple-500',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800',
      stageName: `${stage3Max}% 이상`,
      stageColorName: '보라색',
      hexColor: '#8b5cf6',
    };
  }
  if (rate >= stage2Max) {
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-700 font-bold',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      stageName: `${stage2Max}% ~ ${stage3Max}%`,
      stageColorName: '초록색',
      hexColor: '#10b981',
    };
  }
  if (rate >= stage1Max) {
    return {
      bar: 'bg-orange-500',
      text: 'text-orange-700 font-bold',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      dotColor: 'bg-orange-500',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
      stageName: `${stage1Max}% ~ ${stage2Max}%`,
      stageColorName: '주황색',
      hexColor: '#f97316',
    };
  }
  return {
    bar: 'bg-rose-500',
    text: 'text-rose-700 font-bold',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    stageName: `0% ~ ${stage1Max}%`,
    stageColorName: '빨간색',
    hexColor: '#f43f5e',
  };
}

export function exportToCSV(filename: string, rows: object[]): void {
  if (!rows || rows.length === 0) return;
  
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel Korean support
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            const rawVal = (row as Record<string, unknown>)[k];
            let cellStr = rawVal === null || rawVal === undefined ? '' : rawVal instanceof Date ? rawVal.toLocaleString() : String(rawVal);
            cellStr = cellStr.replace(/"/g, '""');
            if (cellStr.search(/("|,|\n)/g) >= 0) {
              cellStr = `"${cellStr}"`;
            }
            return cellStr;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
