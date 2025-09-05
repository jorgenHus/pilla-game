// SMØR - Game Flow Logic (extracted from engine.js)

class GameFlow {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  async startGame() {
    if (this.gameEngine.isProcessing) return;
    this.gameEngine.isProcessing = true;

    await this.gameEngine.addToLog("Spillet starter!", "success");

    // Setup NPCs
    await this.gameEngine.addToLog("Setter opp NPC-er...", "info");
    this.gameEngine.setupNpcs(this.gameEngine.npcsData);
    await this.gameEngine.delay(500);

    // Run all phases (match Python exactly)
    for (let i = 0; i < this.gameEngine.phases.length; i++) {
      const phase = this.gameEngine.phases[i];
      await this.playPhase(phase);

      // Show phase transition (not after last phase)
      if (i < this.gameEngine.phases.length - 1) {
        await this.gameEngine.showPhaseTransition(
          phase,
          this.gameEngine.phases[i + 1]
        );
      }
    }

    // Show final result
    await this.gameEngine.endGame();

    this.gameEngine.isProcessing = false;
  }

  async playPhase(phase) {
    this.gameEngine.currentPhase = phase;

    // Choose random place
    const randomIndex = Math.floor(
      Math.random() * this.gameEngine.places.length
    );
    this.gameEngine.currentPlace = this.gameEngine.places[randomIndex];

    await await this.gameEngine.addToLogWithTypewriter(
      `🎯 FASE: ${phase}`,
      "info"
    );
    await await this.gameEngine.addToLogWithTypewriter(
      `📍 Sted: ${this.gameEngine.currentPlace.name}`,
      "info"
    );

    // Show place description
    if (this.gameEngine.currentPlace.displayText) {
      await await this.gameEngine.addToLogWithTypewriter(
        `📖 ${this.gameEngine.currentPlace.displayText}`,
        "info"
      );
    }

    // Show place effects
    if (this.gameEngine.currentPlace.effectDescriptions) {
      const effects = Object.values(
        this.gameEngine.currentPlace.effectDescriptions
      );
      if (effects.length > 0) {
        await await this.gameEngine.addToLogWithTypewriter(
          `⚡ ${effects.join(", ")}`,
          "info"
        );
      }
    }

    // Handle bouncer if this is first time at place (but never in Vors phase)
    if (
      this.gameEngine.currentPlace.hasBouncer &&
      !this.gameEngine.visitedPlaces.has(this.gameEngine.currentPlace.name) &&
      this.gameEngine.currentPhase !== "Vors"
    ) {
      await this.gameEngine.handleBouncer();
    }

    // Mark place as visited
    this.gameEngine.visitedPlaces.add(this.gameEngine.currentPlace.name);

    // Give all active players 2 new cards
    for (const player of this.gameEngine.players) {
      if (player.status === "active") {
        await await this.gameEngine.addToLogWithTypewriter(
          `Gir ${player.name} 2 kort...`,
          "info"
        );
        player.hand = drawFullHand(this.gameEngine.deck);
        await this.gameEngine.currentPlace.applyRoundStart(
          player,
          this.gameEngine
        );
      } else {
        await await this.gameEngine.addToLogWithTypewriter(
          `😢 ${player.name} er blokkert og får ingen kort denne runden.`,
          "info"
        );
      }
    }

    // Update display
    this.gameEngine.updateGameDisplay();

    // Play until all players have used their cards (match Python exactly)
    while (this.gameEngine.players.some((player) => player.hand.length > 0)) {
      for (const player of this.gameEngine.players) {
        if (player.hand.length > 0 && player.status === "active") {
          // For human players, wait for their input
          await this.gameEngine.playerTurn(player);
          // Wait for human input before continuing
          console.log(
            `🔍 [DEBUG] Starting wait loop - waitingForHumanInput: ${this.gameEngine.waitingForHumanInput}, waitingForNpcChoice: ${this.gameEngine.waitingForNpcChoice}, waitingForIcing: ${this.gameEngine.waitingForIcing}, waitingForChugChoice: ${this.gameEngine.waitingForChugChoice}`
          );
          while (
            this.gameEngine.waitingForHumanInput ||
            this.gameEngine.waitingForNpcChoice ||
            this.gameEngine.waitingForIcing ||
            this.gameEngine.waitingForChugChoice
          ) {
            await this.gameEngine.delay(100);
            console.log(
              `🔍 [DEBUG] Still waiting - waitingForHumanInput: ${this.gameEngine.waitingForHumanInput}, waitingForNpcChoice: ${this.gameEngine.waitingForNpcChoice}, waitingForIcing: ${this.gameEngine.waitingForIcing}, waitingForChugChoice: ${this.gameEngine.waitingForChugChoice}`
            );
          }
          console.log(`🔍 [DEBUG] Wait loop ended - continuing to next player`);
        }
      }
    }

    // Reset all players to active status for next phase
    for (const player of this.gameEngine.players) {
      player.status = "active";
    }
  }
}
