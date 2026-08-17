/**
 * localStorage 版リポジトリ（端末内での診断回答・結果の保持用）
 *
 * 個人情報の方針:
 * 氏名・電話番号は localStorage へ保存しない。
 * 呼び出し側がリード情報付きのレコードを渡してきた場合でも、
 * この保存境界で必ず除去してから書き込む（多重防御）。
 * 氏名・電話番号の永続化先は Cloudflare D1 のみとする。
 */
import type { DiagnosisRecord } from '../types/diagnosis';
import type { DiagnosisRepository } from './repository';

const STORAGE_KEY = 'career_compass_diagnoses';

/** 保存前に個人情報を取り除く */
function stripPersonalInfo(record: DiagnosisRecord): DiagnosisRecord {
  return { ...record, lead: null };
}

export class LocalStorageDiagnosisRepository implements DiagnosisRepository {
  async save(record: DiagnosisRecord): Promise<void> {
    const safeRecord = stripPersonalInfo(record);
    const records = await this.list();
    const index = records.findIndex((r) => r.diagnosis_id === safeRecord.diagnosis_id);
    if (index >= 0) records[index] = safeRecord;
    else records.push(safeRecord);
    this.write(records);
  }

  async list(): Promise<DiagnosisRecord[]> {
    const raw = this.read();
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as DiagnosisRecord[]) : [];
    } catch {
      return [];
    }
  }

  /**
   * 旧バージョンが localStorage へ保存してしまった氏名・電話番号を削除する。
   * アプリ起動時に一度だけ実行する。
   */
  async purgeLegacyPersonalInfo(): Promise<void> {
    const records = await this.list();
    if (!records.some((r) => r.lead !== null && r.lead !== undefined)) return;
    this.write(records.map(stripPersonalInfo));
  }

  private read(): string | null {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // プライベートブラウジング等で localStorage が使えない場合も診断は継続させる
      return null;
    }
  }

  private write(records: DiagnosisRecord[]): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      /* 保存できなくても診断体験は止めない */
    }
  }
}

const localRepository = new LocalStorageDiagnosisRepository();

let repository: DiagnosisRepository = localRepository;

export function getRepository(): DiagnosisRepository {
  return repository;
}

/** 旧バージョンが保存した個人情報の削除（起動時に実行する） */
export function purgeLegacyPersonalInfo(): void {
  void localRepository.purgeLegacyPersonalInfo();
}

/** DB接続時はここで実装を差し替える */
export function setRepository(next: DiagnosisRepository): void {
  repository = next;
}
