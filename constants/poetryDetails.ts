// Enhanced poetry form templates with detailed guidance
const poetryForms = [
  {
    value: "freeform",
    label: "Free Verse",
    desc: "No structure - pure expression",
    icon: "🎨",
    guide: "Let your creativity flow without constraints",
  },
  {
    value: "sonnet",
    label: "Sonnet",
    desc: "14 lines with rhyme scheme",
    icon: "🌹",
    guide: "14 lines, typically ABAB CDCD EFEF GG",
    lines: 14,
  },
  {
    value: "haiku",
    label: "Haiku",
    desc: "3 lines: 5-7-5 syllables",
    icon: "🍃",
    guide: "Line 1: 5 syllables\nLine 2: 7 syllables\nLine 3: 5 syllables",
    lines: 3,
  },
  {
    value: "limerick",
    label: "Limerick",
    desc: "5 lines, AABBA rhyme",
    icon: "😄",
    guide: "Humorous five-line poem with AABBA rhyme scheme",
    lines: 5,
  },
  {
    value: "villanelle",
    label: "Villanelle",
    desc: "19 lines, repeating refrains",
    icon: "🔄",
    guide: "19 lines with two repeating rhymes and refrains",
    lines: 19,
  },
  {
    value: "ballad",
    label: "Ballad",
    desc: "Narrative poem in stanzas",
    icon: "🎭",
    guide: "Tell a story in quatrains with ABAB or ABCB rhyme",
  },
  {
    value: "tanka",
    label: "Tanka",
    desc: "5 lines: 5-7-5-7-7 syllables",
    icon: "🎋",
    guide: "Extended haiku with 5-7-5-7-7 syllable pattern",
    lines: 5,
  },
  {
    value: "acrostic",
    label: "Acrostic",
    desc: "First letters spell a word",
    icon: "🔤",
    guide: "First letter of each line spells a word vertically",
  },
  {
    value: "concrete",
    label: "Concrete",
    desc: "Shape matches subject",
    icon: "🖼️",
    guide: "Arrange words to form a visual shape",
  },
];

// Writing themes for inspiration
const writingThemes = [
  {
    name: "Nature",
    emoji: "🌿",
    prompts: ["seasons", "landscapes", "weather"],
  },
  { name: "Love", emoji: "💕", prompts: ["romance", "heartbreak", "devotion"] },
  { name: "Identity", emoji: "🪞", prompts: ["self", "heritage", "growth"] },
  { name: "Memory", emoji: "📸", prompts: ["nostalgia", "childhood", "loss"] },
  { name: "Dreams", emoji: "✨", prompts: ["aspirations", "fantasy", "hope"] },
  { name: "Urban", emoji: "🏙️", prompts: ["city life", "crowds", "isolation"] },
  { name: "Time", emoji: "⏳", prompts: ["aging", "moments", "eternity"] },
  { name: "Emotions", emoji: "🎭", prompts: ["joy", "sorrow", "rage"] },
];

// Color themes for different moods
const colorThemes = [
  { name: "Classic", bg: "#FFFFFF", text: "#1F2937", accent: "#6366F1" },
  { name: "Moonlight", bg: "#0F172A", text: "#E2E8F0", accent: "#93C5FD" },
  { name: "Vintage", bg: "#F4ECD8", text: "#5C4B37", accent: "#B8860B" },
  { name: "Lavender", bg: "#F3E5F5", text: "#4A148C", accent: "#9C27B0" },
  { name: "Ocean", bg: "#E0F7FA", text: "#004D40", accent: "#00ACC1" },
  { name: "Autumn", bg: "#FFF3E0", text: "#4E342E", accent: "#FF6F00" },
];

const prompts = [
      "Write about the space between heartbeats",
      "Describe color without naming it",
      "Capture a moment you wish you could return to",
      "Explore the weight of unsaid words",
      "Find beauty in something broken",
      "Write from the perspective of rain",
      "Describe silence in a crowded room",
      "Capture the feeling of almost",
      "Write about shadows and what they hide",
      "Explore the language of hands",
    ];

export { colorThemes, poetryForms, writingThemes,prompts };
