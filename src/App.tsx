import { useNavigation } from "./navigation/NavigationContext";
import { AppProviders } from "./app/AppProviders";
import PersistentHUD from "./hud/PersistentHUD";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import NormalGameScreen from "./screens/NormalGameScreen";

function AppShell() {
  const { state } = useNavigation();

  const screen = (() => {
    switch (state.screen) {
      case "SPLASH":
        return <SplashScreen />;
      case "LOGIN":
        return <LoginScreen />;
      case "HOME":
        return <HomeScreen />;
      case "NORMAL_GAME":
        return <NormalGameScreen />;
      default:
        return <HomeScreen />;
    }
  })();

  return (
    <>
      {screen}
      {state.screen !== "SPLASH" && state.screen !== "LOGIN" && <PersistentHUD />}
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