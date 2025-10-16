import Background from "@/components/common/Background";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from "react-native";
import {
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getFoldersByProject,
  getFilesByProject,
  createFolder,
  createFile,
  updateFile,
  deleteFile,
  deleteFolder,
  exportProjectAsJSON,
} from "@/utils/database";

const PoetryDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const projectId = parseInt(id as string);

  const [project, setProject] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [poems, setPoems] = useState<any[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPoem, setEditingPoem] = useState<any>(null);
  const [newPoemTitle, setNewPoemTitle] = useState("");
  const [newPoemContent, setNewPoemContent] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);

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

    setProject(projectData);
    setStats(statsData);
    setFolders(foldersData);
    setPoems(filesData);
  };

  const handleAddPoem = () => {
    if (!newPoemTitle.trim()) {
      Alert.alert("Error", "Please enter a title for your poem");
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
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to create poem");
    }
  };

  const handleAddCollection = () => {
    Alert.prompt(
      "New Collection",
      "Enter collection name",
      (text) => {
        if (text.trim()) {
          createFolder({
            projectId,
            name: text,
            folderType: "section",
            orderIndex: folders.length,
          });
          loadProjectData();
        }
      }
    );
  };

  const handleEditPoem = (poem: any) => {
    setEditingPoem(poem);
  };

  const handleSavePoem = () => {
    if (!editingPoem) return;

    try {
      updateFile(editingPoem.id, {
        name: editingPoem.name,
        content: editingPoem.content,
      });
      setEditingPoem(null);
      loadProjectData();
    } catch (error) {
      Alert.alert("Error", "Failed to update poem");
    }
  };

  const handleDeletePoem = (id: number, title: string) => {
    Alert.alert(
      "Delete Poem",
      `Delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFile(id);
            loadProjectData();
          },
        },
      ]
    );
  };

  const handleDeleteCollection = (id: number, name: string) => {
    Alert.alert(
      "Delete Collection",
      `Delete "${name}" and all its poems?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFolder(id);
            loadProjectData();
          },
        },
      ]
    );
  };

  const handleExport = () => {
    try {
      const jsonData = exportProjectAsJSON(projectId);
      if (jsonData) {
        Alert.alert("Export Ready", "Poetry collection exported successfully!");
        console.log("Exported data:", jsonData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to export project");
    }
  };

  const handleUpdateStatus = () => {
    const statuses = ["draft", "in_progress", "revision", "complete", "published"];
    const currentIndex = statuses.indexOf(project.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    updateProject(projectId, { status: nextStatus });
    loadProjectData();
  };

  const countLines = (text: string) => {
    if (!text) return 0;
    return text.split('\n').filter(line => line.trim()).length;
  };

  const countStanzas = (text: string) => {
    if (!text) return 0;
    return text.split(/\n\s*\n/).filter(stanza => stanza.trim()).length;
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
                  <Text className="text-4xl">✍️</Text>
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
                        {project.status.replace('_', ' ').toUpperCase()}
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
                <Text className="text-sm text-gray-600 italic mb-4">
                  "{project.description}"
                </Text>
              )}

              {/* Stats Grid */}
              <View className="flex-row flex-wrap gap-3 mb-4">
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Total Poems</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {poems.length}
                  </Text>
                </View>
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Collections</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {folders.length}
                  </Text>
                </View>
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Total Words</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats?.wordCount?.toLocaleString() || 0}
                  </Text>
                </View>
                <View className="bg-light-100 rounded-2xl p-3 flex-1 min-w-[45%]">
                  <Text className="text-xs text-gray-600 mb-1">Avg per Poem</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {poems.length > 0 ? Math.round((stats?.wordCount || 0) / poems.length) : 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-1 bg-secondary py-4 rounded-2xl"
              >
                <Text className="text-gray-900 font-bold text-center">
                  ✨ New Poem
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCollection}
                className="bg-white py-4 px-6 rounded-2xl border-2 border-primary"
              >
                <Text className="text-primary font-bold text-center">
                  📚
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                className="bg-white py-4 px-6 rounded-2xl border-2 border-primary"
              >
                <Text className="text-primary font-bold text-center">
                  📤
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Collections */}
          {folders.length > 0 && (
            <View className="px-6 mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-3">
                Collections
              </Text>
              {folders.map((collection) => {
                const collectionPoems = poems.filter(p => p.folder_id === collection.id);
                return (
                  <TouchableOpacity
                    key={collection.id}
                    onLongPress={() => handleDeleteCollection(collection.id, collection.name)}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-lg"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 rounded-xl bg-secondary justify-center items-center mr-3">
                          <Text className="text-2xl">📚</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900">
                            {collection.name}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {collectionPoems.length} {collectionPoems.length === 1 ? 'poem' : 'poems'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-400 text-xl">›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Poems List */}
          <View className="px-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              All Poems ({poems.length})
            </Text>
            {poems.length > 0 ? (
              poems.map((poem, index) => {
                const lines = countLines(poem.content);
                const stanzas = countStanzas(poem.content);
                
                return (
                  <TouchableOpacity
                    key={poem.id}
                    onPress={() => handleEditPoem(poem)}
                    onLongPress={() => handleDeletePoem(poem.id, poem.name)}
                    className="bg-white rounded-2xl p-5 mb-3 shadow-lg"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 mb-2">
                          {poem.name}
                        </Text>
                        <View className="flex-row gap-3">
                          <Text className="text-xs text-gray-500">
                            📝 {poem.word_count} words
                          </Text>
                          <Text className="text-xs text-gray-500">
                            📄 {lines} lines
                          </Text>
                          {stanzas > 1 && (
                            <Text className="text-xs text-gray-500">
                              🔲 {stanzas} stanzas
                            </Text>
                          )}
                        </View>
                      </View>
                      <View className="w-8 h-8 rounded-full bg-light-100 justify-center items-center">
                        <Text className="text-gray-600 font-bold text-xs">
                          {index + 1}
                        </Text>
                      </View>
                    </View>
                    
                    {poem.content && (
                      <View className="bg-light-100 rounded-xl p-3">
                        <Text 
                          className="text-sm text-gray-700 italic leading-5 font-serif"
                          numberOfLines={4}
                        >
                          {poem.content}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="bg-white rounded-2xl p-10 items-center">
                <Text className="text-6xl mb-3">✍️</Text>
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  No poems yet
                </Text>
                <Text className="text-sm text-gray-600 text-center mb-4">
                  Start writing your first verse
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(true)}
                  className="bg-secondary px-6 py-3 rounded-full"
                >
                  <Text className="text-gray-900 font-bold">
                    ✨ Write Poem
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Add Poem Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '90%' }}>
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              ✨ New Poem
            </Text>

            <TextInput
              value={newPoemTitle}
              onChangeText={setNewPoemTitle}
              placeholder="Untitled Poem"
              className="bg-light-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 text-lg font-bold"
            />

            <ScrollView className="mb-4" style={{ maxHeight: 300 }}>
              <TextInput
                value={newPoemContent}
                onChangeText={setNewPoemContent}
                placeholder="Write your verses here...&#10;&#10;Press return twice for stanzas"
                multiline
                textAlignVertical="top"
                className="bg-light-100 rounded-2xl px-4 py-4 text-gray-900 font-serif"
                style={{ minHeight: 250 }}
              />
            </ScrollView>

            {folders.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Add to Collection (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setSelectedCollection(null)}
                      className={`px-4 py-2 rounded-full ${
                        !selectedCollection ? "bg-primary" : "bg-light-100"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          !selectedCollection ? "text-white" : "text-gray-600"
                        }`}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {folders.map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        onPress={() => setSelectedCollection(folder.id)}
                        className={`px-4 py-2 rounded-full ${
                          selectedCollection === folder.id ? "bg-primary" : "bg-light-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            selectedCollection === folder.id ? "text-white" : "text-gray-600"
                          }`}
                        >
                          {folder.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewPoemTitle("");
                  setNewPoemContent("");
                  setSelectedCollection(null);
                }}
                className="flex-1 bg-light-100 py-4 rounded-full"
              >
                <Text className="text-gray-600 font-bold text-center">
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
          </View>
        </View>
      </Modal>

      {/* Edit Poem Modal */}
      <Modal
        visible={!!editingPoem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingPoem(null)}
      >
        <View className="flex-1 bg-white">
          <View className="px-6 pt-16 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => setEditingPoem(null)}
                className="w-10 h-10 rounded-full bg-light-100 justify-center items-center"
              >
                <Text className="text-xl">✕</Text>
              </TouchableOpacity>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (editingPoem) {
                      handleDeletePoem(editingPoem.id, editingPoem.name);
                      setEditingPoem(null);
                    }
                  }}
                  className="bg-red-100 px-4 py-3 rounded-full"
                >
                  <Text className="text-red-600 font-bold">Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSavePoem}
                  className="bg-secondary px-6 py-3 rounded-full"
                >
                  <Text className="text-gray-900 font-bold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              value={editingPoem?.name}
              onChangeText={(text) =>
                setEditingPoem({ ...editingPoem, name: text })
              }
              placeholder="Poem Title"
              className="bg-light-100 rounded-2xl px-4 py-4 mb-4 text-gray-900 text-xl font-bold"
            />

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                value={editingPoem?.content}
                onChangeText={(text) =>
                  setEditingPoem({ ...editingPoem, content: text })
                }
                placeholder="Write your verses here..."
                multiline
                textAlignVertical="top"
                className="bg-white rounded-2xl px-4 py-4 text-gray-900 text-base font-serif leading-7"
                style={{ minHeight: 500 }}
              />

              <View className="bg-light-100 rounded-2xl p-4 mt-4">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">
                    Words: {editingPoem?.content?.trim().split(/\s+/).filter(Boolean).length || 0}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Lines: {countLines(editingPoem?.content || '')}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Stanzas: {countStanzas(editingPoem?.content || '')}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Background>
  );
};

export default PoetryDetails;