import React, { useState } from 'react';
import { Customer } from '../types';
import { formatPoints } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { Settings, X, Layers, Network } from 'lucide-react';

interface BudgetAdjustModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjustBudget: (customerId: string, newBudget: number, reason: string) => void;
}

export const BudgetAdjustModal: React.FC<BudgetAdjustModalProps> = ({
  customer,
  isOpen,
  onClose,
  onAdjustBudget,
}) => {
  const [adjustmentMode, setAdjustmentMode] = useState<'ADD' | 'SET'>('ADD');
  const [amountValue, setAmountValue] = useState<number | ''>(1000000);
  const [reason, setReason] = useState<string>('분기별 복지 포인트 정기 증액');

  if (!isOpen || !customer) return null;

  const currentTotal = customer.totalBudget;
  const val = Number(amountValue) || 0;
  const calculatedNewBudget =
    adjustmentMode === 'ADD' ? currentTotal + val : val;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedNewBudget < customer.usedPoints) {
      alert(`새로운 예산은 이미 소진된 실적(${formatPoints(customer.usedPoints)})보다 적을 수 없습니다.`);
      return;
    }

    onAdjustBudget(customer.id, calculatedNewBudget, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">포인트 예산 조정 및 충전</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-800">{separateNameAndPosition(customer.name, customer.position).name}</span>
                {separateNameAndPosition(customer.name, customer.position).position && (
                  <span className="text-slate-400">({separateNameAndPosition(customer.name, customer.position).position})</span>
                )}
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  <span className="font-medium text-slate-700">{customer.company}</span>
                </span>
                {customer.department && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Network className="w-3 h-3 text-cyan-600" />
                      <span>{customer.department}</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Current Status Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center">
            <div>
              <span className="text-[11px] text-slate-500">현재 총 배정 예산</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {formatPoints(customer.totalBudget)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">현재 사용 실적</span>
              <div className="font-bold text-blue-600 text-sm mt-0.5">
                {formatPoints(customer.usedPoints)}
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">조정 방식</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentMode('ADD')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                  adjustmentMode === 'ADD'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + 예산 추가 증액
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentMode('SET')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                  adjustmentMode === 'SET'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                예산 총액 직접 설정
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">
              {adjustmentMode === 'ADD' ? '증액할 포인트 (P)' : '변경할 총 예산 (P)'}
            </label>
            <input
              type="number"
              value={amountValue}
              onChange={e => setAmountValue(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="예: 1000000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="0"
              required
            />
          </div>

          {/* New Budget Calculation Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">조정 후 총 배정 예산</span>
            <span className="text-sm font-extrabold text-slate-900">
              {formatPoints(calculatedNewBudget)}
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">조정 사유</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="예: 우수 임직원 특별 복지포인트 추가 지원"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
            >
              예산 반영
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
