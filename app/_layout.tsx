import { initDB } from "@/utils/database";
// @ts-ignore
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import "react-native-gesture-handler";
import "./global.css";

export default function RootLayout() {
  useEffect(() => {
    initDB();
  });
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="novel/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="poetry/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
