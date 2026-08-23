export type CustomerTier = 'VIP' | 'Gold' | 'Silver' | 'Bronze' | 'Corporate';

export type PointUsageStage = 'STAGE_0_30' | 'STAGE_30_50' | 'STAGE_50_70' | 'STAGE_70_PLUS';

export type CustomerStatus =
  | 'STAGE_0_30'
  | 'STAGE_30_50'
  | 'STAGE_50_70'
  | 'STAGE_70_PLUS'
  | 'ACTIVE'
  | 'WARNING'
  | 'PERFECT'
  | 'OVER_BUDGET'
  | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  position?: string; // 직책
  email: string;
  phone: string;
  company: string;
  department: string;
  manager?: string; // 담당자
  tier: CustomerTier;
  totalBudget: number; // Total allocated point budget
  usedPoints: number;  // Used points to date
  remainingPoints: number; // Remaining points
  status: CustomerStatus;
  joinedDate: string;
  lastActivityDate: string;
  notes?: string;
  avatarColor: string;
}

export type CategoryId =
  | 'shopping'
  | 'fnb'
  | 'culture'
  | 'travel'
  | 'education'
  | 'health'
  | 'transport'
  | 'digital';

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  targetBudgetRatio: number; // Suggested % distribution
}

export interface OrgCategory {
  id: string;
  company: string;          // 조직명 (예: 현대자동차)
  department?: string;      // 소속(부서)
  categoryName: string;     // 카테고리명 (예: 식음료/외식, 사무복지, 출장경비)
  categoryCode?: string;    // 코드 (예: FNB-01)
  allocatedBudget?: number; // 배정 예산 (P)
  description?: string;     // 비고 및 설명
  isActive: boolean;        // 사용 여부
  updatedAt: string;        // 최종 수정일
}

export type TransactionType = 'SPEND' | 'RECHARGE' | 'REFUND' | 'BUDGET_ALLOCATION';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerDepartment?: string;
  customerPosition?: string;
  type: TransactionType;
  amount: number; // Positive for spent, positive for recharge
  categoryId: CategoryId;
  categoryName: string;
  description: string;
  merchant: string;
  orderNumber: string;
  timestamp: string;
  status: TransactionStatus;
  paymentMethod?: string;
  receiptUrl?: string;
}

export type DateRangePreset = 'all' | 'today' | 'this_month' | 'last_3_months' | 'year_2026';

export type MainTab = 'members' | 'budget' | 'performance' | 'settings';

export interface SystemSettings {
  stage1MaxPercent: number; // 0% ~ 30% (빨간색 - 1단계)
  stage2MaxPercent: number; // 30% ~ 50% (주황색 - 2단계)
  stage3MaxPercent: number; // 50% ~ 70% (초록색 - 3단계)
  warningThresholdPercent?: number; // legacy compatibility
  perfectThresholdPercent?: number; // legacy compatibility
  dangerThresholdPercent?: number;  // legacy compatibility
  defaultTierBudgets: Record<CustomerTier, number>;
  companyName: string;
  currencyUnit: string;
  enableAutoAlerts: boolean;
  enableAutoCustomerCreation: boolean;
  orgPriorityOrder?: string[]; // Custom display order for organizations (company names, in order)
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: CategoryId | 'all';
  selectedCustomer: string | 'all';
  selectedTier: CustomerTier | 'all';
  selectedStatus: CustomerStatus | 'all';
  selectedType: TransactionType | 'all';
  dateRange: DateRangePreset;
  sortBy: 'budget' | 'used' | 'remaining' | 'burnRate' | 'name' | 'date';
  sortOrder: 'asc' | 'desc';
}

export interface BudgetSummary {
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  overallBurnRate: number;
  totalCustomers: number;
  stage1Count: number; // 0%~30% (빨간색)
  stage2Count: number; // 30%~50% (주황색)
  stage3Count: number; // 50%~70% (초록색)
  stage4Count: number; // 70% 이상 (보라색)
  activeCustomers?: number;
  warningCustomers?: number;
  overBudgetCustomers?: number;
}
