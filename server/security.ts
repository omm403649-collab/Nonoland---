import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { AccountStatus, SecurityEventLog, TeacherPermission, TeacherProfile, UserRole } from '../src/types/nonoland';
import { DEFAULT_TEACHER_PERMISSIONS } from '../src/utils/validation';

export { DEFAULT_TEACHER_PERMISSIONS };

export interface StoredUserRecord {
  id: string;
  email: string;
  normalizedEmail: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  status: AccountStatus;
  phone?: string;
  bio?: string;
  linkedChildId?: string;
  teacherProfile?: TeacherProfile;
  policyVersion: string;
  termsAcceptedAt: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSessionRecord {
  tokenHash: string;
  userId: string;
  csrfToken: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

export interface StoredActionToken {
  tokenHash: string;
  userId: string;
  type: 'email-verify' | 'password-reset';
  expiresAt: number;
  used: boolean;
}

export const SESSION_COOKIE_NAME = 'nono_session';
export const SESSION_IDLE_MS = 24 * 60 * 60 * 1000; // 24h idle timeout
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000; // 7d absolute max
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 5 * 60 * 1000; // 5-min temporary lockout (never permanent)

// Strong scrypt password hashing (random 16-byte salt, constant-time verify)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexDigest] = parts;
  if (!salt || !hexDigest) return false;
  const expected = Buffer.from(hexDigest, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

// In-memory sliding window rate limiter by key
const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = rateBuckets.get(key) || [];
  const fresh = prev.filter((ts) => now - ts < windowMs);
  if (fresh.length >= maxRequests) {
    rateBuckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return true;
}

export function clearRateLimit(key: string): void {
  rateBuckets.delete(key);
}

export const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  parent: new Set(['own_family']),
  student: new Set(['own_student_exams']),
  teacher: new Set(['teacher_portal']),
  support_agent: new Set(['view_support']),
  content_admin: new Set(['manage_lessons', 'manage_questions']),
  curriculum_manager: new Set(['manage_lessons', 'manage_questions', 'manage_exam_config']),
  finance_admin: new Set(['manage_exam_config', 'view_payments']),
  super_admin: new Set([
    'manage_lessons',
    'manage_questions',
    'manage_exam_config',
    'manage_certificates',
    'manage_teachers',
    'manage_classes',
    'view_security_logs',
    'view_payments',
    'view_support',
  ]),
};

export function hasPermission(role: UserRole | undefined, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function hasTeacherPermission(
  user: StoredUserRecord | undefined,
  permission: TeacherPermission,
): boolean {
  if (!user || user.role !== 'teacher' || user.status !== 'active') return false;
  const perms = user.teacherProfile?.permissions ?? DEFAULT_TEACHER_PERMISSIONS;
  return perms.includes(permission);
}

export function getDashboardRouteForRole(role: UserRole): string {
  switch (role) {
    case 'teacher':
      return '/teacher-dashboard';
    case 'student':
      return '/exams';
    case 'super_admin':
    case 'content_admin':
    case 'curriculum_manager':
    case 'finance_admin':
    case 'support_agent':
      return '/admin-dashboard';
    default:
      return '/parent-dashboard';
  }
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline'; script-src 'self';",
    );
  }
  res.removeHeader('X-Powered-By');
  void req;
  next();
}

export function appendSecurityLog(
  logs: SecurityEventLog[],
  entry: Omit<SecurityEventLog, 'id' | 'createdAt'>,
) {
  const safeSummary = String(entry.summary || '')
    .replace(/(password|token|secret|csrf|cookie)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .slice(0, 300);
  logs.unshift({
    ...entry,
    summary: safeSummary,
    id: `sec_${crypto.randomBytes(5).toString('hex')}`,
    createdAt: new Date().toISOString(),
  });
  if (logs.length > 1000) {
    logs.length = 1000;
  }
}

export function setSessionCookie(res: Response, rawToken: string, isProd: boolean) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_ABSOLUTE_MS / 1000)}`,
  ];
  if (isProd) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}
