import Background from "@/components/common/Background";
import { templates } from "@/constants/create";
import { fontFamilies, getItemIcon, themes } from "@/constants/novelDetails";
import {
  structure,
  structure2,
  structure3,
  structure4,
  structure5,
} from "@/constants/template";
import { ItemNode, WritingSettings } from "@/types/novelDetails";

import {
  createItem,
  deleteItem,
  getItemsByProject,
  getProject,
  getProjectCovers,
  getProjectStats,
  getPublishingSettings,
  getWritingSettings,
  setWritingSetting,
  setProjectCover,
  updateItem,
  updateProject,
} from "@/utils/database";
// @ts-ignore
import * as ImagePicker from "expo-image-picker";
// @ts-ignore
import { useLocalSearchParams } from "expo-router";
import React, { JSX, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import {
  publishProject,
  isAuthenticated,
  convertImageToBase64,
} from "@/utils/api";
import GlobalAlert from "@/components/common/GlobalAlert";
import KeyboardAvoidingLayout from "@/components/common/KeyboardAvoidingLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width, height } = Dimensions.get("window");

const NovelDetails = () => {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const projectId = parseInt(id as string);

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [items, setItems] = useState<ItemNode[]>([]);
  const [publishingSettings, setPublishingSettingsState] = useState<any>(null);
  const [covers, setCovers] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<number>>(
    new Set()
  );

  const [activeView, setActiveView] = useState<
    "outline" | "chapters" | "references"
  >("outline");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<ItemNode[]>([]);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showWritingSettings, setShowWritingSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingItem, setRenamingItem] = useState<ItemNode | null>(null);
  const [newItemName, setNewItemName] = useState("");

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

  const [writingSettings, setWritingSettings] = useState<WritingSettings>({
    fontSize: 18,
    fontFamily: "Georgia",
    lineHeight: 1.8,
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    paragraphSpacing: 16,
    textAlign: "left",
    // @ts-ignore
    pageWidth: 650,
    marginTop: 40,
    marginBottom: 40,
  });

  const [editorStats, setEditorStats] = useState({
    wordCount: 0,
    charCount: 0,
    paragraphCount: 0,
    readingTime: 0,
    sentenceCount: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;
  const editorRef = useRef<any>(null);
  const autoSaveTimer = useRef<any>(null);
  const scrollViewRef = useRef<any>(null);

  const [publishingStatus, setPublishingStatus] = useState<
    "idle" | "publishing" | "updating" | "syncing"
  >("idle");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedProjectId, setPublishedProjectId] = useState<string | null>(
    null
  );
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showChapterPublishModal, setShowChapterPublishModal] = useState(false);
  const [selectedChapterForPublish, setSelectedChapterForPublish] =
    useState<ItemNode | null>(null);

  const [isUploadingFrontCover, setIsUploadingFrontCover] = useState(false);
  const [isUploadingBackCover, setIsUploadingBackCover] = useState(false);

  // ==================== Effects ====================

  useEffect(() => {
    if (isSelectionMode) {
      clearSelection();
    }
  }, [activeView]);

  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
    initializeTemplateStructure();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [projectId]);

  useEffect(() => {
    if (autoSaveEnabled && editingItem) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editingItem?.content, autoSaveEnabled]);

  useEffect(() => {
    if (editingItem?.content) {
      calculateEditorStats(editingItem.content);
    }
  }, [editingItem?.content]);

  // ==================== Function Defination ====================

  const calculateEditorStats = (html: string) => {
    const plainText = html.replace(/<[^>]*>/g, "").trim();
    const words = plainText.split(/\s+/).filter(Boolean);
    const sentences = plainText.split(/[.!?]+/).filter(Boolean);
    const paragraphs = plainText.split(/\n\n+/).filter(Boolean);

    setEditorStats({
      wordCount: words.length,
      charCount: plainText.length,
      paragraphCount: paragraphs.length,
      sentenceCount: sentences.length,
      readingTime: Math.ceil(words.length / 200),
    });
  };

  const handleAutoSave = () => {
    if (!editingItem) return;
    try {
      const updateData: any = {
        name: editingItem.name,
        content: editingItem.content,
        word_count: editorStats.wordCount,
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
      loadProjectData();
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const initializeTemplateStructure = () => {
    const projectData = getProject(projectId);
    if (!projectData) return;

    const existingItems = getItemsByProject(projectId) as ItemNode[];
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
      // @ts-ignore
      projectData.writing_template &&
      // @ts-ignore
      projectData.writing_template !== "freeform"
    ) {
      // @ts-ignore
      applyTemplate(projectData.writing_template, false);
    }
  };

  const applyTemplate = (
    templateType: string,
    clearExisting: boolean = true
  ) => {
    try {
      const existingItems = getItemsByProject(projectId) as ItemNode[];

      if (clearExisting && existingItems.length > 0) {
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
          break;
      }
      // @ts-ignore
      updateProject(projectId, { writing_template: templateType } as any);
      loadProjectData();

      GlobalAlert.show({
        title: "Success",
        message: `Applied ${
          templates.find((t) => t.value === templateType)?.label
        } template`,
        primaryText: "Okay",
      });
    } catch (error) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to apply template",
        primaryText: "Okay",
      });
    }
  };

  const createHerosJourneyStructure = () => {
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
    structure2.forEach((act, actIndex) => {
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
    structure3.forEach((item, index) => {
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
    structure4.forEach((point, index) => {
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
    structure5.forEach((step, index) => {
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

    const coversData = getProjectCovers(projectId);
    const publishData = getPublishingSettings(projectId);

    setProject(projectData);
    setStats(statsData);
    setItems(buildItemTree(allItems));
    setPublishingSettingsState(publishData);
    setCovers(coversData);

    // @ts-ignore

    setIsPublished(!!publishData?.is_published);
    // @ts-ignore
    setPublishedProjectId(publishData?.published_project_id || null);

    const writingSettingsData: any = getWritingSettings(projectId);

    if (writingSettingsData) {
      setWritingSettings({
        fontSize: writingSettingsData.font_size,
        fontFamily: writingSettingsData.font_family,
        lineHeight: writingSettingsData.line_height,
        textColor: writingSettingsData.text_color,
        backgroundColor: writingSettingsData.background_color,
        paragraphSpacing: writingSettingsData.paragraph_spacing,
        textAlign: writingSettingsData.text_align,
        // @ts-ignore
        pageWidth: writingSettingsData.page_width,
        marginTop: writingSettingsData.margin_top,
        marginBottom: writingSettingsData.margin_bottom,
      });
      setTypewriterMode(writingSettingsData.typewriter_mode === 1);
      setAutoSaveEnabled(writingSettingsData.auto_save === 1);
      setZenMode(false);
    }
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
      GlobalAlert.show({
        title: "Permission needed",
        message: "Please grant camera roll permissions",
        primaryText: "Okay",
      });
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
      GlobalAlert.show({
        title: "Permission needed",
        message: "Please grant camera roll permissions",
        primaryText: "Okay",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: coverType === "front" ? [2, 3] : [2, 3],
      quality: 0.9,
      base64: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      // Set loading state based on cover type
      if (coverType === "front") {
        setIsUploadingFrontCover(true);
      } else {
        setIsUploadingBackCover(true);
      }

      try {
        // Convert image to base64 and save
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProjectCover(projectId, coverType, base64Image);

        loadProjectData();

        GlobalAlert.show({
          title: "Success",
          message: `${coverType} cover updated!`,
          primaryText: "Okay",
        });
      } catch (error: any) {
        GlobalAlert.show({
          title: "Error",
          message: error.message || `Failed to update ${coverType} cover`,
          primaryText: "Okay",
        });
      } finally {
        // Reset loading state
        if (coverType === "front") {
          setIsUploadingFrontCover(false);
        } else {
          setIsUploadingBackCover(false);
        }
      }
    }
  };

  const handleAddItem = () => {
    if (!newItemForm.name.trim()) {
      GlobalAlert.show({
        title: "Error",
        message: "Please enter a name",
        primaryText: "Okay",
      });
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
      GlobalAlert.show({
        title: "Error",
        message: "Failed to create item",
        primaryText: "Okay",
      });
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
    if (isSelectionMode) {
      toggleItemSelection(item.id);
      return;
    }

    if (item.item_type === "folder" || item.item_type === "chapter") {
      setCurrentFolder(item.id);
      setFolderPath([...folderPath, item]);
      clearSelection();
    } else {
      handleEditItem(item);
      clearSelection();
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
        word_count: editorStats.wordCount,
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

      GlobalAlert.show({
        title: "Saved",
        message: "Changes saved successfully!",
        primaryText: "Okay",
      });
    } catch (error) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to update item",
        primaryText: "Okay",
      });
    }
  };

  const handleDeleteItem = (item: ItemNode) => {
    GlobalAlert.show({
      title: "Delete Item",
      message: `Delete "${item.name}"? This will also delete all nested items.`,

      // Make Delete the primary action
      primaryText: "Delete",
      onPrimary: () => {
        // Changed from onSecondary to onPrimary
        try {
          deleteItem(item.id);
          loadProjectData();
          clearSelection();
        } catch (error) {
          GlobalAlert.show({
            title: "Error",
            message: "Failed to delete item",
            primaryText: "Okay",
          });
        }
      },

      // Cancel becomes secondary
      secondaryText: "Cancel",
    });
  };

  // Add this new function to handle bulk deletion from selection toolbar
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;

    GlobalAlert.show({
      title: "Delete Items",
      message: `Delete ${selectedItems.size} selected item(s)? This will also delete all nested items.`,

      // Primary button = destructive delete
      secondaryText: "Delete",
      onSecondary: () => {
        try {
          for (const itemId of selectedItems) {
            deleteItem(itemId);
          }

          loadProjectData();
          clearSelection();

          // success alert
          GlobalAlert.show({
            title: "Success",
            message: `${selectedItems.size} item(s) deleted successfully!`,
            primaryText: "Okay",
          });
        } catch (error) {
          // error alert
          GlobalAlert.show({
            title: "Error",
            message: "Failed to delete items",
            primaryText: "Okay",
          });
        }
      },

      // Cancel button (auto-closes modal)

      primaryText: "Cancel",
      onPrimary: () => {},
    });
  };

  const handlePickEditImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      GlobalAlert.show({
        title: "Permission needed",
        message: "Please grant camera roll permissions",
        primaryText: "Okay",
      });
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

  const updateWritingSetting = (key: keyof WritingSettings, value: any) => {
    setWritingSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      // Save to database
      setWritingSetting({
        // @ts-ignore
        projectId,
        [key]: value,

        typewriterMode,
        autoSave: autoSaveEnabled,
        zenMode,
      });

      return newSettings;
    });
  };

  const handleTypewriterToggle = (enabled: boolean) => {
    setTypewriterMode(enabled);
    setWritingSetting({
      // @ts-ignore
      projectId,
      typewriterMode: enabled,
    });
  };

  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    setWritingSetting({
      // @ts-ignore
      projectId,
      autoSave: enabled,
    });
  };

  const handleZenModeToggle = (enabled: boolean) => {
    setZenMode(enabled);
    setWritingSetting({
      // @ts-ignore
      projectId,
      zenMode: enabled,
    });
  };

  const reset = () => {
    setWritingSettings({
      fontSize: 18,
      fontFamily: "Georgia",
      lineHeight: 1.8,
      textColor: "#1F2937",
      backgroundColor: "#FFFFFF",
      paragraphSpacing: 16,
      textAlign: "left",
      // @ts-ignore
      pageWidth: 650,
      marginTop: 40,
      marginBottom: 40,
    });

    setWritingSetting({
      // @ts-ignore
      projectId,
      zenMode: false,
      typewriterMode: false,
      ...writingSettings,
    });
  };

  const exportToFormat = (format: "txt" | "html" | "markdown") => {
    const allDocs = getAllDocuments();
    let exportContent = "";

    switch (format) {
      case "txt":
        exportContent = allDocs
          .map(
            (doc) =>
              `${doc.name}\n\n${doc.content?.replace(/<[^>]*>/g, "") || ""}\n\n`
          )
          .join("\n\n---\n\n");
        break;
      case "html":
        exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 650px; margin: 40px auto; padding: 20px; line-height: 1.8; }
    h1 { margin-top: 40px; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  ${project.author_name ? `<p><em>by ${project.author_name}</em></p>` : ""}
  ${allDocs.map((doc) => `<h2>${doc.name}</h2>${doc.content || ""}`).join("\n")}
</body>
</html>`;
        break;
      case "markdown":
        exportContent = `# ${project.title}\n\n${
          project.author_name ? `*by ${project.author_name}*\n\n` : ""
        }${allDocs
          .map(
            (doc) =>
              `## ${doc.name}\n\n${
                doc.content?.replace(/<[^>]*>/g, "") || ""
              }\n\n`
          )
          .join("\n")}`;
        break;
    }

    GlobalAlert.show({
      title: "Export Ready",
      message: `Your ${format.toUpperCase()} export is ready!`,
      primaryText: "Okay",
    });
    console.log("Export content:", exportContent);
  };

  const renderWritingSettingsModal = () => {
    return (
      <Modal
        visible={showWritingSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWritingSettings(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-4">
          <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-2xl max-h-[90%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
                Editor Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowWritingSettings(false)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-100 justify-center items-center"
              >
                <Text className="text-gray-600 dark:text-light-200">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="max-h-[600px]"
            >
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  Theme Presets
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3"
                >
                  <View className="flex-row gap-3">
                    {themes.map((theme, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          updateWritingSetting("backgroundColor", theme.bg);
                          updateWritingSetting("textColor", theme.text);
                        }}
                        className="w-24 h-28 rounded-2xl overflow-hidden border-2 border-gray-300"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <View className="flex-1 p-3">
                          <View className="h-2 bg-current opacity-60 rounded mb-2" />
                          <View className="h-1 bg-current opacity-40 rounded mb-1" />
                          <View className="h-1 bg-current opacity-40 rounded mb-1" />
                          <View className="h-1 bg-current opacity-40 rounded" />
                        </View>
                        <View
                          className="py-2"
                          style={{ backgroundColor: theme.bg }}
                        >
                          <Text
                            className="text-xs font-bold text-center"
                            style={{ color: theme.text }}
                          >
                            {theme.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  Font Family
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {fontFamilies.map((font) => (
                      <TouchableOpacity
                        key={font.value}
                        onPress={() =>
                          updateWritingSetting("fontFamily", font.value)
                        }
                        className={`px-5 py-3 rounded-xl ${
                          writingSettings.fontFamily === font.value
                            ? "bg-primary"
                            : "bg-light-100 dark:bg-dark-100"
                        }`}
                      >
                        <Text
                          className={`text-center font-bold ${
                            writingSettings.fontFamily === font.value
                              ? "text-white"
                              : "text-gray-600 dark:text-light-200"
                          }`}
                          style={{
                            fontFamily:
                              font.value === "System" ? undefined : font.value,
                          }}
                        >
                          {font.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  Font Size: {writingSettings.fontSize}px
                </Text>
                <View className="flex-row gap-2 mb-2">
                  {[14, 16, 18, 20, 22, 24, 28].map((size) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => updateWritingSetting("fontSize", size)}
                      className={`flex-1 py-3 rounded-xl ${
                        writingSettings.fontSize === size
                          ? "bg-primary"
                          : "bg-light-100 dark:bg-dark-100"
                      }`}
                    >
                      <Text
                        className={`text-center font-bold ${
                          writingSettings.fontSize === size
                            ? "text-white"
                            : "text-gray-600 dark:text-light-200"
                        }`}
                        style={{ fontSize: Math.min(size, 20) }}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  Line Height: {writingSettings.lineHeight}
                </Text>
                <View className="flex-row gap-2">
                  {[1.4, 1.6, 1.8, 2.0, 2.2, 2.5].map((height) => (
                    <TouchableOpacity
                      key={height}
                      onPress={() => updateWritingSetting("lineHeight", height)}
                      className={`flex-1 py-3 rounded-xl ${
                        writingSettings.lineHeight === height
                          ? "bg-primary"
                          : "bg-light-100 dark:bg-dark-100"
                      }`}
                    >
                      <Text
                        className={`text-center font-bold ${
                          writingSettings.lineHeight === height
                            ? "text-white"
                            : "text-gray-600 dark:text-light-200"
                        }`}
                      >
                        {height}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  {/* @ts-ignore */}
                  Page Width: {writingSettings.pageWidth}px
                </Text>
                <View className="flex-row gap-2">
                  {[600, 650, 700, 800, 900].map((w) => (
                    <TouchableOpacity
                      key={w}
                      // @ts-ignore
                      onPress={() => updateWritingSetting("pageWidth", w)}
                      className={`flex-1 py-3 rounded-xl ${
                        // @ts-ignore
                        writingSettings.pageWidth === w
                          ? "bg-primary"
                          : "bg-light-100 dark:bg-dark-100"
                      }`}
                    >
                      <Text
                        className={`text-center font-bold ${
                          // @ts-ignore
                          writingSettings.pageWidth === w
                            ? "text-white"
                            : "text-gray-600 dark:text-light-200"
                        }`}
                      >
                        {w}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-4">
                  Editor Modes
                </Text>

                <TouchableOpacity
                  onPress={() => handleTypewriterToggle(!typewriterMode)}
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">⌨️</Text>
                    <View>
                      <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                        Typewriter Mode
                      </Text>
                      <Text className="text-xs text-gray-600 dark:text-light-200">
                        Scrolls text as you type
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`w-12 h-7 rounded-full ${
                      typewriterMode ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white mt-1 ${
                        typewriterMode ? "ml-6" : "ml-1"
                      }`}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAutoSaveToggle(!autoSaveEnabled)}
                  className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">💾</Text>
                    <View>
                      <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                        Auto-Save
                      </Text>
                      <Text className="text-xs text-gray-600 dark:text-light-200">
                        Saves every 3 seconds
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`w-12 h-7 rounded-full ${
                      autoSaveEnabled ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white mt-1 ${
                        autoSaveEnabled ? "ml-6" : "ml-1"
                      }`}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => reset()}
                className="flex-1 bg-gray-200 dark:bg-dark-100 py-4 rounded-full"
              >
                <Text className="text-gray-700 dark:text-light-200 font-bold text-center">
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowWritingSettings(false)}
                className="flex-1 bg-primary py-4 rounded-full"
              >
                <Text className="text-white font-bold text-center">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderStatisticsModal = () => (
    <Modal
      visible={showStatistics}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStatistics(false)}
    >
      <View className="flex-1 bg-black/90 justify-center items-center px-4">
        <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
              Document Statistics
            </Text>
            <TouchableOpacity
              onPress={() => setShowStatistics(false)}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-100 justify-center items-center"
            >
              <Text className="text-gray-600 dark:text-light-200">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="bg-primary rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm mb-1">Words</Text>
              <Text className="text-white text-4xl font-bold">
                {editorStats.wordCount.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
                <Text className="text-gray-600 dark:text-light-200 text-xs mb-1">
                  Characters
                </Text>
                <Text className="text-gray-900 dark:text-light-100 text-2xl font-bold">
                  {editorStats.charCount.toLocaleString()}
                </Text>
              </View>

              <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
                <Text className="text-gray-600 dark:text-light-200 text-xs mb-1">
                  Paragraphs
                </Text>
                <Text className="text-gray-900 dark:text-light-100 text-2xl font-bold">
                  {editorStats.paragraphCount}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
                <Text className="text-gray-600 dark:text-light-200 text-xs mb-1">
                  Sentences
                </Text>
                <Text className="text-gray-900 dark:text-light-100 text-2xl font-bold">
                  {editorStats.sentenceCount}
                </Text>
              </View>

              <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
                <Text className="text-gray-600 dark:text-light-200 text-xs mb-1">
                  Reading Time
                </Text>
                <Text className="text-gray-900 dark:text-light-100 text-2xl font-bold">
                  {editorStats.readingTime}m
                </Text>
              </View>
            </View>

            <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3">
              <Text className="text-gray-600 dark:text-light-200 text-sm mb-2">
                Average Words per Sentence
              </Text>
              <Text className="text-gray-900 dark:text-light-100 text-xl font-bold">
                {editorStats.sentenceCount > 0
                  ? (editorStats.wordCount / editorStats.sentenceCount).toFixed(
                      1
                    )
                  : 0}
              </Text>
            </View>

            <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4">
              <Text className="text-gray-600 dark:text-light-200 text-sm mb-2">
                Pages (250 words/page)
              </Text>
              <Text className="text-gray-900 dark:text-light-100 text-xl font-bold">
                {Math.ceil(editorStats.wordCount / 250)}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowStatistics(false)}
            className="bg-primary py-4 rounded-full mt-4"
          >
            <Text className="text-white font-bold text-center">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowExportModal(false)}
    >
      <View className="flex-1 bg-black/90 justify-center items-center px-4">
        <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-light-100">
              Export Project
            </Text>
            <TouchableOpacity
              onPress={() => setShowExportModal(false)}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-100 justify-center items-center"
            >
              <Text className="text-gray-600 dark:text-light-200">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-600 dark:text-light-200 mb-4">
            Choose your export format
          </Text>

          <TouchableOpacity
            onPress={() => {
              exportToFormat("txt");
              setShowExportModal(false);
            }}
            className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3 flex-row items-center"
          >
            <Text className="text-3xl mr-4">📄</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                Plain Text (.txt)
              </Text>
              <Text className="text-xs text-gray-600 dark:text-light-200">
                Simple text file, no formatting
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              exportToFormat("html");
              setShowExportModal(false);
            }}
            className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3 flex-row items-center"
          >
            <Text className="text-3xl mr-4">🌐</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                HTML (.html)
              </Text>
              <Text className="text-xs text-gray-600 dark:text-light-200">
                Web page with formatting
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              exportToFormat("markdown");
              setShowExportModal(false);
            }}
            className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-3 flex-row items-center"
          >
            <Text className="text-3xl mr-4">📝</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                Markdown (.md)
              </Text>
              <Text className="text-xs text-gray-600 dark:text-light-200">
                Markdown formatted text
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowExportModal(false)}
            className="bg-gray-200 dark:bg-dark-100 py-4 rounded-full mt-2"
          >
            <Text className="text-gray-700 dark:text-light-200 font-bold text-center">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const frontCover = covers.find((c) => c.cover_type === "front");
  const backCover = covers.find((c) => c.cover_type === "back");

  const renderItemTree = (
    items: ItemNode[],
    depth: number = 0,
    prefix: string = "tree"
  ) => {
    return items.map((item) => {
      const uniqueKey = `${prefix}-${item.id}-${depth}`;
      const safeName = item.name || "Untitled";
      const safeType = item.item_type || "document";
      const safeIcon = item.icon || getItemIcon(item.item_type);
      const isSelected = selectedItems.has(item.id);
      const isCollapsed = collapsedFolders.has(item.id);
      const isFolder =
        item.item_type === "folder" || item.item_type === "chapter";

      return (
        <Animated.View
          key={uniqueKey}
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (isSelectionMode) {
                toggleItemSelection(item.id);
              } else {
                handleFolderClick(item);
              }
            }}
            onLongPress={() => {
              if (!isSelectionMode) {
                GlobalAlert.show({
                  title: "Item Actions",
                  message: `What would you like to do with "${item.name}"?`,

                  primaryText: "More options",
                  onPrimary: () => {
                    setIsSelectionMode(true);
                    toggleItemSelection(item.id);
                  },

                  secondaryText: "Rename",
                  onSecondary: () => handleRenameItem(item),
                });
              }
            }}
            className={`bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm border-2 ${
              isSelected ? "border-primary" : "border-transparent"
            }`}
            style={{ marginLeft: depth * 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-xl justify-center items-center mr-3"
                  style={{ backgroundColor: item.color || "#F3F4F6" }}
                >
                  <Text className="text-2xl">{String(safeIcon)}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-bold text-gray-900 dark:text-light-100"
                    numberOfLines={1}
                  >
                    {String(safeName)}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-gray-500 dark:text-light-200 capitalize">
                      {String(safeType)}
                    </Text>
                    {item.word_count !== undefined && item.word_count > 0 ? (
                      <Text className="text-xs text-gray-500 dark:text-light-200">
                        • {item.word_count.toLocaleString()} words
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                {isFolder && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFolderCollapse(item.id);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-100 justify-center items-center"
                  >
                    <Text className="text-gray-600 dark:text-light-200 text-lg">
                      {isCollapsed ? "▶" : "▼"}
                    </Text>
                  </TouchableOpacity>
                )}

                {(isFolder || item.item_type === "document") && (
                  <Text className="text-gray-400 dark:text-light-200 text-2xl">
                    ›
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {item.children &&
            item.children.length > 0 &&
            !isCollapsed &&
            renderItemTree(item.children, depth + 1, prefix)}
        </Animated.View>
      );
    });
  };

  const renderHeaderButtons = () => (
    <View className="flex-row  justify-evenly w-full gap-2">
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
          📖 Covers
        </Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        onPress={() => setShowExportModal(true)}
        className="bg-white dark:bg-dark-200 px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
          📤 Export
        </Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        onPress={() => setShowBookPreview(true)}
        className="bg-primary px-4 py-2 rounded-full shadow-lg"
      >
        <Text className="text-sm font-bold text-white">👁️ Preview</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowWritingSettings(true)}
        className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
      >
        <Text className="text-lg">⚙️</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleHeaderMinimize}
        className="w-9 h-9 rounded-full bg-white dark:bg-dark-200 justify-center items-center shadow-lg"
      >
        <Text className="text-2xl flex dark:text-light-100">
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
      <View className="flex-1 bg-black/90 justify-center items-center px-6">
        <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md max-h-[80%]">
          <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
            Choose Writing Template
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center">
              Select a story structure template to organize your writing
            </Text>

            {templates.map((template) => (
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
                  <Text className="text-3xl mr-3">{template.icon}</Text>
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
                    <Text className="text-primary text-2xl">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
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

  const getChapters = () => {
    const chapters: ItemNode[] = [];

    const traverseItems = (items: ItemNode[]) => {
      items.forEach((item) => {
        if (item.item_type === "document" || item.item_type === "chapter") {
          chapters.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverseItems(item.children);
        }
      });
    };

    traverseItems(items);
    return chapters.sort((a, b) => a.order_index - b.order_index);
  };

  const getCharacters = () => {
    const characters: ItemNode[] = [];

    const traverseItems = (items: ItemNode[]) => {
      items.forEach((item) => {
        if (item.item_type === "character") {
          characters.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverseItems(item.children);
        }
      });
    };

    traverseItems(items);
    return characters;
  };

  const getLocations = () => {
    const locations: ItemNode[] = [];

    const traverseItems = (items: ItemNode[]) => {
      items.forEach((item) => {
        if (item.item_type === "location") {
          locations.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverseItems(item.children);
        }
      });
    };

    traverseItems(items);
    return locations;
  };

  const getNotes = () => {
    const notes: ItemNode[] = [];

    const traverseItems = (items: ItemNode[]) => {
      items.forEach((item) => {
        if (item.item_type === "note" || item.item_type === "research") {
          notes.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverseItems(item.children);
        }
      });
    };

    traverseItems(items);
    return notes;
  };

  const toggleItemSelection = (itemId: number) => {
    const newSelected = new Set(selectedItems);

    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }

    setSelectedItems(newSelected);

    // Update selection mode based on whether we have any selected items
    setIsSelectionMode(newSelected.size > 0);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleRenameItem = (item: ItemNode) => {
    setRenamingItem(item);
    setNewItemName(item.name);
    setShowRenameModal(true);
  };

  const handleConfirmRename = () => {
    if (!renamingItem || !newItemName.trim()) {
      setShowRenameModal(false);
      return;
    }

    try {
      updateItem(renamingItem.id, { name: newItemName.trim() });
      loadProjectData();
      clearSelection();
      setShowRenameModal(false);
      setRenamingItem(null);
      setNewItemName("");

      GlobalAlert.show({
        title: "Success",
        message: "Item renamed successfully!",
        primaryText: "Cancel",
      });
    } catch (error) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to rename item",
        primaryText: "Cancel",
      });
    }
  };

  const handleCopyItems = async () => {
    if (selectedItems.size === 0) return;

    try {
      for (const itemId of selectedItems) {
        const originalItem = findItemById(items, itemId);
        if (originalItem) {
          await createItem({
            projectId,
            parentItemId: currentFolder || undefined,
            itemType: originalItem.item_type as any,
            name: `${originalItem.name} (Copy)`,
            content: originalItem.content || "",
            metadata: originalItem.metadata,
            orderIndex: getCurrentItems().length,
          });
        }
      }

      GlobalAlert.show({
        title: "Success",
        message: `${selectedItems.size} item(s) copied successfully!`,
        primaryText: "Cancel",
      });
      clearSelection();
      loadProjectData();
    } catch (error) {
      GlobalAlert.show({
        title: "Error",
        message: "Failed to copy items",
        primaryText: "Cancel",
      });
    }
  };

  const handleMoveItems = () => {
    if (selectedItems.size === 0) return;
    setShowActionModal(true);
  };

  const handlePublishProject = async () => {
    try {
      if (!isAuthenticated()) {
        GlobalAlert.show({
          title: "Login Required",
          message:
            "You must be logged in to publish projects. Please login first.",
          primaryText: "Okay",
        });
        return;
      }

      if (!project) return;

      setPublishingStatus("publishing");

      // Get all items to publish
      const allItems = getItemsByProject(projectId) as ItemNode[];

      // Filter only chapters/documents, exclude folders and other item types
      const itemsToPublish = allItems
        // @ts-ignore
        .filter((item) => item.is_included_in_export !== 0)
        .filter(
          (item) =>
            item.item_type === "document" || item.item_type === "chapter"
        )
        .map((item) => ({
          parentItemId: item.parent_item_id
            ? item.parent_item_id.toString()
            : "",
          itemType: item.item_type,
          name: item.name,
          description: item.name,
          content: item.content,
          metadata: item.metadata,
          orderIndex: item.order_index,
          depthLevel: item.depth_level,
          wordCount: item.word_count,
        }));

      // Convert local image URIs to base64 for both covers
      let frontCoverBase64 = null;
      let backCoverBase64 = null;

      const frontCover = covers.find((c) => c.cover_type === "front");
      const backCover = covers.find((c) => c.cover_type === "back");

      // Convert front cover to base64 if it exists
      if (frontCover?.image_uri && frontCover.image_uri.startsWith("file://")) {
        try {
          frontCoverBase64 = await convertImageToBase64(frontCover.image_uri);
        } catch (error) {
          GlobalAlert.show({
            title: "Error",
            message: "Failed to process front cover image",
            primaryText: "Okay",
          });
          setPublishingStatus("idle");
          return;
        }
      } else if (
        frontCover?.image_uri &&
        frontCover.image_uri.startsWith("data:")
      ) {
        // If it's already base64, use it directly
        frontCoverBase64 = frontCover.image_uri;
      }

      // Convert back cover to base64 if it exists
      if (backCover?.image_uri && backCover.image_uri.startsWith("file://")) {
        try {
          backCoverBase64 = await convertImageToBase64(backCover.image_uri);
        } catch (error) {
          GlobalAlert.show({
            title: "Error",
            message: "Failed to process back cover image",
            primaryText: "Okay",
          });
          setPublishingStatus("idle");
          return;
        }
      } else if (
        backCover?.image_uri &&
        backCover.image_uri.startsWith("data:")
      ) {
        // If it's already base64, use it directly
        backCoverBase64 = backCover.image_uri;
      }

      const projectData = {
        localProjectId: projectId,
        type: project.type || "novel",
        title: project.title,
        description: project.description,
        genre: project.genre,
        authorName: project.author_name,
        coverImage: frontCoverBase64,
        backImage: backCoverBase64, // Correct parameter name for backend
        wordCount: project?.word_count || stats?.wordCount || 0,
        items: itemsToPublish,
        settings: publishingSettings,
      };

      const result = await publishProject(projectData);

      if (result && result.success && result.projectId) {
        loadProjectData();
        setPublishingStatus("idle");

        GlobalAlert.show({
          title: "Published Successfully!",
          message: `Your ${project.type} "${project.title}" is now live!`,
          primaryText: "Okay",
        });
      } else {
        throw new Error("Invalid response from server - missing project ID");
      }
    } catch (error: any) {
      setPublishingStatus("idle");

      GlobalAlert.show({
        title: "Publish Failed",
        message: error.message || "Failed to publish project",
        primaryText: "Okay",
      });
    }
  };

  const findItemById = (items: ItemNode[], id: number): ItemNode | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleFolderCollapse = (folderId: number) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  // Find the renderActionModal function and update the JSX:
  // Add this state at the top with other states
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<
    number | null
  >(null);

  

  

  const isItemInHierarchy = (item: ItemNode, folderId: number): boolean => {
    if (item.id === folderId) return true;
    if (item.parent_item_id === folderId) return true;

    // Check if any parent matches the folderId
    let current = item;
    while (current.parent_item_id) {
      const parent = findItemById(items, current.parent_item_id);
      if (!parent) break;
      if (parent.id === folderId) return true;
      current = parent;
    }

    return false;
  };

  const renderSelectionToolbar = () => {
    if (!isSelectionMode) return null;

    return (
      <Modal
        visible={isSelectionMode}
        transparent
        animationType="fade"
        onRequestClose={clearSelection}
      >
        <TouchableWithoutFeedback onPress={clearSelection}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6 pb-8 shadow-2xl">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
                    {selectedItems.size} selected
                  </Text>
                  <TouchableOpacity
                    onPress={clearSelection}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-100 justify-center items-center"
                  >
                    <Text className="text-gray-600 dark:text-light-200">✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Actions Row */}
                <View className="flex-row gap-3 mb-3">
                  <TouchableOpacity
                    onPress={handleCopyItems}
                    className="flex-1 bg-primary py-3.5 rounded-xl"
                  >
                    <Text className="text-white font-bold text-center text-sm">
                      📋 Copy
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Secondary Actions Row */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedItems.size === 1) {
                        const itemId = Array.from(selectedItems)[0];
                        const item = findItemById(items, itemId);
                        if (item) {
                          handleRenameItem(item);
                        }
                      }
                    }}
                    disabled={selectedItems.size !== 1}
                    className={`flex-1 py-3.5 rounded-xl ${
                      selectedItems.size === 1
                        ? "bg-light-100 dark:bg-dark-100"
                        : "bg-gray-200 dark:bg-gray-700 opacity-50"
                    }`}
                  >
                    <Text
                      className={`font-bold text-center text-sm ${
                        selectedItems.size === 1
                          ? "text-gray-600 dark:text-light-200"
                          : "text-gray-400"
                      }`}
                    >
                      ✏️ Rename
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleBulkDelete}
                    className="flex-1 bg-red-500 py-3.5 rounded-xl"
                  >
                    <Text className="text-white font-bold text-center text-sm">
                      🗑️ Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderRenameModal = () => (
    <Modal
      visible={showRenameModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowRenameModal(false);
        setRenamingItem(null);
        setNewItemName("");
      }}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
          <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
            Rename Item
          </Text>

          <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center">
            Enter new name for "{renamingItem?.name}"
          </Text>

          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Enter new name..."
            placeholderTextColor="#9CA3AF"
            className="bg-light-100 dark:bg-dark-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 dark:text-light-100"
            autoFocus
            onSubmitEditing={handleConfirmRename}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                setShowRenameModal(false);
                setRenamingItem(null);
                setNewItemName("");
              }}
              className="flex-1 bg-light-100 dark:bg-dark-100 py-4 rounded-full"
            >
              <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmRename}
              disabled={!newItemName.trim()}
              className={`flex-1 py-4 rounded-full ${
                newItemName.trim()
                  ? "bg-primary"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <Text
                className={`font-bold text-center ${
                  newItemName.trim()
                    ? "text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Rename
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFAB = () => {
    if (isSelectionMode) {
      return null; // Hide FAB when in selection mode
    }

    return (
      <TouchableOpacity
        onPress={() => {
          clearSelection(); // Clear any existing selection
          setShowAddModal(true);
        }}
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
    );
  };

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
      <KeyboardAvoidingLayout>
        <View className="flex-1">
          <Animated.View>
            <View className="px-6 pt-16">
              <View className="flex-row justify-between items-center mb-4">
                {renderHeaderButtons()}
              </View>

              <Animated.View
                style={{
                  opacity: headerHeight,
                  maxHeight: headerHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                }}
              >
                {!isHeaderMinimized && (
                  <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 mb-4 shadow-lg">
                    <View className="flex-row items-start mb-4">
                      <View className="w-16 h-16 rounded-xl justify-center bg-primary items-center mr-4 overflow-hidden">
                        {backCover?.image_uri ? (
                          <Image
                            source={{ uri: backCover.image_uri }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : frontCover?.image_uri ? (
                          <Image
                            source={{ uri: frontCover.image_uri }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-4xl">📖</Text>
                        )}
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

                    {project.description && (
                      <View className="mt-2 mb-3">
                        <Text className="text-sm text-gray-600 dark:text-light-200 leading-5">
                          {project.description}
                        </Text>
                      </View>
                    )}

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
                          {stats?.fileCount.toLocaleString() || 0}
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
              </Animated.View>
            </View>
          </Animated.View>

          <View className="px-6 pb-4 border-b border-gray-200 dark:border-dark-100">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {[
                  { key: "outline", label: "Outline", icon: "📋" },
                  { key: "chapters", label: "Chapters", icon: "📚" },
                  { key: "references", label: "References", icon: "🗂️" },
                ].map((view) => (
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
                ))}
              </View>
            </ScrollView>
          </View>

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
                    <View
                      key={folder.id}
                      className="flex-row items-center gap-2"
                    >
                      <Text className="text-gray-400 dark:text-light-200">
                        ›
                      </Text>
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

          <ScrollView
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
          >
            {activeView === "outline" &&
              (currentItems.length > 0 ? (
                <View>{renderItemTree(currentItems, 0, "outline")}</View>
              ) : (
                <View className="flex-1 justify-center items-center py-20">
                  <Text className="text-6xl mb-4">📝</Text>
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-200 mb-2">
                    Empty Folder
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200 text-center px-8">
                    Add documents, folders, characters or locations to get
                    started
                  </Text>
                </View>
              ))}

            {activeView === "chapters" &&
              (getChapters().length > 0 ? (
                <View>
                  {getChapters()
                    .sort((a, b) => {
                      const getNumber = (name: string) => {
                        const match = name.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                      };

                      const numA = getNumber(a.name);
                      const numB = getNumber(b.name);

                      // If both have numbers, sort by number
                      if (numA && numB) {
                        return numA - numB;
                      }

                      // Otherwise, sort alphabetically
                      return a.name.localeCompare(b.name, undefined, {
                        numeric: true,
                        sensitivity: "base",
                      });
                    })
                    .map((chapter, index) => (
                      <TouchableOpacity
                        key={`chapter-${chapter.id}`}
                        onPress={() => handleFolderClick(chapter)}
                        onLongPress={() => handleDeleteItem(chapter)}
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="w-12 h-12 rounded-xl justify-center items-center mr-3 bg-blue-100 dark:bg-blue-200">
                              <Text className="text-2xl">📃</Text>
                            </View>
                            <View className="flex-1">
                              <Text
                                className="text-base font-bold text-gray-900 dark:text-light-100"
                                numberOfLines={1}
                              >
                                {chapter.name}
                              </Text>
                              <View className="flex-row items-center gap-2 mt-1">
                                <Text className="text-xs text-gray-500 dark:text-light-200">
                                  Chapter {index + 1}
                                </Text>
                                {/* @ts-ignore */}
                                {chapter.word_count > 0 && (
                                  <Text className="text-xs text-gray-500 dark:text-light-200">
                                    {/* @ts-ignore */}•{" "}
                                    {chapter.word_count.toLocaleString()} words
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                          <Text className="text-gray-400 dark:text-light-200 text-2xl">
                            ›
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center py-20">
                  <Text className="text-6xl mb-4">📚</Text>
                  <Text className="text-xl font-bold text-gray-900 dark:text-light-200 mb-2">
                    No Chapters Yet
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-light-200 text-center px-8">
                    Add folders or documents to organize your chapters
                  </Text>
                </View>
              ))}

            {activeView === "references" && (
              <View>
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  👥 Characters ({getCharacters().length})
                </Text>
                {getCharacters().length > 0 ? (
                  <View className="mb-6">
                    {getCharacters().map((char) => (
                      <TouchableOpacity
                        key={`char-${char.id}`}
                        onPress={() => handleEditItem(char)}
                        onLongPress={() => handleDeleteItem(char)}
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-xl justify-center items-center mr-3 bg-purple-100 dark:bg-purple-900">
                            <Text className="text-2xl">👤</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                              {char.name}
                            </Text>
                            {/* @ts-ignore */}
                            {char.description && (
                              <Text
                                className="text-xs text-gray-500 dark:text-light-200 mt-1"
                                numberOfLines={2}
                              >
                                {/* @ts-ignore */}
                                {char.description}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-6 mb-6 items-center">
                    <Text className="text-sm text-gray-600 dark:text-light-200 text-center">
                      No characters added yet
                    </Text>
                  </View>
                )}

                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  📍 Locations ({getLocations().length})
                </Text>
                {getLocations().length > 0 ? (
                  <View className="mb-6">
                    {getLocations().map((loc) => (
                      <TouchableOpacity
                        key={`loc-${loc.id}`}
                        onPress={() => handleEditItem(loc)}
                        onLongPress={() => handleDeleteItem(loc)}
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-xl justify-center items-center mr-3 bg-green-100 dark:bg-green-900">
                            <Text className="text-2xl">📍</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                              {loc.name}
                            </Text>
                            {/* @ts-ignore */}
                            {loc.description && (
                              <Text
                                className="text-xs text-gray-500 dark:text-light-200 mt-1"
                                numberOfLines={2}
                              >
                                {/* @ts-ignore */}
                                {loc.description}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-6 mb-6 items-center">
                    <Text className="text-sm text-gray-600 dark:text-light-200 text-center">
                      No locations added yet
                    </Text>
                  </View>
                )}

                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-3">
                  📝 Notes & Research ({getNotes().length})
                </Text>
                {getNotes().length > 0 ? (
                  <View>
                    {getNotes().map((note) => (
                      <TouchableOpacity
                        key={`note-${note.id}`}
                        onPress={() => handleEditItem(note)}
                        onLongPress={() => handleDeleteItem(note)}
                        className="bg-white dark:bg-dark-200 rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-xl justify-center items-center mr-3 bg-yellow-100 dark:bg-yellow-900">
                            <Text className="text-2xl">
                              {note.item_type === "research" ? "🔬" : "📝"}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-light-100">
                              {note.name}
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-light-200 mt-1 capitalize">
                              {note.item_type}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-6 items-center">
                    <Text className="text-sm text-gray-600 dark:text-light-200 text-center">
                      No notes or research added yet
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

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

        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.select({ ios: 0, android: 25 })}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="bg-black/50 flex-1 justify-end">
                <TouchableWithoutFeedback>
                  <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6 max-h-[90%]">
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4">
                        Add New Item
                      </Text>

                      <Text className="text-sm font-semibold text-gray-700 dark:text-light-200 mb-2">
                        Item Type
                      </Text>
                      <View className="flex-row flex-wrap gap-2 mb-4">
                        {[
                          {
                            value: "document",
                            label: "Document",
                            icon: "📄",
                          },
                          { value: "folder", label: "Folder", icon: "📁" },
                          {
                            value: "character",
                            label: "Character",
                            icon: "👤",
                          },
                          {
                            value: "location",
                            label: "Location",
                            icon: "📍",
                          },
                          { value: "note", label: "Note", icon: "📝" },
                          {
                            value: "research",
                            label: "Research",
                            icon: "🔬",
                          },
                        ].map((type) => (
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
                              {newItemForm.imageUri
                                ? "Change Image"
                                : "Add Image"}
                            </Text>
                          </TouchableOpacity>

                          <TextInput
                            value={newItemForm.description}
                            onChangeText={(text) =>
                              setNewItemForm({
                                ...newItemForm,
                                description: text,
                              })
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
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={!!editingItem}
          animationType="slide"
          onRequestClose={() => setEditingItem(null)}
          statusBarTranslucent={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
          >
            <View
              className="flex-1 max-h-max"
              style={{
                backgroundColor: zenMode
                  ? writingSettings.backgroundColor
                  : "#F9FAFB",
              }}
            >
              {!zenMode && (
                <View
                  className="px-6 pb-4 border-b border-gray-200 dark:border-dark-100 bg-white dark:bg-dark-300"
                  style={{ paddingTop: insets.top + 8 }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                      onPress={() => setEditingItem(null)}
                      className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                    >
                      <Text className="text-xl dark:text-light-100">✕</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => setShowStatistics(true)}
                        className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                      >
                        <Text className="text-lg">📊</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowWritingSettings(true)}
                        className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                      >
                        <Text className="text-lg">⚙️</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setIsFocusMode(!isFocusMode)}
                        className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                      >
                        <Text className="text-lg">
                          {isFocusMode ? "🔍" : "📄"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setZenMode(!zenMode)}
                        className="w-10 h-10 rounded-full bg-light-100 dark:bg-dark-200 justify-center items-center"
                      >
                        <Text className="text-lg">🧘</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        className="bg-secondary px-4 py-2 rounded-full"
                      >
                        <Text className="text-gray-900 dark:text-dark-300 font-bold text-sm">
                          💾 Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!isFocusMode && (
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={editingItem?.name}
                        onChangeText={(text) =>
                          setEditingItem({ ...editingItem, name: text })
                        }
                        placeholder="Document Title"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 bg-light-100 dark:bg-dark-200 rounded-2xl px-4 py-3 text-gray-900 dark:text-light-100 text-lg font-bold"
                      />
                    </View>
                  )}

                  {!isFocusMode && autoSaveEnabled && (
                    <View className="mt-2">
                      <Text className="text-xs text-gray-500 dark:text-light-200 text-center">
                        ✓ Auto-save enabled
                      </Text>
                    </View>
                  )}
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

              <View className="flex-1 max-h-screen ">
                {(editingItem?.item_type === "character" ||
                  editingItem?.item_type === "location") && (
                  <>
                    {/* Tab Navigation */}
                    <View
                      className="px-4 pt-4 pb-2 "
                      style={{
                        backgroundColor: writingSettings.backgroundColor,
                      }}
                    >
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() =>
                            setEditingItem({
                              ...editingItem,
                              metadata: {
                                ...editingItem.metadata,
                                activeTab: "image",
                              },
                            })
                          }
                          className={`flex-1 py-3 rounded-2xl ${
                            (editingItem?.metadata?.activeTab || "image") ===
                            "image"
                              ? "bg-primary"
                              : "bg-light-100 dark:bg-dark-100"
                          }`}
                        >
                          <Text
                            className={`text-center font-bold ${
                              (editingItem?.metadata?.activeTab || "image") ===
                              "image"
                                ? "text-white"
                                : "text-gray-600 dark:text-light-200"
                            }`}
                          >
                            📷 Photo
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            setEditingItem({
                              ...editingItem,
                              metadata: {
                                ...editingItem.metadata,
                                activeTab: "description",
                              },
                            })
                          }
                          className={`flex-1 py-3 rounded-2xl ${
                            editingItem?.metadata?.activeTab === "description"
                              ? "bg-primary"
                              : "bg-light-100 dark:bg-dark-100"
                          }`}
                        >
                          <Text
                            className={`text-center font-bold ${
                              editingItem?.metadata?.activeTab === "description"
                                ? "text-white"
                                : "text-gray-600 dark:text-light-200"
                            }`}
                          >
                            📝 Description
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Photo Tab */}
                    {(editingItem?.metadata?.activeTab || "image") ===
                      "image" && (
                      <ScrollView
                        className="flex-1 px-4"
                        style={{
                          backgroundColor: writingSettings.backgroundColor,
                        }}
                      >
                        <View className="py-4">
                          <TouchableOpacity
                            onPress={handlePickEditImage}
                            className="rounded-3xl p-6 items-center"
                            style={{
                              backgroundColor: writingSettings.backgroundColor,
                            }}
                          >
                            {editingItem?.metadata?.imageUri ? (
                              <Image
                                source={{
                                  uri: editingItem.metadata.imageUri,
                                }}
                                className="w-72 h-72 rounded-3xl mb-6"
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                className="w-72 h-72 rounded-3xl justify-center items-center mb-6"
                                style={{
                                  backgroundColor: `${writingSettings.textColor}10`,
                                }}
                              >
                                <Text className="text-8xl mb-3">
                                  {editingItem?.item_type === "character"
                                    ? "👤"
                                    : "📍"}
                                </Text>
                                <Text
                                  className="text-sm"
                                  style={{
                                    color: writingSettings.textColor,
                                    opacity: 0.6,
                                  }}
                                >
                                  Tap to add {editingItem?.item_type} image
                                </Text>
                              </View>
                            )}
                            <View className="bg-primary px-8 py-4 rounded-full">
                              <Text className="text-white font-bold text-base">
                                {editingItem?.metadata?.imageUri
                                  ? "📷 Change Photo"
                                  : "➕ Add Photo"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    )}

                    {/* Description Tab with Rich Editor */}
                    {editingItem?.metadata?.activeTab === "description" && (
                      <View className="flex-1">
                        <RichToolbar
                          editor={editorRef}
                          actions={[
                            actions.setBold,
                            actions.setItalic,
                            actions.setUnderline,
                            actions.heading1,
                            actions.heading2,
                            actions.insertBulletsList,
                            actions.insertOrderedList,
                            actions.blockquote,
                          ]}
                          iconMap={{
                            // @ts-ignore
                            [actions.setBold]: ({ tintColor }) => (
                              <Text
                                style={{
                                  color: tintColor,
                                  fontWeight: "bold",
                                  fontSize: 16,
                                }}
                              >
                                B
                              </Text>
                            ), // @ts-ignore
                            [actions.setItalic]: ({ tintColor }) => (
                              <Text
                                style={{
                                  color: tintColor,
                                  fontStyle: "italic",
                                  fontSize: 16,
                                }}
                              >
                                I
                              </Text>
                            ), // @ts-ignore
                            [actions.setUnderline]: ({ tintColor }) => (
                              <Text
                                style={{
                                  color: tintColor,
                                  textDecorationLine: "underline",
                                  fontSize: 16,
                                }}
                              >
                                U
                              </Text>
                            ),
                          }}
                          style={{
                            backgroundColor: writingSettings.backgroundColor,
                            borderBottomWidth: 1,
                            borderBottomColor: `${writingSettings.textColor}20`,
                          }}
                        />

                        <ScrollView
                          className="flex-1"
                          contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingVertical: 20,
                          }}
                          style={{
                            backgroundColor: writingSettings.backgroundColor,
                          }}
                        >
                          <RichEditor
                            ref={editorRef}
                            initialContentHTML={
                              editingItem?.metadata?.description || ""
                            }
                            onChange={(html) => {
                              setEditingItem({
                                ...editingItem,
                                metadata: {
                                  ...editingItem.metadata,
                                  description: html,
                                },
                              });
                            }}
                            placeholder={`Write detailed notes about this ${editingItem?.item_type}...`}
                            style={{
                              flex: 1,
                              minHeight: height - 300,
                              backgroundColor: writingSettings.backgroundColor,
                            }}
                            editorStyle={{
                              backgroundColor: writingSettings.backgroundColor,
                              color: writingSettings.textColor,
                              caretColor: writingSettings.textColor,
                              contentCSSText: `
                                font-size: ${writingSettings.fontSize}px;
                                line-height: ${writingSettings.lineHeight};
                                font-family: ${
                                  writingSettings.fontFamily === "System"
                                    ? "system-ui, -apple-system, sans-serif"
                                    : writingSettings.fontFamily
                                };
                                padding: 16px;
                                color: ${writingSettings.textColor};
                              `,
                            }}
                            useContainer={true}
                          />
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}

                {(editingItem?.item_type === "document" ||
                  editingItem?.item_type === "note" ||
                  editingItem?.item_type === "research") && (
                  <View className="flex-1">
                    {!zenMode && (
                      <RichToolbar
                        editor={editorRef}
                        actions={[
                          actions.setBold,
                          actions.setItalic,
                          actions.setUnderline,
                          actions.heading1,
                          actions.heading2,
                          actions.insertBulletsList,
                          actions.insertOrderedList,
                          actions.blockquote,
                          actions.alignLeft,
                          actions.alignCenter,
                          actions.code,
                          actions.undo,
                          actions.redo,
                        ]}
                        iconMap={{
                          // @ts-ignore
                          [actions.setBold]: ({ tintColor }) => (
                            <Text
                              style={{
                                color: tintColor,
                                fontWeight: "bold",
                                fontSize: 16,
                              }}
                            >
                              B
                            </Text>
                          ), // @ts-ignore
                          [actions.setItalic]: ({ tintColor }) => (
                            <Text
                              style={{
                                color: tintColor,
                                fontStyle: "italic",
                                fontSize: 16,
                              }}
                            >
                              I
                            </Text>
                          ), // @ts-ignore
                          [actions.setUnderline]: ({ tintColor }) => (
                            <Text
                              style={{
                                color: tintColor,
                                textDecorationLine: "underline",
                                fontSize: 16,
                              }}
                            >
                              U
                            </Text>
                          ),
                        }}
                        style={{
                          backgroundColor: "#fff",
                          borderBottomWidth: 1,
                          borderBottomColor: "#e5e5e5",
                          minHeight: 50,
                        }}
                      />
                    )}

                    <ScrollView
                      ref={scrollViewRef}
                      className="flex-1"
                      contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingVertical: zenMode ? 60 : 20,
                        alignItems: "center",
                      }}
                      style={{
                        backgroundColor: writingSettings.backgroundColor,
                      }}
                    >
                      <View
                        style={{
                          width: zenMode // @ts-ignore
                            ? Math.min(writingSettings.pageWidth, width - 40)
                            : "100%", // @ts-ignore
                          maxWidth: writingSettings.pageWidth,
                        }}
                      >
                        <RichEditor
                          key={`editor-${writingSettings.fontSize}-${writingSettings.fontFamily}-${writingSettings.lineHeight}-${writingSettings.textColor}-${writingSettings.backgroundColor}-${zenMode}`}
                          ref={editorRef}
                          initialContentHTML={editingItem?.content || ""}
                          onChange={(html) => {
                            setEditingItem({ ...editingItem, content: html });
                          }}
                          placeholder="Start writing your story..."
                          style={{
                            flex: 1,
                            minHeight: height - 200,
                            backgroundColor: writingSettings.backgroundColor,
                          }}
                          editorStyle={{
                            backgroundColor: writingSettings.backgroundColor,
                            color: writingSettings.textColor,
                            caretColor: writingSettings.textColor,
                            contentCSSText: `
      font-size: ${writingSettings.fontSize}px;
      line-height: ${writingSettings.lineHeight};
      font-family: ${
        writingSettings.fontFamily === "System"
          ? "system-ui, -apple-system, sans-serif"
          : writingSettings.fontFamily
      };
      padding: ${zenMode ? 40 : 16}px;
      text-align: ${writingSettings.textAlign || "left"};
    `,
                          }}
                          useContainer={true}
                        />
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>

              {(editingItem?.item_type === "document" ||
                editingItem?.item_type === "note" ||
                editingItem?.item_type === "research") &&
                !zenMode && (
                  <View className="bg-white dark:bg-dark-300 border-t border-gray-200 dark:border-dark-100 px-6 py-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Words: {editorStats.wordCount.toLocaleString()}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Characters: {editorStats.charCount.toLocaleString()}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-light-200">
                        Reading: {editorStats.readingTime}m
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleZenModeToggle(!zenMode)}
                      >
                        <Text className="text-sm text-primary font-semibold">
                          Zen Mode
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
                {/* Front Cover */}
                <TouchableOpacity
                  onPress={() => handlePickCover("front")}
                  disabled={isUploadingFrontCover}
                  className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4 items-center"
                >
                  {isUploadingFrontCover ? (
                    <View className="w-full h-48 bg-gray-200 dark:bg-dark-300 rounded-xl justify-center items-center mb-3">
                      <ActivityIndicator size="large" color="#6B46C1" />
                    </View>
                  ) : frontCover ? (
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
                    {isUploadingFrontCover
                      ? "Uploading..."
                      : frontCover
                      ? "Change"
                      : "Add"}{" "}
                    Front
                  </Text>
                </TouchableOpacity>

                {/* Back Cover */}
                <TouchableOpacity
                  onPress={() => handlePickCover("back")}
                  disabled={isUploadingBackCover}
                  className="flex-1 bg-light-100 dark:bg-dark-100 rounded-2xl p-4 items-center"
                >
                  {isUploadingBackCover ? (
                    <View className="w-full h-48 bg-gray-200 dark:bg-dark-300 rounded-xl justify-center items-center mb-3">
                      <ActivityIndicator size="large" color="#6B46C1" />
                    </View>
                  ) : backCover ? (
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
                    {isUploadingBackCover
                      ? "Uploading..."
                      : backCover
                      ? "Change"
                      : "Add"}{" "}
                    Back
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

        {renderTemplateModal()}
        {renderWritingSettingsModal()}
        {renderStatisticsModal()}
        {renderExportModal()}
        {renderSelectionToolbar()}
      
        {renderRenameModal()}
        {renderFAB()}

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
                  Book Preview
                </Text>
                <View className="w-10" />
              </View>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const pageNum = Math.round(
                  e.nativeEvent.contentOffset.x / width
                );
                setCurrentPage(pageNum);
              }}
              scrollEventThrottle={16}
            >
              {frontCover && (
                <View
                  className="items-center justify-center bg-gray-900"
                  style={{ width }}
                >
                  <Image
                    source={{ uri: frontCover.image_uri }}
                    className="rounded-2xl shadow-2xl"
                    style={{ width: width * 0.7, height: width * 1.05 }}
                    resizeMode="contain"
                  />
                  <Text className="text-white mt-4 text-sm">Front Cover</Text>
                </View>
              )}

              {allDocs.map((doc, index) => (
                <View
                  key={doc.id}
                  className="px-8 py-12 justify-center bg-gray-900"
                  style={{ width }}
                >
                  <View
                    className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-2xl"
                    style={{ height: width * 1.5 }}
                  >
                    <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-4">
                      {doc.name}
                    </Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <RichEditor
                        disabled={true}
                        initialContentHTML={doc.content || ""}
                        style={{
                          flex: 1,
                          minHeight: 400,
                          backgroundColor: String(
                            writingSettings.backgroundColor
                          ),
                        }}
                        editorStyle={{
                          color: String(writingSettings.textColor),
                          backgroundColor: String(
                            writingSettings.backgroundColor
                          ),
                        }}
                      />
                    </ScrollView>
                    <Text className="text-xs text-gray-500 dark:text-light-200 text-center mt-4">
                      Page {(frontCover ? 1 : 0) + index + 1}
                    </Text>
                  </View>
                </View>
              ))}

              {backCover && (
                <View
                  className="items-center justify-center bg-gray-900"
                  style={{ width }}
                >
                  <Image
                    source={{ uri: backCover.image_uri }}
                    className="rounded-2xl shadow-2xl"
                    style={{ width: width * 0.7, height: width * 1.05 }}
                    resizeMode="contain"
                  />
                  <Text className="text-white mt-4 text-sm">Back Cover</Text>
                </View>
              )}
            </ScrollView>

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

        <Modal
          visible={showPublishModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPublishModal(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center px-6">
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 w-full max-w-md">
              <Text className="text-2xl font-bold text-gray-900 dark:text-light-100 mb-4 text-center">
                Publish Your Work 🚀
              </Text>

              <View className="bg-light-100 dark:bg-dark-100 rounded-2xl p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Title:
                  </Text>
                  <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
                    {project?.title}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Type:
                  </Text>
                  <Text className="text-sm font-bold text-gray-900 dark:text-light-100 capitalize">
                    {project?.type}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Words:
                  </Text>
                  <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
                    {stats?.wordCount?.toLocaleString() || 0}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-600 dark:text-light-200">
                    Items:
                  </Text>
                  <Text className="text-sm font-bold text-gray-900 dark:text-light-100">
                    {items.length}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-600 dark:text-light-200 mb-4 text-center">
                Your work will be published and accessible to readers. You can
                unpublish or update it anytime.
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowPublishModal(false)}
                  className="flex-1 bg-light-100 dark:bg-dark-100 py-4 rounded-full"
                >
                  <Text className="text-gray-600 dark:text-light-200 font-bold text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowPublishModal(false);
                    handlePublishProject();
                  }}
                  className="flex-1 bg-green-500 py-4 rounded-full"
                >
                  <Text className="text-white font-bold text-center">
                    Publish Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingLayout>
    </Background>
  );
};

export default NovelDetails;
