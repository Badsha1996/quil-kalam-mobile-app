import Background from "@/components/common/Background";
import {
  createItem,
  deleteItem,
  getItemsByProject,
  getProject,
  getProjectCovers,
  getProjectStats,
  getPublishingSettings,
  setProjectCover,
  updateItem,
  updateProject,
} from "@/utils/database";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ItemNode {
  id: number;
  name: string;
  item_type: string;
  content?: string;
  metadata?: string;
  parent_item_id?: number;
  order_index: number;
  depth_level: number;
  word_count?: number;
  color?: string;
  icon?: string;
  children?: ItemNode[];
}

const { width } = Dimensions.get("window");

// Template definitions
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

const NovelDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [items, setItems] = useState<ItemNode[]>([]);
  const [publishingSettings, setPublishingSettingsState] = useState<any>(null);
  const [covers, setCovers] = useState<any[]>([]);

  const [activeView, setActiveView] = useState<
    "binder" | "corkboard" | "outline"
  >("binder");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<ItemNode[]>([]);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Form states
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    content: "",
    itemType: "document" as
      | "folder"
      | "document"
      | "character"
      | "location"
      | "note"
      | "research",
    description: "",
    imageUri: "",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProjectData();
    initializeTemplateStructure();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [projectId]);

  const initializeTemplateStructure = () => {
    const projectData = getProject(projectId);
    if (!projectData) return;

    const existingItems = getItemsByProject(projectId) as ItemNode[];

    // Check if template structure already exists
    const hasStructure = existingItems.some(
      (item) =>
        item.name.includes("Act") ||
        item.name.includes("Chapter") ||
        templates.some((template) =>
          existingItems.some((existingItem) =>
            existingItem.name
              .toLowerCase()
              .includes(template.label.toLowerCase())
          )
        )
    );

    if (
      !hasStructure &&
      projectData.writing_template &&
      projectData.writing_template !== "freeform"
    ) {
      applyTemplate(projectData.writing_template);
    }
  };

  const applyTemplate = (templateType: string) => {
    const existingItems = getItemsByProject(projectId) as ItemNode[];

    // Clear existing structure if it's just the default empty state
    if (
      existingItems.length === 0 ||
      existingItems.every((item) => !item.parent_item_id)
    ) {
      existingItems.forEach((item) => {
        deleteItem(item.id);
      });
    }

    switch (templateType) {
      case "heros_journey":
        createHerosJourneyStructure();
        break;
      case "three_act":
        createThreeActStructure();
        break;
      case "save_the_cat":
        createSaveTheCatStructure();
        break;
      case "seven_point":
        createSevenPointStructure();
        break;
      case "snowflake":
        createSnowflakeStructure();
        break;
      default:
        // Freeform - no structure
        break;
    }

    // Update project with selected template
    //@ts-ignore
    updateProject(projectId, { writing_template: templateType });
    loadProjectData();
  };

  const createHerosJourneyStructure = () => {
    const structure = [
      {
        name: "Act I: Departure",
        type: "folder",
        color: "#10B981",
        icon: "🚀",
        children: [
          {
            name: "1. Ordinary World",
            content:
              "Introduce the hero in their normal life before the adventure begins. Establish their routine, relationships, and inner conflicts. Show what they stand to lose.",
          },
          {
            name: "2. Call to Adventure",
            content:
              "The hero is presented with a challenge, problem, or adventure that disrupts their ordinary world. This could be a message, discovery, or event that forces change.",
          },
          {
            name: "3. Refusal of the Call",
            content:
              "Initially, the hero is reluctant to accept the challenge due to fear, insecurity, or obligation. They hesitate and consider staying in their comfortable existence.",
          },
          {
            name: "4. Meeting the Mentor",
            content:
              "The hero meets a mentor who provides guidance, training, wisdom, or magical gifts that will help on the journey. The mentor prepares them for what lies ahead.",
          },
          {
            name: "5. Crossing the Threshold",
            content:
              "The hero commits to the adventure and crosses into the special world, leaving their ordinary life behind. There's no turning back from this point.",
          },
        ],
      },
      {
        name: "Act II: Initiation",
        type: "folder",
        color: "#F59E0B",
        icon: "⚔️",
        children: [
          {
            name: "6. Tests, Allies, Enemies",
            content:
              "The hero faces a series of challenges and meets allies who help and enemies who hinder. They learn the rules of the special world and begin transformation.",
          },
          {
            name: "7. Approach to Inmost Cave",
            content:
              "The hero prepares for the major challenge in the special world's most dangerous location. They make final preparations and confront their deepest fears.",
          },
          {
            name: "8. Ordeal",
            content:
              "The hero faces their greatest fear or most difficult challenge, experiencing a 'death' and 'rebirth' moment. This is the central crisis of the story.",
          },
          {
            name: "9. Reward",
            content:
              "The hero achieves their goal or gains a reward (sword, elixir, knowledge, reconciliation). They have proven themselves worthy but aren't safe yet.",
          },
        ],
      },
      {
        name: "Act III: Return",
        type: "folder",
        color: "#EF4444",
        icon: "🏆",
        children: [
          {
            name: "10. The Road Back",
            content:
              "The hero begins the journey back to the ordinary world, often pursued by vengeful forces. The stakes are raised as they race toward safety.",
          },
          {
            name: "11. Resurrection",
            content:
              "The hero faces a final test where they must use everything learned on the journey. This is the climax where they prove their transformation is complete.",
          },
          {
            name: "12. Return with Elixir",
            content:
              "The hero returns home transformed with knowledge, power, or wisdom that benefits their ordinary world. They have achieved mastery of both worlds.",
          },
        ],
      },
    ];

    structure.forEach((act, actIndex) => {
      const actId = createItem({
        projectId,
        itemType: "folder",
        name: act.name,
        orderIndex: actIndex,
        color: act.color,
        icon: act.icon,
      });

      act.children.forEach((stage, stageIndex) => {
        createItem({
          projectId,
          parentItemId: actId,
          itemType: "document",
          name: stage.name,
          content: stage.content,
          orderIndex: stageIndex,
        });
      });
    });
  };

  const createThreeActStructure = () => {
    const structure = [
      {
        name: "Act I: Setup",
        type: "folder",
        color: "#3B82F6",
        icon: "🎬",
        children: [
          {
            name: "Opening Image",
            content:
              "A snapshot of the hero's life before the adventure begins. Establish the ordinary world and what needs to change.",
          },
          {
            name: "Theme Stated",
            content:
              "The central theme or message of the story is hinted at, usually through a conversation with a secondary character.",
          },
          {
            name: "Setup",
            content:
              "Introduce main characters, setting, and the protagonist's world. Show their flaws, desires, and the status quo.",
          },
          {
            name: "Catalyst",
            content:
              "The inciting incident that disrupts the hero's ordinary world and sets the story in motion.",
          },
          {
            name: "Debate",
            content:
              "The hero hesitates, weighing the risks and consequences of embarking on the journey.",
          },
        ],
      },
      {
        name: "Act II: Confrontation",
        type: "folder",
        color: "#8B5CF6",
        icon: "💥",
        children: [
          {
            name: "Break Into Two",
            content:
              "The hero makes a choice and fully enters the new world or situation, leaving the old world behind.",
          },
          {
            name: "B Story",
            content:
              "Introduce a secondary storyline, often a love story or friendship that supports the theme.",
          },
          {
            name: "Fun and Games",
            content:
              "The premise is explored through a series of challenges, discoveries, and character development.",
          },
          {
            name: "Midpoint",
            content:
              "A major event that raises stakes, often a false victory or defeat that changes the direction.",
          },
          {
            name: "Bad Guys Close In",
            content:
              "Internal and external pressures intensify as the antagonist gains ground.",
          },
          {
            name: "All Is Lost",
            content:
              "The lowest point where everything seems hopeless and the hero appears defeated.",
          },
          {
            name: "Dark Night of the Soul",
            content:
              "The hero hits rock bottom and must find the inner strength to continue.",
          },
        ],
      },
      {
        name: "Act III: Resolution",
        type: "folder",
        color: "#06B6D4",
        icon: "🎯",
        children: [
          {
            name: "Break Into Three",
            content:
              "The hero finds a solution, often combining lessons from both A and B stories.",
          },
          {
            name: "Finale",
            content:
              "The climax where the hero confronts the main conflict using everything they've learned.",
          },
          {
            name: "Final Image",
            content:
              "The opposite of the opening image, showing how the hero and their world have changed.",
          },
        ],
      },
    ];

    structure.forEach((act, actIndex) => {
      const actId = createItem({
        projectId,
        itemType: "folder",
        name: act.name,
        orderIndex: actIndex,
        color: act.color,
        icon: act.icon,
      });

      act.children.forEach((beat, beatIndex) => {
        createItem({
          projectId,
          parentItemId: actId,
          itemType: "document",
          name: beat.name,
          content: beat.content,
          orderIndex: beatIndex,
        });
      });
    });
  };

  const createSaveTheCatStructure = () => {
    const structure = [
      {
        name: "Opening Image",
        type: "document",
        content:
          "A visual that represents the tone and theme of the story. Shows the hero's world before change.",
      },
      {
        name: "Theme Stated",
        type: "document",
        content:
          "The moral or lesson the hero will learn, usually stated by another character early in the story.",
      },
      {
        name: "Set-up",
        type: "folder",
        color: "#EC4899",
        icon: "🏗️",
        children: [
          {
            name: "Catalyst",
            content:
              "The inciting incident that kicks off the story and presents the hero with a challenge.",
          },
          {
            name: "Debate",
            content:
              "The hero weighs the pros and cons of accepting the challenge or making a change.",
          },
        ],
      },
      {
        name: "Break into Act II",
        type: "document",
        content:
          "The hero makes a decision and crosses the threshold into the new world or situation.",
      },
      {
        name: "B Story",
        type: "document",
        content:
          "The relationship story that carries the theme and helps the hero grow.",
      },
      {
        name: "Fun and Games",
        type: "folder",
        color: "#F59E0B",
        icon: "🎮",
        children: [
          {
            name: "Midpoint",
            content:
              "A big event that raises stakes - either a false victory or false defeat.",
          },
          {
            name: "Bad Guys Close In",
            content:
              "Internal and external forces tighten their grip on the hero.",
          },
        ],
      },
      {
        name: "All Is Lost",
        type: "document",
        content:
          "The lowest point where everything seems hopeless for the hero.",
      },
      {
        name: "Dark Night of the Soul",
        type: "document",
        content:
          "The hero reflects on their journey and finds the will to continue.",
      },
      {
        name: "Break into Act III",
        type: "document",
        content:
          "The hero finds a solution by combining lessons from A and B stories.",
      },
      {
        name: "Finale",
        type: "folder",
        color: "#10B981",
        icon: "🏁",
        children: [
          {
            name: "Final Image",
            content:
              "The opposite of the opening image, showing how the hero has changed.",
          },
        ],
      },
    ];

    structure.forEach((item, index) => {
      if (item.type === "folder" && item.children) {
        const folderId = createItem({
          projectId,
          itemType: "folder",
          name: item.name,
          orderIndex: index,
          color: item.color,
          icon: item.icon,
        });

        item.children.forEach((child, childIndex) => {
          createItem({
            projectId,
            parentItemId: folderId,
            itemType: "document",
            name: child.name,
            content: child.content,
            orderIndex: childIndex,
          });
        });
      } else {
        createItem({
          projectId,
          itemType: "document",
          name: item.name,
          content: item.content,
          orderIndex: index,
        });
      }
    });
  };

  const createSevenPointStructure = () => {
    const structure = [
      {
        name: "Hook",
        type: "document",
        content:
          "Start with the opposite of your resolution. Show a character in a state that contrasts with who they'll become.",
      },
      {
        name: "Plot Turn 1",
        type: "document",
        content:
          "The inciting incident that moves the story from the hook into the main conflict. Introduces the central problem.",
      },
      {
        name: "Pinch 1",
        type: "document",
        content:
          "Apply pressure to the characters. Force them to step up and make decisions, often introducing the antagonist.",
      },
      {
        name: "Midpoint",
        type: "document",
        content:
          "The moment when characters move from reaction to action. They understand what's really at stake.",
      },
      {
        name: "Pinch 2",
        type: "document",
        content:
          "Apply even more pressure. The worst happens, plans fail, and things look hopeless.",
      },
      {
        name: "Plot Turn 2",
        type: "document",
        content:
          "The final piece of the puzzle falls into place. Characters discover what they need to resolve the story.",
      },
      {
        name: "Resolution",
        type: "document",
        content:
          "The climax and conclusion. Characters confront the main conflict and demonstrate their growth.",
      },
    ];

    structure.forEach((point, index) => {
      createItem({
        projectId,
        itemType: "document",
        name: `${index + 1}. ${point.name}`,
        content: point.content,
        orderIndex: index,
      });
    });
  };

  const createSnowflakeStructure = () => {
    const structure = [
      {
        name: "Step 1: One Sentence Summary",
        type: "document",
        content:
          "Write a one-sentence summary of your novel that hooks the reader.",
      },
      {
        name: "Step 2: One Paragraph Summary",
        type: "document",
        content:
          "Expand the sentence into a full paragraph describing the story setup, major disasters, and ending.",
      },
      {
        name: "Step 3: Character Sketches",
        type: "folder",
        color: "#8B5CF6",
        icon: "👤",
        children: [
          {
            name: "Main Character",
            content:
              "Define your protagonist's name, story goal, motivation, conflict, epiphany, and summary.",
          },
          {
            name: "Antagonist",
            content:
              "Define the main opposing force - could be a person, system, or internal conflict.",
          },
          {
            name: "Supporting Characters",
            content:
              "Brief sketches of other important characters and their roles.",
          },
        ],
      },
      {
        name: "Step 4: Expand to One Page",
        type: "document",
        content:
          "Expand each sentence of your paragraph into a full paragraph, creating a one-page synopsis.",
      },
      {
        name: "Step 5: Character Charts",
        type: "folder",
        color: "#EC4899",
        icon: "📋",
        children: [
          {
            name: "Main Character Details",
            content:
              "Full background, personality traits, appearance, and character arc.",
          },
          {
            name: "Supporting Cast Details",
            content: "Complete profiles for all major supporting characters.",
          },
        ],
      },
      {
        name: "Step 6: Expand to Four Pages",
        type: "document",
        content:
          "Expand each paragraph from the one-page synopsis into a full page, creating a four-page detailed outline.",
      },
      {
        name: "Step 7: Scene List",
        type: "folder",
        color: "#10B981",
        icon: "🎬",
        children: [
          {
            name: "Scene Planning",
            content:
              "Create a list of every scene in the novel with POV character and brief description.",
          },
        ],
      },
    ];

    structure.forEach((step, index) => {
      if (step.type === "folder" && step.children) {
        const folderId = createItem({
          projectId,
          itemType: "folder",
          name: step.name,
          orderIndex: index,
          color: step.color,
          icon: step.icon,
        });

        step.children.forEach((child, childIndex) => {
          createItem({
            projectId,
            parentItemId: folderId,
            itemType: "document",
            name: child.name,
            content: child.content,
            orderIndex: childIndex,
          });
        });
      } else {
        createItem({
          projectId,
          itemType: "document",
          name: step.name,
          content: step.content,
          orderIndex: index,
        });
      }
    });
  };

  const loadProjectData = () => {
    const projectData = getProject(projectId);
    const statsData = getProjectStats(projectId);
    const allItems = getItemsByProject(projectId) as ItemNode[];
    const publishData = getPublishingSettings(projectId);
    const coversData = getProjectCovers(projectId);

    setProject(projectData);
    setStats(statsData);
    setItems(buildItemTree(allItems));
    setPublishingSettingsState(publishData);
    setCovers(coversData);
  };

  const buildItemTree = (flatItems: ItemNode[]): ItemNode[] => {
    const itemMap = new Map<number, ItemNode>();
    const rootItems: ItemNode[] = [];

    flatItems.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    flatItems.forEach((item) => {
      const node = itemMap.get(item.id);
      if (!node) return;

      if (item.parent_item_id) {
        const parent = itemMap.get(item.parent_item_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootItems.push(node);
      }
    });

    const sortItems = (items: ItemNode[]) => {
      items.sort((a, b) => a.order_index - b.order_index);
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortItems(item.children);
        }
      });
    };

    sortItems(rootItems);
    return rootItems;
  };

  const getCurrentItems = (): ItemNode[] => {
    if (!currentFolder) return items;

    const findFolder = (items: ItemNode[], id: number): ItemNode | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findFolder(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const folder = findFolder(items, currentFolder);
    return folder?.children || [];
  };

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

  const toggleHeaderMinimize = () => {
    const toValue = isHeaderMinimized ? 1 : 0;
    setIsHeaderMinimized(!isHeaderMinimized);

    Animated.timing(headerHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleUpdateStatus = () => {
    const statuses = [
      "draft",
      "in_progress",
      "revision",
      "complete",
      "published",
    ];
    const currentIndex = statuses.indexOf(project.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    updateProject(projectId, { status: nextStatus });
    loadProjectData();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewItemForm({
        ...newItemForm,
        imageUri: result.assets[0].uri,
      });
    }
  };

  const handlePickCover = async (coverType: "front" | "back") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: coverType === "front" ? [2, 3] : [2, 3],
      quality: 0.9,
    });

    if (!result.canceled) {
      setProjectCover(projectId, coverType, result.assets[0].uri);
      loadProjectData();
      Alert.alert("Success", `${coverType} cover updated!`);
    }
  };

  const handleAddItem = () => {
    if (!newItemForm.name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      const metadata: any = {};

      if (
        newItemForm.itemType === "character" ||
        newItemForm.itemType === "location"
      ) {
        metadata.imageUri = newItemForm.imageUri;
        metadata.description = newItemForm.description;
      }

      createItem({
        projectId,
        parentItemId: currentFolder || undefined,
        itemType: newItemForm.itemType,
        name: newItemForm.name,
        content: newItemForm.content,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        orderIndex: getCurrentItems().length,
      });

      setShowAddModal(false);
      resetForm();
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to create item");
    }
  };

  const resetForm = () => {
    setNewItemForm({
      name: "",
      content: "",
      itemType: "document",
      description: "",
      imageUri: "",
    });
  };

  const handleFolderClick = (item: ItemNode) => {
    if (item.item_type === "folder" || item.item_type === "chapter") {
      setCurrentFolder(item.id);
      setFolderPath([...folderPath, item]);
    } else {
      handleEditItem(item);
    }
  };

  const handleBackClick = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolder(
        newPath.length > 0 ? newPath[newPath.length - 1].id : null
      );
    }
  };

  const handleEditItem = (item: ItemNode) => {
    let metadata = {};
    try {
      metadata = item.metadata ? JSON.parse(item.metadata) : {};
    } catch (e) {
      metadata = {};
    }

    setEditingItem({
      ...item,
      metadata,
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    try {
      const updateData: any = {
        name: editingItem.name,
        content: editingItem.content,
      };

      if (
        editingItem.item_type === "character" ||
        editingItem.item_type === "location"
      ) {
        updateData.metadata = {
          imageUri: editingItem.metadata?.imageUri || "",
          description: editingItem.metadata?.description || "",
          ...editingItem.metadata,
        };
      }

      updateItem(editingItem.id, updateData);
      setEditingItem(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to update item");
    }
  };

  const handleDeleteItem = (item: ItemNode) => {
    Alert.alert(
      "Delete Item",
      `Delete "${item.name}"? This will also delete all nested items.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteItem(item.id);
              loadProjectData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete item");
            }
          },
        },
      ]
    );
  };

  const handlePickEditImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && editingItem) {
      setEditingItem({
        ...editingItem,
        metadata: {
          ...editingItem.metadata,
          imageUri: result.assets[0].uri,
        },
      });
    }
  };

  const getAllDocuments = (): ItemNode[] => {
    const docs: ItemNode[] = [];
    const traverse = (items: ItemNode[]) => {
      items.forEach((item) => {
        if (item.item_type === "document" && item.content) {
          docs.push(item);
        }
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(items);
    return docs.sort((a, b) => a.order_index - b.order_index);
  };

  const frontCover = covers.find((c) => c.cover_type === "front");
  const backCover = covers.find((c) => c.cover_type === "back");
  const renderItemTree = (items: ItemNode[], depth: number = 0) => {
    return items.map((item) => {
      const safeName =
        typeof item.name === "string" ? item.name : String(item.name ?? "");
      const safeType =
        typeof item.item_type === "string"
          ? item.item_type
          : String(item.item_type ?? "");
      const safeIcon =
        typeof (item.icon || getItemIcon(item.item_type)) === "string"
          ? item.icon || getItemIcon(item.item_type)
          : "";

      return (
        <View key={item.id}>
          <TouchableOpacity
            onPress={() => handleFolderClick(item)}
            onLongPress={() => handleDeleteItem(item)}
            className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-2 shadow-sm"
            style={{ marginLeft: depth * 20 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-xl justify-center items-center mr-3"
                  style={{ backgroundColor: item.color || "#F3F4F6" }}
                >
                  <Text className="text-xl">{safeIcon}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-bold text-gray-900 dark:text-light-100"
                    numberOfLines={1}
                  >
                    {safeName}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-gray-500 dark:text-light-200 capitalize">
                      {safeType}
                    </Text>
                    {item.word_count && item.word_count > 0 && (
                      <Text className="text-xs text-gray-500 dark:text-light-200">
                        • {item.word_count} words
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              {(item.item_type === "folder" ||
                item.item_type === "chapter") && (
                <Text className="text-gray-400 dark:text-light-200 text-xl">
                  ›
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {item.children &&
            item.children.length > 0 &&
            renderItemTree(item.children, depth + 1)}
        </View>
      );
    });
  };

  const renderHeaderButtons = () => (
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={() => setShowTemplateModal(true)}
        className="bg-white dark:bg-dark-200 px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
          🎨 Template
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowCoverModal(true)}
        className="bg-white dark:bg-dark-200 px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
          📚 Cover
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowBookPreview(true)}
        className="bg-primary px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-white">👁️ Preview</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={toggleHeaderMinimize}
        className="w-10 h-10 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
      >
        <Text className="text-xl dark:text-light-100">
          {isHeaderMinimized ? "▼" : "▲"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTemplateModal = () => (
    <Modal
      visible={showTemplateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTemplateModal(false)}
    >
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[80%]">
          <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
            Choose Writing Template
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center">
              Select a story structure template to organize your writing
            </Text>

            {templates.map((template) => (
              <View key={template.value}>
                <TouchableOpacity
                  key={template.value}
                  onPress={() => {
                    applyTemplate(template.value);
                    setShowTemplateModal(false);
                  }}
                  className={`p-4 rounded-2xl mb-3 border-2 ${
                    project?.writing_template === template.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-dark-100 bg-light-100 dark:bg-dark-100"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{template.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`font-bold text-base ${
                          project?.writing_template === template.value
                            ? "text-primary"
                            : "text-gray-900 dark:text-light-100"
                        }`}
                      >
                        {template.label}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200 mt-1">
                        {template.desc}
                      </Text>
                    </View>
                    {project?.writing_template === template.value && (
                      <Text className="text-primary text-lg">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setShowTemplateModal(false)}
              className="bg-light-100 dark:bg-dark-100 py-4 rounded-full mt-2"
            >
              <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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

  const progress = stats?.targetWordCount
    ? (stats.wordCount / stats.targetWordCount) * 100
    : 0;
  const currentItems = getCurrentItems();
  const allDocs = getAllDocuments();

  return (
    <Background>
      <View className="flex-1">
        {/* Collapsible Header */}
        <Animated.View
          style={{
            height: headerHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [80, 400],
            }),
          }}
        >
          <View className="px-6 pt-16 pb-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
              >
                <Text className="text-xl dark:text-light-100">←</Text>
              </TouchableOpacity>
              {renderHeaderButtons()}
            </View>

            {!isHeaderMinimized && (
              <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg">
                <View className="flex-row items-start mb-4">
                  <View className="w-16 h-16 rounded-xl bg-secondary justify-center items-center mr-4">
                    <Text className="text-4xl">📖</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-2">
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
                      {project.genre && (
                        <View className="bg-light-100 dark:bg-dark-100 px-3 py-1 rounded-full">
                          <Text className="text-gray-600 dark:text-light-200 text-xs font-semibold">
                            {project.genre}
                          </Text>
                        </View>
                      )}
                      {project.writing_template && (
                        <View className="bg-light-100 dark:bg-dark-100 px-3 py-1 rounded-full">
                          <Text className="text-gray-600 dark:text-light-200 text-xs font-semibold">
                            {
                              templates.find(
                                (t) => t.value === project.writing_template
                              )?.label
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-3 mb-4">
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                      Words
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                      {stats?.wordCount?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                    <Text className="text-xs text-gray-600 dark:text-light-200 mb-1">
                      Items
                    </Text>
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100">
                      {stats?.fileCount || 0}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {project.target_word_count > 0 && (
                  <View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm font-semibold text-gray-700 dark:text-light-100">
                        Progress: {progress.toFixed(1)}%
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Target: {project.target_word_count.toLocaleString()}
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
              </View>
            )}
          </View>
        </Animated.View>

        {/* View Switcher */}
        <View className="px-6 py-3 border-b border-gray-200 dark:border-dark-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {[
                { key: "binder", label: "Binder", icon: "📚" },
                { key: "corkboard", label: "Corkboard", icon: "📌" },
                { key: "outline", label: "Outline", icon: "📋" },
              ].map((view) => (
                <View key={view.key}>
                  <TouchableOpacity
                    key={view.key}
                    onPress={() => setActiveView(view.key as any)}
                    className={`px-4 py-2 rounded-full ${
                      activeView === view.key
                        ? "bg-primary"
                        : "bg-light-100 dark:bg-dark-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        activeView === view.key
                          ? "text-white"
                          : "text-gray-600 dark:text-light-200"
                      }`}
                    >
                      {view.icon} {view.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Breadcrumb */}
        {folderPath.length > 0 && (
          <View className="px-6 py-2 bg-light-100 dark:bg-dark-100">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setCurrentFolder(null);
                    setFolderPath([]);
                  }}
                >
                  <Text className="text-sm text-primary font-semibold">
                    Root
                  </Text>
                </TouchableOpacity>
                {folderPath.map((folder, index) => (
                  <View key={folder.id} className="flex-row items-center gap-2">
                    <Text className="text-gray-400 dark:text-light-200">›</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newPath = folderPath.slice(0, index + 1);
                        setFolderPath(newPath);
                        setCurrentFolder(folder.id);
                      }}
                    >
                      <Text className="text-sm text-primary font-semibold">
                        {folder.name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Content Area */}
        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
        >
          {currentItems.length > 0 ? (
            renderItemTree(currentItems)
          ) : (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-6xl mb-4">📝</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-light-200 mb-2">
                Empty Folder
              </Text>
              <Text className="text-sm text-gray-600 dark:text-light-200 text-center px-8">
                Add documents, folders, characters or locations to get started
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          className="absolute bottom-6 right-6 w-16 h-16 bg-secondary rounded-full justify-center items-center shadow-xl"
          style={{
            shadowColor: "#FFC2C7",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text className="text-3xl">➕</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4">
                Add New Item
              </Text>

              <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                Item Type
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {[
                  { value: "document", label: "Document", icon: "📄" },
                  { value: "folder", label: "Folder", icon: "📁" },
                  { value: "character", label: "Character", icon: "👤" },
                  { value: "location", label: "Location", icon: "📍" },
                  { value: "note", label: "Note", icon: "📝" },
                  { value: "research", label: "Research", icon: "🔬" },
                ].map((type) => (
                  <View key={type.value}>
                    <TouchableOpacity
                      key={type.value}
                      onPress={() =>
                        setNewItemForm({
                          ...newItemForm,
                          itemType: type.value as any,
                        })
                      }
                      className={`px-4 py-2 rounded-full ${
                        newItemForm.itemType === type.value
                          ? "bg-primary"
                          : "bg-light-100 dark:bg-dark-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          newItemForm.itemType === type.value
                            ? "text-white"
                            : "text-gray-600 dark:text-light-200"
                        }`}
                      >
                        {type.icon} {type.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TextInput
                value={newItemForm.name}
                onChangeText={(text) =>
                  setNewItemForm({ ...newItemForm, name: text })
                }
                placeholder={`Enter ${newItemForm.itemType} name...`}
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100"
              />

              {(newItemForm.itemType === "character" ||
                newItemForm.itemType === "location") && (
                <>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-4 items-center"
                  >
                    {newItemForm.imageUri ? (
                      <Image
                        source={{ uri: newItemForm.imageUri }}
                        className="w-32 h-32 rounded-xl mb-2"
                      />
                    ) : (
                      <View className="w-32 h-32 rounded-xl bg-gray-200 dark:bg-dark-300 justify-center items-center mb-2">
                        <Text className="text-4xl">📷</Text>
                      </View>
                    )}
                    <Text className="text-sm text-primary font-semibold">
                      {newItemForm.imageUri ? "Change Image" : "Add Image"}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    value={newItemForm.description}
                    onChangeText={(text) =>
                      setNewItemForm({ ...newItemForm, description: text })
                    }
                    placeholder="Description..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100"
                  />
                </>
              )}

              {newItemForm.itemType === "document" && (
                <TextInput
                  value={newItemForm.content}
                  onChangeText={(text) =>
                    setNewItemForm({ ...newItemForm, content: text })
                  }
                  placeholder="Start writing... (optional)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100"
                  style={{ minHeight: 150 }}
                />
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-light-100 dark:bg-dark-100 py-4 rounded-full"
                >
                  <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddItem}
                  className="flex-1 bg-secondary py-4 rounded-full"
                >
                  <Text className="text-gray-900 dark:text-dark-300 font-bold text-center">
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={!!editingItem}
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white dark:bg-dark-300"
        >
          <View className="flex-1">
            <View className="px-6 pt-16 pb-4 border-b border-gray-200 dark:border-dark-100">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setEditingItem(null)}
                  className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                >
                  <Text className="text-xl dark:text-light-100">✕</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  className="bg-secondary px-6 py-3 rounded-full"
                >
                  <Text className="text-gray-900 dark:text-dark-300 font-bold">
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                value={editingItem?.name}
                onChangeText={(text) =>
                  setEditingItem({ ...editingItem, name: text })
                }
                placeholder="Name"
                placeholderTextColor="#9CA3AF"
                className="bg-light-100 dark:bg-dark-200 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100 text-lg font-bold"
              />

              {(editingItem?.item_type === "character" ||
                editingItem?.item_type === "location") && (
                <>
                  <TouchableOpacity
                    onPress={handlePickEditImage}
                    className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-4 items-center"
                  >
                    {editingItem?.metadata?.imageUri ? (
                      <Image
                        source={{ uri: editingItem.metadata.imageUri }}
                        className="w-40 h-40 rounded-xl mb-2"
                      />
                    ) : (
                      <View className="w-40 h-40 rounded-xl bg-gray-200 dark:bg-dark-300 justify-center items-center mb-2">
                        <Text className="text-5xl">
                          {editingItem?.item_type === "character" ? "👤" : "📍"}
                        </Text>
                      </View>
                    )}
                    <Text className="text-sm text-primary font-semibold">
                      {editingItem?.metadata?.imageUri
                        ? "Change Image"
                        : "Add Image"}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    value={editingItem?.metadata?.description || ""}
                    onChangeText={(text) =>
                      setEditingItem({
                        ...editingItem,
                        metadata: {
                          ...editingItem.metadata,
                          description: text,
                        },
                      })
                    }
                    placeholder="Description..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100"
                  />
                </>
              )}

              {editingItem?.item_type === "document" && (
                <>
                  <TextInput
                    value={editingItem?.content}
                    onChangeText={(text) =>
                      setEditingItem({ ...editingItem, content: text })
                    }
                    placeholder="Start writing your story..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    className="bg-white dark:bg-dark-200 rounded-2xl px-4 py-4 text-gray-900 dark:text-light-100 text-base leading-7"
                    style={{ minHeight: 400 }}
                  />

                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mt-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Word Count:{" "}
                        {editingItem?.content
                          ?.trim()
                          .split(/\s+/)
                          .filter(Boolean).length || 0}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Characters: {editingItem?.content?.length || 0}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Book Cover Modal */}
      <Modal
        visible={showCoverModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCoverModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-6 text-center">
              Book Covers
            </Text>

            <View className="flex-row gap-4 mb-6">
              <TouchableOpacity
                onPress={() => handlePickCover("front")}
                className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4 items-center"
              >
                {frontCover ? (
                  <Image
                    source={{ uri: frontCover.image_uri }}
                    className="w-full h-48 rounded-xl mb-3"
                  />
                ) : (
                  <View className="w-full h-48 bg-gray-200 dark:bg-dark-300 rounded-xl justify-center items-center mb-3">
                    <Text className="text-4xl mb-2">📖</Text>
                    <Text className="text-xs text-gray-600 dark:text-light-200">
                      Front Cover
                    </Text>
                  </View>
                )}
                <Text className="text-sm font-bold text-primary">
                  {frontCover ? "Change" : "Add"} Front
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePickCover("back")}
                className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4 items-center"
              >
                {backCover ? (
                  <Image
                    source={{ uri: backCover.image_uri }}
                    className="w-full h-48 rounded-xl mb-3"
                  />
                ) : (
                  <View className="w-full h-48 bg-gray-200 dark:bg-dark-300 rounded-xl justify-center items-center mb-3">
                    <Text className="text-4xl mb-2">📄</Text>
                    <Text className="text-xs text-gray-600 dark:text-light-200">
                      Back Cover
                    </Text>
                  </View>
                )}
                <Text className="text-sm font-bold text-primary">
                  {backCover ? "Change" : "Add"} Back
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowCoverModal(false)}
              className="bg-light-100 dark:bg-dark-100 py-4 rounded-full"
            >
              <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Template Selection Modal */}
      {renderTemplateModal()}

      {/* Book Preview Modal with 3D Page Flip */}
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
              <Text className="text-lg font-bold text-white">Book Preview</Text>
              <View className="w-10" />
            </View>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const pageNum = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPage(pageNum);
            }}
            scrollEventThrottle={16}
          >
            {/* Front Cover */}
            {frontCover && (
              <View className="items-center justify-center" style={{ width }}>
                <Image
                  source={{ uri: frontCover.image_uri }}
                  className="rounded-2xl shadow-2xl"
                  style={{ width: width * 0.7, height: width * 1.05 }}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Content Pages */}
            {allDocs.map((doc, index) => (
              <View
                key={doc.id}
                className="px-8 py-12 justify-center"
                style={{ width }}
              >
                <View
                  className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-2xl"
                  style={{ height: width * 1.2 }}
                >
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-4">
                    {doc.name}
                  </Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text className="text-base text-gray-800 dark:text-light-200 leading-7">
                      {typeof doc.content === "string" ? doc.content : ""}
                    </Text>
                  </ScrollView>
                  <Text className="text-xs text-gray-500 dark:text-light-200 text-center mt-4">
                    Page {index + 1}
                  </Text>
                </View>
              </View>
            ))}

            {/* Back Cover */}
            {backCover && (
              <View className="items-center justify-center" style={{ width }}>
                <Image
                  source={{ uri: backCover.image_uri }}
                  className="rounded-2xl shadow-2xl"
                  style={{ width: width * 0.7, height: width * 1.05 }}
                  resizeMode="cover"
                />
              </View>
            )}
          </ScrollView>

          {/* Page Indicator */}
          <View className="absolute bottom-8 left-0 right-0 items-center">
            <View className="bg-black/50 px-6 py-3 rounded-full">
              <Text className="text-white font-bold">
                Page {currentPage + 1} of{" "}
                {(frontCover ? 1 : 0) + allDocs.length + (backCover ? 1 : 0)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </Background>
  );
};

export default NovelDetails;
