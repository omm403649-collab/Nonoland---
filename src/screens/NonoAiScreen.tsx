import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  HelpCircle,
  Lightbulb,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { AppScreen, NonoAiChatResponse, NonoMood } from '../types/nonoland';
import { trackedFetch } from '../utils/perfMonitor';
import { soundEngine } from '../utils/soundEngine';

interface ChatTurn {
  id: string;
  sender: 'child' | 'nono';
  text: string;
  hint?: string;
  explanation?: string;
  followUpQuestion?: string;
  recommendedScreen?: AppScreen;
  mood?: NonoMood;
  blocked?: boolean;
}

const QUICK_PROMPTS = [
  {
    id: 'letters',
    ar: 'اشرح لي الفرق بين الباء والتاء بأسلوب ممتع!',
    en: 'Explain the letter B and its sound in a fun way!',
    topic: 'Letters & Phonics',
    mode: 'explain' as const,
  },
  {
    id: 'math-hint',
    ar: 'أعطني تلميحاً لطيفاً لسؤال: كم يساوي ٣ + ٢؟',
    en: 'Give me a gentle hint for: What is 3 + 2?',
    topic: 'Counting & Math',
    mode: 'hint' as const,
  },
  {
    id: 'science',
    ar: 'لماذا نرى قوس قزح بعد المطر؟',
    en: 'Why do we see a rainbow after rain?',
    topic: 'Science Discovery',
    mode: 'explain' as const,
  },
  {
    id: 'encourage',
    ar: 'أشعر ببعض الصعوبة، شجّعني يا نونو!',
    en: 'This feels tricky, cheer me on Nono!',
    topic: 'Confidence',
    mode: 'encourage' as const,
  },
];

export const NonoAiScreen: React.FC = () => {
  const { activeChild, authSession, language, navigate } = useNonoLand();
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; dailyLimitPerChild: number } | null>(null);
  const [mode, setMode] = useState<'explain' | 'hint' | 'question' | 'encourage'>('explain');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const [nonoMood, setNonoMood] = useState<NonoMood>('waving');
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      sender: 'nono',
      text:
        language === 'ar'
          ? `مرحباً ${activeChild.displayName}! أنا نونو صديقك الذكي. اسألني عن الحروف، الأرقام، أو العلوم وسأساعدك بتلميحات لطيفة خطوة بخطوة!`
          : `Hi ${activeChild.displayName}! I am Nono, your smart learning buddy. Ask me about letters, numbers, or science for gentle step-by-step hints!`,
      mood: 'waving',
    },
  ]);

  useEffect(() => {
    trackedFetch('/api/ai/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setAiStatus({ configured: Boolean(d.configured), dailyLimitPerChild: d.dailyLimitPerChild || 40 });
      })
      .catch(() => {});
  }, []);

  const isEnabledForChild = activeChild.aiAssistantEnabled !== false;

  const sendPrompt = async (
    textToSend: string,
    overrideMode?: 'explain' | 'hint' | 'question' | 'encourage',
    topic?: string,
  ) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;

    if (!authSession.authenticated) {
      setErrorBanner(
        language === 'ar'
          ? 'يرجى تسجيل دخول الوالد أو الطالب لاستخدام مساعد نونو الذكي الآمن.'
          : 'Please sign in with your parent or student account to chat with Nono AI safely.',
      );
      return;
    }

    if (!isEnabledForChild) {
      setErrorBanner(
        language === 'ar'
          ? 'مساعد نونو الذكي متوقف حالياً من إعدادات الوالدين.'
          : 'Nono AI Assistant is currently turned off in Parent Controls.',
      );
      return;
    }

    setErrorBanner(null);
    setTurns((prev) => [...prev, { id: `c-${Date.now()}`, sender: 'child', text: clean }]);
    setInput('');
    setLoading(true);
    setNonoMood('thinking');

    try {
      const res = await trackedFetch('/api/ai/nono-chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession.csrfToken ? { 'x-csrf-token': authSession.csrfToken } : {}),
        },
        body: JSON.stringify({
          childId: activeChild.id,
          message: clean,
          mode: overrideMode || mode,
          language,
          currentTopic: topic,
          attemptCount: turns.filter((t) => t.sender === 'child').length,
        }),
      });

      const data = (await res.json()) as Partial<NonoAiChatResponse> & { error?: string; code?: string };

      if (!res.ok) {
        setNonoMood('encouraging');
        setErrorBanner(
          data.code === 'AI_KEY_MISSING'
            ? language === 'ar'
              ? 'مفتاح GEMINI_API_KEY غير مفعّل على الخادم حالياً. أضفه في إعدادات البيئة لتفعيل الردود الذكية الحقيقية.'
              : 'GEMINI_API_KEY is not configured on the server yet. Add it in environment Secrets to enable live Nono AI tutoring.'
            : data.error || (language === 'ar' ? 'تعذّر الاتصال بمساعد نونو الآن.' : 'Could not reach Nono AI right now.'),
        );
        return;
      }

      const nextMood = data.mood || 'encouraging';
      setNonoMood(nextMood);
      if (typeof data.usageRemaining === 'number') setUsageRemaining(data.usageRemaining);

      const replyText = data.reply || '';
      setTurns((prev) => [
        ...prev,
        {
          id: `n-${Date.now()}`,
          sender: 'nono',
          text: replyText,
          hint: data.hint,
          explanation: data.explanation,
          followUpQuestion: data.followUpQuestion,
          recommendedScreen: data.recommendedScreen,
          mood: nextMood,
          blocked: data.blocked,
        },
      ]);

      soundEngine.playSuccess();
      if (replyText) {
        soundEngine.speak(replyText, language);
      }
    } catch {
      setErrorBanner(
        language === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Network error connecting to Nono AI.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="nono-card rounded-[2rem] p-5 sm:p-6 bg-gradient-to-r from-[#F3ECFF] via-[#EBF5FF] to-[#FFF8E9] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <NonoCharacter
            mood={nonoMood}
            scarfColor={activeChild.companionScarfColor}
            size="md"
            language={language}
          />
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-extrabold text-[#8054D9] border border-[#8054D9]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'رفيق تعليمي آمن بإشراف الوالدين' : 'Parent-Supervised Child-Safe AI'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27345C] flex items-center gap-2">
              <Bot className="w-7 h-7 text-[#8054D9]" />
              <span>{language === 'ar' ? 'مساعد نونو الذكي' : 'Nono AI Assistant'}</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#27345C]/75">
              {language === 'ar'
                ? `مخصّص لـ ${activeChild.displayName} (${activeChild.ageGroup} سنوات) · تلميحات متدرجة بدون كشف الإجابة فوراً`
                : `Tailored for ${activeChild.displayName} (Ages ${activeChild.ageGroup}) · Progressive hints without spoiling answers`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
          {usageRemaining !== null && (
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#27345C]/12 text-[#27345C]">
              {language === 'ar' ? `المتبقي اليوم: ${usageRemaining}` : `Left today: ${usageRemaining}`}
            </span>
          )}
          {aiStatus && !aiStatus.configured && (
            <span className="px-3 py-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40">
              {language === 'ar' ? 'بانتظار GEMINI_API_KEY' : 'GEMINI_API_KEY needed'}
            </span>
          )}
        </div>
      </div>

      {!isEnabledForChild && (
        <div className="nono-card p-5 bg-[#FFFBEB] border-2 border-[#FFD84D] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-[#B45309] shrink-0" />
            <div>
              <p className="font-extrabold text-[#27345C]">
                {language === 'ar' ? 'تم إيقاف مساعد نونو الذكي من لوحة الوالدين' : 'Nono AI Assistant is paused by Parent Settings'}
              </p>
              <p className="text-xs font-bold text-[#27345C]/75">
                {language === 'ar'
                  ? 'يمكن لولي الأمر إعادة تفعيله في أي وقت من لوحة تحكم الوالدين.'
                  : 'A parent can re-enable it anytime in the Parent Dashboard.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('parent-dashboard')}
            className="min-h-[42px] px-4 rounded-xl bg-[#27345C] text-white text-xs font-extrabold cursor-pointer"
          >
            {language === 'ar' ? 'لوحة الوالدين' : 'Parent Dashboard'}
          </button>
        </div>
      )}

      {/* Mode Selector + Quick Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <div className="nono-card p-4 bg-white space-y-2.5">
            <p className="text-xs font-extrabold text-[#27345C]/70">
              {language === 'ar' ? 'كيف تحب أن يساعدك نونو؟' : 'How should Nono help?'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'explain' as const, ar: 'اشرح لي', en: 'Explain', icon: '📘' },
                { id: 'hint' as const, ar: 'أعطني تلميحاً', en: 'Give Hint', icon: '💡' },
                { id: 'question' as const, ar: 'اسألني سؤالاً', en: 'Quiz Me', icon: '❓' },
                { id: 'encourage' as const, ar: 'شجّعني', en: 'Encourage', icon: '🌟' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    setMode(m.id);
                  }}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-extrabold border-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                    mode === m.id
                      ? 'bg-[#8054D9] text-white border-[#8054D9]'
                      : 'bg-[#FFF8E9]/60 text-[#27345C] border-[#27345C]/10'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m[language]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="nono-card p-4 bg-white space-y-2.5">
            <p className="text-xs font-extrabold text-[#27345C]/70 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8054D9]" />
              <span>{language === 'ar' ? 'أسئلة سريعة آمنة' : 'Safe Quick Questions'}</span>
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.id}
                  type="button"
                  disabled={!isEnabledForChild || loading}
                  onClick={() => void sendPrompt(qp[language], qp.mode, qp.topic)}
                  className="w-full p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F3ECFF] border border-[#27345C]/10 text-start text-xs font-bold text-[#27345C] cursor-pointer transition-colors disabled:opacity-50"
                >
                  {qp[language]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="lg:col-span-8 nono-card p-5 bg-white flex flex-col justify-between min-h-[460px] space-y-4">
          <div className="space-y-3 max-h-[380px] overflow-y-auto pe-1">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex ${turn.sender === 'child' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 space-y-2 ${
                    turn.sender === 'child'
                      ? 'bg-[#8054D9] text-white'
                      : turn.blocked
                        ? 'bg-[#FFFBEB] border-2 border-[#FFD84D] text-[#27345C]'
                        : 'bg-[#F8FAFC] border border-[#27345C]/10 text-[#27345C]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-relaxed">{turn.text}</p>
                    {turn.sender === 'nono' && (
                      <button
                        type="button"
                        onClick={() => soundEngine.speak(turn.text, language)}
                        className="p-1.5 rounded-lg bg-white border border-[#27345C]/10 shrink-0 cursor-pointer"
                        title={language === 'ar' ? 'استمع' : 'Listen'}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#8054D9]" />
                      </button>
                    )}
                  </div>

                  {turn.hint && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#8054D9]/20 text-xs font-bold flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                      <span>{turn.hint}</span>
                    </div>
                  )}

                  {turn.explanation && (
                    <p className="text-xs font-bold text-[#27345C]/75">{turn.explanation}</p>
                  )}

                  {turn.followUpQuestion && (
                    <div className="p-2.5 rounded-xl bg-[#E5F6FF] text-xs font-extrabold text-[#1E3A8A] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{turn.followUpQuestion}</span>
                    </div>
                  )}

                  {turn.recommendedScreen && (
                    <button
                      type="button"
                      onClick={() => navigate(turn.recommendedScreen!)}
                      className="min-h-[34px] px-3 rounded-xl bg-[#55D98B] text-[#27345C] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'ar' ? 'انتقل للتدريب' : 'Open Activity'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {errorBanner && (
            <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-extrabold text-[#991B1B]">
              {errorBanner}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendPrompt(input);
            }}
            className="flex items-center gap-2 pt-2 border-t border-[#27345C]/10"
          >
            <input
              type="text"
              value={input}
              maxLength={320}
              disabled={!isEnabledForChild || loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اكتب سؤالك التعليمي لنونو هنا...'
                  : 'Ask Nono a learning question here...'
              }
              className="flex-1 min-h-[48px] px-4 rounded-2xl border-2 border-[#27345C]/15 focus:border-[#8054D9] outline-none text-sm font-bold text-[#27345C]"
            />
            <button
              type="submit"
              disabled={!isEnabledForChild || loading || !input.trim()}
              className="min-h-[48px] px-5 rounded-2xl bg-[#8054D9] text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? (language === 'ar' ? 'يفكّر...' : 'Thinking...') : language === 'ar' ? 'إرسال' : 'Ask'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
