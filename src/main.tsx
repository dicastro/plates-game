import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

function waitForYtGame(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (window.ytgame) { resolve(); return; }
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (window.ytgame || Date.now() >= deadline) { resolve(); }
      else { setTimeout(check, 50); }
    };
    check();
  });
}

const SDK_PRESENT = !!document.querySelector(
  'script[src="https://www.youtube.com/game_api/v1"]'
);

(SDK_PRESENT ? waitForYtGame(3000) : Promise.resolve()).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});