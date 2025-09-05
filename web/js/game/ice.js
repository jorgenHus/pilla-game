// SMØR - Ice'ing Module
// Handles all ice'ing logic and UI

class IceHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  async handleIcing(player) {
    await this.gameEngine.addToLog(
      `🧊 ${player.name} spiller Ice'ing!`,
      "info"
    );
    await this.gameEngine.addToLog(
      "Alle spillere kaster terning. De som matcher må chugge ice!",
      "info"
    );

    // Don't set flags here - let card.play() handle the flow

    // Player rolls first (pure d6, no bonuses)
    const playerRoll = await this.showIceDiceModal(
      player,
      "Jeg skal bare ta en tur på do jeg"
    );

    // Log the first roll
    await this.gameEngine.addToLog(
      `🎲 ${player.name} kastet: ${playerRoll}`,
      "info"
    );

    // All other players roll (pure d6, no bonuses)
    let matches = 0;
    for (const otherPlayer of this.gameEngine.players) {
      if (otherPlayer !== player) {
        const minTarget = Math.max(1, playerRoll - 1);
        const maxTarget = Math.min(6, playerRoll + 1);
        const otherRoll = await this.showIceDiceModal(
          otherPlayer,
          `Ice'en ligger mellom ${minTarget} og ${maxTarget}`
        );

        // Log the roll
        await this.gameEngine.addToLog(
          `🎲 ${otherPlayer.name} kastet: ${otherRoll}`,
          "info"
        );

        if (Math.abs(otherRoll - playerRoll) <= 2) {
          await this.gameEngine.addToLog(
            `🧊 ${otherPlayer.name} fant icen! Må chugge!`,
            "success"
          );

          // Handle ice chugging directly (without playing the full card)
          console.log(
            `🔍 [DEBUG] About to call handleIceChug for ${otherPlayer.name} in ice.js`
          );
          const success = await this.gameEngine.handleIceChug(otherPlayer);
          console.log(
            `🔍 [DEBUG] handleIceChug returned: ${success} for ${otherPlayer.name} in ice.js`
          );

          // Give ice effect regardless of chugging success
          otherPlayer.addPromille(0.5);
          otherPlayer.lastDrinkCard = "drinkIce";
          otherPlayer.lastCardPromille = 0.5;

          // Apply place effects
          await this.gameEngine.currentPlace.applyPhaseEffect(
            otherPlayer,
            this.gameEngine.currentPhase,
            this.gameEngine
          );

          matches++;
        } else {
          await this.gameEngine.addToLog(
            `😔 ${otherPlayer.name} har ikke auga med seg.`,
            "info"
          );
        }
      }
    }

    // Player gets memory points based on number of matches (no penalty if no matches)
    if (matches > 0) {
      await this.gameEngine.addToLog(
        `🎉 ${player.name} får ${matches} minnepoeng fordi ${matches} spillere matchet!`,
        "success"
      );
      player.addMemory(matches);
    } else {
      await this.gameEngine.addToLog(
        `😔 Ingen fant ice'n til ${player.name}.`,
        "info"
      );
    }

    await this.gameEngine.delay(1000);
  }

  // Show ice dice modal and wait for player to close it
  async showIceDiceModal(player, description) {
    // Use the new random dice modal for ice'ing
    return this.gameEngine.diceRoller.rollRandomDiceModal(player, 1, "ice'ing");
  }
}

// Make IceHandler globally available
window.IceHandler = IceHandler;
