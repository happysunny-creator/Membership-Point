import { Customer, SystemSettings, Transaction } from '../types';

const STORAGE_KEY = 'membership-point-dashboard:data:v1';

export interface PersistedState {
  customers: Customer[];
  transactions: Transaction[];
  settings: SystemSettings;
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.customers) || !Array.isArray(parsed.transactions) || !parsed.settings) {
      return null;
    }
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently skip, in-memory state still works for this session.
  }
}

// 이 앱은 데이터를 각 PC의 localStorage에만 저장한다(서버/공유 저장소 없음). 다른 PC에서
// 똑같은 화면을 보려면 회원·거래내역·설정을 통째로 담은 백업 파일 하나를 내려받아 전달하고,
// 받는 쪽에서 그대로 불러오면 된다(엑셀 내보내기는 회원/실적만 담기고 조직 우선순위·단계
// 기준 같은 설정은 빠지므로, 완전히 동일한 상태를 넘기려면 이 백업 파일을 사용해야 한다).
interface BackupFile extends PersistedState {
  exportedAt: string;
  version: 1;
}

export function downloadBackupFile(state: PersistedState): void {
  const backup: BackupFile = { ...state, exportedAt: new Date().toISOString(), version: 1 };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `멤버십포인트_전체데이터_백업_${dateStr}.json`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<PersistedState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (
          !parsed ||
          !Array.isArray(parsed.customers) ||
          !Array.isArray(parsed.transactions) ||
          !parsed.settings ||
          typeof parsed.settings !== 'object'
        ) {
          reject(new Error('올바른 백업 파일 형식이 아닙니다. (회원/거래내역/설정 정보를 찾을 수 없습니다)'));
          return;
        }
        resolve({ customers: parsed.customers, transactions: parsed.transactions, settings: parsed.settings });
      } catch {
        reject(new Error('백업 파일을 읽을 수 없습니다. 손상되었거나 JSON 형식이 아닙니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
    reader.readAsText(file);
  });
}
