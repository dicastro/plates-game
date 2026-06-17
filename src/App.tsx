import { useEffect, useRef } from "react";
import { PlatformFactory } from "./platform/PlatformService";
import { ProceduralAudioEngine } from "./audio/ProceduralAudioEngine";
import { useTranslation } from "./i18n/useTranslation";

const platform = PlatformFactory.create();
const audio = new ProceduralAudioEngine();

function PlatesLogo() {
  return (
    <svg
      viewBox="0 0 320 80"
      className="w-72 md:w-96"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PLATES"
    >
      {/* License-plate frame */}
      <rect x="4" y="4" width="312" height="72" rx="12" ry="12"
        fill="#1e293b" stroke="#f59e0b" strokeWidth="4" />
      <rect x="14" y="14" width="292" height="52" rx="6" ry="6"
        fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
      {/* Bolt rivets */}
      {[26, 294].map((cx) =>
        [26, 54].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4"
            fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
        ))
      )}
      {/* Game title */}
      <text x="160" y="50" textAnchor="middle" dominantBaseline="middle"
        fontFamily="system-ui, monospace" fontSize="32" fontWeight="900"
        letterSpacing="8" fill="#f59e0b">
        PLATES
      </text>
    </svg>
  );
}

export default function App() {
  const { t } = useTranslation();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    platform.onPause(() => audio.setMute(true));
    platform.onResume(() => audio.setMute(false));

    return () => { audio.stop(); };
  }, []);

  function handleStart() {
    platform.initialize().then(() => {
      const seed = Math.floor(Math.random() * 0xffffff);
      audio.start(seed);
    });
  }

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-900 flex flex-col justify-center items-center gap-6">
      <PlatesLogo />
      <button
        onClick={handleStart}
        className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-bold text-lg tracking-wider transition-all duration-150 select-none"
      >
        {t("app.startButton")}
      </button>
    </main>
  );
}