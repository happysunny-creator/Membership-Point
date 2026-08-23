import React, { useState, useRef } from 'react';
import { Customer, Transaction } from '../types';
import {
  ExcelImportResult,
  parseExcelFile,
  downloadExcelTemplate,
} from '../utils/excelParser';
import { formatPoints } from '../utils/formatters';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Layers,
  Network,
  User,
  Briefcase,
  RefreshCw,
} from 'lucide-react';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: Customer[];
  onImportComplete: (
    importedTransactions: Transaction[],
    newCustomers: Customer[],
    importMode: 'APPEND' | 'REPLACE'
  ) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  existingCustomers,
  onImportComplete,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ExcelImportResult | null>(null);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [defaultNewCustomerBudget, setDefaultNewCustomerBudget] = useState<number>(5000000);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt || '')) {
      alert('.xlsx, .xls 또는 .csv 확장자 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setIsParsing(true);
      const result = await parseExcelFile(file, existingCustomers);
      setParseResult(result);
    } catch (err: any) {
      alert(`엑셀 파일 파싱 중 오류가 발생했습니다: ${err.message || '파일 구조를 확인해주세요.'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validRowsCount === 0) return;

    const validRows = parseResult.rows.filter(r => r.isValid);
    const newCustomersMap: Map<string, Customer> = new Map();
    const transactionsToImport: Transaction[] = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    validRows.forEach((row, index) => {
      let customerId = row.existingCustomerId;
      let customerCompany = row.company;

      // Check if existing customer matches
      const existing = existingCustomers.find(
        c => c.name.toLowerCase().trim() === row.customerName.toLowerCase().trim()
      );

      if (existing) {
        customerId = existing.id;
        customerCompany = existing.company;
      } else {
        // Prepare new customer if not already staged
        const stagedCustomerKey = row.customerName.toLowerCase().trim();
        if (!newCustomersMap.has(stagedCustomerKey)) {
          const generatedId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
          const newCust: Customer = {
            id: generatedId,
            name: row.customerName,
            email: `${row.customerName.toLowerCase().replace(/\s+/g, '')}@company.kr`,
            phone: '010-0000-0000',
            company: row.company || '신규 등록 기업',
            department: '일반부서',
            tier: 'Gold',
            totalBudget: defaultNewCustomerBudget,
            usedPoints: 0,
            remainingPoints: defaultNewCustomerBudget,
            status: 'ACTIVE',
            joinedDate: todayStr,
            lastActivityDate: row.timestamp.slice(0, 10) || todayStr,
            notes: '엑셀 사용실적 일괄 업로드를 통해 자동 등록된 회원',
            avatarColor: 'from-blue-600 to-indigo-600',
          };
          newCustomersMap.set(stagedCustomerKey, newCust);
          customerId = generatedId;
        } else {
          customerId = newCustomersMap.get(stagedCustomerKey)!.id;
        }
      }

      transactionsToImport.push({
        id: `TXN-IMP-${Date.now()}-${index}`,
        customerId: customerId || `CUST-${Date.now()}`,
        customerName: row.customerName,
        customerCompany: customerCompany || '기업',
        type: row.type,
        amount: row.amount,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        description: row.description,
        merchant: row.merchant,
        orderNumber: row.orderNumber,
        timestamp: row.timestamp,
        status: 'COMPLETED',
        paymentMethod: '엑셀 데이터 업로드',
      });
    });

    onImportComplete(transactionsToImport, Array.from(newCustomersMap.values()), importMode);
    onClose();
  };

  // Find newly detected customers count in parse result
  const newCustomersInResult = parseResult
    ? Array.from(
        new Set(
          parseResult.rows
            .filter(r => r.isValid && !r.existingCustomerId)
            .map(r => r.customerName)
        )
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                엑셀 파일 업로드 (포인트 사용실적 일괄 등록)
              </h2>
              <p className="text-xs text-slate-500">
                엑셀(.xlsx, .xls) 또는 CSV 파일을 드래그하여 포인트 거래 실적을 일괄 가져옵니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadExcelTemplate}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
              title="업로드용 엑셀 표준 템플릿 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>표준 양식 다운로드</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!parseResult ? (
            /* Upload & Drag Drop Screen */
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    {isParsing ? (
                      <RefreshCw className="w-7 h-7 animate-spin" />
                    ) : (
                      <UploadCloud className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {isParsing
                        ? '엑셀 데이터를 분석 및 변환하는 중입니다...'
                        : '엑셀 파일을 여기에 끌어다 놓거나 클릭하여 선택하세요'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      지원 형식: Microsoft Excel (.xlsx, .xls), CSV 파일 (최대 10MB)
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs inline-block transition-colors">
                      컴퓨터에서 파일 찾기
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Mapping Guide Cards */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    엑셀 컬럼 자동 인식 안내
                  </span>
                  <button
                    onClick={downloadExcelTemplate}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    샘플 엑셀 파일 받기
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  표준 컬럼 순서 (<strong>조직명, 소속, 성함, 직위, 사용날짜, 사용처, 사용금액</strong>):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block">조직명 / 소속</strong>
                    <span className="text-slate-400">조직명, 소속(부서), 회사, 회원사</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block">성함 / 직위 (필수)</strong>
                    <span className="text-slate-400">성함, 이름, 회원명, 직위</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block">사용날짜 / 사용처</strong>
                    <span className="text-slate-400">사용날짜, 거래일시, 사용처, 영업장</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block">사용금액 (필수)</strong>
                    <span className="text-slate-400">사용금액, 포인트(P) - 합계, 합계포인트, 합계, 포인트, 금액</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Parsing Preview Screen */
            <div className="space-y-5">
              {/* Summary Stats of Parsed File */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">파일명</span>
                  <div className="font-bold text-slate-900 text-xs truncate mt-0.5" title={parseResult.fileName}>
                    {parseResult.fileName}
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block font-medium">유효한 거래 내역</span>
                  <div className="font-extrabold text-emerald-800 text-lg mt-0.5">
                    {parseResult.validRowsCount}건
                    <span className="text-xs text-emerald-600 font-normal ml-1">/ 총 {parseResult.totalRows}건</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-700 block font-medium">총 포인트 사용/변동액</span>
                  <div className="font-extrabold text-blue-800 text-lg mt-0.5">
                    {formatPoints(parseResult.totalPoints)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-700 block font-medium">신규 등록 예정 회원</span>
                  <div className="font-extrabold text-purple-800 text-lg mt-0.5">
                    {newCustomersInResult.length}명
                  </div>
                </div>
              </div>

              {/* Import Options */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block">반영 방식 선택</label>
                    <p className="text-slate-500 text-[11px]">기존 데이터에 누적 추가하거나 새로 교체할 수 있습니다.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('APPEND')}
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                        importMode === 'APPEND'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      기존 데이터에 추가 (추천)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('REPLACE')}
                      className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                        importMode === 'REPLACE'
                          ? 'bg-rose-50 border-rose-500 text-rose-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      기존 거래내역 전체 교체
                    </button>
                  </div>
                </div>

                {newCustomersInResult.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-purple-50/50 p-2.5 rounded-lg">
                    <span className="text-purple-900 text-[11px]">
                      신규 회원 ({newCustomersInResult.join(', ')}) 최초 기본 배정 예산:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={defaultNewCustomerBudget}
                        onChange={e => setDefaultNewCustomerBudget(Number(e.target.value))}
                        className="w-32 px-2 py-1 bg-white border border-purple-200 rounded text-slate-900 font-bold text-xs"
                      />
                      <span className="text-purple-700 font-semibold text-[11px]">P</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Parsed Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    파싱된 데이터 미리보기 (총 {parseResult.rows.length}행)
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> 다른 파일 선택
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>조직명</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <Network className="w-3 h-3 text-cyan-600" />
                            <span>소속</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>성함</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>직위</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3">사용날짜</th>
                        <th className="py-2.5 px-3">사용처</th>
                        <th className="py-2.5 px-3 text-right">사용금액</th>
                        <th className="py-2.5 px-3 text-center">검증</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {parseResult.rows.map(row => {
                        return (
                          <tr
                            key={row.index}
                            className={`hover:bg-slate-50/70 ${!row.isValid ? 'bg-rose-50/40' : ''}`}
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-mono font-extrabold text-[11px]">
                              {row.index}
                            </td>
                            {/* 조직명 */}
                            <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-900">
                              {row.company || '-'}
                            </td>
                            {/* 소속 */}
                            <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                              {row.department || '-'}
                            </td>
                            {/* 성함 */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span>{row.customerName}</span>
                                {row.existingCustomerId ? (
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 font-medium">
                                    기존
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 font-medium">
                                    신규
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* 직위 */}
                            <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                              {row.position || '직원'}
                            </td>
                            {/* 사용날짜 */}
                            <td className="py-2 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                              {row.timestamp}
                            </td>
                            {/* 사용처 */}
                            <td className="py-2 px-3 max-w-[150px] truncate text-slate-800" title={row.merchant}>
                              {row.merchant || '-'}
                            </td>
                            {/* 사용금액 */}
                            <td className="py-2 px-3 text-right font-extrabold text-blue-600 whitespace-nowrap">
                              {formatPoints(row.amount)}
                            </td>
                            {/* 검증 */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  정상
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200 font-medium"
                                  title={row.validationMessage}
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                                  오류
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500">
            {parseResult && (
              <span>
                총 <strong>{parseResult.validRowsCount}건</strong>의 거래를 대시보드에 즉시 반영합니다.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              닫기
            </button>
            {parseResult && (
              <button
                onClick={handleConfirmImport}
                disabled={parseResult.validRowsCount === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{parseResult.validRowsCount}건 데이터 대시보드에 반영</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
