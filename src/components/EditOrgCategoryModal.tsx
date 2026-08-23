import React, { useState, useEffect } from 'react';
import { OrgCategory } from '../types';
import { X, Edit3, Save, Layers, Network, Tag, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

interface EditOrgCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: OrgCategory | null;
  onSave: (updatedCategory: OrgCategory) => void;
}

export const EditOrgCategoryModal: React.FC<EditOrgCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
}) => {
  const [company, setCompany] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryCode, setCategoryCode] = useState<string>('');
  const [allocatedBudget, setAllocatedBudget] = useState<number | ''>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (category) {
      setCompany(category.company);
      setDepartment(category.department || '');
      setCategoryName(category.categoryName);
      setCategoryCode(category.categoryCode || '');
      setAllocatedBudget(category.allocatedBudget !== undefined ? category.allocatedBudget : '');
      setDescription(category.description || '');
      setIsActive(category.isActive);
    }
  }, [category]);

  if (!isOpen || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !categoryName.trim()) {
      alert('조직명과 카테고리명을 입력해주세요.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    onSave({
      ...category,
      company: company.trim(),
      department: department.trim() || '전체 부서',
      categoryName: categoryName.trim(),
      categoryCode: categoryCode.trim(),
      allocatedBudget: allocatedBudget === '' ? undefined : Number(allocatedBudget),
      description: description.trim(),
      isActive,
      updatedAt: formattedDate,
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
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">조직별 카테고리 직접 수정</h2>
              <p className="text-xs text-slate-500">ID: {category.id}</p>
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
          {/* Company & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                조직명 *
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-cyan-600" />
                소속(부서)
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category Name & Code */}
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">카테고리 관리 코드</label>
              <input
                type="text"
                value={categoryCode}
                onChange={e => setCategoryCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Allocated Budget & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                배정 예산 (선택)
              </label>
              <input
                type="number"
                value={allocatedBudget}
                onChange={e => setAllocatedBudget(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                비고 및 설명
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="pt-2 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">사용 여부</span>
              <p className="text-[11px] text-slate-500">활성화 시 실적 등록 및 정책에 적용됩니다.</p>
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
              <Save className="w-4 h-4" />
              <span>수정사항 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
