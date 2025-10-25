import { initDB } from "@/utils/database";
// @ts-ignore
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import "react-native-gesture-handler";
import "./global.css";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        // Give a small delay to ensure everything is mounted
        setTimeout(() => {
          setIsReady(true);
        }, 100);
      } catch (error) {
        console.error("Database initialization error:", error);
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <ActivityIndicator size="large" color="#6B46C1" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="novel/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="poetry/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
