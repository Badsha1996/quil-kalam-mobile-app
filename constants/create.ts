const projectTypes = [
  { value: "novel", label: "Novel", icon: "📖", desc: "Long-form fiction" },
  { value: "poetry", label: "Poetry", icon: "✍🏻", desc: "Verses & poems" },
  {
    value: "shortStory",
    label: "Short Story",
    icon: "📝",
    desc: "Brief narratives",
  },
  {
    value: "manuscript",
    label: "Manuscript",
    icon: "📄",
    desc: "General writing",
  },
];

const templates = [
  {
    value: "freeform",
    label: "Freeform",
    desc: "No structure - start from scratch",
    icon: "🎨",
  },
  {
    value: "heros_journey",
    label: "Hero's Journey",
    desc: "12-stage mythological story structure",
    icon: "🦸",
  },
  {
    value: "three_act",
    label: "Three Act Structure",
    desc: "Classic beginning-middle-end structure",
    icon: "🎭",
  },
  {
    value: "save_the_cat",
    label: "Save The Cat",
    desc: "15-beat screenplay structure",
    icon: "🐱",
  },
  {
    value: "seven_point",
    label: "Seven Point Structure",
    desc: "Dan Wells' plot structure system",
    icon: "📊",
  },
  {
    value: "snowflake",
    label: "Snowflake Method",
    desc: "Start simple and expand",
    icon: "❄️",
  },
];

const genres = [
  "Fiction",
  "Fantasy",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Horror",
  "Thriller",
  "Literary",
  "Historical",
  "Contemporary",
  "Young Adult",
  "Adventure",
  "Drama",
  "Other",
];

export { genres, projectTypes, templates };
