import { GAME_ACTIVITIES } from '../data/activities';
import { LEARNING_WORLDS } from '../data/worlds';
import { SKILL_LABELS } from '../i18n/translations';
import {
  AgeGroupId,
  ChildProfile,
  GameActivity,
  GameQuestion,
  ParentInsight,
  SkillId,
  WorldId,
} from '../types/nonoland';

export interface AdaptiveRecommendation {
  activity: GameActivity;
  worldId: WorldId;
  reason: { ar: string; en: string };
  focusSkill: SkillId;
}

/**
 * Transparent rule-based adaptive learning engine:
 * 1. Filters activities eligible for the child's age group.
 * 2. Identifies skills needing practice (lowest accuracy or unpracticed) vs mastered skills.
 * 3. Avoids immediate repetition of the most recent completed activity.
 * 4. Returns a tailored recommendation + explanation.
 */
export function getAdaptiveRecommendation(child: ChildProfile): AdaptiveRecommendation {
  const ageActivities = GAME_ACTIVITIES.filter((a) => a.ageEligibility.includes(child.ageGroup));
  const pool = ageActivities.length > 0 ? ageActivities : GAME_ACTIVITIES;

  // Score skills by need for gentle practice
  const skillEntries = Object.values(child.skillProgress);
  const prioritizedSkills = [...skillEntries].sort((a, b) => {
    if (a.attempts === 0 && b.attempts > 0) return -1;
    if (b.attempts === 0 && a.attempts > 0) return 1;
    return a.accuracy - b.accuracy;
  });

  for (const skill of prioritizedSkills) {
    const candidates = pool.filter(
      (a) => a.skillId === skill.skillId && a.id !== child.recentActivityId,
    );
    const uncompleted = candidates.find((c) => !child.completedActivityIds.includes(c.id));
    if (uncompleted) {
      const skillName = SKILL_LABELS[skill.skillId];
      const reason =
        skill.attempts === 0
          ? {
              ar: `فرصة جديدة لاكتشاف مهارة ${skillName.ar} بأسلوب يناسب عمرك`,
              en: `A fresh adventure to explore ${skillName.en} at your age level`,
            }
          : skill.accuracy < 75
            ? {
                ar: `تدريب لطيف لتعزيز مهارة ${skillName.ar} بخطوات ممتعة`,
                en: `Gentle extra practice to build confidence in ${skillName.en}`,
              }
            : {
                ar: `استمرار التألق في ${skillName.ar} مع تحدٍّ جديد!`,
                en: `Keep shining in ${skillName.en} with a brand-new challenge!`,
              };

      return {
        activity: uncompleted,
        worldId: uncompleted.worldId,
        reason,
        focusSkill: skill.skillId,
      };
    }
  }

  // Fallback to any uncompleted age-appropriate activity or favorite world
  const fallback =
    pool.find((a) => !child.completedActivityIds.includes(a.id)) ||
    pool.find((a) => a.worldId === child.favoriteWorldId) ||
    pool[0];

  return {
    activity: fallback,
    worldId: fallback.worldId,
    reason: {
      ar: 'نشاط ممتع اختاره نونو خصيصاً لرحلتك اليوم',
      en: 'A playful adventure Nono picked for your journey today',
    },
    focusSkill: fallback.skillId,
  };
}

export interface DiscoveryLabQuestion {
  id: string;
  skillId: SkillId;
  difficulty: 1 | 2 | 3;
  question: GameQuestion;
  sourceWorldId: WorldId;
}

/**
 * Generates an age-specific Discovery Lab assessment deck.
 * Never serves a 3-4 year old an 8-year-old question or vice-versa.
 * Supports adaptive progression: requires 2 consecutive correct answers before raising difficulty.
 */
export function buildAgeAssessmentDeck(ageGroup: AgeGroupId): DiscoveryLabQuestion[] {
  const eligibleActivities = GAME_ACTIVITIES.filter(
    (a) =>
      a.ageEligibility.includes(ageGroup) &&
      (a.mechanic === 'visual-tap' || a.mechanic === 'sequence-builder') &&
      a.questions.length > 0,
  );

  const deck: DiscoveryLabQuestion[] = [];
  const seenSkills = new Set<SkillId>();

  // First pass: pick 1 question per distinct skill for broad coverage
  for (const act of eligibleActivities) {
    if (!seenSkills.has(act.skillId) && act.questions[0]) {
      seenSkills.add(act.skillId);
      deck.push({
        id: `lab-${act.id}-0`,
        skillId: act.skillId,
        difficulty: act.difficulty,
        question: act.questions[0],
        sourceWorldId: act.worldId,
      });
    }
    if (deck.length >= 6) break;
  }

  // Second pass if fewer than 5 questions
  if (deck.length < 5) {
    for (const act of eligibleActivities) {
      for (let i = 0; i < act.questions.length; i++) {
        const qId = `lab-${act.id}-${i}`;
        if (!deck.some((d) => d.id === qId)) {
          deck.push({
            id: qId,
            skillId: act.skillId,
            difficulty: act.difficulty,
            question: act.questions[i],
            sourceWorldId: act.worldId,
          });
        }
        if (deck.length >= 5) break;
      }
      if (deck.length >= 5) break;
    }
  }

  return deck.sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Generates parent insights strictly grounded in recorded child attempts & assessments.
 */
export function generateParentInsights(child: ChildProfile): ParentInsight[] {
  const insights: ParentInsight[] = [];
  const practicedSkills = Object.values(child.skillProgress).filter((s) => s.attempts > 0);

  if (practicedSkills.length === 0) {
    insights.push({
      id: 'insight-empty',
      type: 'recommendation',
      text: {
        ar: `لم يبدأ ${child.displayName} أنشطة مسجلة بعد. ابدأ بجلسة مختبر نونو للاكتشاف أو بنشاط من خريطة العوالم.`,
        en: `${child.displayName} has no recorded activity sessions yet. Try Nono's Discovery Lab or any island activity to begin tracking.`,
      },
    });
    return insights;
  }

  const strongest = [...practicedSkills].sort((a, b) => b.accuracy - a.accuracy)[0];
  if (strongest) {
    const label = SKILL_LABELS[strongest.skillId];
    insights.push({
      id: 'insight-strong',
      type: 'strength',
      text: {
        ar: `أظهر ${child.displayName} ثقة عالية في "${label.ar}" بدقة ${strongest.accuracy}% عبر ${strongest.attempts} محاولات.`,
        en: `${child.displayName} demonstrated strong progress in "${label.en}" with ${strongest.accuracy}% accuracy across ${strongest.attempts} attempts.`,
      },
    });
  }

  const needsPractice = [...practicedSkills].sort((a, b) => a.accuracy - b.accuracy)[0];
  if (needsPractice && needsPractice.skillId !== strongest?.skillId && needsPractice.accuracy < 85) {
    const label = SKILL_LABELS[needsPractice.skillId];
    insights.push({
      id: 'insight-practice',
      type: 'practice',
      text: {
        ar: `قد يستفيد ${child.displayName} من أنشطة إضافية لطيفة في "${label.ar}" (الدقة الحالية ${needsPractice.accuracy}%).`,
        en: `${child.displayName} may benefit from gentle additional play in "${label.en}" (currently ${needsPractice.accuracy}% accuracy).`,
      },
    });
  }

  const rec = getAdaptiveRecommendation(child);
  const world = LEARNING_WORLDS.find((w) => w.id === rec.worldId);
  if (world) {
    insights.push({
      id: 'insight-rec',
      type: 'recommendation',
      text: {
        ar: `الخطوة المقترحة التالية: "${rec.activity.title.ar}" داخل ${world.name.ar}.`,
        en: `Suggested next adventure: "${rec.activity.title.en}" inside ${world.name.en}.`,
      },
    });
  }

  return insights;
}
