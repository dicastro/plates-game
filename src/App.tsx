import { useNavigation } from "./navigation/NavigationContext";
import { AppProviders } from "./app/AppProviders";
import PersistentHUD from "./hud/PersistentHUD";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import NormalGameScreen from "./screens/NormalGameScreen";
import AliasSetupScreen from "./screens/AliasSetupScreen"
import LeaderboardScreen from "./screens/LeaderboardScreen";

function AppShell() {
  const { state } = useNavigation();

  const screen = (() => {
    switch (state.screen) {
      case "SPLASH":
        return <SplashScreen />;
      case "LOGIN":
        return <LoginScreen />;
      case "ALIAS_SETUP":
        return <AliasSetupScreen />;
      case "HOME":
        return <HomeScreen />;
      case "NORMAL_GAME":
        return <NormalGameScreen />;
      case "LEADERBOARD":
        return <LeaderboardScreen />;
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