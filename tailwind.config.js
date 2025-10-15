/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#8FDDE7",
        secondary: "#FFC2C7",
        Tertiary: "#B6E5D8",
        quaternary: "#FBE5C8",
        light: {
          100: "#FBFBFB",
          200: "#F3F3F3",
        },
        dark: {
          100: "#4b5563",
          200: "#111827",
        },
      },
    },
  },
  plugins: [],
};
