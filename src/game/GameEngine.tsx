import GameEngineLayout from "./GameEngineLayout";
import { GameRuntimeProvider } from "./GameRuntimeContext";
import { useViewportSupport } from "../layout/useViewportSupport";
import ViewportNoticeScreen from "../screens/ViewportNoticeScreen";
import type { GameConfig } from "./types";

export default function GameEngine({ config }: { config: GameConfig }) {
  const support = useViewportSupport();

  return (
    <GameRuntimeProvider config={config}>
      {support === "supported" ? (
        <GameEngineLayout config={config} />
      ) : (
        <ViewportNoticeScreen variant={support === "needs-rotation" ? "rotate" : "unsupported"} />
      )}
    </GameRuntimeProvider>
  );
}