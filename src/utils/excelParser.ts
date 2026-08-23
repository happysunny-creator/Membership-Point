import * as XLSX from 'xlsx';
import { Category, CategoryId, Customer, CustomerStatus, OrgCategory, Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../data/mockData';
import { calculateBurnRate } from './formatters';
import { separateNameAndPosition } from './nameParser';

export interface ParsedExcelRow {
  index: number;
  company: string;
  department: string;
  customerName: string;
  position: string;
  categoryId: CategoryId;
  categoryName: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  description: string;
  timestamp: string;
  orderNumber: string;
  isValid: boolean;
  validationMessage?: string;
  existingCustomerId?: string;
}

export interface ExcelImportResult {
  rows: ParsedExcelRow[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  totalPoints: number;
  fileName: string;
}

// Helper to map category from Korean text/English text
export function mapTextToCategory(text: string): { id: CategoryId; name: string } {
  if (!text) return { id: 'shopping', name: '온라인쇼핑 / 커머스' };
  const clean = text.toLowerCase().replace(/\s+/g, '');

  if (clean.includes('식음') || clean.includes('카페') || clean.includes('식대') || clean.includes('f&b') || clean.includes('외식') || clean.includes('음식')) {
    return { id: 'fnb', name: '식음료 / F&B / 회식' };
  }
  if (clean.includes('문화') || clean.includes('공연') || clean.includes('영화') || clean.includes('티켓') || clean.includes('전시')) {
    return { id: 'culture', name: '문화 / 여가 / 공연' };
  }
  if (clean.includes('여행') || clean.includes('숙박') || clean.includes('호텔') || clean.includes('항공') || clean.includes('출장')) {
    return { id: 'travel', name: '여행 / 출장 / 숙박' };
  }
  if (clean.includes('교육') || clean.includes('도서') || clean.includes('강의') || clean.includes('자기계발') || clean.includes('학원') || clean.includes('책')) {
    return { id: 'education', name: '교육 / 도서 / 자기계발' };
  }
  if (clean.includes('교통') || clean.includes('주유') || clean.includes('차량') || clean.includes('택시') || clean.includes('하이패스') || clean.includes('카카오t')) {
    return { id: 'transport', name: '교통 / 차량 / 모빌리티' };
  }
  if (clean.includes('헬스') || clean.includes('의료') || clean.includes('병원') || clean.includes('검진') || clean.includes('운동') || clean.includes('필라테스')) {
    return { id: 'health', name: '헬스 / 의료 / 웰니스' };
  }
  if (clean.includes('디지털') || clean.includes('it') || clean.includes('구독') || clean.includes('소프트웨어') || clean.includes('클라우드')) {
    return { id: 'digital', name: 'IT / 디지털 / 구독서비스' };
  }
  return { id: 'shopping', name: '온라인쇼핑 / 커머스' };
}

// Helper to map transaction type
export function mapTextToTransactionType(text: string): TransactionType {
  if (!text) return 'SPEND';
  const clean = text.toLowerCase().replace(/\s+/g, '');
  if (clean.includes('충전') || clean.includes('적립') || clean.includes('recharge')) return 'RECHARGE';
  if (clean.includes('취소') || clean.includes('환불') || clean.includes('refund')) return 'REFUND';
  if (clean.includes('배정') || clean.includes('할당') || clean.includes('allocation')) return 'BUDGET_ALLOCATION';
  return 'SPEND';
}

// Parse Excel file buffer or ArrayBuffer
export async function parseExcelFile(file: File, existingCustomers: Customer[]): Promise<ExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          resolve({
            rows: [],
            totalRows: 0,
            validRowsCount: 0,
            invalidRowsCount: 0,
            totalPoints: 0,
            fileName: file.name,
          });
          return;
        }

        const parsedRows: ParsedExcelRow[] = [];
        let totalPoints = 0;

        jsonRows.forEach((row, idx) => {
          // Normalize keys (trim whitespace and lowercase)
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.trim().toLowerCase()] = row[k];
          });

          // Extract fields flexibly according to specified format
          const company =
            normalizedRow['조직명'] ||
            normalizedRow['회사'] ||
            normalizedRow['회사명'] ||
            normalizedRow['기업명'] ||
            normalizedRow['조직'] ||
            normalizedRow['company'] ||
            normalizedRow['organization'] ||
            '';

          const department =
            normalizedRow['소속'] ||
            normalizedRow['소속부서'] ||
            normalizedRow['부서'] ||
            normalizedRow['본부'] ||
            normalizedRow['팀'] ||
            normalizedRow['department'] ||
            '';

          const customerName =
            normalizedRow['성함'] ||
            normalizedRow['회원명'] ||
            normalizedRow['고객명'] ||
            normalizedRow['이름'] ||
            normalizedRow['성명'] ||
            normalizedRow['회원'] ||
            normalizedRow['고객'] ||
            normalizedRow['customer'] ||
            normalizedRow['customername'] ||
            normalizedRow['name'] ||
            '';

          const position =
            normalizedRow['직책'] ||
            normalizedRow['직급'] ||
            normalizedRow['직위'] ||
            normalizedRow['직함'] ||
            normalizedRow['position'] ||
            normalizedRow['title'] ||
            '';

          const dateRaw =
            normalizedRow['사용날짜'] ||
            normalizedRow['사용일자'] ||
            normalizedRow['날짜'] ||
            normalizedRow['일자'] ||
            normalizedRow['일시'] ||
            normalizedRow['거래일시'] ||
            normalizedRow['거래일'] ||
            normalizedRow['date'] ||
            normalizedRow['timestamp'] ||
            '';

          const merchant =
            normalizedRow['사용처'] ||
            normalizedRow['가맹점'] ||
            normalizedRow['가맹점명'] ||
            normalizedRow['사용장소'] ||
            normalizedRow['상호명'] ||
            normalizedRow['merchant'] ||
            normalizedRow['store'] ||
            '';

          const amountRaw =
            normalizedRow['사용금액'] ||
            normalizedRow['금액'] ||
            normalizedRow['포인트'] ||
            normalizedRow['사용액'] ||
            normalizedRow['사용포인트'] ||
            normalizedRow['결제금액'] ||
            normalizedRow['amount'] ||
            normalizedRow['points'] ||
            0;

          const categoryRaw =
            normalizedRow['카테고리'] ||
            normalizedRow['분류'] ||
            normalizedRow['항목'] ||
            normalizedRow['category'] ||
            '';

          const typeRaw =
            normalizedRow['구분'] ||
            normalizedRow['거래구분'] ||
            normalizedRow['거래유형'] ||
            normalizedRow['유형'] ||
            normalizedRow['type'] ||
            '사용';

          const description =
            normalizedRow['내용'] ||
            normalizedRow['적요'] ||
            normalizedRow['상세내용'] ||
            normalizedRow['설명'] ||
            normalizedRow['비고'] ||
            normalizedRow['description'] ||
            '';

          const orderNumber =
            normalizedRow['주문번호'] ||
            normalizedRow['거래번호'] ||
            normalizedRow['orderno'] ||
            normalizedRow['order_number'] ||
            `IMP-${Date.now().toString().slice(-6)}-${idx + 1}`;

          // Clean amount
          let numericAmount = 0;
          if (typeof amountRaw === 'number') {
            numericAmount = Math.abs(amountRaw);
          } else if (typeof amountRaw === 'string') {
            const cleanStr = amountRaw.replace(/[^0-9.-]/g, '');
            numericAmount = Math.abs(parseFloat(cleanStr)) || 0;
          }

          // Format timestamp
          let formattedDate = '';
          if (dateRaw instanceof Date) {
            const y = dateRaw.getFullYear();
            const m = String(dateRaw.getMonth() + 1).padStart(2, '0');
            const d = String(dateRaw.getDate()).padStart(2, '0');
            const hh = String(dateRaw.getHours()).padStart(2, '0');
            const mm = String(dateRaw.getMinutes()).padStart(2, '0');
            formattedDate = `${y}-${m}-${d} ${hh}:${mm}`;
          } else if (typeof dateRaw === 'string' && dateRaw.trim()) {
            formattedDate = dateRaw.trim();
          } else {
            const now = new Date();
            formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          }

          const categoryMeta = mapTextToCategory(categoryRaw || merchant || description);
          const txnType = mapTextToTransactionType(typeRaw);

          // Cleanly separate name and position if combined (e.g. "김민수 이사", "김민수(이사)")
          const { name: separatedCustomerName, position: separatedPosition } = separateNameAndPosition(
            customerName,
            position
          );

          // Find existing customer by name
          const matchedCustomer = existingCustomers.find(
            c => c.name.toLowerCase().trim() === separatedCustomerName.toLowerCase().trim()
          );

          // Validation
          let isValid = true;
          let validationMessage = '';

          if (!separatedCustomerName || separatedCustomerName.trim() === '') {
            isValid = false;
            validationMessage = '성함(회원명)이 누락되었습니다.';
          } else if (numericAmount <= 0) {
            isValid = false;
            validationMessage = '사용금액이 0보다 커야 합니다.';
          }

          if (isValid) {
            totalPoints += numericAmount;
          }

          parsedRows.push({
            index: idx + 1,
            company: String(company).trim() || (matchedCustomer ? matchedCustomer.company : '기타'),
            department: String(department).trim() || (matchedCustomer ? matchedCustomer.department : '일반부서'),
            customerName: separatedCustomerName,
            position: separatedPosition || (matchedCustomer?.position || '직원'),
            categoryId: categoryMeta.id,
            categoryName: categoryMeta.name,
            amount: numericAmount,
            type: txnType,
            merchant: String(merchant).trim() || '지정 가맹점',
            description: String(description).trim() || `${categoryMeta.name} 포인트 사용`,
            timestamp: formattedDate,
            orderNumber: String(orderNumber).trim(),
            isValid,
            validationMessage,
            existingCustomerId: matchedCustomer?.id,
          });
        });

        const validRowsCount = parsedRows.filter(r => r.isValid).length;
        const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;

        resolve({
          rows: parsedRows,
          totalRows: parsedRows.length,
          validRowsCount,
          invalidRowsCount,
          totalPoints,
          fileName: file.name,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Generate Downloadable Template XLSX
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      조직명: '(주)에이스테크놀로지',
      소속: '전략기획본부',
      성함: '김민수',
      직책: '이사',
      사용날짜: '2026-08-18',
      사용처: '쿠팡 로켓와우',
      사용금액: 150000,
    },
    {
      조직명: '글로벌솔루션즈',
      소속: 'AI 플랫폼 R&D 센터',
      성함: '이지은',
      직책: '수석연구원',
      사용날짜: '2026-08-18',
      사용처: '스타벅스 코리아',
      사용금액: 45000,
    },
    {
      조직명: '넥스트커머스인터내셔널',
      소속: '글로벌마케팅본부',
      성함: '최유진',
      직책: '본부장',
      사용날짜: '2026-08-17',
      사용처: '신라호텔',
      사용금액: 420000,
    },
    {
      조직명: '네오모빌리티(주)',
      소속: '자율주행기술팀',
      성함: '박상현',
      직책: '책임연구원',
      사용날짜: '2026-08-16',
      사용처: '인프런',
      사용금액: 88000,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 24 }, // 조직명
    { wch: 22 }, // 소속
    { wch: 14 }, // 성함
    { wch: 14 }, // 직책
    { wch: 16 }, // 사용날짜
    { wch: 22 }, // 사용처
    { wch: 16 }, // 사용금액
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '포인트사용실적양식');

  XLSX.writeFile(wb, '포인트_사용실적_업로드_양식.xlsx');
}

export interface ParsedCustomerRow {
  index: number;
  company: string;
  department: string;
  name: string;
  position: string;
  manager: string;
  budget: number;
  notes: string;
  isValid: boolean;
  validationMessage?: string;
}

export interface CustomerExcelImportResult {
  rows: ParsedCustomerRow[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  totalBudget: number;
  fileName: string;
}

// Generate Customer Registration Template XLSX
export function downloadCustomerExcelTemplate(): void {
  const templateData = [
    {
      조직명: '경영지원본부',
      소속: '인사총무팀',
      성함: '김민수',
      직책: '팀장',
      담당자: '박운영',
      금액: 5000000,
      비고및관리메모: '2026 하반기 부서 복지 및 워크숍 포인트 배정',
    },
    {
      조직명: '전략기획본부',
      소속: '경영기획실',
      성함: '이지은',
      직책: '수석연구원',
      담당자: '정운영',
      금액: 8000000,
      비고및관리메모: '전략 프로젝트 우수 성과 리워드 배정',
    },
    {
      조직명: 'DT·플랫폼사업부',
      소속: '플랫폼개발팀',
      성함: '박준호',
      직책: '팀장',
      담당자: '김운영',
      금액: 6000000,
      비고및관리메모: '개발팀 직무도서 및 디지털 교육 지원',
    },
    {
      조직명: '미래기술R&D센터',
      소속: 'AI연구개발팀',
      성함: '정우진',
      직책: '책임연구원',
      담당자: '박운영',
      금액: 7500000,
      비고및관리메모: 'AI 모델 연구 및 글로벌 컨퍼런스 포인트',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 24 }, // 조직명
    { wch: 22 }, // 소속
    { wch: 14 }, // 성함
    { wch: 14 }, // 직책
    { wch: 18 }, // 담당자
    { wch: 16 }, // 금액
    { wch: 40 }, // 비고및관리메모
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '회원일괄등록양식');

  XLSX.writeFile(wb, '회원_일괄등록_양식.xlsx');
}

// Parse Customer Registration Excel File
export async function parseCustomerExcelFile(file: File): Promise<CustomerExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          throw new Error('엑셀 파일에 시트가 존재하지 않습니다.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('엑셀 시트에 데이터가 비어있습니다.');
        }

        const parsedRows: ParsedCustomerRow[] = [];

        rawJson.forEach((row, index) => {
          // Flexible key lookup
          const getVal = (keys: string[]): string => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                key => key.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, '')
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const company = getVal(['조직명', '회사', '기업', '기업명', '조직', 'organization', 'company']);
          const department = getVal(['소속', '소속부서', '부서', '본부', '팀', 'department', 'team', 'division']);
          const rawName = getVal(['성함', '회원명', '고객명', '이름', '성명', '회원', '고객', 'name']);
          const rawPosition = getVal(['직책', '직급', '직위', '직함', 'position', 'title', 'role']);
          const { name, position } = separateNameAndPosition(rawName, rawPosition);
          const manager = getVal(['비서(담당자)', '비서', '담당비서', '비서담당자', '담당자', '관리자', '운영자', '배정자', 'secretary', 'assistant', 'manager', 'admin']);
          const budgetRaw = getVal(['금액', '배정금액', '포인트', '배정포인트', '예산', 'budget', 'amount', 'points']);
          const notes = getVal(['비고및관리메모', '비고', '메모', '관리메모', '특이사항', 'notes', 'memo', 'comment']);

          let budget = 0;
          if (budgetRaw) {
            const cleanNum = String(budgetRaw).replace(/[^0-9.-]+/g, '');
            budget = parseFloat(cleanNum) || 0;
          }

          let isValid = true;
          let validationMessage = '';

          if (!company) {
            isValid = false;
            validationMessage = '조직명 누락';
          } else if (!name) {
            isValid = false;
            validationMessage = '성함 누락';
          } else if (budget <= 0) {
            isValid = false;
            validationMessage = '배정 금액(포인트)이 0 이하이거나 올바르지 않음';
          }

          parsedRows.push({
            index: index + 1,
            company: company || '미지정 조직',
            department: department || '일반부서',
            name: name || `회원-${index + 1}`,
            position: position || '',
            manager: manager || '운영관리팀',
            budget: budget,
            notes: notes || '',
            isValid,
            validationMessage: isValid ? undefined : validationMessage,
          });
        });

        const validRowsCount = parsedRows.filter(r => r.isValid).length;
        const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;
        const totalBudget = parsedRows.reduce((sum, r) => sum + (r.isValid ? r.budget : 0), 0);

        resolve({
          rows: parsedRows,
          totalRows: parsedRows.length,
          validRowsCount,
          invalidRowsCount,
          totalBudget,
          fileName: file.name,
        });
      } catch (err: any) {
        reject(new Error(err.message || '엑셀 파일 파싱 중 오류가 발생했습니다.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Org Category Excel Interfaces & Functions
export interface ParsedOrgCategoryRow {
  index: number;
  company: string;
  department: string;
  categoryName: string;
  categoryCode: string;
  allocatedBudget: number;
  description: string;
  isActive: boolean;
  isValid: boolean;
  validationMessage?: string;
}

export interface OrgCategoryExcelImportResult {
  rows: ParsedOrgCategoryRow[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  fileName: string;
}

// Download Org Category Excel Template
export function downloadOrgCategoryExcelTemplate() {
  const templateData = [
    {
      조직명: '현대자동차 연구소',
      '소속(부서)': '자율주행선행개발팀',
      카테고리명: '식음료 / 회식비',
      카테고리코드: 'FNB-HD-01',
      배정예산: 5000000,
      비고: '부서 회식 및 카페/다과 포인트 지원',
      사용여부: 'Y',
    },
    {
      조직명: '현대자동차 연구소',
      '소속(부서)': '자율주행선행개발팀',
      카테고리명: '연구 도서 / 기술교육',
      카테고리코드: 'EDU-HD-02',
      배정예산: 3000000,
      비고: '전문 서적 및 해외 컨퍼런스 참가비',
      사용여부: 'Y',
    },
    {
      조직명: '(주)에이스테크놀로지',
      '소속(부서)': '경영전략본부',
      카테고리명: '임직원 복지 / 선물',
      카테고리코드: 'WELL-ACE-01',
      배정예산: 10000000,
      비고: '명절 선물 및 온라인쇼핑 바우처',
      사용여부: 'Y',
    },
    {
      조직명: '삼성바이오로직스 협력단',
      '소속(부서)': '품질검증1팀',
      카테고리명: '종합건강검진 / 헬스케어',
      카테고리코드: 'HLTH-SB-01',
      배정예산: 6000000,
      비고: '협력단 전용 정밀검진 및 웰니스 지원',
      사용여부: 'Y',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 24 }, // 조직명
    { wch: 22 }, // 소속(부서)
    { wch: 24 }, // 카테고리명
    { wch: 18 }, // 카테고리코드
    { wch: 16 }, // 배정예산
    { wch: 36 }, // 비고
    { wch: 12 }, // 사용여부
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '조직별카테고리양식');
  XLSX.writeFile(wb, '조직별_카테고리_업로드양식.xlsx');
}

// Parse Org Category Excel File
export async function parseOrgCategoryExcelFile(file: File): Promise<OrgCategoryExcelImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          throw new Error('엑셀 파일에 시트가 존재하지 않습니다.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('엑셀 시트에 데이터가 비어있습니다.');
        }

        const parsedRows: ParsedOrgCategoryRow[] = [];

        rawJson.forEach((row, index) => {
          const getVal = (keys: string[]): string => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                key => key.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, '')
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const company = getVal(['조직명', '회사', '기업', '기업명', '조직', 'company', 'organization']);
          const department = getVal(['소속(부서)', '소속', '소속부서', '부서', '본부', '팀', 'department', 'team']);
          const categoryName = getVal(['카테고리명', '카테고리', '항목명', '항목', 'category', 'categoryname', 'name']);
          const categoryCode = getVal(['카테고리코드', '코드', 'code', 'categorycode']);
          const budgetRaw = getVal(['배정예산', '예산', '배정포인트', '포인트', 'budget', 'amount']);
          const description = getVal(['비고', '설명', '메모', '비고및설명', 'description', 'notes', 'memo']);
          const activeRaw = getVal(['사용여부', '사용', '상태', 'active', 'isactive']);

          let allocatedBudget = 0;
          if (budgetRaw) {
            const cleanNum = String(budgetRaw).replace(/[^0-9.-]+/g, '');
            allocatedBudget = parseFloat(cleanNum) || 0;
          }

          const isActive = !activeRaw || activeRaw.toUpperCase() === 'Y' || activeRaw === '사용' || activeRaw === 'true' || activeRaw === 'TRUE';

          let isValid = true;
          let validationMessage = '';

          if (!company) {
            isValid = false;
            validationMessage = '조직명 누락';
          } else if (!categoryName) {
            isValid = false;
            validationMessage = '카테고리명 누락';
          }

          parsedRows.push({
            index: index + 1,
            company: company || '미지정 조직',
            department: department || '전체 부서',
            categoryName: categoryName || `카테고리-${index + 1}`,
            categoryCode: categoryCode || `CAT-${Date.now().toString().slice(-4)}-${index + 1}`,
            allocatedBudget,
            description: description || '',
            isActive,
            isValid,
            validationMessage: isValid ? undefined : validationMessage,
          });
        });

        const validRowsCount = parsedRows.filter(r => r.isValid).length;
        const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;

        resolve({
          rows: parsedRows,
          totalRows: parsedRows.length,
          validRowsCount,
          invalidRowsCount,
          fileName: file.name,
        });
      } catch (err: any) {
        reject(new Error(err.message || '엑셀 파일 파싱 중 오류가 발생했습니다.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
    };

    reader.readAsArrayBuffer(file);
  });
}


