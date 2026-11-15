import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Ear,
  PauseCircle,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useNonoLand } from '../../context/NonoLandContext';
import { formatNumber, t } from '../../i18n/translations';
import {
  Level2ActivitySpec,
  Level2LessonDefinition,
  Level2LessonProgress,
  Level2QuestionItem,
  NonoMood,
} from '../../types/nonoland';
import { soundEngine } from '../../utils/soundEngine';
import { NonoCharacter } from '../NonoCharacter';
import { TracingPad } from './TracingPad';

type ClientL2Question = Omit<Level2QuestionItem, 'correctOptionId'>;

interface L2ReviewRow {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation?: { ar: string; en: string };
}

interface Level2LessonRunnerProps {
  lesson: Level2LessonDefinition;
  onExit: () => void;
  onSelectNextLesson?: (lesson: Level2LessonDefinition) => void;
  nextLesson?: Level2LessonDefinition;
}

export const Level2LessonRunner: React.FC<Level2LessonRunnerProps> = ({
  lesson,
  onExit,
  onSelectNextLesson,
  nextLesson,
}) => {
  const { activeChild, authSession, language, recordLevel2Progress } = useNonoLand();
  const existing = activeChild.level2Progress?.[lesson.id];

  // Steps: 0 = Intro & Teach/Examples, 1..N = activities, N+1 = Final Backend-Graded Assessment
  const totalSteps = 2 + lesson.activities.length; // step 0 (intro), step 1 (teach/examples/vocab), 2..N+1 (activities), last = assessment
  const [step, setStep] = useState<number>(0);
  const [nonoMood, setNonoMood] = useState<NonoMood>('idle');
  const [completedActs, setCompletedActs] = useState<string[]>(existing?.completedActivityIds || []);
  const [corrects, setCorrects] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [stepPassed, setStepPassed] = useState(false);

  // Interactive states for activities
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [selectedLeftPairId, setSelectedLeftPairId] = useState<string | null>(null);
  const [sortedMap, setSortedMap] = useState<Record<string, string>>({});
  const [activeSortItem, setActiveSortItem] = useState<string | null>(null);
  const [sequencePicked, setSequencePicked] = useState<string[]>([]);
  const [builtLetters, setBuiltLetters] = useState<number[]>([]);
  const [traceDone, setTraceDone] = useState(false);

  // Final backend assessment state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizQs, setQuizQs] = useState<ClientL2Question[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [finalResult, setFinalResult] = useState<{
    score: number;
    totalQuestions: number;
    percentage: number;
    demonstrated: boolean;
    status: Level2LessonProgress['status'];
    revisionDueAt: string;
    reviewIntervalStep: number;
    review: L2ReviewRow[];
  } | null>(null);

  const ArrowNext = language === 'ar' ? ArrowLeft : ArrowRight;
  const currentActivity: Level2ActivitySpec | undefined =
    step >= 2 && step < 2 + lesson.activities.length ? lesson.activities[step - 2] : undefined;

  const shuffledRights = useMemo(() => {
    if (!currentActivity?.pairs) return [];
    return [...currentActivity.pairs].sort((a, b) => a.right.localeCompare(b.right));
  }, [currentActivity]);

  const shuffledSequencePool = useMemo(() => {
    if (!currentActivity?.sequenceItems) return [];
    const items = currentActivity.sequenceItems;
    // Deterministically rotate/reverse slightly so it isn't trivially pre-ordered
    return items.length >= 3 ? [items[1], items[items.length - 1], items[0], ...items.slice(2, items.length - 1)] : [...items].reverse();
  }, [currentActivity]);

  const resetWidgetState = () => {
    setFeedback('');
    setStepPassed(false);
    setSelectedChoiceId(null);
    setMatchedPairIds([]);
    setSelectedLeftPairId(null);
    setSortedMap({});
    setActiveSortItem(null);
    setSequencePicked([]);
    setBuiltLetters([]);
    setTraceDone(false);
  };

  const speakCue = (text: string, langHint?: 'ar' | 'en') => {
    soundEngine.playPop();
    const useLang = langHint || (lesson.subject === 'english' ? 'en' : language);
    soundEngine.speak(text, useLang);
  };

  const markActivityDone = (actId: string, actCorrect: boolean) => {
    const nextActs = Array.from(new Set([...completedActs, actId]));
    setCompletedActs(nextActs);
    if (actCorrect) {
      setCorrects((c) => c + 1);
      setNonoMood('celebrating');
      soundEngine.playSuccess();
    } else {
      setMistakes((m) => m + 1);
      setNonoMood('encouraging');
      soundEngine.playEncourage();
    }

    const prog: Level2LessonProgress = {
      lessonId: lesson.id,
      subject: lesson.subject,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedSteps: Array.from(new Set([...(existing?.completedSteps || []), step])),
      completedActivityIds: nextActs,
      correctCount: (existing?.correctCount || 0) + (actCorrect ? 1 : 0),
      mistakesCount: (existing?.mistakesCount || 0) + (actCorrect ? 0 : 1),
      timeSpentSeconds: existing?.timeSpentSeconds || 0,
      attemptsCount: existing?.attemptsCount || 0,
      status: existing?.status === 'demonstrated' ? 'demonstrated' : nextActs.length >= 2 ? 'practicing' : 'learning',
      skillsDemonstrated: existing?.skillsDemonstrated || [],
      lastPracticedAt: new Date().toISOString(),
      revisionDueAt: existing?.revisionDueAt,
      reviewIntervalStep: existing?.reviewIntervalStep ?? 0,
    };
    recordLevel2Progress(prog, actCorrect ? 1 : 0, 1);

    if (authSession.authenticated) {
      fetch('/api/level2/progress', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession.csrfToken ? { 'x-csrf-token': authSession.csrfToken } : {}),
        },
        body: JSON.stringify({
          childId: activeChild.id,
          lessonId: lesson.id,
          completedSteps: prog.completedSteps,
          completedActivityIds: nextActs,
          correctCount: prog.correctCount,
          mistakesCount: prog.mistakesCount,
          timeSpentSeconds: 45,
        }),
      }).catch(() => {});
    }
  };

  const handleStartAssessment = async () => {
    setLoadingQuiz(true);
    setQuizError('');
    try {
      const res = await fetch('/api/level2/assessment/start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession.csrfToken ? { 'x-csrf-token': authSession.csrfToken } : {}),
        },
        body: JSON.stringify({ childId: activeChild.id, lessonId: lesson.id, questionCount: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start assessment');
      setAttemptId(data.attemptId);
      setQuizQs(data.questions || []);
      setQuizIdx(0);
      setQuizAnswers({});
      setFinalResult(null);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!attemptId) return;
    setLoadingQuiz(true);
    setQuizError('');
    try {
      const res = await fetch('/api/level2/assessment/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession.csrfToken ? { 'x-csrf-token': authSession.csrfToken } : {}),
        },
        body: JSON.stringify({ attemptId, answers: quizAnswers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grade assessment');
      setFinalResult(data);
      const updatedProg: Level2LessonProgress = {
        lessonId: lesson.id,
        subject: lesson.subject,
        startedAt: existing?.startedAt || new Date().toISOString(),
        completedSteps: Array.from({ length: totalSteps + 1 }, (_, i) => i),
        completedActivityIds: lesson.activities.map((a) => a.id),
        correctCount: (existing?.correctCount || 0) + corrects + data.score,
        mistakesCount: (existing?.mistakesCount || 0) + mistakes + (data.totalQuestions - data.score),
        timeSpentSeconds: (existing?.timeSpentSeconds || 0) + lesson.estimatedMinutes * 60,
        lastScore: data.score,
        lastTotal: data.totalQuestions,
        attemptsCount: (existing?.attemptsCount || 0) + 1,
        status: data.status,
        skillsDemonstrated: data.demonstrated ? [lesson.learningObjective.en] : existing?.skillsDemonstrated || [],
        lastPracticedAt: new Date().toISOString(),
        revisionDueAt: data.revisionDueAt,
        reviewIntervalStep: data.reviewIntervalStep ?? 0,
      };
      const newlyMastered = data.demonstrated && existing?.status !== 'demonstrated';
      recordLevel2Progress(updatedProg, newlyMastered ? 3 : 1, lesson.estimatedMinutes);
      if (data.demonstrated) {
        soundEngine.playCelebration();
        setNonoMood('celebrating');
      } else {
        soundEngine.playEncourage();
        setNonoMood('encouraging');
      }
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const goNext = () => {
    soundEngine.playPop();
    const next = step + 1;
    resetWidgetState();
    setStep(next);
    if (next === totalSteps) {
      void handleStartAssessment();
    }
  };

  const progressPct = Math.round(((step + 1) / (totalSteps + 1)) * 100);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header Progress Bar */}
      <div className="nono-card p-4 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="h-10 px-3 rounded-xl bg-[#27345C]/8 text-[#27345C] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#27345C]/15"
          >
            <PauseCircle className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ ومتابعة لاحقاً' : 'Pause & Save'}</span>
          </button>
          <div>
            <p className="text-xs font-extrabold text-[#8054D9] uppercase">
              {lesson.id} · {language === 'ar' ? 'المستوى ٢: المستكشفون' : 'Level 2: Little Explorers'}
            </p>
            <h2 className="font-extrabold text-base sm:text-lg text-[#27345C]">{t(lesson.title, language)}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3 min-w-[170px]">
          <div className="flex-1 h-3 rounded-full bg-[#27345C]/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8054D9] to-[#55D98B] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-[#27345C] tabular-nums">
            {formatNumber(step + 1, language)}/{formatNumber(totalSteps + 1, language)}
          </span>
        </div>
      </div>

      {/* Step 0: Character Intro & Learning Objective */}
      {step === 0 && (
        <div className="nono-card p-6 bg-gradient-to-br from-[#F4EEFF] via-white to-[#FFF8E9] space-y-5 text-center">
          <div className="flex justify-center">
            <NonoCharacter mood={nonoMood} size="lg" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8054D9]/15 text-[#8054D9] font-extrabold text-sm">
            <span>{lesson.characterEmoji}</span>
            <span>{t(lesson.characterName, language)}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#27345C]">{t(lesson.title, language)}</h3>
          <p className="text-base sm:text-lg font-bold text-[#27345C]/80 max-w-2xl mx-auto">
            {t(lesson.characterIntro, language)}
          </p>
          <div className="p-4 rounded-2xl bg-white border border-[#8054D9]/20 max-w-xl mx-auto text-start">
            <p className="text-xs font-extrabold text-[#8054D9] uppercase mb-1">
              {language === 'ar' ? 'هدف الدرس' : 'Learning Objective'}
            </p>
            <p className="font-bold text-sm text-[#27345C]">{t(lesson.learningObjective, language)}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => speakCue(t(lesson.characterIntro, language), language)}
              className="nono-btn-tactile h-12 px-5 rounded-2xl bg-[#39BDF2] text-white font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>{language === 'ar' ? 'استمع للشرح' : 'Listen to Intro'}</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="nono-btn-tactile h-12 px-7 rounded-2xl bg-[#8054D9] text-white font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <span>{language === 'ar' ? 'هيا نبدأ الاستكشاف!' : 'Let’s Explore!'}</span>
              <ArrowNext className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Teaching Explanation, Visuals & Vocabulary */}
      {step === 1 && (
        <div className="nono-card p-6 bg-white space-y-6">
          <div className="p-5 rounded-2xl bg-[#E5F6FF]/70 border border-[#39BDF2]/30 text-center space-y-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#27345C] tracking-wide">{lesson.imageVisual}</p>
            <p className="text-sm sm:text-base font-bold text-[#27345C]/85 max-w-2xl mx-auto">
              {t(lesson.teachingContent, language)}
            </p>
            <button
              type="button"
              onClick={() => speakCue(lesson.audioCue.text, lesson.audioCue.lang)}
              className="mt-2 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#39BDF2] text-white font-bold text-sm cursor-pointer"
            >
              <Ear className="w-4 h-4" />
              <span>{language === 'ar' ? 'اسمع النطق والمثال' : 'Hear Audio Cue'}</span>
            </button>
          </div>

          <div>
            <h4 className="font-extrabold text-base text-[#27345C] mb-3">
              {language === 'ar' ? 'أمثلة بصرية واضحة' : 'Clear Visual Examples'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {lesson.examples.map((ex, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#FFF8E9] border border-[#FFD84D]/50 space-y-1.5">
                  <div className="text-xl font-extrabold text-[#27345C]">{ex.visual}</div>
                  <p className="font-extrabold text-sm text-[#8054D9]">{t(ex.title, language)}</p>
                  <p className="text-xs font-bold text-[#27345C]/75">{t(ex.detail, language)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-base text-[#27345C] mb-3">
              {language === 'ar' ? 'المفردات والمهارات الأساسية (اضغط للاستماع)' : 'Key Vocabulary (Tap to Hear)'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lesson.vocabulary.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => speakCue(v.audioText || v.wordEn, v.audioLang || lesson.audioCue.lang)}
                  className="p-3 rounded-2xl bg-white border-2 border-[#27345C]/10 hover:border-[#8054D9] text-center space-y-1 cursor-pointer transition-all"
                >
                  <div className="text-3xl">{v.emoji}</div>
                  <div className="font-extrabold text-sm text-[#27345C]">
                    {language === 'ar' ? v.wordAr : v.wordEn}
                  </div>
                  <div className="text-xs font-bold text-[#27345C]/60">
                    {language === 'ar' ? v.wordEn : v.wordAr}
                  </div>
                  {v.phoneticHint && (
                    <div className="text-[11px] font-bold text-[#8054D9] bg-[#8054D9]/10 rounded-lg py-0.5 px-1.5 inline-block">
                      {v.phoneticHint}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={goNext}
              className="nono-btn-tactile h-12 px-7 rounded-2xl bg-[#55D98B] text-[#27345C] font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <span>{language === 'ar' ? 'انتقل للأنشطة التفاعلية' : 'Start Interactive Practice'}</span>
              <ArrowNext className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Steps 2..N+1: Interactive Activities */}
      {currentActivity && (
        <div className="nono-card p-6 bg-white space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#8054D9] uppercase">
                {language === 'ar' ? 'نشاط تفاعلي' : 'Interactive Activity'}
              </p>
              <h3 className="text-xl font-extrabold text-[#27345C]">{t(currentActivity.title, language)}</h3>
            </div>
            <button
              type="button"
              onClick={() => speakCue(t(currentActivity.instruction, language), language)}
              className="h-10 px-3.5 rounded-xl bg-[#39BDF2]/15 text-[#27345C] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#39BDF2]" />
              <span>{language === 'ar' ? 'اقرأ السؤال' : 'Read Prompt'}</span>
            </button>
          </div>

          <p className="text-base font-extrabold text-[#27345C] bg-[#FFF8E9] p-4 rounded-2xl border border-[#FFD84D]/50">
            {t(currentActivity.instruction, language)}
          </p>

          {/* Choice-based: guided-practice / fill-blank */}
          {(currentActivity.type === 'guided-practice' || currentActivity.type === 'fill-blank') &&
            currentActivity.options && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentActivity.options.map((opt) => {
                  const chosen = selectedChoiceId === opt.id;
                  const isRight = chosen && opt.id === currentActivity.correctOptionId;
                  const isWrong = chosen && opt.id !== currentActivity.correctOptionId;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedChoiceId(opt.id);
                        const ok = opt.id === currentActivity.correctOptionId;
                        setFeedback(t(ok ? currentActivity.feedbackCorrect : currentActivity.feedbackIncorrect, language));
                        setStepPassed(ok);
                        markActivityDone(currentActivity.id, ok);
                      }}
                      className={`p-5 rounded-2xl border-2 text-center space-y-2 transition-all cursor-pointer ${
                        isRight
                          ? 'border-[#55D98B] bg-[#55D98B]/15'
                          : isWrong
                            ? 'border-[#FF6B6B] bg-[#FF6B6B]/10'
                            : 'border-[#27345C]/15 hover:border-[#8054D9] bg-white'
                      }`}
                    >
                      {opt.colorHex && (
                        <div
                          className="w-12 h-12 rounded-2xl mx-auto border-2 border-[#27345C]/15"
                          style={{ backgroundColor: opt.colorHex }}
                        />
                      )}
                      <div className="text-2xl font-extrabold">{opt.visual}</div>
                      <div className="font-extrabold text-sm text-[#27345C]">{t(opt.label, language)}</div>
                    </button>
                  );
                })}
              </div>
            )}

          {/* Matching Pairs */}
          {currentActivity.type === 'matching-pairs' && currentActivity.pairs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                {currentActivity.pairs.map((p) => {
                  const isMatched = matchedPairIds.includes(p.id);
                  const isSel = selectedLeftPairId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isMatched}
                      onClick={() => setSelectedLeftPairId(p.id)}
                      className={`w-full p-3.5 rounded-2xl border-2 font-bold text-sm text-start cursor-pointer transition-all ${
                        isMatched
                          ? 'bg-[#55D98B]/20 border-[#55D98B] text-[#27345C]/70'
                          : isSel
                            ? 'bg-[#8054D9] border-[#8054D9] text-white'
                            : 'bg-white border-[#27345C]/15 hover:border-[#8054D9]'
                      }`}
                    >
                      {p.left} {isMatched && '✅'}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2.5">
                {shuffledRights.map((rp) => {
                  const isMatched = matchedPairIds.includes(rp.id);
                  return (
                    <button
                      key={rp.id}
                      type="button"
                      disabled={isMatched}
                      onClick={() => {
                        if (!selectedLeftPairId) return;
                        if (selectedLeftPairId === rp.id) {
                          const next = [...matchedPairIds, rp.id];
                          setMatchedPairIds(next);
                          setSelectedLeftPairId(null);
                          soundEngine.playSuccess();
                          if (next.length === currentActivity.pairs!.length) {
                            setFeedback(t(currentActivity.feedbackCorrect, language));
                            setStepPassed(true);
                            markActivityDone(currentActivity.id, true);
                          }
                        } else {
                          soundEngine.playEncourage();
                          setFeedback(t(currentActivity.feedbackIncorrect, language));
                        }
                      }}
                      className={`w-full p-3.5 rounded-2xl border-2 font-bold text-sm text-start cursor-pointer transition-all ${
                        isMatched
                          ? 'bg-[#55D98B]/20 border-[#55D98B] text-[#27345C]/70'
                          : 'bg-[#FFF8E9] border-[#27345C]/15 hover:border-[#8054D9]'
                      }`}
                    >
                      {rp.right}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sorting & Classification */}
          {currentActivity.type === 'sorting-classify' &&
            currentActivity.sortBuckets &&
            currentActivity.sortItems && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {currentActivity.sortItems.map((it) => {
                    const placedBucket = sortedMap[it.id];
                    const isPicked = activeSortItem === it.id;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        disabled={Boolean(placedBucket)}
                        onClick={() => setActiveSortItem(it.id)}
                        className={`px-4 py-3 rounded-2xl border-2 font-extrabold text-sm cursor-pointer ${
                          placedBucket
                            ? 'bg-[#55D98B]/15 border-[#55D98B] opacity-70'
                            : isPicked
                              ? 'bg-[#8054D9] border-[#8054D9] text-white'
                              : 'bg-white border-[#27345C]/15 hover:border-[#8054D9]'
                        }`}
                      >
                        <span className="me-1.5">{it.visual}</span>
                        <span>{t(it.label, language)}</span>
                        {placedBucket && ' ✅'}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentActivity.sortBuckets.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        if (!activeSortItem) return;
                        const target = currentActivity.sortItems!.find((x) => x.id === activeSortItem);
                        if (!target) return;
                        if (target.bucketId === b.id) {
                          const next = { ...sortedMap, [target.id]: b.id };
                          setSortedMap(next);
                          setActiveSortItem(null);
                          soundEngine.playSuccess();
                          if (Object.keys(next).length === currentActivity.sortItems!.length) {
                            setFeedback(t(currentActivity.feedbackCorrect, language));
                            setStepPassed(true);
                            markActivityDone(currentActivity.id, true);
                          }
                        } else {
                          soundEngine.playEncourage();
                          setFeedback(t(currentActivity.feedbackIncorrect, language));
                        }
                      }}
                      className="p-5 rounded-2xl bg-[#E5F6FF]/70 border-2 border-dashed border-[#39BDF2] text-center space-y-1.5 hover:bg-[#E5F6FF] cursor-pointer"
                    >
                      <div className="text-3xl">{b.emoji}</div>
                      <div className="font-extrabold text-sm text-[#27345C]">{t(b.label, language)}</div>
                      <p className="text-xs font-bold text-[#27345C]/65">
                        {language === 'ar' ? 'اضغط هنا لوضع البطاقة المختارة' : 'Tap to place selected card'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Pattern / Sequence Ordering */}
          {currentActivity.type === 'pattern-sequence' && currentActivity.sequenceItems && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {shuffledSequencePool.map((item) => {
                  const used = sequencePicked.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={used}
                      onClick={() => {
                        const expected = currentActivity.sequenceItems![sequencePicked.length];
                        if (item === expected) {
                          const next = [...sequencePicked, item];
                          setSequencePicked(next);
                          soundEngine.playSuccess();
                          if (next.length === currentActivity.sequenceItems!.length) {
                            setFeedback(t(currentActivity.feedbackCorrect, language));
                            setStepPassed(true);
                            markActivityDone(currentActivity.id, true);
                          }
                        } else {
                          soundEngine.playEncourage();
                          setFeedback(t(currentActivity.feedbackIncorrect, language));
                        }
                      }}
                      className={`px-4 py-3 rounded-2xl border-2 font-extrabold text-sm cursor-pointer ${
                        used ? 'bg-[#55D98B]/20 border-[#55D98B] opacity-50' : 'bg-white border-[#8054D9]/40 hover:bg-[#F4EEFF]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E9] border border-[#FFD84D]/50 flex flex-wrap items-center gap-2 min-h-[56px]">
                <span className="text-xs font-extrabold text-[#27345C]/60">
                  {language === 'ar' ? 'الترتيب المختار:' : 'Your Order:'}
                </span>
                {sequencePicked.map((s, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-[#55D98B] text-[#27345C] font-extrabold text-sm">
                    {idx + 1}. {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Word Builder */}
          {currentActivity.type === 'word-builder' && currentActivity.wordLetters && currentActivity.targetWord && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 justify-center">
                {currentActivity.wordLetters.map((ltr, idx) => {
                  const used = builtLetters.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={used}
                      onClick={() => {
                        const nextIdxs = [...builtLetters, idx];
                        const builtStr = nextIdxs.map((i) => currentActivity.wordLetters![i]).join('');
                        setBuiltLetters(nextIdxs);
                        if (builtStr.length === currentActivity.wordLetters!.length) {
                          const ok = builtStr === currentActivity.targetWord;
                          setFeedback(t(ok ? currentActivity.feedbackCorrect : currentActivity.feedbackIncorrect, language));
                          setStepPassed(ok);
                          markActivityDone(currentActivity.id, ok);
                          if (!ok) setTimeout(() => setBuiltLetters([]), 900);
                        }
                      }}
                      className={`w-14 h-14 rounded-2xl border-2 font-extrabold text-2xl cursor-pointer ${
                        used ? 'bg-[#55D98B]/25 border-[#55D98B] opacity-50' : 'bg-white border-[#8054D9] hover:bg-[#F4EEFF]'
                      }`}
                    >
                      {ltr}
                    </button>
                  );
                })}
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E9] text-center font-extrabold text-3xl text-[#27345C] min-h-[64px]">
                {builtLetters.map((i) => currentActivity.wordLetters![i]).join('') || '...'}
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setBuiltLetters([])}
                  className="text-xs font-bold text-[#8054D9] underline cursor-pointer"
                >
                  {language === 'ar' ? 'إعادة ترتيب الحروف' : 'Clear & Retry'}
                </button>
              </div>
            </div>
          )}

          {/* Tracing & Writing */}
          {currentActivity.type === 'tracing-writing' && currentActivity.traceTarget && (
            <div className="space-y-3">
              <TracingPad
                guideChar={currentActivity.traceTarget}
                language={language}
                onCompleteTrace={() => {
                  if (!traceDone) {
                    setTraceDone(true);
                    setFeedback(t(currentActivity.feedbackCorrect, language));
                    setStepPassed(true);
                    markActivityDone(currentActivity.id, true);
                  }
                }}
              />
            </div>
          )}

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl font-extrabold text-sm ${
                stepPassed ? 'bg-[#55D98B]/20 text-[#1B6B40]' : 'bg-[#FF9360]/20 text-[#9A3412]'
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                resetWidgetState();
                setStep((s) => Math.max(0, s - 1));
              }}
              className="h-11 px-4 rounded-xl bg-[#27345C]/10 font-bold text-sm cursor-pointer"
            >
              {language === 'ar' ? 'السابق' : 'Back'}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="nono-btn-tactile h-12 px-7 rounded-2xl bg-[#8054D9] text-white font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <span>{step + 1 === totalSteps ? (language === 'ar' ? 'التقييم النهائي المستقل' : 'Final Mastery Check') : (language === 'ar' ? 'النشاط التالي' : 'Next Activity')}</span>
              <ArrowNext className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Final Step: Backend-Graded Assessment */}
      {step === totalSteps && (
        <div className="nono-card p-6 bg-white space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#8054D9] uppercase">
                {language === 'ar' ? 'التحقق المستقل (أمثلة جديدة)' : 'Independent Mastery Check (Fresh Items)'}
              </p>
              <h3 className="text-xl font-extrabold text-[#27345C]">{t(lesson.title, language)}</h3>
            </div>
            <NonoCharacter mood={nonoMood} size="sm" />
          </div>

          {quizError && <div className="p-3 rounded-xl bg-[#FF6B6B]/15 text-[#991B1B] font-bold text-sm">{quizError}</div>}

          {loadingQuiz && (
            <div className="p-8 text-center font-extrabold text-[#8054D9]">
              {language === 'ar' ? 'جاري تجهيز الأسئلة وتصحيحها...' : 'Preparing & grading questions...'}
            </div>
          )}

          {!loadingQuiz && !finalResult && quizQs[quizIdx] && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#27345C]/65">
                <span>
                  {language === 'ar' ? 'سؤال' : 'Question'} {formatNumber(quizIdx + 1, language)} / {formatNumber(quizQs.length, language)}
                </span>
                {quizQs[quizIdx].audioText && (
                  <button
                    type="button"
                    onClick={() => speakCue(quizQs[quizIdx].audioText!, quizQs[quizIdx].audioLang)}
                    className="px-3 py-1 rounded-lg bg-[#39BDF2]/15 text-[#27345C] flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#39BDF2]" />
                    <span>{language === 'ar' ? 'استمع' : 'Listen'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF8E9] border border-[#FFD84D]/50 font-extrabold text-lg text-[#27345C]">
                {t(quizQs[quizIdx].prompt, language)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quizQs[quizIdx].options.map((opt) => {
                  const chosen = quizAnswers[quizQs[quizIdx].id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playPop();
                        setQuizAnswers((prev) => ({ ...prev, [quizQs[quizIdx].id]: opt.id }));
                      }}
                      className={`p-4 rounded-2xl border-2 text-center space-y-1.5 cursor-pointer transition-all ${
                        chosen ? 'border-[#8054D9] bg-[#F4EEFF]' : 'border-[#27345C]/15 bg-white hover:border-[#8054D9]'
                      }`}
                    >
                      <div className="text-2xl font-extrabold">{opt.visual}</div>
                      <div className="font-extrabold text-sm text-[#27345C]">{t(opt.label, language)}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={quizIdx === 0}
                  onClick={() => setQuizIdx((i) => Math.max(0, i - 1))}
                  className="h-11 px-4 rounded-xl bg-[#27345C]/10 font-bold text-sm disabled:opacity-40 cursor-pointer"
                >
                  {language === 'ar' ? 'السابق' : 'Prev'}
                </button>
                {quizIdx + 1 < quizQs.length ? (
                  <button
                    type="button"
                    onClick={() => setQuizIdx((i) => i + 1)}
                    className="nono-btn-tactile h-11 px-6 rounded-xl bg-[#8054D9] text-white font-extrabold text-sm cursor-pointer"
                  >
                    {language === 'ar' ? 'السؤال التالي' : 'Next Question'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitAssessment}
                    className="nono-btn-tactile h-12 px-7 rounded-2xl bg-[#55D98B] text-[#27345C] font-extrabold flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{language === 'ar' ? 'اعتماد وإظهار النتيجة' : 'Submit & Grade'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {finalResult && (
            <div className="space-y-5 text-center">
              <div
                className={`p-6 rounded-3xl ${
                  finalResult.demonstrated
                    ? 'bg-gradient-to-br from-[#55D98B]/25 to-[#FFF8E9] border-2 border-[#55D98B]'
                    : 'bg-gradient-to-br from-[#FF9360]/20 to-[#FFF8E9] border-2 border-[#FF9360]'
                }`}
              >
                <Sparkles className="w-10 h-10 mx-auto text-[#8054D9] mb-2" />
                <h4 className="text-2xl font-extrabold text-[#27345C]">
                  {finalResult.demonstrated
                    ? language === 'ar'
                      ? 'رائع! أتقنت مهارة الدرس!'
                      : 'Awesome! Lesson Demonstrated!'
                    : language === 'ar'
                      ? 'تقدم جيد! نوصي بمراجعة لطيفة'
                      : 'Good Try! Gentle Review Recommended'}
                </h4>
                <p className="text-lg font-extrabold text-[#8054D9] mt-1 tabular-nums">
                  {formatNumber(finalResult.score, language)} / {formatNumber(finalResult.totalQuestions, language)} ({formatNumber(finalResult.percentage, language)}%)
                </p>
                <p className="text-xs font-bold text-[#27345C]/70 mt-2">
                  {language === 'ar'
                    ? `جدول المراجعة المتباعدة: ${new Date(finalResult.revisionDueAt).toLocaleDateString('ar-EG')}`
                    : `Next spaced review scheduled: ${new Date(finalResult.revisionDueAt).toLocaleDateString()}`}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleStartAssessment()}
                  className="h-11 px-5 rounded-xl bg-[#27345C]/10 font-extrabold text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إعادة التقييم' : 'Try Again'}</span>
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="h-11 px-5 rounded-xl bg-[#39BDF2] text-white font-extrabold text-sm cursor-pointer"
                >
                  {language === 'ar' ? 'العودة لدروس المستوى ٢' : 'Back to Level 2 Curriculum'}
                </button>
                {nextLesson && onSelectNextLesson && (
                  <button
                    type="button"
                    onClick={() => onSelectNextLesson(nextLesson)}
                    className="nono-btn-tactile h-11 px-6 rounded-xl bg-[#8054D9] text-white font-extrabold text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'الدرس التالي' : 'Next Lesson'}</span>
                    <ArrowNext className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
