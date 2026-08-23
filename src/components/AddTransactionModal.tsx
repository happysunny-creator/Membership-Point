import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Transaction } from '../types';
import { formatPoints } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { X, PlusCircle, AlertCircle, Layers, Network } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  targetCustomer?: Customer | null;
  onSaveTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  targetCustomer,
  onSaveTransaction,
}) => {
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [customerId, setCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [merchant, setMerchant] = useState<string>('남산리더십센터');
  const [description, setDescription] = useState<string>('');

  const uniqueOrgs = useMemo(() => {
    const orgs = new Set<string>();
    customers.forEach(c => {
      if (c.company) orgs.add(c.company);
    });
    return Array.from(orgs).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [customers]);

  const orgFilteredCustomers = useMemo(() => {
    return orgFilter === 'all' ? customers : customers.filter(c => c.company === orgFilter);
  }, [customers, orgFilter]);

  useEffect(() => {
    if (targetCustomer) {
      setCustomerId(targetCustomer.id);
      setOrgFilter(targetCustomer.company);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [targetCustomer, customers]);

  if (!isOpen) return null;

  const currentCustomer = customers.find(c => c.id === customerId);

  const handleOrgFilterChange = (org: string) => {
    setOrgFilter(org);
    const list = org === 'all' ? customers : customers.filter(c => c.company === org);
    setCustomerId(list.length > 0 ? list[0].id : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount || Number(amount) <= 0) {
      alert('회원과 유효한 포인트 금액을 입력해주세요.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveTransaction({
      customerId,
      customerName: currentCustomer?.name || '회원',
      customerCompany: currentCustomer?.company || '기업',
      type: 'SPEND',
      amount: Number(amount),
      categoryId: 'shopping',
      categoryName: '기타',
      description: description || '포인트 사용',
      merchant,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      timestamp: formattedDate,
      status: 'COMPLETED',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">포인트 거래 / 사용 등록</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Organization Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              조직명 선택
            </label>
            <select
              value={orgFilter}
              onChange={e => handleOrgFilterChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">전체 조직 ({customers.length}명)</option>
              {uniqueOrgs.map(org => (
                <option key={org} value={org}>
                  {org} ({customers.filter(c => c.company === org).length}명)
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">대상 회원 선택 *</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              {orgFilteredCustomers.length === 0 && (
                <option value="">해당 조직에 등록된 회원이 없습니다</option>
              )}
              {orgFilteredCustomers.map(c => {
                const { name: cleanName, position: cleanPos } = separateNameAndPosition(c.name, c.position);
                return (
                  <option key={c.id} value={c.id}>
                    {c.company} · {cleanName} {cleanPos ? `(${cleanPos})` : ''} - 잔여: {formatPoints(c.remainingPoints)}
                  </option>
                );
              })}
            </select>
            {currentCustomer && (
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      {currentCustomer.company}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Network className="w-3 h-3 text-cyan-600" />
                      {currentCustomer.department}
                    </span>
                  </div>
                  <span className="font-medium text-slate-500">배정: <span className="font-bold text-slate-900">{formatPoints(currentCustomer.totalBudget)}</span></span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">현재 사용 실적: <span className="font-bold text-blue-600">{formatPoints(currentCustomer.usedPoints)}</span></span>
                  <span className="font-bold text-emerald-600">가용 잔여: {formatPoints(currentCustomer.remainingPoints)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">포인트 금액 (P) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="예: 150000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="1"
              required
            />
            {currentCustomer && Number(amount) > currentCustomer.remainingPoints && (
              <p className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                경고: 입력한 금액이 회원의 잔여 가용 포인트({formatPoints(currentCustomer.remainingPoints)})를 초과합니다.
              </p>
            )}
          </div>

          {/* Merchant */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">사용처 *</label>
            <select
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="남산리더십센터">남산리더십센터</option>
              <option value="스마일즈">스마일즈</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">사용 내역 상세 설명</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 3분기 사내 스터디 도서 구매 및 커피 쿠폰 정산"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
            >
              거래 등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
