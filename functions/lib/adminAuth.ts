/**
 * 管理画面（/admin・/api/admin/*）の認証。
 *
 * Cloudflare Access で保護されている前提とし、Access が付与する JWT
 * （Cf-Access-Jwt-Assertion ヘッダー / CF_Authorization クッキー）を
 * サーバー側で必ず検証する。
 *
 * 方針:
 * - 検証に必要な設定が無い場合は「拒否」する（fail-closed）。
 *   設定漏れで管理APIが素通りする状態を作らない。
 * - 例外はローカル開発のみ。ADMIN_DEV_BYPASS=true かつ localhost の場合に限り迂回する。
 * - 失敗理由はクライアントへ返さない（内部構造の推測材料を与えない）。
 */
import type { Env } from '../types';

export interface AdminIdentity {
  /** Cloudflare Access が検証したメールアドレス（取得できない場合は null） */
  email: string | null;
}

export type AuthResult =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; reason: 'unconfigured' | 'unauthenticated' };

/** JWT の許容時刻ずれ（秒） */
const CLOCK_SKEW_SEC = 60;

/** 公開鍵のキャッシュ保持時間（ms） */
const CERTS_TTL_MS = 10 * 60 * 1000;

interface CertsCache {
  certsUrl: string;
  fetchedAt: number;
  keys: Map<string, CryptoKey>;
}

/** isolate 内での公開鍵キャッシュ（毎リクエストの JWKS 取得を避ける） */
let certsCache: CertsCache | null = null;

/** チーム名 / ドメイン / URL のいずれで設定されても team domain へ正規化する */
export function normalizeTeamDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!value.includes('.')) value = `${value}.cloudflareaccess.com`;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value)) return null;
  return value;
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** WebCrypto へ渡すため ArrayBuffer へ詰め替える */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
  try {
    const text = new TextDecoder().decode(base64UrlDecode(segment));
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface JsonWebKey_ {
  kid?: string;
  kty?: string;
  alg?: string;
  n?: string;
  e?: string;
}

async function loadKeys(teamDomain: string, forceRefresh: boolean): Promise<Map<string, CryptoKey>> {
  const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;
  const fresh =
    certsCache &&
    certsCache.certsUrl === certsUrl &&
    Date.now() - certsCache.fetchedAt < CERTS_TTL_MS;
  if (fresh && !forceRefresh && certsCache) return certsCache.keys;

  const response = await fetch(certsUrl, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('certs fetch failed');
  const body = (await response.json()) as { keys?: JsonWebKey_[] };
  const keys = new Map<string, CryptoKey>();

  for (const jwk of body.keys ?? []) {
    if (!jwk.kid || jwk.kty !== 'RSA' || !jwk.n || !jwk.e) continue;
    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      keys.set(jwk.kid, key);
    } catch {
      // 読み込めない鍵は無視する（他の鍵で検証できる場合がある）
    }
  }

  certsCache = { certsUrl, fetchedAt: Date.now(), keys };
  return keys;
}

/** リクエストから Access の JWT を取り出す */
function extractToken(request: Request): string | null {
  const header = request.headers.get('cf-access-jwt-assertion');
  if (header && header.trim()) return header.trim();

  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.split('=');
    if (name?.trim() === 'CF_Authorization') {
      const value = rest.join('=').trim();
      if (value) return value;
    }
  }
  return null;
}

function audienceMatches(aud: unknown, expected: string): boolean {
  if (typeof aud === 'string') return aud === expected;
  if (Array.isArray(aud)) return aud.some((value) => value === expected);
  return false;
}

/** Access JWT を検証する。検証できない場合は null。 */
async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  audience: string,
): Promise<AdminIdentity | null> {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  const [rawHeader, rawPayload, rawSignature] = segments;

  const header = decodeJsonSegment(rawHeader);
  const payload = decodeJsonSegment(rawPayload);
  if (!header || !payload) return null;
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

  const signed = toArrayBuffer(new TextEncoder().encode(`${rawHeader}.${rawPayload}`));
  let signature: ArrayBuffer;
  try {
    signature = toArrayBuffer(base64UrlDecode(rawSignature));
  } catch {
    return null;
  }

  let keys = await loadKeys(teamDomain, false);
  let key = keys.get(header.kid);
  if (!key) {
    // 鍵がローテーションされた可能性があるため一度だけ取り直す
    keys = await loadKeys(teamDomain, true);
    key = keys.get(header.kid);
  }
  if (!key) return null;

  const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
  if (!verified) return null;

  if (payload.iss !== `https://${teamDomain}`) return null;
  if (!audienceMatches(payload.aud, audience)) return null;

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : null;
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : null;
  const iat = typeof payload.iat === 'number' ? payload.iat : null;
  if (exp === null || now > exp + CLOCK_SKEW_SEC) return null;
  if (nbf !== null && now + CLOCK_SKEW_SEC < nbf) return null;
  if (iat !== null && now + CLOCK_SKEW_SEC < iat) return null;

  const email = typeof payload.email === 'string' ? payload.email : null;
  return { email };
}

/** ローカル開発（wrangler pages dev）でのみ認証を迂回してよいか */
function isLocalDevBypass(request: Request, env: Env): boolean {
  if (env.ADMIN_DEV_BYPASS !== 'true') return false;
  try {
    const { hostname } = new URL(request.url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/**
 * 管理画面へのアクセス可否を判定する。
 * 認証情報が無い / 検証に失敗した場合は必ず拒否する。
 */
export async function authenticateAdmin(request: Request, env: Env): Promise<AuthResult> {
  const teamDomain = env.ADMIN_ACCESS_TEAM_DOMAIN
    ? normalizeTeamDomain(env.ADMIN_ACCESS_TEAM_DOMAIN)
    : null;
  const audience = env.ADMIN_ACCESS_AUD?.trim() || null;

  if (!teamDomain || !audience) {
    // 設定が無い場合は開けない。ローカル開発のみ明示フラグで迂回できる。
    if (isLocalDevBypass(request, env)) {
      return { ok: true, identity: { email: null } };
    }
    return { ok: false, reason: 'unconfigured' };
  }

  const token = extractToken(request);
  if (!token) {
    if (isLocalDevBypass(request, env)) return { ok: true, identity: { email: null } };
    return { ok: false, reason: 'unauthenticated' };
  }

  try {
    const identity = await verifyAccessJwt(token, teamDomain, audience);
    if (!identity) return { ok: false, reason: 'unauthenticated' };
    return { ok: true, identity };
  } catch {
    // 失敗の内訳（JWKS取得失敗・署名不一致など）はログにもクライアントにも残さない
    return { ok: false, reason: 'unauthenticated' };
  }
}
