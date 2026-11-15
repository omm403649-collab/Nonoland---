import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Play, Sparkles, Star } from 'lucide-react';
import mapPanoramaImg from '../assets/images/adventure_map_panorama_1794739848578.jpg';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { GAME_ACTIVITIES, getActivitiesForWorldAndAge } from '../data/activities';
import { getWorldById, LEARNING_WORLDS } from '../data/worlds';
import { AGE_GROUP_META, formatNumber, t, UI_COPY } from '../i18n/translations';
import { soundEngine } from '../utils/soundEngine';

export const AdventureMapScreen: React.FC = () => {
  const { activeChild, language, navigate } = useNonoLand();
  const [hoveredWorldId, setHoveredWorldId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27345C] flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-[#8054D9]" />
            <span>{t(UI_COPY.nav.map, language)}</span>
          </h1>
          <p className="text-sm text-[#27345C]/75 mt-0.5">
            {language === 'ar'
              ? 'اختر أي جزيرة لتستكشف مغامراتها المخصصة لعمرك!'
              : 'Tap any floating island to explore adventures tailored to your age!'}
          </p>
        </div>

        <span className="text-xs sm:text-sm font-bold text-[#8054D9]">
          {t(AGE_GROUP_META[activeChild.ageGroup].label, language)} ·{' '}
          {formatNumber(LEARNING_WORLDS.length, language)} {language === 'ar' ? 'عوالم' : 'Worlds'}
        </span>
      </div>

      {/* Panoramic Animated Archipelago Canvas */}
      <div className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-[#A3E4FF]">
        <div className="relative aspect-[16/9] min-h-[340px] w-full">
          <img
            src={mapPanoramaImg}
            alt={language === 'ar' ? 'خريطة عوالم نونو لاند العشرة' : 'NonoLand 10 Worlds Map'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />

          {/* Animated floating environmental details */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-6 start-8 text-2xl animate-drift-cloud opacity-85">☁️</div>
            <div className="absolute top-12 end-16 text-2xl animate-drift-cloud opacity-80" style={{ animationDelay: '-5s' }}>☁️</div>
            <div className="absolute bottom-8 start-1/3 text-xl animate-gentle-bob">⛵</div>
            <div className="absolute top-1/4 start-1/2 text-lg animate-twinkle">✨</div>
          </div>

          {/* Interactive World Markers */}
          {LEARNING_WORLDS.map((world, idx) => {
            const worldActs = getActivitiesForWorldAndAge(world.id, activeChild.ageGroup);
            const completedCount = worldActs.filter((a) =>
              activeChild.completedActivityIds.includes(a.id),
            ).length;
            const isHovered = hoveredWorldId === world.id;

            return (
              <motion.button
                key={world.id}
                type="button"
                onClick={() => {
                  soundEngine.speak(t(world.name, language), language);
                  navigate('world-detail', { worldId: world.id });
                }}
                onMouseEnter={() => setHoveredWorldId(world.id)}
                onMouseLeave={() => setHoveredWorldId(null)}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
                transition={{
                  y: { duration: 3 + (idx % 3), repeat: Infinity, ease: 'easeInOut' },
                  opacity: { duration: 0.3, delay: idx * 0.04 },
                }}
                style={{
                  left: `${world.mapPosition.x}%`,
                  top: `${world.mapPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-10 group cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD84D] rounded-2xl"
              >
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/95 border-2 shadow-lg transition-transform ${
                    isHovered ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                  style={{ borderColor: world.primaryColor }}
                >
                  <span className="text-lg sm:text-xl leading-none">{world.guardianEmoji}</span>
                  <span className="hidden md:inline text-xs font-extrabold text-[#27345C] whitespace-nowrap">
                    {t(world.name, language)}
                  </span>
                  {completedCount > 0 && (
                    <span className="text-[10px] font-extrabold text-[#55D98B] tabular-nums">
                      ✓{completedCount}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Accessible 10-World Grid Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {LEARNING_WORLDS.map((world) => {
          const ageActs = getActivitiesForWorldAndAge(world.id, activeChild.ageGroup);
          const allWorldActs = GAME_ACTIVITIES.filter((a) => a.worldId === world.id);
          const completed = allWorldActs.filter((a) =>
            activeChild.completedActivityIds.includes(a.id),
          ).length;

          return (
            <button
              key={world.id}
              type="button"
              onClick={() => navigate('world-detail', { worldId: world.id })}
              className={`nono-card rounded-3xl p-4 text-start bg-gradient-to-br ${world.bgGradient} hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white shadow-sm border"
                    style={{ borderColor: `${world.primaryColor}40` }}
                  >
                    {world.guardianEmoji}
                  </span>
                  <span className="text-xs font-extrabold text-[#27345C]/70 tabular-nums">
                    {completed}/{allWorldActs.length}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#27345C] mt-3">
                  {t(world.name, language)}
                </h3>
                <p className="text-xs text-[#27345C]/70 mt-1 line-clamp-2">
                  {t(world.subtitle, language)}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#27345C]/10 flex items-center justify-between text-xs font-bold">
                <span style={{ color: world.primaryColor }}>
                  {ageActs.length} {language === 'ar' ? 'أنشطة لعمرك' : 'for your age'}
                </span>
                <span className="text-[#27345C]">→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const WorldDetailScreen: React.FC = () => {
  const { selectedWorldId, activeChild, language, navigate } = useNonoLand();
  const world = getWorldById(selectedWorldId);
  const ageActivities = getActivitiesForWorldAndAge(world.id, activeChild.ageGroup);
  const otherAgeActivities = GAME_ACTIVITIES.filter(
    (a) => a.worldId === world.id && !a.ageEligibility.includes(activeChild.ageGroup),
  );
  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('map')}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#27345C]/80 hover:text-[#27345C] cursor-pointer"
      >
        <BackIcon className="w-4 h-4" />
        <span>{language === 'ar' ? 'العودة لخريطة العوالم' : 'Back to Adventure Map'}</span>
      </button>

      {/* World Hero Banner */}
      <section
        className={`rounded-[2rem] p-6 sm:p-8 border-2 border-white shadow-lg bg-gradient-to-br ${world.bgGradient}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold" style={{ color: world.primaryColor }}>
              <span>{world.guardianEmoji} {t(world.guardianName, language)}</span>
              <span>·</span>
              <span>{t(AGE_GROUP_META[activeChild.ageGroup].label, language)}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#27345C]">
              {t(world.name, language)}
            </h1>
            <p className="text-[#27345C]/80 text-base leading-relaxed">
              {t(world.description, language)}
            </p>
          </div>
          <div className="md:col-span-4 flex justify-center">
            <NonoCharacter
              mood="excited"
              scarfColor={world.primaryColor}
              size="md"
              speechBubble={
                language === 'ar'
                  ? `أهلاً بك في ${world.name.ar}!`
                  : `Welcome to ${world.name.en}!`
              }
              language={language}
            />
          </div>
        </div>
      </section>

      {/* Age-Tailored Levels & Activities */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#27345C] flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: world.primaryColor }} />
          <span>
            {language === 'ar'
              ? `مهام ومستويات مناسبة لعمر ${t(AGE_GROUP_META[activeChild.ageGroup].label, language)}`
              : `Missions Tailored for Ages ${t(AGE_GROUP_META[activeChild.ageGroup].label, language)}`}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ageActivities.map((act) => {
            const done = activeChild.completedActivityIds.includes(act.id);
            return (
              <div
                key={act.id}
                className="nono-card rounded-3xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span style={{ color: world.primaryColor }}>
                      {t(UI_COPY.home.levelLabel, language)} {formatNumber(act.level, language)} ·{' '}
                      {t(UI_COPY.games.ageTailored, language)}
                    </span>
                    {done && (
                      <span className="inline-flex items-center gap-1 text-[#55D98B] font-extrabold">
                        <CheckCircle2 className="w-4 h-4" />
                        {t(UI_COPY.games.completedBadge, language)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#27345C]">{t(act.title, language)}</h3>
                  <p className="text-sm text-[#27345C]/75">{t(act.objective, language)}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#27345C]/10">
                  <span className="text-xs font-bold text-[#27345C]/65 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#FFD84D] text-[#FF9360]" />
                    +{done ? 1 : 3} {t(UI_COPY.home.starsLabel, language)}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('game', { worldId: world.id, activityId: act.id })}
                    className="nono-btn-tactile px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: world.primaryColor }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{t(UI_COPY.games.playNow, language)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Other Age Levels in This World (Explore Freely) */}
      {otherAgeActivities.length > 0 && (
        <section className="space-y-3 pt-2">
          <h3 className="text-lg font-extrabold text-[#27345C]/80">
            {language === 'ar'
              ? 'مستويات أخرى في هذه الجزيرة (للاستكشاف الحر)'
              : 'More Adventures on This Island (All-Age Exploration)'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherAgeActivities.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => navigate('game', { worldId: world.id, activityId: act.id })}
                className="nono-card rounded-2xl p-4 text-start hover:border-[#8054D9] transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-[11px] font-bold text-[#27345C]/60">
                    {act.ageEligibility.join(', ')} {language === 'ar' ? 'سنوات' : 'yrs'}
                  </p>
                  <p className="font-bold text-sm text-[#27345C] mt-0.5">{t(act.title, language)}</p>
                </div>
                <Play className="w-4 h-4 text-[#8054D9] shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
