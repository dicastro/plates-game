Vamos a empezar con la Fase 1 del proyecto: crear el esqueleto mínimo (Hello World). Necesito que me proporciones la estructura básica de archivos de un proyecto Vite + React + TypeScript + Tailwind CSS. Proporcióname:

1. El `package.json` con las dependencias mínimas necesarias (incluyendo los plugins de ofuscación y zip).
1. El `vite.config.ts` configurado según nuestras especificaciones.
1. Un componente `App.tsx` ultra-simple que solo renderice una pantalla de un solo color (por ejemplo, un fondo gris oscuro `bg-slate-900`) con un texto centrado que diga 'PLATES - Ready to Test'.
1. Asegúrate de añadir el fallback seguro por si `window.ytgame` no está inicializado en local.

---

La Fase 1 ha sido un éxito, el ZIP carga perfectamente en el entorno de YouTube. Ahora vamos a la Fase 2: Diseñar el flujo de pantallas y la navegación virtual.
Actúa como Analista y diseña un documento para /doc/navigation-flow.md donde listemos todas las pantallas del juego (Splash/Menu, Normal Mode, Travel Mode, Remote Mode, Leaderboards, Settings). Detalla la máquina de estados de navegación en React y cómo gestionaremos el routing mediante un estado simple, asegurando que un refresco de pantalla no rompa el ciclo de vida del SDK.

---

Claude, vamos a programar la pantalla de Menú Principal (MainMenu.tsx) basándonos en el flujo que diseñamos. Haz la maquetación en Tailwind con un estilo limpio y minimalista, usando los textos del sistema i18n que tenemos en las specs.

---

Validado. Ahora vamos a por la lógica del temporizador de la pantalla de juego...