import { Project } from "@/types/search";
import {
  formatDate,
  formatWordCount,
  getStatusColor,
  getTypeIcon,
} from "@/utils/search";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

const ProjectCard = ({
  project,
  index,
  handleDeleteProject,
}: {
  project: Project;
  index: number;
  handleDeleteProject: any;
}) => {
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const progress = project.target_word_count
    ? (project.word_count / project.target_word_count) * 100
    : 0;

  return (
    <Animated.View
      style={{
        opacity: cardFade,
        transform: [{ translateY: cardSlide }],
      }}
    >
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/novel/[id]",
            params: { id: String(project.id) },
          })
        }
        onLongPress={() => handleDeleteProject(project.id, project.title)}
        className="bg-white dark:bg-dark-200 rounded-3xl p-5 mb-4 shadow-lg active:opacity-80"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-start mb-3">
          <View className="w-14 h-14 rounded-xl bg-primary justify-center items-center mr-4">
            <Text className="text-3xl">{getTypeIcon(project.type)}</Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-gray-900 dark:text-light-100 mb-1"
              numberOfLines={1}
            >
              {project.title}
            </Text>
            {project.author_name && (
              <Text className="text-sm text-gray-500 dark:text-light-200 mb-2">
                by {project.author_name}
              </Text>
            )}
            <View className="flex-row items-center gap-2 flex-wrap">
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="text-white dark:text-dark-100 text-xs font-bold">
                  {project.type.toUpperCase()}
                </Text>
              </View>
              {project.genre && (
                <View className="bg-light-100 dark:bg-dark-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-600 dark:text-light-200 text-xs font-semibold">
                    {project.genre}
                  </Text>
                </View>
              )}
              <View
                className={`${getStatusColor(project.status)} px-3 py-1 rounded-full`}
              >
                <Text className="text-white dark:text-dark-100 text-xs font-bold">
                  {project.status.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {project.description && (
          <Text
            className="text-sm text-gray-600 dark:text-light-200 mb-3 leading-5"
            numberOfLines={2}
          >
            {project.description}
          </Text>
        )}

        {/* Progress Bar */}
        {project.target_word_count > 0 && (
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-500 dark:text-light-200">
                Progress: {progress.toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-500 dark:text-light-200">
                {formatWordCount(project.word_count)} /{" "}
                {formatWordCount(project.target_word_count)}
              </Text>
            </View>
            <View className="h-2 bg-light-100 dark:bg-dark-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100 dark:border-dark-100">
          <View className="flex-row items-center gap-4">
            <Text className="text-xs text-gray-500 dark:text-light-200">
              📊 {formatWordCount(project.word_count)} words
            </Text>
            {project.writing_template &&
              project.writing_template !== "freeform" && (
                <Text className="text-xs text-gray-500 dark:text-light-200">
                  📋 {project.writing_template.replace("_", " ")}
                </Text>
              )}
          </View>
          <Text className="text-xs text-gray-500 dark:text-light-200">
            {formatDate(project.updated_at)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ProjectCard;