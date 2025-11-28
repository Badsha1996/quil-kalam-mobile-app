import { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";

type StatCardProps = {
  number: string;
  label: string;
  color: string;
  delay?: number;
};

const StatCard = ({ number, label, color, delay }: StatCardProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // ************************************ EFFECTS **********************************
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    // @ts-ignore
    <Animated.View
      className="rounded-2xl p-5 flex-1 mx-1.5 items-center border"
      style={{
        backgroundColor: color,
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* @ts-ignore */}
      <Text className="text-4xl font-black mb-1">{number}</Text>
      {/* @ts-ignore */}
      <Text className="text-xs text-gray-600 text-center font-semibold">
        {label}
      </Text>
    </Animated.View>
  );
};

export default StatCard;
