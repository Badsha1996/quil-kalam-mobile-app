import Background from "@/components/common/Background";
import GlobalAlert from "@/components/common/GlobalAlert";
import KeyboardAvoidingLayout from "@/components/common/KeyboardAvoidingLayout";
import { countries } from "@/constants/login";
import {
  registerUser as registerRemote,
  loginUser as loginRemote,
  initAuth,
} from "@/utils/api";
import { setActiveSession, setSetting } from "@/utils/database";
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
  Modal,
  FlatList,
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
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 7;
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 6;
  };

  const handleAuth = async () => {
    // Validation
    if (!phoneNumber.trim()) {
      GlobalAlert.show({
        title: "Error",
        message: "Please enter your phone number",
        primaryText: "Okay",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      GlobalAlert.show({
        title: "Error",
        message: "Please enter a valid phone number",
        primaryText: "Okay",
      });
      return;
    }

    if (!password) {
      GlobalAlert.show({
        title: "Error",
        message: "Please enter a password",
        primaryText: "Okay",
      });
      return;
    }

    if (!validatePassword(password)) {
      GlobalAlert.show({
        title: "Error",
        message: "Password must be at least 6 characters",
        primaryText: "Okay",
      });
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        GlobalAlert.show({
          title: "Error",
          message: "Passwords do not match",
          primaryText: "Okay",
        });
        return;
      }

      if (!displayName.trim()) {
        GlobalAlert.show({
          title: "Error",
          message: "Please enter your display name",
          primaryText: "Okay",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const fullPhoneNumber =
        selectedCountry.dial_code + phoneNumber.replace(/\D/g, "");

      if (isLogin) {
        // Remote login only
        const remoteUser = await loginRemote(fullPhoneNumber, password);
        await initAuth();

        // Save user data locally as backup
        setSetting("user_display_name", remoteUser.displayName || "");
        setSetting("user_phone_number", fullPhoneNumber);
        setSetting("user_email", remoteUser.email || "");

        setActiveSession(remoteUser.id);

        GlobalAlert.show({
          title: "Success",
          message: `Welcome back, ${remoteUser.displayName || "Writer"}!`,
          primaryText: "Okay",
        });
        router.replace("/(tabs)");
      } else {
        // Remote registration only
        const remoteUser = await registerRemote(
          fullPhoneNumber,
          password,
          displayName
        );
        await initAuth();

        // Save user data locally as backup
        setSetting("user_display_name", displayName);
        setSetting("user_phone_number", fullPhoneNumber);
        setSetting("user_email", remoteUser.email || "");

        setActiveSession(remoteUser.id);

        GlobalAlert.show({
          title: "Success",
          message: `Account created successfully! Welcome, ${displayName}!`,
          primaryText: "Okay",
        });
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      GlobalAlert.show({
        title: "Error",
        message: `Authentication failed`,
        primaryText: "Okay",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");

    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
        6,
        10
      )}`;
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const selectCountry = (country: any) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const CountryPicker = () => (
    <Modal visible={showCountryPicker} animationType="slide" transparent={true}>
      <View className="flex-1 justify-center bg-black/50">
        <View className="mx-4 bg-white dark:bg-dark-200 rounded-2xl max-h-80">
          <View className="p-4 border-b border-gray-200 dark:border-dark-100">
            <Text className="text-lg font-bold text-gray-900 dark:text-light-100">
              Select Country
            </Text>
          </View>
          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectCountry(item)}
                className="px-4 py-3 flex-row items-center border-b border-gray-100 dark:border-dark-100"
              >
                <Text className="text-lg mr-3 text-gray-900 dark:text-light-100">
                  {item.dial_code}
                </Text>
                <Text className="text-gray-900 dark:text-light-100 flex-1">
                  {item.name}
                </Text>
                <Text className="text-gray-500 dark:text-light-200">
                  {item.code}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            onPress={() => setShowCountryPicker(false)}
            className="p-4 border-t border-gray-200 dark:border-dark-100"
          >
            <Text className="text-primary text-center font-semibold">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <Background>
      <KeyboardAvoidingLayout>
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
                          editable={!loading}
                        />
                      </View>
                    </View>
                  )}

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      Phone Number
                    </Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setShowCountryPicker(true)}
                        className="bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center min-w-20"
                        disabled={loading}
                      >
                        <Text className="text-gray-900 dark:text-light-100">
                          {selectedCountry.dial_code}
                        </Text>
                        <Text className="text-gray-900 dark:text-light-100 ml-1">
                          ▼
                        </Text>
                      </TouchableOpacity>
                      <View className="flex-1 bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center">
                        <TextInput
                          value={phoneNumber}
                          onChangeText={handlePhoneNumberChange}
                          placeholder="Your phone number"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="phone-pad"
                          className="flex-1 text-gray-900 dark:text-light-100"
                          editable={!loading}
                        />
                      </View>
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
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        <Text className="text-xl">
                          {showPassword ? "👁️" : "👁️‍🗨️"}
                        </Text>
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
                          editable={!loading}
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
                    By creating an account, you agree to our Terms of Service
                    and Privacy Policy
                  </Text>
                )}

                {isLogin && (
                  <TouchableOpacity
                    onPress={() =>
                      GlobalAlert.show({
                        title: "Forgot Password",
                        message: `Please contact support if you need help with your password at contentcentral0@gmail.com`,
                        primaryText: "Okay",
                      })
                    }
                    className="mt-4"
                    disabled={loading}
                  >
                    <Text className="text-primary text-center font-semibold">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push("/")}
                className="bg-light-100 dark:bg-dark-100 rounded-2xl py-4 mb-6"
                disabled={loading}
              >
                <Text className="text-gray-700 dark:text-light-100 font-semibold text-center">
                  Go Back
                </Text>
              </TouchableOpacity>

              {/* Features List */}
              <View className="bg-white/50 dark:bg-dark-200/50 rounded-2xl p-6">
                <Text className="text-lg font-bold text-gray-900 dark:text-light-100 mb-4">
                  Why Create an Account?
                </Text>
                <View className="gap-3">
                  {[
                    { icon: "💾", text: "Sync across devices" },
                    { icon: "☁️", text: "Cloud backup" },
                    { icon: "📊", text: "Track your writing stats" },
                    { icon: "🌐", text: "Share your work" },
                    { icon: "🎯", text: "Set writing goals" },
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

        <CountryPicker />
      </KeyboardAvoidingLayout>
    </Background>
  );
};

export default AuthScreen;
