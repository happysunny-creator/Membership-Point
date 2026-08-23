import React, { useState, useEffect } from 'react';
import { Category, CategoryId, Customer, Transaction, TransactionType } from '../types';
import { formatPoints } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { getCategoryIcon } from './CategoryFilterBar';
import { X, PlusCircle, AlertCircle, Layers, Network, User } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  categories: Category[];
  targetCustomer?: Customer | null;
  onSaveTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  categories,
  targetCustomer,
  onSaveTransaction,
}) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [type, setType] = useState<TransactionType>('SPEND');
  const [categoryId, setCategoryId] = useState<CategoryId>('shopping');
  const [amount, setAmount] = useState<number | ''>('');
  const [merchant, setMerchant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('포인트 즉시 결제');

  useEffect(() => {
    if (targetCustomer) {
      setCustomerId(targetCustomer.id);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [targetCustomer, customers]);

  if (!isOpen) return null;

  const currentCustomer = customers.find(c => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount || Number(amount) <= 0) {
      alert('회원과 유효한 포인트 금액을 입력해주세요.');
      return;
    }

    const selectedCat = categories.find(c => c.id === categoryId);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveTransaction({
      customerId,
      customerName: currentCustomer?.name || '회원',
      customerCompany: currentCustomer?.company || '기업',
      type,
      amount: Number(amount),
      categoryId,
      categoryName: selectedCat?.name || '기타',
      description: description || `${selectedCat?.shortName || '포인트'} 결제`,
      merchant: merchant || '온라인 가맹점',
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      timestamp: formattedDate,
      status: 'COMPLETED',
      paymentMethod,
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
          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">대상 회원 선택 *</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              {customers.map(c => {
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
                  <span className="font-medium text-slate-500">배정: {formatPoints(currentCustomer.totalBudget)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">현재 사용 실적: {formatPoints(currentCustomer.usedPoints)}</span>
                  <span className="font-bold text-emerald-600">가용 잔여: {formatPoints(currentCustomer.remainingPoints)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">거래 구분 *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('SPEND')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  type === 'SPEND'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                포인트 사용 (차감)
              </button>
              <button
                type="button"
                onClick={() => setType('RECHARGE')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  type === 'RECHARGE'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                포인트 충전 (적립)
              </button>
              <button
                type="button"
                onClick={() => setType('REFUND')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  type === 'REFUND'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                사용 취소 (환불)
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">카테고리 *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                    categoryId === cat.id
                      ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span style={{ color: cat.color }}>
                    {getCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                  </span>
                  <span className="truncate">{cat.shortName}</span>
                </button>
              ))}
            </div>
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
            {type === 'SPEND' && currentCustomer && Number(amount) > currentCustomer.remainingPoints && (
              <p className="text-rose-600 text-[11px] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                경고: 입력한 금액이 회원의 잔여 가용 포인트({formatPoints(currentCustomer.remainingPoints)})를 초과합니다.
              </p>
            )}
          </div>

          {/* Merchant & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">사용처 / 가맹점명</label>
              <input
                type="text"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                placeholder="예: 스타벅스, 신라호텔, 쿠팡"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">결제 수단 / 유형</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-blue-500"
              >
                <option value="포인트 즉시 결제">포인트 즉시 결제</option>
                <option value="바코드 / 모바일 결제">바코드 / 모바일 결제</option>
                <option value="법인 승인 정산">법인 승인 정산</option>
                <option value="바우처 / 수강권 발급">바우처 / 수강권 발급</option>
              </select>
            </div>
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
