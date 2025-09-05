// SMØR - Deck-funksjoner (konvertert fra game/deck.py)

function createDeck() {
  // Lag en enkel demo-deck med kort og effektfunksjoner
  const deck = [];

  // Legg til kopier av hvert kort fra CARDS_DATA basert på count-feltet
  for (const cardData of CARDS_DATA) {
    const count = cardData.count !== undefined ? cardData.count : 5; // Bruk count eller default 5
    console.log(`Kort: ${cardData.name} - count: ${count}`);
    for (let i = 0; i < count; i++) {
      deck.push(
        new Card(
          cardData.name,
          cardData.promille_change,
          cardData.minne_change,
          cardData.special_effect,
          cardData.displayText,
          cardData.idName,
          cardData.onlyName,
          cardData.icon,
          cardData.shortEffect
        )
      );
    }
  }

  console.log(`Totalt antall kort i deck: ${deck.length}`);
  // Bland kortstokken
  shuffleArray(deck);
  return deck;
}

function shuffleArray(array) {
  // Fisher-Yates shuffle algoritme
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function drawCards(deck, num = 2) {
  // Trekk kort fra kortstokken
  const drawn = [];
  for (let i = 0; i < num; i++) {
    if (deck.length > 0) {
      drawn.push(deck.pop());
    } else {
      // Hvis kortstokken er tom, bland den på nytt
      const newDeck = createDeck();
      deck.push(...newDeck);
      if (deck.length > 0) {
        drawn.push(deck.pop());
      }
    }
  }
  return drawn;
}

function drawFullHand(deck) {
  // Felles metode for å trekke full hånd - enkelt å justere senere
  return drawCards(deck, 5); // Endret til 5 kort
}
