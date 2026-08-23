import React, { useState, useEffect } from 'react';
import { Customer, Transaction, TransactionStatus } from '../types';
import { separateNameAndPosition } from '../utils/nameParser';
import { X, Edit3, Save, Calendar, Store, User, DollarSign, Layers, Network, Briefcase } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customers: Customer[];
  onSave: (updatedTxn: Transaction) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  customers,
  onSave,
}) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [customerDepartment, setCustomerDepartment] = useState<string>('');
  const [customerPosition, setCustomerPosition] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<TransactionStatus>('COMPLETED');

  useEffect(() => {
    if (transaction) {
      // Find matched customer to accurately fill any missing department or metadata
      const matchedCust = customers.find(
        c => c.id === transaction.customerId || c.name === transaction.customerName
      );

      const rawName = transaction.customerName || matchedCust?.name || '';
      const rawPosition = transaction.customerPosition || matchedCust?.position || '';
      const { name, position } = separateNameAndPosition(rawName, rawPosition);

      setCustomerId(transaction.customerId || matchedCust?.id || '');
      setCustomerName(name);
      setCustomerCompany(transaction.customerCompany || matchedCust?.company || '');
      setCustomerDepartment(transaction.customerDepartment || matchedCust?.department || '본사');
      setCustomerPosition(position || '직원');
      setTimestamp(transaction.timestamp || '');
      setMerchant(transaction.merchant || '');
      setDescription(transaction.description || '');
      setAmount(transaction.amount !== undefined ? transaction.amount : '');
      setStatus(transaction.status || 'COMPLETED');
    }
  }, [transaction, customers]);

  if (!isOpen || !transaction) return null;

  // Handle selecting a different customer from dropdown
  const handleCustomerSelect = (newCustId: string) => {
    setCustomerId(newCustId);
    const matched = customers.find(c => c.id === newCustId);
    if (matched) {
      const { name, position } = separateNameAndPosition(matched.name, matched.position);
      setCustomerName(name);
      setCustomerCompany(matched.company);
      setCustomerDepartment(matched.department || '본사');
      setCustomerPosition(position || '직원');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || Number(amount) < 0) {
      alert('유효한 사용금액을 입력해주세요.');
      return;
    }

    const updated: Transaction = {
      ...transaction,
      customerId,
      customerName: customerName.trim(),
      customerCompany: customerCompany.trim(),
      customerDepartment: customerDepartment.trim() || '본사',
      customerPosition: customerPosition.trim() || '직원',
      timestamp: timestamp.trim(),
      merchant: merchant.trim(),
      description: description.trim(),
      amount: Number(amount),
      status,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">실적 내역 직접 수정</h2>
              <p className="text-xs text-slate-500">실적 ID: {transaction.id}</p>
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
          {/* Customer Mapping Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                회원 및 소속 정보
              </label>
              {customers.length > 0 && (
                <select
                  value={customerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 text-[11px]"
                >
                  <option value="">회원 선택으로 자동입력</option>
                  {customers.map(c => {
                    const { name: cleanName, position: cleanPos } = separateNameAndPosition(c.name, c.position);
                    return (
                      <option key={c.id} value={c.id}>
                        {cleanName} {cleanPos ? `[${cleanPos}]` : ''} ({c.company} · {c.department})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 조직명 */}
              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  조직명 *
                </label>
                <input
                  type="text"
                  value={customerCompany}
                  onChange={e => setCustomerCompany(e.target.value)}
                  placeholder="예: 현대자동차"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  required
                />
              </div>

              {/* 소속(부서) */}
              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1 flex items-center gap-1">
                  <Network className="w-3 h-3 text-cyan-600" />
                  소속(부서) *
                </label>
                <input
                  type="text"
                  value={customerDepartment}
                  onChange={e => setCustomerDepartment(e.target.value)}
                  placeholder="예: 경영기획부, IT개발팀"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              {/* 성함 */}
              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  성함 *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="예: 김민수"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  required
                />
              </div>

              {/* 직위 */}
              <div>
                <label className="text-[11px] text-slate-600 font-bold block mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  직위
                </label>
                <input
                  type="text"
                  value={customerPosition}
                  onChange={e => setCustomerPosition(e.target.value)}
                  placeholder="예: 부장, 팀장"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Usage Date & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                사용날짜 (일시) *
              </label>
              <input
                type="text"
                value={timestamp}
                onChange={e => setTimestamp(e.target.value)}
                placeholder="2026-08-18 14:30"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                사용처 (가맹점명) *
              </label>
              <input
                type="text"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                placeholder="신세계백화점, 롯데호텔 등"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Amount & Status (Category Removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                사용금액 (포인트 P) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="예: 250000"
                min="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-rose-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">상태</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                <option value="COMPLETED">완료 (정상)</option>
                <option value="PENDING">대기중</option>
                <option value="CANCELLED">취소됨</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">내용 / 항목 비고</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 법인 임직원 선물 구매"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
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
