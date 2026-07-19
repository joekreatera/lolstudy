/**
 * Neutral Latin American Spanish copy.
 *
 * Typed as `ContentBundle`, so `tsc` rejects this file if any key from `en.ts`
 * is missing, misspelled, or given the wrong helper signature.
 *
 * Conventions, matching how the client and its players actually read:
 *   - Official tier names (Iron … Challenger) stay in English — proper nouns.
 *   - CS, K/D/A, LP, Solo/Duo and Flex stay as-is; they are universal.
 *   - Role names keep the terms LatAm players use (Top, Jungla, Mid, Bot,
 *     Support) rather than literal translations.
 *   - W/L becomes V/D (victorias/derrotas), which is the standard Spanish
 *     shorthand and is not one of the abbreviations kept in English.
 * The consent text is a meaning-for-meaning translation: no guarantee, claim,
 * or obligation exists here that is not already in the English source.
 */

import { CASES_PER_PARTICIPANT, type ContentBundle } from './en.ts';

export const es: ContentBundle = {
  documentTitle: 'Encuesta de predicción de LoL',
  htmlLang: 'es',

  language: {
    switcherLabel: 'Idioma',
    names: { en: 'Inglés', es: 'Español' },
    short: { en: 'EN', es: 'ES' },
  },

  consent: {
    title: 'Antes de comenzar',
    paragraphs: [
      'Este es un estudio de investigación universitaria sobre predecir el resultado de partidas de League of Legends a partir de información parcial de la partida.',
      'La participación es completamente voluntaria y tus respuestas son anónimas. No recopilamos ninguna información de tu cuenta de Riot.',
      `La encuesta contiene ${CASES_PER_PARTICIPANT} casos de predicción y toma entre 5 y 10 minutos.`,
      'Puedes detenerte en cualquier momento cerrando la página.',
    ],
    checkboxLabel: 'He leído la información y acepto participar.',
    continueLabel: 'Continuar',
  },

  instructions: {
    title: 'Cómo funciona la encuesta',
    paragraphs: [
      `Verás ${CASES_PER_PARTICIPANT} estados de partida parciales. Cada caso proviene de una partida distinta.`,
      'Cada caso es una instantánea de la partida en un minuto específico. Basándote únicamente en lo que ves, predice si el Equipo azul o el Equipo rojo ganará la partida.',
      'No se indica si acertaste mientras respondes. Después de enviar correctamente las diez predicciones, se muestra un resumen final de resultados.',
      'Una vez que confirmas una respuesta y avanzas, ya no se puede cambiar.',
    ],
    mayIncludeIntro: 'Cada caso puede mostrar información como:',
    mayInclude: [
      'estadísticas de jugadores',
      'estadísticas de equipo',
      'objetivos',
      'objetos',
      'información de eventos',
    ],
    reconstructionNote:
      'Los inventarios de objetos se reconstruyen a partir de los datos de la partida y ocasionalmente pueden ser ligeramente imprecisos.',
    startLabel: 'Comenzar encuesta',
    loadingLabel: 'Preparando la encuesta…',
    loadErrorLabel:
      'No pudimos cargar la encuesta en este momento. Inténtalo de nuevo más tarde.',
  },

  participant: {
    title: 'Algunas preguntas sobre ti',
    submitLabel: 'Continuar',
    questions: {
      rank: '¿Cuál es tu rango actual o más reciente en League of Legends?',
      years_playing: '¿Cuánto tiempo llevas jugando League of Legends?',
      main_role: '¿Cuál es tu rol principal?',
      playing_frequency:
        '¿Con qué frecuencia juegas League of Legends actualmente?',
      region:
        '¿En qué región/servidor juegas principalmente League of Legends?',
    },
    options: {
      rank: {
        unranked: 'Sin clasificación',
        iron: 'Iron',
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
        emerald: 'Emerald',
        diamond: 'Diamond',
        master: 'Master',
        grandmaster: 'Grandmaster',
        challenger: 'Challenger',
      },
      years_playing: {
        lt_1y: 'Menos de 1 año',
        '1_2y': '1–2 años',
        '3_5y': '3–5 años',
        '6_9y': '6–9 años',
        '10y_plus': '10 años o más',
      },
      main_role: {
        top: 'Top',
        jungle: 'Jungla',
        mid: 'Mid',
        bot: 'Bot / ADC',
        support: 'Support',
        fill: 'Fill / Sin rol principal',
      },
      playing_frequency: {
        lt_monthly: 'Menos de una vez al mes',
        few_monthly: 'Algunas veces al mes',
        weekly: 'Aproximadamente una vez por semana',
        '2_4_weekly': '2–4 días por semana',
        '5_plus_weekly': '5 o más días por semana',
      },
      region: {
        na: 'Norteamérica (NA)',
        euw: 'Europa Oeste (EUW)',
        eune: 'Europa Nórdica y del Este (EUNE)',
        kr: 'Corea (KR)',
        br: 'Brasil (BR)',
        latam: 'Latinoamérica (LAN / LAS)',
        oce: 'Oceanía (OCE)',
        tr: 'Türkiye (TR)',
        ru: 'Rusia (RU)',
        jp: 'Japón (JP)',
        sea: 'Sudeste Asiático (SG / PH / TH / VN / TW)',
        me: 'Medio Oriente (ME)',
        other: 'Otra',
        prefer_not_to_say: 'Prefiero no decirlo',
      },
    },
  },

  survey: {
    progressLabel: (current: number, total: number) =>
      `Pregunta ${current} de ${total}`,
    cutoffLabel: (minute: number) =>
      `Estado de la partida en el minuto ${minute}`,
    winnerQuestion: '¿Qué equipo ganará esta partida?',
    confidenceQuestion: '¿Qué tan seguro estás?',
    confirmLabel: 'Confirmar y continuar',
    confirmFinalLabel: 'Confirmar y finalizar',
    winnerLabels: { blue: 'Equipo azul', red: 'Equipo rojo' },
    confidenceLabels: {
      1: '1 — Muy inseguro',
      2: '2',
      3: '3 — Algo seguro',
      4: '4',
      5: '5 — Muy seguro',
    },
    confidenceLowHint: '1 — Muy inseguro',
    confidenceHighHint: '5 — Muy seguro',
  },

  finished: {
    title: 'Gracias',
    paragraphs: [
      'Tus respuestas han sido registradas. Gracias por participar en este estudio.',
      'Ya puedes cerrar esta página.',
    ],
    submittingLabel: 'Guardando tus respuestas…',
    errorTitle: 'No se pudieron guardar tus respuestas',
    errorHelp:
      'Tus respuestas siguen en esta página. Inténtalo de nuevo — no cierres esta pestaña.',
    retryLabel: 'Intentar de nuevo',
    resultsTitle: 'Tus resultados',
    breakdownTitle: 'Desglose por pregunta',
    correctLabel: 'Correcta',
    incorrectLabel: 'Incorrecta',
    scoreSummary: (correct: number, incorrect: number) =>
      `${correct} correctas · ${incorrect} incorrectas`,
    questionLabel: (n: number) => `Pregunta ${n}`,
    minuteLabel: (minute: number) => `${minute} min`,
    predictionLabel: 'Predicción',
    winnerLabel: 'Ganador',
    rowAccessibleLabel: (
      n: number,
      predicted: string,
      winner: string,
      correct: boolean
    ) =>
      `Pregunta ${n}: predijiste ${predicted}, ganó ${winner}. ` +
      `${correct ? 'Correcta' : 'Incorrecta'}.`,
  },

  snapshot: {
    gameStateLabel: 'Estado de la partida',
    teamOverviewTitle: 'Comparación de equipos',
    laneMatchupsTitle: 'Enfrentamientos por línea',
    killMapTitle: 'Mapa de asesinatos',
    eventTimelineTitle: 'Línea de tiempo de eventos',
    mapAndTimelineTitle: 'Mapa de asesinatos y línea de tiempo',
    blueTeamLabel: 'Equipo azul',
    redTeamLabel: 'Equipo rojo',
    versusLabel: 'VS',
    deltaExplanation: 'Δ = Azul − Rojo',
    firstObjectivesTitle: 'Primeros objetivos',
    firstBloodLabel: 'Primera sangre',
    firstTowerLabel: 'Primera torre',
    firstDragonLabel: 'Primer dragón',
    objectivesTitle: 'Objetivos',
    noneOwnerLabel: '—',
    noItemsLabel: 'Sin objetos',
    noEventsLabel: 'No se registraron eventos hasta este minuto.',
    playerUnavailableLabel: 'Datos del jugador no disponibles',
    killMapLegendBlue: '● Asesinato del equipo azul',
    killMapLegendRed: '◆ Asesinato del equipo rojo',
    predictionTitle: 'Tu predicción',
    assistsLabel: 'Asistencias',
    eventSummary: (count: number, clock: string) =>
      `${count} ${count === 1 ? 'evento' : 'eventos'} hasta ${clock}`,
    patchLabel: 'Parche',

    metrics: {
      gold: 'Oro',
      kda: 'K / D / A',
      kdaSrLabel: 'Asesinatos, muertes, asistencias',
      cs: 'CS',
      csSrLabel: 'Puntuación de súbditos',
      avgLevel: 'Nivel prom.',
      avgLevelSrLabel: 'Nivel promedio',
      level: 'Nivel',
      kdaInlineSrLabel: 'asesinatos, muertes, asistencias',
    },

    objectives: {
      towers: 'Torres',
      inhibitors: 'Inhibidores',
      dragons: 'Dragones',
      heralds: 'Heraldos',
      barons: 'Barones',
    },

    roles: {
      TOP: 'Top',
      JUNGLE: 'Jungla',
      MIDDLE: 'Mid',
      BOTTOM: 'Bot',
      UTILITY: 'Support',
    },

    rank: {
      unavailable: 'Rango no disponible',
      unranked: 'Sin clasificación',
      wins: 'V',
      losses: 'D',
    },

    itemGoldSuffix: 'oro',
  },
};
