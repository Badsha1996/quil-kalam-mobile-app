import React from "react";
import { View } from "react-native";

const Background: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return <View className="flex-1 bg-light-100 dark:bg-gray-900">{children}</View>;
};

export default Background;
