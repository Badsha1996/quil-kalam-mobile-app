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

export { getItemIcon };
