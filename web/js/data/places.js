// SMØR - Sted-data (100% identisk med data/places.json)

const PLACES_DATA = [
  {
    name: "Los Tacos",
    displayText: "Håper de har en god plass i solen!",
    effects: {
      beer_double: true,
      ring_friend_bonus: true,
    },
    effectDescriptions: {
      beer_double: "🍺 Ølkort teller dobbelt",
      ring_friend_bonus:
        "📞 +2 bonus på Ring en venn (Vors), +1 bonus (andre faser)",
    },
  },
  {
    name: "O'Connors",
    displayText: "Jobber honey?",
    effects: {
      memory_bonus: 1,
    },
    effectDescriptions: {
      memory_bonus: "🧠 +1 minnepoeng per runde",
    },
    hasBouncer: true,
  },
  {
    name: "Herslebs",
    displayText: "Skal virkelig kvelden ende her?",
    effects: {
      vors_promille_bonus: 0.5,
      nach_rescue_threshold: 4,
    },
    effectDescriptions: {
      vors_promille_bonus: "🍺 +0.5 bonus på alle promille-kort (Vors)",
      nach_rescue_threshold: "🎲 Redningskast ved 4 promille (Nach)",
    },
  },
  {
    name: "Oslo Plaza",
    displayText: "Det blir en sånn kveld ja...",
    effects: {
      beer_as_drink: true,
    },
    effectDescriptions: {
      beer_as_drink: "🍺 Alle øl-kort telles som drinkkort (1% 1m)",
    },
    hasBouncer: true,
  },
];
