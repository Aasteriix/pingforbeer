// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getToken } from "../lib/storage";
import {
  ThemeProvider,
  DarkTheme,
  type Theme,
} from "@react-navigation/native";
import { View, ActivityIndicator } from "react-native";
import { theme } from "../constants/theme";

const AuraTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,   // svart
    card: theme.colors.background,
    text: theme.colors.text,               // vit
    primary: theme.colors.accent,          // lila
    border: "#000000",
    notification: theme.colors.accent,
  },
};

export default function RootLayout() {
  const [isReady, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      setLoggedIn(!!token);
      setReady(true);
    };
    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider value={AuraTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {loggedIn ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="index" />
        )}
      </Stack>
    </ThemeProvider>
  );
}
