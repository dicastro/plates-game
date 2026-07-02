import type { TranslationSchema } from "../types";

const es: TranslationSchema = {
  app: {
    title: "PLATES",
    tagline: "El juego de palabras con matrículas",
  },
  home: {
    play: "Jugar",
    friends: "Amigos",
    leaderboard: "Ranking"
  },
  hud: {
    mute: "Silenciar",
    unmute: "Activar sonido",
    settingsUnavailable: "Ajustes (aún no disponible)",
    whatsNewUnavailable: "Novedades (aún no disponible)",
  },
  viewport: {
    rotateTitle: "Rota tu dispositivo",
    rotateBody: "Tu pantalla necesita más espacio vertical para jugar cómodamente. Prueba a girar a vertical.",
    unsupportedTitle: "Pantalla demasiado pequeña",
    unsupportedBody: "Tu dispositivo no tiene suficiente espacio ahora mismo para una buena experiencia. Hemos tomado nota.",
  },
  game: {
    normal: {
      bestToday: "Mejor hoy",
      noValidWordYet: "Aún sin palabra válida",
      bonusBadge: "×2 bonus",
      tryAWord: "Probar palabra",
      submitAriaLabel: "Enviar palabra",
      closeAriaLabel: "Cerrar teclado",
      backspaceAriaLabel: "Retroceso",
      checkingDictionary: "Comprobando el diccionario…",
      newBestTitle: "¡Nuevo mejor de hoy!",
      shareResult: "Compartir este resultado",
      continueButton: "Continuar",
      validNotBestTitle: "Palabra válida",
      stillTodaysBestLine: "(el mejor de hoy sigue siendo {{score}} puntos)",
      shareChallenge: "Compartir mi mejor resultado · reta a un amigo",
      tryAgain: "Intentar de nuevo",
      notInDictionaryTitle: "No está en el diccionario",
      attemptsLeftOne: "Te queda {{count}} intento hoy — ¡sigue intentando!",
      attemptsLeftOther: "Te quedan {{count}} intentos hoy — ¡sigue intentando!",
      submitErrorTitle: "Algo ha ido mal",
      submitErrorBody: "No hemos podido comprobar tu palabra ahora mismo. Inténtalo de nuevo en un momento.",
      attemptsDetailTitle: "Intentos de hoy",
      attemptsDetailBody: "Cada fila es una palabra enviada y su resultado. Solo la palabra válida con mayor puntuación cuenta para el mejor resultado de hoy.",
      bonusInfoTitle: "Bonus y dificultad de la matrícula",
      rulesTitle: "Cómo jugar",
      rulesBody: "Encuentra la palabra más corta que contenga las 3 consonantes de la matrícula, en orden. Las palabras más cortas puntúan más. Tienes {{limit}} intentos al día; solo cuenta tu mejor palabra válida. Los fallos nunca restan puntos.",
      dontShowAgain: "No volver a mostrar",
      gotIt: "Entendido",
      newPlateIn: "Nueva matrícula en {{time}}",
      comeBackTomorrow: "Vuelve mañana para una nueva matrícula",
      watchAdForExtraAttempt: "Ver un anuncio para 1 intento extra",
      helpAriaLabel: "Cómo jugar",
      points: "puntos",
      pointsSuffix: "pts",
      exitAriaLabel: "Salir al inicio",
      noAttemptsYetBody: "Todavía no has enviado ninguna palabra hoy.",
      noAttemptsLeftBody: "No te quedan más intentos hoy — vuelve mañana para una nueva matrícula.",
      scrollToStart: "Ir al principio",
      scrollToEnd: "Desplazar al final",
    },
  },
};

export default es;