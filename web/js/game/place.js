// SMØR - Place-klasse (konvertert fra game/place.py)

class Place {
  constructor(
    name,
    effects = {},
    displayText = "",
    effectDescriptions = {},
    hasBouncer = false
  ) {
    this.name = name;
    this.effects = effects;
    this.displayText = displayText;
    this.effectDescriptions = effectDescriptions;
    this.hasBouncer = hasBouncer;
  }

  async applyRoundStart(player, gameEngine = null) {
    if (this.effects.memory_bonus) {
      player.addMemory(this.effects.memory_bonus);
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får ${this.effects.memory_bonus} minnepoeng fra ${this.name}.`,
          "info"
        );
      }
    }

    if (this.effects.promille_reduction) {
      const reduction = this.effects.promille_reduction;
      player.addPromille(-reduction);
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får ${reduction} mindre promille på grunn av ${this.name}.`,
          "info"
        );
      }
    }
  }

  async applyPhaseEffect(player, currentPhase = null, gameEngine = null) {
    if (this.effects.beer_double && player.lastDrinkCard === "drinkBeer") {
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får dobbel promille på øl-kortet på grunn av ${this.name}!`,
          "info"
        );
      }
      player.addPromille(player.lastCardPromille);
    }

    // Oslo Plaza effekt: øl-kort telles som drink-kort (0.5% 1m)
    if (this.effects.beer_as_drink && player.lastDrinkCard === "drinkBeer") {
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får drink-effekt på øl-kortet på grunn av ${this.name}!`,
          "info"
        );
      }
      // Øl gir normalt 0.5% promille, drink gir 0.5% promille + 1 minnepoeng
      // Så vi legger til 1 minnepoeng (som drink-kortet ville gitt)
      player.addMemory(1); // 1 minnepoeng
    }

    // Herslebs Vors-effekt: +0.5 bonus på promille-kort
    if (
      this.effects.vors_promille_bonus &&
      currentPhase === "Vors" &&
      player.lastCardPromille > 0
    ) {
      const bonus = this.effects.vors_promille_bonus;
      if (gameEngine) {
        await gameEngine.addToLog(
          `${player.name} får ${bonus} ekstra promille på grunn av ${this.name} (Vors)!`,
          "info"
        );
      }
      player.addPromille(bonus);
    }
  }
}
