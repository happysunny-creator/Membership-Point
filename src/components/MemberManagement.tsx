import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { formatPoints, formatNumber } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { downloadCustomerDataExcel } from '../utils/excelParser';
import { AddCustomerModal } from './AddCustomerModal';
import { EditMemberModal } from './EditMemberModal';
import {
  Users,
  Search,
  UserPlus,
  UploadCloud,
  Download,
  Edit2,
  Trash2,
  Briefcase,
  User,
  Wallet,
  AlertCircle,
  UserCheck,
  Layers,
  Network,
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface MemberManagementProps {
  customers: Customer[];
  onAddCustomer: (newCustomer: Customer) => void;
  onBatchAddCustomers: (newCustomers: Customer[]) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAdjustBudget: (customerId: string, newBudget: number, reason: string) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  customers,
  onAddCustomer,
  onBatchAddCustomers,
  onUpdateCustomer,
  onDeleteCustomer,
  onAdjustBudget,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'single' | 'excel'>('single');
  const [editingMember, setEditingMember] = useState<Customer | null>(null);
  const [deletingMember, setDeletingMember] = useState<Customer | null>(null);

  // Point Allocation / Recovery Management (bottom section)
  const [pointOpMemberId, setPointOpMemberId] = useState('');
  const [pointOpMode, setPointOpMode] = useState<'ADD' | 'RECOVER'>('ADD');
  const [pointOpAmount, setPointOpAmount] = useState<number | ''>('');
  const [pointOpReason, setPointOpReason] = useState('');
  const [isPointOpSaved, setIsPointOpSaved] = useState(false);
  const [pointOpSearchQuery, setPointOpSearchQuery] = useState('');
  const [isPointOpDropdownOpen, setIsPointOpDropdownOpen] = useState(false);

  const pointOpMember = customers.find(c => c.id === pointOpMemberId) || null;

  const pointOpSearchResults = useMemo(() => {
    const q = pointOpSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter(c => {
        const parsed = separateNameAndPosition(c.name, c.position);
        return (
          parsed.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          (c.department && c.department.toLowerCase().includes(q))
        );
      })
      .slice(0, 20);
  }, [customers, pointOpSearchQuery]);

  const handleSelectPointOpMember = (c: Customer) => {
    const parsed = separateNameAndPosition(c.name, c.position);
    setPointOpMemberId(c.id);
    setPointOpSearchQuery(`${c.company} · ${parsed.name}${parsed.position ? ` (${parsed.position})` : ''}`);
    setIsPointOpDropdownOpen(false);
  };

  const handleClearPointOpMember = () => {
    setPointOpMemberId('');
    setPointOpSearchQuery('');
  };
  const pointOpAmountNum = Number(pointOpAmount) || 0;
  const previewNewBudget = pointOpMember
    ? pointOpMode === 'ADD'
      ? pointOpMember.totalBudget + pointOpAmountNum
      : Math.max(pointOpMember.totalBudget - pointOpAmountNum, 0)
    : 0;

  const handleApplyPointOp = () => {
    if (!pointOpMember) {
      alert('포인트를 배정/회수할 회원을 선택해주세요.');
      return;
    }
    if (!pointOpAmountNum || pointOpAmountNum <= 0) {
      alert('올바른 포인트 금액을 입력해주세요.');
      return;
    }

    const newBudget =
      pointOpMode === 'ADD'
        ? pointOpMember.totalBudget + pointOpAmountNum
        : Math.max(pointOpMember.totalBudget - pointOpAmountNum, 0);

    if (newBudget < pointOpMember.usedPoints) {
      alert(
        `회수 후 예산(${formatPoints(newBudget)})이 이미 사용된 실적(${formatPoints(pointOpMember.usedPoints)})보다 적을 수 없습니다.`
      );
      return;
    }

    const defaultReason =
      pointOpMode === 'ADD'
        ? `포인트 배정: +${formatPoints(pointOpAmountNum)}`
        : `포인트 회수: -${formatPoints(pointOpAmountNum)}`;

    onAdjustBudget(pointOpMember.id, newBudget, pointOpReason.trim() || defaultReason);

    setIsPointOpSaved(true);
    setPointOpAmount('');
    setPointOpReason('');
    setTimeout(() => setIsPointOpSaved(false), 3000);
  };

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
  const allocatedMembersCount = customers.filter(c => (c.totalBudget || 0) >= 10000).length;

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
              소속 조직별 회원 명단 등록, 직위 및 담당자 지정, 배정 포인트 현황을 종합 관리합니다.
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
            className="h-10 px-3.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
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
            <span>회원 직접 등록</span>
          </button>

          <button
            type="button"
            onClick={() => downloadCustomerDataExcel(customers)}
            className="h-10 px-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>회원 정보 다운받기</span>
          </button>
        </div>
      </div>

      {/* 2. Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="text-2xl font-extrabold text-indigo-700 tracking-tight">{uniqueCompanies.length}</span>
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
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatNumber(totalMembers)}</span>
              <span className="text-xs font-semibold text-slate-500">명</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              전체 회원
            </span>
          </div>
        </div>

        {/* 3. 총 배정 인원 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between h-[112px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">총 배정 인원</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-purple-700 tracking-tight">{formatNumber(allocatedMembersCount)}</span>
              <span className="text-xs font-semibold text-slate-500">명</span>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              10,000P 이상
            </span>
          </div>
        </div>

        {/* 4. 총 배정 포인트 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between h-[112px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 tracking-tight">총 배정 포인트</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
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
                조직명, 소속 부서, 성함, 직위, 배정 포인트 및 담당자를 확인하고 수정할 수 있습니다.
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
                placeholder="성함, 조직명, 부서, 직위, 담당자 검색..."
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
                <th className="py-3 px-4">직위</th>
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
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-extrabold text-[11px]">
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
                      <td className="py-3.5 px-4 text-left font-mono font-extrabold text-slate-900 whitespace-nowrap">
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

      {/* Point Allocation / Recovery Management */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">포인트 배정 / 회수 관리</h3>
            <p className="text-xs text-slate-500">
              회원 개인별로 포인트를 직접 추가 배정하거나 회수할 수 있으며, 예산관리·실적관리 등 모든 화면에 즉시 반영됩니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Member Selection & Current Status */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">대상 회원 선택 *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={pointOpSearchQuery}
                onChange={e => {
                  setPointOpSearchQuery(e.target.value);
                  setPointOpMemberId('');
                  setIsPointOpDropdownOpen(true);
                }}
                onFocus={() => setIsPointOpDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsPointOpDropdownOpen(false), 150)}
                placeholder="성함으로 검색..."
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {pointOpSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearPointOpMember}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="선택 해제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {isPointOpDropdownOpen && pointOpSearchQuery.trim() && !pointOpMemberId && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {pointOpSearchResults.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-slate-400">검색 결과가 없습니다.</div>
                  ) : (
                    pointOpSearchResults.map(c => {
                      const parsed = separateNameAndPosition(c.name, c.position);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => handleSelectPointOpMember(c)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-slate-800 truncate">
                            {parsed.name} {parsed.position ? <span className="text-slate-400 font-normal">({parsed.position})</span> : ''}
                          </span>
                          <span className="text-slate-400 text-[11px] shrink-0">{c.company}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {pointOpMember && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">현재 배정 예산</span>
                  <span className="font-extrabold text-slate-900 font-mono">{formatPoints(pointOpMember.totalBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">현재 사용 실적</span>
                  <span className="font-extrabold text-blue-600 font-mono">{formatPoints(pointOpMember.usedPoints)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">현재 잔여 포인트</span>
                  <span className="font-extrabold text-emerald-600 font-mono">{formatPoints(pointOpMember.remainingPoints)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mode / Amount / Reason / Submit */}
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPointOpMode('ADD')}
                className={`py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pointOpMode === 'ADD'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                포인트 배정 (추가)
              </button>
              <button
                type="button"
                onClick={() => setPointOpMode('RECOVER')}
                className={`py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pointOpMode === 'RECOVER'
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                포인트 회수 (차감)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {pointOpMode === 'ADD' ? '배정할 포인트 (P)' : '회수할 포인트 (P)'}
                </label>
                <input
                  type="number"
                  value={pointOpAmount}
                  onChange={e => setPointOpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 500000"
                  min="0"
                  step="100000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">사유 (선택)</label>
                <input
                  type="text"
                  value={pointOpReason}
                  onChange={e => setPointOpReason(e.target.value)}
                  placeholder="예: 우수 성과 특별 포인트 지급"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {pointOpMember && pointOpAmountNum > 0 && (
              <div className="flex items-center justify-between text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 py-2.5">
                <span className="text-indigo-800 font-medium">적용 후 배정 예산</span>
                <span className="font-extrabold text-slate-900 font-mono">{formatPoints(previewNewBudget)}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {isPointOpSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  반영 완료
                </span>
              )}
              <button
                type="button"
                onClick={handleApplyPointOp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                포인트 반영하기
              </button>
            </div>
          </div>
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
                삭제 시 해당 회원의 배정 포인트 및 정보뿐 아니라 관련 거래(실적) 내역도 모두 함께 삭제됩니다.
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
                <span className="text-slate-500">성함 / 직위</span>
                <span className="font-bold text-slate-800">{deletingMember.name} {deletingMember.position ? `(${deletingMember.position})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">배정 포인트</span>
                <span className="font-mono font-extrabold text-slate-900">{formatPoints(deletingMember.totalBudget)}</span>
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
