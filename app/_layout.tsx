import { initDB } from "@/utils/database";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import "./global.css";

export default function RootLayout() {
  useEffect(() => {
    initDB();
  });
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="novel/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
