import React, { useState, useMemo, useEffect } from 'react';
import { Customer } from '../types';
import { formatPoints, formatNumber } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { AddCustomerModal } from './AddCustomerModal';
import { EditMemberModal } from './EditMemberModal';
import {
  Users,
  Search,
  UserPlus,
  UploadCloud,
  Edit2,
  Trash2,
  Briefcase,
  User,
  Wallet,
  AlertCircle,
  UserCheck,
  Layers,
  Network,
} from 'lucide-react';

interface MemberManagementProps {
  customers: Customer[];
  onAddCustomer: (newCustomer: Customer) => void;
  onBatchAddCustomers: (newCustomers: Customer[]) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  customers,
  onAddCustomer,
  onBatchAddCustomers,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'single' | 'excel'>('single');
  const [editingMember, setEditingMember] = useState<Customer | null>(null);
  const [deletingMember, setDeletingMember] = useState<Customer | null>(null);

  // Extract unique companies
  const uniqueCompanies = useMemo(() => {
    const orgs = new Set<string>();
    customers.forEach(c => {
      if (c.company) orgs.add(c.company);
    });
    return Array.from(orgs);
  }, [customers]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return customers.filter(c => {
      const matchesOrg = selectedOrgFilter === 'all' || c.company === selectedOrgFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.position && c.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.manager && c.manager.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesOrg && matchesQuery;
    });
  }, [customers, selectedOrgFilter, searchQuery]);

  // Summary Metrics
  const totalMembers = customers.length;
  const totalAllocatedBudget = customers.reduce((sum, c) => sum + (c.totalBudget || 0), 0);
  const managerAssignedCount = customers.filter(c => c.manager && c.manager.trim() !== '').length;

  return (
    <div className="space-y-6">
      {/* 1. Page Section Header Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                회원 등록 및 관리
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                총 {totalMembers}명 등록
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              소속 조직별 회원 명단 등록, 직책 및 담당자 지정, 배정 포인트 현황을 종합 관리합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setAddModalMode('excel');
              setIsAddModalOpen(true);
            }}
            className="h-10 px-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>회원 엑셀 일괄 등록</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddModalMode('single');
              setIsAddModalOpen(true);
            }}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-blue-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 회원 직접 등록</span>
          </button>
        </div>
      </div>

      {/* 2. Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. 총 등록 조직 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between h-[112px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight flex items-center gap-1.5">
              총 등록 조직
            </span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-700 tracking-tight">{uniqueCompanies.length}</span>
              <span className="text-xs font-semibold text-slate-500">개 조직</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              본부 및 부문
            </span>
          </div>
        </div>

        {/* 2. 총 등록 회원 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between h-[112px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">총 등록 회원</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{formatNumber(totalMembers)}</span>
              <span className="text-xs font-semibold text-slate-500">명</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              전체 회원
            </span>
          </div>
        </div>

        {/* 3. 총 배정 포인트 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between h-[112px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">총 배정 포인트</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              {formatPoints(totalAllocatedBudget)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              누적 배정
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Card Header & Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">회원 상세 목록</h3>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                  조회 {filteredMembers.length}명
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                조직명, 소속 부서, 성함, 직책, 배정 포인트 및 담당자를 확인하고 수정할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Search & Org Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="성함, 조직명, 부서, 직책, 담당자 검색..."
                className="w-full h-9 pl-9 pr-7 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Org Filter */}
            <div className="flex items-center h-9 bg-white px-2 rounded-lg border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-indigo-600 mr-1 shrink-0" />
              <select
                value={selectedOrgFilter}
                onChange={e => setSelectedOrgFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-700 py-1 pl-1 pr-6 focus:ring-0 cursor-pointer"
              >
                <option value="all">전체 조직 ({customers.length}명)</option>
                {uniqueCompanies.map(org => (
                  <option key={org} value={org}>
                    {org} ({customers.filter(c => c.company === org).length}명)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold select-none text-[12px]">
              <tr>
                <th className="py-3 px-4 w-14 text-center">No</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>조직명</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>소속(부서)</span>
                  </div>
                </th>
                <th className="py-3 px-4">성함</th>
                <th className="py-3 px-4">직책</th>
                <th className="py-3 px-4 text-left">배정 포인트</th>
                <th className="py-3 px-4">담당자</th>
                <th className="py-3 px-4 text-center w-24">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium">검색 조건에 일치하는 회원이 없습니다.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      상단의 [신규 회원 직접 등록] 또는 [회원 엑셀 일괄 등록]을 이용해보세요.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => {
                  const { name: displayName, position: displayPosition } = separateNameAndPosition(
                    member.name,
                    member.position
                  );

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{member.company}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>{member.department || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{displayName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {displayPosition ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {displayPosition}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left font-mono font-bold text-blue-700 whitespace-nowrap">
                        {formatPoints(member.totalBudget)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{member.manager || '운영관리팀'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingMember(member)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            title="회원 정보 수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMember(member)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="회원 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Member Modal (supports both direct and excel modes) */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveCustomer={onAddCustomer}
        onSaveBatchCustomers={onBatchAddCustomers}
        initialMode={addModalMode}
      />

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          customer={editingMember}
          onSave={onUpdateCustomer}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">회원 삭제 확인</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                선택하신 <strong className="text-slate-900">{deletingMember.name} ({deletingMember.company})</strong> 회원을
                삭제하시겠습니까?<br />
                삭제 시 해당 회원의 배정 포인트 및 정보가 시스템에서 제거됩니다.
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">조직명</span>
                <span className="font-bold text-slate-800">{deletingMember.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">소속(부서)</span>
                <span className="font-semibold text-slate-700">{deletingMember.department || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">성함 / 직책</span>
                <span className="font-bold text-slate-800">{deletingMember.name} {deletingMember.position ? `(${deletingMember.position})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">배정 포인트</span>
                <span className="font-mono font-bold text-blue-700">{formatPoints(deletingMember.totalBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">담당자</span>
                <span className="text-slate-700">{deletingMember.manager || '운영관리팀'}</span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(deletingMember.id);
                  setDeletingMember(null);
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
