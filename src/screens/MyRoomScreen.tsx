import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Palette, Plus, Sparkles, Trash2 } from 'lucide-react';
import { NonoCharacter } from '../components/NonoCharacter';
import { useNonoLand } from '../context/NonoLandContext';
import { ROOM_ITEMS } from '../data/rewardsAndRoom';
import { t, UI_COPY } from '../i18n/translations';
import { soundEngine } from '../utils/soundEngine';

export const MyRoomScreen: React.FC = () => {
  const {
    activeChild,
    language,
    navigate,
    placeRoomItem,
    moveRoomItem,
    removePlacedRoomItem,
  } = useNonoLand();

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [roomTheme, setRoomTheme] = useState<'sunny' | 'starry' | 'garden'>('sunny');

  const themeBg =
    roomTheme === 'starry'
      ? 'from-[#27345C] via-[#45367A] to-[#6549B0] text-white'
      : roomTheme === 'garden'
        ? 'from-[#D8F9E6] via-[#FFF8E9] to-[#E6F7FF]'
        : 'from-[#FFF3D1] via-[#FFF8E9] to-[#FFE7F2]';

  const handleStageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedInstanceId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(88, Math.max(12, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(84, Math.max(18, ((e.clientY - rect.top) / rect.height) * 100));
    moveRoomItem(selectedInstanceId, Math.round(x), Math.round(y));
    setSelectedInstanceId(null);
    soundEngine.playPop();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27345C] flex items-center gap-2">
            <Palette className="w-7 h-7 text-[#FF78B7]" />
            <span>
              {language === 'ar'
                ? `غرفة ${activeChild.displayName} السحرية`
                : `${activeChild.displayName}'s Magical Room`}
            </span>
          </h1>
          <p className="text-sm text-[#27345C]/75">
            {language === 'ar'
              ? 'اضغط على أي عنصر لتشاهد تفاعله، أو اختر عنصراً لتحريكه في الغرفة!'
              : 'Tap any object to play with it, or click Move to rearrange your room!'}
          </p>
        </div>

        {/* Room Theme Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#27345C]/12">
          {[
            { id: 'sunny' as const, ar: 'صباح مشمس', en: 'Sunny' },
            { id: 'garden' as const, ar: 'حديقة', en: 'Garden' },
            { id: 'starry' as const, ar: 'سماء النجوم', en: 'Starry' },
          ].map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => {
                soundEngine.playPop();
                setRoomTheme(th.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                roomTheme === th.id ? 'bg-[#8054D9] text-white' : 'text-[#27345C]/70'
              }`}
            >
              {language === 'ar' ? th.ar : th.en}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Room Stage */}
      <div
        onClick={handleStageTap}
        className={`relative h-[380px] sm:h-[430px] rounded-[2rem] border-4 border-white shadow-xl bg-gradient-to-b ${themeBg} overflow-hidden select-none ${
          selectedInstanceId ? 'cursor-crosshair' : ''
        }`}
      >
        {/* Cozy Window & Floor */}
        <div className="absolute top-6 start-8 w-24 h-24 rounded-2xl bg-[#39BDF2]/30 border-4 border-white/80 flex items-center justify-center text-3xl">
          {roomTheme === 'starry' ? '🌙' : '☀️'}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[#FFD84D]/25 border-t-2 border-white/40" />

        {/* Nono inside the room */}
        <div className="absolute bottom-6 start-1/2 -translate-x-1/2 z-10">
          <NonoCharacter
            mood="dancing"
            scarfColor={activeChild.companionScarfColor}
            size="md"
            language={language}
          />
        </div>

        {/* Placed Interactive Items */}
        {activeChild.placedRoomItems.map((placed) => {
          const item = ROOM_ITEMS.find((r) => r.id === placed.itemId);
          if (!item) return null;
          const isSelected = selectedInstanceId === placed.instanceId;
          const isBouncing = bouncingId === placed.instanceId;

          return (
            <motion.div
              key={placed.instanceId}
              style={{ left: `${placed.x}%`, top: `${placed.y}%` }}
              animate={isBouncing ? { y: [0, -18, 0], rotate: [-8, 8, 0] } : undefined}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playSuccess();
                  setBouncingId(placed.instanceId);
                  setTimeout(() => setBouncingId(null), 650);
                  soundEngine.speak(t(item.name, language), language);
                }}
                className={`text-5xl sm:text-6xl drop-shadow-md cursor-pointer transition-transform hover:scale-110 rounded-2xl p-1 ${
                  isSelected ? 'ring-4 ring-[#8054D9] bg-white/40' : ''
                }`}
                title={t(item.name, language)}
              >
                {item.emoji}
              </button>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInstanceId(isSelected ? null : placed.instanceId);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white/95 text-[#27345C] text-[10px] font-extrabold shadow cursor-pointer"
                >
                  {isSelected
                    ? language === 'ar'
                      ? 'اضغط مكاناً'
                      : 'Tap spot'
                    : language === 'ar'
                      ? 'تحريك'
                      : 'Move'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlacedRoomItem(placed.instanceId);
                  }}
                  aria-label="Remove item"
                  className="p-1 rounded-lg bg-white/95 text-[#FF4D6D] shadow cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {selectedInstanceId && (
          <div className="absolute top-4 end-4 z-30 px-4 py-2 rounded-2xl bg-[#8054D9] text-white text-xs font-extrabold shadow-lg">
            {language === 'ar'
              ? 'اضغط في أي مكان بالغرفة لنقل العنصر إليه!'
              : 'Tap anywhere in the room to move this item!'}
          </div>
        )}
      </div>

      {/* Earned Items Drawer (Unlocked through educational achievements — zero child monetization!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 nono-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#27345C]">
              {language === 'ar' ? 'عناصر غرفتك (تُفتح بالإنجازات)' : 'Room Treasures (Earned by Learning)'}
            </h2>
            <Sparkles className="w-5 h-5 text-[#FFD84D]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROOM_ITEMS.map((item) => {
              const unlocked = activeChild.unlockedRoomItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => unlocked && placeRoomItem(item.id)}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                    unlocked
                      ? 'bg-[#FFF8E9] border-[#27345C]/10 hover:border-[#8054D9] cursor-pointer'
                      : 'bg-slate-100 border-slate-200 opacity-65 cursor-not-allowed'
                  }`}
                >
                  <div className="text-3xl mb-1">{item.emoji}</div>
                  <p className="text-xs font-extrabold text-[#27345C]">{t(item.name, language)}</p>
                  <p className="text-[10px] font-semibold text-[#27345C]/65 mt-1">
                    {unlocked ? (
                      <span className="inline-flex items-center gap-0.5 text-[#55D98B] font-extrabold">
                        <Plus className="w-3 h-3" /> {language === 'ar' ? 'أضف للغرفة' : 'Place'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> {t(item.unlockHint, language)}
                      </span>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saved Drawings Gallery on the Room Wall */}
        <div className="lg:col-span-5 nono-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#27345C]">
              {language === 'ar' ? 'معرض لوحاتي' : 'My Wall Art Gallery'}
            </h2>
            <button
              type="button"
              onClick={() =>
                navigate('game', { worldId: 'creativity-island', activityId: 'act-free-drawing-all' })
              }
              className="text-xs font-extrabold text-[#8054D9] hover:underline cursor-pointer"
            >
              {language === 'ar' ? '+ ارسم لوحة جديدة' : '+ Paint New Art'}
            </button>
          </div>

          {activeChild.savedDrawings.length === 0 ? (
            <div className="rounded-2xl bg-[#FFF8E9] p-6 text-center space-y-3">
              <p className="text-sm font-bold text-[#27345C]/70">
                {language === 'ar'
                  ? 'لم ترسم لوحات بعد! ازرع إبداعك في جزيرة الإبداع لتظهر لوحاتك هنا.'
                  : 'No drawings saved yet! Visit Creativity Island to paint and hang your art here.'}
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate('game', { worldId: 'creativity-island', activityId: 'act-free-drawing-all' })
                }
                className="nono-btn-tactile px-4 py-2 rounded-xl bg-[#FF78B7] text-white text-xs font-bold cursor-pointer"
              >
                {t(UI_COPY.games.playNow, language)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeChild.savedDrawings.map((dr) => (
                <div key={dr.id} className="rounded-2xl overflow-hidden border-2 border-[#FFD84D] bg-white shadow-sm">
                  <img src={dr.dataUrl} alt={dr.title} className="w-full h-24 object-cover" />
                  <p className="text-[11px] font-bold p-1.5 truncate text-center">{dr.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
