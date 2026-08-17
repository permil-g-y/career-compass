/**
 * localStorage 版リポジトリ（MVP用）
 *
 * 保存先が確定した段階で、このファイルと同じインターフェースを実装した
 * SupabaseDiagnosisRepository 等へ差し替える。
 */
import type { DiagnosisRecord } from '../types/diagnosis';
import type { DiagnosisRepository } from './repository';

const STORAGE_KEY = 'career_compass_diagnoses';

export class LocalStorageDiagnosisRepository implements DiagnosisRepository {
  async save(record: DiagnosisRecord): Promise<void> {
    const records = await this.list();
    const index = records.findIndex((r) => r.diagnosis_id === record.diagnosis_id);
    if (index >= 0) records[index] = record;
    else records.push(record);
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

let repository: DiagnosisRepository = new LocalStorageDiagnosisRepository();

export function getRepository(): DiagnosisRepository {
  return repository;
}

/** DB接続時はここで実装を差し替える */
export function setRepository(next: DiagnosisRepository): void {
  repository = next;
}
