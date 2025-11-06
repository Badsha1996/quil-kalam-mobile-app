import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { initializeApp, getAppState } from "@/utils/appInitializer";

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const result = await initializeApp();
        console.log("App initialized:", result);

        const state = getAppState();
        if (state.isLoggedIn) {
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      } catch (err: any) {
        console.error("Initialization failed:", err);
        setError(err.message || "Initialization error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="mt-4 text-gray-600">Initializing QuilKalam...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl mb-4">⚠️</Text>
        <Text className="text-lg font-bold mb-2">Initialization Error</Text>
        <Text className="text-center text-gray-600">{error}</Text>
      </View>
    );
  }

  return null;
}
