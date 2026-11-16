import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  FastForward,
  Languages,
  Lock,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CharacterActor } from './CharacterCast';
import { useNonoLand } from '../context/NonoLandContext';
import { AGE_GROUP_META, t, UI_COPY } from '../i18n/translations';
import { OfficialCharacterId } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

export const INTRO_SKIP_STORAGE_KEY = 'nonoland_skip_intro_v1';

const CHARACTER_ENTRANCE_ORDER: Array<{
  id: OfficialCharacterId;
  mood: 'waving' | 'jumping' | 'excited' | 'dancing' | 'laughing' | 'celebrating';
  label: { ar: string; en: string };
}> = [
  { id: 'nono', mood: 'waving', label: { ar: 'نونو', en: 'Nono' } },
  { id: 'lolo', mood: 'jumping', label: { ar: 'لولو', en: 'Lolo' } },
  { id: 'leo', mood: 'excited', label: { ar: 'ليو', en: 'Leo' } },
  { id: 'bobo', mood: 'dancing', label: { ar: 'بوبو', en: 'Bobo' } },
  { id: 'ellie', mood: 'laughing', label: { ar: 'إيلي', en: 'Ellie' } },
  { id: 'titi', mood: 'celebrating', label: { ar: 'تيتي', en: 'Titi' } },
];

export const CinematicWelcomeIntro: React.FC = () => {
  const {
    navigate,
    language,
    setLanguage,
    parentSettings,
    updateParentSettings,
    authSession,
    childrenList,
    selectChild,
  } = useNonoLand();

  const [scene, setScene] = useState<1 | 2 | 3 | 4>(1);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem(INTRO_SKIP_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [visibleFriendsCount, setVisibleFriendsCount] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const reduced = Boolean(parentSettings.reducedMotion);
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  const destinationAfterIntro = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(INTRO_SKIP_STORAGE_KEY, 'true');
      } catch {
        // ignore storage quota errors
      }
    }
    if (authSession.authenticated && authSession.user) {
      const role = authSession.user.role;
      if (role === 'teacher') return navigate('teacher-dashboard');
      if (role === 'student') return navigate('exams');
      if (
        role === 'super_admin' ||
        role === 'content_admin' ||
        role === 'curriculum_manager' ||
        role === 'finance_admin' ||
        role === 'support_agent'
      ) {
        return navigate('admin-dashboard');
      }
      return navigate('home');
    }
    navigate('parent-auth');
  };

  // Auto-skip if user explicitly selected "Don't show this intro again" or returning session is active
  useEffect(() => {
    if (authSession.authenticated) {
      destinationAfterIntro();
      return;
    }
    try {
      if (localStorage.getItem(INTRO_SKIP_STORAGE_KEY) === 'true') {
        setScene(4);
        setAutoAdvance(false);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession.authenticated]);

  // Automatic 4-scene progression unless user paused/skipped or reducedMotion jumps gently
  useEffect(() => {
    if (!autoAdvance) return;
    if (scene === 1) {
      const timer = setTimeout(() => {
        soundEngine.playPop();
        setScene(2);
      }, reduced ? 700 : 2100);
      return () => clearTimeout(timer);
    }
    if (scene === 2) {
      const friendInterval = setInterval(() => {
        setVisibleFriendsCount((prev) => {
          if (prev >= CHARACTER_ENTRANCE_ORDER.length) return prev;
          soundEngine.playMusicNote(prev);
          return prev + 1;
        });
      }, reduced ? 120 : 380);
      const timer = setTimeout(() => {
        soundEngine.playSuccess();
        setScene(3);
      }, reduced ? 1000 : 3200);
      return () => {
        clearInterval(friendInterval);
        clearTimeout(timer);
      };
    }
    if (scene === 3) {
      soundEngine.playCelebration();
      const timer = setTimeout(() => {
        setScene(4);
      }, reduced ? 900 : 2900);
      return () => clearTimeout(timer);
    }
  }, [scene, autoAdvance, reduced]);

  const toggleDontShow = (checked: boolean) => {
    setDontShowAgain(checked);
    try {
      if (checked) localStorage.setItem(INTRO_SKIP_STORAGE_KEY, 'true');
      else localStorage.removeItem(INTRO_SKIP_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#141B38] via-[#2F2166] to-[#693EC7] text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Deep Sky Floating Stars & Magical Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { top: '8%', left: '12%', size: 8, color: '#FFD84D', delay: '0s' },
          { top: '16%', left: '78%', size: 10, color: '#39BDF2', delay: '-0.8s' },
          { top: '34%', left: '18%', size: 6, color: '#FF78B7', delay: '-1.5s' },
          { top: '24%', left: '54%', size: 9, color: '#55D98B', delay: '-2.1s' },
          { top: '68%', left: '84%', size: 8, color: '#FFD84D', delay: '-1.2s' },
          { top: '76%', left: '14%', size: 7, color: '#39BDF2', delay: '-0.5s' },
          { top: '52%', left: '92%', size: 6, color: '#FF9360', delay: '-1.9s' },
        ].map((st, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle"
            style={{
              top: st.top,
              left: st.left,
              width: st.size,
              height: st.size,
              backgroundColor: st.color,
              boxShadow: `0 0 14px ${st.color}`,
              animationDelay: st.delay,
            }}
          />
        ))}
        <div className="absolute -top-32 -start-20 w-[28rem] h-[28rem] rounded-full bg-[#39BDF2]/15 blur-3xl" />
        <div className="absolute -bottom-32 -end-20 w-[30rem] h-[30rem] rounded-full bg-[#FF78B7]/15 blur-3xl" />
      </div>

      {/* Top Controls: Logo · Scene Stepper · Sound · Language · Skip Intro */}
      <div className="relative z-20 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFD84D] text-[#27345C] flex items-center justify-center text-xl shadow-lg">
            🦊
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t(UI_COPY.appName, language)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scene Indicator Dots */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setAutoAdvance(false);
                  setVisibleFriendsCount(CHARACTER_ENTRANCE_ORDER.length);
                  setScene(num as 1 | 2 | 3 | 4);
                }}
                aria-label={`Scene ${num}`}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  scene === num ? 'w-7 bg-[#FFD84D]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => updateParentSettings({ muted: !parentSettings.muted })}
            aria-label={parentSettings.muted ? 'Unmute intro audio' : 'Mute intro audio'}
            className="min-h-[44px] px-3 rounded-xl bg-white/12 hover:bg-white/22 border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {parentSettings.muted ? (
              <VolumeX className="w-4 h-4 text-[#FF9360]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#FFD84D]" />
            )}
            <span className="hidden md:inline">
              {parentSettings.muted
                ? language === 'ar'
                  ? 'صامت'
                  : 'Muted'
                : language === 'ar'
                  ? 'الصوت'
                  : 'Sound'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="min-h-[44px] px-3.5 rounded-xl bg-white/12 hover:bg-white/22 border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Languages className="w-4 h-4 text-[#FFD84D]" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <button
            type="button"
            onClick={destinationAfterIntro}
            className="min-h-[44px] px-4 rounded-xl bg-white/18 hover:bg-white/30 border border-white/30 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <FastForward className="w-4 h-4 text-[#FFD84D]" />
            <span>{language === 'ar' ? 'تخطي المقدمة' : 'Skip Intro'}</span>
          </button>
        </div>
      </div>

      {/* MAIN CINEMATIC PORTAL STAGE */}
      <div className="relative z-10 max-w-6xl w-full mx-auto my-auto py-4">
        <AnimatePresence mode="wait">
          {/* SCENE 1: MAGICAL ARRIVAL & GLOWING PORTAL */}
          {scene === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.06 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center text-center py-10 space-y-6"
            >
              <motion.div
                animate={reduced ? undefined : { scale: [1, 1.08, 1], rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#39BDF2] via-[#FFD84D] to-[#FF78B7] opacity-80 blur-xl" />
                <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-[#27345C] via-[#4C348F] to-[#8054D9] border-4 border-[#FFD84D]/80 flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-16 h-16 text-[#FFD84D]" />
                </div>
              </motion.div>

              <div className="space-y-2 max-w-xl">
                <p className="text-sm font-extrabold tracking-wide text-[#FFD84D]">
                  {language === 'ar' ? 'تفتح البوابة السحرية...' : 'Opening the Magical Portal...'}
                </p>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-balance">
                  {language === 'ar' ? 'مرحباً بكم في عالم نونو لاند' : 'Welcome to NonoLand'}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAutoAdvance(false);
                  soundEngine.playPop();
                  setScene(2);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-xs font-extrabold cursor-pointer"
              >
                {language === 'ar' ? 'قابل الأصدقاء ←' : 'Meet the Friends →'}
              </button>
            </motion.div>
          )}

          {/* SCENE 2: CHARACTER ENTRANCE (NONO, LOLO, LEO, BOBO, ELLIE, TITI) */}
          {scene === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-7 py-6"
            >
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-extrabold text-[#39BDF2]">
                  {language === 'ar' ? 'أصدقاء المغامرة يرحبون بك!' : 'Your Adventure Friends Are Here!'}
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold">
                  {language === 'ar'
                    ? 'نونو، لولو، ليو، بوبو، إيلي وتيتي!'
                    : 'Meet Nono, Lolo, Leo, Bobo, Ellie & Titi!'}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end max-w-5xl mx-auto">
                {CHARACTER_ENTRANCE_ORDER.map((ch, idx) => {
                  const isVisible = idx < visibleFriendsCount;
                  return (
                    <motion.div
                      key={ch.id}
                      initial={{ opacity: 0, y: 28, scale: 0.7 }}
                      animate={
                        isVisible
                          ? { opacity: 1, y: 0, scale: 1 }
                          : { opacity: 0.12, y: 20, scale: 0.8 }
                      }
                      transition={{ duration: 0.45 }}
                      className="rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 flex flex-col items-center gap-1"
                    >
                      <CharacterActor
                        characterId={ch.id}
                        mood={ch.mood}
                        size="sm"
                        language={language}
                        onTap={() => soundEngine.playMusicNote(idx)}
                      />
                      <span className="text-sm font-extrabold text-[#FFD84D]">
                        {t(ch.label, language)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAutoAdvance(false);
                  soundEngine.playCelebration();
                  setScene(3);
                }}
                className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#FFD84D] text-[#27345C] text-sm font-extrabold cursor-pointer"
              >
                {language === 'ar' ? 'افتح بوابة نونو لاند ✨' : 'Reveal NonoLand ✨'}
              </button>
            </motion.div>
          )}

          {/* SCENE 3: MINIATURE NONOLAND UNIVERSE PARALLAX REVEAL */}
          {scene === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="space-y-6 text-center py-4"
            >
              <div className="relative max-w-4xl mx-auto rounded-[2.2rem] p-5 sm:p-8 bg-gradient-to-b from-[#39BDF2]/30 via-[#8054D9]/35 to-[#55D98B]/25 border-2 border-[#FFD84D]/50 shadow-2xl overflow-hidden">
                {/* Miniature Parallax Universe SVG */}
                <svg viewBox="0 0 800 290" className="w-full h-48 sm:h-64 drop-shadow-xl">
                  <defs>
                    <linearGradient id="portalSky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D2A5C" />
                      <stop offset="60%" stopColor="#5D40B5" />
                      <stop offset="100%" stopColor="#39BDF2" />
                    </linearGradient>
                  </defs>
                  <rect width="800" height="290" rx="28" fill="url(#portalSky)" />
                  {/* Floating Clouds */}
                  <ellipse cx="150" cy="65" rx="56" ry="18" fill="rgba(255,255,255,0.65)" />
                  <ellipse cx="640" cy="58" rx="64" ry="20" fill="rgba(255,255,255,0.6)" />
                  {/* Distant Castle Island */}
                  <ellipse cx="400" cy="235" rx="220" ry="38" fill="#55D98B" />
                  <rect x="345" y="135" width="110" height="90" rx="12" fill="#FFF8E9" stroke="#27345C" strokeWidth="4" />
                  <polygon points="340,135 400,72 460,135" fill="#FF78B7" stroke="#27345C" strokeWidth="4" />
                  <rect x="315" y="160" width="35" height="65" rx="6" fill="#FFD84D" stroke="#27345C" strokeWidth="3" />
                  <polygon points="312,160 332,126 352,160" fill="#8054D9" stroke="#27345C" strokeWidth="3" />
                  <rect x="450" y="160" width="35" height="65" rx="6" fill="#FFD84D" stroke="#27345C" strokeWidth="3" />
                  <polygon points="448,160 468,126 488,160" fill="#39BDF2" stroke="#27345C" strokeWidth="3" />
                  {/* Left Island (Trees + Lab Dome) */}
                  <ellipse cx="145" cy="220" rx="105" ry="26" fill="#55D98B" />
                  <circle cx="115" cy="182" r="24" fill="#2A9D8F" />
                  <rect x="110" y="198" width="10" height="22" fill="#8B5A2B" />
                  <path d="M150 212 A30 30 0 0 1 210 212 Z" fill="#39BDF2" stroke="#FFF8E9" strokeWidth="3" />
                  {/* Right Island (Storybook Treehouse) */}
                  <ellipse cx="655" cy="220" rx="105" ry="26" fill="#55D98B" />
                  <circle cx="660" cy="172" r="32" fill="#FF9360" />
                  <rect x="653" y="196" width="14" height="26" fill="#8B5A2B" />
                  {/* Rainbow Arch */}
                  <path
                    d="M170 210 Q400 35 630 210"
                    fill="none"
                    stroke="#FFD84D"
                    strokeWidth="6"
                    strokeDasharray="10 8"
                    opacity="0.85"
                  />
                </svg>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                  <CharacterActor characterId="nono" mood="celebrating" size="md" language={language} />
                  <div className="text-start space-y-1 max-w-md">
                    <p className="text-xs font-extrabold text-[#FFD84D]">
                      {language === 'ar' ? 'جزر متصلة · مختبر علوم · قصص · غرفة الأحلام' : 'Connected Islands · Science Lab · Stories · Dream Room'}
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold">
                      {language === 'ar' ? 'عالم نونو لاند السحري' : 'Welcome to NonoLand Universe'}
                    </h2>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAutoAdvance(false);
                  setScene(4);
                }}
                className="nono-btn-tactile min-h-[48px] px-7 py-3 rounded-2xl bg-[#FFD84D] text-[#27345C] font-extrabold text-base cursor-pointer"
              >
                {language === 'ar' ? 'هيا نكتشف!' : "Let's Explore!"}
              </button>
            </motion.div>
          )}

          {/* SCENE 4: FINAL CTA -> LOGIN/SIGNUP + PRESERVED DEMO/ONBOARDING */}
          {scene === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4"
            >
              <div className="lg:col-span-7 space-y-5 text-center lg:text-start">
                <p className="text-sm font-extrabold text-[#FFD84D]">
                  {language === 'ar'
                    ? 'عالم تعليمي تفاعلي للأعمار ٣ – ٨ سنوات'
                    : 'Interactive Educational World · Ages 3 to 8'}
                </p>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-balance">
                  {language === 'ar'
                    ? 'لكل طفل عالمه السحري ومغامرته المختلفة'
                    : 'Every Child. A Different World. A Unique Adventure.'}
                </h1>
                <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {language === 'ar'
                    ? 'سجّل الدخول لبناء شخصية طفلك، استكشاف مختبر نونو، قراءة القصص، وتزيين غرفته ومتابعة تطوره بتقرير شهري شامل.'
                    : 'Sign in to customize your child avatar, experiment in Nono’s Lab, read interactive stories, adopt a virtual pet, and track real progress.'}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                  <button
                    type="button"
                    onClick={destinationAfterIntro}
                    className="nono-btn-tactile h-14 px-7 rounded-2xl bg-[#FFD84D] text-[#27345C] text-lg font-extrabold flex items-center gap-2.5 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{language === 'ar' ? 'هيا نكتشف! (دخول / تسجيل)' : "Let's Explore! (Sign In / Up)"}</span>
                    <ArrowIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('onboarding')}
                    className="h-14 px-5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Compass className="w-5 h-5 text-[#39BDF2]" />
                    <span>{language === 'ar' ? 'جولة التعريف' : 'Guided Tour'}</span>
                  </button>
                </div>

                {/* Preserved Sample Exploration Profiles */}
                <div className="pt-3">
                  <p className="text-xs font-bold text-white/75 mb-2">
                    {language === 'ar'
                      ? 'أو معاينة فورية بتجربة عمرية جاهزة:'
                      : 'Or preview any age-band adventure right away:'}
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                    {childrenList.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => {
                          selectChild(child.id);
                          navigate('home');
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/12 hover:bg-white/25 border border-white/20 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>{child.displayName}</span>
                        <span className="text-[#FFD84D]">· {t(AGE_GROUP_META[child.ageGroup].label, language)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center gap-4">
                <div className="relative rounded-[2.2rem] p-6 bg-white/10 border-2 border-white/25 shadow-2xl grid grid-cols-3 gap-3 items-center justify-items-center">
                  {CHARACTER_ENTRANCE_ORDER.map((ch) => (
                    <CharacterActor
                      key={ch.id}
                      characterId={ch.id}
                      mood={ch.mood}
                      size="sm"
                      language={language}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVisibleFriendsCount(1);
                    setScene(1);
                    setAutoAdvance(true);
                  }}
                  className="text-xs font-bold text-white/80 hover:text-[#FFD84D] underline cursor-pointer"
                >
                  {language === 'ar' ? 'إعادة تشغيل العرض الترحيبي' : 'Replay Welcome Intro'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: Child Safety Note + Don't Show Intro Again */}
      <div className="relative z-20 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-white/75 pt-3 border-t border-white/15">
        <label className="inline-flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => toggleDontShow(e.target.checked)}
            className="w-4 h-4 accent-[#FFD84D] rounded"
          />
          <span>
            {language === 'ar' ? 'لا تعرض هذه المقدمة مرة أخرى' : "Don't show this intro again"}
          </span>
        </label>

        <div className="flex items-center gap-4">
          <span>
            {language === 'ar'
              ? 'مساحة آمنة للأطفال · بدون إعلانات أو تواصل مفتوح'
              : 'Child-Safe Space · Zero Ads · Parent-Gated Controls'}
          </span>
          <button
            type="button"
            onClick={() => navigate('parent-auth')}
            className="hover:text-white underline cursor-pointer inline-flex items-center gap-1 font-bold"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'دخول الأهل' : 'Parent Sign In'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
