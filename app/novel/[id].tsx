import Background from "@/components/common/Background";
import {
  createCharacter,
  createFile,
  createFolder,
  createLocation,
  deleteFile,
  deleteFolder,
  exportProjectAsJSON,
  getCharactersByProject,
  getFilesByProject,
  getFoldersByProject,
  getLocationsByProject,
  getProject,
  getProjectStats,
  getPublishingSettings,
  getTemplateStages,
  updateFile,
  updateProject,
} from "@/utils/database";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const NovelDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [templateStages, setTemplateStages] = useState<any[]>([]);
  const [publishingSettings, setPublishingSettingsState] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    "content" | "characters" | "locations" | "template" | "publish"
  >("content");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemType, setNewItemType] = useState<"folder" | "file">("file");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProjectData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [projectId]);

  const loadProjectData = () => {
    const projectData = getProject(projectId);
    const statsData = getProjectStats(projectId);
    const foldersData = getFoldersByProject(projectId);
    const filesData = getFilesByProject(projectId);
    const charactersData = getCharactersByProject(projectId);
    const locationsData = getLocationsByProject(projectId);
    const stagesData = getTemplateStages(projectId);
    const publishData = getPublishingSettings(projectId);

    setProject(projectData);
    setStats(statsData);
    setFolders(foldersData);
    setFiles(filesData);
    setCharacters(charactersData);
    setLocations(locationsData);
    setTemplateStages(stagesData);
    setPublishingSettingsState(publishData);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      if (newItemType === "folder") {
        createFolder({
          projectId,
          name: newItemName,
          folderType: "chapter",
          orderIndex: folders.length,
        });
      } else {
        createFile({
          projectId,
          folderId: selectedFolder || undefined,
          fileType: "document",
          name: newItemName,
          content: newItemContent,
          orderIndex: files.length,
        });
      }

      setShowAddModal(false);
      setNewItemName("");
      setNewItemContent("");
      setSelectedFolder(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to create item");
    }
  };

  const handleEditFile = (file: any) => {
    setEditingItem(file);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    try {
      updateFile(editingItem.id, {
        name: editingItem.name,
        content: editingItem.content,
      });
      setEditingItem(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to update file");
    }
  };

  const handleDeleteItem = (
    type: "file" | "folder",
    id: number,
    name: string
  ) => {
    Alert.alert(`Delete ${type}`, `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          try {
            if (type === "file") {
              deleteFile(id);
            } else {
              deleteFolder(id);
            }
            loadProjectData();
          } catch (error) {
            Alert.alert("Error", `Failed to delete ${type}`);
          }
        },
      },
    ]);
  };

  const handleAddCharacter = () => {
    Alert.prompt("Add Character", "Enter character name", (text) => {
      if (text.trim()) {
        createCharacter(projectId, { name: text });
        loadProjectData();
      }
    });
  };

  const handleAddLocation = () => {
    Alert.prompt("Add Location", "Enter location name", (text) => {
      if (text.trim()) {
        createLocation(projectId, { name: text });
        loadProjectData();
      }
    });
  };

  const handleExport = () => {
    try {
      const jsonData = exportProjectAsJSON(projectId);
      if (jsonData) {
        Alert.alert("Export Ready", "Project exported successfully!");
        // In a real app, you'd save this to a file or share it
        console.log("Exported data:", jsonData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export project");
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
    const currentIndex = statuses.indexOf(project.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    updateProject(projectId, { status: nextStatus });
    loadProjectData();
  };

  if (!project) {
    return (
      <Background>
        <View className="flex-1 justify-center items-center">
          <Text className="text-xl text-gray-600">Loading...</Text>
        </View>
      </Background>
    );
  }

  const progress = stats?.targetWordCount
    ? (stats.wordCount / stats.targetWordCount) * 100
    : 0;

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View className="px-6 pt-16 pb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 w-10 h-10 rounded-full bg-white justify-center items-center"
            >
              <Text className="text-xl">←</Text>
            </TouchableOpacity>

            <View className="bg-white rounded-3xl p-6 shadow-lg mb-4">
              <View className="flex-row items-start mb-4">
                <View className="w-16 h-16 rounded-2xl bg-secondary justify-center items-center mr-4">
                  <Text className="text-4xl">📖</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900 mb-2">
                    {project.title}
                  </Text>
                  {project.author_name && (
                    <Text className="text-sm text-gray-600 mb-2">
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
                      <View className="bg-light-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-600 text-xs font-semibold">
                          {project.genre}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {project.description && (
                <Text className="text-sm text-gray-600 mb-4">
                  {project.description}
                </Text>
              )}

              {/* Stats Grid */}
              <View className="flex-row flex-wrap gap-3 mb-4">
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Word Count</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats?.wordCount?.toLocaleString() || 0}
                  </Text>
                </View>
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Chapters</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats?.folderCount || 0}
                  </Text>
                </View>
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Files</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats?.fileCount || 0}
                  </Text>
                </View>
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Characters</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats?.characterCount || 0}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              {project.target_word_count > 0 && (
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm font-semibold text-gray-700">
                      Progress: {progress.toFixed(1)}%
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Target: {project.target_word_count.toLocaleString()}
                    </Text>
                  </View>
                  <View className="h-3 bg-light-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-1 bg-secondary py-4 rounded-2xl"
              >
                <Text className="text-gray-900 font-bold text-center">
                  ➕ Add Content
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                className="bg-white py-4 px-6 rounded-2xl border-2 border-primary"
              >
                <Text className="text-primary font-bold text-center">
                  📤 Export
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View className="px-6 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {[
                  { key: "content", label: "Content", icon: "📝" },
                  { key: "characters", label: "Characters", icon: "👥" },
                  { key: "locations", label: "Locations", icon: "🗺️" },
                  ...(project.writing_template !== "freeform"
                    ? [{ key: "template", label: "Structure", icon: "📋" }]
                    : []),
                  { key: "publish", label: "Publish", icon: "📚" },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key as any)}
                    className={`px-5 py-3 rounded-full ${
                      activeTab === tab.key ? "bg-primary" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        activeTab === tab.key ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View className="px-6">
            {activeTab === "content" && (
              <View>
                {/* Folders */}
                {folders.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-xl font-bold text-gray-900 mb-3">
                      Chapters & Sections
                    </Text>
                    {folders.map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        onLongPress={() =>
                          handleDeleteItem("folder", folder.id, folder.name)
                        }
                        className="bg-white rounded-2xl p-4 mb-3 shadow-lg"
                      >
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-xl bg-secondary justify-center items-center mr-3">
                            <Text className="text-xl">📁</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900">
                              {folder.name}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {folder.folder_type}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Files */}
                <Text className="text-xl font-bold text-gray-900 mb-3">
                  Documents ({files.length})
                </Text>
                {files.length > 0 ? (
                  files.map((file) => (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => handleEditFile(file)}
                      onLongPress={() =>
                        handleDeleteItem("file", file.id, file.name)
                      }
                      className="bg-white rounded-2xl p-4 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 rounded-xl bg-light-100 justify-center items-center mr-3">
                            <Text className="text-xl">📄</Text>
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-base font-bold text-gray-900"
                              numberOfLines={1}
                            >
                              {file.name}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {file.word_count} words
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-400">›</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="bg-white rounded-2xl p-8 items-center">
                    <Text className="text-4xl mb-2">📝</Text>
                    <Text className="text-gray-600">No documents yet</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "characters" && (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900">
                    Characters ({characters.length})
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddCharacter}
                    className="bg-secondary px-4 py-2 rounded-full"
                  >
                    <Text className="text-gray-900 font-bold text-sm">
                      + Add
                    </Text>
                  </TouchableOpacity>
                </View>
                {characters.length > 0 ? (
                  characters.map((char) => (
                    <View
                      key={char.id}
                      className="bg-white rounded-2xl p-4 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-primary justify-center items-center mr-3">
                          <Text className="text-2xl">👤</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900">
                            {char.name}
                          </Text>
                          {char.role && (
                            <Text className="text-sm text-gray-600 capitalize">
                              {char.role}
                            </Text>
                          )}
                        </View>
                      </View>
                      {char.description && (
                        <Text className="text-sm text-gray-600 mt-3">
                          {char.description}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View className="bg-white rounded-2xl p-8 items-center">
                    <Text className="text-4xl mb-2">👥</Text>
                    <Text className="text-gray-600">No characters yet</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "locations" && (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900">
                    Locations ({locations.length})
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddLocation}
                    className="bg-secondary px-4 py-2 rounded-full"
                  >
                    <Text className="text-gray-900 font-bold text-sm">
                      + Add
                    </Text>
                  </TouchableOpacity>
                </View>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <View
                      key={loc.id}
                      className="bg-white rounded-2xl p-4 mb-3 shadow-lg"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mr-3">
                          <Text className="text-2xl">📍</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900">
                            {loc.name}
                          </Text>
                        </View>
                      </View>
                      {loc.description && (
                        <Text className="text-sm text-gray-600 mt-3">
                          {loc.description}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View className="bg-white rounded-2xl p-8 items-center">
                    <Text className="text-4xl mb-2">🗺️</Text>
                    <Text className="text-gray-600">No locations yet</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === "template" && templateStages.length > 0 && (
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  {project.writing_template.replace("_", " ").toUpperCase()}
                </Text>
                {templateStages.map((stage, index) => (
                  <View
                    key={stage?.id || index}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-lg"
                  >
                    <View className="flex-row items-start">
                      <View className="w-8 h-8 rounded-full bg-primary justify-center items-center mr-3">
                        <Text className="text-white font-bold text-sm">
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 mb-1">
                          {String(stage?.stage_name ?? "")}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {String(stage?.stage_description ?? "")}
                        </Text>
                        {stage?.is_completed ? (
                          <View className="bg-green-100 px-3 py-1 rounded-full mt-2 self-start">
                            <Text className="text-green-700 text-xs font-bold">
                              ✓ Completed
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === "publish" && (
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Publishing Information
                </Text>
                <View className="bg-white rounded-2xl p-6 shadow-lg">
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      ISBN
                    </Text>
                    <Text className="text-base text-gray-900">
                      {publishingSettings?.isbn || "Not set"}
                    </Text>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Publisher
                    </Text>
                    <Text className="text-base text-gray-900">
                      {publishingSettings?.publisher || "Not set"}
                    </Text>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Export Format
                    </Text>
                    <Text className="text-base text-gray-900 uppercase">
                      {publishingSettings?.export_format || "PDF"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Coming Soon",
                        "Publishing settings editor will be added soon"
                      )
                    }
                    className="bg-primary py-3 rounded-full mt-4"
                  >
                    <Text className="text-white font-bold text-center">
                      Edit Publishing Info
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Add Content Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              Add New {newItemType === "folder" ? "Chapter" : "Document"}
            </Text>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() => setNewItemType("file")}
                className={`flex-1 py-3 rounded-2xl ${
                  newItemType === "file" ? "bg-primary" : "bg-light-100"
                }`}
              >
                <Text
                  className={`text-center font-bold ${
                    newItemType === "file" ? "text-white" : "text-gray-600"
                  }`}
                >
                  📄 Document
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewItemType("folder")}
                className={`flex-1 py-3 rounded-2xl ${
                  newItemType === "folder" ? "bg-primary" : "bg-light-100"
                }`}
              >
                <Text
                  className={`text-center font-bold ${
                    newItemType === "folder" ? "text-white" : "text-gray-600"
                  }`}
                >
                  📁 Chapter
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Enter name..."
              className="bg-light-100 rounded-2xl px-4 py-4 mb-4 text-gray-900"
            />

            {newItemType === "file" && (
              <TextInput
                value={newItemContent}
                onChangeText={setNewItemContent}
                placeholder="Start writing... (optional)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-light-100 rounded-2xl px-4 py-4 mb-4 text-gray-900"
              />
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1 bg-light-100 py-4 rounded-full"
              >
                <Text className="text-gray-600 font-bold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddItem}
                className="flex-1 bg-secondary py-4 rounded-full"
              >
                <Text className="text-gray-900 font-bold text-center">
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit File Modal */}
      <Modal
        visible={!!editingItem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View className="flex-1 bg-white">
          <View className="px-6 pt-16 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                className="w-10 h-10 rounded-full bg-light-100 justify-center items-center"
              >
                <Text className="text-xl">✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                className="bg-secondary px-6 py-3 rounded-full"
              >
                <Text className="text-gray-900 font-bold">Save</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={editingItem?.name}
              onChangeText={(text) =>
                setEditingItem({ ...editingItem, name: text })
              }
              placeholder="Document name"
              className="bg-light-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 text-lg font-bold"
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <TextInput
                value={editingItem?.content}
                onChangeText={(text) =>
                  setEditingItem({ ...editingItem, content: text })
                }
                placeholder="Start writing your story..."
                multiline
                textAlignVertical="top"
                className="bg-white rounded-2xl px-4 py-4 text-gray-900 text-base"
                style={{ minHeight: 400 }}
              />

              <View className="bg-light-100 rounded-2xl p-4 mt-4">
                <Text className="text-sm text-gray-600">
                  Word Count:{" "}
                  {editingItem?.content?.trim().split(/\s+/).length || 0}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Background>
  );
};

export default NovelDetails;
