import React from 'react';
import { Customer, Transaction } from '../types';
import {
  formatPoints,
  formatPercent,
  getTierBadgeStyle,
  getStatusBadge,
  calculateBurnRate,
  getBurnRateColorClass,
} from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import {
  X,
  Layers,
  Network,
  UserCheck,
  Calendar,
  Wallet,
  PieChart,
  PlusCircle,
  Settings,
  History,
  FileText,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  transactions: Transaction[];
  onClose: () => void;
  onOpenAddTransaction: (customer: Customer) => void;
  onOpenAdjustBudget: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  transactions,
  onClose,
  onOpenAddTransaction,
  onOpenAdjustBudget,
}) => {
  if (!customer) return null;

  const burnRate = calculateBurnRate(customer.usedPoints, customer.totalBudget);
  const burnColor = getBurnRateColorClass(burnRate);
  const tierStyle = getTierBadgeStyle(customer.tier);
  const statusBadge = getStatusBadge(customer.status);
  const { name: displayName, position: displayPosition } = separateNameAndPosition(
    customer.name,
    customer.position
  );

  // Filter transactions for this customer
  const customerTxns = transactions.filter(t => t.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${customer.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm`}
            >
              {displayName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                {displayPosition && (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {displayPosition}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                >
                  {customer.tier}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  <strong className="text-slate-700 font-medium">{customer.company}</strong>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Network className="w-3 h-3 text-cyan-600" />
                  <span>{customer.department}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenAdjustBudget(customer)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>예산 변경</span>
            </button>
            <button
              onClick={() => onOpenAddTransaction(customer)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>포인트 사용/적립</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Total Budget */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-500" />
                배정 예산
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                {formatPoints(customer.totalBudget)}
              </div>
            </div>

            {/* 2. Spent Points */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-rose-500" />
                총 포인트 사용실적
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-blue-600 mt-1">
                {formatPoints(customer.usedPoints)}
              </div>
            </div>

            {/* 3. Remaining Points */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                총 잔여 포인트
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">
                {formatPoints(customer.remainingPoints)}
              </div>
            </div>

            {/* 4. Burn Rate */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                사용률
              </span>
              <div className="text-lg sm:text-xl font-extrabold mt-1 text-rose-600">
                {formatPercent(burnRate)}
              </div>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">포인트 예산 사용률 현황</span>
              <span className="text-rose-600">
                {formatPercent(burnRate)} 사용 (잔여: {formatPoints(customer.remainingPoints)})
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${burnColor.bar}`}
                style={{ width: `${burnRate}%` }}
              />
            </div>
          </div>

          {/* Customer Profile & Info details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> 조직 / 소속
              </span>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{customer.company}</span>
              </p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <Network className="w-3 h-3 text-cyan-600 shrink-0" />
                <span>{customer.department}</span>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-purple-500" /> 담당자
              </span>
              <p className="font-semibold text-slate-900">{customer.manager || '운영관리팀'}</p>
              <p className="text-[11px] text-slate-400">포인트 운영 담당</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> 등록일자
              </span>
              <p className="font-medium text-slate-800">{customer.joinedDate}</p>
              <p className="text-[11px] text-slate-400">최근 활동: {customer.lastActivityDate}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-500" /> 비고 및 관리메모
              </span>
              <p className="font-medium text-slate-800 line-clamp-2" title={customer.notes || '등록된 메모가 없습니다.'}>
                {customer.notes || '등록된 메모 없음'}
              </p>
            </div>
          </div>

          {/* Customer's Transaction Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" />
                거래 및 포인트 내역 ({customerTxns.length}건)
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-4">일시</th>
                    <th className="py-2.5 px-3">가맹점 및 내용</th>
                    <th className="py-2.5 px-4 text-right">금액</th>
                    <th className="py-2.5 px-3 text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {customerTxns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        기록된 거래 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    customerTxns.map(txn => {
                      const isSpend = txn.type === 'SPEND';

                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                            {txn.timestamp}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{txn.description}</div>
                            <div className="text-[11px] text-slate-400">{txn.merchant}</div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-extrabold whitespace-nowrap">
                            <span className={isSpend ? 'text-rose-600' : 'text-emerald-600'}>
                              {isSpend ? '-' : '+'} {formatPoints(txn.amount)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              완료
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
