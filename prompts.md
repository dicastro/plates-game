Vamos a empezar con la Fase 1 del proyecto: crear el esqueleto mínimo (Hello World) para validación técnica e infraestructural de extremo a extremo.

Por favor, proporcióname los siguientes elementos manteniendo un enfoque ultra-estricto de optimización de tokens (muestra solo el código funcional necesario, sin explicaciones ni texto redundante):

1. El `package.json` con dependencias mínimas (incluyendo plugins de ofuscación y zip).
2. El archivo de entorno `.env.development` configurado con `VITE_PLATFORM_TARGET=MEMORY`.
3. El `vite.config.ts` configurado según las especificaciones de empaquetado y ofuscación (con renameGlobals: false).
4. El archivo `index.html` con meta-etiqueta viewport estricta para deshabilitar zoom táctil (`user-scalable=no`). SIN scripts externos del SDK de YouTube.
5. El archivo de CSS global (`src/index.css`) con directivas Tailwind y aplicando `overscroll-behavior: none` en html/body para bloquear el efecto muelle móvil.
6. El archivo de entrada `src/main.tsx` que monte la aplicación React en el DOM.
7. El sistema i18n (`src/i18n/locales/en.ts` con diccionario base, `src/i18n/types.ts`, y `src/i18n/useTranslation.ts`). El inicializador debe tomar síncronamente el idioma del sistema (`navigator.language`) y aplicar un fallback obligatorio a 'en' si el idioma no está soportado, evitando claves indefinidas.
8. El archivo `src/platform/PlatformService.ts` con la definición de la interfaz completa del SDK (initialize, saveData, loadData, submitScore, getLanguage, showRewardedVideoAd, muteAudio, onPause, onResume) junto con su clase factoría (`PlatformFactory`) que inyecte la estrategia según la variable de entorno.
9. La implementación `src/platform/MemoryPlatform.ts` (métodos asíncronos resuelven promesas vacías, showRewardedVideoAd devuelve true). Debe persistir datos en `sessionStorage`. Para pruebas locales de ciclo de vida, debe simular onPause/onResume mediante la Page Visibility API (`visibilitychange`) y exponer globalmente en window las funciones `__SIMULATE_YT_PAUSE__` y `__SIMULATE_YT_RESUME__` en entorno de desarrollo.
10. El módulo `src/audio/ProceduralAudioEngine.ts` para música generativa infinita (Web Audio API) basado en un seed numérico (usar algoritmo LCG simple para bucles de notas/acordes). Debe incluir start(seed), stop() y setMute(isMuted). El método stop() debe cerrar y destruir el AudioContext estrictamente para evitar fugas de memoria en Hot Reloads.
11. El componente `src/App.tsx` con fondo gris oscuro (`bg-slate-900`) y layout fluido e inmune a rotaciones (`w-screen h-screen overflow-hidden flex flex-col justify-center items-center gap-6`). Debe mostrar un logo del juego 'PLATES' diseñado mediante un componente SVG inline dinámico con clases Tailwind. Mostrará un botón central (texto consumido desde i18n mediante `t()`) que al pulsar inicialice la plataforma y arranque de forma segura el motor de audio con un seed aleatorio. Debe escuchar los eventos de pausa/reanudación de la plataforma para silenciar/activar el motor, y limpiar el audio al desmontarse.

---

La Fase 1 ha sido un éxito, el ZIP carga perfectamente en el entorno de YouTube. Ahora vamos a la Fase 2: Diseñar el flujo de pantallas y la navegación virtual.
Actúa como Analista y diseña un documento para /doc/navigation-flow.md donde listemos todas las pantallas del juego (Splash/Menu, Normal Mode, Travel Mode, Remote Mode, Leaderboards, Settings). Detalla la máquina de estados de navegación en React y cómo gestionaremos el routing mediante un estado simple, asegurando que un refresco de pantalla no rompa el ciclo de vida del SDK.

---

Claude, vamos a programar la pantalla de Menú Principal (MainMenu.tsx) basándonos en el flujo que diseñamos. Haz la maquetación en Tailwind con un estilo limpio y minimalista, usando los textos del sistema i18n que tenemos en las specs.

---

Validado. Ahora vamos a por la lógica del temporizador de la pantalla de juego...