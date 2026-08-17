/**
 * Cloudflare D1 への保存リポジトリ（クライアント側）。
 *
 * 実際の書き込みは Pages Functions（functions/api/diagnoses.ts）が行い、
 * ここは保存APIを呼ぶだけに徹する。UI・診断ロジックからは独立している。
 *
 * 注意: 氏名・電話番号を console へ出力しないこと。
 */
import { API_ENDPOINT, API_TIMEOUT_MS } from '../config/app';
import type { DiagnosisRecord } from '../types/diagnosis';
import { buildDiagnosisPayload, type DiagnosisRepository } from './repository';

export class D1DiagnosisRepository implements DiagnosisRepository {
  constructor(private readonly endpoint: string = API_ENDPOINT) {}

  async save(record: DiagnosisRecord): Promise<void> {
    const payload = buildDiagnosisPayload(record);
    // リード情報が未取得の段階では D1 へ保存しない
    if (!payload) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        // レスポンス本文には個人情報が含まれないためステータスのみ扱う
        throw new Error(`save failed: ${response.status}`);
      }
    } finally {
      window.clearTimeout(timer);
    }
  }
}

let remoteRepository: DiagnosisRepository = new D1DiagnosisRepository();

export function getRemoteRepository(): DiagnosisRepository {
  return remoteRepository;
}

/** 保存先を差し替える（テスト・別バックエンドへの移行用） */
export function setRemoteRepository(next: DiagnosisRepository): void {
  remoteRepository = next;
}
