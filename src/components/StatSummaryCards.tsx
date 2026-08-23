import React from 'react';
import {
  Wallet,
  CheckCircle2,
  PieChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { BudgetSummary, SystemSettings } from '../types';
import { formatPoints, formatPercent, getBurnRateColorClass } from '../utils/formatters';

interface StatSummaryCardsProps {
  summary: BudgetSummary;
  settings?: SystemSettings;
  onFilterWarning: () => void;
  onFilterOverBudget: () => void;
  onFilterStage?: (stage: 'stage1' | 'stage2' | 'stage3' | 'stage4') => void;
}

export const StatSummaryCards: React.FC<StatSummaryCardsProps> = ({
  summary,
  settings,
  onFilterWarning,
  onFilterOverBudget,
  onFilterStage,
}) => {
  const stage1Max = settings?.stage1MaxPercent ?? 30;
  const stage2Max = settings?.stage2MaxPercent ?? 50;
  const stage3Max = settings?.stage3MaxPercent ?? 70;
  const col = getBurnRateColorClass(summary.overallBurnRate, settings);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="stats-summary-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {/* 1. 총 배정 예산 */}
        <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">
              총 배정 예산
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatPoints(summary.totalBudget)}
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>총 <strong className="text-slate-700 font-semibold">{summary.totalCustomers}명</strong> 대상 배정</span>
            </div>
          </div>
        </div>

        {/* 2. 총 포인트 사용실적 */}
        <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">
              총 포인트 사용실적
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight font-mono">
              {formatPoints(summary.totalUsed)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>누적 실적 합계</span>
              <span className="font-semibold text-slate-700">실시간 집계</span>
            </div>
          </div>
        </div>

        {/* 3. 총 잔여 포인트 */}
        <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">
              총 잔여 포인트
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
              {formatPoints(summary.totalRemaining)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>잔여 비율</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                {formatPercent(Math.max(100 - summary.overallBurnRate, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* 4. 포인트 사용률 */}
        <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">
              포인트 사용률
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="text-2xl font-black text-indigo-600 tracking-tight font-mono">
              {formatPercent(summary.overallBurnRate)}
            </div>

            {/* 4-Stage Balanced Mini Grid - No Wrapping */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => onFilterStage?.('stage1')}
                title={`1단계: 0%~${stage1Max}% (빨간색)`}
                className="py-1 px-1 rounded-md text-center bg-rose-50/90 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
              >
                <div className="text-[10px] leading-tight font-bold opacity-90">1단계</div>
                <div className="text-[11px] leading-tight font-extrabold text-rose-800">{summary.stage1Count}명</div>
              </button>
              <button
                type="button"
                onClick={() => onFilterStage?.('stage2')}
                title={`2단계: ${stage1Max}%~${stage2Max}% (주황색)`}
                className="py-1 px-1 rounded-md text-center bg-amber-50/90 hover:bg-amber-100 border border-amber-200 text-amber-700 transition-colors cursor-pointer"
              >
                <div className="text-[10px] leading-tight font-bold opacity-90">2단계</div>
                <div className="text-[11px] leading-tight font-extrabold text-amber-800">{summary.stage2Count}명</div>
              </button>
              <button
                type="button"
                onClick={() => onFilterStage?.('stage3')}
                title={`3단계: ${stage2Max}%~${stage3Max}% (초록색)`}
                className="py-1 px-1 rounded-md text-center bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors cursor-pointer"
              >
                <div className="text-[10px] leading-tight font-bold opacity-90">3단계</div>
                <div className="text-[11px] leading-tight font-extrabold text-emerald-800">{summary.stage3Count}명</div>
              </button>
              <button
                type="button"
                onClick={() => onFilterStage?.('stage4')}
                title={`4단계: ${stage3Max}% 이상 (보라색)`}
                className="py-1 px-1 rounded-md text-center bg-purple-50/90 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-colors cursor-pointer"
              >
                <div className="text-[10px] leading-tight font-bold opacity-90">4단계</div>
                <div className="text-[11px] leading-tight font-extrabold text-purple-800">{summary.stage4Count}명</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
