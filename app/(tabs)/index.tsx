import Background from "@/components/common/Background";
import FeatureCard from "@/components/index/FeatureCard";
import StatCard from "@/components/index/StatCard";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import { useRouter } from "expo-router";
import { Features, Stat } from "@/constants";

export default function Index() {
  const router = useRouter();
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-50)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  // ************************************ EFFECTS **********************************

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
        <View className="px-6 pt-16 pb-10">
          <Animated.View
            className="items-center"
            style={{
              opacity: heroFade,
              transform: [{ translateY: heroSlide }, { scale: heroScale }],
            }}
          >
            <View className="w-20 h-20 rounded-3xl bg-gray-300 dark:bg-gray-100 justify-center items-center mb-6">
              <Text className="text-5xl">✍🏻</Text>
            </View>

            <Text className="text-5xl mb-3 font-bold text-center">
              <Text className="text-dark-100 dark:text-white">Quil</Text>
              <Text className="text-primary">Kalam</Text>
            </Text>

            <Text className="text-lg text-dark-100 dark:text-white italic mb-8 text-center leading-7">
              "Where every voice has a story to tell"
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
              <Text
                onPress={() => router.push("/create")}
                className="text-gray-900 dark:text-gray-600 font-bold text-base"
              >
                Start Your Journey
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View className="px-5 mb-10">
          <View className="flex-row justify-between">
            {Stat.map((s, i) => (
              <StatCard
                key={i}
                number={s.number}
                label={s.label}
                color={s.color}
                delay={s.delay}
              />
            ))}
          </View>
        </View>

        <View className="px-6">
          <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
            Why Writers Love Us
          </Text>

          {Features.map((f, i) => (
            <FeatureCard
              key={i}
              icon={f.icon}
              title={f.title}
              description={f.description}
              delay={f.delay}
            />
          ))}
        </View>

        <View className="mx-6 mt-4 mb-14 bg-dark-200 dark:bg-gray-100 rounded-3xl p-8 items-center">
          <Text className="text-2xl font-extrabold text-white dark:text-dark-200 mb-3 text-center">
            Are you a Reader?
          </Text>
          <Text className="text-sm text-light-200 dark:text-dark-200 mb-6 text-center leading-5">
            Join thousands of readers in our community
          </Text>
          <TouchableOpacity className="bg-secondary dark:bg-transparent dark:border dark:border-black px-7 py-3.5 rounded-full active:opacity-80">
            <Text
              onPress={() => router.push("/published")}
              className="text-gray-900 dark:text-black font-bold text-lg"
            >
              Start Reading
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Background>
  );
}
