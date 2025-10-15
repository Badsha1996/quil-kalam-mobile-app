import Background from "@/components/common/Background";
import FeatureCard from "@/components/index/FeatureCard";
import StatCard from "@/components/index/StatCard";
import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Background>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="px-6 pt-16 pb-10">
          <Animated.View
            className="items-center"
            style={{
              opacity: heroFade,
              transform: [{ translateY: heroSlide }, { scale: heroScale }],
            }}
          >
            <View className="w-20 h-20 rounded-3xl bg-gray-300 justify-center items-center mb-6">
              <Text className="text-5xl">✍🏻</Text>
            </View>

            <Text className="text-5xl mb-3 font-bold text-center">
              <Text className="text-dark-100">Quil</Text>
              <Text className="text-primary">Kalam</Text>
            </Text>

            <Text className="text-lg text-dark-100 italic mb-8 text-center leading-7">
              "Where every voice has a stroy to tell"
            </Text>

            <TouchableOpacity
              className="bg-secondary px-8 py-4 rounded-full active:opacity-80"
              style={{
                shadowColor: "#FFC2C7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text className="text-gray-900 font-bold text-base">
                Start Your Journey
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Stats Section */}
        <View className="px-5 mb-10">
          <View className="flex-row justify-between">
            <StatCard
              number="10K+"
              label="Active Writers"
              color="#B6E5D8"
              delay={200}
            />
            <StatCard
              number="50K+"
              label="Stories Created"
              color="#FBE5C8"
              delay={400}
            />
            <StatCard
              number="10K+"
              label="Happy Readers"
              color="#8FDDE7"
              delay={600}
            />
          </View>
        </View>

        {/* Features Section */}
        <View className="px-6">
          <Text className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
            Why Writers Love Us
          </Text>

          <FeatureCard
            icon="✨"
            title="Intuitive Writing Experience"
            description="Focus on your creativity with our distraction-free editor designed for storytellers."
            delay={100}
          />

          <FeatureCard
            icon="📚"
            title="Organize Your Stories"
            description="Keep track of multiple projects, chapters, and ideas all in one beautiful interface."
            delay={200}
          />

          <FeatureCard
            icon="👥"
            title="Connect with Readers"
            description="Share your work and build an audience that loves your unique storytelling style."
            delay={300}
          />

          <FeatureCard
            icon="🎯"
            title="Smart Writing Tools"
            description="Get suggestions, track your progress, and improve your craft with intelligent features."
            delay={400}
          />
        </View>

        {/* CTA Section */}
        <View className="mx-6 mt-10 mb-10 bg-dark-200 rounded-3xl p-8 items-center">
          <Text className="text-2xl font-extrabold text-white mb-3 text-center">
            Ready to Write?
          </Text>
          <Text className="text-sm text-light-200 mb-6 text-center leading-5">
            Join thousands of authors creating amazing stories every day
          </Text>
          <TouchableOpacity className="bg-secondary px-7 py-3.5 rounded-full active:opacity-80">
            <Text className="text-gray-900 font-bold text-base">
              Get Started Free
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Background>
  );
}
