import React from 'react';
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Compass,
  FlaskConical,
  GraduationCap,
  Home,
  Languages,
  Lock,
  Palette,
  Shield,
  Sparkles,
  Star,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import { useNonoLand } from '../context/NonoLandContext';
import { DEFAULT_AVATAR_CONFIG } from '../data/worldCatalog';
import { AGE_GROUP_META, formatNumber, t, UI_COPY } from '../i18n/translations';
import { AppScreen } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';
import { ChildAvatarPreview } from './CharacterCast';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    screen,
    navigate,
    language,
    setLanguage,
    activeChild,
    childrenList,
    selectChild,
    isOnline,
    pendingSyncCount,
    authSession,
  } = useNonoLand();

  const navItems: Array<{ id: AppScreen; label: { ar: string; en: string }; icon: React.ReactNode; mobile?: boolean }> = [
    { id: 'home', label: UI_COPY.nav.home, icon: <Home className="w-4 h-4" />, mobile: true },
    { id: 'academy', label: UI_COPY.nav.academy, icon: <GraduationCap className="w-4 h-4" />, mobile: true },
    { id: 'exams', label: UI_COPY.nav.exams, icon: <ClipboardCheck className="w-4 h-4" />, mobile: true },
    { id: 'fun-zone', label: UI_COPY.nav.funZone, icon: <Sparkles className="w-4 h-4" />, mobile: true },
    { id: 'map', label: UI_COPY.nav.map, icon: <Compass className="w-4 h-4" />, mobile: true },
    { id: 'discovery-lab', label: UI_COPY.nav.lab, icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'stories', label: UI_COPY.nav.stories, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'my-room', label: UI_COPY.nav.room, icon: <Palette className="w-4 h-4" />, mobile: true },
    { id: 'achievements', label: UI_COPY.nav.achievements, icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-[#E5F6FF] via-[#FFF8E9] to-[#FFF2D9] text-[#27345C] overflow-x-hidden">
      {/* Layered animated storybook sky backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute top-12 start-[6%] w-40 h-16 rounded-full bg-white/75 blur-[1px] animate-drift-cloud" />
        <div
          className="absolute top-28 end-[10%] w-52 h-20 rounded-full bg-white/65 blur-[1px] animate-drift-cloud"
          style={{ animationDelay: '-4s' }}
        />
        <div className="hidden lg:block absolute top-56 start-[22%] w-3 h-3 rounded-full bg-[#FFD84D]/70 animate-twinkle" />
        <div
          className="hidden lg:block absolute top-40 end-[28%] w-4 h-4 rounded-full bg-[#FF78B7]/40 animate-twinkle"
          style={{ animationDelay: '-1.5s' }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FFF8E9]/90 backdrop-blur-md border-b border-[#27345C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8054D9] rounded-xl px-1"
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8054D9] to-[#FF78B7] text-white flex items-center justify-center text-lg shadow-sm">
              🦊
            </span>
            <span className="text-xl font-extrabold tracking-tight text-[#27345C]">
              {t(UI_COPY.appName, language)}
            </span>
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                screen === item.id ||
                (item.id === 'map' && (screen === 'world-detail' || screen === 'game' || screen === 'game-results')) ||
                (item.id === 'fun-zone' &&
                  (screen === 'brain-games' || screen === 'creative-studio' || screen === 'entertainment-hub')) ||
                (item.id === 'my-room' && (screen === 'my-avatar' || screen === 'my-pet')) ||
                (item.id === 'achievements' && screen === 'reward-shop') ||
                (item.id === 'stories' && (screen === 'story-reader' || screen === 'reading-adventure'));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#8054D9] text-white shadow-sm'
                      : 'text-[#27345C]/80 hover:bg-white hover:text-[#27345C]'
                  }`}
                >
                  {item.icon}
                  <span>{t(item.label, language)}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Child Profile, Stars, Language & Separate Parent Gate */}
          <div className="flex items-center gap-2 shrink-0">
            {!isOnline && (
              <span
                title={language === 'ar' ? 'وضع عدم الاتصال' : 'Offline mode'}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#FF9360] px-2 py-1 rounded-lg bg-[#FF9360]/15"
              >
                <WifiOff className="w-3.5 h-3.5" />
                {pendingSyncCount > 0 && <span className="tabular-nums">{pendingSyncCount}</span>}
              </span>
            )}

            {/* Avatar Quick Button + Child Switcher */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                navigate('my-avatar');
              }}
              title={language === 'ar' ? 'تخصيص صورتي الرمزية' : 'Customize My Avatar'}
              aria-label={language === 'ar' ? 'صورتي الرمزية' : 'My Avatar'}
              className="w-10 h-10 rounded-xl bg-white border border-[#27345C]/15 flex items-center justify-center overflow-hidden hover:border-[#8054D9] cursor-pointer shrink-0"
            >
              <div className="scale-75 origin-center pointer-events-none">
                <ChildAvatarPreview
                  avatar={activeChild.avatarConfig || DEFAULT_AVATAR_CONFIG}
                  size="sm"
                  animated={false}
                />
              </div>
            </button>

            <div className="relative">
              <select
                aria-label={language === 'ar' ? 'اختر ملف الطفل' : 'Switch child profile'}
                value={activeChild.id}
                onChange={(e) => selectChild(e.target.value)}
                className="h-10 ps-3 pe-7 rounded-xl bg-white border border-[#27345C]/15 text-xs sm:text-sm font-bold text-[#27345C] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8054D9]"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} · {t(AGE_GROUP_META[c.ageGroup].label, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stars count */}
            <button
              type="button"
              onClick={() => navigate('achievements')}
              className="h-10 px-3 rounded-xl bg-[#FFD84D]/35 border border-[#FFD84D] flex items-center gap-1.5 font-extrabold text-sm text-[#27345C] tabular-nums whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#FFD84D]/55 transition-colors"
            >
              <Star className="w-4 h-4 fill-[#FFD84D] text-[#FF9360]" />
              <span>{formatNumber(activeChild.stars, language)}</span>
            </button>

            {/* Language toggle */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              aria-label="Toggle Arabic/English"
              className="h-10 px-2.5 rounded-xl bg-white border border-[#27345C]/15 text-xs font-extrabold text-[#27345C] flex items-center gap-1 hover:border-[#8054D9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Languages className="w-4 h-4 text-[#8054D9]" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Role-Aware Portal Shortcut */}
            {authSession.authenticated && authSession.user?.role === 'teacher' ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  navigate('teacher-dashboard');
                }}
                className="h-10 px-3 rounded-xl bg-[#8054D9] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-[#6d42c7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#FFD84D]" />
                <span className="hidden sm:inline">
                  {language === 'ar' ? 'بوابة المعلم' : 'Teacher Portal'}
                </span>
              </button>
            ) : authSession.authenticated &&
              ['super_admin', 'content_admin', 'curriculum_manager', 'finance_admin', 'support_agent'].includes(
                authSession.user?.role || '',
              ) ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  navigate('admin-dashboard');
                }}
                className="h-10 px-3 rounded-xl bg-[#27345C] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-[#1d2746] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#FFD84D]" />
                <span className="hidden sm:inline">
                  {language === 'ar' ? 'لوحة الإدارة' : 'Admin Portal'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  navigate('parent-dashboard');
                }}
                className="h-10 px-3 rounded-xl bg-[#27345C] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-[#1d2746] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#FFD84D]" />
                <span className="hidden sm:inline">{t(UI_COPY.parentArea, language)}</span>
              </button>
            )}
          </div>
        </div>
      {/* Secondary Quick-Launch Strip for New Learning & Creative Hubs */}
      <div className="bg-white/75 backdrop-blur-sm border-b border-[#27345C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              {
                id: 'nono-ai' as AppScreen,
                emoji: '🤖',
                ar: 'مساعد نونو الذكي',
                en: 'Nono AI',
                activeCls: 'bg-[#8054D9] text-white',
              },
              {
                id: 'reading-adventure' as AppScreen,
                emoji: '📖',
                ar: 'مغامرة القراءة (٨ مراحل)',
                en: 'Reading (8 Stages)',
                activeCls: 'bg-[#FF9360] text-white',
              },
              {
                id: 'entertainment-hub' as AppScreen,
                emoji: '🎭',
                ar: 'مركز الترفيه والإبداع',
                en: 'Entertainment Hub',
                activeCls: 'bg-[#FF78B7] text-white',
              },
              {
                id: 'family-activities' as AppScreen,
                emoji: '👨‍👩‍👧',
                ar: 'أنشطة الأهل والطفل',
                en: 'Family Co-Play',
                activeCls: 'bg-[#55D98B] text-[#14532D]',
              },
              {
                id: 'discovery-lab' as AppScreen,
                emoji: '🔬',
                ar: 'المختبر والتقييم الذكي',
                en: 'Smart Lab',
                activeCls: 'bg-[#39BDF2] text-white',
              },
            ] as const
          ).map((hub) => {
            const isActive = screen === hub.id;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  navigate(hub.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? `${hub.activeCls} shadow-sm`
                    : 'bg-[#FFF8E9] text-[#27345C] border border-[#27345C]/10 hover:border-[#8054D9]/40'
                }`}
              >
                <span>{hub.emoji}</span>
                <span>{language === 'ar' ? hub.ar : hub.en}</span>
              </button>
            );
          })}
        </div>
      </div>
      </header>

      {/* Main Page Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24 lg:pb-12">
        {children}
      </main>

      {/* Mobile & Tablet Bottom Tab Bar (Thumb-zone navigation, compact height <= 15% viewport) */}
      <nav
        aria-label="Mobile Navigation"
        className="xl:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#27345C]/10 px-1 py-1.5"
      >
        <div className="grid grid-cols-6 gap-1 max-w-2xl mx-auto">
          {navItems
            .filter((item) => item.mobile)
            .map((item) => {
              const isActive =
                screen === item.id ||
                (item.id === 'map' && (screen === 'world-detail' || screen === 'game'));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer ${
                    isActive ? 'text-[#8054D9] bg-[#8054D9]/10' : 'text-[#27345C]/65'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-bold leading-tight truncate max-w-full">
                    {t(item.label, language)}
                  </span>
                </button>
              );
            })}
        </div>
      </nav>
    </div>
  );
};
