import React, { useMemo } from 'react';
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
import { Customer, Transaction } from '../types';
import { formatNumber, formatPoints, formatPercent } from '../utils/formatters';
import { Layers, Store, TrendingUp } from 'lucide-react';

interface ChartsSectionProps {
  customers: Customer[];
  transactions: Transaction[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  customers,
  transactions,
}) => {
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

  // 2. Prepare Merchant (사용처별) Spending & Ratio Pie Chart Data
  const { merchantPieData, totalMerchantSpend, uniqueMerchantCount } = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'SPEND' && t.status === 'COMPLETED' && t.merchant) {
        const m = t.merchant.trim() || '기타 사용처';
        map[m] = (map[m] || 0) + t.amount;
      }
    });

    const sorted = Object.entries(map)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount);

    const totalSpend = sorted.reduce((sum, item) => sum + item.amount, 0);
    const uniqueCount = sorted.length;

    // Top 5 merchants + '기타' for the rest
    const topCount = 5;
    const topList = sorted.slice(0, topCount);
    const othersList = sorted.slice(topCount);
    const othersSpend = othersList.reduce((sum, item) => sum + item.amount, 0);

    const chartItems = [...topList];
    if (othersSpend > 0) {
      chartItems.push({
        merchant: `기타 사용처 (${othersList.length}곳)`,
        amount: othersSpend,
      });
    }

    const merchantColors = [
      '#2563eb', // blue-600
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#8b5cf6', // purple-500
      '#ec4899', // pink-500
      '#06b6d4', // cyan-500
      '#64748b', // slate-500
    ];

    const data = chartItems.map((item, idx) => ({
      id: `merchant-${idx}`,
      name: item.merchant,
      value: item.amount,
      percent: totalSpend > 0 ? (item.amount / totalSpend) * 100 : 0,
      color: merchantColors[idx % merchantColors.length],
    }));

    return {
      merchantPieData: data,
      totalMerchantSpend: totalSpend,
      uniqueMerchantCount: uniqueCount,
    };
  }, [transactions]);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="charts-overview-container">
      {/* Chart 1: 조직별 사용 비중 (원그래프 & 금액/비율 분리 표기) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
                    />
                  ))}
                </Pie>
                <Tooltip
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
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors"
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

      {/* Chart 2: 사용처별 포인트 사용 현황 (원그래프 & 금액/비율 분리 표기) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">사용처별 포인트 사용 현황</h3>
              <p className="text-xs text-slate-500">주요 사용처(가맹점)별 금액 및 비중 분석</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            총 {uniqueMerchantCount}개 사용처
          </span>
        </div>

        <div className="h-60 relative flex items-center justify-center">
          {merchantPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={merchantPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  cursor="pointer"
                >
                  {merchantPieData.map(entry => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${formatPoints(value)} (${totalMerchantSpend > 0 ? formatPercent((value / totalMerchantSpend) * 100) : '00.0%'})`,
                    '사용 금액',
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
            <div className="text-xs text-slate-400">사용처 데이터가 없습니다.</div>
          )}

          <div className="absolute flex flex-col items-center pointer-events-none">
            <span className="text-[11px] text-slate-400 font-medium">사용처 합계</span>
            <span className="text-xs font-extrabold text-slate-800">{formatNumber(totalMerchantSpend)}</span>
          </div>
        </div>

        {/* 사용처별 금액 & 비율 명확 분리 표기 리스트 */}
        <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-100 max-h-32 overflow-y-auto text-xs">
          {merchantPieData.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[150px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-800 text-xs" title={item.name}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="font-extrabold text-slate-900 text-xs">
                  {formatPoints(item.value)}
                </span>
                <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 min-w-[48px] text-center">
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
  );
};
