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

// Replace your existing colorThemes array with this:

const colorThemes = [
  // 1. Minimal & Clean
  {
    name: "Pure White",
    bg: "#FFFFFF",
    text: "#1A1A1A",
    accent: "#3B82F6",
    category: "minimal"
  },
  
  // 2. Dark Modern
  {
    name: "Midnight",
    bg: "#0F172A",
    text: "#F1F5F9",
    accent: "#60A5FA",
    category: "dark"
  },
  
  // 3. Warm & Cozy
  {
    name: "Parchment",
    bg: "#FEF3C7",
    text: "#451A03",
    accent: "#D97706",
    category: "warm"
  },
  
  // 4. Cool & Calm
  {
    name: "Arctic",
    bg: "#ECFEFF",
    text: "#164E63",
    accent: "#0EA5E9",
    category: "cool"
  },
  
  // 5. Deep Focus
  {
    name: "Deep Forest",
    bg: "#064E3B",
    text: "#D1FAE5",
    accent: "#10B981",
    category: "nature"
  },
  
  // 6. Sunset Glow
  {
    name: "Sunset",
    bg: "#FEF3C7",
    text: "#7C2D12",
    accent: "#F59E0B",
    category: "warm"
  },
  
  // 7. Ocean Depths
  {
    name: "Ocean",
    bg: "#E0F2FE",
    text: "#0C4A6E",
    accent: "#0284C7",
    category: "cool"
  },
  
  // 8. Modern Charcoal
  {
    name: "Charcoal",
    bg: "#1E293B",
    text: "#E2E8F0",
    accent: "#8B5CF6",
    category: "dark"
  },
  
  // 9. Lavender Dream
  {
    name: "Lavender",
    bg: "#FAF5FF",
    text: "#4C1D95",
    accent: "#A855F7",
    category: "soft"
  },
  
  // 10. Sage Green
  {
    name: "Sage",
    bg: "#F0FDF4",
    text: "#14532D",
    accent: "#22C55E",
    category: "nature"
  },
  
  // 11. Rose Quartz
  {
    name: "Rose",
    bg: "#FDF2F8",
    text: "#831843",
    accent: "#EC4899",
    category: "soft"
  },
  
  // 12. Amber Gold
  {
    name: "Amber",
    bg: "#FFFBEB",
    text: "#78350F",
    accent: "#D97706",
    category: "warm"
  },
  
  // 13. Slate Blue
  {
    name: "Slate Blue",
    bg: "#F8FAFC",
    text: "#1E293B",
    accent: "#475569",
    category: "minimal"
  },
  
  // 14. Noir
  {
    name: "Noir",
    bg: "#000000",
    text: "#E5E7EB",
    accent: "#FFFFFF",
    category: "dark"
  },
  
  // 15. Sepia
  {
    name: "Sepia",
    bg: "#F5E6D3",
    text: "#5C4033",
    accent: "#A0522D",
    category: "vintage"
  },
  
  // 16. Misty Gray
  {
    name: "Misty Gray",
    bg: "#F9FAFB",
    text: "#374151",
    accent: "#6B7280",
    category: "minimal"
  },
  
  // 17. Emerald Night
  {
    name: "Emerald",
    bg: "#022C22",
    text: "#D1FAE5",
    accent: "#34D399",
    category: "nature"
  },
  
  // 18. Twilight
  {
    name: "Twilight",
    bg: "#1E1B4B",
    text: "#E0E7FF",
    accent: "#818CF8",
    category: "dark"
  },
  
  // 19. Cream
  {
    name: "Cream",
    bg: "#FEFCE8",
    text: "#422006",
    accent: "#EAB308",
    category: "warm"
  },
  
  // 20. Graphite
  {
    name: "Graphite",
    bg: "#111827",
    text: "#F3F4F6",
    accent: "#9CA3AF",
    category: "dark"
  },
  
  // Bonus: High Contrast for Accessibility
  {
    name: "High Contrast",
    bg: "#000000",
    text: "#FFFFFF",
    accent: "#FFFF00",
    category: "accessibility"
  }
];

// Optional: Group themes by category for better organization
const themeCategories = {
  minimal: ["Pure White", "Slate Blue", "Misty Gray"],
  dark: ["Midnight", "Charcoal", "Noir", "Twilight", "Graphite"],
  warm: ["Parchment", "Sunset", "Amber", "Cream"],
  cool: ["Arctic", "Ocean"],
  nature: ["Deep Forest", "Sage", "Emerald"],
  soft: ["Lavender", "Rose"],
  vintage: ["Sepia"],
  accessibility: ["High Contrast"]
};

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
