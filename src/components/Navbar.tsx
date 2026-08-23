import React from 'react';
import {
  Coins,
  BarChart3,
  WalletCards,
  Settings,
  Users,
} from 'lucide-react';
import { MainTab } from '../types';

interface NavbarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  totalCustomersCount: number;
  totalTransactionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalCustomersCount,
  totalTransactionsCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shadow-blue-200 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-indigo-950 tracking-tight">
                  남산 리더십센터 / 스마일즈 멤버십 포인트 운영 Dashboard
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  2026 통합 시스템
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                회원등록, 포인트 배정, 조직별 실적 분석 등 멤버십 포인트의 효율적인 관리/운영을 위해 구현된 시스템 입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Tab & Navigation Line */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 border-t border-slate-100 py-2 overflow-x-auto scrollbar-none" id="main-navigation-tabs">
          {/* 1. 회원 등록 및 관리 */}
          <button
            id="tab-members"
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>회원 등록 및 포인트 배정</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
                activeTab === 'members' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalCustomersCount}명
            </span>
          </button>

          {/* 2. 예산관리 */}
          <button
            id="tab-budget"
            onClick={() => setActiveTab('budget')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <WalletCards className="w-4 h-4" />
            <span>포인트 사용 현황</span>
          </button>

          {/* 3. 실적관리(상세) */}
          <button
            id="tab-performance"
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>실적관리(상세)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
                activeTab === 'performance' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalTransactionsCount}건
            </span>
          </button>

          {/* 4. 설정 */}
          <button
            id="tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>관리자 모드</span>
          </button>
        </div>
      </div>
    </header>
  );
};

