const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Explicitly disable React Compiler
// config.transformer.unstable_reactCompilerEnabled = false;

// Optimize for production builds
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
  },
};

module.exports = withNativeWind(config, {
  input: "./app/global.css",
  inlineRem: false,
});