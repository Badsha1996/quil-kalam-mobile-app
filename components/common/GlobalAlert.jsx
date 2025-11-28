import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

let showAlertExternal = null;

export default function GlobalAlert() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({});

  showAlertExternal = (opts) => {
    setOptions(opts);
    setVisible(true);
  };

  const close = () => setVisible(false);

  // For list context menus, use bottom sheet style
  if (options.context === "listItem") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <TouchableOpacity 
          className="flex-1 justify-end bg-black/50" 
          activeOpacity={1}
          onPress={close}
        >
          <View className="bg-white dark:bg-dark-200 rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-1">
              {options.title}
            </Text>
            
            {options.message && (
              <Text className="text-sm text-gray-600 dark:text-light-200 mb-4">
                {options.message}
              </Text>
            )}

            <View className="space-y-3">
              {options.onPrimary && (
                <TouchableOpacity
                  className="py-4 rounded-xl bg-blue-50 dark:bg-dark-100"
                  onPress={() => {
                    options.onPrimary?.();
                    close();
                  }}
                >
                  <Text className="text-center text-blue-600 dark:text-blue-400 font-semibold">
                    {options.primaryText}
                  </Text>
                </TouchableOpacity>
              )}

              {options.onSecondary && (
                <TouchableOpacity
                  className="py-4 rounded-xl bg-gray-50 dark:bg-dark-100"
                  onPress={() => {
                    options.onSecondary?.();
                    close();
                  }}
                >
                  <Text className="text-center text-gray-700 dark:text-light-200 font-semibold">
                    {options.secondaryText}
                  </Text>
                </TouchableOpacity>
              )}

              {options.onTertiary && (
                <TouchableOpacity
                  className="py-4 rounded-xl bg-red-50 dark:bg-red-900/20"
                  onPress={() => {
                    options.onTertiary?.();
                    close();
                  }}
                >
                  <Text className="text-center text-red-600 dark:text-red-400 font-semibold">
                    {options.tertiaryText}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="py-4 rounded-xl bg-gray-100 dark:bg-dark-300 mt-4"
                onPress={close}
              >
                <Text className="text-center text-gray-600 dark:text-light-200 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  // Default alert (centered)
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View className="flex-1 justify-center items-center px-6 bg-black/50">
        <View className="w-full bg-white dark:bg-dark-200 p-6 rounded-2xl shadow-xl max-w-md">
          <Text className="text-xl font-bold text-gray-900 dark:text-light-100 mb-2">
            {options.title}
          </Text>

          <Text className="text-base text-gray-600 dark:text-light-200 mb-6">
            {options.message}
          </Text>

          <View className="flex-row gap-3 justify-end">
            <TouchableOpacity
              className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-dark-100"
              onPress={() => {
                options.onPrimary?.();
                close();
              }}
            >
              <Text className="text-gray-700 dark:text-light-200 font-medium">
                {options.primaryText || "Cancel"}
              </Text>
            </TouchableOpacity>

            {options.onSecondary && (
              <TouchableOpacity
                className="px-6 py-3 rounded-xl bg-secondary"
                onPress={() => {
                  options.onSecondary?.();
                  close();
                }}
              >
                <Text className="text-gray-900 font-semibold">
                  {options.secondaryText || "Confirm"}
                </Text>
              </TouchableOpacity>
            )}

            {options.onTertiary && (
              <TouchableOpacity
                className="px-6 py-3 rounded-xl bg-red-500"
                onPress={() => {
                  options.onTertiary?.();
                  close();
                }}
              >
                <Text className="text-white font-semibold">
                  {options.tertiaryText || "Delete"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// callable function
GlobalAlert.show = (opts) => {
  showAlertExternal?.(opts);
};

// Specialized function for list items
GlobalAlert.showContextMenu = (opts) => {
  showAlertExternal?.({ ...opts, context: "listItem" });
};