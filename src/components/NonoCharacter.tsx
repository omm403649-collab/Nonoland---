import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Language, NonoMood } from '../types/nonoland';
import { soundEngine } from '../utils/soundEngine';

interface NonoCharacterProps {
  mood?: NonoMood;
  scarfColor?: string;
  size?: 'sm' | 'md' | 'lg';
  speechBubble?: string;
  language?: Language;
  onTap?: () => void;
  interactive?: boolean;
}

export const NonoCharacter: React.FC<NonoCharacterProps> = ({
  mood = 'idle',
  scarfColor = '#8054D9',
  size = 'md',
  speechBubble,
  language = 'ar',
  onTap,
  interactive = true,
}) => {
  const [tapBurst, setTapBurst] = useState(false);

  const dims =
    size === 'sm' ? 'w-20 h-20' : size === 'lg' ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-28 h-28';

  const handleInteract = () => {
    if (!interactive) return;
    soundEngine.playPop();
    setTapBurst(true);
    setTimeout(() => setTapBurst(false), 600);
    if (speechBubble) {
      soundEngine.speak(speechBubble, language);
    }
    onTap?.();
  };

  const animateProps =
    mood === 'jumping' || mood === 'celebrating' || tapBurst
      ? { y: [0, -14, 0, -8, 0], rotate: [0, -4, 4, 0] }
      : mood === 'dancing'
        ? { rotate: [-4, 4, -4], y: [0, -6, 0] }
        : mood === 'sleeping'
          ? { scale: [1, 1.02, 1] }
          : { y: [0, -5, 0] };

  return (
    <div className="inline-flex flex-col items-center gap-2 select-none">
      {speechBubble && (
        <motion.button
          type="button"
          onClick={handleInteract}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xs sm:max-w-sm bg-white/95 text-[#27345C] px-4 py-2.5 rounded-2xl border-2 border-[#8054D9]/20 shadow-md text-sm sm:text-base font-semibold flex items-center gap-2 text-start hover:border-[#8054D9] transition-colors cursor-pointer"
        >
          <Volume2 className="w-4 h-4 shrink-0 text-[#8054D9]" />
          <span>{speechBubble}</span>
        </motion.button>
      )}

      <motion.button
        type="button"
        onClick={handleInteract}
        aria-label="Nono companion"
        animate={animateProps}
        transition={{
          duration: mood === 'celebrating' || tapBurst ? 0.65 : 3.2,
          repeat: mood === 'celebrating' || tapBurst ? 1 : Infinity,
          ease: 'easeInOut',
        }}
        whileHover={interactive ? { scale: 1.06 } : undefined}
        whileTap={interactive ? { scale: 0.94 } : undefined}
        className={`relative ${dims} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD84D] rounded-full ${
          interactive ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {/* Subtle magical aura */}
        <div
          className="absolute inset-1 rounded-full opacity-35 blur-md"
          style={{ backgroundColor: scarfColor }}
        />

        <svg viewBox="0 0 160 160" className="relative w-full h-full drop-shadow-md">
          {/* Tail */}
          <motion.path
            d="M114 118 C144 118, 152 86, 134 74 C122 66, 114 90, 108 106 Z"
            fill="#FF9360"
            stroke="#27345C"
            strokeWidth="3"
            animate={{ rotate: mood === 'excited' || mood === 'celebrating' ? [-6, 8, -6] : [-2, 3, -2] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ transformOrigin: '110px 110px' }}
          />
          <path d="M134 74 C144 82, 142 96, 132 100 C128 92, 128 80, 134 74 Z" fill="#FFF8E9" />

          {/* Left & Right Ears */}
          <path d="M36 58 L28 18 L62 38 Z" fill="#FF9360" stroke="#27345C" strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M38 50 L34 26 L54 40 Z" fill="#FFD84D" opacity="0.7" />
          <path d="M124 58 L132 18 L98 38 Z" fill="#FF9360" stroke="#27345C" strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M122 50 L126 26 L106 40 Z" fill="#FFD84D" opacity="0.7" />

          {/* Body */}
          <ellipse cx="80" cy="116" rx="34" ry="28" fill="#FF9360" stroke="#27345C" strokeWidth="3.2" />
          <ellipse cx="80" cy="119" rx="20" ry="20" fill="#FFF8E9" />

          {/* Head */}
          <ellipse cx="80" cy="68" rx="44" ry="38" fill="#FF9360" stroke="#27345C" strokeWidth="3.2" />
          {/* Cream Cheeks */}
          <path
            d="M40 72 C46 58, 66 64, 80 78 C94 64, 114 58, 120 72 C122 92, 102 104, 80 104 C58 104, 38 92, 40 72 Z"
            fill="#FFF8E9"
          />

          {/* Forehead Star */}
          <polygon
            points="80,38 83,44 89,45 84,49 86,55 80,52 74,55 76,49 71,45 77,44"
            fill="#FFD84D"
          />

          {/* Eyes based on mood */}
          {mood === 'sleeping' ? (
            <>
              <path d="M55 66 Q63 72 71 66" fill="none" stroke="#27345C" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M89 66 Q97 72 105 66" fill="none" stroke="#27345C" strokeWidth="3.2" strokeLinecap="round" />
            </>
          ) : mood === 'celebrating' || mood === 'excited' ? (
            <>
              <path d="M55 68 Q63 58 71 68" fill="none" stroke="#27345C" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M89 68 Q97 58 105 68" fill="none" stroke="#27345C" strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="62" cy="66" r="7.5" fill="#27345C" />
              <circle cx="64.5" cy="63.5" r="2.6" fill="#FFFFFF" />
              <circle cx="98" cy="66" r="7.5" fill="#27345C" />
              <circle cx="100.5" cy="63.5" r="2.6" fill="#FFFFFF" />
            </>
          )}

          {/* Rosy cheeks */}
          <ellipse cx="49" cy="78" rx="6" ry="3.5" fill="#FF78B7" opacity="0.55" />
          <ellipse cx="111" cy="78" rx="6" ry="3.5" fill="#FF78B7" opacity="0.55" />

          {/* Nose & Mouth */}
          <ellipse cx="80" cy="77" rx="4.5" ry="3.2" fill="#27345C" />
          {mood === 'thinking' ? (
            <path d="M74 87 Q80 85 86 88" fill="none" stroke="#27345C" strokeWidth="2.8" strokeLinecap="round" />
          ) : mood === 'surprised' ? (
            <circle cx="80" cy="87" r="4" fill="#27345C" />
          ) : (
            <path d="M71 84 Q80 93 89 84" fill="none" stroke="#27345C" strokeWidth="2.8" strokeLinecap="round" />
          )}

          {/* Explorer Scarf */}
          <path
            d="M47 96 Q80 112 113 96 L108 111 Q80 124 52 111 Z"
            fill={scarfColor}
            stroke="#27345C"
            strokeWidth="2.8"
          />
          {/* Scarf Tails */}
          <path d="M92 108 L104 134 L90 132 L84 112 Z" fill={scarfColor} stroke="#27345C" strokeWidth="2.5" />
          {/* Golden Star Clasp */}
          <circle cx="80" cy="108" r="7" fill="#FFD84D" stroke="#27345C" strokeWidth="2.2" />

          {/* Waving Paw */}
          <motion.g
            animate={
              mood === 'waving' || mood === 'celebrating' || tapBurst
                ? { rotate: [-14, 18, -14] }
                : { rotate: [-2, 4, -2] }
            }
            transition={{ duration: mood === 'waving' ? 0.6 : 2.5, repeat: Infinity }}
            style={{ transformOrigin: '48px 110px' }}
          >
            <ellipse cx="36" cy="100" rx="11" ry="8" fill="#FF9360" stroke="#27345C" strokeWidth="2.8" />
          </motion.g>
          <ellipse cx="114" cy="116" rx="10" ry="8" fill="#FF9360" stroke="#27345C" strokeWidth="2.8" />
        </svg>
      </motion.button>
    </div>
  );
};
