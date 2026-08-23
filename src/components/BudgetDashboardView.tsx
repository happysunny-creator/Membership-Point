import React, { useState, useMemo } from 'react';
import { Customer, BudgetSummary, SystemSettings } from '../types';
import {
  Layers,
  Network,
  Users,
  Wallet,
  PieChart as PieIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  PlusCircle,
  Settings,
  Eye,
  ArrowUpDown,
  Filter,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import {
  formatPoints,
  formatPercent,
  calculateBurnRate,
  getBurnRateColorClass,
  sortByOrgPriority,
} from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';

interface BudgetDashboardViewProps {
  customers: Customer[];
  summary: BudgetSummary;
  settings?: SystemSettings;
  onSelectCustomer: (customer: Customer) => void;
  onOpenAddTransactionForCustomer: (customer: Customer) => void;
  onOpenAdjustBudgetForCustomer: (customer: Customer) => void;
}

export const BudgetDashboardView: React.FC<BudgetDashboardViewProps> = ({
  customers,
  summary,
  settings,
  onSelectCustomer,
  onOpenAddTransactionForCustomer,
  onOpenAdjustBudgetForCustomer,
}) => {
  // View Switcher: 'organization' (조직별 현황) | 'customer' (회원별 현황)
  const [viewMode, setViewMode] = useState<'organization' | 'customer'>('organization');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stage1' | 'stage2' | 'stage3' | 'stage4'>('all');
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  // Sort State
  const [sortBy, setSortBy] = useState<'budget' | 'used' | 'remaining' | 'burnRate' | 'name'>('budget');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Classify a burn rate into its 4-stage bucket, using the same thresholds everywhere
  const getStage = (rate: number): 'stage1' | 'stage2' | 'stage3' | 'stage4' => {
    const stage1Max = settings?.stage1MaxPercent ?? 30;
    const stage2Max = settings?.stage2MaxPercent ?? 50;
    const stage3Max = settings?.stage3MaxPercent ?? 70;
    if (rate >= stage3Max) return 'stage4';
    if (rate >= stage2Max) return 'stage3';
    if (rate >= stage1Max) return 'stage2';
    return 'stage1';
  };

  // Shared member-level filter predicate (department, status stage, search) used to keep
  // the KPI counts, organization list, and expanded member tables all in sync.
  const memberMatchesFilters = (cust: Customer, opts: { includeStatus?: boolean } = {}): boolean => {
    if (selectedDeptFilter !== 'all' && cust.department.trim() !== selectedDeptFilter) return false;

    if (opts.includeStatus !== false && statusFilter !== 'all') {
      const rate = calculateBurnRate(cust.usedPoints, cust.totalBudget);
      if (getStage(rate) !== statusFilter) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const parsed = separateNameAndPosition(cust.name, cust.position);
      const matchName = parsed.name.toLowerCase().includes(q);
      const matchDept = cust.department.toLowerCase().includes(q);
      const matchPos = parsed.position.toLowerCase().includes(q);
      const matchManager = (cust.manager || '').toLowerCase().includes(q);
      if (!matchName && !matchDept && !matchPos && !matchManager) return false;
    }

    return true;
  };

  // Toggle Organization Accordion
  const toggleOrgExpand = (orgName: string) => {
    setExpandedOrgs(prev => ({
      ...prev,
      [orgName]: !prev[orgName],
    }));
  };

  // Expand / Collapse All Organizations
  const toggleAllOrgs = (expand: boolean) => {
    const newExpanded: Record<string, boolean> = {};
    orgGroups.forEach(og => {
      newExpanded[og.company] = expand;
    });
    setExpandedOrgs(newExpanded);
  };

  // Group Customers by Organization
  const orgGroups = useMemo(() => {
    const map: Record<
      string,
      {
        company: string;
        departments: Set<string>;
        customers: Customer[];
        totalBudget: number;
        totalUsed: number;
        totalRemaining: number;
        managers: Set<string>;
      }
    > = {};

    customers.forEach(c => {
      const orgName = c.company.trim() || '미지정 조직';
      if (!map[orgName]) {
        map[orgName] = {
          company: orgName,
          departments: new Set<string>(),
          customers: [],
          totalBudget: 0,
          totalUsed: 0,
          totalRemaining: 0,
          managers: new Set<string>(),
        };
      }

      if (c.department) map[orgName].departments.add(c.department);
      if (c.manager) map[orgName].managers.add(c.manager);
      map[orgName].customers.push(c);
      map[orgName].totalBudget += c.totalBudget;
      map[orgName].totalUsed += c.usedPoints;
      map[orgName].totalRemaining += c.remainingPoints;
    });

    const list = Object.values(map).map(org => {
      const burnRate = org.totalBudget > 0 ? (org.totalUsed / org.totalBudget) * 100 : 0;
      return {
        ...org,
        burnRate,
        departmentList: Array.from(org.departments),
        managerList: Array.from(org.managers),
      };
    });

    // Default sorting for organizations (used as the fallback order for organizations
    // not covered by the custom priority order below, and when no priority order is set)
    const fallbackSort = (a: typeof list[number], b: typeof list[number]) => {
      if (sortBy === 'used') return sortOrder === 'desc' ? b.totalUsed - a.totalUsed : a.totalUsed - b.totalUsed;
      if (sortBy === 'remaining') return sortOrder === 'desc' ? b.totalRemaining - a.totalRemaining : a.totalRemaining - b.totalRemaining;
      if (sortBy === 'burnRate') return sortOrder === 'desc' ? b.burnRate - a.burnRate : a.burnRate - b.burnRate;
      if (sortBy === 'name') return sortOrder === 'desc' ? b.company.localeCompare(a.company) : a.company.localeCompare(b.company);
      return sortOrder === 'desc' ? b.totalBudget - a.totalBudget : a.totalBudget - b.totalBudget;
    };

    // Custom organization display priority (set in 설정 > 운영 정책) takes precedence;
    // orgs not included in it fall back to the metric-based sort above.
    return sortByOrgPriority(list, settings?.orgPriorityOrder, fallbackSort);
  }, [customers, sortBy, sortOrder, settings]);

  // Unique Organization names for filter dropdown
  const uniqueOrgNames = useMemo<string[]>(() => {
    const orgs = Array.from(new Set<string>(customers.map(c => (c.company || '').trim() || '미지정 조직')));
    return orgs.sort((a: string, b: string) => a.localeCompare(b));
  }, [customers]);

  // Selected Organization Data (for selectedOrgFilter)
  const selectedOrgData = useMemo(() => {
    if (selectedOrgFilter === 'all') return null;
    return orgGroups.find(og => og.company === selectedOrgFilter) || null;
  }, [orgGroups, selectedOrgFilter]);

  // Selected Target Summary Metrics (Overall or specific Org)
  const activeMetrics = useMemo(() => {
    if (selectedOrgData) {
      return {
        title: selectedOrgData.company,
        isSpecificOrg: true,
        totalBudget: selectedOrgData.totalBudget,
        totalUsed: selectedOrgData.totalUsed,
        totalRemaining: selectedOrgData.totalRemaining,
        burnRate: selectedOrgData.burnRate,
        customerCount: selectedOrgData.customers.length,
        orgCount: 1,
        departments: selectedOrgData.departmentList,
        managers: selectedOrgData.managerList,
      };
    }
    return {
      title: '전체 조직 통합',
      isSpecificOrg: false,
      totalBudget: summary.totalBudget,
      totalUsed: summary.totalUsed,
      totalRemaining: summary.totalRemaining,
      burnRate: summary.overallBurnRate,
      customerCount: summary.totalCustomers,
      orgCount: orgGroups.length,
      departments: [],
      managers: [],
    };
  }, [selectedOrgData, summary, orgGroups]);


  // Filtered & Sorted Customer List for Customer View
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        // Search Filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchCompany = c.company.toLowerCase().includes(q);
          const matchDept = c.department.toLowerCase().includes(q);
          const matchPos = (c.position || '').toLowerCase().includes(q);
          const matchManager = (c.manager || '').toLowerCase().includes(q);
          if (!matchName && !matchCompany && !matchDept && !matchPos && !matchManager) return false;
        }

        // Organization Filter
        if (selectedOrgFilter !== 'all' && (c.company.trim() || '미지정 조직') !== selectedOrgFilter) {
          return false;
        }

        // Department Filter
        if (selectedDeptFilter !== 'all' && c.department.trim() !== selectedDeptFilter) {
          return false;
        }

        // Status (Usage Rate) Filter: 4-stage point criteria
        if (statusFilter !== 'all') {
          const rate = calculateBurnRate(c.usedPoints, c.totalBudget);
          if (getStage(rate) !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const rateA = calculateBurnRate(a.usedPoints, a.totalBudget);
        const rateB = calculateBurnRate(b.usedPoints, b.totalBudget);

        if (sortBy === 'used') return sortOrder === 'desc' ? b.usedPoints - a.usedPoints : a.usedPoints - b.usedPoints;
        if (sortBy === 'remaining') return sortOrder === 'desc' ? b.remainingPoints - a.remainingPoints : a.remainingPoints - b.remainingPoints;
        if (sortBy === 'burnRate') return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
        if (sortBy === 'name') return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? b.totalBudget - a.totalBudget : a.totalBudget - b.totalBudget;
      });
  }, [customers, searchTerm, selectedOrgFilter, selectedDeptFilter, statusFilter, sortBy, sortOrder, settings]);

  // Filtered Organization List for Organization View
  const displayOrgGroups = useMemo(() => {
    return orgGroups.filter(org => {
      // Organization Filter
      if (selectedOrgFilter !== 'all' && org.company !== selectedOrgFilter) {
        return false;
      }
      // Department Filter
      if (selectedDeptFilter !== 'all' && !org.departmentList.includes(selectedDeptFilter)) {
        return false;
      }
      // Status (Usage Rate) Filter: show this org only if it has at least one member
      // whose *individual* usage rate falls in the selected stage (matching how the
      // "N명" counts above and the expanded member table below are computed) —
      // filtering by the org's own aggregate rate here would show/hide organizations
      // that don't actually match the selected stage's members.
      if (statusFilter !== 'all') {
        const hasStageMember = org.customers.some(c => {
          if (selectedDeptFilter !== 'all' && c.department.trim() !== selectedDeptFilter) return false;
          const rate = calculateBurnRate(c.usedPoints, c.totalBudget);
          return getStage(rate) === statusFilter;
        });
        if (!hasStageMember) return false;
      }

      // Search Term Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchCompany = org.company.toLowerCase().includes(q);
        const matchDept = org.departmentList.some(d => d.toLowerCase().includes(q));
        const matchManager = org.managerList.some(m => m.toLowerCase().includes(q));
        const matchCustomer = org.customers.some(
          c => c.name.toLowerCase().includes(q) || (c.position || '').toLowerCase().includes(q)
        );
        if (!matchCompany && !matchDept && !matchManager && !matchCustomer) return false;
      }

      return true;
    });
  }, [orgGroups, selectedOrgFilter, selectedDeptFilter, statusFilter, searchTerm, settings]);

  // Available departments for the currently selected organization
  const availableDepartments = useMemo(() => {
    if (selectedOrgFilter === 'all') {
      const depts = new Set<string>();
      customers.forEach(c => {
        if (c.department && c.department.trim()) depts.add(c.department.trim());
      });
      return Array.from(depts).sort();
    }
    const targetOrg = orgGroups.find(og => og.company === selectedOrgFilter);
    return targetOrg ? targetOrg.departmentList.sort() : [];
  }, [customers, selectedOrgFilter, orgGroups]);

  const handleSort = (field: 'budget' | 'used' | 'remaining' | 'burnRate' | 'name') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const isAnyFilterActive =
    selectedOrgFilter !== 'all' || selectedDeptFilter !== 'all' || statusFilter !== 'all' || searchTerm !== '';

  const handleResetFilters = () => {
    setSelectedOrgFilter('all');
    setSelectedDeptFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* 1. 조직 및 실적 현황 필터 바 (Organization Filter Bar) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5" id="org-category-selector">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Filter Controls Grid */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Filter Label */}
            <div className="flex items-center space-x-3 text-slate-800 font-bold text-xs shrink-0 mr-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-black text-slate-900 text-xs">조직 및 조건 필터</span>
                <span className="text-[11px] text-slate-500 font-normal">원하는 조직을 선택하여 실적 조회</span>
              </div>
            </div>

            {/* 1. Organization Select Dropdown */}
            <div className="relative min-w-[210px] flex-1 sm:flex-none">
              <div className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>조직(회사) 선택</span>
              </div>
              <div className="relative">
                <select
                  value={selectedOrgFilter}
                  onChange={e => {
                    setSelectedOrgFilter(e.target.value);
                    setSelectedDeptFilter('all');
                  }}
                  className={`w-full h-9 appearance-none pl-3 pr-8 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedOrgFilter !== 'all'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/10'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="all">전체 조직 ({orgGroups.length}개 조직 · {customers.length}명)</option>
                  {orgGroups.map(og => (
                    <option key={og.company} value={og.company}>
                      {og.company} ({og.customers.length}명 · {formatPercent(og.burnRate)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Department Select Dropdown */}
            <div className="relative min-w-[150px] flex-1 sm:flex-none">
              <div className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>소속(부서) 선택</span>
              </div>
              <div className="relative">
                <select
                  value={selectedDeptFilter}
                  onChange={e => setSelectedDeptFilter(e.target.value)}
                  className={`w-full h-9 appearance-none pl-3 pr-8 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDeptFilter !== 'all'
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="all">전체 부서 ({availableDepartments.length}개)</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Status (Usage Rate) Select Dropdown */}
            <div className="relative min-w-[140px] flex-1 sm:flex-none">
              <div className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-slate-400" />
                <span>사용률(상태) 기준</span>
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className={`w-full h-9 appearance-none pl-3 pr-8 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter !== 'all'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="all">전체 단계 (0% ~ 100%)</option>
                  <option value="stage1">1단계: 0% ~ {settings?.stage1MaxPercent ?? 30}%</option>
                  <option value="stage2">2단계: {settings?.stage1MaxPercent ?? 30}% ~ {settings?.stage2MaxPercent ?? 50}%</option>
                  <option value="stage3">3단계: {settings?.stage2MaxPercent ?? 50}% ~ {settings?.stage3MaxPercent ?? 70}%</option>
                  <option value="stage4">4단계: {settings?.stage3MaxPercent ?? 70}% 이상</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Search Input (성함 검색) */}
            <div className="relative min-w-[180px] flex-1 sm:flex-none">
              <div className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Search className="w-3 h-3 text-slate-400" />
                <span>성함 검색</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="회원 성함 검색..."
                  className="w-full h-9 pl-3 pr-7 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-800 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 5. Reset Button */}
            {isAnyFilterActive && (
              <div className="flex flex-col justify-end">
                <div className="text-[11px] text-transparent mb-1 select-none">초기화</div>
                <button
                  onClick={handleResetFilters}
                  className="h-9 px-3.5 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  title="모든 필터 초기화"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>필터 초기화</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top KPI Summary Strip: 총 배정 예산 | 총 포인트 사용실적 | 잔여 가용포인트 | 사용률 (한줄 나열) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden" id="main-kpi-summary-strip">
        {/* Selected Org Highlight Header (When single org is selected) */}
        {selectedOrgData && (
          <div className="p-4 sm:px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-white flex items-center justify-center font-bold shrink-0">
                <Layers className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    [{selectedOrgData.company}] 예산 및 사용 실적
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    소속 이용자 {selectedOrgData.customers.length}명
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {/* 셀 1: 총 배정 예산 */}
          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-tight">
                {selectedOrgData ? `[${selectedOrgData.company}] 배정 예산` : '총 배정 예산'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {formatPoints(activeMetrics.totalBudget)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>소속 <strong className="text-slate-700 font-extrabold">{activeMetrics.customerCount}명</strong> 배정</span>
                </span>
                {!selectedOrgData && (
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>총 <strong className="text-slate-700 font-extrabold">{orgGroups.length}개</strong> 조직</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 셀 2: 총 포인트 사용실적 */}
          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-tight">
                {selectedOrgData ? '조직 포인트 사용실적' : '총 포인트 사용실적'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <PieIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-blue-600 tracking-tight font-mono">
                {formatPoints(activeMetrics.totalUsed)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>누적 실적 합계</span>
                <span className="font-semibold text-slate-700">실시간 집계</span>
              </div>
            </div>
          </div>

          {/* 셀 3: 총 잔여 포인트 */}
          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-tight">
                {selectedOrgData ? '조직 잔여 포인트' : '총 잔여 포인트'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-emerald-600 tracking-tight font-mono">
                {formatPoints(activeMetrics.totalRemaining)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>잔여 비율</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                  {formatPercent(Math.max(100 - activeMetrics.burnRate, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* 셀 4: 사용률 및 4단계 현황 */}
          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-tight">
                {selectedOrgData ? '조직 사용률' : '포인트 사용률'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight font-mono">
                {formatPercent(activeMetrics.burnRate)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>누적 사용률</span>
                <span className="font-semibold text-slate-700">실시간 집계</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 하단: 조직별 현황 또는 선택된 조직의 소속 이용자(회원)별 현황 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="budget-main-table-panel">
        {/* Navigation & Controls Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/70">
          {/* Left: View Mode Toggle or Org Title */}
          {selectedOrgData ? (
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>[{selectedOrgData.company}] 소속 회원별 상세 현황</span>
                  <span className="px-2 py-0.2 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                    {filteredCustomers.length}명
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrgData.company} 소속 각 이용자의 예산 배정, 사용 실적, 잔여 포인트 및 사용률을 관리합니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl">
              <button
                onClick={() => setViewMode('organization')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'organization'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>조직별 배정 및 사용 실적 현황</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800">
                  {orgGroups.length}개
                </span>
              </button>

              <button
                onClick={() => setViewMode('customer')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'customer'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>회원별 상세 예산 및 실적</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                  {customers.length}명
                </span>
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Organization Dropdown (Only in All Org mode) */}
            {!selectedOrgData && viewMode === 'customer' && (
              <select
                value={selectedOrgFilter}
                onChange={e => setSelectedOrgFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">모든 조직 전체</option>
                {uniqueOrgNames.map(org => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            )}

            {/* Status (Usage Rate) Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">전체 단계 (사용률)</option>
              <option value="stage1">1단계 (0%~{settings?.stage1MaxPercent ?? 30}%)</option>
              <option value="stage2">2단계 ({settings?.stage1MaxPercent ?? 30}%~{settings?.stage2MaxPercent ?? 50}%)</option>
              <option value="stage3">3단계 ({settings?.stage2MaxPercent ?? 50}%~{settings?.stage3MaxPercent ?? 70}%)</option>
              <option value="stage4">4단계 ({settings?.stage3MaxPercent ?? 70}% 이상)</option>
            </select>

            {/* Search Input (성함 검색 - 상태 필터 우측 배치) */}
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="회원 성함 검색..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Expand / Collapse All for Org Mode */}
            {!selectedOrgData && viewMode === 'organization' && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => toggleAllOrgs(true)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  모두 펼치기
                </button>
                <button
                  onClick={() => toggleAllOrgs(false)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  모두 접기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= VIEW 1: 조직별 예산 및 실적 현황 (전체 조직 모드일 때만) ================= */}
        {!selectedOrgData && viewMode === 'organization' && (
          <div className="divide-y divide-slate-200">
            {displayOrgGroups.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                조건에 일치하는 조직 데이터가 없습니다.
              </div>
            ) : (
              displayOrgGroups.map(org => {
                const isExpanded = !!expandedOrgs[org.company];
                const burnRateClass = getBurnRateColorClass(org.burnRate, settings);
                const filteredOrgCustomers = org.customers.filter(c => memberMatchesFilters(c));

                return (
                  <div key={org.company} className="transition-colors hover:bg-slate-50/50">
                    {/* Organization Summary Row */}
                    <div
                      onClick={() => toggleOrgExpand(org.company)}
                      className="p-4 sm:px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      {/* Left: Org Info */}
                      <div className="flex items-start sm:items-center space-x-3 min-w-[280px]">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{org.company}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              소속 {org.customers.length}명
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics Grid */}
                      <div className="flex flex-wrap items-center gap-6 text-xs w-full lg:w-auto justify-between lg:justify-end">
                        {/* 배정 예산 */}
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">배정 예산 총액</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {formatPoints(org.totalBudget)}
                          </span>
                        </div>

                        {/* 사용 실적 */}
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">사용 실적 합계</span>
                          <span className="font-extrabold text-blue-600 text-sm">
                            {formatPoints(org.totalUsed)}
                          </span>
                        </div>

                        {/* 잔여 포인트 */}
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">잔여 포인트</span>
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {formatPoints(org.totalRemaining)}
                          </span>
                        </div>

                        {/* 사용률 Bar */}
                        <div className="w-36">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-slate-400">조직 사용률</span>
                            <span className="text-[11px] font-extrabold text-rose-600">
                              {formatPercent(org.burnRate)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${burnRateClass.bg} transition-all duration-300`}
                              style={{ width: `${Math.min(org.burnRate, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Expand Icon */}
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Organization Sub-Table (Expanded Customers List) */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 px-4 sm:px-6 py-4 border-t border-slate-200 animate-in fade-in duration-150">
                        <div className="mb-2.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>[{org.company}] 소속 회원별 예산 및 실적 상세 ({filteredOrgCustomers.length}명)</span>
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-4 text-left">
                                  <div className="flex items-center gap-1">
                                    <Network className="w-3 h-3 text-cyan-600" />
                                    <span>소속 부서</span>
                                  </div>
                                </th>
                                <th className="py-2.5 px-3 text-left">성함</th>
                                <th className="py-2.5 px-3 text-left">직위</th>
                                <th className="py-2.5 px-3 text-right">배정 예산</th>
                                <th className="py-2.5 px-3 text-right">사용 실적</th>
                                <th className="py-2.5 px-3 text-right">잔여 포인트</th>
                                <th className="py-2.5 px-3 text-left">사용률</th>
                                <th className="py-2.5 px-3 text-center">수정</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {filteredOrgCustomers.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-8 text-center text-slate-400">
                                    조건에 일치하는 회원이 없습니다.
                                  </td>
                                </tr>
                              ) : (
                                filteredOrgCustomers.map(cust => {
                                const rate = calculateBurnRate(cust.usedPoints, cust.totalBudget);
                                const parsed = separateNameAndPosition(cust.name, cust.position);

                                return (
                                  <tr key={cust.id} className="hover:bg-blue-50/40 transition-colors">
                                    {/* 소속 부서 */}
                                    <td className="py-2.5 px-4 text-slate-600">
                                      <div className="flex items-center gap-1.5">
                                        <Network className="w-3 h-3 text-cyan-600 shrink-0" />
                                        <span>{cust.department}</span>
                                      </div>
                                    </td>

                                    {/* 성함 */}
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span
                                          onClick={() => onSelectCustomer(cust)}
                                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer underline-offset-2 hover:underline"
                                        >
                                          {parsed.name}
                                        </span>
                                      </div>
                                    </td>

                                    {/* 직위 */}
                                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                                      {parsed.position || '-'}
                                    </td>

                                    {/* 배정 예산 */}
                                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-mono">
                                      {formatPoints(cust.totalBudget)}
                                    </td>

                                    {/* 사용 실적 */}
                                    <td className="py-2.5 px-3 text-right font-extrabold text-blue-600 font-mono">
                                      {formatPoints(cust.usedPoints)}
                                    </td>

                                    {/* 잔여 포인트 */}
                                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 font-mono">
                                      {formatPoints(cust.remainingPoints)}
                                    </td>

                                    {/* 사용률 */}
                                    <td className="py-2.5 px-3">
                                      <span className="font-extrabold font-mono text-rose-600">{formatPercent(rate)}</span>
                                    </td>

                                    {/* 작업 버튼 */}
                                    <td className="py-2.5 px-3 text-center">
                                      <div className="flex items-center justify-center space-x-1">
                                        <button
                                          onClick={() => onSelectCustomer(cust)}
                                          title="회원 상세 정보 및 실적 로그"
                                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onOpenAddTransactionForCustomer(cust)}
                                          title="실적(사용내역) 직접 입력"
                                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <PlusCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => onOpenAdjustBudgetForCustomer(cust)}
                                          title="포인트 예산 조정 및 충전"
                                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
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
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ================= VIEW 2: 이용자(회원)별 상세 현황 테이블 ================= */}
        {(selectedOrgData !== null || viewMode === 'customer') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold select-none">
                  <th className="py-3 px-4 sm:px-6 text-left">
                    <div className="flex items-center gap-1.5">
                      <Network className="w-3 h-3 text-cyan-600" />
                      <span>소속 부서</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span>성함</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-left">직위</th>
                  <th className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleSort('budget')}
                      className="flex items-center justify-end gap-1.5 ml-auto hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span>배정 예산</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleSort('used')}
                      className="flex items-center justify-end gap-1.5 ml-auto hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span>사용 실적</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleSort('remaining')}
                      className="flex items-center justify-end gap-1.5 ml-auto hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span>잔여 포인트</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 min-w-[130px] text-left">
                    <button
                      onClick={() => handleSort('burnRate')}
                      className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <span>사용률</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      검색 및 필터 조건에 일치하는 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => {
                    const burnRate = calculateBurnRate(customer.usedPoints, customer.totalBudget);
                    const parsed = separateNameAndPosition(customer.name, customer.position);

                    return (
                      <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* 1. 소속 부서 */}
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Network className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span>{customer.department}</span>
                          </div>
                        </td>

                        {/* 2. 성함 */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              onClick={() => onSelectCustomer(customer)}
                              className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer underline-offset-2 hover:underline"
                            >
                              {parsed.name}
                            </span>
                          </div>
                        </td>

                        {/* 3. 직위 */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          {parsed.position || '-'}
                        </td>

                        {/* 4. Total Budget */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-extrabold text-slate-900 font-mono">
                            {formatPoints(customer.totalBudget)}
                          </span>
                        </td>

                        {/* 5. Used Points */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-extrabold text-blue-600 font-mono">
                            {formatPoints(customer.usedPoints)}
                          </span>
                        </td>

                        {/* 6. Remaining Points */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-extrabold text-emerald-600 font-mono">
                            {formatPoints(customer.remainingPoints)}
                          </span>
                        </td>

                        {/* 7. Burn Rate (사용률 수치만 표기) */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold font-mono text-rose-600">
                            {formatPercent(burnRate)}
                          </span>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => onSelectCustomer(customer)}
                              title="상세 보기"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenAddTransactionForCustomer(customer)}
                              title="실적 입력"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenAdjustBudgetForCustomer(customer)}
                              title="예산 배정/조정"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Settings className="w-4 h-4" />
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
        )}
      </div>
    </div>
  );
};
