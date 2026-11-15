import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Compass, FlaskConical, HelpCircle, Sparkles, Star, Volume2 } from 'lucide-react';
import labWorkshopImg from '../assets/images/discovery_lab_workshop_1794739849710.jpg';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { getWorldById } from '../data/worlds';
import { buildAgeAssessmentDeck } from '../engine/adaptiveEngine';
import { AGE_GROUP_META, formatNumber, SKILL_LABELS, t, UI_COPY } from '../i18n/translations';
import { SkillId } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

export const DiscoveryLabScreen: React.FC<{ isBaseline?: boolean }> = ({ isBaseline = false }) => {
  const { activeChild, language, navigate, recordAssessmentResult } = useNonoLand();
  const [sessionState, setSessionState] = useState<'intro' | 'active'>('intro');
  const [mode, setMode] = useState<'diagnostic' | 'practice'>('diagnostic');
  const [idx, setIdx] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [answersLog, setAnswersLog] = useState<Record<string, { skillId: SkillId; correct: boolean }>>({});
  const [showPracticeHint, setShowPracticeHint] = useState(false);

  const deck = useMemo(() => buildAgeAssessmentDeck(activeChild.ageGroup), [activeChild.ageGroup]);
  const current = deck[idx];

  const handleStart = (chosenMode: 'diagnostic' | 'practice') => {
    soundEngine.playPop();
    setMode(chosenMode);
    setIdx(0);
    setConsecutiveCorrect(0);
    setAnswersLog({});
    setShowPracticeHint(false);
    setSessionState('active');
    if (deck[0]) {
      soundEngine.speak(t(deck[0].question.prompt, language), language);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!current) return;
    const updatedLog = {
      ...answersLog,
      [current.id]: { skillId: current.skillId, correct: isCorrect },
    };
    setAnswersLog(updatedLog);

    if (mode === 'practice') {
      if (isCorrect) {
        soundEngine.playSuccess();
      } else {
        soundEngine.playEncourage();
        setShowPracticeHint(true);
        return; // In practice mode, let the child try again with Nono's hint!
      }
    } else {
      soundEngine.playPop(); // Neutral friendly chime in diagnostic mode so answers aren't leaked prematurely
    }

    // Adaptive streak tracking (never increase difficulty on 1 answer alone)
    const nextStreak = isCorrect ? consecutiveCorrect + 1 : 0;
    setConsecutiveCorrect(nextStreak);

    if (idx + 1 < deck.length) {
      setShowPracticeHint(false);
      setIdx(idx + 1);
      soundEngine.speak(t(deck[idx + 1].question.prompt, language), language);
    } else {
      // Summarize breakdown
      const breakdown: Partial<Record<SkillId, { correct: number; total: number }>> = {};
      let correctCount = 0;
      Object.values(updatedLog).forEach((entry) => {
        if (entry.correct) correctCount += 1;
        const prev = breakdown[entry.skillId] || { correct: 0, total: 0 };
        breakdown[entry.skillId] = {
          correct: prev.correct + (entry.correct ? 1 : 0),
          total: prev.total + 1,
        };
      });

      // Find skill needing gentle practice
      let weakSkill: SkillId = current.skillId;
      let lowestRatio = 2;
      (Object.keys(breakdown) as SkillId[]).forEach((sk) => {
        const b = breakdown[sk]!;
        const ratio = b.correct / b.total;
        if (ratio < lowestRatio) {
          lowestRatio = ratio;
          weakSkill = sk;
        }
      });

      const matchingItem = deck.find((d) => d.skillId === weakSkill) || deck[0];
      recordAssessmentResult({
        childId: activeChild.id,
        ageGroup: activeChild.ageGroup,
        mode: isBaseline ? 'baseline' : 'lab',
        questionsCompleted: deck.length,
        correctAnswers: correctCount,
        skillBreakdown: breakdown,
        recommendedWorldId: matchingItem.sourceWorldId,
        recommendedActivityId: matchingItem.id.replace('lab-', '').replace(/-\d+$/, ''),
        starsEarned: 4,
      });
      navigate('assessment-results');
    }
  };

  if (sessionState === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="nono-card rounded-[2rem] overflow-hidden">
          <div className="relative h-56 sm:h-72">
            <img
              src={labWorkshopImg}
              alt={t(UI_COPY.lab.title, language)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#27345C]/85 via-[#27345C]/30 to-transparent flex items-end p-6 sm:p-8">
              <div className="text-white">
                <p className="text-xs font-bold text-[#FFD84D]">
                  {t(AGE_GROUP_META[activeChild.ageGroup].label, language)} ·{' '}
                  {isBaseline
                    ? language === 'ar'
                      ? 'رحلة الاكتشاف الأولى'
                      : 'Baseline Discovery'
                    : t(UI_COPY.lab.title, language)}
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
                  {t(UI_COPY.lab.title, language)}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <NonoCharacter
                mood="thinking"
                scarfColor={activeChild.companionScarfColor}
                size="md"
                language={language}
              />
              <div className="space-y-2 text-center sm:text-start">
                <p className="text-lg font-bold text-[#27345C]">{t(UI_COPY.lab.subtitle, language)}</p>
                <p className="text-sm text-[#27345C]/70">
                  {language === 'ar'
                    ? `يتضمن هذا التحدي ${formatNumber(deck.length, language)} أنشطة سريعة مصممة خصيصاً لعمر ${t(AGE_GROUP_META[activeChild.ageGroup].label, language)}.`
                    : `Includes ${deck.length} varied mini-challenges crafted specifically for ages ${t(AGE_GROUP_META[activeChild.ageGroup].label, language)}.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleStart('diagnostic')}
                className="nono-btn-tactile p-5 rounded-3xl bg-[#8054D9] text-white text-start cursor-pointer"
              >
                <div className="flex items-center gap-2 font-extrabold text-lg">
                  <FlaskConical className="w-5 h-5 text-[#FFD84D]" />
                  <span>{t(UI_COPY.lab.diagnosticMode, language)}</span>
                </div>
                <p className="text-xs text-white/85 mt-1.5">
                  {language === 'ar'
                    ? 'يقيس مستوى المهارات بدقة بدون كشف الإجابات أثناء التحدي'
                    : 'Observes skill mastery accurately without revealing answers mid-session'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleStart('practice')}
                className="nono-btn-tactile p-5 rounded-3xl bg-[#39BDF2] text-[#27345C] text-start cursor-pointer"
              >
                <div className="flex items-center gap-2 font-extrabold text-lg">
                  <Sparkles className="w-5 h-5" />
                  <span>{t(UI_COPY.lab.practiceMode, language)}</span>
                </div>
                <p className="text-xs text-[#27345C]/80 mt-1.5 font-semibold">
                  {language === 'ar'
                    ? 'يوفر تلميحات نونو وتشجيعاً فورياً عند كل خطوة'
                    : 'Includes Nono hints and gentle coaching after every step'}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="max-w-3xl mx-auto nono-card rounded-[2rem] p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold text-[#8054D9] tabular-nums">
          {mode === 'diagnostic'
            ? language === 'ar'
              ? 'وضع الاكتشاف الذكي'
              : 'Discovery Mode'
            : language === 'ar'
              ? 'وضع التدريب بالتلميحات'
              : 'Guided Practice'}
          {' · '}
          {idx + 1} / {deck.length}
        </span>
        <span className="text-xs font-bold text-[#27345C]/70">
          {t(SKILL_LABELS[current.skillId], language)}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {deck.map((d, i) => (
          <div
            key={d.id}
            className={`h-2.5 flex-1 rounded-full ${
              i < idx ? 'bg-[#55D98B]' : i === idx ? 'bg-[#8054D9]' : 'bg-[#27345C]/12'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFF8E9] rounded-3xl p-5">
        <div className="space-y-2 text-center sm:text-start">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#27345C]">
            {t(current.question.prompt, language)}
          </h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => soundEngine.speak(t(current.question.prompt, language), language)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#27345C]/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#8054D9]" />
              <span>{t(UI_COPY.games.hearPrompt, language)}</span>
            </button>
            {mode === 'practice' && (
              <button
                type="button"
                onClick={() => setShowPracticeHint(!showPracticeHint)}
                className="px-3 py-1.5 rounded-xl bg-[#FFD84D]/35 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t(UI_COPY.games.hintBtn, language)}</span>
              </button>
            )}
          </div>
        </div>
        <NonoCharacter mood="thinking" scarfColor={activeChild.companionScarfColor} size="sm" language={language} />
      </div>

      {current.question.visualCue && (
        <div className="text-center text-4xl py-2">{current.question.visualCue}</div>
      )}

      {mode === 'practice' && showPracticeHint && (
        <div className="p-3.5 rounded-2xl bg-[#FFD84D]/25 border border-[#FFD84D] text-center text-sm font-bold text-[#27345C]">
          {t(current.question.hint, language)}
        </div>
      )}

      {/* Multi-format render: either choice options or sequence-order quick tap */}
      {current.question.options ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {current.question.options.map((opt) => (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAnswer(Boolean(opt.isCorrect))}
              className="nono-btn-tactile rounded-3xl p-5 bg-white border-2 border-[#27345C]/12 hover:border-[#8054D9] flex flex-col items-center justify-center gap-2 min-h-[135px] cursor-pointer"
            >
              {opt.isColorSwatch ? (
                <div className="w-16 h-16 rounded-full border-4 border-white shadow" style={{ backgroundColor: opt.visual }} />
              ) : (
                <span className="text-4xl font-extrabold">{opt.visual}</span>
              )}
              <span className="font-extrabold text-base text-[#27345C]">{t(opt.label, language)}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        /* Ordering/Sequencing question inside Assessment */
        <LabSequenceQuestion
          items={current.question.sequenceItems || []}
          answer={current.question.sequenceAnswer || []}
          language={language}
          onSubmit={(ok) => handleAnswer(ok)}
        />
      )}
    </div>
  );
};

const LabSequenceQuestion: React.FC<{
  items: string[];
  answer: string[];
  language: 'ar' | 'en';
  onSubmit: (isCorrect: boolean) => void;
}> = ({ items, answer, language, onSubmit }) => {
  const [picked, setPicked] = useState<string[]>([]);

  const handlePick = (item: string) => {
    if (picked.includes(item)) return;
    const next = [...picked, item];
    setPicked(next);
    if (next.length === answer.length) {
      const ok = next.every((v, i) => v === answer[i]);
      setTimeout(() => {
        setPicked([]);
        onSubmit(ok);
      }, 300);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-xs font-bold text-[#8054D9]">
        {language === 'ar' ? 'اضغط العناصر بالترتيب الصحيح:' : 'Tap items in the right order:'}
      </p>
      <div className="flex justify-center gap-2">
        {answer.map((_, i) => (
          <div key={i} className="min-w-[56px] px-3 h-12 rounded-xl bg-[#FFF8E9] border border-[#27345C]/15 flex items-center justify-center font-extrabold">
            {picked[i] || '?'}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {items.map((it) => (
          <button
            key={it}
            type="button"
            disabled={picked.includes(it)}
            onClick={() => handlePick(it)}
            className="nono-btn-tactile px-4 py-3 rounded-2xl bg-white border-2 border-[#8054D9]/25 font-extrabold text-lg cursor-pointer disabled:opacity-35"
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
};

export const AssessmentResultsScreen: React.FC = () => {
  const { lastAssessment, activeChild, language, navigate } = useNonoLand();
  const result = lastAssessment || activeChild.assessmentHistory[0];

  if (!result) {
    return (
      <div className="nono-card rounded-3xl p-8 text-center">
        <button
          type="button"
          onClick={() => navigate('discovery-lab')}
          className="px-6 py-3 rounded-2xl bg-[#8054D9] text-white font-bold cursor-pointer"
        >
          {t(UI_COPY.lab.startSession, language)}
        </button>
      </div>
    );
  }

  const recWorld = getWorldById(result.recommendedWorldId);

  return (
    <div className="max-w-3xl mx-auto nono-card rounded-[2rem] p-6 sm:p-10 space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <NonoCharacter
            mood="celebrating"
            scarfColor={activeChild.companionScarfColor}
            size="md"
            language={language}
          />
        </div>
        <h1 className="text-3xl font-extrabold text-[#27345C]">
          {language === 'ar'
            ? `اكتشفنا مهاراتك يا ${activeChild.displayName}!`
            : `Skills Discovered, ${activeChild.displayName}!`}
        </h1>
        <p className="text-sm text-[#27345C]/75">
          {language === 'ar'
            ? `أتممت ${formatNumber(result.questionsCompleted, language)} تحديات وحصلت على +${result.starsEarned} نجوم!`
            : `Completed ${result.questionsCompleted} challenges and earned +${result.starsEarned} stars!`}
        </p>
      </div>

      {/* Friendly Skill Breakdown */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-lg text-[#27345C]">
          {language === 'ar' ? 'المهارات التي تم استكشافها:' : 'Skills Explored:'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(result.skillBreakdown) as SkillId[]).map((sk) => {
            const item = result.skillBreakdown[sk]!;
            const pct = Math.round((item.correct / item.total) * 100);
            const meta = SKILL_LABELS[sk];
            return (
              <div key={sk} className="rounded-2xl bg-[#FFF8E9] p-4 border border-[#27345C]/10">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{t(meta, language)}</span>
                  <span className="font-mono-num" style={{ color: meta.color }}>
                    {item.correct}/{item.total}
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-white overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(15, pct)}%`, backgroundColor: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Next Adventure */}
      <div className="rounded-3xl bg-gradient-to-br from-[#8054D9]/12 to-[#55D98B]/15 p-5 border-2 border-[#8054D9]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold text-[#8054D9] flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'أول مغامرة مقترحة لك' : 'Your Recommended Next World'}</span>
          </p>
          <p className="text-xl font-extrabold text-[#27345C] mt-1">
            {recWorld.guardianEmoji} {t(recWorld.name, language)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('world-detail', { worldId: recWorld.id })}
            className="nono-btn-tactile px-5 py-3 rounded-2xl bg-[#8054D9] text-white font-bold flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{language === 'ar' ? 'انطلق للعالم' : 'Explore World'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="px-4 py-3 rounded-2xl bg-white border border-[#27345C]/15 font-bold cursor-pointer"
          >
            {t(UI_COPY.nav.home, language)}
          </button>
        </div>
      </div>
    </div>
  );
};
