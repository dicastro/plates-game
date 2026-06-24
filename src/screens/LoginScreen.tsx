import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerSession } from "../player/PlayerSessionContext";
import { platformService } from "../platform/platformServiceInstance";
import ScreenContainer from "../components/ScreenContainer";
import PlatesLogo from "../components/PlatesLogo";
import Button from "../components/Button";

export default function LoginScreen() {
  const { navigate } = useNavigation();
  const { updatePlayer } = usePlayerSession();

  async function handleGoogleLogin() {
    // TODO: real OAuth full-page redirect flow — see doc/technical/worker-architecture.md §4.
    // Placeholder so the screen is navigable end-to-end before the Worker exists.
    await platformService.login("google");
    const profile = await platformService.initialize();
    if (profile) {
      updatePlayer(profile);
      navigate("HOME");
    }
  }

  return (
    <ScreenContainer className="gap-8 px-6">
      <PlatesLogo />
      <Button variant="primary" onClick={handleGoogleLogin}>
        Sign in with Google
      </Button>
    </ScreenContainer>
  );
}