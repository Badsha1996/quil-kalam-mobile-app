const getItemIcon = (itemType: string): string => {
  const icons: Record<string, string> = {
    folder: "📁",
    document: "📄",
    character: "👤",
    location: "📍",
    note: "📝",
    research: "🔬",
    chapter: "📖",
    scene: "🎬",
  };
  return icons[itemType] || "📄";
};

const fontFamilies = [
  { name: "System", value: "System" },
  { name: "Georgia", value: "Georgia" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Arial", value: "Arial" },
  { name: "Helvetica", value: "Helvetica" },
  { name: "Courier New", value: "Courier New" },
  { name: "Palatino", value: "Palatino" },
  { name: "Garamond", value: "Garamond" },
];

const themes = [
  { name: "Light", bg: "#FFFFFF", text: "#1F2937" },
  { name: "Dark", bg: "#1F2937", text: "#F3F4F6" },
  { name: "Sepia", bg: "#F4ECD8", text: "#5C4B37" },
  { name: "Night", bg: "#0F172A", text: "#E2E8F0" },
  { name: "Cream", bg: "#FFF8E7", text: "#4A4A4A" },
  { name: "Solarized", bg: "#FDF6E3", text: "#657B83" },
];

export { getItemIcon, themes, fontFamilies };
