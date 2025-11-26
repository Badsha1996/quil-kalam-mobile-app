import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

let showAlertExternal = null;

export default function GlobalAlert() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({});

  showAlertExternal = (opts) => {
    setOptions(opts);
    setVisible(true);
  };

  const close = () => setVisible(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      className=" bg-primary"
    >
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full bg-blue-200 dark:bg-slate-300 p-6 rounded-2xl shadow-xl">
          <Text className="text-2xl font-semibold text-black mb-1">
            {options.title}
          </Text>

          <Text className="text-base text-neutral-600  mb-1">
            {options.message}
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 border  p-3 rounded-xl"
              onPress={() => {
                options.onPrimary?.();
                close();
              }}
            >
              <Text className="text-center  font-medium">
                {options.primaryText || "OK"}
              </Text>
            </TouchableOpacity>

            {options.onSecondary && (
              <TouchableOpacity
                className="flex-1 bg-secondary border p-3 rounded-xl"
                onPress={() => {
                  options.onSecondary?.();
                  close();
                }}
              >
                <Text className="text-center  font-semibold">
                  {options.secondaryText || "Confirm"}
                </Text>
              </TouchableOpacity>
            )}

            {options.onTertiary && (
              <TouchableOpacity
                className="mt-3 bg-red-600 p-3 rounded-xl"
                onPress={() => {
                  options.onTertiary?.();
                  close();
                }}
              >
                <Text className="text-center text-white font-semibold">
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
