import { Story } from '../types/nonoland';

export const INTERACTIVE_STORIES: Story[] = [
  {
    id: 'story-lost-starlight-34',
    title: {
      ar: 'نجمة نونو الصغيرة الضائعة',
      en: "Nono's Little Lost Star",
    },
    summary: {
      ar: 'قصة بصرية لطيفة لعمر ٣–٤ سنوات عن الألوان ومساعدة الأصدقاء.',
      en: 'A gentle picture story for ages 3–4 about colors and helping forest friends.',
    },
    ageEligibility: ['3-4', '5-6'],
    worldId: 'colors-shapes',
    coverEmoji: '🌟',
    accentColor: '#FF78B7',
    startSceneId: 's1',
    scenes: {
      s1: {
        id: 's1',
        text: {
          ar: 'في صباحٍ مشمس في حديقة الألوان، وجد نونو نجمةً صغيرة حزينة تبحث عن لونها الذهبي اللامع. من سنسأل أولاً؟',
          en: 'One sunny morning in Colors Garden, Nono found a little star looking for its golden glow. Who should we ask first?',
        },
        illustrationEmoji: '🦊🌟🌳',
        bgMood: 'from-[#FFF8E9] via-[#FFE9F4] to-[#E6F7FF]',
        nonoLine: {
          ar: 'هيا نساعد النجمة! اختر أين نبحث أولاً.',
          en: "Let's help the little star! Tap where we should look first.",
        },
        choices: [
          {
            id: 'c1',
            label: { ar: 'نسأل الفراشة لولا عند الزهور الصفراء', en: 'Ask Lola the Butterfly by the yellow flowers' },
            nextSceneId: 's2-butterfly',
            educationalTag: { ar: 'تمييز الألوان', en: 'Color Discovery' },
          },
          {
            id: 'c2',
            label: { ar: 'نسأل القرد كوكو عند الشجرة الخضراء', en: 'Ask Coco the Monkey by the green tree' },
            nextSceneId: 's2-monkey',
            educationalTag: { ar: 'اكتشاف الطبيعة', en: 'Nature Discovery' },
          },
        ],
      },
      's2-butterfly': {
        id: 's2-butterfly',
        text: {
          ar: 'قالت الفراشة لولا: رأيتُ ضوءاً أصفر يلمع فوق الغيمة البيضاء! هل نقفز نحو الغيمة أم نعدّ ٣ زهرات أولاً؟',
          en: 'Lola the Butterfly smiled: "I saw a yellow shimmer above the white cloud!" Should we hop to the cloud or count 3 flowers first?',
        },
        illustrationEmoji: '🦋🌼☁️',
        bgMood: 'from-[#FFF4D1] via-[#FFE6F2] to-[#FFF8E9]',
        nonoLine: {
          ar: 'لولا تعرف الطريق! ما اختيارك؟',
          en: 'Lola knows a clue! What shall we do?',
        },
        choices: [
          {
            id: 'c3',
            label: { ar: 'نعدّ ٣ زهرات صفراء: ١، ٢، ٣!', en: 'Count 3 yellow flowers: 1, 2, 3!' },
            nextSceneId: 's3-ending',
          },
          {
            id: 'c4',
            label: { ar: 'نلوّح للغيمة كي تهبط إلينا بلطف', en: 'Wave gently to invite the cloud down' },
            nextSceneId: 's3-ending',
          },
        ],
      },
      's2-monkey': {
        id: 's2-monkey',
        text: {
          ar: 'ضحك القرد كوكو وأشار إلى قوس قزح كبير! قال: النجمة تحب اللون الأصفر في قوس قزح. لنذهب إليه معاً!',
          en: 'Coco the Monkey pointed up at a bright rainbow! "Stars love the yellow arch!" Shall we climb the soft hill together?',
        },
        illustrationEmoji: '🐒🌈🍌',
        bgMood: 'from-[#E2F9EC] via-[#FFF6D6] to-[#E5F6FF]',
        nonoLine: {
          ar: 'كوكو صديق رائع! هيا بنا!',
          en: 'Coco is so helpful! Let us go!',
        },
        choices: [
          {
            id: 'c5',
            label: { ar: 'نسير على جسر قوس قزح الملون', en: 'Walk across the colorful rainbow bridge' },
            nextSceneId: 's3-ending',
          },
        ],
      },
      's3-ending': {
        id: 's3-ending',
        text: {
          ar: 'يا للروعة! استعادت النجمة الصغيرة ضوءها الذهبي بفضلك وبفضل لطفك مع الأصدقاء. رقص الجميع تحت السماء الصافية!',
          en: 'Hurray! Because of your kindness and keen eyes, the little star found its golden sparkle again and danced across the sky!',
        },
        illustrationEmoji: '✨🌟🎉🦊',
        bgMood: 'from-[#FFF0B8] via-[#E8DAFF] to-[#E1F7FF]',
        nonoLine: {
          ar: 'أحسنت يا صديقي! لقد ساعدت النجمة!',
          en: 'You did it! The star is shining brightly because of you!',
        },
        isEnding: true,
        rewardStars: 4,
      },
    },
  },
  {
    id: 'story-secret-garden-56',
    title: {
      ar: 'مغارة الحروف المفقودة',
      en: 'The Secret Cove of Missing Letters',
    },
    summary: {
      ar: 'قصة تفاعلية لعمر ٥–٦ سنوات تجمع بين العربية والإنجليزية وحل الألغاز.',
      en: 'An interactive adventure for ages 5–6 blending letter clues and teamwork.',
    },
    ageEligibility: ['5-6', '7'],
    worldId: 'arabic-letters',
    coverEmoji: '🦜',
    accentColor: '#8054D9',
    startSceneId: 'a1',
    scenes: {
      a1: {
        id: 'a1',
        text: {
          ar: 'وصل نونو والعصفور فصيح إلى بوابة مكتوب عليها: "افتحي يا بوابة بحرف يبدأ به اسم (أسد) و(أرنب)". أي مفتاح نختار؟',
          en: 'Nono and Faseeh reached a wooden gate with a riddle: "Open me with the letter that starts Apple and Ant!" Which key fits?',
        },
        illustrationEmoji: '🚪🔑🦁',
        bgMood: 'from-[#F1E8FF] via-[#FFF5D6] to-[#FFF8E9]',
        nonoLine: {
          ar: 'فكر بصوت الكلمة في أولها!',
          en: 'Listen closely to the very first sound of the word!',
        },
        choices: [
          {
            id: 'ac1',
            label: { ar: 'مفتاح حرف الألف (أ) / A', en: 'The Letter A / أ Key' },
            nextSceneId: 'a2-open',
          },
          {
            id: 'ac2',
            label: { ar: 'نطلب تلميحاً من العصفور فصيح', en: 'Ask Faseeh the Songbird for a sound clue' },
            nextSceneId: 'a2-clue',
          },
        ],
      },
      'a2-clue': {
        id: 'a2-clue',
        text: {
          ar: 'غنى فصيح بصوت عذب: "أَ... أَسَد... أَ... أَرْنَب! وبالإنجليزية A... Apple!" الآن أصبح الحل واضحاً تماماً.',
          en: 'Faseeh sang sweetly: "Aaa... Apple! Aaa... Ant!" Now the magic gate key is crystal clear.',
        },
        illustrationEmoji: '🦜🎵✨',
        bgMood: 'from-[#E2F6FF] via-[#F2E9FF] to-[#FFF8E9]',
        nonoLine: {
          ar: 'رائع! جرب المفتاح الصحيح الآن.',
          en: 'Aha! Now turn the matching key!',
        },
        choices: [
          {
            id: 'ac3',
            label: { ar: 'أدر مفتاح (أ / A) وافتح المغارة', en: 'Turn the (أ / A) key to open the cove' },
            nextSceneId: 'a2-open',
          },
        ],
      },
      'a2-open': {
        id: 'a2-open',
        text: {
          ar: 'انفتحت البوابة وكشفت عن مكتبة مضيئة مليئة بالكتب الطائرة والحروف الذهبية! احتفل نونو وفصيح بهذا الاكتشاف الرائع.',
          en: 'Click! The gate swung open to reveal a glowing cove of floating storybooks and golden letters!',
        },
        illustrationEmoji: '📚✨🦜🦊',
        bgMood: 'from-[#EDE2FF] via-[#DDF7EA] to-[#FFF8E9]',
        nonoLine: {
          ar: 'عمل مذهل! كل حرف يفتح عالماً جديداً.',
          en: 'Amazing work! Every letter unlocks a new world.',
        },
        isEnding: true,
        rewardStars: 5,
      },
    },
  },
  {
    id: 'story-eco-mission-78',
    title: {
      ar: 'مهمة إنقاذ النهر الكريستالي',
      en: 'Mission: Save the Crystal River',
    },
    summary: {
      ar: 'مهمة استكشافية لعمر ٧–٨ سنوات تعتمد على التفكير العلمي والقرارات البيئية.',
      en: 'A science & critical-thinking quest for ages 7–8 about protecting nature.',
    },
    ageEligibility: ['7', '8'],
    worldId: 'science-galaxy',
    coverEmoji: '🌊',
    accentColor: '#39BDF2',
    startSceneId: 'e1',
    scenes: {
      e1: {
        id: 'e1',
        text: {
          ar: 'لاحظت أسترا أن منسوب المياه في النهر الكريستالي انخفض فجأة، وأن الأسماك تبحث عن ماء نقي. بصفتك محققاً علمياً، ما أول خطوة تتخذها؟',
          en: 'Astra noticed the Crystal River running low and cloudy. As the team science detective, what is your first investigative step?',
        },
        illustrationEmoji: '🔭💧🐟',
        bgMood: 'from-[#DFF4FF] via-[#E3FCEF] to-[#FFF8E9]',
        nonoLine: {
          ar: 'العالم الصغير يلاحظ ويفحص الدليل قبل القرار.',
          en: 'A great scientist observes evidence before choosing!',
        },
        choices: [
          {
            id: 'ec1',
            label: { ar: 'فحص مصدر المياه في أعلى الجبل بالعدسة والبوصلة', en: 'Inspect the mountain spring source with lens & compass' },
            nextSceneId: 'e2-spring',
          },
          {
            id: 'ec2',
            label: { ar: 'تصميم مرشح طبيعي من الرمل والحصى لتنقية المياه', en: 'Build a natural sand-and-pebble water filter' },
            nextSceneId: 'e2-filter',
          },
        ],
      },
      'e2-spring': {
        id: 'e2-spring',
        text: {
          ar: 'عند النبع، وجدتَ أغصاناً سقطت بعد العاصفة وسدت المجرى! وإذا أعدنا توجيه المياه وزرعنا أشجاراً على الضفة، سنحمي التربة مستقبلاً.',
          en: 'At the spring, fallen storm branches had blocked the flow! Clearing the path and planting roots along the bank will protect the soil too.',
        },
        illustrationEmoji: '🌲⛰️💦',
        bgMood: 'from-[#DDF9EB] via-[#DFF4FF] to-[#FFF8E9]',
        nonoLine: {
          ar: 'اكتشاف ذكي! كيف نكمل الحل المستدام؟',
          en: 'Smart discovery! How do we make the fix last?',
        },
        choices: [
          {
            id: 'ec3',
            label: { ar: 'فتح المجرى وغرس شجيرات تثبت ضفة النهر', en: 'Clear the stream and plant shrubs to anchor the bank' },
            nextSceneId: 'e3-victory',
          },
        ],
      },
      'e2-filter': {
        id: 'e2-filter',
        text: {
          ar: 'نجح المرشح الطبقي في تنقية عينة الماء! والآن لاحظت أن الطين القادم من أعلى التل هو السبب الرئيسي للعكارة.',
          en: 'Your layered pebble-and-sand filter cleared the sample! You also deduced that loose soil upstream is causing the cloudiness.',
        },
        illustrationEmoji: '🧪🪨✨',
        bgMood: 'from-[#E5F2FF] via-[#FFF6DD] to-[#FFF8E9]',
        nonoLine: {
          ar: 'ممتاز! تجربة ناجحة تقودنا للحل الجذري.',
          en: 'Brilliant experiment! Now let us solve the root cause.',
        },
        choices: [
          {
            id: 'ec4',
            label: { ar: 'التعاون مع القرية لزراعة الأشجار وتنقية النبع', en: 'Partner with the village to plant trees along the spring' },
            nextSceneId: 'e3-victory',
          },
        ],
      },
      'e3-victory': {
        id: 'e3-victory',
        text: {
          ar: 'عاد النهر الكريستالي يتدفق بصفاء ونقاء! قادت قراراتك العلمية الدقيقة وتعاونك مع القرية إلى حماية الطبيعة للجميع.',
          en: 'The Crystal River sparkles once more! Your scientific observation and sustainable plan protected the entire ecosystem.',
        },
        illustrationEmoji: '🌊🌈🌱🏆',
        bgMood: 'from-[#DDF9EB] via-[#E0F3FF] to-[#FFF4D6]',
        nonoLine: {
          ar: 'تفكير علمي مبهر يا مستكشف!',
          en: 'Outstanding scientific reasoning, Explorer!',
        },
        isEnding: true,
        rewardStars: 6,
      },
    },
  },
];
