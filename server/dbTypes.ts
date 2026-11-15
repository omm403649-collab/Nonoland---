import type express from 'express';
import type {
  AgeGroupId,
  AssignedExamAttempt,
  Certificate,
  ChildProfile,
  Classroom,
  CmsLessonRecord,
  ExamAssignment,
  ExamAttemptSummary,
  ExamConfig,
  ExamQuestionItem,
  ExamSubject,
  Level1LessonProgress,
  Level2LessonProgress,
  Level2ProgressionConfig,
  SecurityEventLog,
  TeacherExam,
  TeacherQuestion,
} from '../src/types/nonoland';
import type { StoredActionToken, StoredSessionRecord, StoredUserRecord } from './security';

export interface CheckoutSession {
  id: string;
  childId: string;
  parentId?: string;
  subject: ExamSubject;
  amountEgp: number;
  status: 'pending' | 'verified';
  paymentToken?: string;
  tokenConsumed?: boolean;
  createdAt: string;
  verifiedAt?: string;
}

export interface StoredExamAttempt {
  id: string;
  childId: string;
  parentId?: string;
  childName: string;
  ageGroup: AgeGroupId;
  subject: ExamSubject;
  mode: 'practice' | 'official';
  questionIds: string[];
  paymentVerified: boolean;
  amountPaidEgp: number;
  passingPercentage: number;
  submitted: boolean;
  summary?: ExamAttemptSummary;
  certificateCode?: string;
  createdAt: string;
}

export interface StoredLevel1Attempt {
  id: string;
  childId: string;
  parentId?: string;
  lessonId: string;
  questionIds: string[];
  submitted: boolean;
  result?: {
    score: number;
    totalQuestions: number;
    percentage: number;
    demonstrated: boolean;
    status: Level1LessonProgress['status'];
    revisionDueAt: string;
  };
  createdAt: string;
}

export interface StoredLevel2Attempt {
  id: string;
  childId: string;
  parentId?: string;
  lessonId: string;
  questionIds: string[];
  submitted: boolean;
  result?: {
    score: number;
    totalQuestions: number;
    percentage: number;
    demonstrated: boolean;
    status: Level2LessonProgress['status'];
    revisionDueAt: string;
    reviewIntervalStep: number;
  };
  createdAt: string;
}

export interface ImportBatchRecord {
  id: string;
  teacherId: string;
  fileName: string;
  format: 'csv' | 'xlsx';
  storedUploadPath: string;
  validRows: Array<{
    rowNumber: number;
    question: Omit<TeacherQuestion, 'id' | 'teacherId' | 'createdAt' | 'updatedAt' | 'version'>;
  }>;
  invalidRows: Array<{ rowNumber: number; errors: string[] }>;
  committed: boolean;
  createdAt: string;
  expiresAt: number;
}

export type StoredChildRecord = ChildProfile & { parentId: string };

export interface ServerDb {
  examConfig: ExamConfig;
  users: Record<string, StoredUserRecord>;
  emailIndex: Record<string, string>;
  sessions: Record<string, StoredSessionRecord>;
  actionTokens: Record<string, StoredActionToken>;
  children: Record<string, StoredChildRecord>;
  customLessons: CmsLessonRecord[];
  customQuestions: ExamQuestionItem[];
  checkoutSessions: Record<string, CheckoutSession>;
  examAttempts: Record<string, StoredExamAttempt>;
  level1Attempts: Record<string, StoredLevel1Attempt>;
  level2Attempts: Record<string, StoredLevel2Attempt>;
  level2ProgressionConfig: Level2ProgressionConfig;
  classes: Record<string, Classroom>;
  teacherQuestions: Record<string, TeacherQuestion>;
  teacherExams: Record<string, TeacherExam>;
  examAssignments: Record<string, ExamAssignment>;
  assignedExamAttempts: Record<string, AssignedExamAttempt>;
  importBatches: Record<string, ImportBatchRecord>;
  certificates: Record<string, Certificate & { revoked?: boolean }>;
  securityLogs: SecurityEventLog[];
}

export interface AuthenticatedRequest extends express.Request {
  authSession?: {
    user: StoredUserRecord;
    session: StoredSessionRecord;
  };
}
