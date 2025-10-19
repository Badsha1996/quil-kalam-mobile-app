import Background from "@/components/common/Background";
import { registerLocalUser, loginLocalUser } from "@/utils/database";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AuthScreen = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    // Basic validation - adjust for your region
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 6;
  };

  const handleAuth = async () => {
    // Validation
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    if (!password) {
      Alert.alert("Error", "Please enter a password");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      if (!displayName.trim()) {
        Alert.alert("Error", "Please enter your display name");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const user = await loginLocalUser(phoneNumber, password);
        Alert.alert("Success", `Welcome back, ${user.displayName || 'Writer'}!`);
        router.replace('/(tabs)');
      } else {
        // Register
        const user = await registerLocalUser(phoneNumber, password, displayName);
        Alert.alert(
          "Success",
          `Account created successfully! Welcome, ${displayName}!`
        );
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || (isLogin ? "Login failed" : "Registration failed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Continue as Guest?",
      "You can still create and manage projects locally, but you won't be able to publish online or sync across devices.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  return (
    <Background>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <View className="w-24 h-24 rounded-full bg-primary justify-center items-center mb-6">
                <Text className="text-5xl">✍️</Text>
              </View>
              <Text className="text-4xl font-bold text-gray-900 dark:text-light-100 mb-2">
                QuillKalam
              </Text>
              <Text className="text-base text-gray-600 dark:text-light-200 text-center">
                Your Complete Writing Companion
              </Text>
            </View>

            {/* Form Card */}
            <View className="bg-white dark:bg-dark-200 rounded-3xl p-6 shadow-lg mb-6">
              {/* Toggle Tabs */}
              <View className="flex-row bg-light-100 dark:bg-dark-100 rounded-2xl p-1 mb-6">
                <TouchableOpacity
                  onPress={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-xl ${
                    isLogin ? "bg-primary" : ""
                  }`}
                >
                  <Text
                    className={`text-center font-bold ${
                      isLogin
                        ? "text-white"
                        : "text-gray-600 dark:text-light-200"
                    }`}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-xl ${
                    !isLogin ? "bg-primary" : ""
                  }`}
                >
                  <Text
                    className={`text-center font-bold ${
                      !isLogin
                        ? "text-white"
                        : "text-gray-600 dark:text-light-200"
                    }`}
                  >
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Fields */}
              <View className="gap-4">
                {!isLogin && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      Display Name
                    </Text>
                    <View className="bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center">
                      <Text className="text-xl mr-2">👤</Text>
                      <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Your name"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 text-gray-900 dark:text-light-100"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View>
                  <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                    Phone Number
                  </Text>
                  <View className="bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center">
                    <Text className="text-xl mr-2">📱</Text>
                    <TextInput
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="+1 (555) 123-4567"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      className="flex-1 text-gray-900 dark:text-light-100"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                    Password
                  </Text>
                  <View className="bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center">
                    <Text className="text-xl mr-2">🔒</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      className="flex-1 text-gray-900 dark:text-light-100"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text className="text-xl">{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                    </TouchableOpacity>
                  </View>
                  {!isLogin && (
                    <Text className="text-xs text-gray-500 dark:text-light-200 mt-1 ml-1">
                      Minimum 6 characters
                    </Text>
                  )}
                </View>

                {!isLogin && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      Confirm Password
                    </Text>
                    <View className="bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center">
                      <Text className="text-xl mr-2">🔒</Text>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        className="flex-1 text-gray-900 dark:text-light-100"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAuth}
                disabled={loading}
                className={`mt-6 py-4 rounded-xl ${
                  loading ? "bg-gray-300" : "bg-primary"
                }`}
              >
                <Text className="text-white font-bold text-center text-lg">
                  {loading
                    ? "Please wait..."
                    : isLogin
                    ? "Login"
                    : "Create Account"}
                </Text>
              </TouchableOpacity>

              {/* Additional Info */}
              {!isLogin && (
                <Text className="text-xs text-gray-500 dark:text-light-200 text-center mt-4">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </Text>
              )}

              {isLogin && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Forgot Password",
                      "Password reset functionality will be available soon. Please contact support if you need help."
                    )
                  }
                  className="mt-4"
                >
                  <Text className="text-primary text-center font-semibold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Skip Button */}
            <TouchableOpacity
              onPress={handleSkip}
              className="bg-light-100 dark:bg-dark-100 rounded-2xl py-4 mb-6"
            >
              <Text className="text-gray-700 dark:text-light-100 font-semibold text-center">
                Continue as Guest
              </Text>
            </TouchableOpacity>

            {/* Features List */}
            <View className="bg-white/50 dark:bg-dark-200/50 rounded-2xl p-6">
              <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-4">
                Why Create an Account?
              </Text>
              <View className="gap-3">
                {[
                  { icon: "📚", text: "Publish your work online" },
                  { icon: "☁️", text: "Sync across all devices" },
                  { icon: "💬", text: "Connect with readers" },
                  { icon: "📊", text: "Track your writing stats" },
                  { icon: "🔒", text: "Secure cloud backup" },
                ].map((feature, index) => (
                  <View key={index} className="flex-row items-center">
                    <Text className="text-2xl mr-3">{feature.icon}</Text>
                    <Text className="text-gray-700 dark:text-light-100">
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
};

export default AuthScreen;