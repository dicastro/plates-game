La Fase 1 ha sido un éxito, el ZIP carga perfectamente en el entorno de YouTube. Ahora vamos a la Fase 2: Diseñar el flujo de pantallas y la navegación virtual.
Actúa como Analista y diseña un documento para /doc/navigation-flow.md donde listemos todas las pantallas del juego (Splash/Menu, Normal Mode, Travel Mode, Remote Mode, Leaderboards, Settings). Detalla la máquina de estados de navegación en React y cómo gestionaremos el routing mediante un estado simple, asegurando que un refresco de pantalla no rompa el ciclo de vida del SDK.

---

Claude, vamos a programar la pantalla de Menú Principal (MainMenu.tsx) basándonos en el flujo que diseñamos. Haz la maquetación en Tailwind con un estilo limpio y minimalista, usando los textos del sistema i18n que tenemos en las specs.

---

Validado. Ahora vamos a por la lógica del temporizador de la pantalla de juego...