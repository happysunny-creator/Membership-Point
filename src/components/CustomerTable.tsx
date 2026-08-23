import React from 'react';
import { Customer, CustomerTier } from '../types';
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
  Users,
  Eye,
  PlusCircle,
  Settings,
  ArrowUpDown,
  AlertCircle,
  Layers,
  Network,
} from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onOpenAddTransactionForCustomer: (customer: Customer) => void;
  onOpenAdjustBudgetForCustomer: (customer: Customer) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: any) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onSelectCustomer,
  onOpenAddTransactionForCustomer,
  onOpenAdjustBudgetForCustomer,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="customer-table-container">
      {/* Table Header */}
      <div className="p-4 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">회원별 포인트 예산 및 사용실적 현황</h3>
            <p className="text-xs text-slate-500">
              총 <span className="font-semibold text-slate-700">{customers.length}명</span>의 회원 예산 사용 상태를 실시간으로 모니터링합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold select-none">
              <th className="py-3 px-4 sm:px-6">
                <button
                  onClick={() => onSortChange('name')}
                  className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                >
                  <span>회원정보 / 소속</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3">회원 등급</th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => onSortChange('budget')}
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 transition-colors"
                >
                  <span>배정 예산</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => onSortChange('used')}
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 transition-colors"
                >
                  <span>사용 실적</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button
                  onClick={() => onSortChange('remaining')}
                  className="flex items-center gap-1 ml-auto hover:text-slate-900 transition-colors"
                >
                  <span>잔여 포인트</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 min-w-[170px]">
                <button
                  onClick={() => onSortChange('burnRate')}
                  className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                >
                  <span>사용률 및 상태</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3">최근 활동일</th>
              <th className="py-3 px-4 text-center">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Users className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium">검색 또는 필터 조건에 일치하는 회원이 없습니다.</p>
                    <p className="text-xs text-slate-400">필터 조건을 재설정하거나 검색어를 확인해주세요.</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map(customer => {
                const burnRate = calculateBurnRate(customer.usedPoints, customer.totalBudget);
                const burnColor = getBurnRateColorClass(burnRate);
                const tierStyle = getTierBadgeStyle(customer.tier);
                const statusBadge = getStatusBadge(customer.status);

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Customer Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-tr ${customer.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        >
                          {separateNameAndPosition(customer.name, customer.position).name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span
                              onClick={() => onSelectCustomer(customer)}
                              className="hover:text-blue-600 cursor-pointer underline-offset-2 hover:underline"
                            >
                              {separateNameAndPosition(customer.name, customer.position).name}
                            </span>
                            {separateNameAndPosition(customer.name, customer.position).position && (
                              <span className="text-[11px] font-normal text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                {separateNameAndPosition(customer.name, customer.position).position}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({customer.id})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[260px] flex items-center gap-1.5" title={`${customer.company} · ${customer.department}${customer.manager ? ` (담당자: ${customer.manager})` : ''}`}>
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
                              <strong className="text-slate-700 font-medium">{customer.company}</strong>
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Network className="w-3 h-3 text-cyan-600 shrink-0" />
                              <span>{customer.department}</span>
                            </span>
                            {customer.manager && (
                              <span className="text-slate-400 ml-1">· 담당: {customer.manager}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                      >
                        {customer.tier}
                      </span>
                    </td>

                    {/* Total Budget */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      {formatPoints(customer.totalBudget)}
                    </td>

                    {/* Used Points */}
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatPoints(customer.usedPoints)}
                    </td>

                    {/* Remaining Points */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatPoints(customer.remainingPoints)}
                    </td>

                    {/* Burn Rate & Gauge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={burnColor.text}>
                            {formatPercent(burnRate)} 소진
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatPoints(customer.remainingPoints)} 남음
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${burnColor.bar}`}
                            style={{ width: `${burnRate}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {customer.lastActivityDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onSelectCustomer(customer)}
                          title="상세 분석 및 내역 보기"
                          className="px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200 text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>상세</span>
                        </button>
                        <button
                          onClick={() => onOpenAddTransactionForCustomer(customer)}
                          title="포인트 사용/차감 등록"
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 text-[11px] transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAdjustBudgetForCustomer(customer)}
                          title="예산 증액 및 변경"
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 text-[11px] transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
