import React, { useState, useRef } from 'react';
import { Customer } from '../types';
import {
  Layers,
  Network,
  User,
  UserCheck,
  Wallet,
  FileText,
  UserPlus,
  X,
  BadgeCheck,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { formatPoints } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import {
  downloadCustomerExcelTemplate,
  parseCustomerExcelFile,
  CustomerExcelImportResult,
} from '../utils/excelParser';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
  onSaveBatchCustomers?: (customers: Customer[]) => void;
  initialMode?: 'single' | 'excel';
}

const AVATAR_COLORS = [
  'from-blue-600 to-indigo-600',
  'from-purple-600 to-violet-600',
  'from-emerald-600 to-teal-600',
  'from-amber-600 to-orange-600',
  'from-pink-600 to-rose-600',
  'from-cyan-600 to-blue-600',
  'from-slate-700 to-zinc-900',
];

const BUDGET_PRESETS = [
  { label: '100만P', value: 1000000 },
  { label: '300만P', value: 3000000 },
  { label: '500만P', value: 5000000 },
  { label: '1,000만P', value: 10000000 },
  { label: '2,000만P', value: 20000000 },
];

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  onSaveBatchCustomers,
  initialMode = 'single',
}) => {
  // Mode: 'single' (단건 등록) | 'excel' (엑셀 일괄 등록)
  const [mode, setMode] = useState<'single' | 'excel'>(initialMode);

  // Sync mode when initialMode changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Single form states
  const [company, setCompany] = useState(''); // 조직명
  const [department, setDepartment] = useState(''); // 소속
  const [name, setName] = useState(''); // 성함
  const [position, setPosition] = useState(''); // 직위 (별도 셀)
  const [manager, setManager] = useState(''); // 담당자
  const [budget, setBudget] = useState<number | ''>(5000000); // 금액
  const [notes, setNotes] = useState(''); // 비고 및 관리메모

  // Excel batch states
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [excelResult, setExcelResult] = useState<CustomerExcelImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    onClose();
    // Reset states
    setTimeout(() => {
      setMode('single');
      setExcelResult(null);
      setParseError(null);
    }, 200);
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const { name: cleanName, position: cleanPos } = separateNameAndPosition(name, position);
    if (!company.trim() || !department.trim() || !cleanName.trim() || !budget || Number(budget) <= 0) {
      alert('조직명, 소속, 성함, 배정 금액을 정확히 입력해주세요.');
      return;
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const numBudget = Number(budget);

    const newCustomer: Customer = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      company: company.trim(),
      department: department.trim(),
      name: cleanName.trim(),
      position: cleanPos.trim(),
      manager: manager.trim() || '운영관리팀',
      email: `${cleanName.trim().toLowerCase().replace(/\s+/g, '')}@${company.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'corp'}.com`,
      phone: '010-0000-0000',
      tier: numBudget >= 15000000 ? 'VIP' : numBudget >= 8000000 ? 'Gold' : 'Silver',
      totalBudget: numBudget,
      usedPoints: 0,
      remainingPoints: numBudget,
      status: 'ACTIVE',
      joinedDate: formattedDate,
      lastActivityDate: formattedDate,
      notes: notes.trim(),
      avatarColor: randomColor,
    };

    onSaveCustomer(newCustomer);
    handleCloseModal();

    // Reset Form
    setCompany('');
    setDepartment('');
    setName('');
    setPosition('');
    setManager('');
    setBudget(5000000);
    setNotes('');
  };

  // Process Excel File
  const handleFileProcess = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('엑셀 파일(.xlsx, .xls, .csv)만 업로드할 수 있습니다.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseCustomerExcelFile(file);
      setExcelResult(result);
    } catch (err: any) {
      setParseError(err.message || '엑셀 파일 해석 중 오류가 발생했습니다.');
      setExcelResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Submit Excel Batch Registration
  const handleSubmitBatch = () => {
    if (!excelResult) return;

    const validRows = excelResult.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('등록 가능한 정상 데이터가 없습니다. 엑셀 내용을 확인해주세요.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const batchCustomers: Customer[] = validRows.map((r, idx) => {
      const randomColor = AVATAR_COLORS[(idx + Math.floor(Math.random() * AVATAR_COLORS.length)) % AVATAR_COLORS.length];
      const numBudget = Number(r.budget);

      return {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`,
        company: r.company.trim(),
        department: r.department.trim(),
        name: r.name.trim(),
        position: r.position.trim(),
        manager: r.manager.trim() || '운영관리팀',
        email: `${r.name.trim().toLowerCase().replace(/\s+/g, '')}@${r.company.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'corp'}.com`,
        phone: '010-0000-0000',
        tier: numBudget >= 15000000 ? 'VIP' : numBudget >= 8000000 ? 'Gold' : 'Silver',
        totalBudget: numBudget,
        usedPoints: 0,
        remainingPoints: numBudget,
        status: 'ACTIVE',
        joinedDate: formattedDate,
        lastActivityDate: formattedDate,
        notes: r.notes.trim(),
        avatarColor: randomColor,
      };
    });

    if (onSaveBatchCustomers) {
      onSaveBatchCustomers(batchCustomers);
    } else {
      batchCustomers.forEach(c => onSaveCustomer(c));
    }

    handleCloseModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
        mode === 'excel' ? 'max-w-3xl' : 'max-w-lg'
      }`}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs ${
              mode === 'excel' ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {mode === 'excel' ? <FileSpreadsheet className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {mode === 'excel' ? '회원 엑셀 일괄 등록 및 예산 배정' : '신규 회원 등록'}
                </h2>
                {mode === 'excel' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    대량 일괄 모드
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {mode === 'excel'
                  ? '엑셀 파일(.xlsx)을 업로드하여 다수의 조직 및 회원을 한 번에 등록하고 포인트를 배정합니다.'
                  : '조직 정보, 직위 및 초기 포인트 배정 예산을 등록합니다.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODE 1: SINGLE FORM ================= */}
        {mode === 'single' && (
          <form onSubmit={handleSubmitSingle} className="p-6 space-y-4 text-xs">
            {/* Row 1: 조직명 & 소속 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>조직명 *</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="예: 경영지원본부 / 전략기획본부 / DT사업부"
                  className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-600" />
                  <span>소속 *</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="예: 인사총무팀 / 플랫폼개발팀 / 경영기획실"
                  className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Row 2: 성함 & 직위 (별도 셀) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>성함 *</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="예: 김민수"
                  className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>직위</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="예: 팀장 / 이사 / 본부장"
                  className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Row 3: 담당자 */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>담당자</span>
              </label>
              <input
                type="text"
                value={manager}
                onChange={e => setManager(e.target.value)}
                placeholder="예: 박운영 / B2B운영팀"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Row 4: 금액 (배정 포인트 예산) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-600" />
                  <span>금액 (배정 포인트) *</span>
                </label>
                {typeof budget === 'number' && budget > 0 && (
                  <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {formatPoints(budget)}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 5000000"
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-8"
                  min="1"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                  P
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">빠른 선택:</span>
                {BUDGET_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBudget(preset.value)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      budget === preset.value
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 5: 비고 및 관리메모 */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>비고 및 관리메모</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="예: 2026 하반기 신규 부서 복지 및 출장 포인트 패키지 배정 적용"
                rows={2}
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* 엑셀 일괄 등록 바로가기 배너 */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">엑셀 파일로 대량 일괄 등록</div>
                  <div className="text-[11px] text-slate-500">수십~수백 명의 조직 및 예산을 엑셀로 한 번에 등록합니다.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMode('excel')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer shrink-0 ml-2"
              >
                엑셀로 일괄 등록하기
              </button>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>회원 등록 및 배정 완료</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE 2: EXCEL BATCH UPLOAD ================= */}
        {mode === 'excel' && (
          <div className="p-6 space-y-5 text-xs">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setMode('single')}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>단건 직접 등록으로 돌아가기</span>
              </button>

              <button
                type="button"
                onClick={downloadCustomerExcelTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>양식 엑셀 다운로드 (.xlsx)</span>
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-slate-800 mb-1">
                회원 등록 엑셀 파일을 드래그하거나 클릭하여 선택하세요
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                필수 열: <strong className="text-slate-700">조직명, 소속, 성함, 직위, 담당자, 금액, 비고및관리메모</strong>
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md font-medium text-[11px] shadow-2xs">
                지원 확장자: .xlsx, .xls, .csv
              </span>
            </div>

            {/* Parsing State */}
            {isParsing && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-800 font-semibold flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>엑셀 파일 데이터를 분석 및 검증하는 중입니다...</span>
              </div>
            )}

            {/* Error State */}
            {parseError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium text-xs">{parseError}</span>
              </div>
            )}

            {/* Parsed Results Preview */}
            {excelResult && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between bg-slate-100 p-3 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">
                      {excelResult.fileName} (총 {excelResult.totalRows}건 감지)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      정상 데이터: {excelResult.validRowsCount}건
                    </span>
                    {excelResult.invalidRowsCount > 0 && (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        오류 데이터: {excelResult.invalidRowsCount}건
                      </span>
                    )}
                    <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      총 배정액: {formatPoints(excelResult.totalBudget)}
                    </span>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>조직명</span>
                          </div>
                        </th>
                        <th className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <Network className="w-3 h-3 text-cyan-600" />
                            <span>소속</span>
                          </div>
                        </th>
                        <th className="py-2 px-3">성함</th>
                        <th className="py-2 px-3">직위</th>
                        <th className="py-2 px-3">담당자</th>
                        <th className="py-2 px-3 text-right">배정 금액</th>
                        <th className="py-2 px-3">상태 / 비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {excelResult.rows.map(row => (
                        <tr key={row.index} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          <td className="py-2 px-3 font-mono font-extrabold text-slate-400">{row.index}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{row.company}</td>
                          <td className="py-2 px-3 text-slate-600">{row.department}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{row.name}</td>
                          <td className="py-2 px-3 text-slate-600">{row.position || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{row.manager || '운영관리팀'}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                            {formatPoints(row.budget)}
                          </td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 정상
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {row.validationMessage}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Actions for Excel */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setMode('single')}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitBatch}
                disabled={!excelResult || excelResult.validRowsCount === 0}
                className={`px-5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                  excelResult && excelResult.validRowsCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>
                  {excelResult
                    ? `${excelResult.validRowsCount}명 회원 일괄 등록 및 배정 완료`
                    : '엑셀 데이터 일괄 등록'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

