// SMØR - Player Turn Logic (extracted from engine.js)

class PlayerTurns {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  async checkPromilleEffects(player) {
    // Find highest and lowest promille among all players
    const allPlayers = this.gameEngine.players;
    const promilleValues = allPlayers.map((p) => p.promille);
    const highestPromille = Math.max(...promilleValues);
    const lowestPromille = Math.min(...promilleValues);

    // Check if current player has highest promille (leader jersey)
    if (player.promille === highestPromille && highestPromille > 0) {
      // Check if multiple players have the same highest promille
      const playersWithHighest = allPlayers.filter(
        (p) => p.promille === highestPromille
      );
      if (playersWithHighest.length === 1) {
        // Only one player has highest promille - give leader jersey
        player.addMemory(2);
        await this.gameEngine.addToLog(
          `🏆 ${player.name} har høyest promille (${player.promille}%) og får ledertrøya! (+2 minnepoeng)`,
          "success"
        );
      }
    }

    // Check if current player has lowest promille (pill)
    if (player.promille === lowestPromille) {
      // Check if multiple players have the same lowest promille
      const playersWithLowest = allPlayers.filter(
        (p) => p.promille === lowestPromille
      );
      if (playersWithLowest.length === 1) {
        // Only one player has lowest promille - give pill penalty
        // Only give pill if current player doesn't already have it
        if (!player.hasPill) {
          // First remove pill effects from ALL other players
          for (const p of allPlayers) {
            if (p.hasPill && p !== player) {
              p.addDiceBonus(1); // Remove pill penalty
              p.hasPill = false;
              await this.gameEngine.addToLog(
                `💊 ${p.name} mister pilla-effekten!`,
                "info"
              );
            }
          }

          // Then give pill to current player
          player.addDiceBonus(-1);
          player.hasPill = true;
          await this.gameEngine.addToLog(
            `💊 ${player.name} har lavest promille (${player.promille}%). Er du på pilla eller? (-1 ferdighetskast)`,
            "error"
          );
        }
      }
    }
  }

  async playerTurn(player) {
    // Refill NPCs to ensure there are always 3 available
    this.gameEngine.refillNpcs();

    // Match Python logic exactly - show turn first
    await this.gameEngine.addToLog(
      `🎮 ${player.name.toUpperCase()} SIN TUR`,
      "turn"
    );

    // Check turn-start effects FIRST
    for (const npc of player.npcs) {
      if (npc.effects.turn_start_promille) {
        const promilleBonus = npc.effects.turn_start_promille;
        player.addPromille(promilleBonus);
        await this.gameEngine.addToLog(
          `👼 ${npc.name} gir ${promilleBonus} promille ved starten av turen!`,
          "info"
        );
      }
      if (npc.effects.turn_start_memory) {
        const memoryBonus = npc.effects.turn_start_memory;
        player.addMemory(memoryBonus);
        await this.gameEngine.addToLog(
          `🧠 ${npc.name} gir ${memoryBonus} minnepoeng ved starten av turen!`,
          "info"
        );
      }
    }

    // Check for leader jersey and pill effects AFTER NPC bonuses
    await this.checkPromilleEffects(player);

    // Check rescue roll if player has 4+ promille
    if (!(await this.checkRescueRoll(player))) {
      return; // Player vomited and turn is over
    }

    // Check NPC turn effects
    if (!(await this.checkNpcTurnEffects(player))) {
      return; // Player must skip round
    }

    // Show all player info (match Python exactly)
    this.showPlayerTurnInfo(player);
    this.gameEngine.updateGameDisplay();

    this.waitForHumanAction(player);
  }

  async checkRescueRoll(player) {
    // Match Python logic exactly
    let rescueThreshold = 5; // Standard (ny kapp)
    let diceTarget = 4; // Standard terningkrav

    // Herslebs Nach-effekt: redningskast ved 4 promille (ny kapp)
    if (
      this.gameEngine.currentPlace.name === "Herslebs" &&
      this.gameEngine.currentPhase === "Nach" &&
      this.gameEngine.currentPlace.effects.nach_rescue_threshold
    ) {
      rescueThreshold = 4; // Herslebs Nach: 4 promille
      diceTarget = 3; // Herslebs Nach: terningkrav 3
    }

    if (player.promille >= rescueThreshold) {
      await this.gameEngine.addToLog(
        `🤮 ${player.name} har ${player.promille} promille og trenger redningskast!`,
        "warning"
      );
      await this.gameEngine.addToLog(
        `Du må kaste ${diceTarget} eller høyere for å unngå å kaste opp!`,
        "info"
      );
      await this.gameEngine.delay(1000);

      // Roll dice for rescue
      if (
        await this.gameEngine.diceRoller.rollSkillDiceModal(
          player,
          diceTarget,
          "redningskast"
        )
      ) {
        await this.gameEngine.addToLog(
          `✅ ${player.name} klarer redningskastet og kan spille videre!`,
          "success"
        );
        return true;
      } else {
        await this.gameEngine.addToLog(
          `❌ ${player.name} kaster opp!`,
          "error"
        );
        await this.gameEngine.handleVomiting(player);
        return false; // Turn is over
      }
    }
    return true; // No rescue roll needed
  }

  async checkNpcTurnEffects(player) {
    // Match Python logic exactly
    for (const npc of player.npcs) {
      if (npc.effects.dring_effect) {
        return await this.handleDringEffect(player, npc);
      }
    }
    return true; // No NPC effects that block the turn
  }

  async handleDringEffect(player, dringNpc) {
    // Match Python logic exactly
    await this.gameEngine.addToLog(`🍺 ${player.name} er dringa!`, "warning");
    await this.gameEngine.addToLog(
      `Du må kaste 3 eller høyere for å kunne spille denne runden!`,
      "info"
    );
    await this.gameEngine.delay(1000);

    // Roll dice
    if (
      await this.gameEngine.diceRoller.rollSkillDiceModal(
        player,
        3,
        "å kunne spille"
      )
    ) {
      await this.gameEngine.addToLog(
        `✅ ${player.name} kan spille denne runden!`,
        "success"
      );
      return true;
    } else {
      await this.gameEngine.addToLog(
        `❌ ${player.name} må stå over runden!`,
        "error"
      );
      await this.gameEngine.addToLog(
        `Du må kaste bort et kort uten å få effekt av det.`,
        "info"
      );

      // Discard a card without effect
      if (player.hand.length > 0) {
        if (player.isHuman) {
          // Use non-closable modal for dring effect
          const modalContent = `
            <p><strong>Du må kaste et kort uten effekt:</strong></p>
            <div class="cards">
                ${player.hand
                  .map(
                    (card, index) => `
                    <div class="card" onclick="selectCardForDringDiscard(${index})">
                        <div class="card-name">${card.name}</div>
                        <div class="card-description">${card.displayText}</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
          `;

          // Set up state for dring discard
          this.gameEngine.dringDiscardPlayer = player;
          this.gameEngine.waitingForDringDiscard = true;

          showNonClosableModal("Du er dringa - Kast et kort", modalContent);

          // Wait for player to select a card
          while (this.gameEngine.waitingForDringDiscard) {
            await this.gameEngine.delay(100);
          }
        } else {
          const cardIndex = Math.floor(Math.random() * player.hand.length);
          const discardedCard = player.hand.splice(cardIndex, 1)[0];
          await this.gameEngine.addToLog(
            `🗑️ ${player.name} kaster ${discardedCard.name} uten effekt!`,
            "info"
          );
        }
      }
      return false; // Turn is over
    }
  }

  waitForHumanAction(player) {
    // Set current player and wait for card selection
    this.gameEngine.currentPlayerIndex =
      this.gameEngine.players.indexOf(player);
    this.gameEngine.updateGameDisplay();
    // No need to show waiting message - it's clear from the UI

    // Set a flag to indicate we're waiting for human input
    this.gameEngine.waitingForHumanInput = true;
  }

  showPlayerTurnInfo(player) {
    // No need to show turn info in log - it's shown in the hand panel
  }
}
