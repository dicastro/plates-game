import { NavigationProvider, useNavigation } from "./navigation/NavigationContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";

function AppShell() {
  const { state } = useNavigation();

  switch (state.screen) {
    case "SPLASH":
      return <SplashScreen />;
    case "HOME":
      return <HomeScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <AppShell />
      </NavigationProvider>
    </ThemeProvider>
  );
}