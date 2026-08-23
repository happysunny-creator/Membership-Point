import React, { useState, useRef } from 'react';
import { OrgCategory } from '../types';
import {
  downloadOrgCategoryExcelTemplate,
  parseOrgCategoryExcelFile,
  OrgCategoryExcelImportResult,
} from '../utils/excelParser';
import { formatPoints } from '../utils/formatters';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Network,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ExcelOrgCategoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newCategories: OrgCategory[], mode: 'append' | 'replace') => void;
}

export const ExcelOrgCategoryUploadModal: React.FC<ExcelOrgCategoryUploadModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<OrgCategoryExcelImportResult | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await parseOrgCategoryExcelFile(selectedFile);
      setImportResult(result);
      if (result.validRowsCount === 0) {
        setErrorMessage('유효한 카테고리 데이터가 없습니다. 양식 형식을 확인해주세요.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '엑셀 파싱 중 오류가 발생했습니다.');
      setImportResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (!importResult || importResult.validRowsCount === 0) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const categoriesToAdd: OrgCategory[] = importResult.rows
      .filter(r => r.isValid)
      .map((r, idx) => ({
        id: `ORGCAT-EXCEL-${Date.now()}-${idx + 1}`,
        company: r.company,
        department: r.department || '전체 부서',
        categoryName: r.categoryName,
        categoryCode: r.categoryCode || `CAT-${idx + 1}`,
        allocatedBudget: r.allocatedBudget > 0 ? r.allocatedBudget : undefined,
        description: r.description,
        isActive: r.isActive,
        updatedAt: formattedDate,
      }));

    onImportComplete(categoriesToAdd, importMode);
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">조직별 카테고리 엑셀 일괄 업로드</h2>
              <p className="text-xs text-slate-500">엑셀 시트(.xlsx, .csv)를 업로드하여 카테고리를 한번에 등록합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Template Download Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 font-bold block">조직별 카테고리 표준 엑셀 서식</strong>
                <span className="text-slate-500 text-[11px]">
                  열 구조: 조직명, 소속(부서), 카테고리명, 카테고리코드, 배정예산, 비고, 사용여부
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadOrgCategoryExcelTemplate}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>양식 다운로드</span>
            </button>
          </div>

          {/* Step 2: Upload Area or Results */}
          {!importResult ? (
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {isLoading ? '엑셀 파일을 분석하는 중입니다...' : '엑셀 파일을 여기에 끌어다 놓거나 클릭하세요'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">.xlsx, .xls, .csv 형식 지원</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">전체 행</span>
                  <strong className="text-base font-bold text-slate-900">{importResult.totalRows}건</strong>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[11px] text-emerald-700 block">등록 가능</span>
                  <strong className="text-base font-bold text-emerald-700">{importResult.validRowsCount}건</strong>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
                  <span className="text-[11px] text-rose-700 block">오류/누락</span>
                  <strong className="text-base font-bold text-rose-700">{importResult.invalidRowsCount}건</strong>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-800">등록 방식 선택:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>기존 목록에 추가</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>기존 목록 전체 대체</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">No</th>
                      <th className="p-2">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-600" />
                          <span>조직명</span>
                        </div>
                      </th>
                      <th className="p-2">
                        <div className="flex items-center gap-1">
                          <Network className="w-3 h-3 text-cyan-600" />
                          <span>소속</span>
                        </div>
                      </th>
                      <th className="p-2">카테고리명</th>
                      <th className="p-2">코드</th>
                      <th className="p-2">배정예산</th>
                      <th className="p-2 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importResult.rows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-800">{row.company}</td>
                        <td className="p-2 text-slate-600">{row.department}</td>
                        <td className="p-2 font-semibold text-slate-900">{row.categoryName}</td>
                        <td className="p-2 font-mono text-slate-500">{row.categoryCode}</td>
                        <td className="p-2 font-mono text-slate-700">
                          {row.allocatedBudget ? `${formatPoints(row.allocatedBudget)}` : '-'}
                        </td>
                        <td className="p-2 text-center">
                          {row.isValid ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              정상
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold" title={row.validationMessage}>
                              {row.validationMessage}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다른 파일 선택하기</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            닫기
          </button>
          {importResult && importResult.validRowsCount > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{importResult.validRowsCount}건 카테고리 일괄 등록</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
