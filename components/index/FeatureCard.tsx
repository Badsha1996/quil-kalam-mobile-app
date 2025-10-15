import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
};

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      className="bg-white rounded-3xl p-6 mb-4 shadow-lg"
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-xl bg-primary justify-center items-center mr-4">
          <Text className="text-2xl">{icon}</Text>
        </View>
        <Text className="text-lg font-bold text-gray-900 flex-1">{title}</Text>
      </View>
      <Text className="text-sm text-gray-600 leading-5">{description}</Text>
    </Animated.View>
  );
};

export default FeatureCard;
