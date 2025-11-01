import Background from "@/components/common/Background";
import { countries } from "@/constants/login";
import { registerLocalUser, loginLocalUser } from "@/utils/database";
// @ts-ignore
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState("");

  const validatePhoneNumber = (phone: string) => {
    // Remove country code and formatting for validation
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 7; // Minimum phone number length without country code
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 6;
  };

  // Mock function to send verification code (replace with actual SMS service)
  const sendVerificationCode = async (phoneNumber: string) => {
    const response = await fetch("/api/send-verification", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await response.json();
    setVerificationId(data.verificationId);
  };

  // Mock function to verify code (replace with actual verification)
  const verifyCode = async (code: string) => {
    setLoading(true);
    try {
      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would verify with your SMS service
      // For demo, accept any 6-digit code or "123456"
      if (code.length === 6) {
        return true;
      }
      throw new Error("Invalid verification code");
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isVerifying) {
      // Handle verification code submission
      if (!verificationCode.trim()) {
        Alert.alert("Error", "Please enter the verification code");
        return;
      }

      setLoading(true);
      try {
        await verifyCode(verificationCode);

        // Continue with registration/login after successful verification
        const fullPhoneNumber =
          selectedCountry.dial_code + phoneNumber.replace(/\D/g, "");

        if (isLogin) {
          const user = await loginLocalUser(fullPhoneNumber, password);
          Alert.alert(
            "Success",
            `Welcome back, ${user.displayName || "Writer"}!`
          );
          router.replace("/(tabs)");
        } else {
          const user = await registerLocalUser(
            fullPhoneNumber,
            password,
            displayName
          );
          Alert.alert(
            "Success",
            `Account created successfully! Welcome, ${displayName}!`
          );
          router.replace("/(tabs)");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Invalid verification code");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Original validation (before verification)
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

    // Send verification code
    const fullPhoneNumber =
      selectedCountry.dial_code + phoneNumber.replace(/\D/g, "");
    await sendVerificationCode(fullPhoneNumber);
  };

  const handleSkip = () => {
    Alert.alert(
      "Continue as Guest?",
      "You can still create and manage projects locally, but your profile and settings won't be saved permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => router.replace("/(tabs)"),
        },
      ]
    );
  };

  // Format phone number as user types
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
                  onPress={() => {
                    setIsLogin(true);
                    setIsVerifying(false);
                  }}
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
                  onPress={() => {
                    setIsLogin(false);
                    setIsVerifying(false);
                  }}
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
                {!isLogin && !isVerifying && (
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

                {!isVerifying ? (
                  <>
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

                    {!isLogin && (
                      <>
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
                          <Text className="text-xs text-gray-500 dark:text-light-200 mt-1 ml-1">
                            Minimum 6 characters
                          </Text>
                        </View>

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
                      </>
                    )}

                    {isLogin && (
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
                      </View>
                    )}
                  </>
                ) : (
                  // Verification Code Input
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 dark:text-light-100 mb-2">
                      Verification Code
                    </Text>
                    <View className="bg-light-100 dark:bg-dark-100 rounded-xl px-4 py-3 flex-row items-center">
                      <Text className="text-xl mr-2">🔢</Text>
                      <TextInput
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        className="flex-1 text-gray-900 dark:text-light-100"
                        editable={!loading}
                        maxLength={6}
                      />
                    </View>
                    <Text className="text-xs text-gray-500 dark:text-light-200 mt-1 ml-1">
                      Enter the code sent to {selectedCountry.dial_code}
                      {phoneNumber}
                    </Text>
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
                    : isVerifying
                    ? "Verify Code"
                    : isLogin
                    ? "Login"
                    : "Create Account"}
                </Text>
              </TouchableOpacity>

              {/* Back to phone input during verification */}
              {isVerifying && (
                <TouchableOpacity
                  onPress={() => setIsVerifying(false)}
                  className="mt-4"
                  disabled={loading}
                >
                  <Text className="text-primary text-center font-semibold">
                    Change Phone Number
                  </Text>
                </TouchableOpacity>
              )}

              {/* Additional Info */}
              {!isLogin && !isVerifying && (
                <Text className="text-xs text-gray-500 dark:text-light-200 text-center mt-4">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </Text>
              )}

              {isLogin && !isVerifying && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Forgot Password",
                      "Please contact support if you need help with your password."
                    )
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

            {/* Skip Button */}
            <TouchableOpacity
              onPress={handleSkip}
              className="bg-light-100 dark:bg-dark-100 rounded-2xl py-4 mb-6"
              disabled={loading}
            >
              <Text className="text-gray-700 dark:text-light-100 font-semibold text-center">
                Continue as Guest
              </Text>
            </TouchableOpacity>
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
                  { icon: "💾", text: "Save your profile locally" },
                  { icon: "⚙️", text: "Persist your settings" },
                  { icon: "📊", text: "Track your writing stats" },
                  { icon: "🖼️", text: "Upload profile pictures" },
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
    </Background>
  );
};

export default AuthScreen;
