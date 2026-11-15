import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Sparkles, Star, Volume2 } from 'lucide-react';
import storyForestImg from '../assets/images/story_enchanted_forest_1794739849090.jpg';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { INTERACTIVE_STORIES } from '../data/stories';
import { getWorldById } from '../data/worlds';
import { t, UI_COPY } from '../i18n/translations';
import { soundEngine } from '../utils/soundEngine';

export const StoriesScreen: React.FC = () => {
  const { activeChild, language, navigate } = useNonoLand();

  return (
    <div className="space-y-6">
      <div className="relative rounded-[2rem] overflow-hidden border-2 border-white shadow-lg">
        <img
          src={storyForestImg}
          alt={t(UI_COPY.nav.stories, language)}
          referrerPolicy="no-referrer"
          className="w-full h-48 sm:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#27345C]/85 via-[#27345C]/30 to-transparent flex items-end p-6 sm:p-8">
          <div className="text-white">
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-[#FFD84D]" />
              <span>{t(UI_COPY.nav.stories, language)}</span>
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-1">
              {language === 'ar'
                ? 'قصص تفاعلية تغيّر مسارها باختياراتك — مع قراءة صوتية ومغامرات لكل عمر!'
                : 'Interactive stories where your decisions shape the next scene!'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {INTERACTIVE_STORIES.map((story) => {
          const isAgeFit = story.ageEligibility.includes(activeChild.ageGroup);
          const completed = activeChild.completedStoryIds.includes(story.id);
          const world = getWorldById(story.worldId);

          return (
            <div key={story.id} className="nono-card rounded-3xl p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{story.coverEmoji}</span>
                  {completed && (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#55D98B]">
                      <CheckCircle2 className="w-4 h-4" />
                      {language === 'ar' ? 'مقروءة' : 'Read'}
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold" style={{ color: story.accentColor }}>
                  {t(world.name, language)} ·{' '}
                  {isAgeFit
                    ? language === 'ar'
                      ? 'مناسبة لعمرك'
                      : 'Great for your age'
                    : `${story.ageEligibility.join(', ')} ${language === 'ar' ? 'سنوات' : 'yrs'}`}
                </p>

                <h2 className="text-xl font-extrabold text-[#27345C]">{t(story.title, language)}</h2>
                <p className="text-sm text-[#27345C]/75 leading-relaxed">{t(story.summary, language)}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('story-reader', { storyId: story.id })}
                className="nono-btn-tactile w-full py-3 rounded-2xl text-white font-bold cursor-pointer"
                style={{ backgroundColor: story.accentColor }}
              >
                {language === 'ar' ? 'افتح القصة' : 'Read & Choose'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const StoryReaderScreen: React.FC = () => {
  const { selectedStoryId, activeChild, language, navigate, completeStory } = useNonoLand();
  const story = INTERACTIVE_STORIES.find((s) => s.id === selectedStoryId) || INTERACTIVE_STORIES[0];
  const [sceneId, setSceneId] = useState(story.startSceneId);
  const [rewarded, setRewarded] = useState(false);

  const scene = story.scenes[sceneId] || story.scenes[story.startSceneId];
  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    setSceneId(story.startSceneId);
    setRewarded(false);
  }, [story.id]);

  useEffect(() => {
    soundEngine.speak(t(scene.text, language), language);
    if (scene.isEnding && !rewarded) {
      setRewarded(true);
      completeStory(story.id, scene.rewardStars || 4);
    }
  }, [sceneId]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        type="button"
        onClick={() => navigate('stories')}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#27345C]/80 hover:text-[#27345C] cursor-pointer"
      >
        <BackIcon className="w-4 h-4" />
        <span>{language === 'ar' ? 'العودة إلى القصص' : 'Back to Stories'}</span>
      </button>

      <motion.div
        key={scene.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[2rem] p-6 sm:p-8 border-2 border-white shadow-xl bg-gradient-to-br ${scene.bgMood} space-y-6`}
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#27345C]">
            {t(story.title, language)}
          </h1>
          <button
            type="button"
            onClick={() => soundEngine.speak(t(scene.text, language), language)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#27345C]/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#8054D9]" />
            <span>{language === 'ar' ? 'اسمع القصة' : 'Read Aloud'}</span>
          </button>
        </div>

        {/* Scene Illustration Theater */}
        <div className="rounded-3xl bg-white/80 p-8 text-center border border-[#27345C]/10 shadow-inner">
          <div className="text-6xl sm:text-7xl tracking-widest animate-float-slow">
            {scene.illustrationEmoji}
          </div>
        </div>

        <p className="text-lg sm:text-xl font-bold text-[#27345C] leading-relaxed">
          {t(scene.text, language)}
        </p>

        <div className="flex items-center gap-4 bg-white/75 rounded-2xl p-4">
          <NonoCharacter
            mood={scene.isEnding ? 'celebrating' : 'excited'}
            scarfColor={activeChild.companionScarfColor}
            size="sm"
            language={language}
          />
          <p className="font-bold text-sm sm:text-base text-[#8054D9]">
            {t(scene.nonoLine, language)}
          </p>
        </div>

        {/* Branching Decisions OR Ending Rewards */}
        {scene.choices && scene.choices.length > 0 ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-extrabold text-[#27345C]/70">
              {language === 'ar' ? 'اختر ماذا سيحدث الآن:' : 'Choose what happens next:'}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {scene.choices.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    setSceneId(ch.nextSceneId);
                  }}
                  className="nono-btn-tactile p-4 rounded-2xl bg-white border-2 border-[#8054D9]/30 hover:border-[#8054D9] text-start font-extrabold text-[#27345C] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{t(ch.label, language)}</span>
                  <Sparkles className="w-4 h-4 text-[#8054D9] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#55D98B]/25 border-2 border-[#55D98B] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-extrabold text-[#27345C]">
              <Star className="w-6 h-6 fill-[#FFD84D] text-[#FF9360]" />
              <span>
                {language === 'ar'
                  ? `أحسنت! أنهيت القصة وحصلت على +${scene.rewardStars || 4} نجوم!`
                  : `Story Complete! You earned +${scene.rewardStars || 4} stars!`}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRewarded(false);
                  setSceneId(story.startSceneId);
                }}
                className="px-4 py-2 rounded-xl bg-white font-bold text-sm cursor-pointer"
              >
                {language === 'ar' ? 'جرّب مساراً آخر' : 'Try Another Path'}
              </button>
              <button
                type="button"
                onClick={() => navigate('stories')}
                className="nono-btn-tactile px-5 py-2 rounded-xl bg-[#8054D9] text-white font-bold text-sm cursor-pointer"
              >
                {language === 'ar' ? 'المزيد من القصص' : 'More Stories'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
