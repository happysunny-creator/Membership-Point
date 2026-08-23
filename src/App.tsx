import React, { useState, useMemo, useEffect } from 'react';
import {
  Category,
  CategoryId,
  Customer,
  CustomerStatus,
  CustomerTier,
  FilterState,
  Transaction,
  TransactionType,
  BudgetSummary,
  MainTab,
  SystemSettings,
} from './types';
import { CATEGORIES, INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS } from './data/mockData';
import { calculateBurnRate, exportToCSV, formatPoints, getCustomerStatusFromBurnRate, setCurrencyUnit } from './utils/formatters';

import { Navbar } from './components/Navbar';
import { StatSummaryCards } from './components/StatSummaryCards';
import { BudgetDashboardView } from './components/BudgetDashboardView';
import { ChartsSection } from './components/ChartsSection';
import { CustomerTable } from './components/CustomerTable';
import { TransactionHistoryTable } from './components/TransactionHistoryTable';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { BudgetAdjustModal } from './components/BudgetAdjustModal';
import { CategoryAnalyticsView } from './components/CategoryAnalyticsView';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { SettingsView } from './components/SettingsView';
import { MemberManagement } from './components/MemberManagement';
import { CheckCircle2, X, FileSpreadsheet, PlusCircle } from 'lucide-react';

const INITIAL_SETTINGS: SystemSettings = {
  stage1MaxPercent: 30,
  stage2MaxPercent: 50,
  stage3MaxPercent: 70,
  warningThresholdPercent: 30,
  perfectThresholdPercent: 70,
  dangerThresholdPercent: 95,
  defaultTierBudgets: {
    Corporate: 20000000,
    VIP: 10000000,
    Gold: 5000000,
    Silver: 3000000,
    Bronze: 1000000,
  },
  companyName: '포인트 운영 관리본부',
  currencyUnit: 'P',
  enableAutoAlerts: true,
  enableAutoCustomerCreation: true,
  orgPriorityOrder: [],
};

export default function App() {
  // 1. Core State
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<MainTab>('budget');
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep the point/currency unit used by formatPoints() in sync with settings
  useEffect(() => {
    setCurrencyUnit(settings.currencyUnit);
  }, [settings.currencyUnit]);

  // 2. Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: 'all',
    selectedCustomer: 'all',
    selectedTier: 'all',
    selectedStatus: 'all',
    selectedType: 'all',
    dateRange: 'all',
    sortBy: 'burnRate',
    sortOrder: 'desc',
  });

  // 3. Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<boolean>(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [isAdjustBudgetOpen, setIsAdjustBudgetOpen] = useState<boolean>(false);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState<boolean>(false);
  const [targetCustomerForModal, setTargetCustomerForModal] = useState<Customer | null>(null);

  // 4. Calculate Category Spending Map from Completed Spend Transactions
  const categorySpendingMap = useMemo(() => {
    const map: Record<CategoryId, number> = {
      shopping: 0,
      fnb: 0,
      culture: 0,
      travel: 0,
      education: 0,
      health: 0,
      transport: 0,
      digital: 0,
    };

    transactions.forEach(txn => {
      if (txn.type === 'SPEND' && txn.status === 'COMPLETED') {
        if (map[txn.categoryId] !== undefined) {
          map[txn.categoryId] += txn.amount;
        }
      }
    });

    return map;
  }, [transactions]);

  const totalSpend = useMemo(() => {
    return (Object.values(categorySpendingMap) as number[]).reduce((acc, curr) => acc + curr, 0);
  }, [categorySpendingMap]);

  // 5. Calculate Budget Summary Stats
  const summary: BudgetSummary = useMemo(() => {
    const totalBudget = customers.reduce((acc, c) => acc + c.totalBudget, 0);
    const totalUsed = customers.reduce((acc, c) => acc + c.usedPoints, 0);
    const totalRemaining = customers.reduce((acc, c) => acc + c.remainingPoints, 0);
    const overallBurnRate = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

    let stage1Count = 0; // 1단계 (빨간색)
    let stage2Count = 0; // 2단계 (주황색)
    let stage3Count = 0; // 3단계 (초록색)
    let stage4Count = 0; // 4단계 (보라색)

    const stage1Max = settings.stage1MaxPercent ?? 30;
    const stage2Max = settings.stage2MaxPercent ?? 50;
    const stage3Max = settings.stage3MaxPercent ?? 70;

    customers.forEach(c => {
      const rate = calculateBurnRate(c.usedPoints, c.totalBudget);
      if (rate >= stage3Max) stage4Count++;
      else if (rate >= stage2Max) stage3Count++;
      else if (rate >= stage1Max) stage2Count++;
      else stage1Count++;
    });

    return {
      totalBudget,
      totalUsed,
      totalRemaining,
      overallBurnRate,
      totalCustomers: customers.length,
      stage1Count,
      stage2Count,
      stage3Count,
      stage4Count,
      activeCustomers: stage3Count,
      warningCustomers: stage1Count + stage2Count,
      overBudgetCustomers: stage4Count,
    };
  }, [customers, settings]);

  // 6. Filter and Sort Customers
  const filteredCustomers = useMemo(() => {
    const stage1Max = settings.stage1MaxPercent ?? 30;
    const stage2Max = settings.stage2MaxPercent ?? 50;
    const stage3Max = settings.stage3MaxPercent ?? 70;

    return customers.filter(c => {
      // Search query
      if (filterState.searchQuery) {
        const query = filterState.searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(query);
        const matchCompany = c.company.toLowerCase().includes(query);
        const matchDept = c.department.toLowerCase().includes(query);
        const matchEmail = c.email.toLowerCase().includes(query);
        if (!matchName && !matchCompany && !matchDept && !matchEmail) return false;
      }

      // Tier filter
      if (filterState.selectedTier !== 'all' && c.tier !== filterState.selectedTier) {
        return false;
      }

      // Status filter
      if (filterState.selectedStatus !== 'all') {
        const burnRate = calculateBurnRate(c.usedPoints, c.totalBudget);
        const computedStatus = getCustomerStatusFromBurnRate(burnRate, settings);

        if (filterState.selectedStatus === 'STAGE_0_30' || filterState.selectedStatus === 'WARNING') {
          if (burnRate >= stage1Max) return false;
        } else if (filterState.selectedStatus === 'STAGE_30_50') {
          if (burnRate < stage1Max || burnRate >= stage2Max) return false;
        } else if (filterState.selectedStatus === 'STAGE_50_70' || filterState.selectedStatus === 'ACTIVE') {
          if (burnRate < stage2Max || burnRate >= stage3Max) return false;
        } else if (
          filterState.selectedStatus === 'STAGE_70_PLUS' ||
          filterState.selectedStatus === 'OVER_BUDGET' ||
          filterState.selectedStatus === 'PERFECT'
        ) {
          if (burnRate < stage3Max) return false;
        } else if (c.status !== filterState.selectedStatus && computedStatus !== filterState.selectedStatus) {
          return false;
        }
      }

      // Customer selection
      if (filterState.selectedCustomer !== 'all' && c.id !== filterState.selectedCustomer) {
        return false;
      }

      // If a specific category filter is active, check if this customer has transactions in that category
      if (filterState.selectedCategory !== 'all') {
        const hasCategoryTxn = transactions.some(
          t => t.customerId === c.id && t.categoryId === filterState.selectedCategory
        );
        if (!hasCategoryTxn) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      switch (filterState.sortBy) {
        case 'budget':
          comparison = a.totalBudget - b.totalBudget;
          break;
        case 'used':
          comparison = a.usedPoints - b.usedPoints;
          break;
        case 'remaining':
          comparison = a.remainingPoints - b.remainingPoints;
          break;
        case 'burnRate': {
          const rateA = calculateBurnRate(a.usedPoints, a.totalBudget);
          const rateB = calculateBurnRate(b.usedPoints, b.totalBudget);
          comparison = rateA - rateB;
          break;
        }
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ko');
          break;
        default:
          comparison = 0;
      }
      return filterState.sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [customers, transactions, filterState]);

  // 7. Filter and Sort Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Category filter
      if (filterState.selectedCategory !== 'all' && txn.categoryId !== filterState.selectedCategory) {
        return false;
      }

      // Customer filter
      if (filterState.selectedCustomer !== 'all' && txn.customerId !== filterState.selectedCustomer) {
        return false;
      }

      // Transaction type filter
      if (filterState.selectedType !== 'all' && txn.type !== filterState.selectedType) {
        return false;
      }

      // Search query
      if (filterState.searchQuery) {
        const query = filterState.searchQuery.toLowerCase();
        const matchDesc = txn.description.toLowerCase().includes(query);
        const matchMerchant = txn.merchant.toLowerCase().includes(query);
        const matchCustomer = txn.customerName.toLowerCase().includes(query);
        const matchCompany = txn.customerCompany.toLowerCase().includes(query);
        const matchOrder = txn.orderNumber?.toLowerCase().includes(query);
        if (!matchDesc && !matchMerchant && !matchCustomer && !matchCompany && !matchOrder) return false;
      }

      // Date Range filter
      if (filterState.dateRange !== 'all') {
        const txnDate = txn.timestamp.slice(0, 10);
        if (filterState.dateRange === 'today' && !txnDate.includes('2026-08-18')) {
          return false;
        }
        if (filterState.dateRange === 'this_month' && !txnDate.startsWith('2026-08')) {
          return false;
        }
        if (filterState.dateRange === 'last_3_months') {
          if (!txnDate.startsWith('2026-06') && !txnDate.startsWith('2026-07') && !txnDate.startsWith('2026-08')) {
            return false;
          }
        }
      }

      return true;
    });
  }, [transactions, filterState]);

  // 8. Handlers
  const handleCategoryChange = (categoryId: CategoryId | 'all') => {
    setFilterState(prev => ({ ...prev, selectedCategory: categoryId }));
  };

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      selectedCategory: 'all',
      selectedCustomer: 'all',
      selectedTier: 'all',
      selectedStatus: 'all',
      selectedType: 'all',
      dateRange: 'all',
      sortBy: 'burnRate',
      sortOrder: 'desc',
    });
  };

  const handleSortChange = (field: FilterState['sortBy']) => {
    setFilterState(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Add Transaction Handler
  const handleSaveTransaction = (newTxnData: Omit<Transaction, 'id'>) => {
    const newTxn: Transaction = {
      ...newTxnData,
      id: `TXN-${Date.now()}`,
    };

    // Update customer budget points
    setCustomers(prevCustomers =>
      prevCustomers.map(cust => {
        if (cust.id === newTxn.customerId) {
          let newUsed = cust.usedPoints;
          let newRemaining = cust.remainingPoints;

          if (newTxn.type === 'SPEND') {
            newUsed += newTxn.amount;
            newRemaining = Math.max(cust.totalBudget - newUsed, 0);
          } else if (newTxn.type === 'RECHARGE' || newTxn.type === 'REFUND') {
            newUsed = Math.max(newUsed - newTxn.amount, 0);
            newRemaining = cust.totalBudget - newUsed;
          }

          const burnRate = calculateBurnRate(newUsed, cust.totalBudget);
          const newStatus = getCustomerStatusFromBurnRate(burnRate);

          return {
            ...cust,
            usedPoints: newUsed,
            remainingPoints: newRemaining,
            status: newStatus,
            lastActivityDate: newTxn.timestamp.slice(0, 10),
          };
        }
        return cust;
      })
    );

    setTransactions(prev => [newTxn, ...prev]);
  };

  // Add Customer Handler
  const handleSaveCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    // Create initial budget allocation transaction
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const initialTxn: Transaction = {
      id: `TXN-INIT-${Date.now()}`,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      customerCompany: newCustomer.company,
      type: 'BUDGET_ALLOCATION',
      amount: newCustomer.totalBudget,
      categoryId: 'shopping',
      categoryName: '초기 예산 배정',
      description: `${newCustomer.tier} 등급 최초 포인트 예산 배정`,
      merchant: '시스템 관리부',
      orderNumber: `INIT-${newCustomer.id}`,
      timestamp: formattedDate,
      status: 'COMPLETED',
      paymentMethod: '포인트 예산 승인',
    };

    setTransactions(prev => [initialTxn, ...prev]);
    setToastMessage(`[${newCustomer.company}] ${newCustomer.name} 회원이 등록 및 배정되었습니다.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add Batch Customers Handler (Excel)
  const handleSaveBatchCustomers = (newCustomers: Customer[]) => {
    if (newCustomers.length === 0) return;
    setCustomers(prev => [...newCustomers, ...prev]);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const batchTxns: Transaction[] = newCustomers.map((cust, idx) => ({
      id: `TXN-INIT-BATCH-${Date.now()}-${idx}`,
      customerId: cust.id,
      customerName: cust.name,
      customerCompany: cust.company,
      type: 'BUDGET_ALLOCATION',
      amount: cust.totalBudget,
      categoryId: 'shopping',
      categoryName: '초기 예산 배정',
      description: `${cust.position ? `[${cust.position}] ` : ''}엑셀 일괄 등록 ${cust.tier} 등급 포인트 예산 배정`,
      merchant: '시스템 관리부',
      orderNumber: `INIT-BATCH-${cust.id}`,
      timestamp: formattedDate,
      status: 'COMPLETED',
      paymentMethod: '포인트 예산 승인',
    }));

    setTransactions(prev => [...batchTxns, ...prev]);
    setToastMessage(`총 ${newCustomers.length}명의 회원이 엑셀로 일괄 등록 및 포인트 배정되었습니다.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Adjust Customer Budget Handler
  const handleAdjustBudget = (customerId: string, newBudget: number, reason: string) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          const newRemaining = Math.max(newBudget - c.usedPoints, 0);
          const burnRate = calculateBurnRate(c.usedPoints, newBudget);
          const newStatus = getCustomerStatusFromBurnRate(burnRate);

          return {
            ...c,
            totalBudget: newBudget,
            remainingPoints: newRemaining,
            status: newStatus,
            notes: reason || c.notes,
          };
        }
        return c;
      })
    );

    const target = customers.find(c => c.id === customerId);
    if (target) {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const adjustTxn: Transaction = {
        id: `TXN-ADJ-${Date.now()}`,
        customerId,
        customerName: target.name,
        customerCompany: target.company,
        type: 'BUDGET_ALLOCATION',
        amount: Math.abs(newBudget - target.totalBudget),
        categoryId: 'shopping',
        categoryName: '예산 변경',
        description: reason || '포인트 예산 증액/조정',
        merchant: '예산운영위원회',
        orderNumber: `ADJ-${Date.now().toString().slice(-6)}`,
        timestamp: formattedDate,
        status: 'COMPLETED',
        paymentMethod: '예산 승인',
      };
      setTransactions(prev => [adjustTxn, ...prev]);
    }
  };

  // Reset to sample data
  const handleResetData = () => {
    if (confirm('회원 정보와 사용 실적 등 모든 데이터를 삭제하고 빈 상태로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setCustomers([]);
      setTransactions([]);
      handleResetFilters();
    }
  };

  // Handle Excel Import
  const handleExcelImport = (
    importedTransactions: Transaction[],
    newCustomers: Customer[],
    importMode: 'APPEND' | 'REPLACE'
  ) => {
    // 1. Merge new customers if any
    const allCustomersMap: Map<string, Customer> = new Map();
    customers.forEach(c => allCustomersMap.set(c.id, { ...c }));
    newCustomers.forEach(c => allCustomersMap.set(c.id, { ...c }));

    // 2. Compute transactions list based on mode
    const finalTransactions =
      importMode === 'REPLACE'
        ? [...importedTransactions]
        : [...importedTransactions, ...transactions];

    // 3. Recalculate customer spendings & remaining from scratch
    const customerSpendMap: Record<string, number> = {};
    const customerLastDateMap: Record<string, string> = {};

    finalTransactions.forEach(t => {
      if (t.type === 'SPEND' && t.status === 'COMPLETED') {
        customerSpendMap[t.customerId] = (customerSpendMap[t.customerId] || 0) + t.amount;
      } else if ((t.type === 'RECHARGE' || t.type === 'REFUND') && t.status === 'COMPLETED') {
        customerSpendMap[t.customerId] = Math.max((customerSpendMap[t.customerId] || 0) - t.amount, 0);
      }

      if (t.timestamp) {
        const datePart = t.timestamp.slice(0, 10);
        if (!customerLastDateMap[t.customerId] || datePart > customerLastDateMap[t.customerId]) {
          customerLastDateMap[t.customerId] = datePart;
        }
      }
    });

    const updatedCustomersList = Array.from(allCustomersMap.values()).map(c => {
      const used = customerSpendMap[c.id] || 0;
      const remaining = Math.max(c.totalBudget - used, 0);
      const burnRate = calculateBurnRate(used, c.totalBudget);
      const status = getCustomerStatusFromBurnRate(burnRate);

      return {
        ...c,
        usedPoints: used,
        remainingPoints: remaining,
        status,
        lastActivityDate: customerLastDateMap[c.id] || c.lastActivityDate,
      };
    });

    setCustomers(updatedCustomersList);
    setTransactions(finalTransactions);

    const totalImportedAmount = importedTransactions.reduce((acc, t) => acc + t.amount, 0);
    setToastMessage(
      `엑셀 파일에서 총 ${importedTransactions.length}건의 거래 내역 (${formatPoints(totalImportedAmount)})이 대시보드에 성공적으로 반영되었습니다.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Recalculate customer balances helper
  const recalculateCustomerBalances = (currentCustomers: Customer[], currentTransactions: Transaction[]): Customer[] => {
    const customerSpendMap: Record<string, number> = {};
    const customerLastDateMap: Record<string, string> = {};

    currentTransactions.forEach(t => {
      if (t.type === 'SPEND' && t.status === 'COMPLETED') {
        customerSpendMap[t.customerId] = (customerSpendMap[t.customerId] || 0) + t.amount;
      } else if ((t.type === 'RECHARGE' || t.type === 'REFUND') && t.status === 'COMPLETED') {
        customerSpendMap[t.customerId] = Math.max((customerSpendMap[t.customerId] || 0) - t.amount, 0);
      }

      if (t.timestamp) {
        const datePart = t.timestamp.slice(0, 10);
        if (!customerLastDateMap[t.customerId] || datePart > customerLastDateMap[t.customerId]) {
          customerLastDateMap[t.customerId] = datePart;
        }
      }
    });

    return currentCustomers.map(c => {
      const used = customerSpendMap[c.id] || 0;
      const remaining = Math.max(c.totalBudget - used, 0);
      const burnRate = calculateBurnRate(used, c.totalBudget);
      const status = getCustomerStatusFromBurnRate(burnRate);

      return {
        ...c,
        usedPoints: used,
        remainingPoints: remaining,
        status,
        lastActivityDate: customerLastDateMap[c.id] || c.lastActivityDate,
      };
    });
  };

  // Edit Transaction Handler
  const handleEditTransaction = (updatedTxn: Transaction) => {
    const newTxns = transactions.map(t => (t.id === updatedTxn.id ? updatedTxn : t));
    const newCustomers = recalculateCustomerBalances(customers, newTxns);
    setTransactions(newTxns);
    setCustomers(newCustomers);
    setToastMessage(`[${updatedTxn.merchant}] 실적 내역이 성공적으로 수정되었습니다.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (txnId: string) => {
    const targetTxn = transactions.find(t => t.id === txnId);
    const newTxns = transactions.filter(t => t.id !== txnId);
    const newCustomers = recalculateCustomerBalances(customers, newTxns);
    setTransactions(newTxns);
    setCustomers(newCustomers);
    setToastMessage(`[${targetTxn?.merchant || '선택한'}] 실적 내역이 삭제되었습니다.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Edit Customer Handler
  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === updatedCustomer.id) {
          const burnRate = calculateBurnRate(updatedCustomer.usedPoints, updatedCustomer.totalBudget);
          const status = getCustomerStatusFromBurnRate(burnRate);

          return {
            ...updatedCustomer,
            remainingPoints: Math.max(0, updatedCustomer.totalBudget - updatedCustomer.usedPoints),
            status,
          };
        }
        return c;
      })
    );
    setToastMessage(`[${updatedCustomer.name}] 회원 정보가 성공적으로 수정되었습니다.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Delete Customer Handler
  const handleDeleteCustomer = (customerId: string) => {
    const target = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setTransactions(prev => prev.filter(t => t.customerId !== customerId));
    setToastMessage(`[${target?.name || '회원'}] 회원 정보와 관련 거래 내역이 모두 삭제되었습니다.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const customerExportData = customers.map(c => ({
      회원ID: c.id,
      회원명: c.name,
      소속회사: c.company,
      부서: c.department,
      등급: c.tier,
      배정예산: c.totalBudget,
      사용실적: c.usedPoints,
      잔여포인트: c.remainingPoints,
      소진율: `${calculateBurnRate(c.usedPoints, c.totalBudget).toFixed(1)}%`,
      예산상태: c.status,
      최근활동일: c.lastActivityDate,
    }));
    exportToCSV(`회원별_포인트_예산_실적_${new Date().toISOString().slice(0, 10)}.csv`, customerExportData);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-4 duration-200 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold block text-sm text-emerald-300">엑셀 업로드 완료</span>
            <p className="text-slate-200 mt-0.5">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        onOpenAddTransaction={() => {
          setTargetCustomerForModal(null);
          setIsAddTransactionOpen(true);
        }}
        onOpenExcelUpload={() => setIsExcelUploadOpen(true)}
        onResetData={handleResetData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCustomersCount={customers.length}
        totalTransactionsCount={transactions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ================= TAB 1: 회원 등록 및 관리 (Member Management) ================= */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <MemberManagement
              customers={customers}
              onAddCustomer={handleSaveCustomer}
              onBatchAddCustomers={handleSaveBatchCustomers}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAdjustBudget={handleAdjustBudget}
            />
          </div>
        )}

        {/* ================= TAB 2: 예산관리 (Budget Management) ================= */}
        {activeTab === 'budget' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <BudgetDashboardView
              customers={customers}
              summary={summary}
              settings={settings}
              onSelectCustomer={cust => setSelectedCustomer(cust)}
              onOpenAddTransactionForCustomer={cust => {
                setTargetCustomerForModal(cust);
                setIsAddTransactionOpen(true);
              }}
              onOpenAdjustBudgetForCustomer={cust => {
                setTargetCustomerForModal(cust);
                setIsAdjustBudgetOpen(true);
              }}
            />
          </div>
        )}

        {/* ================= TAB 2: 실적관리 (Performance & Point Spending) ================= */}
        {activeTab === 'performance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Action Bar: 실적 엑셀 업로드 및 직접 등록 */}
            <div
              className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              id="performance-top-action-bar"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>포인트 실적 데이터 관리</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      실적 등록 및 업로드
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    대량 실적 엑셀 일괄 업로드 또는 개별 실적 건을 직접 시스템에 등록할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  id="btn-perf-excel-upload"
                  onClick={() => setIsExcelUploadOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>실적 엑셀 업로드</span>
                </button>

                <button
                  id="btn-perf-add-transaction"
                  onClick={() => {
                    setTargetCustomerForModal(null);
                    setIsAddTransactionOpen(true);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>실적 직접 등록</span>
                </button>
              </div>
            </div>

            {/* Visual Charts Overview */}
            <ChartsSection
              categories={CATEGORIES}
              customers={customers}
              transactions={transactions}
              selectedCategory={filterState.selectedCategory}
              onSelectCategory={handleCategoryChange}
              categorySpendingMap={categorySpendingMap}
            />

            {/* Organization Analytics Grid (조직별 포인트 사용 실적) */}
            <CategoryAnalyticsView
              categories={CATEGORIES}
              customers={customers}
              transactions={transactions}
              settings={settings}
              categorySpendingMap={categorySpendingMap}
              totalSpend={totalSpend}
              onSelectCategory={handleCategoryChange}
              onViewTransactionsOfCategory={catId => {
                handleCategoryChange(catId);
              }}
              onSelectCustomer={cust => setSelectedCustomer(cust)}
            />

            {/* Real-time Transactions & Logs Table */}
            <TransactionHistoryTable
              transactions={filteredTransactions}
              categories={CATEGORIES}
              customers={customers}
              onSelectCustomerByName={name => {
                const matched = customers.find(c => c.name === name);
                if (matched) setSelectedCustomer(matched);
              }}
              onFilterByCategory={catId => handleCategoryChange(catId as CategoryId)}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        )}

        {/* ================= TAB 3: 설정 (System & Policy Settings) ================= */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={newSet => {
              setSettings(newSet);
              setToastMessage('시스템 및 운영 정책 설정이 저장되었습니다.');
              setTimeout(() => setToastMessage(null), 4000);
            }}
            customers={customers}
            onAddCustomer={handleSaveCustomer}
            onBatchAddCustomers={handleSaveBatchCustomers}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onOpenExcelUpload={() => setIsExcelUploadOpen(true)}
            onResetData={handleResetData}
            onExportCSV={handleExportCSV}
            totalCustomers={customers.length}
            totalTransactions={transactions.length}
          />
        )}
      </main>

      {/* Modals */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          categories={CATEGORIES}
          transactions={transactions}
          onClose={() => setSelectedCustomer(null)}
          onOpenAddTransaction={cust => {
            setTargetCustomerForModal(cust);
            setIsAddTransactionOpen(true);
          }}
          onOpenAdjustBudget={cust => {
            setTargetCustomerForModal(cust);
            setIsAdjustBudgetOpen(true);
          }}
        />
      )}

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => {
          setIsAddTransactionOpen(false);
          setTargetCustomerForModal(null);
        }}
        customers={customers}
        targetCustomer={targetCustomerForModal}
        onSaveTransaction={handleSaveTransaction}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSaveCustomer={handleSaveCustomer}
        onSaveBatchCustomers={handleSaveBatchCustomers}
      />

      <BudgetAdjustModal
        isOpen={isAdjustBudgetOpen}
        customer={targetCustomerForModal}
        onClose={() => {
          setIsAdjustBudgetOpen(false);
          setTargetCustomerForModal(null);
        }}
        onAdjustBudget={handleAdjustBudget}
      />

      <ExcelUploadModal
        isOpen={isExcelUploadOpen}
        onClose={() => setIsExcelUploadOpen(false)}
        existingCustomers={customers}
        categories={CATEGORIES}
        onImportComplete={handleExcelImport}
      />
    </div>
  );
}
