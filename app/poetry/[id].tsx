import Background from "@/components/common/Background";
import GlobalAlert from "@/components/common/GlobalAlert";
import KeyboardAvoidingLayout from "@/components/common/KeyboardAvoidingLayout";
import {
  colorThemes,
  poetryForms,
  prompts,
  writingThemes,
} from "@/constants/poetryDetails";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  getFilesByProject,
  getFoldersByProject,
  getProject,
  getProjectStats,
  getSetting,
  getWritingSettings,
  setSetting,
  setWritingSetting,
  updateFile,
  updateProject,
} from "@/utils/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
  Share,
  FlatList,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ==================== CONSTANTS ====================
const COMMON_RHYMES: Record<string, string[]> = {
  ight: [
    "night",
    "light",
    "bright",
    "fight",
    "sight",
    "might",
    "right",
    "flight",
    "tight",
    "delight",
  ],
  ove: ["love", "dove", "above", "shove", "glove"],
  ay: [
    "day",
    "way",
    "say",
    "play",
    "stay",
    "ray",
    "may",
    "gray",
    "pray",
    "sway",
  ],
  eart: ["heart", "start", "part", "art", "cart", "dart", "smart", "apart"],
  ow: [
    "flow",
    "grow",
    "know",
    "show",
    "slow",
    "glow",
    "snow",
    "throw",
    "below",
  ],
  ine: [
    "line",
    "mine",
    "fine",
    "wine",
    "shine",
    "divine",
    "sign",
    "vine",
    "define",
  ],
  ate: [
    "fate",
    "late",
    "wait",
    "great",
    "state",
    "create",
    "gate",
    "hate",
    "mate",
  ],
  ound: [
    "sound",
    "found",
    "ground",
    "round",
    "bound",
    "wound",
    "around",
    "profound",
  ],
  een: [
    "seen",
    "green",
    "between",
    "dream",
    "screen",
    "serene",
    "queen",
    "keen",
  ],
  all: ["fall", "call", "small", "tall", "wall", "hall", "ball", "all"],
};

const POWER_WORDS = {
  emotion: [
    "ache",
    "yearn",
    "bliss",
    "sorrow",
    "fury",
    "tender",
    "fierce",
    "hollow",
    "radiant",
    "shattered",
  ],
  nature: [
    "bloom",
    "wither",
    "cascade",
    "whisper",
    "shimmer",
    "drift",
    "surge",
    "ember",
    "frost",
    "dusk",
  ],
  movement: [
    "dance",
    "soar",
    "plunge",
    "glide",
    "tremble",
    "sway",
    "rush",
    "linger",
    "spiral",
    "float",
  ],
  sensory: [
    "velvet",
    "bitter",
    "fragrant",
    "luminous",
    "crisp",
    "mellow",
    "sharp",
    "soft",
    "vivid",
    "pale",
  ],
  time: [
    "eternal",
    "fleeting",
    "ancient",
    "dawn",
    "twilight",
    "moment",
    "forever",
    "instant",
    "epoch",
    "timeless",
  ],
};

const MOOD_TAGS = [
  { emoji: "😢", label: "Melancholy", color: "#6B7280" },
  { emoji: "💕", label: "Romantic", color: "#EC4899" },
  { emoji: "🌟", label: "Hopeful", color: "#F59E0B" },
  { emoji: "😤", label: "Angry", color: "#EF4444" },
  { emoji: "🌙", label: "Dreamy", color: "#8B5CF6" },
  { emoji: "🍂", label: "Nostalgic", color: "#D97706" },
  { emoji: "⚡", label: "Intense", color: "#DC2626" },
  { emoji: "🌊", label: "Peaceful", color: "#0EA5E9" },
  { emoji: "🎭", label: "Dramatic", color: "#7C3AED" },
  { emoji: "🌸", label: "Gentle", color: "#F472B6" },
];

// ==================== HELPER FUNCTIONS ====================
const countSyllables = (word: string): number => {
  if (!word) return 0;
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
};

const countSyllablesInLine = (line: string): number => {
  return line
    .trim()
    .split(/\s+/)
    .reduce((sum, word) => sum + countSyllables(word), 0);
};

const wordsRhyme = (w1: string, w2: string): boolean => {
  if (!w1 || !w2 || w1 === w2) return false;
  return w1.slice(-3) === w2.slice(-3) || w1.slice(-2) === w2.slice(-2);
};

const detectRhymeScheme = (text: string): string => {
  if (!text) return "";
  const lines = text.split("\n").filter((l) => l.trim());
  const lastWords = lines.map((l) => {
    const words = l.trim().split(/\s+/);
    return (
      words[words.length - 1]?.toLowerCase().replace(/[.,!?;:'"]/g, "") || ""
    );
  });
  const rhymeMap = new Map();
  let currentLetter = 65;
  const scheme: string[] = [];
  lastWords.forEach((word) => {
    if (!word) {
      scheme.push("X");
      return;
    }
    let found = false;
    for (const [key, value] of rhymeMap) {
      if (wordsRhyme(key, word)) {
        scheme.push(value);
        found = true;
        break;
      }
    }
    if (!found) {
      const letter = String.fromCharCode(currentLetter);
      rhymeMap.set(word, letter);
      scheme.push(letter);
      currentLetter++;
    }
  });
  return scheme.join("");
};

const getWordEnding = (word: string): string => {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length < 2) return word;
  const vowels = "aeiou";
  for (let i = word.length - 1; i >= 0; i--) {
    if (vowels.includes(word[i])) return word.slice(i);
  }
  return word.slice(-2);
};

const findRhymes = (word: string): string[] => {
  if (!word) return [];
  const ending = getWordEnding(word.toLowerCase());
  for (const [key, rhymes] of Object.entries(COMMON_RHYMES)) {
    if (ending.includes(key) || key.includes(ending.slice(-2))) {
      return rhymes.filter((r) => r !== word.toLowerCase());
    }
  }
  return [];
};

const analyzeStressPattern = (line: string): string => {
  const words = line.trim().split(/\s+/);
  return words
    .map((word) => {
      const syllables = countSyllables(word);
      if (syllables === 1) return "x";
      if (syllables === 2) return "xX";
      return "x"
        .repeat(syllables)
        .split("")
        .map((_, i) => (i % 2 === 1 ? "X" : "x"))
        .join("");
    })
    .join(" ");
};

const getWordFrequency = (text: string): { word: string; count: number }[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .filter((item) => item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

const getAlliteration = (text: string): string[] => {
  const results: string[] = [];
  text.split("\n").forEach((line) => {
    const words = line
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i][0] === words[i + 1][0] && /[a-z]/.test(words[i][0])) {
        results.push(`${words[i]} ${words[i + 1]}`);
      }
    }
  });
  return results;
};

// Form Validators
const FORM_VALIDATORS: Record<
  string,
  {
    validate: (text: string) => {
      valid: boolean;
      message: string;
      details?: any;
    };
  }
> = {
  haiku: {
    validate: (text) => {
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length !== 3)
        return { valid: false, message: `Need 3 lines (have ${lines.length})` };
      const syllables = lines.map((l) => countSyllablesInLine(l));
      const match =
        syllables[0] === 5 && syllables[1] === 7 && syllables[2] === 5;
      return {
        valid: match,
        message: match
          ? "Perfect haiku! ✨"
          : `Syllables: ${syllables.join("-")} (need 5-7-5)`,
        details: { syllables },
      };
    },
  },
  tanka: {
    validate: (text) => {
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length !== 5)
        return { valid: false, message: `Need 5 lines (have ${lines.length})` };
      const syllables = lines.map((l) => countSyllablesInLine(l));
      const target = [5, 7, 5, 7, 7];
      const match = JSON.stringify(syllables) === JSON.stringify(target);
      return {
        valid: match,
        message: match
          ? "Perfect tanka! ✨"
          : `Syllables: ${syllables.join("-")} (need 5-7-5-7-7)`,
      };
    },
  },
  sonnet: {
    validate: (text) => {
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length !== 14)
        return {
          valid: false,
          message: `Need 14 lines (have ${lines.length})`,
        };
      const avgSyllables =
        lines.reduce((sum, l) => sum + countSyllablesInLine(l), 0) / 14;
      const iambic = avgSyllables >= 9 && avgSyllables <= 11;
      return {
        valid: lines.length === 14,
        message: iambic
          ? "Great sonnet structure! ✨"
          : `Avg ${avgSyllables.toFixed(1)} syllables/line (aim for 10)`,
      };
    },
  },
  limerick: {
    validate: (text) => {
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length !== 5)
        return { valid: false, message: `Need 5 lines (have ${lines.length})` };
      const scheme = detectRhymeScheme(text);
      const validScheme = scheme === "AABBA" || scheme === "AABBB";
      return {
        valid: validScheme,
        message: validScheme
          ? "Perfect limerick rhyme! ✨"
          : `Rhyme: ${scheme} (need AABBA)`,
      };
    },
  },
  villanelle: {
    validate: (text) => {
      const lines = text.split("\n").filter((l) => l.trim());
      return {
        valid: lines.length === 19,
        message:
          lines.length === 19
            ? "19 lines complete! ✨"
            : `Need 19 lines (have ${lines.length})`,
      };
    },
  },
  freeform: {
    validate: () => ({
      valid: true,
      message: "Free verse - express yourself! ✨",
    }),
  },
};

// ==================== MAIN COMPONENT ====================
const PoetryDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);

  // Core State
  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [poems, setPoems] = useState<any[]>([]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPoem, setEditingPoem] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [showRhymeModal, setShowRhymeModal] = useState(false);
  const [showWordPalette, setShowWordPalette] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Form State
  const [newPoemTitle, setNewPoemTitle] = useState("");
  const [newPoemContent, setNewPoemContent] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(
    null
  );
  const [selectedMood, setSelectedMood] = useState<
    (typeof MOOD_TAGS)[0] | null
  >(null);

  // Editor State
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
  const [autoSaveEnabled] = useState(true);
  const [showSyllableCount, setShowSyllableCount] = useState(true);
  const [rhymeWord, setRhymeWord] = useState("");
  const [foundRhymes, setFoundRhymes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Goals State
  const [dailyPoemGoal, setDailyPoemGoal] = useState(1);
  const [weeklyLineGoal, setWeeklyLineGoal] = useState(50);
  const [poemsToday, setPoemsToday] = useState(0);
  const [linesThisWeek, setLinesThisWeek] = useState(0);

  // Live Validation
  const [formValidation, setFormValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const [showPoemSearchModal, setShowPoemSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPoem, setSelectedPoem] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"title" | "author" | "both">(
    "both"
  );

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;
  const autoSaveTimer = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Simple helpers
  const countLines = (text: string) =>
    text?.split("\n").filter((l) => l.trim()).length || 0;
  const countStanzas = (text: string) =>
    text?.split(/\n\s*\n/).filter((s) => s.trim()).length || 0;
  const getReadingTime = (text: string) =>
    Math.ceil((text?.trim().split(/\s+/).filter(Boolean).length || 0) / 100);
  const generateInspiration = () =>
    prompts[Math.floor(Math.random() * prompts.length)];

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadProjectData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [projectId]);

  useEffect(() => {
    if (autoSaveEnabled && editingPoem) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(handleAutoSave, 3000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [editingPoem?.content, autoSaveEnabled]);

  useEffect(() => {
    if (editingPoem?.content && project?.writing_template) {
      const validator =
        FORM_VALIDATORS[project.writing_template] || FORM_VALIDATORS.freeform;
      setFormValidation(validator.validate(editingPoem.content));
    }
  }, [editingPoem?.content, project?.writing_template]);

  useEffect(() => {
    setFoundRhymes(rhymeWord.trim() ? findRhymes(rhymeWord.trim()) : []);
  }, [rhymeWord]);

  // Add this useEffect to trigger search when type changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchPoems(searchQuery);
    }
  }, [searchType]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    if (projectId) {
      const settings = getWritingSettings(projectId) as any;
      if (settings?.background_color) {
        const savedTheme = colorThemes.find(
          (t) => t.bg === settings.background_color
        );
        if (savedTheme) {
          setSelectedTheme(savedTheme);
        }
      }
    }
  }, [projectId]);

  // ==================== FUNCTIONS ====================
  const loadProjectData = () => {
    const projectData = getProject(projectId);
    const statsData = getProjectStats(projectId);
    const foldersData = getFoldersByProject(projectId);
    const filesData = getFilesByProject(projectId);
    setProject(projectData);
    setStats(statsData);
    setFolders(foldersData || []);
    setPoems(filesData || []);

    // Load saved goals from settings
    const savedDailyGoal = getSetting(`poetry_daily_goal_${projectId}`);
    const savedWeeklyGoal = getSetting(`poetry_weekly_goal_${projectId}`);
    if (savedDailyGoal) setDailyPoemGoal(parseInt(savedDailyGoal));
    if (savedWeeklyGoal) setWeeklyLineGoal(parseInt(savedWeeklyGoal));

    const today = new Date().toDateString();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0); // Add this line to reset time

    setPoemsToday(
      (filesData || []).filter(
        (p: any) => new Date(p.created_at).toDateString() === today
      ).length
    );

    setLinesThisWeek(
      (filesData || []).reduce((sum: number, p: any) => {
        const createdDate = new Date(p.created_at);
        if (createdDate >= weekStart) {
          return (
            sum +
            (p.content?.split("\n").filter((l: string) => l.trim()).length || 0)
          );
        }
        return sum;
      }, 0)
    );
  };

  const handleAutoSave = () => {
    if (!editingPoem) return;
    try {
      updateFile(editingPoem.id, {
        name: editingPoem.name,
        content: editingPoem.content,
      });
      loadProjectData();
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  };

  const searchPoems = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const cleanQuery = query.trim().replace(/\s+/g, "%20");

      // Define search URLs based on selected type
      let searchUrls: string[] = [];

      switch (searchType) {
        case "title":
          searchUrls = [
            `https://poetrydb.org/title/${cleanQuery}`,
            `https://poetrydb.org/author,title/${cleanQuery}`, // Fallback
          ];
          break;
        case "author":
          searchUrls = [
            `https://poetrydb.org/author/${cleanQuery}`,
            `https://poetrydb.org/author,title/${cleanQuery}`, // Fallback
          ];
          break;
        case "both":
        default:
          searchUrls = [
            `https://poetrydb.org/author,title/${cleanQuery}`,
            `https://poetrydb.org/title/${cleanQuery}`, // Fallback
            `https://poetrydb.org/author/${cleanQuery}`, // Fallback
          ];
      }

      let results: any[] = [];

      // Try endpoints in order (primary first, then fallbacks)
      for (const url of searchUrls) {
        try {
          console.log(`Trying URL: ${url}`); // Debug log
          const response = await fetch(url);
          if (!response.ok) continue;

          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            results = data;
            console.log(`Found ${data.length} results from ${url}`); // Debug log
            break; // Stop at first successful result
          }
        } catch (e) {
          console.log(`Search failed for ${url}`, e);
          continue;
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleHeaderMinimize = () => {
    setIsHeaderMinimized(!isHeaderMinimized);
    Animated.timing(headerHeight, {
      toValue: isHeaderMinimized ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleAddPoem = () => {
    if (!newPoemTitle.trim()) {
      GlobalAlert.show({
        title: "Error",
        message: "Please enter a title",
        primaryText: "Cancel",
      });
      return;
    }
    try {
      createFile({
        projectId,
        folderId: selectedCollection || undefined,
        fileType: "document",
        name: newPoemTitle,
        content: newPoemContent,
        orderIndex: poems.length,
      });
      setShowAddModal(false);
      setNewPoemTitle("");
      setNewPoemContent("");
      setSelectedCollection(null);
      setSelectedMood(null);
      loadProjectData();
      Vibration.vibrate(50);

      GlobalAlert.show({
        title: "Poem Created!",
        message: "Your new poem has been added.",
        primaryText: "Okay",
      });
    } catch (e) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to create poem",
        primaryText: "Cancel",
      });
    }
  };

  const handleAddCollection = () => {
    Alert.prompt("New Collection", "Enter collection name", (text) => {
      if (text?.trim()) {
        createFolder({
          projectId,
          name: text,
          folderType: "section",
          orderIndex: folders.length,
        });
        loadProjectData();
      }
    });
  };

  const handleEditPoem = (poem: any) => {
    let mood = null;
    try {
      const meta = JSON.parse(poem.metadata || "{}");
      mood = MOOD_TAGS.find((m) => m.label === meta.mood);
    } catch {}
    setSelectedMood(mood || null);
    setEditingPoem(poem);
  };

  const handleSavePoem = () => {
    if (!editingPoem) return;
    try {
      const metadata = selectedMood
        ? JSON.stringify({ mood: selectedMood.label })
        : editingPoem.metadata;
      updateFile(editingPoem.id, {
        name: editingPoem.name,
        content: editingPoem.content,
      });
      // If you want to save metadata too, you'll need to add metadata support to updateFile
      setEditingPoem(null);
      loadProjectData();
      Vibration.vibrate(50);

      GlobalAlert.show({
        title: "Saved!",
        message: "Your poem has been saved.",
        primaryText: "Okay",
      });
    } catch (e) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to save",
        primaryText: "Cancel",
      });
    }
  };

  const handleDeletePoem = (id: number, title: string) => {
    GlobalAlert.show({
      title: "Delete Poem",
      message: `Delete "${title}"?`,
      primaryText: "Cancel",

      secondaryText: "Delete",
      onSecondary: () => {
        deleteFile(id);
        loadProjectData();
      },
    });
  };

  const handleDeleteCollection = (id: number, name: string) => {
    GlobalAlert.show({
      title: "Delete Collection",
      message: `Delete "${name}" and all its poems?`,
      primaryText: "Cancel",

      secondaryText: "Delete",
      onSecondary: () => {
        deleteFolder(id);
        loadProjectData();
      },
    });
  };

  const handleSharePoem = async (poem: any) => {
    try {
      let message = `${poem.name}\n${"-".repeat(poem.name.length)}\n\n${
        poem.content
      }`;
      if (project.author_name) {
        message += `\n\n- ${project.author_name}`;
      }

      await Share.share({
        message: message,
        title: poem.name,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleUpdateStatus = () => {
    const statuses = [
      "draft",
      "in_progress",
      "revision",
      "complete",
      "published",
    ];
    const nextStatus =
      statuses[(statuses.indexOf(project.status) + 1) % statuses.length];
    updateProject(projectId, { status: nextStatus });
    loadProjectData();
  };

  const handleUpdateForm = (formType: string) => {
    updateProject(projectId, { writing_template: formType });
    loadProjectData();
    setShowFormModal(false);
  };

  const insertWordAtCursor = (word: string) => {
    if (editingPoem)
      setEditingPoem({
        ...editingPoem,
        content: (editingPoem.content || "") + " " + word,
      });
  };

  const totalWordCount = poems.reduce(
    (sum, p) =>
      sum + (p.content?.trim().split(/\s+/).filter(Boolean).length || 0),
    0
  );
  const progress = project?.target_word_count
    ? (totalWordCount / project.target_word_count) * 100
    : 0;

  // ==================== LOADING STATE ====================
  if (!project) {
    return (
      <Background>
        <View className="flex-1 justify-center items-center">
          <Text className="text-xl text-gray-600 dark:text-light-200">
            Loading...
          </Text>
        </View>
      </Background>
    );
  }

  // ==================== RENDER HELPERS ====================
  const renderLiveSyllableCounter = () => {
    if (!editingPoem?.content || !showSyllableCount) return null;
    const lines = editingPoem.content.split("\n");
    const template = project?.writing_template;
    const targets =
      template === "haiku"
        ? [5, 7, 5]
        : template === "tanka"
        ? [5, 7, 5, 7, 7]
        : null;
    return (
      <View className="bg-blue-50 dark:bg-dark-100 px-4 py-2 border-b border-blue-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 items-center">
            <Text className="text-xs font-bold text-blue-400 dark:text-blue-100 mr-2">
              Syllables:
            </Text>
            {lines.slice(0, 10).map((line: string, i: number) => {
              const count = countSyllablesInLine(line);
              const target = targets?.[i];
              const isCorrect = target ? count === target : true;
              return (
                <View
                  key={i}
                  className={`px-2 py-1 rounded-full ${
                    isCorrect ? "bg-green-100" : "bg-orange-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isCorrect ? "text-green-700" : "text-orange-700"
                    }`}
                  >
                    L{i + 1}: {count}
                    {target ? `/${target}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFormValidationBadge = () => {
    if (!formValidation) return null;
    return (
      <Animated.View
        style={{ transform: [{ scale: formValidation.valid ? pulseAnim : 1 }] }}
        className={`px-3 py-1 mt-2 rounded-full ${
          formValidation.valid ? "bg-green-100" : "bg-orange-100"
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            formValidation.valid ? "text-green-700" : "text-orange-700"
          }`}
        >
          {formValidation.message}
        </Text>
      </Animated.View>
    );
  };

  const renderEditorToolbar = () => {
    if (zenMode) return null;
    return (
      <View className="bg-white dark:bg-dark-300 border-t border-gray-200 px-2 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowRhymeModal(true)}
              className="bg-purple-100 px-3 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-purple-700">
                🎵 Rhyme
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowWordPalette(true)}
              className="bg-pink-100 px-3 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-pink-700">🎨 Words</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMeterModal(true)}
              className="bg-blue-100 px-3 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-blue-700">📏 Meter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAnalysisModal(true)}
              className="bg-green-100 px-3 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-green-700">
                📊 Analyze
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSyllableCount(!showSyllableCount)}
              className={`px-3 py-2 rounded-full ${
                showSyllableCount ? "bg-orange-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  showSyllableCount ? "text-orange-700" : "text-gray-600"
                }`}
              >
                🔢 Syllables
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => editingPoem && handleSharePoem(editingPoem)}
              className="bg-indigo-100 px-3 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-indigo-700">
                📤 Share
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderMoodSelector = () => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
        Mood Tag (optional)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {MOOD_TAGS.map((mood, i) => (
            <TouchableOpacity
              key={i}
              onPress={() =>
                setSelectedMood(
                  selectedMood?.label === mood.label ? null : mood
                )
              }
              className={`px-3 py-2 rounded-full flex-row items-center gap-1 ${
                selectedMood?.label === mood.label
                  ? "bg-primary"
                  : "bg-light-100 dark:bg-dark-100"
              }`}
              style={
                selectedMood?.label === mood.label
                  ? {}
                  : { borderWidth: 1, borderColor: mood.color + "40" }
              }
            >
              <Text>{mood.emoji}</Text>
              <Text
                className={`text-xs font-semibold ${
                  selectedMood?.label === mood.label
                    ? "text-white"
                    : "text-gray-600 dark:text-light-200"
                }`}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderHeaderButtons = () => (
    <View className="flex-row gap-2 w-full justify-evenly flex-wrap">
      <TouchableOpacity
        onPress={() => setShowInspirationModal(true)}
        className="bg-white dark:bg-dark-200 px-3 py-2 rounded-full shadow-lg"
      >
        <Text className="text-xs font-bold text-gray-900 dark:text-light-100">
          💡 Inspire
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowFormModal(true)}
        className="bg-white dark:bg-dark-200 px-3 py-2 rounded-full shadow-lg"
      >
        <Text className="text-xs font-bold text-gray-900 dark:text-light-100">
          🎨 Form
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowGoalsModal(true)}
        className="bg-white dark:bg-dark-200 px-3 py-2 rounded-full shadow-lg"
      >
        <Text className="text-xs font-bold text-gray-900 dark:text-light-100">
          🎯 Goals
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowBookPreview(true)}
        className="bg-primary px-3 py-2 rounded-full shadow-lg"
      >
        <Text className="text-xs font-bold text-white">👁️ Preview</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={toggleHeaderMinimize}
        className="w-9 h-9 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
      >
        <Text className="text-lg dark:text-light-100">
          {isHeaderMinimized ? "▼" : "▲"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ==================== MAIN RETURN ====================
  return (
    <Background>
      <KeyboardAvoidingLayout>
        <View className="flex-1">
          {/* Header */}
          <Animated.View>
            <View className="px-6 pt-16">
              <View className="flex-row justify-between items-center mb-2">
                {renderHeaderButtons()}
              </View>
              {!isHeaderMinimized && (
                <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
                  <View className="flex-row items-start mb-4">
                    <View className="w-16 h-16 rounded-2xl bg-primary justify-center items-center mr-4">
                      <Text className="text-4xl">✍🏻</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-1">
                        {project.title}
                      </Text>
                      {project.author_name && (
                        <Text className="text-sm text-gray-600 dark:text-light-200 mb-2">
                          by {project.author_name}
                        </Text>
                      )}
                      <View className="flex-row gap-2 flex-wrap">
                        <TouchableOpacity
                          onPress={handleUpdateStatus}
                          className="bg-primary px-3 py-1 rounded-full"
                        >
                          <Text className="text-white text-xs font-bold">
                            {project.status.replace("_", " ").toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                        {project.writing_template && (
                          <View className="bg-purple-100 dark:bg-dark-100 px-3 py-1 rounded-full">
                            <Text className="text-purple-700 dark:text-light-200 text-xs font-semibold">
                              {poetryForms.find(
                                (f) => f.value === project.writing_template
                              )?.label || "Free Verse"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <View className="flex-row gap-3 mb-4">
                    <TouchableOpacity
                      onPress={() => setShowGoalsModal(true)}
                      className="flex-1 bg-green-50 dark:bg-dark-100 rounded-xl p-3"
                    >
                      <Text className="text-xs text-green-600 dark:text-green-300 mb-1">
                        Today's Poems
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-green-800 dark:text-light-100">
                          {poemsToday}/{dailyPoemGoal}
                        </Text>
                        {poemsToday >= dailyPoemGoal && (
                          <Text className="ml-2">🏆</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View className="flex-1 bg-blue-50 dark:bg-dark-100 rounded-xl p-3">
                      <Text className="text-xs text-blue-600 dark:text-blue-200 mb-1">
                        Week's Lines
                      </Text>
                      <Text className="text-xl font-bold text-blue-800 dark:text-light-100">
                        {linesThisWeek}/{weeklyLineGoal}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-purple-50 dark:bg-dark-100 rounded-xl p-3">
                      <Text className="text-xs text-purple-600 dark:text-purple-100 mb-1">
                        Poems
                      </Text>
                      <Text className="text-xl font-bold text-purple-900 dark:text-light-100">
                        {poems.length}
                      </Text>
                    </View>
                    {/* <View className="flex-1 bg-pink-50 dark:bg-dark-100 rounded-xl p-3">
                    <Text className="text-xs text-pink-600 dark:text-pink-200 mb-1">
                      Collections
                    </Text>
                    <Text className="text-xl font-bold text-pink-900 dark:text-light-100">
                      {folders.length}
                    </Text>
                  </View> */}
                    <View className="flex-1 bg-indigo-50 dark:bg-dark-100 rounded-xl p-3">
                      <Text className="text-xs text-indigo-600 dark:text-indigo-100 mb-1">
                        Lines
                      </Text>
                      <Text className="text-xl font-bold text-indigo-900 dark:text-light-100">
                        {poems.reduce(
                          (sum, p) => sum + countLines(p.content || ""),
                          0
                        )}
                      </Text>
                    </View>
                  </View>
                  {project.target_word_count > 0 && (
                    <View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-light-100">
                          Progress: {progress.toFixed(1)}%
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-light-200">
                          {totalWordCount.toLocaleString()} /{" "}
                          {project.target_word_count.toLocaleString()} words
                        </Text>
                      </View>
                      <View className="h-3 bg-light-100 dark:bg-dark-100 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </View>
                    </View>
                  )}
                  <View className="flex-row gap-3 mb-1 mt-4">
                    <TouchableOpacity
                      onPress={() => setShowAddModal(true)}
                      className="flex-1 bg-secondary py-4 rounded-2xl shadow-lg"
                    >
                      <Text className="text-gray-900 font-bold text-center">
                        New Poem
                      </Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                onPress={handleAddCollection}
                className="bg-white dark:bg-dark-200 py-4 px-5 rounded-2xl border-2 border-primary"
              >
                <Text className="text-xl">📚</Text>
              </TouchableOpacity> */}
                    {/* <TouchableOpacity
                    onPress={() => setShowExportModal(true)}
                    className="bg-white dark:bg-dark-200 py-4 px-5 rounded-2xl border-2 border-primary"
                  >
                    <Text className="text-xl">📤</Text>
                  </TouchableOpacity> */}
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Content ScrollView */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim }} className="px-6 py-4">
              {/* Quick Actions */}

              {/* Collections */}
              {folders.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                    📚 Collections
                  </Text>
                  {folders.map((collection) => {
                    const collectionPoems = poems.filter(
                      (p) => p.folder_id === collection.id
                    );
                    return (
                      <TouchableOpacity
                        key={collection.id}
                        onLongPress={() =>
                          handleDeleteCollection(collection.id, collection.name)
                        }
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-xl bg-purple-100 justify-center items-center mr-3">
                            <Text className="text-2xl">📖</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                              {collection.name}
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-light-200">
                              {collectionPoems.length} poems
                            </Text>
                          </View>
                          <Text className="text-gray-400 text-xl">›</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Poems List */}
              <View>
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  ✍🏻 All Poems ({poems.length})
                </Text>
                {poems.length > 0 ? (
                  poems.map((poem, index) => {
                    let mood = null;
                    try {
                      const meta = JSON.parse(poem.metadata || "{}");
                      mood = MOOD_TAGS.find((m) => m.label === meta.mood);
                    } catch {}
                    return (
                      <View
                        key={poem.id}
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <TouchableOpacity
                          onPress={() => handleEditPoem(poem)}
                          onLongPress={() =>
                            handleDeletePoem(poem.id, poem.name)
                          }
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2 mb-1">
                                <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                                  {poem.name}
                                </Text>
                                {mood && <Text>{mood.emoji}</Text>}
                              </View>
                              <View className="flex-row gap-3">
                                <Text className="text-xs text-gray-500">
                                  {poem.word_count || 0} words
                                </Text>
                                <Text className="text-xs text-gray-500">
                                  {countLines(poem.content || "")} lines
                                </Text>
                                <Text className="text-xs text-gray-500">
                                  {countStanzas(poem.content || "")} stanzas
                                </Text>
                              </View>
                            </View>
                            <View className="w-8 h-8 rounded-full bg-primary justify-center items-center">
                              <Text className="text-white font-bold text-xs">
                                {index + 1}
                              </Text>
                            </View>
                          </View>
                          {poem.content && (
                            <View className="bg-light-100 dark:bg-dark-100 rounded-xl p-3 border-l-4 border-primary">
                              <Text
                                className="text-sm text-gray-700 dark:text-light-200 italic"
                                numberOfLines={3}
                              >
                                {poem.content}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleSharePoem(poem)}
                          className="mt-3 bg-blue-50 dark:bg-dark-100 py-2 rounded-xl flex-row items-center justify-center"
                        >
                          <Text className="text-blue-600 dark:text-blue-300 font-semibold text-sm mr-2">
                            Share
                          </Text>
                          <Text className="text-lg">📤</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                ) : (
                  <View className="bg-white dark:bg-dark-200 rounded-2xl p-10 items-center">
                    <Text className="text-5xl mb-3">✍🏻</Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-2">
                      No poems yet
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-light-200 text-center mb-4">
                      Let your creativity flow
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddModal(true)}
                      className="bg-secondary px-6 py-3 rounded-full"
                    >
                      <Text className="text-gray-900 font-bold">
                        Write Your First Poem
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </View>

        {/* ==================== MODALS ==================== */}

        {/* Add Poem Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            className="flex-1 justify-end bg-black/50"
          >
            <View
              className="bg-white dark:bg-dark-200 rounded-t-3xl p-6"
              style={{ maxHeight: "85%" }}
            >
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4">
                New Poem
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  value={newPoemTitle}
                  onChangeText={setNewPoemTitle}
                  placeholder="Untitled Poem"
                  placeholderTextColor="#9CA3AF"
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100 text-lg font-bold"
                />
                {project.writing_template &&
                  project.writing_template !== "freeform" && (
                    <View className="bg-blue-50 dark:bg-dark-100 rounded-2xl p-3 mb-4">
                      <Text className="text-sm text-blue-600 dark:text-light-200 font-semibold mb-1">
                        📖{" "}
                        {
                          poetryForms.find(
                            (f) => f.value === project.writing_template
                          )?.label
                        }{" "}
                        Guide
                      </Text>
                      <Text className="text-xs text-blue-500 dark:text-light-200">
                        {
                          poetryForms.find(
                            (f) => f.value === project.writing_template
                          )?.guide
                        }
                      </Text>
                    </View>
                  )}
                {renderMoodSelector()}
                <TextInput
                  value={newPoemContent}
                  onChangeText={setNewPoemContent}
                  placeholder="Write your verses here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 text-gray-900 dark:text-light-100 text-base"
                  style={{
                    minHeight: 200,
                    fontFamily: "serif",
                    lineHeight: 28,
                  }}
                />

                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddModal(false);
                      setNewPoemTitle("");
                      setNewPoemContent("");
                      setSelectedMood(null);
                    }}
                    className="flex-1 bg-light-100 dark:bg-dark-100 py-4 rounded-full"
                  >
                    <Text className="text-gray-100 font-bold text-center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddPoem}
                    className="flex-1 bg-secondary py-4 rounded-full"
                  >
                    <Text className="text-gray-900 font-bold text-center">
                      Save Poem
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Poem Modal */}
        <Modal
          visible={!!editingPoem}
          animationType="slide"
          onRequestClose={() => setEditingPoem(null)}
          statusBarTranslucent={true}
        >
          <View
            className="flex-1"
            style={{
              backgroundColor: zenMode ? selectedTheme.bg : "#F9FAFB",
            }}
          >
            {!zenMode && (
              <View
                className="px-6 pb-3 border-b border-gray-200 bg-white dark:bg-dark-300"
                style={{ paddingTop: insets.top + 8 }}
              >
                <View className="flex-row mt-2 items-center justify-between mb-3">
                  <TouchableOpacity
                    onPress={() => setEditingPoem(null)}
                    className="w-10 h-10 rounded-full bg-light-100 dark:bg-slate-700 dark:text-slate-200 justify-center items-center"
                  >
                    <Text className="text-xl dark:text-slate-200">✕</Text>
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setShowPoemSearchModal(true)}
                      className="bg-white dark:bg-dark-200 px-3 py-2 rounded-full shadow-lg"
                    >
                      <Text className="text-xs font-bold text-gray-900 dark:text-light-100">
                        📚 Reference
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowThemeModal(true)}
                      className="w-10 h-10 rounded-full bg-light-100 justify-center items-center"
                    >
                      <Text className="text-lg">🎨</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setZenMode(true)}
                      className="w-10 h-10 rounded-full bg-light-100 justify-center items-center"
                    >
                      <Text className="text-lg">🧘</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSavePoem}
                      className="bg-secondary px-4 py-2 rounded-full"
                    >
                      <Text className="text-gray-900 font-bold text-sm">
                        💾 Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  value={editingPoem?.name || ""}
                  onChangeText={(text) =>
                    setEditingPoem({ ...editingPoem, name: text })
                  }
                  placeholder="Poem Title"
                  placeholderTextColor="#9CA3AF"
                  className="bg-light-100 rounded-2xl px-4 py-3 text-gray-900 text-xl font-bold mb-2"
                />
                <View className="flex-row items-center justify-between">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {MOOD_TAGS.slice(0, 6).map((mood, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() =>
                            setSelectedMood(
                              selectedMood?.label === mood.label ? null : mood
                            )
                          }
                          className={`px-2 py-1 rounded-full ${
                            selectedMood?.label === mood.label
                              ? "bg-primary"
                              : "bg-light-100"
                          }`}
                        >
                          <Text className="text-xs">{mood.emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {autoSaveEnabled && (
                      <Text className="text-xs items-center  px-4  text-green-600 text-center mt-2">
                        ✓ Auto-saving
                      </Text>
                    )}
                  </ScrollView>
                </View>
                {renderFormValidationBadge()}
              </View>
            )}
            {zenMode && (
              <TouchableOpacity
                onPress={() => setZenMode(false)}
                className="absolute right-6 z-50 w-10 h-10 rounded-full bg-black/20 justify-center items-center"
                style={{ top: insets.top + 8 }}
              >
                <Text className="text-white text-lg">✕</Text>
              </TouchableOpacity>
            )}
            {renderLiveSyllableCounter()}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: zenMode ? 40 : 20,
                paddingVertical: zenMode ? 60 : 20,
                alignItems: "center",
              }}
              style={{ backgroundColor: selectedTheme.bg }}
            >
              <View
                style={{
                  width: zenMode ? Math.min(650, width - 80) : "100%",
                  maxWidth: 700,
                }}
              >
                <TextInput
                  value={editingPoem?.content || ""}
                  onChangeText={(text) =>
                    setEditingPoem({ ...editingPoem, content: text })
                  }
                  placeholder="Pour your heart onto the page..."
                  placeholderTextColor={selectedTheme.text + "60"}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: height,
                    fontSize: 18,
                    lineHeight: 32,
                    fontFamily: "serif",
                    color: selectedTheme.text,
                    backgroundColor: selectedTheme.bg,
                    padding: zenMode ? 40 : 16,
                  }}
                />
              </View>
            </ScrollView>
            {renderEditorToolbar()}
            {!zenMode && (
              <View className="bg-white border-t border-gray-200 px-6 py-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-600">
                    Words:{" "}
                    {editingPoem?.content?.trim().split(/\s+/).filter(Boolean)
                      .length || 0}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Lines: {countLines(editingPoem?.content || "")}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Stanzas: {countStanzas(editingPoem?.content || "")}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {getReadingTime(editingPoem?.content || "")}m read
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* Reference poetry*/}
        <Modal
          visible={showPoemSearchModal}
          animationType="slide"
          onRequestClose={() => {
            setShowPoemSearchModal(false);
            setSearchQuery("");
            setSearchResults([]);
            setSelectedPoem(null);
          }}
          statusBarTranslucent={true}
        >
          <View className="flex-1 h-screen bg-white dark:bg-dark-300">
            <View
              className="px-6 pt-4 pb-4 bg-primary"
              style={{ top: insets.top + 8 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => {
                    setShowPoemSearchModal(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    setSelectedPoem(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
                >
                  <Text className="text-xl text-white">✕</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-white">
                  Poetry Reference
                </Text>
                <View className="w-10" />
              </View>

              {/* Search Input and Type Selector - Fixed Layout */}
              <View className="flex-row items-center bg-white rounded-full px-4 mb-2">
                <Text className="text-xl mr-2">🔍</Text>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search author/title..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 py-3 text-gray-900"
                  onSubmitEditing={() => searchPoems(searchQuery)}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="ml-2"
                  >
                    <Text className="text-gray-400">✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Type Selector - Separate Row */}
              <View className="flex-row gap-2 mb-2">
                {(["title", "author", "both"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSearchType(type)}
                    className={`px-3 py-2 rounded-full ${
                      searchType === type
                        ? "bg-secondary"
                        : "bg-gray-200 dark:bg-dark-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        searchType === type
                          ? "text-white"
                          : "text-gray-600 dark:text-light-200"
                      }`}
                    >
                      {type === "title"
                        ? "Title"
                        : type === "author"
                        ? "Author"
                        : "Both"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => searchPoems(searchQuery)}
                className="bg-secondary py-3 rounded-full"
                disabled={isSearching || !searchQuery.trim()}
              >
                <Text className="text-gray-900 font-bold text-center">
                  {isSearching ? "Searching..." : "Search Poems"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Area with FlatList */}
            <View className="flex-1 px-6 mt-12">
              {isSearching ? (
                <View className="flex-1 justify-center items-center py-12">
                  <Text className="text-4xl mb-3">📖</Text>
                  <Text className="text-gray-600 dark:text-light-200">
                    Searching poetry database...
                  </Text>
                </View>
              ) : selectedPoem ? (
                <View className="flex-1 py-4">
                  {/* Fixed Back Button */}
                  <TouchableOpacity
                    onPress={() => setSelectedPoem(null)}
                    className="flex-row items-center mb-4"
                  >
                    <Text className="text-primary text-lg mr-2">←</Text>
                    <Text className="text-primary font-semibold">
                      Back to results
                    </Text>
                  </TouchableOpacity>

                  {/* Poem Content with FlatList */}
                  <View className="flex-1 bg-light-100 dark:bg-dark-200 rounded-2xl p-6">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-2 text-center">
                      {selectedPoem.title}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center italic">
                      by {selectedPoem.author}
                    </Text>

                    <FlatList
                      data={selectedPoem.lines}
                      keyExtractor={(item, index) => `line-${index}`}
                      renderItem={({ item, index }) => (
                        <Text
                          className="text-base text-gray-800 dark:text-light-100 leading-7 mb-2"
                          style={{ fontFamily: "serif" }}
                        >
                          {item}
                        </Text>
                      )}
                      showsVerticalScrollIndicator={true}
                      ListHeaderComponent={
                        <View className="border-t border-gray-200 dark:border-gray-700 pt-4" />
                      }
                      ListFooterComponent={
                        <>
                          {selectedPoem.linecount && (
                            <Text className="text-xs text-gray-500 dark:text-light-300 mt-4 text-center">
                              {selectedPoem.linecount} lines
                            </Text>
                          )}
                        </>
                      }
                    />
                  </View>
                </View>
              ) : searchResults.length > 0 ? (
                <View className="flex-1 py-4">
                  <Text className="text-sm text-gray-600 dark:text-light-200 mb-3">
                    Found {searchResults.length} poems
                  </Text>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) =>
                      `${item.title}-${item.author}-${index}`
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => setSelectedPoem(item)}
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-1">
                          {item.title}
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-light-200 mb-2 italic">
                          by {item.author}
                        </Text>
                        <Text
                          className="text-xs text-gray-500 dark:text-light-300"
                          numberOfLines={2}
                        >
                          {item.lines.slice(0, 2).join(" / ")}...
                        </Text>
                        <View className="flex-row items-center justify-between mt-2">
                          <Text className="text-xs text-gray-400">
                            {item.linecount} lines
                          </Text>
                          <Text className="text-primary">→</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListEmptyComponent={
                      <View className="items-center py-8">
                        <Text className="text-gray-500">No poems found</Text>
                      </View>
                    }
                  />
                </View>
              ) : searchQuery && !isSearching ? (
                <View className="flex-1 justify-center items-center py-12">
                  <Text className="text-4xl mb-3">📭</Text>
                  <Text className="text-gray-600 dark:text-light-200 text-center">
                    No poems found for "{searchQuery}"
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-light-300 text-center mt-2">
                    Try searching by famous titles or authors
                  </Text>
                </View>
              ) : (
                <View className="flex-1 justify-center items-center py-12">
                  <Text className="text-6xl mb-4">📚</Text>
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-2">
                    Explore Classic Poetry
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200 text-center mb-6 px-4">
                    Search thousands of poems by title or author for inspiration
                    and reference
                  </Text>
                  <View className="bg-blue-50 dark:bg-dark-100 rounded-xl p-4 mx-4">
                    <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      💡 Try searching:
                    </Text>
                    <Text className="text-xs text-blue-600 dark:text-blue-400">
                      • "Shakespeare" • "Frost" • "Dickinson"
                    </Text>
                    <Text className="text-xs text-blue-600 dark:text-blue-400">
                      • "The Road Not Taken" • "Sonnet"
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Rhyme Modal */}
        <Modal
          visible={showRhymeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRhymeModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-end">
            <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6 max-h-[70%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                  🎵 Rhyme Finder
                </Text>
                <TouchableOpacity
                  onPress={() => setShowRhymeModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center"
                >
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={rhymeWord}
                onChangeText={setRhymeWord}
                placeholder="Type a word to find rhymes..."
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-3 mb-4 text-gray-900 dark:text-light-100"
                autoFocus
              />
              {foundRhymes.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="flex-row flex-wrap gap-2">
                    {foundRhymes.map((rhyme, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          insertWordAtCursor(rhyme);
                          Vibration.vibrate(30);
                        }}
                        className="bg-purple-100 dark:bg-purple-200 px-4 py-2 rounded-full"
                      >
                        <Text className="text-purple-700 dark:text-purple-900 font-semibold">
                          {rhyme}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : rhymeWord ? (
                <Text className="text-gray-500 text-center py-8">
                  No rhymes found. Try another word!
                </Text>
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-4xl mb-2">🎶</Text>
                  <Text className="text-gray-500 text-center">
                    Enter a word to discover rhyming possibilities
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setShowRhymeModal(false)}
                className="bg-primary py-3 rounded-full mt-4"
              >
                <Text className="text-white font-bold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Word Palette Modal */}
        <Modal
          visible={showWordPalette}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWordPalette(false)}
        >
          <View className="flex-1 bg-black/90 justify-end">
            <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                  🎨 Word Palette
                </Text>
                <TouchableOpacity
                  onPress={() => setShowWordPalette(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center"
                >
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {Object.entries(POWER_WORDS).map(([category, words]) => (
                  <View key={category} className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 dark:text-light-200 mb-2 capitalize">
                      {category}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {words.map((word, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            insertWordAtCursor(word);
                            Vibration.vibrate(30);
                          }}
                          className="bg-purple-50 dark:bg-dark-100 px-3 py-2 rounded-full border border-purple-200"
                        >
                          <Text className="text-purple-700 dark:text-light-200 text-sm">
                            {word}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowWordPalette(false)}
                className="bg-primary py-3 rounded-full mt-4"
              >
                <Text className="text-white font-bold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Meter Modal */}
        <Modal
          visible={showMeterModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMeterModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-4">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[85%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                  📏 Meter & Stress
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMeterModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center"
                >
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {editingPoem?.content ? (
                  <>
                    <Text className="text-sm text-gray-600 dark:text-light-200 mb-3">
                      x = unstressed, X = stressed
                    </Text>
                    {editingPoem.content
                      .split("\n")
                      .filter((l: string) => l.trim())
                      .slice(0, 8)
                      .map((line: string, i: number) => (
                        <View
                          key={i}
                          className="bg-light-100 dark:bg-dark-100 rounded-xl p-3 mb-2"
                        >
                          <Text
                            className="text-sm text-gray-900 dark:text-light-100 mb-1"
                            numberOfLines={1}
                          >
                            {line}
                          </Text>
                          <Text className="text-xs font-mono text-purple-400 dark:text-purple-300">
                            {analyzeStressPattern(line)}
                          </Text>
                        </View>
                      ))}
                    <View className="bg-blue-50 dark:bg-dark-100 rounded-xl p-4 mt-4">
                      <Text className="text-sm font-bold text-blue-500 mb-2">
                        Common Meters:
                      </Text>
                      <Text className="text-xs text-blue-400 mb-1">
                        • Iambic: xX xX xX xX xX (da-DUM)
                      </Text>
                      <Text className="text-xs text-blue-400 mb-1">
                        • Trochaic: Xx Xx Xx Xx (DUM-da)
                      </Text>
                      <Text className="text-xs text-blue-400 mb-1">
                        • Anapestic: xxX xxX xxX (da-da-DUM)
                      </Text>
                      <Text className="text-xs text-blue-400">
                        • Dactylic: Xxx Xxx Xxx (DUM-da-da)
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text className="text-gray-500 text-center py-8">
                    Write some lines to analyze meter
                  </Text>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowMeterModal(false)}
                className="bg-primary py-3 rounded-full mt-4"
              >
                <Text className="text-white font-bold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Goals Modal */}
        <Modal
          visible={showGoalsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGoalsModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-4">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
                🎯 Poetry Goals
              </Text>
              <View className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4 mb-4">
                <Text className="text-sm text-green-700 mb-2">Daily Poems</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-3xl font-bold text-green-800">
                    {poemsToday}/{dailyPoemGoal}
                  </Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 5].map((n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => {
                          setDailyPoemGoal(n);
                          setSetting(
                            `poetry_daily_goal_${projectId}`,
                            n.toString()
                          );
                        }}
                        className={`w-8 h-8 rounded-full justify-center items-center ${
                          dailyPoemGoal === n ? "bg-green-500" : "bg-white"
                        }`}
                      >
                        <Text
                          className={
                            dailyPoemGoal === n
                              ? "text-white font-bold"
                              : "text-green-700"
                          }
                        >
                          {n}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View className="h-2 bg-green-200 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (poemsToday / dailyPoemGoal) * 100
                      )}%`,
                    }}
                  />
                </View>
              </View>

              {poemsToday >= dailyPoemGoal && (
                <View className="bg-yellow-100 rounded-2xl p-4 items-center mb-4">
                  <Text className="text-4xl mb-2">🏆</Text>
                  <Text className="text-yellow-800 font-bold">
                    Daily goal achieved!
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setShowGoalsModal(false)}
                className="bg-primary py-3 rounded-full"
              >
                <Text className="text-white font-bold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Analysis Modal */}
        <Modal
          visible={showAnalysisModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAnalysisModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-4">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[90%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                  📊 Deep Analysis
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAnalysisModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center"
                >
                  <Text>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {editingPoem && (
                  <>
                    <View className="flex-row gap-2 mb-4">
                      <View className="flex-1 bg-purple-100 rounded-xl p-3">
                        <Text className="text-xs text-purple-600">Words</Text>
                        <Text className="text-xl font-bold text-purple-900">
                          {editingPoem.content
                            ?.trim()
                            .split(/\s+/)
                            .filter(Boolean).length || 0}
                        </Text>
                      </View>
                      <View className="flex-1 bg-pink-100 rounded-xl p-3">
                        <Text className="text-xs text-pink-600">Lines</Text>
                        <Text className="text-xl font-bold text-pink-900">
                          {countLines(editingPoem.content || "")}
                        </Text>
                      </View>
                      <View className="flex-1 bg-blue-100 rounded-xl p-3">
                        <Text className="text-xs text-blue-600">Stanzas</Text>
                        <Text className="text-xl font-bold text-blue-900">
                          {countStanzas(editingPoem.content || "")}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-light-100 dark:bg-dark-100 rounded-xl p-4 mb-3">
                      <Text className="text-sm font-bold text-gray-700 dark:text-light-200 mb-2">
                        🎵 Rhyme Scheme
                      </Text>
                      <Text className="text-2xl font-mono text-purple-400 dark:text-purple-200">
                        {detectRhymeScheme(editingPoem.content || "") ||
                          "No pattern"}
                      </Text>
                    </View>
                    <View className="bg-light-100 dark:bg-dark-100 rounded-xl p-4 mb-3">
                      <Text className="text-sm font-bold text-gray-700 dark:text-light-200 mb-2">
                        🔄 Repeated Words
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {getWordFrequency(editingPoem.content || "").map(
                          (item, i) => (
                            <View
                              key={i}
                              className="bg-white dark:bg-dark-200 px-3 py-1 rounded-full"
                            >
                              <Text className="text-xs text-gray-700 dark:text-light-200">
                                {item.word} ({item.count}×)
                              </Text>
                            </View>
                          )
                        )}
                        {getWordFrequency(editingPoem.content || "").length ===
                          0 && (
                          <Text className="text-xs text-gray-500">
                            No significant repetitions
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="bg-light-100 dark:bg-dark-100 rounded-xl p-4 mb-3">
                      <Text className="text-sm font-bold text-gray-700 dark:text-light-200 mb-2">
                        ✨ Alliteration Found
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {getAlliteration(editingPoem.content || "")
                          .slice(0, 8)
                          .map((pair, i) => (
                            <View
                              key={i}
                              className="bg-green-100 px-3 py-1 rounded-full"
                            >
                              <Text className="text-xs text-green-700">
                                {pair}
                              </Text>
                            </View>
                          ))}
                        {getAlliteration(editingPoem.content || "").length ===
                          0 && (
                          <Text className="text-xs text-gray-500">
                            None detected
                          </Text>
                        )}
                      </View>
                    </View>
                    {formValidation && (
                      <View
                        className={`rounded-xl p-4 ${
                          formValidation.valid
                            ? "bg-green-100"
                            : "bg-orange-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            formValidation.valid
                              ? "text-green-700"
                              : "text-orange-700"
                          }`}
                        >
                          {formValidation.valid
                            ? "✅ Form Check"
                            : "⚠️ Form Check"}
                        </Text>
                        <Text
                          className={`text-xs mt-1 ${
                            formValidation.valid
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {formValidation.message}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowAnalysisModal(false)}
                className="bg-primary py-3 rounded-full mt-4"
              >
                <Text className="text-white font-bold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Form Selection Modal */}
        <Modal
          visible={showFormModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFormModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-6">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[85%]">
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
                🎨 Poetry Form
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {poetryForms.map((form) => (
                  <TouchableOpacity
                    key={form.value}
                    onPress={() => handleUpdateForm(form.value)}
                    className={`p-4 rounded-2xl mb-3 border-2 ${
                      project?.writing_template === form.value
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 bg-light-100"
                    }`}
                  >
                    <View className="flex-row items-start">
                      <Text className="text-3xl mr-3">{form.icon}</Text>
                      <View className="flex-1">
                        <Text
                          className={`font-bold text-base mb-1 ${
                            project?.writing_template === form.value
                              ? "text-primary"
                              : "text-gray-900"
                          }`}
                        >
                          {form.label}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                          {form.desc}
                        </Text>
                        {form.guide && (
                          <Text className="text-xs text-gray-500 italic">
                            {form.guide}
                          </Text>
                        )}
                      </View>
                      {project?.writing_template === form.value && (
                        <Text className="text-primary text-2xl">✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setShowFormModal(false)}
                  className="bg-light-100 py-4 rounded-full mt-2"
                >
                  <Text className="text-gray-600 font-bold text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Inspiration Modal */}
        <Modal
          visible={showInspirationModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInspirationModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-6">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[80%]">
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
                💡 Inspiration
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-purple-100 rounded-2xl p-4 mb-4">
                  <Text className="text-sm font-semibold text-purple-900 mb-2">
                    ✨ Random Prompt
                  </Text>
                  <Text className="text-purple-700 italic">
                    "{generateInspiration()}"
                  </Text>
                </View>
                <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3">
                  Explore Themes
                </Text>
                {writingThemes.map((theme, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-light-100 dark:bg-slate-600 rounded-2xl p-4 mb-3"
                    onPress={() => {
                      setNewPoemTitle(`${theme.name}`);
                      setShowInspirationModal(false);
                      setShowAddModal(true);
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-2">{theme.emoji}</Text>
                      <Text className="text-base font-bold text-gray-900 dark:text-white">
                        {theme.name}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {theme.prompts.map((prompt, i) => (
                        <View
                          key={i}
                          className="bg-white px-2 py-1 rounded-full"
                        >
                          <Text className="text-xs text-gray-600">
                            {prompt}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setShowInspirationModal(false)}
                  className="bg-light-100 py-4 rounded-full mt-2"
                >
                  <Text className="text-gray-600 font-bold text-center">
                    Close
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Theme Modal */}
        <Modal
          visible={showThemeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemeModal(false)}
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-6">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
              <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
                🎨 Editor Theme
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {colorThemes.map((theme, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedTheme(theme);
                      setWritingSetting({
                        projectId: projectId,
                        backgroundColor: theme.bg,
                        textColor: theme.text,
                      });
                      setShowThemeModal(false);
                    }}
                    className="mb-3 rounded-2xl overflow-hidden border-2"
                    style={{
                      borderColor:
                        selectedTheme.name === theme.name
                          ? theme.accent
                          : "#E5E7EB",
                    }}
                  >
                    <View style={{ backgroundColor: theme.bg }} className="p-4">
                      <Text
                        style={{ color: theme.text }}
                        className="font-bold text-lg mb-2"
                      >
                        {theme.name}
                      </Text>
                      <View className="flex-row gap-2">
                        <View
                          style={{ backgroundColor: theme.accent }}
                          className="w-8 h-8 rounded-full"
                        />
                        <View
                          style={{ backgroundColor: theme.text + "40" }}
                          className="w-8 h-8 rounded-full"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setShowThemeModal(false)}
                  className="bg-light-100 py-4 rounded-full mt-2"
                >
                  <Text className="text-gray-600 font-bold text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Book Preview Modal */}
        <Modal
          visible={showBookPreview}
          animationType="slide"
          onRequestClose={() => setShowBookPreview(false)}
        >
          <View className="flex-1 bg-gray-900">
            <View className="px-6 pt-16 pb-4 bg-black/50">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setShowBookPreview(false)}
                  className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
                >
                  <Text className="text-xl text-white">✕</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-white">
                  Poetry Preview
                </Text>
                <View className="w-10" />
              </View>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                setCurrentPage(
                  Math.round(e.nativeEvent.contentOffset.x / width)
                );
              }}
              scrollEventThrottle={16}
            >
              {poems.map((poem, index) => (
                <View
                  key={poem.id}
                  className="px-8 py-12 justify-center"
                  style={{
                    width,
                    backgroundColor: selectedTheme.text,
                  }}
                >
                  <View
                    className="bg-white rounded-2xl p-6 shadow-2xl"
                    style={{
                      height: width * 1.6,
                      backgroundColor: selectedTheme.bg,
                    }}
                  >
                    <Text
                      className="text-xl font-bold mb-4 text-center"
                      style={{ color: selectedTheme.text }}
                    >
                      {poem.name}
                    </Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <Text
                        className="text-base leading-7 text-center"
                        style={{
                          fontFamily: "serif",
                          color: selectedTheme.text,
                        }}
                      >
                        {poem.content || ""}
                      </Text>
                    </ScrollView>
                    <Text
                      className="text-xs text-center mt-4"
                      style={{ color: selectedTheme.text }}
                    >
                      Poem {index + 1} of {poems.length}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View className="absolute bottom-8 left-0 right-0 items-center">
              <View className="bg-black/50 px-6 py-3 rounded-full">
                <Text className="text-white font-bold">
                  {currentPage + 1} of {poems.length}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingLayout>
    </Background>
  );
};

export default PoetryDetails;
