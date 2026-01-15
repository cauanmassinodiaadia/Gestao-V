# Project: gestaov

## Project Overview

This is a React Native mobile application named "gestaov". Based on the file structure and dependencies, it appears to be a management application that involves handling activities.

**Key Technologies:**

*   **Core:** React Native, TypeScript
*   **Navigation:** React Navigation (with native stack and bottom tabs)
*   **HTTP Client:** Axios
*   **UI:** `react-native-linear-gradient`, `react-native-svg`, `phosphor-react-native` for icons.
*   **Camera:** `react-native-vision-camera` for barcode scanning.

**Architecture:**

The application follows a standard React Native project structure.

*   `App.tsx`: The main entry point that renders the `AppNavigator`.
*   `src/navigation/AppNavigator.tsx`: Handles all application navigation. It uses a stack navigator for the main flow (Login -> MainTabs) and a bottom tab navigator for the main application screens.
*   `src/screens`: Contains all the application screens:
    *   `LoginScreen.tsx`: The initial screen for user authentication.
    *   `HomeScreen.tsx`: The main screen after login.
    *   `PendingActivitiesScreen.tsx`: A screen to display pending activities.
    *   `DoActivitiesScreen.tsx`: A screen for performing activities.
    *   `BarcodeScannerScreen.tsx`: A screen for scanning barcodes, likely to populate data in `DoActivitiesScreen`.
*   `src/components`: Contains reusable components like `AppHeader.tsx` and `CustomTabBar.tsx`.
*   `src/services/api.ts`: Likely contains the logic for making API calls using Axios.
*   `src/assets`: Contains static assets like images.
*   `src/theme`: Contains theme-related files like colors.

## Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Start Metro Bundler:**

```bash
npm start
```

**3. Run the Application:**

Keep the Metro bundler running in a separate terminal and run one of the following commands:

**Android:**

```bash
npm run android
```

**iOS:**

First, install CocoaPods dependencies:
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```
Then run the app:
```bash
npm run ios
```

## Development Conventions

*   **Language:** The project is written in TypeScript.
*   **Styling:** The project seems to have a custom theme located in `src/theme`.
*   **Linting:** The project uses ESLint for code linting. You can run the linter with `npm run lint`.
*   **Testing:** The project uses Jest for testing. You can run tests with `npm test`.
*   **Component Structure:** The project is structured with a clear separation of concerns, with screens, components, navigation, and services in their own directories.
*   **Navigation:** Navigation is centralized in `AppNavigator.tsx`, which makes it easy to understand the application flow.
*   **State Management:** The way props are passed through navigation suggests that route params are used for passing state between screens. For more complex state, a dedicated state management library might be used in the future.
