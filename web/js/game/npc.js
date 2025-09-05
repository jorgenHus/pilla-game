// SMØR - NPC-klasse (konvertert fra game/npc.py)

class NPC {
  constructor(name, effects = {}, displayText = "") {
    this.name = name;
    this.effects = effects;
    this.displayText = displayText;
  }

  async applyEffects(player, gameEngine = null) {
    // Bruk NPC-effekter på spilleren når de hentes
    if (this.effects.promille_bonus) {
      player.addPromille(this.effects.promille_bonus);
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får ${this.effects.promille_bonus} ekstra promille fra ${this.name}!`,
          "info"
        );
      }
    }

    if (this.effects.promille_penalty) {
      player.addPromille(this.effects.promille_penalty);
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får ${this.effects.promille_penalty} promille fra ${this.name}!`,
          "info"
        );
      }
    }

    if (this.effects.memory_bonus) {
      player.addMemory(this.effects.memory_bonus);
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får ${this.effects.memory_bonus} minnepoeng fra ${this.name}!`,
          "info"
        );
      }
    }
  }

  async applyCardEffects(player, cardName) {
    // Bruk NPC-effekter når kort spilles
    if (
      this.effects.double_beer &&
      ["drinkBeer", "drinkDrink"].includes(cardName)
    ) {
      player.addPromille(0.5); // Doble øl/drink-effekten
      await gameEngine.addToLog(
        `${this.name} dobler ${cardName.toLowerCase()}-effekten for ${
          player.name
        }!`,
        "info"
      );
    }

    // Sjefen sin spesialeffekt for "Kjenner dere ølet!"
    if (this.effects.enhance_know_beer && cardName === "Kjenner dere ølet!") {
      await gameEngine.addToLog(
        `${this.name} forsterker effekten av 'Kjenner dere ølet!'!`,
        "info"
      );
      return "enhanced_know_beer"; // Signal til GameEngine om forsterket effekt
    }

    return null;
  }
}
