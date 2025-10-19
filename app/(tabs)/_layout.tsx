import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, useColorScheme, View } from "react-native";

type TabsIconProps = {
  iconName: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
  title: string;
};

const TabsIcon = ({ iconName, focused, title }: TabsIconProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scaleAnim, opacityAnim]);

  const getGradientColors = (): [string, string] => {
    switch (title) {
      case "Home":
        return ["#667eea", "#764ba2"];
      case "Search":
        return ["#f093fb", "#f5576c"];
      case "Create":
        return ["#4facfe", "#00f2fe"];
      case "Profile":
        return ["#43e97b", "#38f9d7"];
      default:
        return ["#667eea", "#764ba2"];
    }
  };

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View
      className="flex justify-center items-center relative"
      style={{ width: 60, height: 60 }}
    >
      {/* Background Gradient */}
      <Animated.View
        className="absolute"
        style={{
          width: 50,
          height: 50,
          borderRadius: 10,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>

      {/* Icon and Text */}
      <View className="flex justify-center items-center">
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <MaterialIcons
            name={iconName}
            size={24}
            color={focused ? "#ffffff" : "#94a3b8"}
          />
        </Animated.View>

        <Animated.Text
          className="text-[10px] font-semibold mt-1 tracking-wide"
          style={{
            opacity: focused ? 1 : 0.7,
            color: focused ? "#ffffff" : "#64748b",
          }}
        >
          {title}
        </Animated.Text>
      </View>
    </View>
  );
};

const Layout = () => {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colorScheme === "dark" ? "#111827" : "#ffffff",
          borderTopColor: colorScheme === "dark" ? "#1f2937" : "#f1f5f9",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon iconName="home" focused={focused} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="published"
        options={{
          title: "published",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon iconName="public" focused={focused} title="Stories" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon iconName="search" focused={focused} title="Search" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon iconName="add-circle" focused={focused} title="Create" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabsIcon iconName="person" focused={focused} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
