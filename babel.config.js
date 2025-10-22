module.exports = function (api) {
  api.cache(true);

  const isEasBuild = process.env.EAS_BUILD === "true";

  return {
    presets: [
      // Keep NativeWind JSX source config
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // ⚡ Enable React Compiler only when NOT in EAS cloud
      !isEasBuild && ["@react/compiler", { /* optional config */ }],

      // 🌀 NativeWind (must come before Reanimated)
      "nativewind/babel",

      // 🎬 React Native Reanimated (must be last)
      "react-native-reanimated/plugin",
    ].filter(Boolean),
  };
};
