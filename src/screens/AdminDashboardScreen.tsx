import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers,
  LogOut,
  Plus,
  Settings,
  Shield,
  Sliders,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminCmsPanel } from '../components/AdminCmsPanel';
import { useNonoLand } from '../context/NonoLandContext';
import { t } from '../i18n/translations';
import type {
  AccountStatus,
  Classroom,
  Level2ProgressionConfig,
  TeacherExam,
  TeacherPermission,
} from '../types/nonoland';
import { DEFAULT_TEACHER_PERMISSIONS } from '../utils/validation';

interface AdminTeacherRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: AccountStatus;
  classesCount: number;
  questionsCount: number;
  examsCount: number;
  teacherProfile?: {
    subjects: string[];
    permissions: TeacherPermission[];
  };
}

interface AdminStudentRow {
  id: string;
  displayName: string;
  ageGroup: string;
  parentName: string;
  studentUserEmail: string;
  level: number;
  stars: number;
}

export const AdminDashboardScreen: React.FC = () => {
  const { authSession, language, navigate, logoutParent } = useNonoLand();
  const [tab, setTab] = useState<'teachers' | 'classes' | 'exams' | 'progression' | 'cms'>('teachers');
  const [adminPin, setAdminPin] = useState('');
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [teachers, setTeachers] = useState<AdminTeacherRow[]>([]);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [classes, setClasses] = useState<Array<Classroom & { teacherName: string; studentNames: string[] }>>([]);
  const [teacherExams, setTeacherExams] = useState<Array<TeacherExam & { teacherName: string }>>([]);
  const [progConfig, setProgConfig] = useState<Level2ProgressionConfig>({
    allowOpenExploration: true,
    minLevel1DemonstratedForBadge: 10,
    requirePlacementOrMasteryForOfficialExam: false,
  });

  const [activityTeacherName, setActivityTeacherName] = useState('');
  const [teacherActivityLogs, setTeacherActivityLogs] = useState<Array<{ id: string; summary: string; createdAt: string }>>([]);

  // Create Teacher Form
  const [newTName, setNewTName] = useState('');
  const [newTEmail, setNewTEmail] = useState('');
  const [newTPassword, setNewTPassword] = useState('');
  const [newTPhone, setNewTPhone] = useState('');

  // Create Class Form
  const [newClsName, setNewClsName] = useState('');
  const [newClsSubject, setNewClsSubject] = useState('comprehensive');
  const [newClsLevel, setNewClsLevel] = useState<'all' | 1 | 2>('all');
  const [newClsTeacherId, setNewClsTeacherId] = useState('');
  const [newClsStudents, setNewClsStudents] = useState<string[]>([]);
  const [addStuMap, setAddStuMap] = useState<Record<string, string>>({});

  const apiFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
      };
      if (authSession.csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method || 'GET')) {
        headers['x-csrf-token'] = authSession.csrfToken;
      }
      if (adminPin.trim()) {
        headers['x-admin-pin'] = adminPin.trim();
      }
      return fetch(url, { ...init, credentials: 'include', headers });
    },
    [authSession.csrfToken, adminPin],
  );

  const loadAdminData = useCallback(async () => {
    try {
      const [tRes, sRes, cRes, eRes, pRes] = await Promise.all([
        apiFetch('/api/admin/teachers'),
        apiFetch('/api/admin/students'),
        apiFetch('/api/admin/classes'),
        apiFetch('/api/admin/exams'),
        apiFetch('/api/admin/progression-config'),
      ]);
      if (tRes.ok) {
        const d = await tRes.json();
        setTeachers(d.teachers || []);
        if (d.teachers?.[0] && !newClsTeacherId) setNewClsTeacherId(d.teachers[0].id);
      }
      if (sRes.ok) setStudents((await sRes.json()).students || []);
      if (cRes.ok) setClasses((await cRes.json()).classes || []);
      if (eRes.ok) setTeacherExams((await eRes.json()).exams || []);
      if (pRes.ok) setProgConfig(await pRes.json());
    } catch {
      // handled cleanly
    }
  }, [apiFetch, newClsTeacherId]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const isRoleAdmin =
    authSession.authenticated &&
    ['super_admin', 'content_admin', 'curriculum_manager', 'finance_admin', 'support_agent'].includes(
      authSession.user?.role || '',
    );

  // If authenticated non-admin, show strict forbidden view
  if (authSession.authenticated && !isRoleAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 nono-card p-8 bg-white text-center space-y-4">
        <Shield className="w-12 h-12 mx-auto text-[#FF6B6B]" />
        <h2 className="text-xl font-extrabold text-[#27345C]">403 — Admin Access Only</h2>
        <p className="text-xs font-bold text-[#27345C]/70">
          Your account role ({authSession.user?.role}) does not have administrator privileges.
        </p>
        <button
          type="button"
          onClick={() => navigate('home')}
          className="px-6 py-2.5 rounded-xl bg-[#8054D9] text-white font-extrabold text-xs cursor-pointer"
        >
          Back Home
        </button>
      </div>
    );
  }

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setNotice('');
    const res = await apiFetch('/api/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: newTName,
        email: newTEmail,
        password: newTPassword,
        phone: newTPhone || undefined,
        status: 'active',
        permissions: DEFAULT_TEACHER_PERMISSIONS,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Could not create teacher');
    setNotice(`Teacher account created: ${data.teacher.email}`);
    setNewTName('');
    setNewTEmail('');
    setNewTPassword('');
    setNewTPhone('');
    await loadAdminData();
  };

  const handleTeacherStatus = async (userId: string, status: AccountStatus) => {
    setErrorMsg('');
    const res = await apiFetch(`/api/admin/teachers/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = await res.json();
      return setErrorMsg(d.error || 'Update failed');
    }
    setNotice(`Teacher status set to ${status}`);
    await loadAdminData();
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await apiFetch('/api/admin/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newClsName,
        subject: newClsSubject,
        level: newClsLevel,
        teacherId: newClsTeacherId,
        studentIds: newClsStudents,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setErrorMsg(data.error || 'Class creation failed');
    setNotice(`Created class: ${data.classroom.name}`);
    setNewClsName('');
    setNewClsStudents([]);
    await loadAdminData();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#1F2937] via-[#27345C] to-[#8054D9] text-white p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#FFD84D]">
            {language === 'ar' ? 'لوحة الإدارة المركزية · نونو لاند' : 'NonoLand System Administration'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {language === 'ar' ? 'إدارة المعلمين والفصول والمناهج' : 'Teachers, Classes, Exams & Level 2 Config'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isRoleAdmin && (
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="Dev Admin PIN (2026)"
              className="h-10 px-3 rounded-xl bg-white/15 border border-white/25 text-xs font-bold text-white placeholder-white/60"
            />
          )}
          <button
            type="button"
            onClick={async () => {
              await logoutParent();
              navigate('home');
            }}
            className="h-10 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'ar' ? 'خروج' : 'Exit'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-[#27345C]/12">
        {[
          { id: 'teachers' as const, label: language === 'ar' ? `المعلمون (${teachers.length})` : `Teachers (${teachers.length})`, icon: <UserCheck className="w-4 h-4" /> },
          { id: 'classes' as const, label: language === 'ar' ? `الفصول والطلاب (${classes.length})` : `Classes & Students (${classes.length})`, icon: <Layers className="w-4 h-4" /> },
          { id: 'exams' as const, label: language === 'ar' ? `مراجعة الامتحانات (${teacherExams.length})` : `Teacher Exams (${teacherExams.length})`, icon: <ClipboardCheck className="w-4 h-4" /> },
          { id: 'progression' as const, label: language === 'ar' ? 'قواعد المستوى ٢' : 'Level 2 Rules', icon: <Sliders className="w-4 h-4" /> },
          { id: 'cms' as const, label: language === 'ar' ? 'إدارة المحتوى والشهادات' : 'CMS & Certificates', icon: <Settings className="w-4 h-4" /> },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
              tab === item.id ? 'bg-[#27345C] text-white' : 'text-[#27345C]/75 hover:bg-[#FFF8E9]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {notice && <div className="p-3 rounded-2xl bg-[#55D98B]/20 text-[#14532D] text-xs font-extrabold">{notice}</div>}
      {errorMsg && <div className="p-3 rounded-2xl bg-[#FF6B6B]/15 text-[#991B1B] text-xs font-extrabold">{errorMsg}</div>}

      {/* TEACHERS MANAGEMENT */}
      {tab === 'teachers' && (
        <div className="space-y-5">
          <form onSubmit={(e) => void handleCreateTeacher(e)} className="nono-card p-5 bg-white space-y-3 text-xs font-bold">
            <h3 className="text-base font-extrabold text-[#27345C] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#8054D9]" />
              <span>{language === 'ar' ? 'إنشاء حساب معلم نشط مباشرة' : 'Create Approved Teacher Account'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input required placeholder="Full Name" value={newTName} onChange={(e) => setNewTName(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20" />
              <input required type="email" placeholder="Teacher Email" value={newTEmail} onChange={(e) => setNewTEmail(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20" />
              <input required type="password" placeholder="Strong Password (12+ chars)" value={newTPassword} onChange={(e) => setNewTPassword(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20" />
              <input placeholder="Phone (+20...)" value={newTPhone} onChange={(e) => setNewTPhone(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20" />
            </div>
            <button type="submit" className="nono-btn-tactile px-5 py-2 rounded-xl bg-[#8054D9] text-white font-extrabold cursor-pointer">Create Teacher</button>
          </form>

          <div className="nono-card p-5 bg-white space-y-3">
            <h3 className="text-base font-extrabold text-[#27345C]">
              {language === 'ar' ? 'قائمة المعلمين وطلبات الموافقة' : 'All Teachers & Pending Approvals'}
            </h3>
            {teachers.map((tc) => (
              <div key={tc.id} className="p-4 rounded-2xl border border-[#27345C]/12 bg-[#FFF8E9]/45 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#27345C]">{tc.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-extrabold ${
                        tc.status === 'active'
                          ? 'bg-[#55D98B]/25 text-[#14532D]'
                          : tc.status === 'pending'
                            ? 'bg-[#FFD84D]/50 text-[#78350F]'
                            : 'bg-[#FF6B6B]/20 text-[#991B1B]'
                      }`}
                    >
                      {tc.status}
                    </span>
                  </div>
                  <p className="text-[#27345C]/65">{tc.email} · Classes: {tc.classesCount} · Qs: {tc.questionsCount} · Exams: {tc.examsCount}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tc.status !== 'active' && (
                    <button type="button" onClick={() => void handleTeacherStatus(tc.id, 'active')} className="px-3 py-1.5 rounded-lg bg-[#55D98B] text-[#27345C] font-extrabold cursor-pointer">
                      Approve / Activate
                    </button>
                  )}
                  {tc.status === 'active' && (
                    <button type="button" onClick={() => void handleTeacherStatus(tc.id, 'suspended')} className="px-3 py-1.5 rounded-lg bg-[#FF6B6B]/20 text-[#991B1B] font-extrabold cursor-pointer">
                      Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await apiFetch(`/api/admin/teachers/${tc.id}/activity`);
                      if (r.ok) {
                        setActivityTeacherName(tc.name);
                        setTeacherActivityLogs((await r.json()).logs || []);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#27345C]/15 cursor-pointer"
                  >
                    Activity Log
                  </button>
                </div>
              </div>
            ))}
            {teacherActivityLogs.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#E5F6FF] space-y-1.5 text-xs font-bold">
                <p className="font-extrabold">Activity Logs — {activityTeacherName}</p>
                {teacherActivityLogs.slice(0, 10).map((lg) => (
                  <p key={lg.id}>{new Date(lg.createdAt).toLocaleString()} — {lg.summary}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLASSES & STUDENTS */}
      {tab === 'classes' && (
        <div className="space-y-5">
          <form onSubmit={(e) => void handleCreateClass(e)} className="nono-card p-5 bg-white space-y-3 text-xs font-bold">
            <h3 className="text-base font-extrabold text-[#27345C]">Create Class & Assign Teacher + Students</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input required placeholder="Class Name (e.g. Level 2 Explorers A)" value={newClsName} onChange={(e) => setNewClsName(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20" />
              <input placeholder="Subject" value={newClsSubject} onChange={(e) => setNewClsSubject(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20" />
              <select value={newClsLevel} onChange={(e) => setNewClsLevel(e.target.value === '1' ? 1 : e.target.value === '2' ? 2 : 'all')} className="h-10 px-3 rounded-xl border border-[#27345C]/20 bg-white">
                <option value="all">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
              </select>
              <select required value={newClsTeacherId} onChange={(e) => setNewClsTeacherId(e.target.value)} className="h-10 px-3 rounded-xl border border-[#27345C]/20 bg-white">
                <option value="">-- Assign Teacher --</option>
                {teachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.name} ({tc.status})</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {students.map((st) => {
                const picked = newClsStudents.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setNewClsStudents((prev) => picked ? prev.filter((x) => x !== st.id) : [...prev, st.id])}
                    className={`px-2.5 py-1 rounded-lg border cursor-pointer ${picked ? 'bg-[#8054D9] text-white' : 'bg-[#FFF8E9]'}`}
                  >
                    {st.displayName} ({st.ageGroup})
                  </button>
                );
              })}
            </div>
            <button type="submit" className="nono-btn-tactile px-5 py-2 rounded-xl bg-[#55D98B] text-[#27345C] font-extrabold cursor-pointer">Create Class</button>
          </form>

          <div className="nono-card p-5 bg-white space-y-3">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 rounded-2xl border border-[#27345C]/12 bg-[#FFF8E9]/45 space-y-2 text-xs font-bold">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#27345C]">{cls.name}</h4>
                    <p>Teacher: {cls.teacherName} · Subject: {cls.subject} · Level: {cls.level}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/classes/${cls.id}`, { method: 'DELETE' });
                        await loadAdminData();
                      }}
                      className="p-1.5 rounded-lg bg-[#FF6B6B]/15 text-[#991B1B] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {cls.studentIds.map((sid, idx) => (
                    <span key={sid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border">
                      {cls.studentNames[idx] || sid}
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/admin/classes/${cls.id}/students/${sid}`, { method: 'DELETE' });
                          await loadAdminData();
                        }}
                        className="text-[#991B1B] font-extrabold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <select
                    value={addStuMap[cls.id] || ''}
                    onChange={(e) => setAddStuMap((p) => ({ ...p, [cls.id]: e.target.value }))}
                    className="h-8 px-2 rounded-lg border bg-white"
                  >
                    <option value="">+ Add Student</option>
                    {students.filter((st) => !cls.studentIds.includes(st.id)).map((st) => (
                      <option key={st.id} value={st.id}>{st.displayName}</option>
                    ))}
                  </select>
                  {addStuMap[cls.id] && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/classes/${cls.id}/students`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ studentId: addStuMap[cls.id] }),
                        });
                        setAddStuMap((p) => ({ ...p, [cls.id]: '' }));
                        await loadAdminData();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#8054D9] text-white cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER EXAMS REVIEW */}
      {tab === 'exams' && (
        <div className="nono-card p-5 bg-white space-y-3 text-xs font-bold">
          <h3 className="text-base font-extrabold text-[#27345C]">Teacher Exams Governance Queue</h3>
          {teacherExams.map((ex) => (
            <div key={ex.id} className="p-4 rounded-2xl border border-[#27345C]/12 flex flex-wrap justify-between items-center gap-2">
              <div>
                <p className="font-extrabold text-sm">{t(ex.title, language)} ({ex.status})</p>
                <p>By {ex.teacherName} · L{ex.level} · {ex.subject} · {ex.totalQuestions} Qs</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/exams/${ex.id}/review`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'published' }),
                    });
                    await loadAdminData();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#55D98B] text-[#27345C] font-extrabold cursor-pointer"
                >
                  Approve / Publish
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/exams/${ex.id}/review`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'suspended' }),
                    });
                    await loadAdminData();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FF6B6B]/15 text-[#991B1B] cursor-pointer"
                >
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEVEL 2 PROGRESSION RULES */}
      {tab === 'progression' && (
        <div className="nono-card p-5 bg-white space-y-4 text-xs font-bold">
          <h3 className="text-base font-extrabold text-[#27345C]">Level 2 Progression & Exploration Rules</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={progConfig.allowOpenExploration}
              onChange={(e) => setProgConfig((p) => ({ ...p, allowOpenExploration: e.target.checked }))}
            />
            <span>Allow learners to freely explore Level 2 subjects even without finishing all 75 Level 1 lessons</span>
          </label>
          <div>
            <label className="block mb-1">Minimum Level 1 demonstrated lessons recommended before Level 2 Readiness Badge</label>
            <input
              type="number"
              min={0}
              max={75}
              value={progConfig.minLevel1DemonstratedForBadge}
              onChange={(e) => setProgConfig((p) => ({ ...p, minLevel1DemonstratedForBadge: Number(e.target.value) }))}
              className="h-10 px-3 rounded-xl border border-[#27345C]/20"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              const r = await apiFetch('/api/admin/progression-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progConfig),
              });
              if (r.ok) setNotice('Saved Level 2 progression rules.');
            }}
            className="nono-btn-tactile px-6 py-2.5 rounded-xl bg-[#8054D9] text-white font-extrabold cursor-pointer"
          >
            Save Progression Rules
          </button>
        </div>
      )}

      {/* EXISTING ADMIN CMS PANEL */}
      {tab === 'cms' && <AdminCmsPanel language={language} />}
    </div>
  );
};
