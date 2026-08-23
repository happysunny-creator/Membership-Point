import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { formatPoints } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import {
  X,
  Edit3,
  Save,
  Layers,
  Network,
  User,
  Briefcase,
  Wallet,
  FileText,
  UserCheck,
} from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (updatedCustomer: Customer) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
}) => {
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [manager, setManager] = useState('');
  const [totalBudget, setTotalBudget] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customer) {
      const { name: separatedName, position: separatedPos } = separateNameAndPosition(
        customer.name || '',
        customer.position || ''
      );
      setCompany(customer.company || '');
      setDepartment(customer.department || '');
      setName(separatedName);
      setPosition(separatedPos);
      setManager(customer.manager || '');
      setTotalBudget(customer.totalBudget !== undefined ? customer.totalBudget : '');
      setNotes(customer.notes || '');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name: cleanName, position: cleanPos } = separateNameAndPosition(name, position);
    if (!company.trim() || !cleanName.trim() || totalBudget === '' || Number(totalBudget) < 0) {
      alert('조직명, 성함, 배정 예산을 올바르게 입력해주세요.');
      return;
    }

    const budgetNum = Number(totalBudget);
    const newRemaining = Math.max(0, budgetNum - (customer.usedPoints || 0));

    const updated: Customer = {
      ...customer,
      company: company.trim(),
      department: department.trim() || '본사',
      name: cleanName.trim(),
      position: cleanPos.trim(),
      manager: manager.trim() || '운영관리팀',
      totalBudget: budgetNum,
      remainingPoints: newRemaining,
      notes: notes.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">회원 정보 수정</h2>
              <p className="text-xs text-slate-500">{customer.name} ({customer.company})</p>
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
          {/* Row 1: 조직명 & 소속(부서) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>조직명 *</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-cyan-600" />
                <span>소속(부서) *</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Row 2: 성함 & 직위 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>성함 *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>직위</span>
              </label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="예: 팀장, 수석, 본부장"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: 배정포인트 & 담당자 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  <span>배정포인트 (P) *</span>
                </label>
                {typeof totalBudget === 'number' && totalBudget > 0 && (
                  <span className="text-[11px] font-bold text-slate-900">
                    {formatPoints(totalBudget)}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={totalBudget}
                onChange={e => setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>담당자</span>
              </label>
              <input
                type="text"
                value={manager}
                onChange={e => setManager(e.target.value)}
                placeholder="예: 박운영 / B2B운영팀"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 4: 비고 및 메모 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>비고 및 관리 메모</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="관리 메모 (선택사항)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
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
