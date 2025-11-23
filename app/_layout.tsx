import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { initializeApp } from "@/utils/appInitializer";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@react-navigation/elements";
import "./global.css";

export default function RootLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const result = await initializeApp();

      if (result.isLoggedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }

      setLoading(false);
    };
    init();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="novel/[id]" />
      </Stack>

      {loading && (
        <View className="absolute inset-0 justify-center items-center bg-white text-black dark:bg-black dark:text-white">
          <ActivityIndicator />
          <Text className="text-black dark:text-white text-4xl">
            Loading...
          </Text>
        </View>
      )}
    </>
  );
}
