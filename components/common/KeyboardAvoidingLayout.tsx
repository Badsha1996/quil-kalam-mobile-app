import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function KeyboardAvoidingLayout({
  children,
  scrollable = true,
}: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}
