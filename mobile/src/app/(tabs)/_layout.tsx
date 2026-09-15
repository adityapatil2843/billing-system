import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00a2ff",
        tabBarInactiveTintColor: "#8e96a0",
        headerStyle: {
          backgroundColor: "#1a1d21",
        },
        headerShadowVisible: false,
        headerTintColor: "#ffffff",
        tabBarStyle: {
          backgroundColor: "#1a1d21",
          borderTopColor: "#2b3038",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerTitle: "Barcode Shopping",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan Product",
          headerTitle: "Scan Barcode",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "scan" : "scan-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
