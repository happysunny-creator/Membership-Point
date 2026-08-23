import React, { useState } from 'react';
import { OrgCategory } from '../types';
import { X, Layers, PlusCircle, Network, Tag, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

interface AddOrgCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<OrgCategory, 'id' | 'updatedAt'>) => void;
  existingCompanies: string[];
}

export const AddOrgCategoryModal: React.FC<AddOrgCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCompanies,
}) => {
  const [company, setCompany] = useState<string>(existingCompanies[0] || '');
  const [customCompany, setCustomCompany] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryCode, setCategoryCode] = useState<string>('');
  const [allocatedBudget, setAllocatedBudget] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  if (!isOpen) return null;

  const targetCompany = company === '__NEW__' ? customCompany.trim() : company.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompany || !categoryName.trim()) {
      alert('조직명과 카테고리명을 입력해주세요.');
      return;
    }

    onSave({
      company: targetCompany,
      department: department.trim() || '전체 부서',
      categoryName: categoryName.trim(),
      categoryCode: categoryCode.trim() || `CAT-${Date.now().toString().slice(-4)}`,
      allocatedBudget: allocatedBudget === '' ? undefined : Number(allocatedBudget),
      description: description.trim(),
      isActive,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">조직별 카테고리 직접 등록</h2>
              <p className="text-xs text-slate-500">조직 및 부서별 맞춤 복지/포인트 사용 카테고리를 생성합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Company Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              대상 조직명 *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
                {existingCompanies.map(comp => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
                <option value="__NEW__">+ 신규 조직명 직접 입력</option>
              </select>

              {company === '__NEW__' && (
                <input
                  type="text"
                  value={customCompany}
                  onChange={e => setCustomCompany(e.target.value)}
                  placeholder="신규 조직명 입력 (예: 카카오엔터프라이즈)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              )}
            </div>
          </div>

          {/* Department & Category Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-cyan-600" />
                소속 (부서)
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="예: 경영기획부, IT연구소 (미입력시 전체)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">카테고리 관리 코드</label>
              <input
                type="text"
                value={categoryCode}
                onChange={e => setCategoryCode(e.target.value)}
                placeholder="예: FNB-HD-01 (자동 생성 가능)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category Name & Allocated Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                카테고리명 *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                placeholder="예: 식음료/외식, 종합건강검진, 자기계발"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                배정 예산 (선택)
              </label>
              <input
                type="number"
                value={allocatedBudget}
                onChange={e => setAllocatedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="예: 5000000"
                min="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              비고 및 관리 설명
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 부서 정기 워크숍 및 간담회 다과 포인트 정산용"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Active Status */}
          <div className="pt-2 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">사용 여부</span>
              <p className="text-[11px] text-slate-500">활성화 시 해당 조직의 사용 카테고리로 적용됩니다.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>카테고리 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
