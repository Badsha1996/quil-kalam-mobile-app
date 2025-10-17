const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-500";
    case "in_progress":
      return "bg-blue-500";
    case "revision":
      return "bg-yellow-500";
    case "complete":
      return "bg-green-500";
    case "published":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "novel":
      return "📖";
    case "poetry":
      return "✍🏻";
    case "shortStory":
      return "📝";
    case "manuscript":
      return "📄";
    default:
      return "📚";
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatWordCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export { formatDate, formatWordCount, getStatusColor, getTypeIcon };
