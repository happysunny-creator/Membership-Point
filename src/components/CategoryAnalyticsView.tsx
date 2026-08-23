import React, { useMemo, useState } from 'react';
import { Category, CategoryId, Customer, SystemSettings, Transaction } from '../types';
import { formatPoints, formatPercent, sortByOrgPriority } from '../utils/formatters';
import {
  Layers,
  Network,
  Users,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { OrgCustomerListModal } from './OrgCustomerListModal';

interface CategoryAnalyticsViewProps {
  categories?: Category[];
  customers: Customer[];
  transactions: Transaction[];
  settings?: SystemSettings;
  categorySpendingMap?: Record<CategoryId, number>;
  totalSpend?: number;
  onSelectCategory?: (categoryId: CategoryId) => void;
  onViewTransactionsOfCategory?: (categoryId: CategoryId) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const CategoryAnalyticsView: React.FC<CategoryAnalyticsViewProps> = ({
  categories = [],
  customers,
  transactions,
  settings,
  onSelectCustomer,
}) => {
  const [selectedOrgForModal, setSelectedOrgForModal] = useState<string | null>(null);

  // 1. Group Customers & Transactions by Organization (Company)
  const orgAnalytics = useMemo(() => {
    const orgMap: Record<
      string,
      {
        company: string;
        members: Customer[];
        departments: Set<string>;
        totalBudget: number;
        usedPoints: number;
        remainingPoints: number;
        transactions: Transaction[];
      }
    > = {};

    customers.forEach(c => {
      const comp = (c.company || '기타 조직').trim();
      if (!orgMap[comp]) {
        orgMap[comp] = {
          company: comp,
          members: [],
          departments: new Set(),
          totalBudget: 0,
          usedPoints: 0,
          remainingPoints: 0,
          transactions: [],
        };
      }
      orgMap[comp].members.push(c);
      if (c.department) orgMap[comp].departments.add(c.department.trim());
      orgMap[comp].totalBudget += c.totalBudget;
      orgMap[comp].usedPoints += c.usedPoints;
      orgMap[comp].remainingPoints += Math.max(0, c.totalBudget - c.usedPoints);
    });

    // Map transactions to orgs
    transactions.forEach(t => {
      if (t.type === 'SPEND' && t.status === 'COMPLETED') {
        const comp = (t.customerCompany || '기타 조직').trim();
        if (orgMap[comp]) {
          orgMap[comp].transactions.push(t);
        }
      }
    });

    const orgColorPalette = [
      { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: '#7c3aed', badge: 'bg-violet-100 text-violet-800' },
      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: '#2563eb', badge: 'bg-blue-100 text-blue-800' },
      { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', bar: '#0891b2', badge: 'bg-cyan-100 text-cyan-800' },
      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: '#059669', badge: 'bg-emerald-100 text-emerald-800' },
      { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: '#d97706', badge: 'bg-amber-100 text-amber-800' },
      { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', bar: '#db2777', badge: 'bg-pink-100 text-pink-800' },
      { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: '#4f46e5', badge: 'bg-indigo-100 text-indigo-800' },
      { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', bar: '#64748b', badge: 'bg-slate-100 text-slate-800' },
    ];

    const mapped = Object.values(orgMap)
      .map((org, index) => {
        const burnRate = org.totalBudget > 0 ? (org.usedPoints / org.totalBudget) * 100 : 0;
        const memberCount = org.members.length;
        const avgSpendPerMember = memberCount > 0 ? Math.round(org.usedPoints / memberCount) : 0;
        const txnCount = org.transactions.length;

        // Top spending member in this org
        const sortedMembers = [...org.members].sort((a, b) => b.usedPoints - a.usedPoints);
        const topMember = sortedMembers[0] || null;

        // Top merchant in this org
        const merchantMap: Record<string, number> = {};
        org.transactions.forEach(t => {
          if (t.merchant) {
            merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + t.amount;
          }
        });
        const topMerchantEntry = Object.entries(merchantMap).sort((a, b) => b[1] - a[1])[0];
        const topMerchant = topMerchantEntry ? { name: topMerchantEntry[0], amount: topMerchantEntry[1] } : null;

        const colorStyle = orgColorPalette[index % orgColorPalette.length];

        return {
          ...org,
          departmentsList: Array.from(org.departments),
          burnRate,
          memberCount,
          avgSpendPerMember,
          txnCount,
          topMember,
          topMerchant,
          colorStyle,
        };
      });

    // Custom organization display priority (설정 > 운영 정책) takes precedence;
    // orgs not included in it fall back to usage-amount descending.
    const sorted = sortByOrgPriority(mapped, settings?.orgPriorityOrder, (a, b) => b.usedPoints - a.usedPoints);

    const totalBudgetSum = sorted.reduce((sum, o) => sum + o.totalBudget, 0);
    const totalUsedSum = sorted.reduce((sum, o) => sum + o.usedPoints, 0);
    const totalRemainingSum = sorted.reduce((sum, o) => sum + o.remainingPoints, 0);
    const overallRate = totalBudgetSum > 0 ? (totalUsedSum / totalBudgetSum) * 100 : 0;

    return {
      orgs: sorted,
      totalBudgetSum,
      totalUsedSum,
      totalRemainingSum,
      overallRate,
      totalOrgsCount: sorted.length,
    };
  }, [customers, transactions, settings]);

  const filteredOrgs = orgAnalytics.orgs;

  return (
    <div className="space-y-6" id="category-analytics-view">
      {/* Overview Banner: 조직별 포인트 사용 실적 및 지출 분석 */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>조직별 포인트 사용 실적 및 지출 분석</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  총 {orgAnalytics.totalOrgsCount}개 조직
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            소속 조직(기업/법인)별 예산 배정액, 실제 누적 사용액, 인원수 및 사용률을 상세하게 분석합니다.
          </p>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs w-full lg:w-auto">
          <div className="px-2">
            <span className="text-slate-400 block text-[11px] font-medium">전체 배정 예산</span>
            <span className="font-extrabold text-slate-900 text-sm">{formatPoints(orgAnalytics.totalBudgetSum)}</span>
          </div>
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div className="px-2">
            <span className="text-slate-400 block text-[11px] font-medium">총 누적 사용실적</span>
            <span className="font-extrabold text-sm">
              <span className="text-blue-600">{formatPoints(orgAnalytics.totalUsedSum)}</span>{' '}
              <span className="text-rose-600">({formatPercent(orgAnalytics.overallRate)})</span>
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div className="px-2">
            <span className="text-slate-400 block text-[11px] font-medium">총 소속 인원</span>
            <span className="font-extrabold text-blue-600 text-sm">{customers.length}명</span>
          </div>
        </div>
      </div>

      {/* Organization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrgs.map(org => {
          return (
            <div
              key={org.company}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: org.colorStyle.bar }}
              />

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${org.colorStyle.bg} ${org.colorStyle.text} border ${org.colorStyle.border} flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="font-bold text-slate-900 text-sm truncate"
                        title={org.company}
                      >
                        {org.company}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>소속 인원 {org.memberCount}명</span>
                        {org.departmentsList.length > 0 && (
                          <span className="text-slate-400 truncate max-w-[120px] flex items-center gap-0.5" title={org.departmentsList.join(', ')}>
                            · <Network className="w-2.5 h-2.5 text-cyan-600 inline shrink-0" />
                            <span>{org.departmentsList[0]}</span>
                            {org.departmentsList.length > 1 ? ` 외 ${org.departmentsList.length - 1}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold text-rose-600 px-2.5 py-1 rounded-full shrink-0 ${
                      org.burnRate >= 80
                        ? 'bg-rose-50 border border-rose-200'
                        : org.burnRate >= 50
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    사용률 {formatPercent(org.burnRate)}
                  </span>
                </div>

                {/* Financial Summary Box */}
                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-100 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-500">누적 포인트 사용실적</span>
                    <span className="text-base font-extrabold text-blue-600">
                      {formatPoints(org.usedPoints)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-600 transition-all duration-500"
                        style={{
                          width: `${Math.min(org.burnRate, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>배정 예산: <span className="text-slate-900">{formatPoints(org.totalBudget)}</span></span>
                      <span>잔여: <span className="text-emerald-600">{formatPoints(org.remainingPoints)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Detailed Analytics Rows */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between py-1 text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      결제 발생 건수
                    </span>
                    <span className="font-semibold text-slate-800">
                      {org.txnCount}건
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setSelectedOrgForModal(org.company)}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>소속 회원 상세</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organization Members Detail Modal */}
      {selectedOrgForModal && (
        <OrgCustomerListModal
          isOpen={!!selectedOrgForModal}
          onClose={() => setSelectedOrgForModal(null)}
          orgName={selectedOrgForModal}
          customers={customers}
          transactions={transactions}
          categories={categories}
          onOpenCustomerDetail={onSelectCustomer}
        />
      )}
    </div>
  );
};

