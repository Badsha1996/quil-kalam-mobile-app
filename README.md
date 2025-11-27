# QuilKalam Mobile App
<p align="center">
  <img src="./assets/images/transparent-bg.png" alt="QuilKalam Logo" width="300"/>
</p>

## Getting Started
### Download APK
<p align="center">
  <a href="./assets/releases/Quilkalam-v1.apk">
    <img src="https://img.shields.io/badge/Download-APK-brightgreen.svg?logo=android" alt="Download APK"/>
  </a>
</p>

Or a simple direct link:

[Download APK](./assets/releases/Quilkalam-v1.apk)
QuilKalam is a mobile application for writers and readers, providing an intuitive platform to write, organize, and share stories. Built with [Expo](https://expo.dev/), [React Native](https://reactnative.dev/), [NativeWind](https://www.nativewind.dev/), and [Tailwind CSS](https://tailwindcss.com/), it offers a modern, animated, and responsive user experience.

## Features

- ✍️ **Distraction-Free Writing**: Focus on creativity with a clean, minimal editor.
- 📚 **Story Organization**: Manage multiple projects, chapters, and ideas.
- 👥 **Community**: Connect with readers and other writers.
- 🎯 **Smart Tools**: Progress tracking and intelligent suggestions.
- 🎨 **Beautiful UI**: Animated transitions and custom theming with Tailwind CSS.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/):  
  ```sh
  npm install -g expo-cli
  ```

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/quil-kalam-mobile-app.git
   cd quil-kalam-mobile-app
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```sh
   npm run start
   # or
   yarn start
   ```

4. **Run on your device:**
   - For Android: `npm run android`
   - For iOS: `npm run ios`
   - For Web: `npm run web`

---

## Development

- **Code Style:**  
  - Uses [ESLint](https://eslint.org/) with Expo config.
  - Tailwind CSS for styling via [NativeWind](https://www.nativewind.dev/).
- **Type Checking:**  
  - TypeScript strict mode enabled.
- **Hot Reloading:**  
  - Supported via Expo.

### Useful Scripts

| Script           | Description                      |
|------------------|----------------------------------|
| `npm run start`  | Start Expo development server    |
| `npm run android`| Run app on Android emulator      |
| `npm run ios`    | Run app on iOS simulator         |
| `npm run web`    | Run app in web browser           |
| `npm run lint`   | Run ESLint checks                |
| `npm run reset-project` | Clean and reset project   |

---

## Configuration

- **Tailwind CSS:**  
  Configured in [`tailwind.config.js`](tailwind.config.js) and [`app/global.css`](app/global.css).
- **Metro Bundler:**  
  Custom config in [`metro.config.js`](metro.config.js) for NativeWind.
- **TypeScript:**  
  Paths and strict mode in [`tsconfig.json`](tsconfig.json).

---

## Folder Details

- [`app/`](app): Main application screens and navigation.
- [`components/`](components): Reusable UI components.
- [`assets/`](assets): Images and icons.
- [`constants/`](constants): Shared constants (e.g., icon definitions).
- [`types/`](types): TypeScript type definitions.

---

## Contributing

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
