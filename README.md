# DilCare

A React Native health companion app built for Indian users. DilCare brings together everyday health tools — medicine reminders, step tracking, BMI, water intake, an AI health assistant, and emergency SOS — all in one place, with support for 8 Indian languages.

---

## What's Inside

- **AI Health Assistant** — chat-based health guidance powered by an AI service
- **Medicine Reminders** — schedule and track daily medications
- **Step Tracker** — monitor daily steps and activity
- **BMI Calculator** — calculate and track body mass index
- **Water Tracker** — log daily water intake
- **Health Metrics** — track vitals and health progress over time
- **SOS Emergency** — one-tap emergency alert with saved contacts and haptic feedback
- **Doctor Section** — find and connect with healthcare providers
- **Gyaan Corner** — wellness tips and health education content
- **Community** — connect with other users
- **Child Dashboard** — dedicated health tracking for children
- **Multi-language** — English, Hindi, Marathi, Gujarati, Malayalam, Tamil, Telugu, Punjabi
- **Dark / Light theme** — follows system preference

---

## Tech Stack

- **Framework:** React Native 0.83 + Expo SDK 55
- **Navigation:** React Navigation (Bottom Tabs + Native Stack)
- **Internationalization:** i18next + expo-localization
- **Charts:** react-native-chart-kit + react-native-svg
- **Animations:** React Native Animated API + expo-linear-gradient
- **Storage:** AsyncStorage
- **Language:** TypeScript

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — install globally with `npm install -g expo-cli`
- For iOS: macOS with Xcode installed
- For Android: Android Studio with an emulator configured, or a physical device

---

## Setup

**1. Clone the repository**

```bash
git clone https://github.com/krishnaChandak044/DilCare-Native-.git
cd DilCare-Native-
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npx expo start
```

This opens the Expo dev menu. From there:

- Press `i` to open on an iOS simulator
- Press `a` to open on an Android emulator
- Scan the QR code with the **Expo Go** app on a physical device

---

## Running on a specific platform

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## Project Structure

```
src/
├── screens/        # All app screens
├── components/ui/  # Reusable UI components (Button, Card, Input, Modal, etc.)
├── navigation/     # Stack and tab navigator setup
├── hooks/          # Custom hooks (useTheme, useUserMode)
├── theme/          # Color tokens, gradients, typography
├── locales/        # Translation files for all 8 languages
├── services/       # API service layer
└── i18n.ts         # i18next configuration
```

---

## License

MIT
