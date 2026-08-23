import React, { useState, useMemo } from 'react';
import { OrgCategory } from '../types';
import { formatPoints, formatNumber } from '../utils/formatters';
import { downloadOrgCategoryExcelTemplate } from '../utils/excelParser';
import { AddOrgCategoryModal } from './AddOrgCategoryModal';
import { EditOrgCategoryModal } from './EditOrgCategoryModal';
import { ExcelOrgCategoryUploadModal } from './ExcelOrgCategoryUploadModal';
import {
  Layers,
  Search,
  PlusCircle,
  UploadCloud,
  Download,
  Network,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Filter,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface OrgCategoryManagementProps {
  categories: OrgCategory[];
  onAddCategory: (category: Omit<OrgCategory, 'id' | 'updatedAt'>) => void;
  onUpdateCategory: (updatedCategory: OrgCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onImportCategories: (newCategories: OrgCategory[], mode: 'append' | 'replace') => void;
}

export const OrgCategoryManagement: React.FC<OrgCategoryManagementProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onImportCategories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OrgCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<OrgCategory | null>(null);

  // Extract unique companies
  const uniqueCompanies = useMemo(() => {
    const orgs = new Set<string>();
    categories.forEach(c => {
      if (c.company) orgs.add(c.company);
    });
    return Array.from(orgs);
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchesOrg = selectedOrgFilter === 'all' || cat.company === selectedOrgFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.department && cat.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cat.categoryCode && cat.categoryCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesOrg && matchesQuery;
    });
  }, [categories, selectedOrgFilter, searchQuery]);

  // Statistics
  const totalCount = categories.length;
  const activeCount = categories.filter(c => c.isActive).length;
  const totalBudget = categories.reduce((sum, c) => sum + (c.allocatedBudget || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">등록 카테고리</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{formatNumber(totalCount)}</span>
            <span className="text-xs text-slate-500">개 항목</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">활성 사용중</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{formatNumber(activeCount)}</span>
            <span className="text-xs text-slate-500">/ {totalCount}개</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">카테고리 총 배정 예산</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{formatPoints(totalBudget)}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="조직명, 부서, 카테고리명, 코드 검색..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Org Filter */}
            <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-indigo-600 ml-1.5" />
              <select
                value={selectedOrgFilter}
                onChange={e => setSelectedOrgFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-700 py-1 pl-1 pr-6 focus:ring-0 cursor-pointer"
              >
                <option value="all">전체 조직 ({categories.length})</option>
                {uniqueCompanies.map(org => (
                  <option key={org} value={org}>
                    {org} ({categories.filter(c => c.company === org).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadOrgCategoryExcelTemplate}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="표준 엑셀 서식 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>양식 다운로드</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>엑셀 일괄 업로드</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-emerald-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>카테고리 직접 등록</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>조직명</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-cyan-600" />
                    <span>소속 (부서)</span>
                  </div>
                </th>
                <th className="py-3 px-4">카테고리명</th>
                <th className="py-3 px-4">관리 코드</th>
                <th className="py-3 px-4 text-right">배정 예산 (P)</th>
                <th className="py-3 px-4">비고 / 관리설명</th>
                <th className="py-3 px-4 text-center">사용 여부</th>
                <th className="py-3 px-4 text-center w-24">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium">등록된 조직별 카테고리가 없습니다.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      상단의 [카테고리 직접 등록] 또는 [엑셀 일괄 업로드]를 이용해보세요.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{cat.company}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{cat.department || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        {cat.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {cat.categoryCode || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {cat.allocatedBudget ? formatPoints(cat.allocatedBudget) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={cat.description}>
                      {cat.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCategory({
                            ...cat,
                            isActive: !cat.isActive,
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          cat.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cat.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            사용중
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            미사용
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(cat)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="카테고리 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="카테고리 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AddOrgCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddCategory}
        existingCompanies={uniqueCompanies.length > 0 ? uniqueCompanies : ['현대자동차 연구소', '(주)에이스테크놀로지']}
      />

      {/* Edit Modal */}
      {editingCategory && (
        <EditOrgCategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          onSave={onUpdateCategory}
        />
      )}

      {/* Excel Upload Modal */}
      <ExcelOrgCategoryUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportComplete={onImportCategories}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">카테고리 삭제 확인</h3>
              <p className="text-xs text-slate-600">
                선택하신 <strong className="text-slate-900">[{deletingCategory.categoryName}]</strong> 카테고리를
                삭제하시겠습니까?
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">조직명</span>
                <span className="font-bold text-slate-800">{deletingCategory.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">소속(부서)</span>
                <span className="text-slate-700">{deletingCategory.department || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">코드</span>
                <span className="font-mono text-slate-700">{deletingCategory.categoryCode || '-'}</span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCategory(deletingCategory.id);
                  setDeletingCategory(null);
                }}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
