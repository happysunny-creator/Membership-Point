import React, { useState } from 'react';
import { Category, Customer, Transaction } from '../types';
import { formatPoints, getTransactionTypeBadge } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { getCategoryIcon } from './CategoryFilterBar';
import { EditTransactionModal } from './EditTransactionModal';
import {
  History,
  Store,
  Calendar,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Layers,
  Network,
  User,
  Briefcase,
  Wallet,
} from 'lucide-react';

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  categories: Category[];
  customers?: Customer[];
  onSelectCustomerByName?: (customerName: string) => void;
  onFilterByCategory?: (categoryId: string) => void;
  onEditTransaction?: (updatedTxn: Transaction) => void;
  onDeleteTransaction?: (txnId: string) => void;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  transactions,
  categories,
  customers = [],
  onSelectCustomerByName,
  onFilterByCategory,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<Transaction | null>(null);

  const getCategoryMeta = (catId: string) => {
    return categories.find(c => c.id === catId);
  };

  const totalFilteredAmount = transactions.reduce(
    (sum, t) => sum + (t.type === 'SPEND' ? t.amount : -t.amount),
    0
  );

  const handleConfirmDelete = () => {
    if (deletingTxn && onDeleteTransaction) {
      onDeleteTransaction(deletingTxn.id);
      setDeletingTxn(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden" id="transaction-history-container">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-2xs shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">포인트 사용 및 실적 내역</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                총 {transactions.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              조회된 실적 합계: <span className="font-bold text-rose-600 font-mono">{formatPoints(Math.abs(totalFilteredAmount))}</span> (조직명, 소속 부서, 성함, 직책, 사용일시, 사용처, 사용금액)
            </p>
          </div>
        </div>
      </div>

      {/* Table Content: 조직명, 소속, 성함, 직책, 사용날짜, 사용처, 사용금액, 수정/휴지통 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold select-none text-[12px]">
              <th className="py-3 px-4 sm:px-6 text-left">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>조직명</span>
                </div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-600" />
                  <span>소속 부서</span>
                </div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>성함</span>
                </div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>직책</span>
                </div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>사용일시</span>
                </div>
              </th>
              <th className="py-3 px-4 text-left">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>사용처 (가맹점)</span>
                </div>
              </th>
              <th className="py-3 px-4 sm:px-6 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-rose-500" />
                  <span>사용금액</span>
                </div>
              </th>
              <th className="py-3 px-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <History className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium">조회된 포인트 실적 내역이 없습니다.</p>
                    <p className="text-xs text-slate-400">카테고리 또는 기간 필터를 변경해보세요.</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map(txn => {
                const matchedCust = customers.find(
                  c => c.id === txn.customerId || c.name === txn.customerName
                );

                const company = txn.customerCompany || matchedCust?.company || '-';
                const department = txn.customerDepartment || matchedCust?.department || '본사';

                // Extract name & position cleanly
                const { name, position } = separateNameAndPosition(
                  txn.customerName || matchedCust?.name || '-',
                  txn.customerPosition || matchedCust?.position || ''
                );

                const usageDate = txn.timestamp || '-';
                const merchant = txn.merchant || '-';

                return (
                  <tr key={txn.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* 1. 조직명 */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-900">{company}</span>
                      </div>
                    </td>

                    {/* 2. 소속 */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="text-slate-600 font-medium">{department}</span>
                      </div>
                    </td>

                    {/* 3. 성함 */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectCustomerByName && onSelectCustomerByName(name)}
                        className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors text-left"
                      >
                        {name}
                      </button>
                    </td>

                    {/* 4. 직책 */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {position ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{position}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 5. 사용날짜 */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{usageDate}</span>
                      </div>
                    </td>

                    {/* 6. 사용처 */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Store className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[220px]" title={merchant}>{merchant}</span>
                      </div>
                    </td>

                    {/* 7. 사용금액 */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="font-bold text-sm text-rose-600 font-mono">
                        {formatPoints(txn.amount)}
                      </div>
                    </td>

                    {/* 8. 관리: 수정 & 휴지통 */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingTxn(txn)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="실적 내역 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxn(txn)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="실적 내역 삭제"
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

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <EditTransactionModal
          isOpen={!!editingTxn}
          onClose={() => setEditingTxn(null)}
          transaction={editingTxn}
          customers={customers}
          onSave={updatedTxn => {
            if (onEditTransaction) {
              onEditTransaction(updatedTxn);
            }
            setEditingTxn(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTxn && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">실적 내역 삭제</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  선택하신 실적 내역을 삭제하시겠습니까?<br />
                  삭제 시 해당 회원의 포인트 사용실적 및 잔여 포인트가 자동으로 재계산됩니다.
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">회원명 / 조직</span>
                  <span className="font-bold text-slate-800">
                    {deletingTxn.customerName} ({deletingTxn.customerCompany})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">사용처 (가맹점)</span>
                  <span className="font-semibold text-slate-800">{deletingTxn.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">사용날짜</span>
                  <span className="font-mono text-slate-700">{deletingTxn.timestamp}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">삭제 대상 금액</span>
                  <span className="font-extrabold text-rose-600">{formatPoints(deletingTxn.amount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeletingTxn(null)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
