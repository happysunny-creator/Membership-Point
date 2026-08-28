import React, { useMemo, useState } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  Line,
  ComposedChart,
} from 'recharts';
import { Customer, Transaction, SystemSettings } from '../types';
import { formatNumber, formatPoints, formatPercent, calculateBurnRate } from '../utils/formatters';
import { separateNameAndPosition } from '../utils/nameParser';
import { downloadMemberUsageReportPdf } from '../utils/htmlReport';
import { Layers, Gauge, TrendingUp, X, Users, BellRing } from 'lucide-react';

interface ChartsSectionProps {
  customers: Customer[];
  transactions: Transaction[];
  settings?: SystemSettings;
  // 조직별 사용 비중 카드(제목/조각/범례)를 클릭했을 때 호출 — 이 컴포넌트 안에 별도
  // 패널을 만드는 대신, 상위(App)에서 이미 있는 "조직별 포인트 사용 실적 및 지출 분석"
  // (CategoryAnalyticsView) 섹션으로 스크롤 이동시키는 데 사용한다.
  onSelectOrg?: () => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  customers,
  transactions,
  settings,
  onSelectOrg,
}) => {
  // 사용률 단계별 인원 현황 카드를 클릭하면 3개 차트 그리드 바로 아래에 단계별 회원
  // 리스트 패널이 인라인으로 펼쳐진다 (그리드 카드 자체의 높이에는 영향을 주지 않도록
  // 그리드 바깥에 렌더링).
  const [expandedPanel, setExpandedPanel] = useState<'stage' | null>(null);
  const toggleStagePanel = () => setExpandedPanel(prev => (prev === 'stage' ? null : 'stage'));

  // "사용 실적 알림" 버튼 — 회원 1인용 실적 안내 PDF(배정/실적/잔액/사용률 +
  // 지금까지 사용한 포인트 승인 내역)를 대화상자 없이 바로 저장한다.
  const handleSendUsageAlert = (customer: Customer) => {
    downloadMemberUsageReportPdf({ customer, transactions }).catch(() => {
      window.alert('실적 알림 PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    });
  };

  // "사용 실적 일괄 알림" — 사용률 단계별 회원 현황에 표시된 전체 회원의 실적
  // 안내 PDF를 순서대로 한 번에 저장한다 (동시에 여러 개를 처리하면 렌더링용
  // iframe이 겹쳐 느려지거나 실패할 수 있어 한 명씩 순차 처리한다).
  const [isBulkSendingAlerts, setIsBulkSendingAlerts] = useState(false);
  const handleSendAllUsageAlerts = async (allMembers: Customer[]) => {
    if (isBulkSendingAlerts || allMembers.length === 0) return;
    setIsBulkSendingAlerts(true);
    let failCount = 0;
    for (const customer of allMembers) {
      try {
        await downloadMemberUsageReportPdf({ customer, transactions });
      } catch {
        failCount += 1;
      }
    }
    setIsBulkSendingAlerts(false);
    if (failCount > 0) {
      window.alert(`${allMembers.length}명 중 ${failCount}명의 실적 알림 PDF 생성에 실패했습니다.`);
    }
  };
  // 1. Prepare Organization (조직별) Spending & Ratio Pie Chart Data
  const { orgPieData, totalOrgSpent, uniqueOrgCount } = useMemo(() => {
    const orgMap: Record<string, { used: number; count: number; budget: number }> = {};
    customers.forEach(c => {
      const comp = c.company ? c.company.trim() : '기타 조직';
      if (!orgMap[comp]) {
        orgMap[comp] = { used: 0, count: 0, budget: 0 };
      }
      orgMap[comp].used += c.usedPoints;
      orgMap[comp].budget += c.totalBudget;
      orgMap[comp].count += 1;
    });

    const sorted = Object.entries(orgMap)
      .map(([company, data]) => ({
        company,
        used: data.used,
        budget: data.budget,
        count: data.count,
      }))
      .filter(item => item.used > 0)
      .sort((a, b) => {
        const rateA = a.budget > 0 ? a.used / a.budget : 0;
        const rateB = b.budget > 0 ? b.used / b.budget : 0;
        return rateB - rateA;
      });

    const totalSpend = sorted.reduce((sum, item) => sum + item.used, 0);

    const orgColors = [
      '#7c3aed', // violet-600
      '#2563eb', // blue-600
      '#0891b2', // cyan-600
      '#059669', // emerald-600
      '#d97706', // amber-600
      '#db2777', // pink-600
      '#4f46e5', // indigo-600
      '#64748b', // slate-500
    ];

    const data = sorted.map((item, idx) => ({
      id: `org-${idx}`,
      name: item.company,
      value: item.used,
      budget: item.budget,
      remaining: Math.max(item.budget - item.used, 0),
      count: item.count,
      percent: totalSpend > 0 ? (item.used / totalSpend) * 100 : 0,
      burnRate: item.budget > 0 ? (item.used / item.budget) * 100 : 0,
      color: orgColors[idx % orgColors.length],
    }));

    return {
      orgPieData: data,
      totalOrgSpent: totalSpend,
      uniqueOrgCount: sorted.length,
    };
  }, [customers]);

  // 2. Prepare 사용률 단계별(1~4단계) 소속 회원 인원수 — 관리자 모드의 포인트 관리기준
  // (4단계 임계값)을 그대로 따르며, 기존 4색 체계(빨강/주황/초록/보라)를 사용한다.
  // 각 단계에 속한 회원 목록도 함께 모아둬서, 클릭 시 단계별 인원 리스트를 보여줄 수 있게 한다.
  const { stagePieData, totalStageMembers, stageMembersMap } = useMemo(() => {
    const stage1Max = settings?.stage1MaxPercent ?? 30;
    const stage2Max = settings?.stage2MaxPercent ?? 50;
    const stage3Max = settings?.stage3MaxPercent ?? 70;

    const stageDefs = [
      { id: 'stage1', name: `1단계 (0%~${stage1Max}%)`, color: '#f43f5e', members: [] as Customer[] },
      { id: 'stage2', name: `2단계 (${stage1Max}%~${stage2Max}%)`, color: '#f97316', members: [] as Customer[] },
      { id: 'stage3', name: `3단계 (${stage2Max}%~${stage3Max}%)`, color: '#10b981', members: [] as Customer[] },
      { id: 'stage4', name: `4단계 (${stage3Max}% 이상)`, color: '#8b5cf6', members: [] as Customer[] },
    ];

    customers.forEach(c => {
      const rate = c.totalBudget > 0 ? (c.usedPoints / c.totalBudget) * 100 : 0;
      if (rate >= stage3Max) stageDefs[3].members.push(c);
      else if (rate >= stage2Max) stageDefs[2].members.push(c);
      else if (rate >= stage1Max) stageDefs[1].members.push(c);
      else stageDefs[0].members.push(c);
    });

    const total = customers.length;
    const data = stageDefs.map(s => ({
      id: s.id,
      name: s.name,
      value: s.members.length,
      percent: total > 0 ? (s.members.length / total) * 100 : 0,
      color: s.color,
    }));
    const membersMap: Record<string, { name: string; color: string; members: Customer[] }> = {};
    stageDefs.forEach(s => {
      membersMap[s.id] = { name: s.name, color: s.color, members: s.members };
    });

    return { stagePieData: data, totalStageMembers: total, stageMembersMap: membersMap };
  }, [customers, settings]);

  // 사용률 단계별 회원 현황 표에 실제로 나열되는 순서(1→4단계) 그대로 모은 전체 회원 목록
  const allStageMembers = useMemo(
    () => ['stage1', 'stage2', 'stage3', 'stage4'].flatMap(id => stageMembersMap[id].members),
    [stageMembersMap]
  );

  // 3. Prepare Monthly / Timeline Trend Data (월별 합계 & 누적 금액)
  // Derived entirely from 포인트 사용 및 실적 내역(transactions): cumulative from 1월
  // through the current calendar month, which is marked (현재).
  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const months = Array.from({ length: currentMonth }, (_, idx) => {
      const m = idx + 1;
      const key = `${currentYear}-${String(m).padStart(2, '0')}`;
      const label = m === currentMonth ? `${m}월 (현재)` : `${m}월`;
      return { key, label };
    });

    const spendByMonth: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type !== 'SPEND' || t.status !== 'COMPLETED') return;
      const key = t.timestamp.slice(0, 7); // "YYYY-MM"
      spendByMonth[key] = (spendByMonth[key] || 0) + t.amount;
    });

    let runningTotal = 0;
    return months.map(({ key, label }) => {
      const monthlySpend = spendByMonth[key] || 0;
      runningTotal += monthlySpend;
      return { month: label, monthlySpend, cumulativeSpend: runningTotal };
    });
  }, [transactions]);

  const latestData = monthlyTrendData[monthlyTrendData.length - 1];

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="charts-overview-container">
      {/* Chart 1: 조직별 사용 비중 (원그래프 & 금액/비율 분리 표기) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div
          onClick={onSelectOrg}
          className="flex items-center justify-between mb-2 cursor-pointer select-none"
          title="클릭하면 조직별 포인트 사용 실적 및 지출 분석으로 이동합니다"
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">조직별 사용 비중</h3>
              <p className="text-xs text-slate-500">소속 조직(회사)별 사용 금액 및 점유율</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            총 {uniqueOrgCount}개 조직
          </span>
        </div>

        <div className="h-60 relative flex items-center justify-center">
          {orgPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={orgPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  cursor="pointer"
                >
                  {orgPieData.map(entry => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      onClick={onSelectOrg}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const entry = payload[0].payload as (typeof orgPieData)[number];
                    return (
                      <div
                        style={{
                          backgroundColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '10px 12px',
                          lineHeight: 1.6,
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>{entry.name}</div>
                        <div>배정 예산: {formatPoints(entry.budget)}</div>
                        <div style={{ color: '#93c5fd' }}>사용 실적: {formatPoints(entry.value)}</div>
                        <div style={{ color: '#c4b5fd' }}>사용률: {formatPercent(entry.burnRate)}</div>
                      </div>
                    );
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400">데이터가 없습니다.</div>
          )}

          <div className="absolute flex flex-col items-center pointer-events-none">
            <span className="text-[11px] text-slate-400 font-medium">총 소진액</span>
            <span className="text-xs font-extrabold text-slate-800">{formatNumber(totalOrgSpent)}</span>
          </div>
        </div>

        {/* 조직별 금액 & 비율 명확 분리 표기 리스트 */}
        <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-100 max-h-32 overflow-y-auto text-xs">
          {orgPieData.map(item => (
            <div
              key={item.id}
              onClick={onSelectOrg}
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[150px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-800 text-xs" title={item.name}>{item.name}</span>
                <span className="text-[10px] text-slate-400 font-extrabold shrink-0">({item.count}명)</span>
              </div>
              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="font-extrabold text-slate-900 text-xs">
                  {formatPoints(item.value)}
                </span>
                <span
                  className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 min-w-[48px] text-center"
                  title="조직 사용률 (사용실적 / 배정예산)"
                >
                  {formatPercent(item.burnRate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: 사용률 단계별 소속 회원 인원수 (1~4단계, 관리자 모드 기준 연동) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div
          onClick={toggleStagePanel}
          className="flex items-center justify-between mb-2 cursor-pointer select-none"
          title="클릭하면 아래에 단계별 회원 목록이 펼쳐집니다"
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                expandedPanel === 'stage' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">사용률 단계별 인원 현황</h3>
              <p className="text-xs text-slate-500">1~4단계 사용률 구간별 소속 회원 인원수</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            총 {totalStageMembers}명
          </span>
        </div>

        <div className="h-60 relative flex items-center justify-center">
          {totalStageMembers > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={stagePieData.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  cursor="pointer"
                >
                  {stagePieData
                    .filter(s => s.value > 0)
                    .map(entry => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        onClick={toggleStagePanel}
                      />
                    ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  formatter={(value: number, _name, item) => [
                    `${value}명 (${formatPercent(item.payload.percent)})`,
                    item.payload.name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#93c5fd' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400">회원 데이터가 없습니다.</div>
          )}

          <div className="absolute flex flex-col items-center pointer-events-none">
            <span className="text-[11px] text-slate-400 font-medium">전체 인원</span>
            <span className="text-xs font-extrabold text-slate-800">{totalStageMembers}명</span>
          </div>
        </div>

        {/* 단계별 인원수 & 비율 명확 분리 표기 리스트 */}
        <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-100 text-xs">
          {stagePieData.map(item => (
            <div
              key={item.id}
              onClick={toggleStagePanel}
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-800 text-xs" title={item.name}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="font-extrabold text-slate-900 text-xs">{item.value}명</span>
                <span
                  className="text-[11px] font-extrabold px-1.5 py-0.2 rounded border min-w-[48px] text-center"
                  style={{ color: item.color, backgroundColor: `${item.color}14`, borderColor: `${item.color}40` }}
                >
                  {formatPercent(item.percent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 3: 월별 누적 및 월별 합계 소진 추이 (한 표에 동시 표기) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">월별 포인트 소진 추이</h3>
              <p className="text-xs text-slate-500">누적 소진액 & 월별 발생액 동시 비교</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              누적+월별
            </span>
          </div>
        </div>

        {/* 범례 (Legend) */}
        <div className="flex items-center gap-4 py-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
            <span className="w-3 h-1.5 rounded-full bg-indigo-600 inline-block"></span>
            <span>누적 소진 금액 (Cumulative)</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-sky-700">
            <span className="w-3 h-1.5 rounded-full bg-sky-500 inline-block"></span>
            <span>월별 합계 금액 (Monthly)</span>
          </div>
        </div>

        <div className="h-64 w-full mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={val => `${(val / 1000000).toFixed(0)}M`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatPoints(value),
                  name === 'cumulativeSpend' ? '누적 소진 금액' : '월별 합계 금액',
                ]}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}
              />
              {/* 1. 누적 소진 금액 (Cumulative Area / Line) */}
              <Area
                type="monotone"
                name="cumulativeSpend"
                dataKey="cumulativeSpend"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cumulativeGradient)"
                dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5.5, fill: '#6366f1' }}
              />
              {/* 2. 월별 합계 금액 (Monthly Spend Line) */}
              <Line
                type="monotone"
                name="monthlySpend"
                dataKey="monthlySpend"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#0ea5e9', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5.5, fill: '#0ea5e9' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
          <span>당월({latestData?.month.split(' ')[0]}) 합계: <strong className="text-sky-700 font-mono font-extrabold">{formatPoints(latestData?.monthlySpend || 0)}</strong></span>
          <span>총 누적 소진: <strong className="text-indigo-700 font-mono font-extrabold">{formatPoints(latestData?.cumulativeSpend || 0)}</strong></span>
        </div>
      </div>
    </div>

    {/* 사용률 단계별 인원 현황 카드를 클릭하면 펼쳐지는 1~4단계 순서의 인원 리스트 패널 */}
    {expandedPanel === 'stage' && (
      <div className="mt-4 bg-white rounded-xl p-5 border border-slate-200 shadow-xs animate-in fade-in duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">사용률 단계별 회원 현황</h3>
              <p className="text-xs text-slate-500">1단계부터 4단계까지 순서대로 정리한 회원 목록</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleSendAllUsageAlerts(allStageMembers)}
              disabled={isBulkSendingAlerts}
              title="표에 나열된 전체 회원의 실적 안내 PDF를 한 번에 저장합니다"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{isBulkSendingAlerts ? `저장 중... (${allStageMembers.length}명)` : '사용 실적 일괄 알림'}</span>
            </button>
            <button
              onClick={() => setExpandedPanel(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* colgroup + table-layout: fixed로 컬럼 폭을 고정해, 단계 구분 행이 몇 번
              끼어들어도 조직명/성함/직위/배정 예산/사용 실적/사용률 컬럼 라인이
              항상 정확히 맞도록 한다 (테이블을 단계별로 나누면 각자 폭이 달라져
              라인이 어긋난다). */}
          <table className="w-full text-left text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="py-2 px-3 font-semibold">조직명</th>
                <th className="py-2 px-3 font-semibold">성함</th>
                <th className="py-2 px-3 font-semibold">직위</th>
                <th className="py-2 px-3 font-semibold text-right">배정 예산</th>
                <th className="py-2 px-3 font-semibold text-right">사용 실적</th>
                <th className="py-2 px-3 font-semibold text-right">사용률</th>
                <th className="py-2 px-3 font-semibold text-center">알림</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {['stage1', 'stage2', 'stage3', 'stage4'].flatMap(stageId => {
                const stage = stageMembersMap[stageId];
                const sortedMembers = [...stage.members].sort(
                  (a, b) => calculateBurnRate(b.usedPoints, b.totalBudget) - calculateBurnRate(a.usedPoints, a.totalBudget)
                );
                const rows = [
                  <tr key={`${stageId}-header`}>
                    <td
                      colSpan={7}
                      className="py-1.5 px-3 text-[11px] font-extrabold"
                      style={{ color: stage.color, backgroundColor: `${stage.color}14` }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                        {stage.name}
                        <span className="font-bold text-slate-500">{stage.members.length}명</span>
                      </span>
                    </td>
                  </tr>,
                ];
                if (sortedMembers.length === 0) {
                  rows.push(
                    <tr key={`${stageId}-empty`}>
                      <td colSpan={7} className="py-2 px-3 text-slate-300">
                        해당 단계에 속한 회원이 없습니다.
                      </td>
                    </tr>
                  );
                } else {
                  sortedMembers.forEach(m => {
                    const { name, position } = separateNameAndPosition(m.name, m.position);
                    const rate = calculateBurnRate(m.usedPoints, m.totalBudget);
                    rows.push(
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 text-slate-700 truncate">{m.company || '-'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 truncate">{name}</td>
                        <td className="py-2 px-3 text-slate-600 truncate">{position || '-'}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatPoints(m.totalBudget)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-700">{formatPoints(m.usedPoints)}</td>
                        <td className="py-2 px-3 text-right font-extrabold" style={{ color: stage.color }}>
                          {formatPercent(rate)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleSendUsageAlert(m)}
                            title="포인트 사용 실적 안내 PDF를 저장합니다"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            <BellRing className="w-3 h-3" />
                            <span>사용 실적 알림</span>
                          </button>
                        </td>
                      </tr>
                    );
                  });
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
    </>
  );
};
