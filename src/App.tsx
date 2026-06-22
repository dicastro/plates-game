import { useNavigation } from "./navigation/NavigationContext";
import { AppProviders } from "./app/AppProviders";
import PersistentHUD from "./hud/PersistentHUD";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";

function AppShell() {
  const { state } = useNavigation();

  const screen = (() => {
    switch (state.screen) {
      case "SPLASH":
        return <SplashScreen />;
      case "HOME":
        return <HomeScreen />;
      default:
        return <HomeScreen />;
    }
  })();

  return (
    <>
      {screen}
      {state.screen !== "SPLASH" && <PersistentHUD />}
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}