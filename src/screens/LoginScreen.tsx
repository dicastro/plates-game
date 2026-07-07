import { useTranslation } from "../i18n/useTranslation";
import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerSession } from "../player/PlayerSessionContext";
import { SUPPORTED_AUTH_PROVIDERS, type AuthProviderId } from "../platform/PlatformService";
import { platformService } from "../platform/platformServiceInstance";
import ScreenContainer from "../components/ScreenContainer";
import PlatesLogo from "../components/PlatesLogo";
import Button from "../components/Button";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { navigate, state } = useNavigation();
  const { initialize } = usePlayerSession();

  async function handleLogin(provider: AuthProviderId) {
    await platformService.login(provider, state.pendingIntent ?? undefined);
    // Unreachable in CloudflarePlatform (full-page redirect) — only completes for MemoryPlatform.
    const profile = await initialize();
    if (profile) navigate(state.pendingIntent ?? "HOME");
  }

  return (
    <ScreenContainer className="gap-8 px-6">
      <PlatesLogo />
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {SUPPORTED_AUTH_PROVIDERS.map((provider) => (
          <Button key={provider} variant="primary" onClick={() => handleLogin(provider)}>
            {t(`login.providers.${provider}`)}
          </Button>
        ))}
      </div>
    </ScreenContainer>
  );
}