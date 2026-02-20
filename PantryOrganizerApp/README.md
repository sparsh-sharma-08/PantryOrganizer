# Pantry Organizer App

## Overview
Pantry Organizer is a React Native mobile application built with Expo to help users manage their household pantry. It allows users to track items, monitor expiry dates, plan meals, and manage shopping lists, all wrapped in a modern, beautiful interface.

## 🚀 Current Progress & Features

### Core features implemented:
-   **Inventory Management**: Add, edit, and delete pantry items with details like quantity, location, and expiry dates.
-   **Smart Filtering**: Filter items by freshness (Fresh, Expiring Soon, Expired) and consumption history.
-   **Visual Dashboard**: A clean home screen with quick actions and summary statistics.
-   **Shopping List**: Add low-stock items to a shopping list and mark them as checked while shopping.
-   **Family Sharing**: (UI Implemented) Screens for inviting family members to share the pantry.
-   **Statistics**: Visual charts to track consumption and savings.
-   **Profile & Settings**: User profile management with custom avatar support.

### Recent Updates:
-   **Notifications System**:
    -   **Expiry Alerts**: Notifications 2 days before an item expires.
    -   **Low Stock Alerts**: triggered when item quantity falls below 3.
    -   **Meal Prep Reminders**: Daily reminders at 7 AM (Breakfast), 12 PM (Lunch), and 6 PM (Dinner).
    -   **Shopping Reminders**: Weekly nudge on Saturday mornings.
-   **UI Polish**: New app logo, modern gradient headers, and smooth animations using `react-native-reanimated`.

## 🏗 Architecture

### Tech Stack
-   **Framework**: [Expo](https://expo.dev/) (React Native)
-   **Language**: TypeScript
-   **UI Library**: `react-native-paper` & `react-native-vector-icons`
-   **Navigation**: React Navigation (Stack & Bottom Tabs)
-   **State/Storage**: Custom local `AsyncStorage` wrapper (`storage/store.ts`) & Firebase (Auth/Firestore).
-   **Animations**: `react-native-reanimated`

### Project Structure
```
src/
├── components/     # Reusable UI components (ItemCard, TabBar, etc.)
├── context/        # React Contexts (AuthContext for user session)
├── screens/        # Main application screens (Home, PantryList, AddItem)
├── services/       # Business logic services (NotificationService)
├── storage/        # Data persistence layer (Local Store wrapper)
├── theme.ts        # Centralized design tokens (colors, spacing)
├── styles.ts       # Global styles
└── utils/          # Helper functions
```

### Key Components
-   **`NotificationService.ts`**: Central hub for scheduling local notifications and handling push token registration.
-   **`store.ts`**: A robust wrapper around `AsyncStorage` that acts as a local database, handling CRUD operations for pantry items.
-   **`AuthContext.tsx`**: Manages user authentication state using Firebase.

## 📦 Setup & Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the server**:
    ```bash
    npx expo start
    ```
4.  **Run on device**: Scan the QR code with Expo Go (Android/iOS) or run on a simulator.

## 🔮 Future Roadmap
-   [ ] **Recipe Suggestions**: Integration with a recipe API to suggest meals based on available ingredients.
-   [ ] **Barcode Scanner**: Quickly add items by scanning their barcodes.
-   [ ] **Cloud Sync**: Robust real-time syncing across devices (expanding on current Firebase basics).
-   [ ] **Dark Mode**: System-wide dark theme support.
