import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Compass,
  FlaskConical,
  HelpCircle,
  Microscope,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react';
import labWorkshopImg from '../assets/images/discovery_lab_workshop_1794739849710.jpg';
import { LabExperimentsStage } from '../components/lab/LabExperimentsStage';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { LAB_EXPERIMENTS } from '../data/worldCatalog';
import { getWorldById } from '../data/worlds';
import { buildAgeAssessmentDeck } from '../engine/adaptiveEngine';
import { AGE_GROUP_META, formatNumber, SKILL_LABELS, t, UI_COPY } from '../i18n/translations';
import { SkillId } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

export const DiscoveryLabScreen: React.FC<{ isBaseline?: boolean }> = ({ isBaseline = false }) => {
  const { activeChild, language, navigate, recordAssessmentResult, completeLabExperiment } = useNonoLand();
  const [labZone, setLabZone] = useState<'experiments' | 'assessment'>(
    isBaseline ? 'assessment' : 'experiments',
  );
  const [selectedExpId, setSelectedExpId] = useState<string>(LAB_EXPERIMENTS[0].id);
  const [labFeedbackBanner, setLabFeedbackBanner] = useState<string | null>(null);

  // Assessment sub-mode state (preserved cleanly)
  const [sessionState, setSessionState] = useState<'intro' | 'active'>('intro');
  const [mode, setMode] = useState<'diagnostic' | 'practice'>('diagnostic');
  const [idx, setIdx] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [answersLog, setAnswersLog] = useState<Record<string, { skillId: SkillId; correct: boolean }>>({});
  const [showPracticeHint, setShowPracticeHint] = useState(false);

  const deck = useMemo(() => buildAgeAssessmentDeck(activeChild.ageGroup), [activeChild.ageGroup]);
  const current = deck[idx];

  const activeExperiment = useMemo(
    () => LAB_EXPERIMENTS.find((e) => e.id === selectedExpId) || LAB_EXPERIMENTS[0],
    [selectedExpId],
  );
  const completedLabIds = activeChild.completedLabIds || [];

  const handleCompleteExperiment = async () => {
    const res = await completeLabExperiment(activeExperiment.id, activeExperiment.starsReward);
    soundEngine.playCelebration();
    setLabFeedbackBanner(
      res.starsAdded > 0
        ? language === 'ar'
          ? `أحسنت يا عالم نونو لاند! تم تسجيل تجربة "${activeExperiment.title.ar}" ومنحك +${res.starsAdded} نجوم!`
          : `Awesome discovery! "${activeExperiment.title.en}" recorded and +${res.starsAdded} stars earned!`
        : language === 'ar'
          ? `تمت إعادة تجربة "${activeExperiment.title.ar}" بنجاح!`
          : `"${activeExperiment.title.en}" replayed cleanly!`,
    );
  };

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
        return;
      }
    } else {
      soundEngine.playPop();
    }

    const nextStreak = isCorrect ? consecutiveCorrect + 1 : 0;
    setConsecutiveCorrect(nextStreak);

    if (idx + 1 < deck.length) {
      setShowPracticeHint(false);
      setIdx(idx + 1);
      soundEngine.speak(t(deck[idx + 1].question.prompt, language), language);
    } else {
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

  return (
    <div className="space-y-6">
      {/* Header Banner + Mode Switcher */}
      <div className="nono-card rounded-[2rem] overflow-hidden">
        <div className="relative h-44 sm:h-56">
          <img
            src={labWorkshopImg}
            alt={t(UI_COPY.lab.title, language)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#27345C]/90 via-[#27345C]/45 to-transparent flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
            <div className="text-white space-y-1">
              <p className="text-xs font-extrabold text-[#FFD84D]">
                {t(AGE_GROUP_META[activeChild.ageGroup].label, language)} ·{' '}
                {language === 'ar'
                  ? `${formatNumber(completedLabIds.length, language)} / ${formatNumber(LAB_EXPERIMENTS.length, language)} تجارب علمية مكتشفة`
                  : `${completedLabIds.length} / ${LAB_EXPERIMENTS.length} Science Labs Explored`}
              </p>
              <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-2.5">
                <FlaskConical className="w-7 h-7 text-[#39BDF2]" />
                <span>{language === 'ar' ? 'مختبر نونو العلمي التفاعلي' : "Nono's Interactive Science Lab"}</span>
              </h1>
            </div>

            {!isBaseline && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm p-1.5 rounded-2xl border border-white/25">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    setLabZone('experiments');
                  }}
                  className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    labZone === 'experiments' ? 'bg-[#FFD84D] text-[#27345C]' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Microscope className="w-4 h-4" />
                  <span>{language === 'ar' ? 'منضدة التجارب (٨)' : 'Science Bench (8)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    setLabZone('assessment');
                  }}
                  className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    labZone === 'assessment' ? 'bg-[#39BDF2] text-[#27345C]' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'ar' ? 'اكتشاف المهارات الذكي' : 'Adaptive Skill Check'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WORLD 1 INTERACTIVE 2-ZONE SCIENTIFIC SANDBOX */}
      {labZone === 'experiments' && !isBaseline && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Zone 1: Experiment Selector & Nono Scientist Guide */}
          <div className="lg:col-span-4 space-y-4">
            <div className="nono-card rounded-3xl p-5 bg-gradient-to-br from-[#F3ECFF] to-[#E5F6FF] space-y-3">
              <div className="flex items-center gap-3">
                <NonoCharacter
                  mood="thinking"
                  scarfColor={activeChild.companionScarfColor}
                  size="sm"
                  language={language}
                />
                <div>
                  <p className="text-xs font-extrabold text-[#8054D9]">
                    {language === 'ar' ? 'مرشدك العالم نونو' : 'Scientist Guide Nono'}
                  </p>
                  <p className="text-sm font-bold text-[#27345C] leading-snug mt-0.5">
                    {activeExperiment.nonoIntro[language]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => soundEngine.speak(activeExperiment.nonoIntro[language], language)}
                className="w-full min-h-[44px] rounded-xl bg-white border border-[#27345C]/12 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-[#8054D9]" />
                <span>{language === 'ar' ? 'استمع لشرح نونو' : 'Hear Nono’s Intro'}</span>
              </button>
            </div>

            <div className="nono-card rounded-3xl p-4 space-y-2.5">
              <h2 className="text-sm font-extrabold text-[#27345C] px-1">
                {language === 'ar' ? 'اختر تجربة علمية آمنة:' : 'Choose a Safe Experiment:'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {LAB_EXPERIMENTS.map((exp) => {
                  const selected = exp.id === activeExperiment.id;
                  const done = completedLabIds.includes(exp.id);
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playPop();
                        setSelectedExpId(exp.id);
                        setLabFeedbackBanner(null);
                      }}
                      className={`min-h-[56px] w-full p-3 rounded-2xl border-2 text-start flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                        selected
                          ? 'bg-[#FFF8E9] border-[#8054D9] shadow-sm'
                          : 'bg-white border-[#27345C]/10 hover:border-[#8054D9]/45'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{exp.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#27345C] truncate">{exp.title[language]}</p>
                          <p className="text-[11px] font-bold" style={{ color: exp.accentColor }}>
                            {exp.shortTag[language]} · +{exp.starsReward} ⭐
                          </p>
                        </div>
                      </div>
                      {done && <CheckCircle2 className="w-5 h-5 text-[#55D98B] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Zone 2: Interactive Experiment Bench */}
          <div className="lg:col-span-8 space-y-4">
            {labFeedbackBanner && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#FFF3D1] border-2 border-[#FFD84D] p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#27345C]">
                  <Star className="w-5 h-5 fill-[#FFD84D] text-[#FF9360] shrink-0" />
                  <span>{labFeedbackBanner}</span>
                </div>
              </motion.div>
            )}

            <LabExperimentsStage
              key={activeExperiment.id}
              experiment={activeExperiment}
              ageGroup={activeChild.ageGroup}
              language={language}
              alreadyDone={completedLabIds.includes(activeExperiment.id)}
              onComplete={() => void handleCompleteExperiment()}
            />
          </div>
        </div>
      )}

      {/* PRESERVED DIAGNOSTIC / PRACTICE ASSESSMENT FLOW */}
      {(labZone === 'assessment' || isBaseline) && sessionState === 'intro' && (
        <div className="max-w-4xl mx-auto nono-card rounded-[2rem] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <NonoCharacter
              mood="thinking"
              scarfColor={activeChild.companionScarfColor}
              size="md"
              language={language}
            />
            <div className="space-y-2 text-center sm:text-start">
              <h2 className="text-2xl font-extrabold text-[#27345C]">{t(UI_COPY.lab.title, language)}</h2>
              <p className="text-base font-bold text-[#27345C]/80">{t(UI_COPY.lab.subtitle, language)}</p>
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
      )}

      {(labZone === 'assessment' || isBaseline) && sessionState === 'active' && current && (
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
            <LabSequenceQuestion
              items={current.question.sequenceItems || []}
              answer={current.question.sequenceAnswer || []}
              language={language}
              onSubmit={(ok) => handleAnswer(ok)}
            />
          )}
        </div>
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
