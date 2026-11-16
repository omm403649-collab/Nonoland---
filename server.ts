import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { VALIDATED_EXAM_BANK } from './src/data/deepCurriculum';
import { getLevel1LessonById } from './src/data/level1Curriculum';
import { getQuestionsForLevel1Lesson, LEVEL1_QUESTION_BANK } from './src/data/level1QuestionBank';
import { createInitialSkillProgress } from './src/data/rewardsAndRoom';
import {
  DEFAULT_FEATURE_FLAGS,
  normalizeEmail,
  POLICY_VERSION,
  sanitizeShortText,
  validateChildProfileInput,
  validateEmail,
  validateParentName,
  validatePassword,
} from './src/utils/validation';
import {
  appendSecurityLog,
  checkRateLimit,
  clearRateLimit,
  clearSessionCookie,
  generateSecureToken,
  getClientIp,
  getDashboardRouteForRole,
  hashPassword,
  hashToken,
  hasPermission,
  LOCKOUT_MS,
  MAX_FAILED_LOGINS,
  parseCookies,
  securityHeadersMiddleware,
  SESSION_ABSOLUTE_MS,
  SESSION_COOKIE_NAME,
  SESSION_IDLE_MS,
  setSessionCookie,
  StoredUserRecord,
  verifyPassword,
} from './server/security';
import type { AuthenticatedRequest, CheckoutSession, ServerDb, StoredChildRecord } from './server/dbTypes';
import { recordAuditEvent, registerImmutableAuditGuards } from './server/auditLog';
import { registerGovernanceAndHomeworkRoutes } from './server/governanceAndHomeworkRoutes';
import { registerNonoAiRoutes } from './server/nonoAiRoutes';
import { registerReadingAndFamilyRoutes } from './server/readingAndFamilyRoutes';
import { registerSmartAssessmentRoutes } from './server/smartAssessmentRoutes';
import { registerTeacherAndLevel2Routes } from './server/teacherRoutes';
import { registerWorldExperienceRoutes } from './server/worldExperienceRoutes';
import {
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_NEXT_MONTH_PLAN,
  DEFAULT_PARENT_SCHEDULE,
  DEFAULT_PET_STATE,
  DEFAULT_ROOM_CONFIG,
} from './src/data/worldCatalog';
import type {
  AgeGroupId,
  Certificate,
  ChildProfile,
  CmsLessonRecord,
  ExamAttemptSummary,
  ExamConfig,
  ExamQuestionItem,
  ExamSubject,
  Language,
  Level1LessonProgress,
  LocalizedText,
  UserRole,
  WorldId,
} from './src/types/nonoland';

dotenv.config();

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'nonoland-server-db.json');
const IS_PROD = process.env.NODE_ENV === 'production';

function getDefaultDb(): ServerDb {
  return {
    examConfig: {
      examPriceEgp: 50,
      currency: 'EGP',
      passingPercentage: 70,
      questionsPerExam: 40,
      paymentGatewayMode:
        process.env.STRIPE_SECRET_KEY || process.env.PAYMOB_API_KEY
          ? 'live-gateway'
          : 'development-test-verification',
    },
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    users: {},
    emailIndex: {},
    sessions: {},
    actionTokens: {},
    children: {},
    customLessons: [],
    customQuestions: [],
    checkoutSessions: {},
    examAttempts: {},
    level1Attempts: {},
    level2Attempts: {},
    level2ProgressionConfig: {
      allowOpenExploration: true,
      minLevel1DemonstratedForBadge: 10,
      requirePlacementOrMasteryForOfficialExam: false,
    },
    classes: {},
    teacherQuestions: {},
    teacherExams: {},
    examAssignments: {},
    assignedExamAttempts: {},
    homeworks: {},
    homeworkSubmissions: {},
    homeworkAttachments: {},
    importBatches: {},
    certificates: {},
    processedSyncKeys: {},
    smartAssessmentSessions: {},
    aiUsageDaily: {},
    operationalMetrics: {
      totalApiRequests: 0,
      apiFailures5xx: 0,
      apiClientErrors4xx: 0,
      syncFailures: 0,
      lastErrors: [],
    },
    securityLogs: [],
  };
}

function loadDb(): ServerDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Partial<ServerDb>;
      const def = getDefaultDb();
      return {
        ...def,
        ...parsed,
        examConfig: {
          ...def.examConfig,
          ...(parsed.examConfig || {}),
        },
        featureFlags: {
          ...def.featureFlags,
          ...(parsed.featureFlags || {}),
        },
        users: parsed.users || {},
        emailIndex: parsed.emailIndex || {},
        sessions: parsed.sessions || {},
        actionTokens: parsed.actionTokens || {},
        children: parsed.children || {},
        customLessons: parsed.customLessons || [],
        customQuestions: parsed.customQuestions || [],
        checkoutSessions: parsed.checkoutSessions || {},
        examAttempts: parsed.examAttempts || {},
        level1Attempts: parsed.level1Attempts || {},
        level2Attempts: parsed.level2Attempts || {},
        level2ProgressionConfig: {
          ...def.level2ProgressionConfig,
          ...(parsed.level2ProgressionConfig || {}),
        },
        classes: parsed.classes || {},
        teacherQuestions: parsed.teacherQuestions || {},
        teacherExams: parsed.teacherExams || {},
        examAssignments: parsed.examAssignments || {},
        assignedExamAttempts: parsed.assignedExamAttempts || {},
        homeworks: parsed.homeworks || {},
        homeworkSubmissions: parsed.homeworkSubmissions || {},
        homeworkAttachments: parsed.homeworkAttachments || {},
        importBatches: parsed.importBatches || {},
        certificates: parsed.certificates || {},
        processedSyncKeys: parsed.processedSyncKeys || {},
        smartAssessmentSessions: parsed.smartAssessmentSessions || {},
        aiUsageDaily: parsed.aiUsageDaily || {},
        operationalMetrics: {
          ...def.operationalMetrics,
          ...(parsed.operationalMetrics || {}),
          lastErrors: parsed.operationalMetrics?.lastErrors || [],
        },
        securityLogs: parsed.securityLogs || [],
      };
    }
  } catch {
    // Fallback to clean DB
  }
  return getDefaultDb();
}

function saveDb(db: ServerDb) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function toSafeUser(user: StoredUserRecord) {
  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
    normalizedEmail: user.normalizedEmail,
    role: user.role,
    status: user.status,
    phone: user.phone,
    bio: user.bio,
    linkedChildId: user.linkedChildId,
    teacherProfile: user.teacherProfile,
    dashboardRoute: getDashboardRouteForRole(user.role),
    emailVerified: user.emailVerified,
    policyVersion: user.policyVersion,
    termsAcceptedAt: user.termsAcceptedAt,
    createdAt: user.createdAt,
    isDemoMode: false,
  };
}

function subjectToWorld(subject: ExamSubject): { worldId: WorldId; worldName: LocalizedText } {
  switch (subject) {
    case 'arabic':
      return { worldId: 'arabic-letters', worldName: { ar: 'جزيرة الحروف العربية', en: 'Arabic Letters Island' } };
    case 'english':
      return { worldId: 'english-letters', worldName: { ar: 'مدينة الإنجليزية', en: 'English Alphabet City' } };
    case 'math':
      return { worldId: 'numbers-kingdom', worldName: { ar: 'مملكة الأرقام والرياضيات', en: 'Numbers & Math Kingdom' } };
    case 'colors-science':
      return { worldId: 'science-galaxy', worldName: { ar: 'مجرة العلوم والألوان', en: 'Colors & Science Galaxy' } };
    default:
      return { worldId: 'intelligence-castle', worldName: { ar: 'امتحان نونو لاند الشامل', en: 'NonoLand Comprehensive Academy' } };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);
  app.use('/api/admin/ops/restore', express.json({ limit: '4mb' }));
  app.use(express.json({ limit: '512kb' }));

  // Clean 413 / 400 error handler for oversized or malformed JSON payloads
  app.use(
    (
      err: { status?: number; type?: string; message?: string },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err?.type === 'entity.too.large' || err?.status === 413) {
        return res.status(413).json({ error: 'Request payload exceeds maximum allowed size' });
      }
      if (err instanceof SyntaxError || err?.status === 400) {
        return res.status(400).json({ error: 'Malformed JSON request body' });
      }
      next(err);
    },
  );

  let db = loadDb();
  saveDb(db);

  function createSessionForUser(user: StoredUserRecord, req: express.Request, res: express.Response): string {
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const csrfToken = generateSecureToken(24);
    const now = Date.now();
    db.sessions[tokenHash] = {
      tokenHash,
      userId: user.id,
      csrfToken,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + SESSION_ABSOLUTE_MS,
      ip: getClientIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 180),
    };
    setSessionCookie(res, rawToken, IS_PROD);
    return csrfToken;
  }

  function revokeAllUserSessions(userId: string) {
    for (const [hash, s] of Object.entries(db.sessions)) {
      if (s.userId === userId) {
        delete db.sessions[hash];
      }
    }
  }

  // Session attachment + CSRF enforcement on cookie-authenticated mutations
  const CSRF_EXEMPT_PATHS = new Set([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/register-teacher',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ]);

  app.use('/api', (req: AuthenticatedRequest, res, next) => {
    db.operationalMetrics.totalApiRequests = (db.operationalMetrics.totalApiRequests || 0) + 1;
    res.on('finish', () => {
      if (res.statusCode >= 500) {
        db.operationalMetrics.apiFailures5xx = (db.operationalMetrics.apiFailures5xx || 0) + 1;
        db.operationalMetrics.lastErrors.unshift({
          route: `${req.method} ${req.originalUrl.split('?')[0]}`,
          status: res.statusCode,
          message: 'Server error response',
          timestamp: new Date().toISOString(),
        });
        if (db.operationalMetrics.lastErrors.length > 25) db.operationalMetrics.lastErrors.length = 25;
      } else if (res.statusCode >= 400) {
        db.operationalMetrics.apiClientErrors4xx = (db.operationalMetrics.apiClientErrors4xx || 0) + 1;
        if (req.originalUrl.includes('/sync')) {
          db.operationalMetrics.syncFailures = (db.operationalMetrics.syncFailures || 0) + 1;
        }
      }
    });

    const cookies = parseCookies(req.headers.cookie);
    const rawToken = cookies[SESSION_COOKIE_NAME];

    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      const session = db.sessions[tokenHash];
      const now = Date.now();

      if (
        session &&
        now < session.expiresAt &&
        now - session.lastActiveAt < SESSION_IDLE_MS
      ) {
        const user = db.users[session.userId];
        if (user && user.status === 'active') {
          req.authSession = { user, session };
          if (now - session.lastActiveAt > 60_000) {
            session.lastActiveAt = now;
            saveDb(db);
          }
        }
      } else if (session) {
        delete db.sessions[tokenHash];
        clearSessionCookie(res);
        saveDb(db);
      }
    }

    // Enforce CSRF token on any state-changing request from an authenticated cookie session
    if (
      req.authSession &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      !CSRF_EXEMPT_PATHS.has(req.originalUrl.split('?')[0])
    ) {
      const headerCsrf = req.header('x-csrf-token');
      if (!headerCsrf || headerCsrf !== req.authSession.session.csrfToken) {
        appendSecurityLog(db.securityLogs, {
          eventType: 'ACCESS_DENIED',
          actorId: req.authSession.user.id,
          role: req.authSession.user.role,
          ip: getClientIp(req),
          summary: `CSRF mismatch on ${req.method} ${req.originalUrl}`,
        });
        saveDb(db);
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
      }
    }

    next();
  });

  function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
    if (!req.authSession) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  }

  function assertChildAccess(
    req: AuthenticatedRequest,
    res: express.Response,
    childId: string,
  ): StoredChildRecord | null | 'untracked-sample' {
    const storedChild = db.children[childId];
    if (!storedChild) {
      // Sample/demo children (not registered to any parent record) are only allowed for non-admin sample exploration
      if (childId.startsWith('child-') || childId.startsWith('demo-')) {
        return 'untracked-sample';
      }
      if (!req.authSession) {
        res.status(401).json({ error: 'Authentication required for unknown child profile' });
        return null;
      }
      return 'untracked-sample';
    }

    if (!req.authSession) {
      res.status(401).json({ error: 'Authentication required to access this child profile' });
      return null;
    }

    const authUser = req.authSession.user;
    const isParentOwner = storedChild.parentId === authUser.id;
    const isLinkedStudent = authUser.role === 'student' && authUser.linkedChildId === childId;
    if (!isParentOwner && !isLinkedStudent && authUser.role !== 'super_admin') {
      appendSecurityLog(db.securityLogs, {
        eventType: 'ACCESS_DENIED',
        actorId: authUser.id,
        role: authUser.role,
        ip: getClientIp(req),
        summary: `Blocked IDOR access to child ${childId}`,
      });
      saveDb(db);
      res.status(403).json({ error: 'Forbidden: you do not own this child profile' });
      return null;
    }

    return storedChild;
  }

  function requireAdminPermission(permission: string) {
    return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
      // 1. Authenticated session check first (strict RBAC: logged-in parents MUST be rejected 403!)
      if (req.authSession) {
        if (!hasPermission(req.authSession.user.role, permission)) {
          appendSecurityLog(db.securityLogs, {
            eventType: 'ACCESS_DENIED',
            actorId: req.authSession.user.id,
            role: req.authSession.user.role,
            ip: getClientIp(req),
            summary: `RBAC denied ${permission} for role ${req.authSession.user.role}`,
          });
          saveDb(db);
          return res.status(403).json({ error: `Forbidden: requires permission ${permission}` });
        }
        return next();
      }

      // 2. Fallback Admin PIN (only when ADMIN_PIN env var is set or dev mode)
      const configuredPin = process.env.ADMIN_PIN || (!IS_PROD ? '2026' : '');
      const providedPin = req.header('x-admin-pin');
      if (configuredPin && providedPin === configuredPin) {
        return next();
      }

      appendSecurityLog(db.securityLogs, {
        eventType: 'ACCESS_DENIED',
        ip: getClientIp(req),
        summary: `Unauthorized admin access attempt for ${permission}`,
      });
      saveDb(db);
      return res.status(401).json({ error: 'Admin authentication or valid Admin PIN required' });
    };
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ------------------------------------------------------------------
  // 0. AUTHENTICATION, SESSIONS, EMAIL VERIFICATION & PASSWORD RECOVERY
  // ------------------------------------------------------------------
  app.post('/api/auth/register', (req: AuthenticatedRequest, res) => {
    const ip = getClientIp(req);
    if (!checkRateLimit(`reg:${ip}`, 20, 15 * 60_000)) {
      return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
    }

    const { displayName, email, password, termsAccepted, policyVersion, role: requestedRole } = req.body as {
      displayName?: string;
      email?: string;
      password?: string;
      termsAccepted?: boolean;
      policyVersion?: string;
      role?: string;
    };

    if (requestedRole !== undefined && requestedRole !== 'parent') {
      appendSecurityLog(db.securityLogs, {
        eventType: 'ACCESS_DENIED',
        ip,
        summary: `Blocked privilege escalation attempt on /api/auth/register with role=${String(requestedRole)}`,
      });
      saveDb(db);
      return res.status(403).json({ error: 'Privilege escalation is not permitted during registration.' });
    }

    const nameCheck = validateParentName(displayName || '');
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error });
    }

    const emailCheck = validateEmail(email || '');
    if (!emailCheck.ok) {
      return res.status(400).json({ error: emailCheck.error });
    }

    const pwCheck = validatePassword(password || '', emailCheck.normalized, nameCheck.clean);
    if (!pwCheck.ok) {
      return res.status(400).json({ error: pwCheck.error });
    }

    if (termsAccepted !== true) {
      return res.status(400).json({ error: 'You must explicitly accept the Privacy Policy and Terms of Use.' });
    }

    if (db.emailIndex[emailCheck.normalized]) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const nowIso = new Date().toISOString();
    const userId = `usr_${crypto.randomBytes(6).toString('hex')}`;
    const user: StoredUserRecord = {
      id: userId,
      email: (email || '').trim(),
      normalizedEmail: emailCheck.normalized,
      displayName: nameCheck.clean,
      passwordHash: hashPassword(password || ''),
      role: 'parent',
      emailVerified: false,
      status: 'active',
      policyVersion: sanitizeShortText(policyVersion || POLICY_VERSION, 24) || POLICY_VERSION,
      termsAcceptedAt: nowIso,
      failedLoginAttempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.users[userId] = user;
    db.emailIndex[emailCheck.normalized] = userId;

    // Issue single-use 24h email verification token
    const rawVerifyToken = generateSecureToken(24);
    db.actionTokens[hashToken(rawVerifyToken)] = {
      tokenHash: hashToken(rawVerifyToken),
      userId,
      type: 'email-verify',
      expiresAt: Date.now() + 24 * 60 * 60_000,
      used: false,
    };

    const csrfToken = createSessionForUser(user, req, res);
    appendSecurityLog(db.securityLogs, {
      eventType: 'AUTH_REGISTER',
      actorId: userId,
      role: user.role,
      ip,
      summary: `Registered parent account (${user.normalizedEmail})`,
    });
    saveDb(db);

    res.status(201).json({
      user: toSafeUser(user),
      csrfToken,
      dashboardRoute: getDashboardRouteForRole(user.role),
      emailVerificationRequired: true,
      ...(!IS_PROD ? { devVerificationToken: rawVerifyToken } : {}),
    });
  });

  app.post('/api/auth/login', (req: AuthenticatedRequest, res) => {
    const ip = getClientIp(req);
    const { email, password } = req.body as { email?: string; password?: string };
    const normEmail = normalizeEmail(email || '');

    if (!checkRateLimit(`login-ip:${ip}`, 40, 15 * 60_000) || !checkRateLimit(`login-email:${normEmail}`, 15, 5 * 60_000)) {
      return res.status(429).json({ error: 'Too many login requests. Please wait a few minutes.' });
    }

    if (!normEmail || typeof password !== 'string' || password.length === 0 || password.length > 128) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userId = db.emailIndex[normEmail];
    const user = userId ? db.users[userId] : undefined;

    if (!user) {
      appendSecurityLog(db.securityLogs, {
        eventType: 'AUTH_LOGIN_FAIL',
        ip,
        summary: `Failed login for unknown email`,
      });
      saveDb(db);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Teacher account is pending administrator approval.',
        status: 'pending',
      });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended.', status: 'suspended' });
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const waitSeconds = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
      return res.status(429).json({
        error: `Account temporarily locked due to failed attempts. Try again in ${waitSeconds}s.`,
        locked: true,
        retryAfterSeconds: waitSeconds,
      });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.updatedAt = new Date().toISOString();

      if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString();
        appendSecurityLog(db.securityLogs, {
          eventType: 'AUTH_LOCKOUT',
          actorId: user.id,
          role: user.role,
          ip,
          summary: `Temporary 5-minute lockout after ${user.failedLoginAttempts} failed logins`,
        });
        saveDb(db);
        return res.status(429).json({
          error: 'Account temporarily locked for 5 minutes due to repeated failed attempts.',
          locked: true,
          retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
        });
      }

      appendSecurityLog(db.securityLogs, {
        eventType: 'AUTH_LOGIN_FAIL',
        actorId: user.id,
        role: user.role,
        ip,
        summary: `Failed password attempt (${user.failedLoginAttempts}/${MAX_FAILED_LOGINS})`,
      });
      saveDb(db);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Success: reset failure counters & rotate session
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.updatedAt = new Date().toISOString();
    clearRateLimit(`login-email:${normEmail}`);

    // Revoke previous cookie session if present (session rotation)
    const oldCookies = parseCookies(req.headers.cookie);
    if (oldCookies[SESSION_COOKIE_NAME]) {
      delete db.sessions[hashToken(oldCookies[SESSION_COOKIE_NAME])];
    }

    const csrfToken = createSessionForUser(user, req, res);
    appendSecurityLog(db.securityLogs, {
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorId: user.id,
      role: user.role,
      ip,
      summary: `Parent/User logged in cleanly`,
    });
    saveDb(db);

    res.json({
      user: toSafeUser(user),
      dashboardRoute: getDashboardRouteForRole(user.role),
      csrfToken,
    });
  });

  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.authSession) {
      return res.json({ authenticated: false, user: null, csrfToken: null });
    }
    res.json({
      authenticated: true,
      user: toSafeUser(req.authSession.user),
      csrfToken: req.authSession.session.csrfToken,
    });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    const { token } = req.body as { token?: string };
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required.' });
    }
    const record = db.actionTokens[hashToken(token.trim())];
    if (!record || record.type !== 'email-verify' || record.used || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Verification link is invalid or expired.' });
    }
    const user = db.users[record.userId];
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    record.used = true;
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    appendSecurityLog(db.securityLogs, {
      eventType: 'EMAIL_VERIFIED',
      actorId: user.id,
      role: user.role,
      ip: getClientIp(req),
      summary: `Email verified`,
    });
    saveDb(db);
    res.json({ verified: true, user: toSafeUser(user) });
  });

  app.post('/api/auth/resend-verification', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authSession!.user;
    if (!checkRateLimit(`resend-ver:${user.id}`, 3, 10 * 60_000)) {
      return res.status(429).json({ error: 'Verification requests are rate limited. Try again later.' });
    }
    const rawVerifyToken = generateSecureToken(24);
    db.actionTokens[hashToken(rawVerifyToken)] = {
      tokenHash: hashToken(rawVerifyToken),
      userId: user.id,
      type: 'email-verify',
      expiresAt: Date.now() + 24 * 60 * 60_000,
      used: false,
    };
    saveDb(db);
    res.json({
      sent: true,
      ...(!IS_PROD ? { devVerificationToken: rawVerifyToken } : {}),
    });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const ip = getClientIp(req);
    const { email } = req.body as { email?: string };
    const norm = normalizeEmail(email || '');

    if (!checkRateLimit(`forgot-ip:${ip}`, 10, 15 * 60_000)) {
      return res.status(429).json({ error: 'Too many recovery requests.' });
    }

    let devResetToken: string | undefined;
    const userId = norm ? db.emailIndex[norm] : undefined;
    if (userId && db.users[userId]) {
      const raw = generateSecureToken(24);
      db.actionTokens[hashToken(raw)] = {
        tokenHash: hashToken(raw),
        userId,
        type: 'password-reset',
        expiresAt: Date.now() + 30 * 60_000,
        used: false,
      };
      saveDb(db);
      if (!IS_PROD) devResetToken = raw;
    }

    // Generic anti-enumeration response regardless of whether email exists
    res.json({
      ok: true,
      message: 'If an account matches this email, recovery instructions have been prepared.',
      ...(devResetToken ? { devResetToken } : {}),
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Reset token is required.' });
    }
    const record = db.actionTokens[hashToken(token.trim())];
    if (!record || record.type !== 'password-reset' || record.used || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Password reset token is invalid or expired.' });
    }

    const user = db.users[record.userId];
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const pwCheck = validatePassword(newPassword || '', user.normalizedEmail, user.displayName);
    if (!pwCheck.ok) {
      return res.status(400).json({ error: pwCheck.error });
    }

    record.used = true;
    user.passwordHash = hashPassword(newPassword || '');
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.updatedAt = new Date().toISOString();

    // Critical security guarantee: revoke ALL active sessions on password reset
    revokeAllUserSessions(user.id);
    clearSessionCookie(res);
    appendSecurityLog(db.securityLogs, {
      eventType: 'PASSWORD_RESET',
      actorId: user.id,
      role: user.role,
      ip: getClientIp(req),
      summary: `Password reset completed and all active sessions revoked`,
    });
    saveDb(db);

    res.json({ reset: true });
  });

  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const raw = cookies[SESSION_COOKIE_NAME];
    if (raw) {
      delete db.sessions[hashToken(raw)];
      saveDb(db);
    }
    clearSessionCookie(res);
    res.json({ loggedOut: true });
  });

  app.post('/api/auth/logout-all', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authSession!.user;
    revokeAllUserSessions(user.id);
    clearSessionCookie(res);
    appendSecurityLog(db.securityLogs, {
      eventType: 'LOGOUT_ALL',
      actorId: user.id,
      role: user.role,
      ip: getClientIp(req),
      summary: `Logged out of all devices`,
    });
    saveDb(db);
    res.json({ loggedOutAll: true });
  });

  app.post('/api/parent/verify-password', requireAuth, (req: AuthenticatedRequest, res) => {
    const { password } = req.body as { password?: string };
    const user = req.authSession!.user;
    if (!password || !verifyPassword(password, user.passwordHash)) {
      appendSecurityLog(db.securityLogs, {
        eventType: 'PARENT_GATE_FAIL',
        actorId: user.id,
        role: user.role,
        ip: getClientIp(req),
        summary: `Failed Parent Gate password confirmation`,
      });
      saveDb(db);
      return res.status(403).json({ verified: false, error: 'Incorrect parent password' });
    }
    res.json({ verified: true });
  });

  app.get('/api/parent/security-logs', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authSession!.user;
    const activeSessionsCount = Object.values(db.sessions).filter(
      (s) => s.userId === user.id && s.expiresAt > Date.now(),
    ).length;
    const logs = db.securityLogs.filter((l) => l.actorId === user.id).slice(0, 30);
    res.json({ activeSessionsCount, logs });
  });

  // ------------------------------------------------------------------
  // 0B. CHILD PROFILES WITH OWNERSHIP & STRICT VALIDATION (IDOR SAFE)
  // ------------------------------------------------------------------
  app.get('/api/children', requireAuth, (req: AuthenticatedRequest, res) => {
    const authUser = req.authSession!.user;
    if (authUser.role === 'student') {
      const ch = authUser.linkedChildId ? db.children[authUser.linkedChildId] : undefined;
      return res.json({ children: ch ? [ch] : [] });
    }
    const list = Object.values(db.children).filter((c) => c.parentId === authUser.id);
    res.json({ children: list });
  });

  app.post('/api/children', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authSession!.user;
    if (user.role === 'student' || user.role === 'teacher') {
      return res.status(403).json({ error: 'Only parents or administrators can create child profiles' });
    }
    const ownedCount = Object.values(db.children).filter((c) => c.parentId === user.id).length;
    if (ownedCount >= 8) {
      return res.status(400).json({ error: 'Maximum 8 child profiles allowed per family account.' });
    }

    const body = req.body as {
      displayName?: string;
      ageGroup?: AgeGroupId;
      language?: Language;
      birthYear?: number;
      birthMonth?: number;
      interests?: string[];
      companionId?: string;
      companionScarfColor?: string;
    };

    const check = validateChildProfileInput({
      displayName: body.displayName || '',
      ageGroup: body.ageGroup || '3-4',
      language: body.language || 'ar',
      birthYear: Number(body.birthYear),
      birthMonth: Number(body.birthMonth),
    });
    if (!check.ok || !check.clean) {
      return res.status(400).json({ error: check.error });
    }

    const childId = `ch_${crypto.randomBytes(6).toString('hex')}`;
    const child: StoredChildRecord = {
      id: childId,
      parentId: user.id,
      displayName: check.clean.displayName,
      birthYear: Number(body.birthYear),
      birthMonth: Number(body.birthMonth),
      ageGroup: body.ageGroup!,
      language: body.language === 'en' ? 'en' : 'ar',
      interests: Array.isArray(body.interests)
        ? body.interests.slice(0, 6).map((x) => sanitizeShortText(String(x), 24))
        : [],
      companionId: sanitizeShortText(body.companionId || 'nono', 24) || 'nono',
      companionScarfColor: /^#[0-9A-Fa-f]{6}$/.test(body.companionScarfColor || '')
        ? body.companionScarfColor!
        : '#8054D9',
      stars: 3,
      level: 1,
      completedBaseline: false,
      unlockedWorlds: [
        'arabic-letters',
        'english-letters',
        'numbers-kingdom',
        'animal-jungle',
        'colors-shapes',
        'intelligence-castle',
        'science-galaxy',
        'healthy-body',
        'life-skills',
        'creativity-island',
      ],
      completedActivityIds: [],
      unlockedCharacters: ['nono', sanitizeShortText(body.companionId || 'nono', 24) || 'nono'],
      unlockedBadges: [],
      unlockedRoomItems: ['cloud-bed', 'sun-plant'],
      placedRoomItems: [
        { instanceId: `init-1-${Date.now()}`, itemId: 'cloud-bed', x: 28, y: 68 },
        { instanceId: `init-2-${Date.now()}`, itemId: 'sun-plant', x: 72, y: 65 },
      ],
      savedDrawings: [],
      certificates: [],
      skillProgress: createInitialSkillProgress(),
      attempts: [],
      assessmentHistory: [],
      completedStoryIds: [],
      completedMissionsToday: [],
      totalLearningMinutes: 0,
      downloadedWorldIds: ['arabic-letters', 'colors-shapes'],
      level1Progress: {},
      level2Progress: {},
      avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
      roomConfig: { ...DEFAULT_ROOM_CONFIG },
      petState: { ...DEFAULT_PET_STATE },
      completedLabIds: [],
      labHistory: [],
      customStories: [],
      creativeProjects: [],
      ownedShopItemIds: [],
      rewardTransactions: [],
      parentSchedule: { ...DEFAULT_PARENT_SCHEDULE },
      nextMonthPlan: DEFAULT_NEXT_MONTH_PLAN,
      activeDaysHistory: [],
      activityTimeline: [],
      aiAssistantEnabled: true,
      readingStageProgress: {},
      familyActivitiesCompleted: [],
      musicCompositions: [],
      buildConstructions: [],
    };

    db.children[childId] = child;
    recordAuditEvent(db, {
      eventType: 'CHILD_PROFILE_CHANGE',
      actorId: user.id,
      actorRole: user.role,
      actionType: 'CREATE_CHILD_PROFILE',
      recordType: 'child_profile',
      recordId: childId,
      newValue: { displayName: child.displayName, ageGroup: child.ageGroup, language: child.language },
      ip: getClientIp(req),
      summary: `Created child profile ${childId} (${child.displayName})`,
    });
    saveDb(db);
    res.status(201).json({ child });
  });

  app.patch('/api/children/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authSession!.user.role === 'student' || req.authSession!.user.role === 'teacher') {
      return res.status(403).json({ error: 'Forbidden: only parents may modify child profiles' });
    }
    const child = assertChildAccess(req, res, req.params.id);
    if (!child || child === 'untracked-sample') {
      if (child === 'untracked-sample') {
        return res.status(404).json({ error: 'Child profile not found' });
      }
      return;
    }

    const patch = req.body as Partial<ChildProfile>;
    const nextName = patch.displayName !== undefined ? patch.displayName : child.displayName;
    const nextAge = patch.ageGroup || child.ageGroup;
    const nextLang = patch.language || child.language;
    const nextYear = patch.birthYear !== undefined ? Number(patch.birthYear) : child.birthYear;
    const nextMonth = patch.birthMonth !== undefined ? Number(patch.birthMonth) : child.birthMonth;

    const check = validateChildProfileInput({
      displayName: nextName,
      ageGroup: nextAge,
      language: nextLang,
      birthYear: nextYear,
      birthMonth: nextMonth,
    });
    if (!check.ok || !check.clean) {
      return res.status(400).json({ error: check.error });
    }

    const prevSnapshot = {
      displayName: child.displayName,
      ageGroup: child.ageGroup,
      language: child.language,
      aiAssistantEnabled: child.aiAssistantEnabled !== false,
    };

    child.displayName = check.clean.displayName;
    child.ageGroup = nextAge;
    child.language = nextLang;
    child.birthYear = nextYear;
    child.birthMonth = nextMonth;
    if (patch.companionScarfColor && /^#[0-9A-Fa-f]{6}$/.test(patch.companionScarfColor)) {
      child.companionScarfColor = patch.companionScarfColor;
    }
    if (typeof patch.aiAssistantEnabled === 'boolean') {
      child.aiAssistantEnabled = patch.aiAssistantEnabled;
    }
    recordAuditEvent(db, {
      eventType: 'CHILD_PROFILE_CHANGE',
      actorId: req.authSession!.user.id,
      actorRole: req.authSession!.user.role,
      actionType: 'UPDATE_CHILD_PROFILE',
      recordType: 'child_profile',
      recordId: child.id,
      previousValue: prevSnapshot,
      newValue: {
        displayName: child.displayName,
        ageGroup: child.ageGroup,
        language: child.language,
        aiAssistantEnabled: child.aiAssistantEnabled !== false,
      },
      ip: getClientIp(req),
      summary: `Updated child profile ${child.id}`,
    });
    saveDb(db);
    res.json({ child });
  });

  app.delete('/api/children/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.authSession!.user.role === 'student' || req.authSession!.user.role === 'teacher') {
      return res.status(403).json({ error: 'Forbidden: only parents may delete child profiles' });
    }
    const child = assertChildAccess(req, res, req.params.id);
    if (!child || child === 'untracked-sample') {
      if (child === 'untracked-sample') return res.status(404).json({ error: 'Child profile not found' });
      return;
    }
    recordAuditEvent(db, {
      eventType: 'CHILD_PROFILE_CHANGE',
      actorId: req.authSession!.user.id,
      actorRole: req.authSession!.user.role,
      actionType: 'DELETE_CHILD_PROFILE',
      recordType: 'child_profile',
      recordId: child.id,
      previousValue: { displayName: child.displayName, ageGroup: child.ageGroup },
      reason: 'Parent deleted child profile',
      ip: getClientIp(req),
      summary: `Deleted child profile ${child.id} (${child.displayName})`,
    });
    delete db.children[child.id];
    saveDb(db);
    res.json({ deleted: true });
  });

  // ------------------------------------------------------------------
  // 1. PUBLIC EXAM CONFIG & PUBLISHED CMS CONTENT
  // ------------------------------------------------------------------
  app.get('/api/config/exams', (_req, res) => {
    res.json(db.examConfig);
  });

  app.get('/api/cms/content', (_req, res) => {
    res.json({
      lessons: db.customLessons.filter((l) => l.published),
      customQuestionsCount: db.customQuestions.filter((q) => q.published !== false).length,
    });
  });

  // ------------------------------------------------------------------
  // 1B. LEVEL 1 BACKEND-GRADED ASSESSMENT ENGINE (75 LESSONS / 750 QS)
  // ------------------------------------------------------------------
  app.post('/api/level1/assessment/start', (req: AuthenticatedRequest, res) => {
    const { childId, lessonId, questionCount } = req.body as {
      childId?: string;
      lessonId?: string;
      questionCount?: number;
    };

    if (!childId || !lessonId) {
      return res.status(400).json({ error: 'childId and lessonId are required' });
    }

    const access = assertChildAccess(req, res, childId);
    if (!access) return;

    const lesson = getLevel1LessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Level 1 lesson not found' });
    }

    const pool = getQuestionsForLevel1Lesson(lessonId);
    if (pool.length === 0) {
      return res.status(404).json({ error: 'No assessment items found for this lesson' });
    }

    // Include unseen-example + independent challenge, plus shuffled core items without duplicates
    const core = pool.filter((q) => q.qType !== 'new-example' && q.qType !== 'independent');
    const extras = pool.filter((q) => q.qType === 'new-example' || q.qType === 'independent');
    const shuffledCore = [...core].sort(() => Math.random() - 0.5);
    const target = Math.min(pool.length, Math.max(4, questionCount || 6));
    const selected = [...shuffledCore.slice(0, Math.max(2, target - extras.length)), ...extras].slice(0, target);

    const attemptId = `l1_${crypto.randomBytes(6).toString('hex')}`;
    db.level1Attempts[attemptId] = {
      id: attemptId,
      childId,
      parentId: req.authSession?.user.id,
      lessonId,
      questionIds: selected.map((q) => q.id),
      submitted: false,
      createdAt: new Date().toISOString(),
    };
    saveDb(db);

    const sanitized = selected.map(({ correctOptionId: _c, feedbackOnWrong: _f, ...rest }) => rest);
    res.json({
      attemptId,
      lessonId,
      totalQuestions: sanitized.length,
      passingPercentage: 80,
      questions: sanitized,
    });
  });

  app.post('/api/level1/assessment/submit', (req: AuthenticatedRequest, res) => {
    const { attemptId, answers = {} } = req.body as {
      attemptId?: string;
      answers?: Record<string, string>;
    };

    if (!attemptId || !db.level1Attempts[attemptId]) {
      return res.status(404).json({ error: 'Level 1 assessment attempt not found' });
    }

    const attempt = db.level1Attempts[attemptId];
    if (attempt.parentId) {
      if (!req.authSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (attempt.parentId !== req.authSession.user.id && req.authSession.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden: assessment belongs to another parent' });
      }
    }

    if (attempt.submitted && attempt.result) {
      return res.json({ ...attempt.result, review: [], duplicateBlocked: true });
    }

    const bankMap = new Map(LEVEL1_QUESTION_BANK.map((q) => [q.id, q]));
    let score = 0;

    const review = attempt.questionIds.map((qId) => {
      const q = bankMap.get(qId);
      const rawSelected = typeof answers[qId] === 'string' ? answers[qId] : '';
      const validOpt = q?.options.some((o) => o.id === rawSelected);
      const selectedOptionId = validOpt ? rawSelected : '';
      const isCorrect = Boolean(q && selectedOptionId === q.correctOptionId);
      if (isCorrect) score += 1;
      return {
        questionId: qId,
        prompt: q?.prompt || { ar: '', en: '' },
        selectedOptionId,
        correctOptionId: q?.correctOptionId || '',
        isCorrect,
        feedbackOnWrong: q?.feedbackOnWrong || { ar: '', en: '' },
      };
    });

    const totalQuestions = attempt.questionIds.length || 1;
    const percentage = Math.round((score / totalQuestions) * 100);
    const demonstrated = percentage >= 80;
    const status: Level1LessonProgress['status'] = demonstrated ? 'demonstrated' : 'needs-revision';
    const revisionHours = demonstrated ? 48 : 12;
    const revisionDueAt = new Date(Date.now() + revisionHours * 3600_000).toISOString();

    const result = {
      score,
      totalQuestions,
      percentage,
      demonstrated,
      status,
      revisionDueAt,
    };

    attempt.submitted = true;
    attempt.result = result;

    // Persist progress to stored child record if applicable
    const storedChild = db.children[attempt.childId];
    const lesson = getLevel1LessonById(attempt.lessonId);
    if (storedChild && lesson) {
      const prevMap = storedChild.level1Progress || {};
      const prev = prevMap[lesson.id];
      const mistakesInThis = totalQuestions - score;
      storedChild.level1Progress = {
        ...prevMap,
        [lesson.id]: {
          lessonId: lesson.id,
          subject: lesson.subject,
          startedAt: prev?.startedAt || attempt.createdAt,
          explanationViewed: true,
          completedActivityIds: prev?.completedActivityIds || lesson.activityFormats,
          correctCount: (prev?.correctCount || 0) + score,
          mistakesCount: (prev?.mistakesCount || 0) + mistakesInThis,
          lastScore: score,
          lastTotal: totalQuestions,
          attemptsCount: (prev?.attemptsCount || 0) + 1,
          status:
            prev?.status === 'demonstrated' && !demonstrated
              ? 'needs-revision'
              : status,
          lastPracticedAt: new Date().toISOString(),
          revisionDueAt,
        },
      };
      storedChild.stars += demonstrated ? 4 : 2;
    }

    saveDb(db);
    res.json({ ...result, review });
  });

  // ------------------------------------------------------------------
  // 2. SECURE BACKEND PAYMENT CHECKOUT & VERIFICATION (50 EGP default)
  // ------------------------------------------------------------------
  app.post('/api/payments/create-checkout', (req: AuthenticatedRequest, res) => {
    if (!db.featureFlags.paidAssessmentsEnabled) {
      return res.status(403).json({
        error: 'Paid assessments are currently disabled by administrator',
        featureDisabled: 'paidAssessmentsEnabled',
      });
    }
    const { childId, subject, parentConfirmed } = req.body as {
      childId?: string;
      subject?: ExamSubject;
      parentConfirmed?: boolean;
    };

    if (parentConfirmed !== true || !childId) {
      return res.status(400).json({ error: 'Parental confirmation and childId are required' });
    }

    const access = assertChildAccess(req, res, childId);
    if (!access) return;

    const allowedSubjects: ExamSubject[] = ['comprehensive', 'arabic', 'english', 'math', 'colors-science'];
    const safeSubject: ExamSubject = allowedSubjects.includes(subject as ExamSubject)
      ? (subject as ExamSubject)
      : 'comprehensive';

    const sessionId = `chk_${crypto.randomBytes(6).toString('hex')}`;
    const session: CheckoutSession = {
      id: sessionId,
      childId,
      parentId: req.authSession?.user.id,
      subject: safeSubject,
      amountEgp: db.examConfig.examPriceEgp, // Always authoritative from server DB!
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.checkoutSessions[sessionId] = session;
    saveDb(db);

    res.json({
      checkoutSessionId: sessionId,
      amountEgp: session.amountEgp,
      currency: db.examConfig.currency,
      gatewayMode: db.examConfig.paymentGatewayMode,
    });
  });

  app.post('/api/payments/verify', (req: AuthenticatedRequest, res) => {
    const { checkoutSessionId } = req.body as { checkoutSessionId?: string };
    if (!checkoutSessionId || !db.checkoutSessions[checkoutSessionId]) {
      return res.status(404).json({ error: 'Checkout session not found' });
    }

    const session = db.checkoutSessions[checkoutSessionId];
    if (session.parentId) {
      if (!req.authSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (session.parentId !== req.authSession.user.id && req.authSession.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden: checkout belongs to another parent' });
      }
    }

    if (session.tokenConsumed) {
      return res.status(409).json({ error: 'Checkout session payment token has already been used' });
    }

    if (!session.paymentToken) {
      session.status = 'verified';
      session.verifiedAt = new Date().toISOString();
      session.paymentToken = `paytok_${crypto.randomBytes(12).toString('hex')}`;
      appendSecurityLog(db.securityLogs, {
        eventType: 'PAYMENT_VERIFIED',
        actorId: req.authSession?.user.id,
        ip: getClientIp(req),
        summary: `Verified ${session.amountEgp} ${db.examConfig.currency} exam checkout ${session.id}`,
      });
      saveDb(db);
    }

    res.json({
      verified: true,
      checkoutSessionId: session.id,
      amountPaidEgp: session.amountEgp,
      paymentVerificationToken: session.paymentToken,
      gatewayMode: db.examConfig.paymentGatewayMode,
    });
  });

  // ------------------------------------------------------------------
  // 3. BACKEND-VERIFIED 40-QUESTION EXAM ENGINE & GRADING
  // ------------------------------------------------------------------
  app.post('/api/exams/start', (req: AuthenticatedRequest, res) => {
    const {
      childId,
      childName,
      ageGroup,
      subject = 'comprehensive',
      mode = 'practice',
      questionCount,
      paymentVerificationToken,
      studiedConceptIds = [],
    } = req.body as {
      childId?: string;
      childName?: string;
      ageGroup?: AgeGroupId;
      subject?: ExamSubject;
      mode?: 'practice' | 'official';
      questionCount?: number;
      paymentVerificationToken?: string;
      studiedConceptIds?: string[];
    };

    if (!childId || !ageGroup) {
      return res.status(400).json({ error: 'childId and ageGroup are required' });
    }

    const access = assertChildAccess(req, res, childId);
    if (!access) return;

    let paidAmount = 0;
    let paymentVerified = false;

    if (mode === 'official') {
      const matchedSession = Object.values(db.checkoutSessions).find(
        (s) =>
          s.status === 'verified' &&
          s.paymentToken === paymentVerificationToken &&
          !s.tokenConsumed &&
          s.childId === childId,
      );
      if (!matchedSession) {
        return res.status(402).json({
          error: 'Official exam requires verified server payment confirmation',
        });
      }
      matchedSession.tokenConsumed = true;
      paymentVerified = true;
      paidAmount = matchedSession.amountEgp;
    }

    const fullBank = [
      ...db.customQuestions.filter((q) => q.published !== false),
      ...VALIDATED_EXAM_BANK.filter((q) => q.published !== false),
    ];

    const ageFiltered = fullBank.filter(
      (q) =>
        q.ageGroups.includes(ageGroup) &&
        (subject === 'comprehensive' ? true : q.subject === subject),
    );

    const seen = new Set<string>();
    const uniquePool: ExamQuestionItem[] = [];
    for (const q of ageFiltered) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        uniquePool.push(q);
      }
    }

    const safeStudied = Array.isArray(studiedConceptIds) ? studiedConceptIds : [];
    const prioritized = uniquePool.sort((a, b) => {
      const aStudied = safeStudied.some((id) => a.lessonRefId.includes(id)) ? -1 : 0;
      const bStudied = safeStudied.some((id) => b.lessonRefId.includes(id)) ? -1 : 0;
      if (aStudied !== bStudied) return aStudied - bStudied;
      return Math.random() - 0.5;
    });

    const targetCount =
      mode === 'official'
        ? db.examConfig.questionsPerExam
        : Math.min(questionCount || 10, db.examConfig.questionsPerExam);

    const selected = prioritized.slice(0, Math.min(targetCount, prioritized.length));

    const attemptId = `ex_${crypto.randomBytes(6).toString('hex')}`;
    db.examAttempts[attemptId] = {
      id: attemptId,
      childId,
      parentId: req.authSession?.user.id,
      childName: sanitizeShortText(childName || 'Explorer', 60) || 'Explorer',
      ageGroup,
      subject,
      mode,
      questionIds: selected.map((q) => q.id),
      paymentVerified,
      amountPaidEgp: paidAmount,
      passingPercentage: db.examConfig.passingPercentage,
      submitted: false,
      createdAt: new Date().toISOString(),
    };
    saveDb(db);

    const sanitizedQuestions = selected.map(({ correctOptionId: _c, explanation: _e, ...rest }) => rest);

    res.json({
      attemptId,
      mode,
      subject,
      ageGroup,
      totalQuestions: sanitizedQuestions.length,
      passingPercentage: db.examConfig.passingPercentage,
      questions: sanitizedQuestions,
    });
  });

  app.post('/api/exams/submit', (req: AuthenticatedRequest, res) => {
    const { attemptId, answers = {} } = req.body as {
      attemptId?: string;
      answers?: Record<string, string>;
    };

    if (!attemptId || !db.examAttempts[attemptId]) {
      return res.status(404).json({ error: 'Exam attempt not found' });
    }

    const attempt = db.examAttempts[attemptId];
    if (attempt.parentId) {
      if (!req.authSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (attempt.parentId !== req.authSession.user.id && req.authSession.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden: exam attempt belongs to another parent' });
      }
    }

    if (attempt.submitted && attempt.summary) {
      const existingCert = attempt.certificateCode ? db.certificates[attempt.certificateCode] : undefined;
      return res.json({
        summary: attempt.summary,
        certificate: existingCert,
        review: [],
        duplicateBlocked: true,
      });
    }

    const fullBank = [...db.customQuestions, ...VALIDATED_EXAM_BANK];
    const bankMap = new Map(fullBank.map((q) => [q.id, q]));

    let correctCount = 0;
    const weakLessonsMap = new Map<string, LocalizedText>();

    const review = attempt.questionIds.map((qId) => {
      const q = bankMap.get(qId);
      const rawSelected = typeof answers[qId] === 'string' ? answers[qId] : '';
      const validOpt = q?.options.some((o) => o.id === rawSelected);
      const selectedOptionId = validOpt ? rawSelected : '';
      const isCorrect = Boolean(q && selectedOptionId === q.correctOptionId);
      if (isCorrect) {
        correctCount += 1;
      } else if (q) {
        weakLessonsMap.set(q.lessonRefId, q.lessonTitle);
      }
      return {
        questionId: qId,
        prompt: q?.prompt || { ar: '', en: '' },
        selectedOptionId,
        correctOptionId: q?.correctOptionId || '',
        isCorrect,
        explanation: q?.explanation || { ar: '', en: '' },
        lessonTitle: q?.lessonTitle || { ar: '', en: '' },
      };
    });

    const total = attempt.questionIds.length || 1;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= attempt.passingPercentage;
    const weakLessonTitles = Array.from(weakLessonsMap.values()).slice(0, 6);

    let issuedCert: Certificate | undefined;

    if (attempt.mode === 'official' && attempt.paymentVerified && passed && db.featureFlags.certificatesEnabled) {
      const uniqueCode = `NLC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const meta = subjectToWorld(attempt.subject);
      issuedCert = {
        id: `cert-${attempt.id}`,
        uniqueCode,
        childName: attempt.childName,
        worldId: meta.worldId,
        worldName: meta.worldName,
        achievementTitle: {
          ar: `شهادة اجتياز الامتحان الرسمي — ${meta.worldName.ar}`,
          en: `Official Certified Exam — ${meta.worldName.en}`,
        },
        issuedAt: new Date().toISOString(),
        levelCompleted: attempt.ageGroup === '8' ? 4 : attempt.ageGroup === '7' ? 3 : attempt.ageGroup === '5-6' ? 2 : 1,
        isOfficialExam: true,
        examSubject: attempt.subject,
        score: correctCount,
        totalQuestions: total,
        percentage,
        passingPercentage: attempt.passingPercentage,
        ageGroup: attempt.ageGroup,
        verificationUrl: `/api/certificates/verify/${uniqueCode}`,
      };
      db.certificates[uniqueCode] = issuedCert;
      attempt.certificateCode = uniqueCode;
      appendSecurityLog(db.securityLogs, {
        eventType: 'CERT_ISSUED',
        actorId: attempt.parentId,
        ip: getClientIp(req),
        summary: `Issued certificate ${uniqueCode} (${correctCount}/${total})`,
      });
    }

    const summary: ExamAttemptSummary = {
      id: attempt.id,
      childId: attempt.childId,
      childName: attempt.childName,
      ageGroup: attempt.ageGroup,
      subject: attempt.subject,
      mode: attempt.mode,
      score: correctCount,
      totalQuestions: total,
      percentage,
      passed,
      passingPercentage: attempt.passingPercentage,
      weakLessonTitles,
      certificateCode: issuedCert?.uniqueCode,
      completedAt: new Date().toISOString(),
      paymentVerified: attempt.paymentVerified,
      amountPaidEgp: attempt.amountPaidEgp,
    };

    attempt.submitted = true;
    attempt.summary = summary;
    appendSecurityLog(db.securityLogs, {
      eventType: 'EXAM_COMPLETED',
      actorId: attempt.parentId,
      ip: getClientIp(req),
      summary: `Completed ${attempt.mode} exam (${correctCount}/${total} = ${percentage}%)`,
    });
    saveDb(db);

    res.json({
      summary,
      certificate: issuedCert,
      review,
    });
  });

  // ------------------------------------------------------------------
  // 4. CERTIFICATE VERIFICATION ENDPOINT
  // ------------------------------------------------------------------
  app.get('/api/certificates/verify/:code', (req, res) => {
    const code = (req.params.code || '').trim().toUpperCase();
    const cert = db.certificates[code];
    if (!cert) {
      return res.status(404).json({ valid: false, error: 'Certificate not found' });
    }
    res.json({
      valid: !cert.revoked,
      revoked: Boolean(cert.revoked),
      certificate: cert,
    });
  });

  // ------------------------------------------------------------------
  // 5. ADMIN CONTENT MANAGEMENT SYSTEM & RBAC APIs
  // ------------------------------------------------------------------
  app.get('/api/admin/overview', requireAdminPermission('manage_lessons'), (_req, res) => {
    const attempts = Object.values(db.examAttempts)
      .filter((a) => a.submitted && a.summary)
      .map((a) => a.summary!);
    const certificates = Object.values(db.certificates);
    res.json({
      examConfig: db.examConfig,
      customLessons: db.customLessons,
      customQuestions: db.customQuestions,
      builtInQuestionsCount: VALIDATED_EXAM_BANK.length,
      certificates,
      examAttempts: attempts,
    });
  });

  app.get('/api/admin/security-logs', requireAdminPermission('view_security_logs'), (_req, res) => {
    res.json({ logs: db.securityLogs.slice(0, 100) });
  });

  app.post('/api/admin/users/role', requireAdminPermission('view_security_logs'), (req: AuthenticatedRequest, res) => {
    const { userId, role } = req.body as { userId?: string; role?: UserRole };
    const allowed: UserRole[] = [
      'parent',
      'student',
      'teacher',
      'support_agent',
      'content_admin',
      'curriculum_manager',
      'finance_admin',
      'super_admin',
    ];
    if (!userId || !db.users[userId] || !role || !allowed.includes(role)) {
      return res.status(400).json({ error: 'Valid userId and role are required' });
    }
    const prevRole = db.users[userId].role;
    db.users[userId].role = role;
    db.users[userId].updatedAt = new Date().toISOString();
    recordAuditEvent(db, {
      eventType: 'ADMIN_ACTION',
      actorId: req.authSession?.user.id,
      actorRole: req.authSession?.user.role || 'admin',
      actionType: 'UPDATE_USER_ROLE',
      recordType: 'user_role',
      recordId: userId,
      previousValue: { role: prevRole },
      newValue: { role },
      reason: 'Administrator updated user role',
      ip: getClientIp(req),
      summary: `Updated role for ${userId}: ${prevRole} -> ${role}`,
    });
    saveDb(db);
    res.json({ user: toSafeUser(db.users[userId]) });
  });

  app.put('/api/admin/exam-config', requireAdminPermission('manage_exam_config'), (req: AuthenticatedRequest, res) => {
    const prevCfg = { ...db.examConfig };
    const { examPriceEgp, passingPercentage, questionsPerExam } = req.body as Partial<ExamConfig>;
    if (typeof examPriceEgp === 'number' && examPriceEgp >= 0 && examPriceEgp <= 5000) {
      db.examConfig.examPriceEgp = Math.round(examPriceEgp);
    }
    if (typeof passingPercentage === 'number' && passingPercentage >= 50 && passingPercentage <= 100) {
      db.examConfig.passingPercentage = Math.round(passingPercentage);
    }
    if (typeof questionsPerExam === 'number' && questionsPerExam >= 10 && questionsPerExam <= 60) {
      db.examConfig.questionsPerExam = Math.round(questionsPerExam);
    }
    recordAuditEvent(db, {
      eventType: 'ADMIN_ACTION',
      actorId: req.authSession?.user.id,
      actorRole: req.authSession?.user.role || 'admin',
      actionType: 'UPDATE_EXAM_CONFIG',
      recordType: 'exam_config',
      recordId: 'global',
      previousValue: prevCfg,
      newValue: db.examConfig,
      ip: getClientIp(req),
      summary: `Updated exam config (price=${db.examConfig.examPriceEgp}, pass=${db.examConfig.passingPercentage}%)`,
    });
    saveDb(db);
    res.json(db.examConfig);
  });

  app.post('/api/admin/lessons', requireAdminPermission('manage_lessons'), (req, res) => {
    const body = req.body as Omit<CmsLessonRecord, 'id' | 'updatedAt'>;
    if (!body?.title?.ar || !body?.title?.en) {
      return res.status(400).json({ error: 'Lesson title (ar and en) is required' });
    }
    const lesson: CmsLessonRecord = {
      ...body,
      title: {
        ar: sanitizeShortText(body.title.ar, 120),
        en: sanitizeShortText(body.title.en, 120),
      },
      summary: {
        ar: sanitizeShortText(body.summary?.ar || body.title.ar, 500),
        en: sanitizeShortText(body.summary?.en || body.title.en, 500),
      },
      id: `cms-lesson-${crypto.randomBytes(4).toString('hex')}`,
      updatedAt: new Date().toISOString(),
    };
    db.customLessons.unshift(lesson);
    saveDb(db);
    res.json(lesson);
  });

  app.patch('/api/admin/lessons/:id', requireAdminPermission('manage_lessons'), (req, res) => {
    const idx = db.customLessons.findIndex((l) => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Lesson not found' });
    db.customLessons[idx] = {
      ...db.customLessons[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json(db.customLessons[idx]);
  });

  app.delete('/api/admin/lessons/:id', requireAdminPermission('manage_lessons'), (req, res) => {
    db.customLessons = db.customLessons.filter((l) => l.id !== req.params.id);
    saveDb(db);
    res.json({ deleted: true });
  });

  app.post('/api/admin/questions', requireAdminPermission('manage_questions'), (req, res) => {
    const body = req.body as Omit<ExamQuestionItem, 'id'>;
    if (!body?.prompt?.ar || !Array.isArray(body.options) || body.options.length < 2) {
      return res.status(400).json({ error: 'Question prompt and at least 2 options are required' });
    }
    const question: ExamQuestionItem = {
      ...body,
      id: `cms-q-${crypto.randomBytes(4).toString('hex')}`,
      published: body.published ?? true,
    };
    db.customQuestions.unshift(question);
    saveDb(db);
    res.json(question);
  });

  app.patch('/api/admin/questions/:id', requireAdminPermission('manage_questions'), (req, res) => {
    const idx = db.customQuestions.findIndex((q) => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Question not found' });
    db.customQuestions[idx] = { ...db.customQuestions[idx], ...req.body };
    saveDb(db);
    res.json(db.customQuestions[idx]);
  });

  app.delete('/api/admin/questions/:id', requireAdminPermission('manage_questions'), (req, res) => {
    db.customQuestions = db.customQuestions.filter((q) => q.id !== req.params.id);
    saveDb(db);
    res.json({ deleted: true });
  });

  app.patch('/api/admin/certificates/:code', requireAdminPermission('manage_certificates'), (req: AuthenticatedRequest, res) => {
    const cert = db.certificates[req.params.code];
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    const prevRevoked = Boolean(cert.revoked);
    cert.revoked = Boolean(req.body.revoked);
    recordAuditEvent(db, {
      eventType: 'ADMIN_ACTION',
      actorId: req.authSession?.user.id,
      actorRole: req.authSession?.user.role || 'admin',
      actionType: cert.revoked ? 'REVOKE_CERTIFICATE' : 'RESTORE_CERTIFICATE',
      recordType: 'certificate',
      recordId: cert.uniqueCode,
      previousValue: { revoked: prevRevoked },
      newValue: { revoked: cert.revoked },
      ip: getClientIp(req),
      summary: `Certificate ${cert.uniqueCode} revoked=${cert.revoked}`,
    });
    saveDb(db);
    res.json(cert);
  });

  // ------------------------------------------------------------------
  // 6. SERVER-SIDE YOUTUBE STATUS (@Future-p6l)
  // ------------------------------------------------------------------
  app.get('/api/youtube/status', async (_req, res) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelHandle = '@Future-p6l';
    const channelUrl = 'https://www.youtube.com/@Future-p6l';

    if (!apiKey) {
      return res.json({
        configured: false,
        channelHandle,
        channelUrl,
        videos: [],
      });
    }

    try {
      const chUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      chUrl.searchParams.set('part', 'contentDetails,snippet');
      chUrl.searchParams.set('forHandle', 'Future-p6l');
      chUrl.searchParams.set('key', apiKey);

      const chRes = await fetch(chUrl.toString());
      if (!chRes.ok) {
        return res.json({ configured: true, error: 'YouTube API request failed', channelHandle, channelUrl, videos: [] });
      }
      const chData = (await chRes.json()) as {
        items?: Array<{
          contentDetails?: { relatedPlaylists?: { uploads?: string } };
        }>;
      };
      const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return res.json({ configured: true, channelHandle, channelUrl, videos: [] });
      }

      const plUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      plUrl.searchParams.set('part', 'snippet');
      plUrl.searchParams.set('maxResults', '12');
      plUrl.searchParams.set('playlistId', uploadsPlaylistId);
      plUrl.searchParams.set('key', apiKey);

      const plRes = await fetch(plUrl.toString());
      if (!plRes.ok) {
        return res.json({ configured: true, channelHandle, channelUrl, videos: [] });
      }
      const plData = (await plRes.json()) as {
        items?: Array<{
          snippet?: {
            title?: string;
            publishedAt?: string;
            resourceId?: { videoId?: string };
          };
        }>;
      };

      const videos = (plData.items || [])
        .filter((item) => item.snippet?.resourceId?.videoId)
        .map((item) => {
          const vid = item.snippet!.resourceId!.videoId!;
          const rawTitle = item.snippet!.title || 'NonoLand Video';
          return {
            id: `yt-api-${vid}`,
            videoId: vid,
            title: { ar: rawTitle, en: rawTitle },
            category: 'adventures',
            ageGroups: ['3-4', '5-6', '7', '8'],
            approvedByParent: true,
            featured: false,
            addedAt: item.snippet!.publishedAt || new Date().toISOString(),
          };
        });

      return res.json({
        configured: true,
        channelHandle,
        channelUrl,
        videos,
      });
    } catch {
      return res.json({
        configured: true,
        channelHandle,
        channelUrl,
        videos: [],
      });
    }
  });

  registerTeacherAndLevel2Routes({
    app,
    getDb: () => db,
    saveDb,
    requireAuth,
    requireAdminPermission,
    assertChildAccess,
    createSessionForUser,
    revokeAllUserSessions,
    toSafeUser,
  });

  registerGovernanceAndHomeworkRoutes({
    app,
    getDb: () => db,
    setDb: (next) => {
      db = next;
    },
    saveDb,
    requireAuth,
    requireAdminPermission,
  });

  registerWorldExperienceRoutes({
    app,
    getDb: () => db,
    saveDb,
    requireAuth,
    assertChildAccess,
  });

  registerImmutableAuditGuards(app, requireAdminPermission);

  registerNonoAiRoutes({
    app,
    getDb: () => db,
    saveDb,
    requireAuth,
    assertChildAccess,
  });

  registerSmartAssessmentRoutes({
    app,
    getDb: () => db,
    saveDb,
    requireAuth,
    assertChildAccess,
  });

  registerReadingAndFamilyRoutes({
    app,
    getDb: () => db,
    saveDb,
    requireAuth,
    assertChildAccess,
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NonoLand server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
