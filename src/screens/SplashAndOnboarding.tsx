import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  MailCheck,
  Plus,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { CinematicWelcomeIntro, INTRO_SKIP_STORAGE_KEY } from '../components/CinematicWelcomeIntro';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { CHARACTER_COMPANIONS } from '../data/rewardsAndRoom';
import { AGE_GROUP_META, t, UI_COPY } from '../i18n/translations';
import { AgeGroupId, Language } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';
import {
  POLICY_VERSION,
  validateChildProfileInput,
  validateEmail,
  validateParentName,
  validatePassword,
} from '../utils/validation';

export const SplashScreen: React.FC = () => {
  return <CinematicWelcomeIntro />;
};

export const OnboardingScreen: React.FC = () => {
  const { navigate, language } = useNonoLand();
  const [step, setStep] = useState(0);

  const slides = [
    {
      emoji: '🦊✨',
      title: { ar: 'أربع تجارب تعلم مختلفة حسب العمر', en: 'Four Distinct Age-Tailored Worlds' },
      body: {
        ar: 'طفل الـ ٣ سنوات يلعب بالصوت واللمس بدون قراءة، وطفل الـ ٥–٦ يتعلم الحروف والأرقام، بينما يحل أبطال ٧–٨ سنوات ألغاز المنطق والعلوم والكسور.',
        en: 'Ages 3–4 explore via voice & touch, 5–6 master letters & patterns, 7-year-olds become detectives, and 8-year-olds tackle fractions, grammar & science.',
      },
      color: 'from-[#8054D9]/15 to-[#FF78B7]/15',
    },
    {
      emoji: '🧭🔬',
      title: { ar: 'مسار ذكي يتكيف مع طفلك', en: 'Adaptive Learning That Adapts to Your Child' },
      body: {
        ar: 'مختبر نونو للاكتشاف يلاحظ المهارات القوية والمهارات التي تحتاج لتدريب لطيف، ويقترح الخطوة التالية دون أي مقارنة أو ضغط.',
        en: "Nono's Discovery Lab observes strengths and gentle practice areas, tailoring the next adventure with zero exam stress.",
      },
      color: 'from-[#39BDF2]/15 to-[#55D98B]/15',
    },
    {
      emoji: '🛡️🏆',
      title: { ar: 'أمان تام، غرف إبداعية، وشهادات', en: 'Parent-Gated Safety, My Room & Certificates' },
      body: {
        ar: 'لا إعلانات ولا تواصل مع غرباء. يحصل الطفل على نجوم وأوسمة وشهادات قابلة للطباعة، ويزيّن غرفته الخاصة بإنجازاته.',
        en: 'Zero ads or public profiles. Children decorate My Room with earned rewards and unlock printable world certificates.',
      },
      color: 'from-[#FFD84D]/25 to-[#FF9360]/15',
    },
  ];

  const current = slides[step];

  return (
    <div className="min-h-screen bg-[#FFF8E9] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl nono-card rounded-3xl p-6 sm:p-10 text-center">
        <div className={`rounded-3xl bg-gradient-to-br ${current.color} p-8 mb-6`}>
          <div className="text-6xl mb-4">{current.emoji}</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#27345C] text-balance">
            {t(current.title, language)}
          </h2>
          <p className="text-[#27345C]/80 mt-3 text-base sm:text-lg leading-relaxed">
            {t(current.body, language)}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-3 rounded-full transition-all cursor-pointer ${
                idx === step ? 'w-10 bg-[#8054D9]' : 'w-3 bg-[#27345C]/20'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('splash')}
            className="px-4 py-3 rounded-2xl text-sm font-bold text-[#27345C]/70 hover:text-[#27345C] cursor-pointer"
          >
            {language === 'ar' ? 'رجوع' : 'Back'}
          </button>

          {step < slides.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                setStep(step + 1);
              }}
              className="nono-btn-tactile px-7 py-3 rounded-2xl bg-[#8054D9] text-white font-bold cursor-pointer"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('parent-auth')}
              className="nono-btn-tactile px-7 py-3 rounded-2xl bg-[#55D98B] text-[#27345C] font-extrabold cursor-pointer"
            >
              {language === 'ar' ? 'متابعة لإعداد الحساب' : 'Continue to Family Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ParentAuthScreen: React.FC = () => {
  const { navigate, language, parentAccount, refreshAuthSession, authSession } = useNonoLand();
  const [mode, setMode] = useState<'register' | 'teacher-register' | 'login' | 'forgot' | 'reset'>('register');
  const [name, setName] = useState(parentAccount?.isDemoMode ? '' : parentAccount?.name || '');
  const [email, setEmail] = useState(parentAccount?.isDemoMode ? '' : parentAccount?.email || '');
  const [phone, setPhone] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>(['arabic', 'english', 'math']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [devNotice, setDevNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pwEval = validatePassword(password, email, name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setDevNotice('');

    if (mode === 'teacher-register') {
      const nCheck = validateParentName(name);
      if (!nCheck.ok) return setErrorMsg(nCheck.error || 'Invalid teacher name');
      const eCheck = validateEmail(email);
      if (!eCheck.ok) return setErrorMsg(eCheck.error || 'Invalid email');
      if (!pwEval.ok) return setErrorMsg(pwEval.error || 'Weak password');
      if (password !== confirmPassword) {
        return setErrorMsg(
          language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.',
        );
      }
      if (!termsAccepted) {
        return setErrorMsg(
          language === 'ar' ? 'يرجى الموافقة على شروط المنصة.' : 'Please accept platform terms.',
        );
      }
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/register-teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: name,
            email,
            phone: phone.trim() || undefined,
            subjects: teacherSubjects,
            password,
            confirmPassword,
            termsAccepted: true,
            policyVersion: POLICY_VERSION,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Teacher registration failed');
          soundEngine.playEncourage();
          return;
        }
        soundEngine.playSuccess();
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setDevNotice(
          language === 'ar'
            ? 'تم استلام طلب حساب المعلم بنجاح! الحساب قيد مراجعة وموافقة الإدارة قبل التفعيل.'
            : 'Teacher account request submitted! Pending administrator approval before login.',
        );
      } catch {
        setErrorMsg(language === 'ar' ? 'تعذر الاتصال بالخادم.' : 'Network error.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'register') {
      const nCheck = validateParentName(name);
      if (!nCheck.ok) return setErrorMsg(nCheck.error || 'Invalid parent name');
      const eCheck = validateEmail(email);
      if (!eCheck.ok) return setErrorMsg(eCheck.error || 'Invalid email');
      if (!pwEval.ok) return setErrorMsg(pwEval.error || 'Weak password');
      if (password !== confirmPassword) {
        return setErrorMsg(
          language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.',
        );
      }
      if (!termsAccepted) {
        return setErrorMsg(
          language === 'ar'
            ? 'يرجى الموافقة الصريحة على سياسة الخصوصية وشروط الاستخدام.'
            : 'Please accept the Privacy Policy and Terms of Use.',
        );
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: name,
            email,
            password,
            termsAccepted: true,
            policyVersion: POLICY_VERSION,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Registration failed');
          soundEngine.playEncourage();
          return;
        }
        soundEngine.playSuccess();
        await refreshAuthSession();
        if (data.devVerificationToken) {
          setVerifyTokenInput(data.devVerificationToken);
          setDevNotice(
            language === 'ar'
              ? `تم إنشاء الحساب! رمز التحقق التجريبي للبريد: ${data.devVerificationToken}`
              : `Account created! Dev email verification token: ${data.devVerificationToken}`,
          );
        } else {
          navigate('create-child');
        }
      } catch {
        setErrorMsg(language === 'ar' ? 'تعذر الاتصال بالخادم.' : 'Network error.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'login') {
      const eCheck = validateEmail(email);
      if (!eCheck.ok) return setErrorMsg(eCheck.error || 'Invalid email');
      if (!password) {
        return setErrorMsg(language === 'ar' ? 'أدخل كلمة المرور.' : 'Enter your password.');
      }
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Invalid email or password');
          soundEngine.playEncourage();
          return;
        }
        soundEngine.playSuccess();
        await refreshAuthSession();
        const role = data.user?.role;
        if (role === 'teacher') {
          navigate('teacher-dashboard');
        } else if (role === 'student') {
          navigate('exams');
        } else if (
          role === 'super_admin' ||
          role === 'content_admin' ||
          role === 'curriculum_manager' ||
          role === 'finance_admin' ||
          role === 'support_agent'
        ) {
          navigate('admin-dashboard');
        } else {
          navigate('home');
        }
      } catch {
        setErrorMsg(language === 'ar' ? 'تعذر الاتصال بالخادم.' : 'Network error.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'forgot') {
      const eCheck = validateEmail(email);
      if (!eCheck.ok) return setErrorMsg(eCheck.error || 'Invalid email');
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setDevNotice(
          data.devResetToken
            ? `${data.message} (Dev token: ${data.devResetToken})`
            : data.message,
        );
        if (data.devResetToken) setResetToken(data.devResetToken);
        setMode('reset');
      } catch {
        setErrorMsg(language === 'ar' ? 'تعذر الاتصال بالخادم.' : 'Network error.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!resetToken.trim()) {
        return setErrorMsg(language === 'ar' ? 'أدخل رمز استعادة كلمة المرور.' : 'Enter reset token.');
      }
      if (!pwEval.ok) return setErrorMsg(pwEval.error || 'Weak password');
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken.trim(), newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Reset failed');
          return;
        }
        soundEngine.playSuccess();
        setPassword('');
        setMode('login');
        setDevNotice(
          language === 'ar'
            ? 'تم تحديث كلمة المرور بنجاح وتسجيل الخروج من جميع الجلسات السابقة.'
            : 'Password updated cleanly and all prior sessions revoked.',
        );
      } catch {
        setErrorMsg(language === 'ar' ? 'تعذر الاتصال بالخادم.' : 'Network error.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleVerifyEmail = async () => {
    if (!verifyTokenInput.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyTokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Verification failed');
        return;
      }
      soundEngine.playSuccess();
      await refreshAuthSession();
      navigate('create-child');
    } catch {
      setErrorMsg(language === 'ar' ? 'تعذر التحقق الآن.' : 'Verification request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E9] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg nono-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#27345C] text-[#FFD84D] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-[#27345C]">
                {mode === 'register'
                  ? language === 'ar'
                    ? 'إنشاء حساب الأهل الآمن'
                    : 'Secure Parent Registration'
                  : mode === 'teacher-register'
                    ? language === 'ar'
                      ? 'طلب تسجيل حساب معلم'
                      : 'Teacher Account Request'
                    : mode === 'login'
                      ? language === 'ar'
                        ? 'تسجيل الدخول الآمن'
                        : 'Unified Secure Login'
                      : mode === 'forgot'
                        ? language === 'ar'
                          ? 'استعادة كلمة المرور'
                          : 'Forgot Password'
                        : language === 'ar'
                          ? 'تعيين كلمة مرور جديدة'
                          : 'Reset Password'}
              </h2>
              <p className="text-xs text-[#27345C]/65">
                {language === 'ar'
                  ? 'الأهل · الطالب · المعلم · الإدارة (توجيه تلقائي حسب الصلاحية)'
                  : 'Parent · Student · Teacher · Admin (Role-verified)'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 bg-[#27345C]/8 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#27345C] shadow-sm' : 'text-[#27345C]/65'
              }`}
            >
              {language === 'ar' ? 'ولي أمر' : 'Parent'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('teacher-register');
                setErrorMsg('');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'teacher-register' ? 'bg-white text-[#8054D9] shadow-sm' : 'text-[#27345C]/65'
              }`}
            >
              {language === 'ar' ? 'معلم' : 'Teacher'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'login' ? 'bg-white text-[#27345C] shadow-sm' : 'text-[#27345C]/65'
              }`}
            >
              {language === 'ar' ? 'دخول' : 'Login'}
            </button>
          </div>
        </div>

        {authSession.authenticated && authSession.user && !authSession.user.emailVerified && (
          <div className="p-4 rounded-2xl bg-[#E5F6FF] border border-[#39BDF2]/40 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-extrabold text-[#27345C]">
              <MailCheck className="w-4 h-4 text-[#8054D9]" />
              <span>
                {language === 'ar'
                  ? 'تأكيد البريد الإلكتروني لإكمال تفعيل الأمان:'
                  : 'Verify your email address to activate full recovery:'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyTokenInput}
                onChange={(e) => setVerifyTokenInput(e.target.value)}
                placeholder="Verification token"
                className="flex-1 h-10 px-3 rounded-xl bg-white border border-[#27345C]/15 font-mono-num"
              />
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleVerifyEmail()}
                className="px-4 h-10 rounded-xl bg-[#55D98B] text-[#27345C] font-extrabold cursor-pointer"
              >
                {language === 'ar' ? 'تأكيد' : 'Verify'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('create-child')}
              className="underline font-bold text-[#8054D9] cursor-pointer"
            >
              {language === 'ar' ? 'أو المتابعة لإضافة طفل الآن' : 'Or continue to Create Child Profile'}
            </button>
          </div>
        )}

        {devNotice && (
          <div className="p-3 rounded-2xl bg-[#E2F9EC] border border-[#55D98B] text-xs font-bold text-[#27345C] break-all">
            {devNotice}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-[#FF4D6D]/12 border border-[#FF4D6D]/30 text-xs font-bold text-[#FF4D6D]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {(mode === 'register' || mode === 'teacher-register') && (
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {mode === 'teacher-register'
                  ? language === 'ar'
                    ? 'اسم المعلم الكامل'
                    : 'Teacher Full Name'
                  : language === 'ar'
                    ? 'اسم ولي الأمر'
                    : 'Parent Display Name'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: أ. نور أحمد' : 'e.g. Ms. Sarah'}
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
              />
            </div>
          )}

          {mode === 'teacher-register' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1.5">
                  {language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (optional)'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201001234567"
                  className="w-full h-11 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-[#27345C]/80">
                  {language === 'ar' ? 'المواد التي تدرسها:' : 'Teaching Subjects:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['arabic', 'english', 'math', 'colors-shapes', 'logic', 'world-around-me'] as const).map((sub) => {
                    const active = teacherSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() =>
                          setTeacherSubjects((prev) =>
                            active ? prev.filter((x) => x !== sub) : [...prev, sub],
                          )
                        }
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer ${
                          active
                            ? 'bg-[#8054D9] text-white border-[#8054D9]'
                            : 'bg-white text-[#27345C] border-[#27345C]/15'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'teacher-register' || mode === 'login' || mode === 'forgot') && (
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'رمز الاستعادة' : 'Reset Token'}
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Token"
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-mono-num"
              />
            </div>
          )}

          {(mode === 'register' || mode === 'teacher-register' || mode === 'login' || mode === 'reset') && (
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar'
                  ? mode === 'reset'
                    ? 'كلمة المرور الجديدة (١٢ حرفاً فأكثر)'
                    : 'كلمة المرور'
                  : mode === 'reset'
                    ? 'New Password (min 12 chars)'
                    : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 px-4 pe-12 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 end-2 px-2 flex items-center text-[#27345C]/65 cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(mode === 'register' || mode === 'teacher-register' || mode === 'reset') && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pwEval.strength === 'excellent' || pwEval.strength === 'strong'
                          ? 'w-full bg-[#55D98B]'
                          : pwEval.strength === 'fair'
                            ? 'w-2/3 bg-[#FFD84D]'
                            : 'w-1/3 bg-[#FF4D6D]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#27345C]/70">
                    {pwEval.ok
                      ? language === 'ar'
                        ? `قوة كلمة المرور: ${pwEval.strength}`
                        : `Password strength: ${pwEval.strength}`
                      : pwEval.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {(mode === 'register' || mode === 'teacher-register') && (
            <>
              <div>
                <label className="block text-sm font-bold mb-1.5">
                  {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-semibold"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFF8E9] border border-[#27345C]/12 cursor-pointer text-xs text-[#27345C]/80">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#8054D9]"
                />
                <span>
                  {language === 'ar'
                    ? `أوافق على سياسة خصوصية الأطفال وشروط الاستخدام (${POLICY_VERSION})`
                    : `I accept the Child Privacy Policy & Terms of Use (${POLICY_VERSION})`}
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full nono-btn-tactile h-13 rounded-2xl bg-[#8054D9] text-white font-extrabold text-base cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? language === 'ar'
                ? 'جاري المعالجة...'
                : 'Processing...'
              : mode === 'register'
                ? language === 'ar'
                  ? 'إنشاء الحساب الآمن والمتابعة'
                  : 'Create Secure Account & Continue'
                : mode === 'teacher-register'
                  ? language === 'ar'
                    ? 'إرسال طلب حساب المعلم (بانتظار الإدارة)'
                    : 'Submit Teacher Request (Pending Approval)'
                  : mode === 'login'
                    ? language === 'ar'
                      ? 'تسجيل الدخول الآمن'
                      : 'Sign In Securely'
                    : mode === 'forgot'
                      ? language === 'ar'
                        ? 'إرسال رابط الاستعادة'
                        : 'Request Password Reset'
                      : language === 'ar'
                        ? 'تحديث كلمة المرور'
                        : 'Update Password'}
          </button>
        </form>

        <div className="pt-3 border-t border-[#27345C]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#27345C]/70">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigate('home')} className="underline cursor-pointer">
              {language === 'ar' ? 'المعاينة بالحساب التجريبي' : 'Explore with Sample Family'}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(INTRO_SKIP_STORAGE_KEY);
                } catch {
                  // ignore
                }
                navigate('splash');
              }}
              className="underline text-[#8054D9] font-bold cursor-pointer"
            >
              {language === 'ar' ? 'إعادة عرض المقدمة' : 'Replay Welcome Intro'}
            </button>
          </div>
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setErrorMsg('');
              }}
              className="flex items-center gap-1 text-[#8054D9] font-bold cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</span>
            </button>
          ) : (
            <button type="button" onClick={() => navigate('splash')} className="cursor-pointer">
              {language === 'ar' ? 'الرئيسية' : 'Back'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CreateChildScreen: React.FC = () => {
  const { navigate, language, createChildProfile } = useNonoLand();
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroupId>('5-6');
  const [childLang, setChildLang] = useState<Language>(language);
  const [birthYear, setBirthYear] = useState(2021);
  const [birthMonth, setBirthMonth] = useState(5);
  const [interests, setInterests] = useState<string[]>(['animals', 'space']);
  const [companionId, setCompanionId] = useState('nono');
  const [scarfColor, setScarfColor] = useState('#8054D9');
  const [childError, setChildError] = useState('');
  const [creating, setCreating] = useState(false);

  const interestOptions = [
    { id: 'animals', ar: 'الحيوانات 🦁', en: 'Animals 🦁' },
    { id: 'space', ar: 'الفضاء والعلوم 🚀', en: 'Space & Science 🚀' },
    { id: 'letters', ar: 'الحروف والقصص 📖', en: 'Letters & Stories 📖' },
    { id: 'math', ar: 'الأرقام والألغاز 🔢', en: 'Numbers & Puzzles 🔢' },
    { id: 'art', ar: 'الرسم والموسيقى 🎨', en: 'Art & Music 🎨' },
  ];

  const scarfColors = ['#8054D9', '#39BDF2', '#FF78B7', '#55D98B', '#FF9360'];

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setChildError('');
    const check = validateChildProfileInput({
      displayName,
      ageGroup,
      language: childLang,
      birthYear,
      birthMonth,
    });
    if (!check.ok || !check.clean) {
      setChildError(check.error || 'Invalid child details');
      soundEngine.playEncourage();
      return;
    }

    setCreating(true);
    try {
      await createChildProfile({
        displayName: check.clean.displayName,
        ageGroup,
        language: childLang,
        birthYear,
        birthMonth,
        interests,
        companionId,
        companionScarfColor: scarfColor,
      });
      soundEngine.playSuccess();
      navigate('child-welcome');
    } catch (err) {
      setChildError(err instanceof Error ? err.message : 'Unable to create profile');
      soundEngine.playEncourage();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E5F6FF] to-[#FFF8E9] py-8 px-4">
      <div className="max-w-3xl mx-auto nono-card rounded-3xl p-6 sm:p-8">
        {childError && (
          <div className="mb-4 p-3 rounded-2xl bg-[#FF4D6D]/12 text-xs font-bold text-[#FF4D6D]">
            {childError}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#27345C]">
              {t(UI_COPY.createChildProfile, language)}
            </h2>
            <p className="text-sm text-[#27345C]/70">
              {language === 'ar'
                ? 'نجمع الاسم المستعار والعمر فقط لنصمم تجربة تناسب طفلك بأمان'
                : 'We only collect a display name and age band to personalize their safe adventure'}
            </p>
          </div>
          <NonoCharacter mood="waving" scarfColor={scarfColor} size="sm" interactive={false} />
        </div>

        <form onSubmit={(e) => void handleCreate(e)} className="space-y-6">
          {/* Name & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'اسم الطفل (المستعار)' : "Child's Display Name"}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: كريم أو مريم' : 'e.g. Adam or Maya'}
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF8E9] border-2 border-[#27345C]/12 focus:border-[#8054D9] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5">
                {language === 'ar' ? 'اللغة المفضلة للطفل' : 'Preferred Language'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['ar', 'en'] as Language[]).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => setChildLang(lng)}
                    className={`h-12 rounded-2xl font-bold border-2 cursor-pointer transition-colors ${
                      childLang === lng
                        ? 'bg-[#8054D9] text-white border-[#8054D9]'
                        : 'bg-white text-[#27345C] border-[#27345C]/12'
                    }`}
                  >
                    {lng === 'ar' ? 'العربية (أساسي)' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Age Band Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {language === 'ar' ? 'اختر الفئة العمرية (تغيّر التجربة بالكامل)' : 'Select Age Band (Tailors Entire Experience)'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['3-4', '5-6', '7', '8'] as AgeGroupId[]).map((band) => {
                const meta = AGE_GROUP_META[band];
                const selected = ageGroup === band;
                return (
                  <button
                    key={band}
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      setAgeGroup(band);
                      setBirthYear(band === '3-4' ? 2023 : band === '5-6' ? 2021 : band === '7' ? 2019 : 2018);
                    }}
                    className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                      selected
                        ? 'bg-white border-[#8054D9] shadow-md'
                        : 'bg-[#FFF8E9]/60 border-[#27345C]/10 hover:border-[#27345C]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base" style={{ color: meta.color }}>
                        {t(meta.label, language)}
                      </span>
                      {selected && <Check className="w-5 h-5 text-[#8054D9]" />}
                    </div>
                    <p className="font-bold text-sm text-[#27345C] mt-1">{t(meta.badgeTitle, language)}</p>
                    <p className="text-xs text-[#27345C]/70 mt-1">{t(meta.description, language)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Birth Month/Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-[#27345C]/70">
                {language === 'ar' ? 'سنة الميلاد' : 'Birth Year'}
              </label>
              <input
                type="number"
                min={2017}
                max={2024}
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-[#FFF8E9] border border-[#27345C]/15 font-mono-num font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-[#27345C]/70">
                {language === 'ar' ? 'شهر الميلاد' : 'Birth Month'}
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={birthMonth}
                onChange={(e) => setBirthMonth(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-[#FFF8E9] border border-[#27345C]/15 font-mono-num font-bold"
              />
            </div>
          </div>

          {/* Interests & Companion Color */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {language === 'ar' ? 'اهتمامات الطفل (اختياري)' : 'Child Interests (Optional)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => {
                const active = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInterest(opt.id)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#FFD84D]/40 border-[#FF9360] text-[#27345C]'
                        : 'bg-white border-[#27345C]/12 text-[#27345C]/70'
                    }`}
                  >
                    {language === 'ar' ? opt.ar : opt.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-bold mb-2">
                {language === 'ar' ? 'اختر الرفيق المفضل' : 'Favorite Companion'}
              </label>
              <div className="flex gap-2">
                {CHARACTER_COMPANIONS.slice(0, 4).map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setCompanionId(ch.id)}
                    className={`flex-1 py-2.5 rounded-2xl border-2 text-center cursor-pointer ${
                      companionId === ch.id ? 'border-[#8054D9] bg-[#8054D9]/10' : 'border-[#27345C]/10 bg-white'
                    }`}
                  >
                    <div className="text-2xl">{ch.emoji}</div>
                    <div className="text-xs font-bold mt-0.5">{t(ch.name, language)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                {language === 'ar' ? 'لون وشاح نونو' : "Nono's Scarf Color"}
              </label>
              <div className="flex gap-3">
                {scarfColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setScarfColor(col)}
                    aria-label={col}
                    className={`w-10 h-10 rounded-full border-4 cursor-pointer transition-transform ${
                      scarfColor === col ? 'border-[#27345C] scale-110' : 'border-white'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="px-4 py-3 rounded-2xl text-sm font-bold text-[#27345C]/70 hover:text-[#27345C] cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={creating}
              className="nono-btn-tactile h-13 px-8 rounded-2xl bg-[#8054D9] text-white font-extrabold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>{language === 'ar' ? 'ابدأ رحلة الطفل!' : "Launch Child's World!"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ChildWelcomeScreen: React.FC = () => {
  const { activeChild, language, navigate } = useNonoLand();
  const greeting =
    language === 'ar'
      ? `أهلاً يا ${activeChild.displayName}! أنا نونو، هيا نلعب لعبة استكشاف صغيرة لنعرف ما تحبه!`
      : `Welcome, ${activeChild.displayName}! I'm Nono — let's play a quick discovery game to tailor your world!`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#39BDF2]/20 via-[#FFF8E9] to-[#FFD84D]/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full nono-card rounded-3xl p-8 text-center space-y-6"
      >
        <NonoCharacter
          mood="excited"
          scarfColor={activeChild.companionScarfColor}
          size="lg"
          speechBubble={greeting}
          language={language}
        />

        <div>
          <h1 className="text-3xl font-extrabold text-[#27345C]">
            {language === 'ar' ? `مرحباً ${activeChild.displayName} في نونو لاند!` : `Welcome to NonoLand, ${activeChild.displayName}!`}
          </h1>
          <p className="text-[#27345C]/75 mt-2">
            {t(AGE_GROUP_META[activeChild.ageGroup].badgeTitle, language)} · {t(AGE_GROUP_META[activeChild.ageGroup].label, language)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('baseline-assessment')}
            className="flex-1 nono-btn-tactile h-14 rounded-2xl bg-[#8054D9] text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{language === 'ar' ? 'ابدأ رحلة الاكتشاف الأولى' : 'Play Baseline Discovery'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="h-14 px-5 rounded-2xl bg-white border-2 border-[#27345C]/15 font-bold text-[#27345C] cursor-pointer"
          >
            {language === 'ar' ? 'الدخول للرئيسية مباشرة' : 'Go to Home'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
