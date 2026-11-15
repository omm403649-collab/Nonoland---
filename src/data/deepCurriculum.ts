import { ARABIC_ALPHABET, ACADEMY_COLORS, ENGLISH_ALPHABET } from './academyData';
import {
  AgeGroupId,
  ConceptDomain,
  ExamQuestionItem,
  LocalizedText,
} from '../types/nonoland';

export interface ColorDeepJourneyData {
  colorId: string;
  hex: string;
  title: LocalizedText;
  introLine: LocalizedText;
  realWorldExamples: Array<{ emoji: string; label: LocalizedText }>;
  matchingPairs: Array<{ emoji: string; label: LocalizedText; isTarget: boolean }>;
  sortBaskets: Array<{ id: string; hex: string; label: LocalizedText }>;
  sortItems: Array<{ emoji: string; label: LocalizedText; basketId: string }>;
  coloringSubject: { emoji: string; svgShape: 'apple' | 'flower' | 'star' | 'car'; label: LocalizedText };
  discoverySceneItems: Array<{ id: string; emoji: string; label: LocalizedText; isTarget: boolean }>;
  memoryItems: Array<{ id: string; emoji: string; label: LocalizedText; isTarget: boolean }>;
  unseenAssessment: Array<{
    prompt: LocalizedText;
    options: Array<{ id: string; visual: string; label: LocalizedText; isCorrect: boolean }>;
  }>;
}

const COLOR_EXTRA_EXAMPLES: Record<
  string,
  {
    examples: Array<{ emoji: string; label: LocalizedText }>;
    unseen: Array<{ emoji: string; label: LocalizedText }>;
    distractors: Array<{ emoji: string; label: LocalizedText; basketId: string }>;
    shape: 'apple' | 'flower' | 'star' | 'car';
  }
> = {
  red: {
    examples: [
      { emoji: '🍎', label: { ar: 'تفاحة حمراء', en: 'Red Apple' } },
      { emoji: '🍓', label: { ar: 'فراولة حمراء', en: 'Red Strawberry' } },
      { emoji: '🚗', label: { ar: 'سيارة حمراء', en: 'Red Car' } },
      { emoji: '🎈', label: { ar: 'بالونة حمراء', en: 'Red Balloon' } },
      { emoji: '🌹', label: { ar: 'وردة حمراء', en: 'Red Flower' } },
      { emoji: '👕', label: { ar: 'قميص أحمر', en: 'Red Shirt' } },
      { emoji: '🚒', label: { ar: 'لعبة إطفاء حمراء', en: 'Red Toy Truck' } },
    ],
    unseen: [
      { emoji: '🍒', label: { ar: 'كرز أحمر', en: 'Red Cherry' } },
      { emoji: '🐞', label: { ar: 'دعسوقة حمراء', en: 'Red Ladybug' } },
    ],
    distractors: [
      { emoji: '🍌', label: { ar: 'موزة صفراء', en: 'Yellow Banana' }, basketId: 'yellow' },
      { emoji: '🫐', label: { ar: 'توت أزرق', en: 'Blueberry' }, basketId: 'blue' },
      { emoji: '🥦', label: { ar: 'بروكلي أخضر', en: 'Green Broccoli' }, basketId: 'green' },
    ],
    shape: 'apple',
  },
  blue: {
    examples: [
      { emoji: '🌊', label: { ar: 'موجة بحر زرقاء', en: 'Blue Ocean Wave' } },
      { emoji: '🐋', label: { ar: 'حوت أزرق', en: 'Blue Whale' } },
      { emoji: '🫐', label: { ar: 'توت أزرق', en: 'Blueberries' } },
      { emoji: '🧢', label: { ar: 'قبعة زرقاء', en: 'Blue Cap' } },
      { emoji: '🦋', label: { ar: 'فراشة زرقاء', en: 'Blue Butterfly' } },
      { emoji: '🚙', label: { ar: 'سيارة زرقاء', en: 'Blue Car' } },
      { emoji: '💎', label: { ar: 'جوهرة زرقاء', en: 'Blue Gem' } },
    ],
    unseen: [
      { emoji: '🛋️', label: { ar: 'أريكة زرقاء', en: 'Blue Sofa' } },
      { emoji: '🪁', label: { ar: 'طائرة ورقية زرقاء', en: 'Blue Kite' } },
    ],
    distractors: [
      { emoji: '🍎', label: { ar: 'تفاحة حمراء', en: 'Red Apple' }, basketId: 'red' },
      { emoji: '🍋', label: { ar: 'ليمونة صفراء', en: 'Yellow Lemon' }, basketId: 'yellow' },
      { emoji: '🐸', label: { ar: 'ضفدع أخضر', en: 'Green Frog' }, basketId: 'green' },
    ],
    shape: 'car',
  },
  yellow: {
    examples: [
      { emoji: '☀️', label: { ar: 'شمس صفراء', en: 'Yellow Sun' } },
      { emoji: '🍌', label: { ar: 'موزة صفراء', en: 'Yellow Banana' } },
      { emoji: '🍋', label: { ar: 'ليمونة صفراء', en: 'Yellow Lemon' } },
      { emoji: '🐥', label: { ar: 'كتكوت أصفر', en: 'Yellow Chick' } },
      { emoji: '⭐', label: { ar: 'نجمة صفراء', en: 'Yellow Star' } },
      { emoji: '🌻', label: { ar: 'زهرة عباد الشمس', en: 'Yellow Sunflower' } },
      { emoji: '🚕', label: { ar: 'سيارة أجرة صفراء', en: 'Yellow Taxi' } },
    ],
    unseen: [
      { emoji: '🧀', label: { ar: 'جبن أصفر', en: 'Yellow Cheese' } },
      { emoji: '🌽', label: { ar: 'ذرة صفراء', en: 'Yellow Corn' } },
    ],
    distractors: [
      { emoji: '🍓', label: { ar: 'فراولة حمراء', en: 'Red Strawberry' }, basketId: 'red' },
      { emoji: '🐋', label: { ar: 'حوت أزرق', en: 'Blue Whale' }, basketId: 'blue' },
      { emoji: '🌳', label: { ar: 'شجرة خضراء', en: 'Green Tree' }, basketId: 'green' },
    ],
    shape: 'star',
  },
  green: {
    examples: [
      { emoji: '🌳', label: { ar: 'شجرة خضراء', en: 'Green Tree' } },
      { emoji: '🐸', label: { ar: 'ضفدع أخضر', en: 'Green Frog' } },
      { emoji: '🥦', label: { ar: 'بروكلي أخضر', en: 'Green Broccoli' } },
      { emoji: '🥒', label: { ar: 'خيار أخضر', en: 'Green Cucumber' } },
      { emoji: '🐢', label: { ar: 'سلحفاة خضراء', en: 'Green Turtle' } },
      { emoji: '🍏', label: { ar: 'تفاحة خضراء', en: 'Green Apple' } },
      { emoji: '🌿', label: { ar: 'أوراق نبات خضراء', en: 'Green Leaves' } },
    ],
    unseen: [
      { emoji: '🥝', label: { ar: 'كيوي أخضر', en: 'Green Kiwi' } },
      { emoji: '🦖', label: { ar: 'ديناصور أخضر', en: 'Green Dino Toy' } },
    ],
    distractors: [
      { emoji: '🍎', label: { ar: 'تفاحة حمراء', en: 'Red Apple' }, basketId: 'red' },
      { emoji: '☀️', label: { ar: 'شمس صفراء', en: 'Yellow Sun' }, basketId: 'yellow' },
      { emoji: '🫐', label: { ar: 'توت أزرق', en: 'Blueberry' }, basketId: 'blue' },
    ],
    shape: 'flower',
  },
};

export function buildColorDeepJourney(colorId: string): ColorDeepJourneyData {
  const color = ACADEMY_COLORS.find((c) => c.id === colorId) || ACADEMY_COLORS[0];
  const preset = COLOR_EXTRA_EXAMPLES[color.id] || {
    examples: [
      { emoji: color.emojis[0] || '🎨', label: { ar: `${color.name.ar} — مثال ١`, en: `${color.name.en} Item 1` } },
      { emoji: color.emojis[1] || '🎈', label: { ar: `${color.name.ar} — مثال ٢`, en: `${color.name.en} Item 2` } },
      { emoji: '🎁', label: { ar: `هدية ${color.name.ar}`, en: `${color.name.en} Gift` } },
      { emoji: '🖍️', label: { ar: `قلم تلوين ${color.name.ar}`, en: `${color.name.en} Crayon` } },
      { emoji: '👕', label: { ar: `تيشيرت ${color.name.ar}`, en: `${color.name.en} Shirt` } },
    ],
    unseen: [
      { emoji: '🎨', label: { ar: `بقعة لون ${color.name.ar}`, en: `${color.name.en} Paint` } },
      { emoji: '🪁', label: { ar: `طائرة ${color.name.ar}`, en: `${color.name.en} Kite` } },
    ],
    distractors: [
      { emoji: '🍎', label: { ar: 'تفاحة حمراء', en: 'Red Apple' }, basketId: 'red' },
      { emoji: '🍌', label: { ar: 'موزة صفراء', en: 'Yellow Banana' }, basketId: 'yellow' },
      { emoji: '🥦', label: { ar: 'بروكلي أخضر', en: 'Green Broccoli' }, basketId: 'green' },
    ],
    shape: 'flower' as const,
  };

  const targetExamples = preset.examples;
  const distractorBasketIds = ['red', 'blue', 'yellow', 'green'].filter((id) => id !== color.id).slice(0, 2);
  const sortBaskets = [
    { id: color.id, hex: color.hex, label: color.name },
    ...distractorBasketIds.map((bid) => {
      const c = ACADEMY_COLORS.find((x) => x.id === bid)!;
      return { id: c.id, hex: c.hex, label: c.name };
    }),
  ];

  const sortItems = [
    { emoji: targetExamples[0].emoji, label: targetExamples[0].label, basketId: color.id },
    { emoji: targetExamples[1].emoji, label: targetExamples[1].label, basketId: color.id },
    ...preset.distractors.filter((d) => distractorBasketIds.includes(d.basketId)).slice(0, 2),
  ];

  return {
    colorId: color.id,
    hex: color.hex,
    title: {
      ar: `رحلة اكتشاف اللون ال${color.name.ar}`,
      en: `Discover the Color ${color.name.en}`,
    },
    introLine: {
      ar: `${color.name.en} — ${color.name.ar}! تعال لنكتشف معاً سر هذا اللون الرائع في عالمنا!`,
      en: `${color.name.en} — ${color.name.ar}! Let's discover how this wonderful color appears all around us!`,
    },
    realWorldExamples: targetExamples,
    matchingPairs: [
      { emoji: targetExamples[0].emoji, label: targetExamples[0].label, isTarget: true },
      { emoji: targetExamples[2].emoji, label: targetExamples[2].label, isTarget: true },
      { emoji: preset.distractors[0].emoji, label: preset.distractors[0].label, isTarget: false },
      { emoji: preset.distractors[1].emoji, label: preset.distractors[1].label, isTarget: false },
    ],
    sortBaskets,
    sortItems,
    coloringSubject: {
      emoji: targetExamples[0].emoji,
      svgShape: preset.shape,
      label: targetExamples[0].label,
    },
    discoverySceneItems: [
      { id: 'd1', emoji: targetExamples[0].emoji, label: targetExamples[0].label, isTarget: true },
      { id: 'd2', emoji: preset.distractors[0].emoji, label: preset.distractors[0].label, isTarget: false },
      { id: 'd3', emoji: targetExamples[1].emoji, label: targetExamples[1].label, isTarget: true },
      { id: 'd4', emoji: preset.distractors[1].emoji, label: preset.distractors[1].label, isTarget: false },
      { id: 'd5', emoji: targetExamples[3].emoji, label: targetExamples[3].label, isTarget: true },
      { id: 'd6', emoji: preset.distractors[2]?.emoji || '⚪', label: preset.distractors[2]?.label || { ar: 'سحابة', en: 'Cloud' }, isTarget: false },
    ],
    memoryItems: [
      { id: 'm1', emoji: targetExamples[1].emoji, label: targetExamples[1].label, isTarget: true },
      { id: 'm2', emoji: preset.distractors[0].emoji, label: preset.distractors[0].label, isTarget: false },
      { id: 'm3', emoji: preset.distractors[1].emoji, label: preset.distractors[1].label, isTarget: false },
    ],
    unseenAssessment: [
      {
        prompt: {
          ar: `اختبار مستقل: أي من هذه الصور الجديدة لونه ${color.name.ar}؟`,
          en: `Independent Check: Which unseen object is ${color.name.en}?`,
        },
        options: [
          { id: 'u1', visual: preset.unseen[0].emoji, label: preset.unseen[0].label, isCorrect: true },
          { id: 'u2', visual: preset.distractors[0].emoji, label: preset.distractors[0].label, isCorrect: false },
          { id: 'u3', visual: preset.distractors[1].emoji, label: preset.distractors[1].label, isCorrect: false },
        ],
      },
      {
        prompt: {
          ar: `تحدٍ ثانٍ: اختر المثال الصحيح للون ال${color.name.ar}!`,
          en: `Challenge 2: Choose another ${color.name.en} object!`,
        },
        options: [
          { id: 'u4', visual: preset.distractors[1].emoji, label: preset.distractors[1].label, isCorrect: false },
          { id: 'u5', visual: preset.unseen[1]?.emoji || targetExamples[4].emoji, label: preset.unseen[1]?.label || targetExamples[4].label, isCorrect: true },
          { id: 'u6', visual: preset.distractors[0].emoji, label: preset.distractors[0].label, isCorrect: false },
        ],
      },
    ],
  };
}

export interface ArabicDeepJourneyData {
  letterId: string;
  char: string;
  nameAr: string;
  nameEn: string;
  introLine: LocalizedText;
  phoneticHint: LocalizedText;
  writingTip: LocalizedText;
  forms: { isolated: string; initial: string; medial: string; final: string };
  examples: Array<{ word: string; meaningEn: string; emoji: string }>;
  distractorChars: string[];
  missingWordPrompt: { masked: string; answerChar: string; fullWord: string; emoji: string };
  buildWordTiles: { targetWord: string; tiles: string[]; emoji: string };
  readingSentences: Record<AgeGroupId, LocalizedText>;
  unseenAssessmentWord: { word: string; startsWithTarget: boolean; emoji: string };
}

const ARABIC_RICH_EXAMPLES: Record<string, Array<{ word: string; meaningEn: string; emoji: string }>> = {
  'ar-alif': [
    { word: 'أسد', meaningEn: 'Lion', emoji: '🦁' },
    { word: 'أرنب', meaningEn: 'Rabbit', emoji: '🐰' },
    { word: 'أسرة', meaningEn: 'Family', emoji: '👨‍👩‍👧' },
    { word: 'أم', meaningEn: 'Mother', emoji: '👩' },
    { word: 'أذن', meaningEn: 'Ear', emoji: '👂' },
  ],
  'ar-baa': [
    { word: 'بطة', meaningEn: 'Duck', emoji: '🦆' },
    { word: 'بيت', meaningEn: 'House', emoji: '🏠' },
    { word: 'باب', meaningEn: 'Door', emoji: '🚪' },
    { word: 'برتقال', meaningEn: 'Orange', emoji: '🍊' },
    { word: 'بقرة', meaningEn: 'Cow', emoji: '🐄' },
  ],
  'ar-taa': [
    { word: 'تفاحة', meaningEn: 'Apple', emoji: '🍎' },
    { word: 'تاج', meaningEn: 'Crown', emoji: '👑' },
    { word: 'تمساح', meaningEn: 'Crocodile', emoji: '🐊' },
    { word: 'تين', meaningEn: 'Fig', emoji: '🫐' },
    { word: 'توت', meaningEn: 'Berry', emoji: '🍓' },
  ],
};

export function buildArabicDeepJourney(letterId: string): ArabicDeepJourneyData {
  const idx = Math.max(0, ARABIC_ALPHABET.findIndex((l) => l.id === letterId));
  const entry = ARABIC_ALPHABET[idx];
  const next1 = ARABIC_ALPHABET[(idx + 1) % ARABIC_ALPHABET.length];
  const next2 = ARABIC_ALPHABET[(idx + 4) % ARABIC_ALPHABET.length];

  const baseExamples = ARABIC_RICH_EXAMPLES[entry.id] || [
    { word: entry.word, meaningEn: entry.wordMeaningEn, emoji: entry.emoji },
    { word: `${entry.char === 'أ' ? 'أب' : entry.word}`, meaningEn: entry.wordMeaningEn, emoji: entry.emoji },
    { word: `${next1.word}`, meaningEn: `${next1.wordMeaningEn} (للمقارنة)`, emoji: next1.emoji },
  ];

  // Clean word building target (short 2-4 char Arabic letters from entry.word)
  const cleanWord = entry.word.replace(/[^\u0621-\u064A]/g, '');
  const splitLetters = Array.from(cleanWord);
  const shuffledTiles = [...splitLetters].reverse();
  if (shuffledTiles.join('') === cleanWord && shuffledTiles.length >= 2) {
    const tmp = shuffledTiles[0];
    shuffledTiles[0] = shuffledTiles[1];
    shuffledTiles[1] = tmp;
  }

  const masked =
    splitLetters.length > 1 ? `_${splitLetters.slice(1).join('')}` : '_';

  const distractors = entry.similarGroup.filter((c) => c !== entry.char);
  while (distractors.length < 2) {
    const alt = ARABIC_ALPHABET[(idx + distractors.length + 3) % ARABIC_ALPHABET.length].char;
    if (alt !== entry.char && !distractors.includes(alt)) distractors.push(alt);
  }

  return {
    letterId: entry.id,
    char: entry.char,
    nameAr: entry.nameAr,
    nameEn: entry.nameEn,
    introLine: {
      ar: `أهلاً يا بطل! ده حرف ال${entry.nameAr} — ${entry.char}`,
      en: `Hello friend! Meet the Arabic letter ${entry.nameEn} — ${entry.char}`,
    },
    phoneticHint: entry.phoneticHint,
    writingTip: entry.writingTip,
    forms: entry.forms,
    examples: baseExamples,
    distractorChars: distractors.slice(0, 2),
    missingWordPrompt: {
      masked,
      answerChar: splitLetters[0] || entry.char,
      fullWord: entry.word,
      emoji: entry.emoji,
    },
    buildWordTiles: {
      targetWord: cleanWord,
      tiles: shuffledTiles,
      emoji: entry.emoji,
    },
    readingSentences: {
      '3-4': {
        ar: `${entry.emoji} ${entry.char} — ${entry.word}`,
        en: `${entry.emoji} ${entry.char} as in ${entry.word}`,
      },
      '5-6': {
        ar: `أنا أرى ${entry.word} ${entry.emoji}`,
        en: `I see ${entry.word} (${entry.wordMeaningEn}) ${entry.emoji}`,
      },
      '7': {
        ar: `تبدأ كلمة "${entry.word}" بحرف (${entry.char}) ونطقه واضح ومميز.`,
        en: `The word "${entry.word}" (${entry.wordMeaningEn}) begins clearly with ${entry.char}.`,
      },
      '8': {
        ar: `استخرج حرف (${entry.char}) في جملة: قرأت قصة جميلة عن ${entry.word} في الحديقة.`,
        en: `Spot ${entry.char} inside the sentence: I read a lovely story about ${entry.word}.`,
      },
    },
    unseenAssessmentWord: {
      word: entry.id === 'ar-alif' ? 'أناناس' : entry.word,
      startsWithTarget: true,
      emoji: entry.id === 'ar-alif' ? '🍍' : entry.emoji,
    },
  };
}

export interface EnglishDeepJourneyData {
  letterId: string;
  upper: string;
  lower: string;
  nameSound: string;
  phoneticSound: string;
  word: string;
  wordAr: string;
  emoji: string;
  cvcWord: string;
  examples: Array<{ word: string; emoji: string; ar: string }>;
  distractorLowers: string[];
  readingSentence: Record<AgeGroupId, LocalizedText>;
}

export function buildEnglishDeepJourney(letterId: string): EnglishDeepJourneyData {
  const idx = Math.max(0, ENGLISH_ALPHABET.findIndex((l) => l.id === letterId));
  const entry = ENGLISH_ALPHABET[idx];
  const alt1 = ENGLISH_ALPHABET[(idx + 3) % ENGLISH_ALPHABET.length];
  const alt2 = ENGLISH_ALPHABET[(idx + 7) % ENGLISH_ALPHABET.length];

  return {
    letterId: entry.id,
    upper: entry.upper,
    lower: entry.lower,
    nameSound: entry.nameSound,
    phoneticSound: entry.phoneticSound,
    word: entry.word,
    wordAr: entry.wordAr,
    emoji: entry.emoji,
    cvcWord: entry.cvcExample,
    examples: [
      { word: entry.word, emoji: entry.emoji, ar: entry.wordAr },
      { word: `${entry.upper}-Sound: ${entry.phoneticSound}`, emoji: '🔊', ar: `صوت الحرف ${entry.upper}` },
      { word: `Word Practice: ${entry.cvcExample}`, emoji: '🧩', ar: `كلمة ${entry.cvcExample}` },
    ],
    distractorLowers: [alt1.lower, alt2.lower],
    readingSentence: {
      '3-4': { ar: `${entry.upper} مثل ${entry.wordAr}`, en: `${entry.upper} is for ${entry.word}` },
      '5-6': { ar: `هذه ${entry.wordAr} تبدأ بحرف ${entry.upper}`, en: `Look! A ${entry.word.toLowerCase()} starts with ${entry.upper}.` },
      '7': { ar: `اقرأ الكلمة القصيرة: ${entry.cvcExample}`, en: `Sound out the phonics word: ${entry.cvcExample}` },
      '8': { ar: `كوّن جملة مفيدة تضم ${entry.word}`, en: `The curious ${entry.word.toLowerCase()} brings bright adventure.` },
    },
  };
}

export interface MathUnitJourneyData {
  id: string;
  title: LocalizedText;
  ageGroups: AgeGroupId[];
  explanation: LocalizedText;
  targetNumber: number;
  emoji: string;
  operationPrompt: LocalizedText;
  operationChoices: Array<{ label: string; isCorrect: boolean }>;
  wordProblem: {
    prompt: LocalizedText;
    choices: Array<{ label: string; isCorrect: boolean }>;
  };
}

export const MATH_DEEP_UNITS: MathUnitJourneyData[] = [
  {
    id: 'math-count-1-5',
    title: { ar: 'رحلة الأعداد والكميات (١ – ٥)', en: 'Quantities & Counting Journey (1–5)' },
    ageGroups: ['3-4', '5-6'],
    explanation: {
      ar: 'الرقم ليس مجرد شكل! الرقم ٣ يعني ثلاث تفاحات حقيقية يمكننا عدّها واحدة تلو الأخرى.',
      en: 'A number is not just a symbol! Number 3 means three real objects we can count one by one.',
    },
    targetNumber: 4,
    emoji: '🍎',
    operationPrompt: { ar: 'أضف تفاحة إلى ٣ تفاحات، كم يصبح المجموع؟', en: 'Add 1 apple to 3 apples. How many altogether?' },
    operationChoices: [
      { label: '3', isCorrect: false },
      { label: '4', isCorrect: true },
      { label: '5', isCorrect: false },
    ],
    wordProblem: {
      prompt: { ar: 'مع نونو تفاحتان، أعطته لولو تفاحتين إضافيتين. كم تفاحة مع نونو الآن؟', en: 'Nono had 2 apples and Lolo gave him 2 more. How many apples now?' },
      choices: [
        { label: '4', isCorrect: true },
        { label: '2', isCorrect: false },
        { label: '6', isCorrect: false },
      ],
    },
  },
  {
    id: 'math-add-sub-20',
    title: { ar: 'رحلة الجمع والطرح الذكي (حتى ٢٠)', en: 'Smart Addition & Subtraction (Up to 20)' },
    ageGroups: ['5-6', '7'],
    explanation: {
      ar: 'الجمع يعني ضم مجموعتين معاً ليكبر العدد، والطرح يعني أخذ جزء ليتبقى الباقي.',
      en: 'Addition joins groups together, while subtraction takes some away to find what remains.',
    },
    targetNumber: 12,
    emoji: '🌟',
    operationPrompt: { ar: 'كم يساوي ٨ + ٧ ؟', en: 'What is 8 + 7?' },
    operationChoices: [
      { label: '14', isCorrect: false },
      { label: '15', isCorrect: true },
      { label: '16', isCorrect: false },
    ],
    wordProblem: {
      prompt: { ar: 'في السلة ١٤ نجمة، أهدى نونو ٥ نجوم لصديقه بوبو. كم نجمة بقيت في السلة؟', en: 'A basket held 14 stars. Nono gifted 5 to Bobo. How many stars are left?' },
      choices: [
        { label: '9', isCorrect: true },
        { label: '10', isCorrect: false },
        { label: '8', isCorrect: false },
      ],
    },
  },
  {
    id: 'math-mult-div-7',
    title: { ar: 'رحلة الضرب والقسمة بالمجموعات', en: 'Multiplication & Fair-Share Division' },
    ageGroups: ['7', '8'],
    explanation: {
      ar: 'الضرب هو جمع متكرر لمجموعات متساوية (٣ × ٤ يعني ٣ مجموعات في كل منها ٤)، والقسمة هي التوزيع بالتساوي.',
      en: 'Multiplication is repeated equal groups (3 × 4 = 3 groups of 4), and division shares equally.',
    },
    targetNumber: 12,
    emoji: '🧁',
    operationPrompt: { ar: 'إذا كان لدينا ٣ أطباق وفي كل طبق ٤ كعكات، فكم مجموع الكعكات؟', en: '3 plates with 4 cupcakes each makes how many cupcakes?' },
    operationChoices: [
      { label: '7', isCorrect: false },
      { label: '12', isCorrect: true },
      { label: '16', isCorrect: false },
    ],
    wordProblem: {
      prompt: { ar: 'وزعت تيتي ٢٠ جزرة بالتساوي على ٤ أصدقاء. كم جزرة يأخذ كل صديق؟', en: 'Titi shared 20 carrots equally among 4 friends. How many does each friend get?' },
      choices: [
        { label: '5', isCorrect: true },
        { label: '4', isCorrect: false },
        { label: '6', isCorrect: false },
      ],
    },
  },
  {
    id: 'math-fractions-8',
    title: { ar: 'رحلة الكسور والمسائل متعددة الخطوات', en: 'Fractions & Multi-Step Reasoning' },
    ageGroups: ['8'],
    explanation: {
      ar: 'الكسر يعبر عن جزء متساوٍ من الكل، مثل ١/٢ (نصف) أو ١/٤ (ربع) البيتزا المقسمة بالتساوي.',
      en: 'A fraction represents an equal part of a whole, like 1/2 (half) or 1/4 (quarter) of a pizza.',
    },
    targetNumber: 4,
    emoji: '🍕',
    operationPrompt: { ar: 'قُسّمت بيتزا إلى ٤ شرائح متساوية وأكل ليو شريحتين. ما الكسر الذي أكله؟', en: 'A pizza has 4 equal slices and Leo ate 2. Which fraction did he eat?' },
    operationChoices: [
      { label: '1/4', isCorrect: false },
      { label: '2/4 (1/2)', isCorrect: true },
      { label: '3/4', isCorrect: false },
    ],
    wordProblem: {
      prompt: { ar: 'اشترت إيلي ٤ علب ألوان في كل علبة ٦ أقلام، ثم أعطت أختها ٤ أقلام. كم قلماً بقي معها؟', en: 'Ellie bought 4 boxes of 6 crayons, then gave 4 away. How many remain?' },
      choices: [
        { label: '20', isCorrect: true },
        { label: '24', isCorrect: false },
        { label: '18', isCorrect: false },
      ],
    },
  },
];

// =========================================================================
// VALIDATED EXAM QUESTION BANK (180+ UNIQUE MULTI-FORMAT QUESTIONS)
// Ensures 40-question official exams NEVER duplicate questions or feel repetitive!
// =========================================================================

function buildComprehensiveExamBank(): ExamQuestionItem[] {
  const bank: ExamQuestionItem[] = [];

  // 1. Arabic Alphabet & Literacy Bank (28+ questions across ages)
  ARABIC_ALPHABET.forEach((letter, idx) => {
    const distractorA = ARABIC_ALPHABET[(idx + 1) % ARABIC_ALPHABET.length];
    const distractorB = ARABIC_ALPHABET[(idx + 5) % ARABIC_ALPHABET.length];

    // Recognition / Listening question (all ages with age-appropriate cue)
    bank.push({
      id: `q-ar-rec-${letter.id}`,
      subject: 'arabic',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: idx % 2 === 0 ? 'listening' : 'recognition',
      difficulty: 1,
      lessonRefId: `deep-ar-${letter.id}`,
      lessonTitle: { ar: `حرف ${letter.nameAr} (${letter.char})`, en: `Arabic Letter ${letter.nameEn}` },
      prompt: {
        ar: `اسمع الصوت واختر حرف (${letter.nameAr}) الذي تبدأ به كلمة "${letter.word}":`,
        en: `Listen and pick the Arabic letter for "${letter.word}" (${letter.wordMeaningEn}):`,
      },
      audioText: `${letter.nameAr}، ${letter.word}`,
      audioLang: 'ar',
      visualCue: letter.emoji,
      options: [
        { id: 'a', label: { ar: letter.char, en: letter.char }, visual: letter.char },
        { id: 'b', label: { ar: distractorA.char, en: distractorA.char }, visual: distractorA.char },
        { id: 'c', label: { ar: distractorB.char, en: distractorB.char }, visual: distractorB.char },
      ].sort((x, y) => (idx % 3 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: {
        ar: `كلمة (${letter.word}) تبدأ بحرف (${letter.char} — ${letter.nameAr}).`,
        en: `${letter.word} begins with ${letter.char} (${letter.nameEn}).`,
      },
      published: true,
    });

    // Word & Picture Matching / Forms question (18 items across all ages)
    if (idx < 18) {
      bank.push({
        id: `q-ar-form-${letter.id}`,
        subject: 'arabic',
        ageGroups: ['3-4', '5-6', '7', '8'],
        type: idx % 2 === 0 ? 'missing-letter' : 'matching',
        difficulty: 2,
        lessonRefId: `deep-ar-${letter.id}`,
        lessonTitle: { ar: `أشكال وموقع حرف ${letter.char}`, en: `Forms of ${letter.nameEn}` },
        prompt: {
          ar: `أي كلمة تحتوي على حرف (${letter.char}) وتطابق الصورة ${letter.emoji}؟`,
          en: `Which Arabic word matches ${letter.emoji} (${letter.wordMeaningEn}) with letter ${letter.char}?`,
        },
        audioText: letter.word,
        audioLang: 'ar',
        visualCue: letter.emoji,
        options: [
          { id: 'a', label: { ar: letter.word, en: letter.word }, visual: letter.emoji },
          { id: 'b', label: { ar: distractorA.word, en: distractorA.word }, visual: distractorA.emoji },
          { id: 'c', label: { ar: distractorB.word, en: distractorB.word }, visual: distractorB.emoji },
        ].sort((x, y) => (idx % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
        correctOptionId: 'a',
        explanation: {
          ar: `الصورة ${letter.emoji} تمثل كلمة "${letter.word}".`,
          en: `${letter.emoji} is "${letter.word}".`,
        },
        published: true,
      });
    }
  });

  // 2. English Alphabet & Phonics Bank (42 unique questions across all age bands)
  ENGLISH_ALPHABET.forEach((en, idx) => {
    const alt1 = ENGLISH_ALPHABET[(idx + 2) % ENGLISH_ALPHABET.length];
    const alt2 = ENGLISH_ALPHABET[(idx + 8) % ENGLISH_ALPHABET.length];

    bank.push({
      id: `q-en-phon-${en.id}`,
      subject: 'english',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: idx % 2 === 0 ? 'listening' : 'matching',
      difficulty: 1,
      lessonRefId: `deep-en-${en.id}`,
      lessonTitle: { ar: `حرف ${en.upper} بالإنجليزية`, en: `English Letter ${en.upper}` },
      prompt: {
        ar: `اختر الحرف الصغير (Lowercase) والصورة المطابقة للحرف (${en.upper}):`,
        en: `Match uppercase "${en.upper}" (${en.phoneticSound}) with its lowercase & word:`,
      },
      audioText: `${en.upper}. ${en.word}`,
      audioLang: 'en',
      visualCue: en.emoji,
      options: [
        { id: 'a', label: { ar: `${en.lower} — ${en.word}`, en: `${en.lower} — ${en.word}` }, visual: en.emoji },
        { id: 'b', label: { ar: `${alt1.lower} — ${alt1.word}`, en: `${alt1.lower} — ${alt1.word}` }, visual: alt1.emoji },
        { id: 'c', label: { ar: `${alt2.lower} — ${alt2.word}`, en: `${alt2.lower} — ${alt2.word}` }, visual: alt2.emoji },
      ].sort((x, y) => (idx % 3 === 1 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
      correctOptionId: 'a',
      explanation: {
        ar: `${en.upper} يطابق الحرف الصغير ${en.lower} كما في كلمة ${en.word}.`,
        en: `${en.upper} pairs with lowercase ${en.lower} as in ${en.word}.`,
      },
      published: true,
    });

    if (idx < 16) {
      bank.push({
        id: `q-en-cvc-${en.id}`,
        subject: 'english',
        ageGroups: ['3-4', '5-6', '7', '8'],
        type: 'reading',
        difficulty: 2,
        lessonRefId: `deep-en-${en.id}`,
        lessonTitle: { ar: `قراءة وصوتيات ${en.upper}`, en: `Phonics & Reading ${en.upper}` },
        prompt: {
          ar: `أي كلمة إنجليزية تبدأ بصوت الحرف (${en.upper}) (${en.phoneticSound})؟`,
          en: `Which word starts with the phonetic sound of ${en.upper} (${en.phoneticSound})?`,
        },
        audioText: en.word,
        audioLang: 'en',
        options: [
          { id: 'a', label: { ar: en.word, en: en.word }, visual: en.emoji },
          { id: 'b', label: { ar: alt1.word, en: alt1.word }, visual: alt1.emoji },
          { id: 'c', label: { ar: alt2.word, en: alt2.word }, visual: alt2.emoji },
        ].sort((x, y) => (idx % 2 === 0 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
        correctOptionId: 'a',
        explanation: {
          ar: `كلمة ${en.word} تبدأ بالحرف ${en.upper}.`,
          en: `${en.word} begins with the ${en.upper} sound.`,
        },
        published: true,
      });
    }
  });

  // 3. Mathematics Bank (Age-adaptive: Quantities 1-10, Addition/Sub, Sequences, Multiplication/Division/Fractions)
  for (let n = 1; n <= 12; n++) {
    bank.push({
      id: `q-math-qty-${n}`,
      subject: 'math',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: 'quantity',
      difficulty: 1,
      lessonRefId: 'math-count-1-5',
      lessonTitle: { ar: `العدد والكمية (${n})`, en: `Number & Quantity (${n})` },
      prompt: {
        ar: `عدّ النجوم ثم اختر العدد الصحيح:`,
        en: `Count the stars and select the matching number:`,
      },
      visualCue: '⭐'.repeat(n),
      options: [
        { id: 'a', label: { ar: String(n), en: String(n) }, visual: String(n) },
        { id: 'b', label: { ar: String(n + 1), en: String(n + 1) }, visual: String(n + 1) },
        { id: 'c', label: { ar: String(Math.max(1, n - 1)), en: String(Math.max(1, n - 1)) }, visual: String(Math.max(1, n - 1)) },
      ].sort((x, y) => (n % 2 === 0 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
      correctOptionId: 'a',
      explanation: {
        ar: `يوجد بالضبط ${n} نجوم.`,
        en: `There are exactly ${n} stars.`,
      },
      published: true,
    });
  }

  // Addition, Subtraction & Comparison for Ages 5-6, 7, 8
  const mathOps: Array<{
    id: string;
    ages: AgeGroupId[];
    type: ExamQuestionItem['type'];
    prompt: LocalizedText;
    ans: string;
    w1: string;
    w2: string;
    exp: LocalizedText;
  }> = [
    { id: 'm-add-1', ages: ['5-6', '7'], type: 'problem-solving', prompt: { ar: 'كم يساوي 4 + 5 ؟', en: 'What is 4 + 5?' }, ans: '9', w1: '8', w2: '10', exp: { ar: '4 + 5 = 9', en: '4 + 5 = 9' } },
    { id: 'm-add-2', ages: ['5-6', '7'], type: 'problem-solving', prompt: { ar: 'كم يساوي 7 + 6 ؟', en: 'What is 7 + 6?' }, ans: '13', w1: '12', w2: '14', exp: { ar: '7 + 6 = 13', en: '7 + 6 = 13' } },
    { id: 'm-sub-1', ages: ['5-6', '7'], type: 'problem-solving', prompt: { ar: 'معك 10 تفاحات، أكلت 3. كم بقي؟', en: 'You have 10 apples and eat 3. How many left?' }, ans: '7', w1: '6', w2: '8', exp: { ar: '10 - 3 = 7', en: '10 - 3 = 7' } },
    { id: 'm-seq-1', ages: ['3-4', '5-6', '7'], type: 'sequence', prompt: { ar: 'ما العدد الناقص: 2 ، 4 ، __ ، 8 ؟', en: 'Find the missing number: 2, 4, __, 8' }, ans: '6', w1: '5', w2: '7', exp: { ar: 'النمط يزيد 2 في كل خطوة: 6.', en: 'Skip counting by 2s gives 6.' } },
    { id: 'm-seq-2', ages: ['5-6', '7', '8'], type: 'sequence', prompt: { ar: 'ما العدد التالي: 10 ، 20 ، 30 ، __ ؟', en: 'What comes next: 10, 20, 30, __?' }, ans: '40', w1: '35', w2: '50', exp: { ar: 'العد بالعشرات: 40.', en: 'Counting by tens gives 40.' } },
    { id: 'm-cmp-1', ages: ['3-4', '5-6', '7'], type: 'recognition', prompt: { ar: 'أي عدد أكبر من 9 وأصغر من 11؟', en: 'Which number is greater than 9 and less than 11?' }, ans: '10', w1: '8', w2: '12', exp: { ar: 'العدد بين 9 و 11 هو 10.', en: '10 sits right between 9 and 11.' } },
    { id: 'm-mul-1', ages: ['7', '8'], type: 'problem-solving', prompt: { ar: '3 مجموعات في كل مجموعة 5 نجوم = ؟', en: '3 groups of 5 stars equals how many?' }, ans: '15', w1: '8', w2: '12', exp: { ar: '3 × 5 = 15', en: '3 × 5 = 15' } },
    { id: 'm-mul-2', ages: ['7', '8'], type: 'problem-solving', prompt: { ar: 'كم يساوي 4 × 4 ؟', en: 'What is 4 × 4?' }, ans: '16', w1: '12', w2: '20', exp: { ar: '4 × 4 = 16', en: '4 × 4 = 16' } },
    { id: 'm-div-1', ages: ['7', '8'], type: 'problem-solving', prompt: { ar: 'وزعنا 18 قطعة حلوى على 3 أطفال بالتساوي. كم يأخذ كل طفل؟', en: 'Share 18 candies equally among 3 kids. Each gets:' }, ans: '6', w1: '5', w2: '9', exp: { ar: '18 ÷ 3 = 6', en: '18 ÷ 3 = 6' } },
    { id: 'm-frac-1', ages: ['7', '8'], type: 'recognition', prompt: { ar: 'قسّمنا فطيرة إلى 4 أجزاء متساوية وأكلنا جزءاً واحداً. ما الكسر؟', en: 'A pie is cut into 4 equal slices and 1 is eaten. Which fraction?' }, ans: '1/4', w1: '1/2', w2: '3/4', exp: { ar: 'جزء من أربعة يساوي ربع (1/4).', en: '1 out of 4 equal parts is 1/4.' } },
    { id: 'm-frac-2', ages: ['8'], type: 'recognition', prompt: { ar: 'أي كسر يساوي النصف؟', en: 'Which fraction equals one half?' }, ans: '2/4', w1: '1/4', w2: '3/4', exp: { ar: '2/4 يساوي 1/2.', en: '2 out of 4 equals 1/2.' } },
    { id: 'm-multi-8', ages: ['8'], type: 'problem-solving', prompt: { ar: 'اشترى عمر 3 علب في كل منها 6 أقلام، وأعطى أخته 4. كم بقي؟', en: 'Omar bought 3 boxes of 6 pens and gave 4 away. How many left?' }, ans: '14', w1: '18', w2: '12', exp: { ar: '3 × 6 = 18، ثم 18 - 4 = 14.', en: '3 × 6 = 18, then 18 - 4 = 14.' } },
    { id: 'm-div-8', ages: ['8'], type: 'problem-solving', prompt: { ar: 'كم يساوي 36 ÷ 6 ؟', en: 'What is 36 ÷ 6?' }, ans: '6', w1: '5', w2: '7', exp: { ar: '6 × 6 = 36، إذن الناتج 6.', en: '6 × 6 = 36, so 36 ÷ 6 = 6.' } },
    { id: 'm-add-8', ages: ['7', '8'], type: 'problem-solving', prompt: { ar: 'كم يساوي 25 + 17 ؟', en: 'What is 25 + 17?' }, ans: '42', w1: '32', w2: '45', exp: { ar: '25 + 17 = 42', en: '25 + 17 = 42' } },
  ];

  mathOps.forEach((m, idx) => {
    bank.push({
      id: `q-math-${m.id}`,
      subject: 'math',
      ageGroups: m.ages,
      type: m.type,
      difficulty: m.ages.includes('8') ? 3 : 2,
      lessonRefId: 'math-add-sub-20',
      lessonTitle: { ar: 'العمليات الحسابية والمنطق', en: 'Math Operations & Reasoning' },
      prompt: m.prompt,
      options: [
        { id: 'a', label: { ar: m.ans, en: m.ans }, visual: m.ans },
        { id: 'b', label: { ar: m.w1, en: m.w1 }, visual: m.w1 },
        { id: 'c', label: { ar: m.w2, en: m.w2 }, visual: m.w2 },
      ].sort((x, y) => (idx % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: m.exp,
      published: true,
    });
  });

  // 4. Colors, Shapes & Science Bank (30+ diverse questions across all ages)
  ACADEMY_COLORS.forEach((col, idx) => {
    const other1 = ACADEMY_COLORS[(idx + 2) % ACADEMY_COLORS.length];
    const other2 = ACADEMY_COLORS[(idx + 5) % ACADEMY_COLORS.length];
    bank.push({
      id: `q-col-${col.id}`,
      subject: 'colors-science',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: idx % 2 === 0 ? 'listening' : 'matching',
      difficulty: 1,
      lessonRefId: `deep-color-${col.id}`,
      lessonTitle: { ar: `اللون ال${col.name.ar}`, en: `Color ${col.name.en}` },
      prompt: {
        ar: `أي مجموعة أشياء يغلب عليها اللون ال${col.name.ar}؟`,
        en: `Which real-world items belong to the color ${col.name.en}?`,
      },
      audioText: `${col.name.ar}`,
      audioLang: 'ar',
      options: [
        { id: 'a', label: col.examples, visual: col.emojis },
        { id: 'b', label: other1.examples, visual: other1.emojis },
        { id: 'c', label: other2.examples, visual: other2.emojis },
      ].sort((x, y) => (idx % 2 === 0 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
      correctOptionId: 'a',
      explanation: {
        ar: `أمثلة اللون ${col.name.ar}: ${col.examples.ar}.`,
        en: `${col.name.en} examples: ${col.examples.en}.`,
      },
      published: true,
    });
  });

  const scienceAndShapes: Array<{
    id: string;
    ages: AgeGroupId[];
    prompt: LocalizedText;
    ans: { visual: string; label: LocalizedText };
    w1: { visual: string; label: LocalizedText };
    w2: { visual: string; label: LocalizedText };
    exp: LocalizedText;
  }> = [
    {
      id: 'cs-mix-1',
      ages: ['3-4', '5-6', '7', '8'],
      prompt: { ar: 'عند مزج الأحمر + الأصفر ينتج اللون:', en: 'Mixing Red + Yellow produces:' },
      ans: { visual: '🟠', label: { ar: 'برتقالي', en: 'Orange' } },
      w1: { visual: '🟢', label: { ar: 'أخضر', en: 'Green' } },
      w2: { visual: '🟣', label: { ar: 'بنفسجي', en: 'Purple' } },
      exp: { ar: 'الأحمر مع الأصفر يصنعان اللون البرتقالي!', en: 'Red and Yellow mix into Orange!' },
    },
    {
      id: 'cs-mix-2',
      ages: ['3-4', '5-6', '7', '8'],
      prompt: { ar: 'عند مزج الأزرق + الأصفر ينتج اللون:', en: 'Mixing Blue + Yellow produces:' },
      ans: { visual: '🟢', label: { ar: 'أخضر', en: 'Green' } },
      w1: { visual: '🟣', label: { ar: 'بنفسجي', en: 'Purple' } },
      w2: { visual: '🟠', label: { ar: 'برتقالي', en: 'Orange' } },
      exp: { ar: 'الأزرق + الأصفر = أخضر!', en: 'Blue + Yellow = Green!' },
    },
    {
      id: 'cs-shape-1',
      ages: ['3-4', '5-6'],
      prompt: { ar: 'أي شكل له ٣ أضلاع؟', en: 'Which shape has 3 sides?' },
      ans: { visual: '🔺', label: { ar: 'مثلث', en: 'Triangle' } },
      w1: { visual: '⭕', label: { ar: 'دائرة', en: 'Circle' } },
      w2: { visual: '🟦', label: { ar: 'مربع', en: 'Square' } },
      exp: { ar: 'المثلث له ٣ أضلاع.', en: 'A triangle has 3 sides.' },
    },
    {
      id: 'cs-shape-2',
      ages: ['7', '8'],
      prompt: { ar: 'كم ضلعاً للشكل السداسي (Hexagon) كما في خلية النحل؟', en: 'How many sides does a honeycomb Hexagon have?' },
      ans: { visual: '⬡', label: { ar: '6 أضلاع', en: '6 sides' } },
      w1: { visual: '⬠', label: { ar: '5 أضلاع', en: '5 sides' } },
      w2: { visual: '🟦', label: { ar: '4 أضلاع', en: '4 sides' } },
      exp: { ar: 'السداسي له 6 أضلاع متصلة.', en: 'A hexagon has 6 sides.' },
    },
    {
      id: 'cs-sci-1',
      ages: ['3-4', '5-6', '7', '8'],
      prompt: { ar: 'أي جزء في النبات يصنع الغذاء بمساعدة ضوء الشمس؟', en: 'Which plant part uses sunlight to make food?' },
      ans: { visual: '🍃', label: { ar: 'الأوراق', en: 'Leaves' } },
      w1: { visual: '🪨', label: { ar: 'الصخور', en: 'Rocks' } },
      w2: { visual: '☁️', label: { ar: 'السحاب', en: 'Clouds' } },
      exp: { ar: 'الأوراق الخضراء تصنع غذاء النبات بضوء الشمس.', en: 'Green leaves absorb sunlight to make plant food.' },
    },
    {
      id: 'cs-sci-2',
      ages: ['5-6', '7', '8'],
      prompt: { ar: 'أي عضو يضخ الدم إلى جميع أنحاء جسم الإنسان؟', en: 'Which organ pumps blood through our body?' },
      ans: { visual: '❤️', label: { ar: 'القلب', en: 'Heart' } },
      w1: { visual: '👂', label: { ar: 'الأذن', en: 'Ear' } },
      w2: { visual: '🦷', label: { ar: 'السن', en: 'Tooth' } },
      exp: { ar: 'القلب يضخ الدم باستمرار في أجسامنا.', en: 'The heart pumps blood throughout the body.' },
    },
    {
      id: 'cs-space-1',
      ages: ['5-6', '7', '8'],
      prompt: { ar: 'ما الكوكب الذي نعيش عليه؟', en: 'Which planet do we live on?' },
      ans: { visual: '🌍', label: { ar: 'كوكب الأرض', en: 'Earth' } },
      w1: { visual: '🪐', label: { ar: 'زحل', en: 'Saturn' } },
      w2: { visual: '☀️', label: { ar: 'الشمس', en: 'The Sun' } },
      exp: { ar: 'كوكب الأرض هو بيتنا الأزرق والأخضر.', en: 'Planet Earth is our home.' },
    },
    {
      id: 'cs-geo-1',
      ages: ['7', '8'],
      prompt: { ar: 'أين تعيش الأسماك والشعاب المرجانية؟', en: 'Where do fish and coral reefs live?' },
      ans: { visual: '🌊', label: { ar: 'المحيطات والبحار', en: 'Oceans & Seas' } },
      w1: { visual: '🏜️', label: { ar: 'الصحراء الجافة', en: 'Dry Desert' } },
      w2: { visual: '🏔️', label: { ar: 'قمم الجبال', en: 'Mountain Peaks' } },
      exp: { ar: 'تعيش الأسماك في البيئة المائية كالبحار والمحيطات.', en: 'Fish live in aquatic ocean habitats.' },
    },
  ];

  scienceAndShapes.forEach((sc, idx) => {
    bank.push({
      id: `q-cs-${sc.id}`,
      subject: 'colors-science',
      ageGroups: sc.ages,
      type: 'problem-solving',
      difficulty: sc.ages.includes('8') ? 3 : 2,
      lessonRefId: 'science-colors-shapes',
      lessonTitle: { ar: 'الألوان والأشكال والعلوم', en: 'Colors, Shapes & Science' },
      prompt: sc.prompt,
      options: [
        { id: 'a', label: sc.ans.label, visual: sc.ans.visual },
        { id: 'b', label: sc.w1.label, visual: sc.w1.visual },
        { id: 'c', label: sc.w2.label, visual: sc.w2.visual },
      ].sort((x, y) => (idx % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: sc.exp,
      published: true,
    });
  });

  // Expand Math Bank so every age band (3-4, 5-6, 7, 8) has 40+ distinct non-duplicate Math questions
  for (let a = 1; a <= 15; a++) {
    const b = (a % 7) + 1;
    const sum = a + b;
    bank.push({
      id: `q-math-gen-add-${a}-${b}`,
      subject: 'math',
      ageGroups: a <= 5 ? ['3-4', '5-6', '7', '8'] : ['5-6', '7', '8'],
      type: 'problem-solving',
      difficulty: a <= 5 ? 1 : 2,
      lessonRefId: 'math-add-sub-20',
      lessonTitle: { ar: `الجمع (${a} + ${b})`, en: `Addition (${a} + ${b})` },
      prompt: {
        ar: `إذا أضفنا ${b} إلى ${a} فما الناتج الصحيح؟`,
        en: `What is ${a} + ${b}?`,
      },
      visualCue: a <= 5 ? `${'🍎'.repeat(a)} + ${'🍎'.repeat(b)}` : undefined,
      options: [
        { id: 'a', label: { ar: String(sum), en: String(sum) }, visual: String(sum) },
        { id: 'b', label: { ar: String(sum + 1), en: String(sum + 1) }, visual: String(sum + 1) },
        { id: 'c', label: { ar: String(Math.max(0, sum - 1)), en: String(Math.max(0, sum - 1)) }, visual: String(Math.max(0, sum - 1)) },
      ].sort((x, y) => (a % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: { ar: `${a} + ${b} = ${sum}`, en: `${a} + ${b} = ${sum}` },
      published: true,
    });
  }

  for (let start = 5; start <= 19; start++) {
    const take = (start % 4) + 1;
    const rem = start - take;
    bank.push({
      id: `q-math-gen-sub-${start}-${take}`,
      subject: 'math',
      ageGroups: start <= 8 ? ['3-4', '5-6', '7', '8'] : ['5-6', '7', '8'],
      type: 'problem-solving',
      difficulty: start <= 8 ? 1 : 2,
      lessonRefId: 'math-add-sub-20',
      lessonTitle: { ar: `الطرح (${start} - ${take})`, en: `Subtraction (${start} - ${take})` },
      prompt: {
        ar: `كم يتبقى إذا طرحنا ${take} من ${start}؟`,
        en: `If you take ${take} away from ${start}, how many remain?`,
      },
      options: [
        { id: 'a', label: { ar: String(rem), en: String(rem) }, visual: String(rem) },
        { id: 'b', label: { ar: String(rem + 2), en: String(rem + 2) }, visual: String(rem + 2) },
        { id: 'c', label: { ar: String(Math.max(0, rem - 1)), en: String(Math.max(0, rem - 1)) }, visual: String(Math.max(0, rem - 1)) },
      ].sort((x, y) => (start % 3 === 0 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
      correctOptionId: 'a',
      explanation: { ar: `${start} - ${take} = ${rem}`, en: `${start} - ${take} = ${rem}` },
      published: true,
    });
  }

  // Compare & Multiplication extra unique items for 7-8 and 3-6
  for (let m = 2; m <= 11; m++) {
    const right = m + 3;
    bank.push({
      id: `q-math-cmp-auto-${m}`,
      subject: 'math',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: 'recognition',
      difficulty: 1,
      lessonRefId: 'math-count-1-5',
      lessonTitle: { ar: 'مقارنة الأعداد', en: 'Comparing Numbers' },
      prompt: {
        ar: `ما العدد الأكبر بين الأعداد التالية؟`,
        en: `Which number is the largest?`,
      },
      options: [
        { id: 'a', label: { ar: String(right), en: String(right) }, visual: String(right) },
        { id: 'b', label: { ar: String(m), en: String(m) }, visual: String(m) },
        { id: 'c', label: { ar: String(Math.max(1, m - 1)), en: String(Math.max(1, m - 1)) }, visual: String(Math.max(1, m - 1)) },
      ].sort((x, y) => (m % 2 === 0 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
      correctOptionId: 'a',
      explanation: { ar: `${right} أكبر من ${m}.`, en: `${right} is greater than ${m}.` },
      published: true,
    });
  }

  for (let f = 2; f <= 9; f++) {
    const prod = f * 3;
    bank.push({
      id: `q-math-mul-auto-${f}`,
      subject: 'math',
      ageGroups: ['7', '8'],
      type: 'problem-solving',
      difficulty: 3,
      lessonRefId: 'math-mult-div-7',
      lessonTitle: { ar: `جدول الضرب (${f} × 3)`, en: `Multiplication (${f} × 3)` },
      prompt: { ar: `كم يساوي ${f} × 3 ؟`, en: `What is ${f} × 3?` },
      options: [
        { id: 'a', label: { ar: String(prod), en: String(prod) }, visual: String(prod) },
        { id: 'b', label: { ar: String(prod + 3), en: String(prod + 3) }, visual: String(prod + 3) },
        { id: 'c', label: { ar: String(prod - 2), en: String(prod - 2) }, visual: String(prod - 2) },
      ].sort((x, y) => (f % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: { ar: `${f} × 3 = ${prod}`, en: `${f} × 3 = ${prod}` },
      published: true,
    });
  }

  // Expand Colors, Shapes, Animals, Nature & Science so single-subject exam also has 40+ unique items
  const extraWorldItems: Array<{
    id: string;
    prompt: LocalizedText;
    ans: { visual: string; label: LocalizedText };
    w1: { visual: string; label: LocalizedText };
    w2: { visual: string; label: LocalizedText };
    exp: LocalizedText;
  }> = [
    { id: 'ew-1', prompt: { ar: 'أي حيوان يعيش في الماء ويتنفس بالخياشيم؟', en: 'Which animal lives in water and breathes with gills?' }, ans: { visual: '🐟', label: { ar: 'السمكة', en: 'Fish' } }, w1: { visual: '🦁', label: { ar: 'الأسد', en: 'Lion' } }, w2: { visual: '🦅', label: { ar: 'النسر', en: 'Eagle' } }, exp: { ar: 'السمكة تعيش في الماء.', en: 'Fish live in water.' } },
    { id: 'ew-2', prompt: { ar: 'ما الحاسة التي نستخدمها لسماع الموسيقى؟', en: 'Which sense do we use to hear music?' }, ans: { visual: '👂', label: { ar: 'السمع بالأذن', en: 'Hearing (Ears)' } }, w1: { visual: '👃', label: { ar: 'الشم', en: 'Smell' } }, w2: { visual: '👅', label: { ar: 'التذوق', en: 'Taste' } }, exp: { ar: 'نسمع الأصوات بالأذن.', en: 'We hear sounds with our ears.' } },
    { id: 'ew-3', prompt: { ar: 'أي شكل دائري تماماً مثل العجلة؟', en: 'Which shape is round like a wheel?' }, ans: { visual: '⭕', label: { ar: 'الدائرة', en: 'Circle' } }, w1: { visual: '🔺', label: { ar: 'المثلث', en: 'Triangle' } }, w2: { visual: '🟦', label: { ar: 'المربع', en: 'Square' } }, exp: { ar: 'الدائرة مستديرة بلا زوايا.', en: 'A circle is round with no corners.' } },
    { id: 'ew-4', prompt: { ar: 'ما الفصل الذي تتساقط فيه أوراق الأشجار؟', en: 'In which season do many tree leaves fall?' }, ans: { visual: '🍂', label: { ar: 'الخريف', en: 'Autumn' } }, w1: { visual: '☀️', label: { ar: 'الصيف', en: 'Summer' } }, w2: { visual: '🌸', label: { ar: 'الربيع', en: 'Spring' } }, exp: { ar: 'تتساقط الأوراق في فصل الخريف.', en: 'Leaves fall in autumn.' } },
    { id: 'ew-5', prompt: { ar: 'أين نرى القمر والنجوم بوضوح؟', en: 'When do we clearly see the Moon and stars?' }, ans: { visual: '🌙', label: { ar: 'في الليل', en: 'At Night' } }, w1: { visual: '☀️', label: { ar: 'وقت الظهيرة', en: 'Midday' } }, w2: { visual: '🌈', label: { ar: 'تحت الماء', en: 'Underwater' } }, exp: { ar: 'نرى القمر والنجوم في سماء الليل.', en: 'We see the Moon and stars in the night sky.' } },
    { id: 'ew-6', prompt: { ar: 'ما الطعام الصحي المفيد للأسنان والعظام؟', en: 'Which food helps keep bones and teeth strong?' }, ans: { visual: '🥛', label: { ar: 'الحليب', en: 'Milk' } }, w1: { visual: '🍭', label: { ar: 'الحلوى الكثيرة', en: 'Lots of Candy' } }, w2: { visual: '🥤', label: { ar: 'المشروبات الغازية', en: 'Soda' } }, exp: { ar: 'الحليب غني بالكالسيوم المفيد للعظام.', en: 'Milk provides calcium for healthy bones.' } },
    { id: 'ew-7', prompt: { ar: 'ما اللون الناتج عن مزج الأحمر والأبيض؟', en: 'What color comes from mixing Red + White?' }, ans: { visual: '🩷', label: { ar: 'الوردي', en: 'Pink' } }, w1: { visual: '🟢', label: { ar: 'الأخضر', en: 'Green' } }, w2: { visual: '🔵', label: { ar: 'الأزرق', en: 'Blue' } }, exp: { ar: 'الأحمر مع الأبيض يعطي اللون الوردي.', en: 'Red + White creates Pink.' } },
    { id: 'ew-8', prompt: { ar: 'ما اللون الناتج عن مزج الأحمر والأزرق؟', en: 'What color comes from mixing Red + Blue?' }, ans: { visual: '🟣', label: { ar: 'البنفسجي', en: 'Purple' } }, w1: { visual: '🟡', label: { ar: 'الأصفر', en: 'Yellow' } }, w2: { visual: '🟠', label: { ar: 'البرتقالي', en: 'Orange' } }, exp: { ar: 'الأحمر + الأزرق = بنفسجي.', en: 'Red + Blue = Purple.' } },
    { id: 'ew-9', prompt: { ar: 'ماذا نفعل قبل تناول الطعام للحفاظ على نظافتنا؟', en: 'What should we do before eating to stay healthy?' }, ans: { visual: '🧼', label: { ar: 'غسل اليدين بالماء والصابون', en: 'Wash hands with soap & water' } }, w1: { visual: '🎨', label: { ar: 'اللعب بالتراب', en: 'Play in mud' } }, w2: { visual: '😴', label: { ar: 'النوم فوراً', en: 'Go straight to sleep' } }, exp: { ar: 'غسل اليدين يحمينا من الجراثيم.', en: 'Washing hands keeps germs away.' } },
    { id: 'ew-10', prompt: { ar: 'أي طائر ضخم يشتهر بصوته في الليل وعينيه الواسعتين؟', en: 'Which wise bird is famous for big eyes at night?' }, ans: { visual: '🦉', label: { ar: 'البومة', en: 'Owl' } }, w1: { visual: '🐧', label: { ar: 'البطريق', en: 'Penguin' } }, w2: { visual: '🦆', label: { ar: 'البطة', en: 'Duck' } }, exp: { ar: 'البومة طائر ليلي ذو عينين واسعتين.', en: 'Owls are nocturnal birds with wide eyes.' } },
    { id: 'ew-11', prompt: { ar: 'كم ضلعاً للمربع؟', en: 'How many equal sides does a square have?' }, ans: { visual: '🟦', label: { ar: '4 أضلاع', en: '4 sides' } }, w1: { visual: '🔺', label: { ar: '3 أضلاع', en: '3 sides' } }, w2: { visual: '⭕', label: { ar: '0 أضلاع', en: '0 sides' } }, exp: { ar: 'المربع له 4 أضلاع متساوية.', en: 'A square has 4 equal sides.' } },
    { id: 'ew-12', prompt: { ar: 'ماذا تحتاج البذرة لتنمو وتصبح نبتة؟', en: 'What does a seed need to sprout and grow?' }, ans: { visual: '💧', label: { ar: 'الماء وضوء الشمس', en: 'Water & Sunlight' } }, w1: { visual: '🧊', label: { ar: 'الثلج فقط', en: 'Only Ice' } }, w2: { visual: '🪨', label: { ar: 'حجارة مغلقة', en: 'Closed Rocks' } }, exp: { ar: 'تحتاج البذور للماء والهواء وضوء الشمس.', en: 'Seeds need water, air, and sunlight.' } },
  ];

  // Add extraWorldItems plus color-object identification variants to reach 40+ colors-science items
  extraWorldItems.forEach((ew, idx) => {
    bank.push({
      id: `q-cs-extra-${ew.id}`,
      subject: 'colors-science',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: 'recognition',
      difficulty: 1,
      lessonRefId: 'science-colors-shapes',
      lessonTitle: { ar: 'العلوم والطبيعة والأشكال', en: 'Science, Nature & Shapes' },
      prompt: ew.prompt,
      options: [
        { id: 'a', label: ew.ans.label, visual: ew.ans.visual },
        { id: 'b', label: ew.w1.label, visual: ew.w1.visual },
        { id: 'c', label: ew.w2.label, visual: ew.w2.visual },
      ].sort((x, y) => (idx % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: ew.exp,
      published: true,
    });
  });

  ACADEMY_COLORS.forEach((col, idx) => {
    const otherA = ACADEMY_COLORS[(idx + 1) % ACADEMY_COLORS.length];
    const otherB = ACADEMY_COLORS[(idx + 4) % ACADEMY_COLORS.length];
    bank.push({
      id: `q-cs-swatch-${col.id}`,
      subject: 'colors-science',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: 'matching',
      difficulty: 1,
      lessonRefId: `deep-color-${col.id}`,
      lessonTitle: { ar: `تطبيق اللون ${col.name.ar}`, en: `Applying ${col.name.en}` },
      prompt: {
        ar: `اختر الرمز اللوني المطابق لكلمة (${col.name.ar}):`,
        en: `Choose the color name matching ${col.emojis[0]}:`,
      },
      options: [
        { id: 'a', label: col.name, visual: col.emojis[0] },
        { id: 'b', label: otherA.name, visual: otherA.emojis[0] },
        { id: 'c', label: otherB.name, visual: otherB.emojis[0] },
      ].sort((x, y) => (idx % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: { ar: `${col.name.ar} — ${col.name.en}`, en: `${col.name.en} — ${col.name.ar}` },
      published: true,
    });
  });

  // Add second round of unique color/shape visual identification questions so colors-science > 40 questions
  ACADEMY_COLORS.forEach((col, idx) => {
    const otherA = ACADEMY_COLORS[(idx + 3) % ACADEMY_COLORS.length];
    const otherB = ACADEMY_COLORS[(idx + 6) % ACADEMY_COLORS.length];
    bank.push({
      id: `q-cs-identify-${col.id}`,
      subject: 'colors-science',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: 'recognition',
      difficulty: 1,
      lessonRefId: `deep-color-${col.id}`,
      lessonTitle: { ar: `تمييز اللون ${col.name.ar}`, en: `Recognizing ${col.name.en}` },
      prompt: {
        ar: `أي لون ينتمي إلى: ${col.examples.ar}؟`,
        en: `Which color matches: ${col.examples.en}?`,
      },
      options: [
        { id: 'a', label: col.name, visual: col.emojis },
        { id: 'b', label: otherA.name, visual: otherA.emojis },
        { id: 'c', label: otherB.name, visual: otherB.emojis },
      ].sort((x, y) => (idx % 2 === 0 ? y.id.localeCompare(x.id) : x.id.localeCompare(y.id))),
      correctOptionId: 'a',
      explanation: { ar: `الإجابة: ${col.name.ar}.`, en: `Answer: ${col.name.en}.` },
      published: true,
    });
  });

  for (let num = 2; num <= 11; num++) {
    bank.push({
      id: `q-math-after-${num}`,
      subject: 'math',
      ageGroups: ['3-4', '5-6', '7', '8'],
      type: 'sequence',
      difficulty: 1,
      lessonRefId: 'math-count-1-5',
      lessonTitle: { ar: `العدد التالي للعدد ${num}`, en: `Number After ${num}` },
      prompt: {
        ar: `ما العدد الذي يأتي مباشرة بعد العدد ${num}؟`,
        en: `Which number comes right after ${num}?`,
      },
      options: [
        { id: 'a', label: { ar: String(num + 1), en: String(num + 1) }, visual: String(num + 1) },
        { id: 'b', label: { ar: String(num - 1), en: String(num - 1) }, visual: String(num - 1) },
        { id: 'c', label: { ar: String(num + 2), en: String(num + 2) }, visual: String(num + 2) },
      ].sort((x, y) => (num % 2 === 0 ? x.id.localeCompare(y.id) : y.id.localeCompare(x.id))),
      correctOptionId: 'a',
      explanation: { ar: `بعد ${num} يأتي ${num + 1}.`, en: `Right after ${num} comes ${num + 1}.` },
      published: true,
    });
  }

  return bank;
}

export const VALIDATED_EXAM_BANK: ExamQuestionItem[] = buildComprehensiveExamBank();

export const AGE_CURRICULUM_OUTCOMES: Record<
  AgeGroupId,
  {
    title: LocalizedText;
    focusAreas: LocalizedText[];
    expectedOutcome: LocalizedText;
    guidanceStyle: LocalizedText;
  }
> = {
  '3-4': {
    title: { ar: 'منهج الاكتشاف المبكر (٣–٤ سنوات)', en: 'Early Discovery Curriculum (Ages 3–4)' },
    focusAreas: [
      { ar: 'تمييز الألوان الأساسية والأشكال باللمس والصوت', en: 'Colors & Shapes via Touch & Voice' },
      { ar: 'التعرف على الحروف العربية والإنجليزية بصرياً وسمعياً', en: 'Visual & Audio Letter Recognition' },
      { ar: 'عدّ الكميات الصغيرة ١–١٠ ومطابقة الأشياء', en: 'Counting Small Quantities (1–10) & Matching' },
      { ar: 'الفرز والأنماط البسيطة والمفردات اليومية', en: 'Sorting, Simple Patterns & Everyday Words' },
    ],
    expectedOutcome: {
      ar: 'يتعرف الطفل على الألوان، الأشكال، الحروف الأولى، والكميات الصغيرة بثقة بدون الحاجة للقراءة.',
      en: 'Confident recognition of colors, shapes, first letters, and small quantities with zero reading required.',
    },
    guidanceStyle: {
      ar: 'تعليمات صوتية قصيرة + أزرار كبيرة + أنشطة لعب لطيفة',
      en: 'Short voice cues + large targets + gentle playful pacing',
    },
  },
  '5-6': {
    title: { ar: 'منهج التأسيس والقراءة المبكرة (٥–٦ سنوات)', en: 'Foundations & Literacy Readiness (Ages 5–6)' },
    focusAreas: [
      { ar: 'الحروف العربية ٢٨ كاملة + التتبع والأشكال', en: 'All 28 Arabic Letters + Forms & Tracing' },
      { ar: 'الحروف الإنجليزية A–Z + الأصوات الصوتية (Phonics)', en: 'English A–Z + Letter Sounds & Phonics' },
      { ar: 'العد ١–٢٠ وبدايات الجمع والطرح بالكميات', en: 'Numbers 1–20 + Intro Addition & Subtraction' },
      { ar: 'تكوين الكلمات البسيطة والتفكير المنطقي', en: 'Simple Word Building & Pattern Logic' },
    ],
    expectedOutcome: {
      ar: 'يميز الطفل الحروف وأصواتها ويكوّن كلمات قصيرة ويحل عمليات جمع وطرح بسيطة.',
      en: 'Recognizes full alphabets & sounds, builds short words, and solves early addition/subtraction.',
    },
    guidanceStyle: {
      ar: 'توجيه تفاعلي متعدد الخطوات + تتبع الكتابة + ألعاب تطبيق',
      en: 'Guided multi-step lessons + tracing + interactive application',
    },
  },
  '7': {
    title: { ar: 'منهج التعمق والفهم (٧ سنوات)', en: 'Reading & Reasoning Curriculum (Age 7)' },
    focusAreas: [
      { ar: 'قراءة الكلمات والجمل القصيرة وفهم المقروء', en: 'Words, Short Sentences & Reading Comprehension' },
      { ar: 'الإملاء العربي والصوتيات الإنجليزية والقراءة', en: 'Arabic Spelling & English Phonics Reading' },
      { ar: 'الجمع والطرح حتى ٥٠ ومقدمة الضرب بالمجموعات', en: 'Addition/Subtraction to 50 & Intro Multiplication' },
      { ar: 'حل المشكلات والتفكير المنطقي والعلوم', en: 'Logical Reasoning, Science & Problem Solving' },
    ],
    expectedOutcome: {
      ar: 'يقرأ جملاً قصيرة ويفهم معناها ويستخدم المجموعات المتساوية والضرب البسيط في حل المسائل.',
      en: 'Reads short sentences with comprehension and uses equal groups & early multiplication in problems.',
    },
    guidanceStyle: {
      ar: 'استكشاف مستقل + تحديات تحليلية + تقوية بالمراجعة المتباعدة',
      en: 'Independent practice + analytical challenges + spaced revision',
    },
  },
  '8': {
    title: { ar: 'منهج الإتقان والتفكير النقدي (٨ سنوات)', en: 'Mastery & Critical Thinking Curriculum (Age 8)' },
    focusAreas: [
      { ar: 'فهم المقروء وتنمية المفردات وأساسيات القواعد', en: 'Reading Comprehension, Vocabulary & Grammar' },
      { ar: 'الإملاء وبناء الجمل الصحيحة بالعربية والإنجليزية', en: 'Spelling & Sentence Construction (AR/EN)' },
      { ar: 'الضرب والقسمة والكسور والمسائل متعددة الخطوات', en: 'Multiplication, Division, Fractions & Multi-Step Math' },
      { ar: 'العلوم والفضاء والجغرافيا والتفكير النقدي', en: 'Science, Space, Geography & Critical Reasoning' },
    ],
    expectedOutcome: {
      ar: 'يفهم النصوص ويحل مسائل متعددة الخطوات تشمل الضرب والقسمة والكسور ويطبق المعرفة في مواقف جديدة.',
      en: 'Comprehends passages, solves multi-step problems with multiplication/division/fractions, and applies reasoning.',
    },
    guidanceStyle: {
      ar: 'مشاريع تطبيقية + اختبارات تحقق مستقلة + مراجعة ذكية',
      en: 'Applied challenges + independent verification + adaptive review',
    },
  },
};

