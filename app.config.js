export default {
  expo: {
    name: "Ducat",
    slug: "ducat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ducat"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ducat"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router"
    ],
    scheme: "ducat",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
    },
    // Ensure expo-constants can access manifest
    sdkVersion: "50.0.0"
  }
};

