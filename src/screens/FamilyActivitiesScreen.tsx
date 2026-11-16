import React, { useState } from 'react';
import { CheckCircle2, Clock, Heart, Sparkles, Users } from 'lucide-react';
import { useNonoLand } from '../context/NonoLandContext';
import { LocalizedText } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

interface FamilyActivityDef {
  key: string;
  emoji: string;
  durationMinutes: number;
  title: LocalizedText;
  objective: LocalizedText;
  parentGuide: LocalizedText;
  coPlayPrompt: LocalizedText;
  steps: LocalizedText[];
}

const FAMILY_ACTIVITIES: FamilyActivityDef[] = [
  {
    key: 'shared-story-voice',
    emoji: '📖',
    durationMinutes: 10,
    title: { ar: 'قراءة قصة بصوتين معاً', en: 'Two-Voice Shared Story Reading' },
    objective: { ar: 'تنمية الخيال وحب القراءة والتعبير الشفهي', en: 'Build imagination, reading warmth, and oral expression' },
    parentGuide: { ar: 'اقرأ جملة ثم اترك لطفلك تخمين ما سيحدث في الصفحة التالية أو تمثيل صوت الشخصية.', en: 'Read one line together, then invite your child to guess what happens next or voice a character.' },
    coPlayPrompt: { ar: 'ناقشا معاً: لو قابلت نونو في الحديقة اليوم، ماذا ستقدمان له؟', en: 'Talk together: If Nono visited your living room today, what snack would you share?' },
    steps: [
      { ar: 'اختر قصة يحبها الطفل واجلسا بمستوى مريح.', en: 'Pick a cozy spot and open a favorite mini-story.' },
      { ar: 'تبادلا أدوار نونو وليو بالتمثيل الصوتي.', en: 'Take turns acting out Nono and Lolo voices.' },
      { ar: 'اسأل طفلك سؤالاً مفتوحاً عن شعور الشخصية.', en: 'Ask an open question about how the character felt.' },
    ],
  },
  {
    key: 'living-room-color-hunt',
    emoji: '🎨',
    durationMinutes: 8,
    title: { ar: 'صيد الألوان والأشكال في المنزل', en: 'Home Color & Shape Scavenger Hunt' },
    objective: { ar: 'ربط الأشكال الهندسية والألوان بالحياة الواقعية', en: 'Connect colors and geometric shapes to real-life objects' },
    parentGuide: { ar: 'أعطِ طفلك ٣٠ ثانية لإحضار شيء دائري وآخر باللون الأزرق ثم عدّا عدد الجوانب معاً.', en: 'Give 30 seconds to spot something round and something blue, then count sides together.' },
    coPlayPrompt: { ar: 'ابحثا معاً عن: دائرة ⭕، مربع 🟦، وشيء أخضر 🌿!', en: 'Spot together: 1 Circle ⭕, 1 Square 🟦, and 1 Green object 🌿!' },
    steps: [
      { ar: 'ابحثا عن شيء دائري في الغرفة.', en: 'Find one circular item in the room.' },
      { ar: 'ابحثا عن شكل مربع أو مستطيل.', en: 'Find a square or rectangular object.' },
      { ar: 'سمّيا الألوان بالعربية والإنجليزية معاً.', en: 'Say each color aloud in Arabic and English.' },
    ],
  },
  {
    key: 'kitchen-counting-math',
    emoji: '🍎',
    durationMinutes: 10,
    title: { ar: 'تحدي العدّ والمشاركة في المطبخ', en: 'Kitchen Counting & Sharing Challenge' },
    objective: { ar: 'فهم الجمع والطرح والتقسيم العادل بيدين عمليتين', en: 'Practice real-world counting, adding, and fair sharing' },
    parentGuide: { ar: 'استخدما ٦ ملاعق أو ثمرات فاكهة واطلبا توزيعها بالتساوي بين شخصين.', en: 'Use 6 spoons or fruits and invite your child to divide them equally for two people.' },
    coPlayPrompt: { ar: 'إذا كان لدينا ٤ تفاحات وأضفنا ٢، فكم يصبح المجموع؟', en: 'If we have 4 apples and add 2 more, how many do we have?' },
    steps: [
      { ar: 'عدّا ٦ أغراض آمنة على الطاولة.', en: 'Count 6 safe items on the table together.' },
      { ar: 'اقسماها إلى مجموعتين متساويتين (٣ + ٣).', en: 'Split them into two equal groups (3 + 3).' },
      { ar: 'شجّع الطفل على العدّ بصوت واضح.', en: 'Celebrate each careful count with a high-five!' },
    ],
  },
  {
    key: 'team-memory-coop',
    emoji: '🧠',
    durationMinutes: 7,
    title: { ar: 'لعبة الذاكرة الثنائية', en: 'Parent-Child Memory Co-Op' },
    objective: { ar: 'تقوية الذاكرة العاملة والتعاون دون تنافس محبط', en: 'Strengthen working memory through calm teamwork' },
    parentGuide: { ar: 'ضعا ٤ أشياء صغيرة على صينية، اتركا الطفل ينظر ١٠ ثوانٍ ثم أخفيا واحداً فقط ليخمنه.', en: 'Place 4 small toys on a tray, look for 10 seconds, then hide one for your child to guess.' },
    coPlayPrompt: { ar: 'تعاونا في تذكّر ترتيب ٣ كلمات جديدة قلتموها الآن!', en: 'Team challenge: Repeat 3 fun words you chose in the same order!' },
    steps: [
      { ar: 'اختارا ٣ أو ٤ أغراض مألوفة.', en: 'Pick 3 or 4 familiar household objects.' },
      { ar: 'تأملاها معاً ثم غطّيا أحدها.', en: 'Observe together, then cover one item.' },
      { ar: 'اكتشفا الغرض المفقود بالتعاون.', en: 'Guess the missing item as a team!' },
    ],
  },
  {
    key: 'kitchen-science-sink',
    emoji: '🧪',
    durationMinutes: 12,
    title: { ar: 'تجربة يطفو أم يغوص في المنزل', en: 'Home Sink-or-Float Science Discovery' },
    objective: { ar: 'تنمية الملاحظة والتنبؤ العلمي', en: 'Build scientific observation and prediction' },
    parentGuide: { ar: 'اسأل الطفل قبل وضع كل غرض في وعاء الماء: هل تتوقع أن يطفو أم يغوص؟ ولماذا؟', en: 'Ask your child to predict before placing each item in a bowl of water: Float or sink?' },
    coPlayPrompt: { ar: 'جرّبا ملعقة خشبية مقابل مفتاح أو عملة معدنية!', en: 'Compare a wooden spoon vs. a metal spoon!' },
    steps: [
      { ar: 'جهّزا وعاء ماء صغير بمشاركة الوالد.', en: 'Prepare a safe small bowl of water together.' },
      { ar: 'توقّعا النتيجة قبل التجربة.', en: 'Make a prediction before testing.' },
      { ar: 'قارنا التوقع بالنتيجة الفعلية.', en: 'Compare your prediction with what happened!' },
    ],
  },
  {
    key: 'everyday-english-walk',
    emoji: '🗣️',
    durationMinutes: 8,
    title: { ar: 'كلمات إنجليزية في يومنا', en: 'Everyday English Dialogue Moment' },
    objective: { ar: 'ربط اللغة الإنجليزية بمواقف الحياة اليومية بلطف', en: 'Connect friendly English phrases to daily routines' },
    parentGuide: { ar: 'استخدما ٣ كلمات بسيطة أثناء النشاط: Please, Thank you, Water, Sun.', en: 'Practice 3 warm everyday words together: Please, Thank you, Good job!' },
    coPlayPrompt: { ar: 'قولا معاً: "Good morning! Let us learn and smile!"', en: 'Say together: "Good morning! Let us learn and smile!"' },
    steps: [
      { ar: 'تحدثا عن الطقس اليوم بالإنجليزية.', en: 'Describe today’s weather in 1 short sentence.' },
      { ar: 'تبادلا كلمة تشجيع إنجليزية.', en: 'Share one encouraging English phrase.' },
    ],
  },
];

export const FamilyActivitiesScreen: React.FC = () => {
  const { activeChild, language, completeFamilyActivity } = useNonoLand();
  const [selectedKey, setSelectedKey] = useState(FAMILY_ACTIVITIES[0].key);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const activeDef = FAMILY_ACTIVITIES.find((a) => a.key === selectedKey) || FAMILY_ACTIVITIES[0];
  const history = activeChild.familyActivitiesCompleted || [];

  const handleLogFamilyActivity = async () => {
    setSaving(true);
    setNotice('');
    try {
      const res = await completeFamilyActivity({
        activityKey: activeDef.key,
        title: activeDef.title,
        durationMinutes: activeDef.durationMinutes,
        reflectionNote: reflection.trim() || undefined,
      });
      setReflection('');
      setCheckedSteps({});
      setNotice(
        language === 'ar'
          ? `لحظة عائلية رائعة! تم تسجيل النشاط في يوميات ${activeChild.displayName} (+${res.starsAdded} نجوم) ❤️`
          : `Wonderful family moment! Logged to ${activeChild.displayName}'s timeline (+${res.starsAdded} stars) ❤️`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="nono-card p-5 sm:p-6 bg-gradient-to-r from-[#FCE7F3] via-[#FFF8E9] to-[#E5F6FF] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-extrabold text-[#EC4899]">
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'وضع المشاركة العائلية' : 'Parent-Child Co-Play Mode'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27345C]">
            {language === 'ar' ? 'أنشطة مشتركة بين الوالدين والطفل' : 'Parent-Child Shared Activities'}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[#27345C]/75">
            {language === 'ar'
              ? 'أنشطة منزلية دافئة تُثري التواصل وتُسجّل في السجل العائلي بشكل مستقل عن التقييم الأكاديمي الفردي للطفل.'
              : 'Warm guided co-play moments logged in your family journal—tracked separately so independent skill mastery stays 100% honest.'}
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-2xl bg-white border border-[#27345C]/10 text-xs font-extrabold text-[#27345C]">
          {language === 'ar' ? `الأنشطة العائلية المكتملة: ${history.length}` : `Shared Moments Logged: ${history.length}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Activity List */}
        <div className="lg:col-span-4 space-y-2.5">
          {FAMILY_ACTIVITIES.map((act) => {
            const active = selectedKey === act.key;
            const doneCount = history.filter((h) => h.activityKey === act.key).length;
            return (
              <button
                key={act.key}
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setSelectedKey(act.key);
                  setNotice('');
                  setCheckedSteps({});
                }}
                className={`w-full p-4 rounded-2xl border-2 text-start flex items-start justify-between gap-2.5 cursor-pointer transition-all ${
                  active ? 'bg-[#F3ECFF] border-[#8054D9]' : 'bg-white border-[#27345C]/12 hover:border-[#8054D9]/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl">{act.emoji}</span>
                  <div>
                    <p className="text-sm font-extrabold text-[#27345C]">{act.title[language]}</p>
                    <p className="text-[11px] font-bold text-[#27345C]/65 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        {act.durationMinutes} {language === 'ar' ? 'دقائق' : 'min'}
                      </span>
                    </p>
                  </div>
                </div>
                {doneCount > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#DCFCE7] text-[#15803D] text-[10px] font-extrabold shrink-0">
                    ✓ {doneCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Co-Play Workspace */}
        <div className="lg:col-span-8 nono-card p-6 bg-white space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-[#27345C] flex items-center gap-2">
              <span className="text-2xl">{activeDef.emoji}</span>
              <span>{activeDef.title[language]}</span>
            </h2>
            <span className="px-3 py-1 rounded-xl bg-[#FFF8E9] text-xs font-extrabold text-[#B45309] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {activeDef.durationMinutes} {language === 'ar' ? 'دقيقة' : 'min'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#E5F6FF]/70 space-y-1">
              <p className="text-xs font-extrabold text-[#0369A1]">
                {language === 'ar' ? 'الهدف التربوي:' : 'Learning Objective:'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-[#27345C]">{activeDef.objective[language]}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F3ECFF]/70 space-y-1">
              <p className="text-xs font-extrabold text-[#6D28D9]">
                {language === 'ar' ? 'إرشاد ولي الأمر:' : 'Parent Guidance:'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-[#27345C]">{activeDef.parentGuide[language]}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8E9] border border-[#FFD84D] space-y-1">
            <p className="text-xs font-extrabold text-[#B45309] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'حوار اللعب التفاعلي معاً:' : 'Co-Play Conversation Spark:'}</span>
            </p>
            <p className="text-sm font-extrabold text-[#27345C]">{activeDef.coPlayPrompt[language]}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-extrabold text-[#27345C]/70">
              {language === 'ar' ? 'خطوات التنفيذ معاً:' : 'Interactive Co-Play Checklist:'}
            </p>
            {activeDef.steps.map((st, idx) => {
              const key = `${activeDef.key}-${idx}`;
              const checked = Boolean(checkedSteps[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    setCheckedSteps((prev) => ({ ...prev, [key]: !checked }));
                  }}
                  className={`w-full p-3 rounded-xl border text-start text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer ${
                    checked ? 'bg-[#DCFCE7] border-[#22C55E] text-[#14532D]' : 'bg-[#F8FAFC] border-[#27345C]/10 text-[#27345C]'
                  }`}
                >
                  <span>{st[language]}</span>
                  {checked && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-2 border-t border-[#27345C]/10">
            <input
              type="text"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              maxLength={180}
              placeholder={
                language === 'ar'
                  ? 'ملاحظة قصيرة من الوالد (اختياري): ماذا أعجب طفلك؟'
                  : 'Optional parent note: What did your child enjoy most?'
              }
              className="w-full min-h-[44px] px-4 rounded-xl border border-[#27345C]/20 text-xs font-bold"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleLogFamilyActivity()}
              className="min-h-[46px] px-6 rounded-2xl bg-[#EC4899] text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>
                {saving
                  ? language === 'ar' ? 'جارٍ التسجيل...' : 'Saving...'
                  : language === 'ar' ? 'تسجيل إنجاز النشاط العائلي ❤️' : 'Log Shared Family Moment ❤️'}
              </span>
            </button>
            {notice && <p className="text-xs sm:text-sm font-extrabold text-[#16A34A]">{notice}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
