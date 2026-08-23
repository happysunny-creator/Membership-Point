import React, { useState, useMemo } from 'react';
import { Customer, Transaction, Category } from '../types';
import {
  formatPoints,
  formatPercent,
  calculateBurnRate,
  getBurnRateColorClass,
  getStatusBadge,
  getTierBadgeStyle,
} from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import {
  X,
  Users,
  Layers,
  Network,
  Wallet,
  PieChart,
  History,
  TrendingUp,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface OrgCustomerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  customers: Customer[];
  transactions: Transaction[];
  categories?: Category[];
  onOpenCustomerDetail?: (customer: Customer) => void;
}

export const OrgCustomerListModal: React.FC<OrgCustomerListModalProps> = ({
  isOpen,
  onClose,
  orgName,
  customers,
  transactions,
  categories = [],
  onOpenCustomerDetail,
}) => {
  // Filter members of this organization
  const orgMembers = useMemo(() => {
    return customers.filter(
      c => (c.company || '기타 조직').trim() === orgName.trim()
    );
  }, [customers, orgName]);

  // Selected customer for bottom transaction list
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return orgMembers.length > 0 ? orgMembers[0].id : '';
  });

  // Search within org members
  const [searchQuery, setSearchQuery] = useState<string>('');

  // If selectedCustomerId is no longer in orgMembers (e.g. org changed), reset to first
  const activeCustomer = useMemo(() => {
    const found = orgMembers.find(c => c.id === selectedCustomerId);
    return found || orgMembers[0] || null;
  }, [orgMembers, selectedCustomerId]);

  // Filtered members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return orgMembers;
    const q = searchQuery.toLowerCase().trim();
    return orgMembers.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.position && m.position.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q))
    );
  }, [orgMembers, searchQuery]);

  // Organization totals
  const orgTotals = useMemo(() => {
    const totalBudget = orgMembers.reduce((sum, c) => sum + c.totalBudget, 0);
    const totalUsed = orgMembers.reduce((sum, c) => sum + c.usedPoints, 0);
    const totalRemaining = Math.max(0, totalBudget - totalUsed);
    const burnRate = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;
    return { totalBudget, totalUsed, totalRemaining, burnRate };
  }, [orgMembers]);

  // Transactions for active selected customer
  const activeCustomerTxns = useMemo(() => {
    if (!activeCustomer) return [];
    return transactions
      .filter(t => t.customerId === activeCustomer.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activeCustomer, transactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">{orgName}</h2>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  소속 인원 {orgMembers.length}명
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                배정 예산: <strong className="text-slate-900">{formatPoints(orgTotals.totalBudget)}</strong>
                <span className="mx-1.5">·</span>
                사용 실적: <strong className="text-blue-600">{formatPoints(orgTotals.totalUsed)}</strong>
                <span className="mx-1.5">·</span>
                잔여: <strong className="text-emerald-600">{formatPoints(orgTotals.totalRemaining)}</strong>
                <span className="mx-1.5">·</span>
                사용률: <strong className="text-rose-600">{formatPercent(orgTotals.burnRate)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Section: Organization Members List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  소속 회원별 포인트 사용 현황
                  <span className="text-xs font-normal text-slate-400">
                    (행을 클릭하면 하단에 거래 내역이 표시됩니다)
                  </span>
                </h3>
              </div>

              {/* Search filter */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="회원명, 직위, 부서 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Members Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold z-10">
                    <tr>
                      <th className="py-2.5 px-4">성함 / 직위</th>
                      <th className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <Network className="w-3 h-3 text-cyan-600" />
                          <span>소속 부서</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-4 text-right">포인트 배정</th>
                      <th className="py-2.5 px-4 text-right">실적 (사용)</th>
                      <th className="py-2.5 px-4 text-right">잔여 포인트</th>
                      <th className="py-2.5 px-4 text-center">사용률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {searchQuery ? '검색된 회원이 없습니다.' : '소속된 회원이 없습니다.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map(member => {
                        const isSelected = activeCustomer?.id === member.id;
                        const memberBurnRate = calculateBurnRate(member.usedPoints, member.totalBudget);
                        const burnColor = getBurnRateColorClass(memberBurnRate);
                        const { name: cleanName, position: cleanPos } = separateNameAndPosition(
                          member.name,
                          member.position
                        );

                        return (
                          <tr
                            key={member.id}
                            onClick={() => setSelectedCustomerId(member.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-purple-50/80 font-medium text-slate-900 ring-1 ring-inset ring-purple-400/40'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-2.5 px-4">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{cleanName}</span>
                                  {cleanPos && (
                                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                      {cleanPos}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {member.id}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Network className="w-3 h-3 text-cyan-600 shrink-0" />
                                <span>{member.department || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                              {formatPoints(member.totalBudget)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-blue-600">
                              {formatPoints(member.usedPoints)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                              {formatPoints(member.remainingPoints)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${burnColor.bar}`}
                                    style={{ width: `${Math.min(memberBurnRate, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-rose-600">
                                  {formatPercent(memberBurnRate)}
                                </span>
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
          </div>

          {/* Bottom Section: Active Selected Customer Transactions */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <History className="w-3.5 h-3.5" />
                </div>
                {activeCustomer ? (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>
                        <strong className="text-purple-700">{activeCustomer.name}</strong>
                        {activeCustomer.position ? ` (${activeCustomer.position})` : ''} 님의 거래 및 포인트 내역
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        총 {activeCustomerTxns.length}건
                      </span>
                    </h3>
                  </div>
                ) : (
                  <h3 className="text-sm font-bold text-slate-900">거래 내역</h3>
                )}
              </div>

              {activeCustomer && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    총 사용:{' '}
                    <strong className="text-blue-600 font-bold">
                      {formatPoints(activeCustomer.usedPoints)}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    잔여:{' '}
                    <strong className="text-emerald-600 font-bold">
                      {formatPoints(activeCustomer.remainingPoints)}
                    </strong>
                  </span>
                  {onOpenCustomerDetail && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCustomerDetail(activeCustomer);
                      }}
                      className="ml-1 text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                    >
                      상세 모달 열기
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold z-10">
                    <tr>
                      <th className="py-2.5 px-4">사용날짜 (일시)</th>
                      <th className="py-2.5 px-3">카테고리</th>
                      <th className="py-2.5 px-3">사용처 (가맹점)</th>
                      <th className="py-2.5 px-3">내용 / 항목</th>
                      <th className="py-2.5 px-4 text-right">사용금액</th>
                      <th className="py-2.5 px-3 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {!activeCustomer ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          상단 목록에서 회원을 선택해주세요.
                        </td>
                      </tr>
                    ) : activeCustomerTxns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          선택된 회원의 기록된 거래 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      activeCustomerTxns.map(txn => {
                        const cat = categories.find(c => c.id === txn.categoryId);
                        const isSpend = txn.type === 'SPEND';

                        return (
                          <tr key={txn.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                              {txn.timestamp}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
                                style={{
                                  color: cat?.color || '#64748b',
                                  borderColor: `${cat?.color || '#64748b'}30`,
                                  backgroundColor: `${cat?.color || '#64748b'}10`,
                                }}
                              >
                                {cat?.shortName || txn.categoryName || txn.categoryId}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {txn.merchant}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs" title={txn.description}>
                              {txn.description}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <span
                                className={`font-bold ${
                                  isSpend ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {isSpend ? '-' : '+'}
                                {formatPoints(txn.amount)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  txn.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : txn.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {txn.status === 'COMPLETED'
                                  ? '완료'
                                  : txn.status === 'PENDING'
                                  ? '대기'
                                  : '취소'}
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
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>조직명: </span>
            <strong className="text-slate-800 font-semibold">{orgName}</strong>
            <span className="mx-2">·</span>
            <span>총 소속 인원: </span>
            <strong className="text-slate-800 font-semibold">{orgMembers.length}명</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors cursor-pointer text-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
