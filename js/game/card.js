// SMØR - Card-klasse (konvertert fra game/card.py)

class Card {
  constructor(
    name,
    promilleChange = 0,
    minneChange = 0,
    specialEffect = null,
    displayText = "",
    idName = null,
    onlyName = null,
    icon = null,
    shortEffect = null
  ) {
    this.name = name;
    this.idName = idName || name; // Use idName if provided, otherwise fall back to name
    this.onlyName = onlyName || name; // Use onlyName if provided, otherwise fall back to name
    this.icon = icon || ""; // Use icon if provided, otherwise empty string
    this.shortEffect = shortEffect || ""; // Use shortEffect if provided, otherwise empty string
    this.promilleChange = promilleChange;
    this.minneChange = minneChange;
    this.specialEffect = specialEffect; // spesialeffekt som "call_friend"
    this.displayText = displayText;
  }

  async play(player, place, gameEngine = null) {
    // Håndter chugging først for øl-kort (før øl-effekten gis)
    if (this.idName === "drinkBeer" && gameEngine) {
      await gameEngine.handleBeerChug(player);
    }

    // Håndter chugging for ice-kort (før ice-effekten gis)
    if (this.idName === "drinkIce" && gameEngine) {
      await gameEngine.handleIceChug(player);
    }

    // Endre promille og minner (øl-effekten gis alltid)
    player.addPromille(this.promilleChange);
    player.addMemory(this.minneChange);
    player.lastDrinkCard = this.idName;
    player.lastCardPromille = this.promilleChange;

    // Sjekk om stedet gir ekstra effekt FØRST
    const currentPhase = gameEngine ? gameEngine.currentPhase : null;
    await place.applyPhaseEffect(player, currentPhase, gameEngine);

    if (gameEngine) {
      // Check if this beer card becomes a drink card due to place effect
      let cardNameForLog = this.name;
      if (this.idName === "drinkBeer" && place.effects.beer_as_drink) {
        cardNameForLog = "Drikk en drink";
      }

      let effectText = "";
      if (this.promilleChange !== 0) {
        effectText += `Promille: ${this.promilleChange > 0 ? "+" : ""}${
          this.promilleChange
        }%`;
      }

      // Check if this is a beer card that became a drink on Oslo Plaza
      let actualMinneChange = this.minneChange;
      if (this.idName === "drinkBeer" && place.effects.beer_as_drink) {
        actualMinneChange = 1; // Drink gives 1 memory
      }

      if (actualMinneChange !== 0) {
        if (effectText) effectText += ", ";
        effectText += `M: ${
          actualMinneChange > 0 ? "+" : ""
        }${actualMinneChange}`;
      }

      if (effectText) {
        await gameEngine.addToLog(
          `${player.name} spiller ${cardNameForLog} -> ${effectText}`,
          "info"
        );
      }
    }

    // Håndter spesialeffekter
    if (this.specialEffect === "call_friend" && gameEngine) {
      await gameEngine.addToLog(`📞 RING EN VENN`, "info");
      await gameEngine.offerNpcInteraction(player);
    } else if (this.specialEffect === "know_beer" && gameEngine) {
      // For know_beer, check NPC effects first to get enhanced effect
      let enhancedEffect = null;
      for (const npc of player.npcs) {
        const result = await npc.applyCardEffects(player, this.name);
        if (result) {
          enhancedEffect = result;
        }
      }
      await gameEngine.handleKnowBeerEffect(player, enhancedEffect);
    } else if (this.specialEffect === "bong_choice" && gameEngine) {
      await gameEngine.handleBongChoice(player);
    } else if (this.specialEffect === "round_drinks" && gameEngine) {
      await gameEngine.handleRoundDrinks(player);
    } else if (this.specialEffect === "icing" && gameEngine) {
      // Set flag to prevent main.js from setting waitingForHumanInput = false
      gameEngine.waitingForIcing = true;
      await gameEngine.handleIcing(player);
      // Set both flags to false after icing is complete
      gameEngine.waitingForIcing = false;
      gameEngine.waitingForHumanInput = false;
      return; // Exit early, special effect will handle the flow
    } else if (this.specialEffect === "call_friend" && gameEngine) {
      await gameEngine.offerNpcInteraction(player);
      // Don't set waitingForHumanInput = false here - let the special effect handle it
      return; // Exit early, special effect will handle the flow
    } else {
      // For other cards, check NPC effects after special effects
      let enhancedEffect = null;
      for (const npc of player.npcs) {
        const result = await npc.applyCardEffects(player, this.name);
        if (result) {
          enhancedEffect = result;
        }
      }
    }

    // Ensure game continues after card is fully played
    if (gameEngine) {
      gameEngine.waitingForHumanInput = false;
    }
  }
}
