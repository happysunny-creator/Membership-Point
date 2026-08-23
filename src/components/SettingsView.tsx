import React, { useState, useMemo, useEffect } from 'react';
import { Category, Customer, OrgCategory, SystemSettings } from '../types';
import { formatPoints, formatNumber } from '../utils/formatters';
import { downloadExcelTemplate } from '../utils/excelParser';
import { OrgCategoryManagement } from './OrgCategoryManagement';
import {
  Settings,
  Sliders,
  FileSpreadsheet,
  Download,
  UploadCloud,
  RotateCcw,
  Network,
  CheckCircle2,
  Save,
  Layers,
  Gauge,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  categories: Category[];
  orgCategories: OrgCategory[];
  onAddOrgCategory: (category: Omit<OrgCategory, 'id' | 'updatedAt'>) => void;
  onUpdateOrgCategory: (updatedCategory: OrgCategory) => void;
  onDeleteOrgCategory: (categoryId: string) => void;
  onImportOrgCategories: (newCategories: OrgCategory[], mode: 'append' | 'replace') => void;
  customers: Customer[];
  onAddCustomer: (newCustomer: Customer) => void;
  onBatchAddCustomers: (newCustomers: Customer[]) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onOpenExcelUpload: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  totalCustomers: number;
  totalTransactions: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  categories,
  orgCategories,
  onAddOrgCategory,
  onUpdateOrgCategory,
  onDeleteOrgCategory,
  onImportOrgCategories,
  customers,
  onAddCustomer,
  onBatchAddCustomers,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenExcelUpload,
  onResetData,
  onExportCSV,
  totalCustomers,
  totalTransactions,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'usage-rates' | 'org-categories' | 'system'>('usage-rates');
  const [formState, setFormState] = useState<SystemSettings>({
    ...settings,
    stage1MaxPercent: settings.stage1MaxPercent ?? 30,
    stage2MaxPercent: settings.stage2MaxPercent ?? 50,
    stage3MaxPercent: settings.stage3MaxPercent ?? 70,
    warningThresholdPercent: settings.warningThresholdPercent ?? 60,
    perfectThresholdPercent: settings.perfectThresholdPercent ?? 90,
  });
  const [simulatedRate, setSimulatedRate] = useState<number>(75);
  const [isSaved, setIsSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Organization display priority order (조직 표시 우선순위)
  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (c.company && c.company.trim()) set.add(c.company.trim());
    });
    return Array.from(set);
  }, [customers]);

  const [orgOrderDraft, setOrgOrderDraft] = useState<string[]>(() => {
    const saved = (settings.orgPriorityOrder || []).filter(name => uniqueCompanies.includes(name));
    const remaining = uniqueCompanies.filter(name => !saved.includes(name));
    return [...saved, ...remaining];
  });
  const [isOrgOrderSaved, setIsOrgOrderSaved] = useState(false);

  // Keep newly-added / removed organizations in sync without discarding the user's manual ordering
  useEffect(() => {
    setOrgOrderDraft(prev => {
      const stillValid = prev.filter(name => uniqueCompanies.includes(name));
      const newOnes = uniqueCompanies.filter(name => !stillValid.includes(name));
      return [...stillValid, ...newOnes];
    });
  }, [uniqueCompanies]);

  const moveOrgOrder = (index: number, direction: -1 | 1) => {
    setOrgOrderDraft(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSaveOrgOrder = () => {
    onUpdateSettings({ ...settings, orgPriorityOrder: orgOrderDraft });
    setIsOrgOrderSaved(true);
    setTimeout(() => setIsOrgOrderSaved(false), 3000);
  };

  const handleResetOrgOrder = () => {
    const alphabetical = [...uniqueCompanies].sort((a, b) => a.localeCompare(b, 'ko'));
    setOrgOrderDraft(alphabetical);
    onUpdateSettings({ ...settings, orgPriorityOrder: [] });
    setIsOrgOrderSaved(true);
    setTimeout(() => setIsOrgOrderSaved(false), 3000);
  };

  const stage1Max = formState.stage1MaxPercent ?? 30;
  const stage2Max = formState.stage2MaxPercent ?? 50;
  const stage3Max = formState.stage3MaxPercent ?? 70;

  const handleStageThresholdChange = (key: 'stage1MaxPercent' | 'stage2MaxPercent' | 'stage3MaxPercent', value: number) => {
    setValidationError(null);
    setFormState(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validation: 0 < stage1Max < stage2Max < stage3Max <= 100
    if (stage1Max <= 0 || stage1Max >= stage2Max) {
      setValidationError(`1단계 상한치(${stage1Max}%)는 0%보다 크고 2단계 상한치(${stage2Max}%)보다 작아야 합니다.`);
      return;
    }
    if (stage2Max <= stage1Max || stage2Max >= stage3Max) {
      setValidationError(`2단계 상한치(${stage2Max}%)는 1단계 상한치(${stage1Max}%)보다 크고 3단계 상한치(${stage3Max}%)보다 작아야 합니다.`);
      return;
    }
    if (stage3Max <= stage2Max || stage3Max > 100) {
      setValidationError(`3단계 상한치(${stage3Max}%)는 2단계 상한치(${stage2Max}%)보다 크고 100% 이하이어야 합니다.`);
      return;
    }

    setValidationError(null);
    onUpdateSettings(formState);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetToDefaultStages = () => {
    const updated: SystemSettings = {
      ...formState,
      stage1MaxPercent: 30,
      stage2MaxPercent: 50,
      stage3MaxPercent: 70,
    };
    setFormState(updated);
    setValidationError(null);
    onUpdateSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Helper for simulation based on current edited formState
  const getSimulatedStage = (rate: number) => {
    if (rate >= stage3Max) {
      return {
        name: `4단계: ${stage3Max}% ~ 100%`,
        color: 'text-purple-700 bg-purple-50 border-purple-300',
        badge: 'bg-purple-600 text-white',
        desc: '목표 예산 최적/고활용 달성 (보라색)',
      };
    }
    if (rate >= stage2Max) {
      return {
        name: `3단계: ${stage2Max}% ~ ${stage3Max}%`,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        desc: '안정적이고 균형 있는 표준 소진 진행 (초록색)',
      };
    }
    if (rate >= stage1Max) {
      return {
        name: `2단계: ${stage1Max}% ~ ${stage2Max}%`,
        color: 'text-amber-700 bg-amber-50 border-amber-300',
        badge: 'bg-amber-500 text-white',
        desc: '예산 소진 진행 및 주의 관리 (주황색)',
      };
    }
    return {
      name: `1단계: 0% ~ ${stage1Max}%`,
      color: 'text-rose-700 bg-rose-50 border-rose-300',
      badge: 'bg-rose-500 text-white',
      desc: '예산 소진 초기 / 집중 독려 필요 (빨간색)',
    };
  };

  const simResult = getSimulatedStage(simulatedRate);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Sub-tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">환경 설정 및 운영 관리</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              포인트 관리기준 (4단계: 0~30% 빨강, 30~50% 주황, 50~70% 초록, 70% 이상 보라), 조직별 카테고리 관리, 데이터 백업 및 시스템 운영 정책을 설정합니다.
            </p>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('usage-rates')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'usage-rates'
                ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="w-4 h-4 text-indigo-600" />
            <span>포인트 관리기준</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full font-bold">
              4단계
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('org-categories')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'org-categories'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>조직별 카테고리 관리</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-mono">
              {orgCategories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('system')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'system'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>운영 정책 & 데이터</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 포인트 관리기준 (4단계: 직접 수정 및 커스텀 설정) */}
      {activeSubTab === 'usage-rates' && (
        <div className="space-y-6">
          {/* Main Setting Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Gauge className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>포인트 관리기준 (4단계 기준 직접 설정)</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      직접 수정 가능
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    필요에 따라 각 단계별 사용률(소진율 %) 기준치를 직접 수정하고 저장할 수 있으며, 모든 대시보드와 회원 목록에 즉시 반영됩니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {isSaved && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    기준값 저장 완료
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetToDefaultStages}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="기본값 (30% / 50% / 70%)으로 복원"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>기본값 복원</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>설정 저장</span>
                </button>
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Threshold Quick Setting Inputs */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>4단계 경계 기준치(소진율 %) 직접 설정</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1단계 상한, 2단계 상한, 3단계 상한 값을 입력하거나 슬라이더로 간편하게 조절하세요.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 font-medium mr-1">추천 프리셋:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormState(prev => ({ ...prev, stage1MaxPercent: 30, stage2MaxPercent: 50, stage3MaxPercent: 70 }));
                      setValidationError(null);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    표준형 (30/50/70)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormState(prev => ({ ...prev, stage1MaxPercent: 25, stage2MaxPercent: 50, stage3MaxPercent: 75 }));
                      setValidationError(null);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    사분위수 (25/50/75)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormState(prev => ({ ...prev, stage1MaxPercent: 20, stage2MaxPercent: 40, stage3MaxPercent: 60 }));
                      setValidationError(null);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    보수적 (20/40/60)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormState(prev => ({ ...prev, stage1MaxPercent: 40, stage2MaxPercent: 60, stage3MaxPercent: 80 }));
                      setValidationError(null);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    고소진형 (40/60/80)
                  </button>
                </div>
              </div>

              {/* Input Boxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Stage 1 Limit */}
                <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      1단계(빨강) 상한치
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">0% ~ {stage1Max}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max={stage2Max - 1}
                      value={stage1Max}
                      onChange={e => handleStageThresholdChange('stage1MaxPercent', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-sm font-bold text-rose-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400 bg-rose-50/30"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    0%부터 <strong className="text-rose-700">{stage1Max}%</strong>까지 1단계로 분류
                  </p>
                </div>

                {/* Stage 2 Limit */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      2단계(주황) 상한치
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{stage1Max}% ~ {stage2Max}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={stage1Max + 1}
                      max={stage3Max - 1}
                      value={stage2Max}
                      onChange={e => handleStageThresholdChange('stage2MaxPercent', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm font-bold text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-amber-50/30"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {stage1Max}%부터 <strong className="text-amber-700">{stage2Max}%</strong>까지 2단계로 분류
                  </p>
                </div>

                {/* Stage 3 Limit */}
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      3단계(초록) 상한치
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{stage2Max}% ~ {stage3Max}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={stage2Max + 1}
                      max="99"
                      value={stage3Max}
                      onChange={e => handleStageThresholdChange('stage3MaxPercent', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 bg-emerald-50/30"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {stage2Max}%부터 <strong className="text-emerald-700">{stage3Max}%</strong>까지 3단계, 이후는 4단계(보라색)
                  </p>
                </div>
              </div>
            </div>

            {/* 1. 0% ~ 100% 4단계 통합 비주얼 스펙트럼 게이지 바 (동적 폭 반영) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  실시간 0% ~ 100% 4단계 색상 스펙트럼 게이지 바
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  1단계(0~{stage1Max}% 빨강) · 2단계({stage1Max}~{stage2Max}% 주황) · 3단계({stage2Max}~{stage3Max}% 초록) · 4단계({stage3Max}%~ 보라)
                </span>
              </div>

              {/* 4-segmented Spectrum Bar with Dynamic Widths */}
              <div className="relative h-11 w-full bg-slate-200 rounded-xl overflow-hidden flex shadow-inner border border-slate-300">
                {/* 1. 1단계: 0% ~ stage1Max% 빨간색 */}
                <div
                  style={{ width: `${Math.max(stage1Max, 5)}%` }}
                  className="h-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs transition-all relative overflow-hidden"
                  title={`1단계 (0% ~ ${stage1Max}%): 빨간색`}
                >
                  <span className="truncate px-1 flex items-center gap-1">
                    <span>1단계 (빨강)</span>
                    <span className="text-[10px] opacity-90">0%~{stage1Max}%</span>
                  </span>
                </div>

                {/* 2. 2단계: stage1Max% ~ stage2Max% 주황색 */}
                <div
                  style={{ width: `${Math.max(stage2Max - stage1Max, 5)}%` }}
                  className="h-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs transition-all relative overflow-hidden"
                  title={`2단계 (${stage1Max}% ~ ${stage2Max}%): 주황색`}
                >
                  <span className="truncate px-1 flex items-center gap-1">
                    <span>2단계 (주황)</span>
                    <span className="text-[10px] opacity-90">{stage1Max}%~{stage2Max}%</span>
                  </span>
                </div>

                {/* 3. 3단계: stage2Max% ~ stage3Max% 초록색 */}
                <div
                  style={{ width: `${Math.max(stage3Max - stage2Max, 5)}%` }}
                  className="h-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs transition-all relative overflow-hidden"
                  title={`3단계 (${stage2Max}% ~ ${stage3Max}%): 초록색`}
                >
                  <span className="truncate px-1 flex items-center gap-1">
                    <span>3단계 (초록)</span>
                    <span className="text-[10px] opacity-90">{stage2Max}%~{stage3Max}%</span>
                  </span>
                </div>

                {/* 4. 4단계: stage3Max% ~ 100% 보라색 */}
                <div
                  style={{ width: `${Math.max(100 - stage3Max, 5)}%` }}
                  className="h-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs transition-all relative overflow-hidden"
                  title={`4단계 (${stage3Max}% ~ 100%): 보라색`}
                >
                  <span className="truncate px-1 flex items-center gap-1">
                    <span>4단계 (보라)</span>
                    <span className="text-[10px] opacity-90">{stage3Max}%~100%</span>
                  </span>
                </div>
              </div>

              {/* Ticks */}
              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>0% (시작)</span>
                <span>{stage1Max}% (주황 전환)</span>
                <span>{stage2Max}% (초록 전환)</span>
                <span>{stage3Max}% (보라 전환)</span>
                <span>100% (소진 완료)</span>
              </div>
            </div>

            {/* 2. 4단계 상태별 세부 관리 지침 및 컬러 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Card 1: 1단계 빨간색 */}
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    1단계 (빨간색)
                  </span>
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    0% ~ {stage1Max}%
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">예산 소진 초기 / 집중 독려 대상</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>포인트 사용률 0% 이상 ~ {stage1Max}% 미만</li>
                  <li>소진 속도가 낮거나 초기 단계인 회원</li>
                  <li>담당자 알림 발송 및 사용처 안내 독려</li>
                </ul>
              </div>

              {/* Card 2: 2단계 주황색 */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    2단계 (주황색)
                  </span>
                  <span className="font-mono font-bold text-amber-700 text-xs">
                    {stage1Max}% ~ {stage2Max}%
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">예산 소진 진행 / 주의 관리 대상</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>포인트 사용률 {stage1Max}% 이상 ~ {stage2Max}% 미만</li>
                  <li>기본적인 소진 흐름 진입 단계</li>
                  <li>월별 실적 주기적 점검 및 모니터링</li>
                </ul>
              </div>

              {/* Card 3: 3단계 초록색 */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    3단계 (초록색)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {stage2Max}% ~ {stage3Max}%
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">안정적 표준 소진 / 정상 운영</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>포인트 사용률 {stage2Max}% 이상 ~ {stage3Max}% 미만</li>
                  <li>균형 잡힌 안정적 소진 진행 회원</li>
                  <li>정기 승인 및 정산 프로세스 유지</li>
                </ul>
              </div>

              {/* Card 4: 4단계 보라색 */}
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    4단계 (보라색)
                  </span>
                  <span className="font-mono font-bold text-purple-700 text-xs">
                    {stage3Max}% ~ 100%
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">목표 예산 고활용 / 완벽 소진</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>포인트 사용률 {stage3Max}% 이상 (최대 100%)</li>
                  <li>목표 예산 적극 활용 및 완벽 소진</li>
                  <li>소진 완료 시 추가 예산 배정 검토</li>
                </ul>
              </div>
            </div>

            {/* 3. 실시간 포인트 4단계 상태 판별 시뮬레이터 */}
            <div className="bg-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">실시간 포인트 4단계 판별 시뮬레이터</h4>
                  <p className="text-[11px] text-slate-500">
                    설정한 기준치(1단계 0~{stage1Max}%, 2단계 {stage1Max}~{stage2Max}%, 3단계 {stage2Max}~{stage3Max}%, 4단계 {stage3Max}%~)가 어떻게 판별되는지 슬라이더로 즉시 확인해보세요.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulatedRate}
                    onChange={e => setSimulatedRate(Number(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-indigo-900 font-mono mt-1">
                    <span>0%</span>
                    <span className="font-bold text-indigo-700">{simulatedRate}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 ${simResult.color}`}>
                  <span className={`w-2 h-2 rounded-full ${simResult.badge}`}></span>
                  <span>{simResult.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 조직별 카테고리 관리 */}
      {activeSubTab === 'org-categories' && (
        <OrgCategoryManagement
          categories={orgCategories}
          onAddCategory={onAddOrgCategory}
          onUpdateCategory={onUpdateOrgCategory}
          onDeleteCategory={onDeleteOrgCategory}
          onImportCategories={onImportOrgCategories}
        />
      )}

      {/* SUB-TAB 3: 운영 정책 & 데이터 관리 */}
      {activeSubTab === 'system' && (
        <div className="space-y-6">
          {/* Organization Display Priority Order */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <ListOrdered className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">조직 표시 우선순위</h3>
                  <p className="text-xs text-slate-500">
                    예산관리·실적관리 화면에서 조직이 나열되는 순서를 직접 지정합니다. 목록에 없는 신규 조직은 뒤에 자동 추가됩니다.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {isOrgOrderSaved && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    우선순위 저장 완료
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetOrgOrder}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="가나다순으로 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>초기화</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrgOrder}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>우선순위 저장</span>
                </button>
              </div>
            </div>

            {orgOrderDraft.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">등록된 조직이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {orgOrderDraft.map((company, index) => (
                  <div
                    key={company}
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate" title={company}>
                        {company}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveOrgOrder(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrgOrder(index, 1)}
                        disabled={index === orgOrderDraft.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Data Management & Backup */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">데이터 & 엑셀 통합 관리</h3>
                  <p className="text-xs text-slate-500">포인트 데이터 일괄 업로드 및 백업</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onOpenExcelUpload}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>실적 엑셀 파일 일괄 업로드</span>
                  </div>
                  <span className="text-[11px] text-emerald-600">.xlsx/.csv</span>
                </button>

                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>실적 표준 엑셀 서식 다운로드</span>
                  </div>
                  <span className="text-[11px] text-slate-400">양식</span>
                </button>

                <button
                  type="button"
                  onClick={onExportCSV}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>현재 실적 전체 내보내기</span>
                  </div>
                  <span className="text-[11px] text-slate-400">CSV</span>
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>초기 샘플 데이터로 복원</span>
                  </div>
                  <span className="text-[10px] text-rose-500">리셋</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: General System Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">운영 정보 요약</h3>
                  <p className="text-xs text-slate-500">현재 시스템에 등록된 데이터 통계</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">관리 대상 회원 수</span>
                  <strong className="text-slate-900">{totalCustomers}명</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">누적 포인트 거래 로그</span>
                  <strong className="text-slate-900">{totalTransactions}건</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">조직별 등록 카테고리</span>
                  <strong className="text-slate-900">{orgCategories.length}개</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">포인트 통화 단위</span>
                  <strong className="text-slate-900 font-mono">P (KRW 1:1)</strong>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};
