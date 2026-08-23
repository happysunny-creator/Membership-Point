import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Film,
  Plane,
  GraduationCap,
  Car,
  HeartPulse,
  Laptop,
  Search,
  SlidersHorizontal,
  X,
  Layers,
} from 'lucide-react';
import { Category, CategoryId, CustomerStatus, CustomerTier, DateRangePreset, FilterState, TransactionType } from '../types';
import { formatPoints } from '../utils/formatters';

interface CategoryFilterBarProps {
  categories: Category[];
  filterState: FilterState;
  onCategoryChange: (categoryId: CategoryId | 'all') => void;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  categorySpendingMap: Record<CategoryId, number>;
  totalSpend: number;
}

export const getCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
  switch (iconName) {
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'Plane':
      return <Plane className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Laptop':
      return <Laptop className={className} />;
    default:
      return <ShoppingBag className={className} />;
  }
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  filterState,
  onCategoryChange,
  onFilterChange,
  onResetFilters,
  categorySpendingMap,
  totalSpend,
}) => {
  const isAnyFilterActive =
    filterState.selectedCategory !== 'all' ||
    filterState.searchQuery !== '' ||
    filterState.selectedTier !== 'all' ||
    filterState.selectedStatus !== 'all' ||
    filterState.selectedType !== 'all' ||
    filterState.dateRange !== 'all';

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4" id="category-filter-section">
      {/* Category Pills Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">카테고리별 사용 현황 필터</h2>
            <p className="text-xs text-slate-500">원하는 카테고리를 클릭하여 실시간 사용 내역과 통계를 필터링하세요</p>
          </div>
        </div>

        {isAnyFilterActive && (
          <button
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors border border-rose-200"
          >
            <X className="w-3.5 h-3.5" />
            필터 초기화
          </button>
        )}
      </div>

      {/* Category Horizontal Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {/* '전체' Category Button */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
            filterState.selectedCategory === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold">전체 카테고리</span>
          </div>
          <span className={`text-[11px] font-bold ${filterState.selectedCategory === 'all' ? 'text-slate-200' : 'text-slate-900'}`}>
            {formatPoints(totalSpend)}
          </span>
        </button>

        {/* Category List */}
        {categories.map(cat => {
          const isSelected = filterState.selectedCategory === cat.id;
          const spend = categorySpendingMap[cat.id] || 0;
          const percentOfTotal = totalSpend > 0 ? ((spend / totalSpend) * 100).toFixed(0) : '0';

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 w-full justify-center">
                <span
                  style={{ color: cat.color }}
                  className="p-1 rounded-md bg-slate-50 border border-slate-100"
                >
                  {getCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                </span>
                <span className="font-semibold truncate max-w-[85px] text-slate-900" title={cat.name}>
                  {cat.shortName}
                </span>
              </div>
              <div className="flex items-center justify-between w-full px-1 text-[11px]">
                <span className="font-bold text-slate-900 truncate">
                  {formatPoints(spend)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-1">
                  {percentOfTotal}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary Search & Filter Row */}
      <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterState.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            placeholder="회원명, 회사명, 사용처(가맹점), 거래 설명 검색..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">상세필터:</span>
          </div>

          {/* Date Range Filter */}
          <select
            value={filterState.dateRange}
            onChange={e => onFilterChange({ dateRange: e.target.value as DateRangePreset })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">기간: 전체</option>
            <option value="today">기간: 오늘 (당일)</option>
            <option value="this_month">기간: 이번 달</option>
            <option value="last_3_months">기간: 최근 3개월</option>
            <option value="year_2026">기간: 2026년 연간</option>
          </select>

          {/* Customer Tier Filter */}
          <select
            value={filterState.selectedTier}
            onChange={e => onFilterChange({ selectedTier: e.target.value as CustomerTier | 'all' })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">회원 등급: 전체</option>
            <option value="VIP">VIP</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
            <option value="Corporate">법인/Corporate</option>
          </select>

          {/* Budget Status Filter */}
          <select
            value={filterState.selectedStatus}
            onChange={e => onFilterChange({ selectedStatus: e.target.value as CustomerStatus | 'all' })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">예산 상태: 전체</option>
            <option value="ACTIVE">정상 소진</option>
            <option value="WARNING">소진율 주의(80%↑)</option>
            <option value="OVER_BUDGET">한도 임박(95%↑)</option>
          </select>

          {/* Transaction Type Filter */}
          <select
            value={filterState.selectedType}
            onChange={e => onFilterChange({ selectedType: e.target.value as TransactionType | 'all' })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">거래 유형: 전체</option>
            <option value="SPEND">포인트 사용</option>
            <option value="RECHARGE">포인트 충전</option>
            <option value="REFUND">취소/환불</option>
            <option value="BUDGET_ALLOCATION">예산 배정</option>
          </select>
        </div>
      </div>
    </div>
  );
};
