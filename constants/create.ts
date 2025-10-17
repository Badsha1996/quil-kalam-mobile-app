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
  { value: "freeform", label: "Freeform", desc: "No structure" },
  { value: "heros_journey", label: "Hero's Journey", desc: "12-stage arc" },
  { value: "three_act", label: "Three Act", desc: "Classic structure" },
  { value: "save_the_cat", label: "Save The Cat", desc: "Beat sheet" },
  { value: "seven_point", label: "Seven Point", desc: "Plot structure" },
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
