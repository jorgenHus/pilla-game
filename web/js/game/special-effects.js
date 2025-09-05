// SMØR - Special Effects and NPC Interactions (extracted from engine.js)

class SpecialEffects {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  async handleVomiting(player) {
    // Match Python logic exactly
    await this.gameEngine.addToLog(
      `💀 ${player.name} mister 50% av minnepoengene sine!`,
      "error"
    );
    await this.gameEngine.addToLog(
      `🤮 ${player.name} mister 1 promille på grunn av å kaste opp!`,
      "error"
    );

    // Calculate 50% memory loss (rounded up)
    const memoryLoss = Math.ceil(player.memory * 0.5);
    player.addMemory(-memoryLoss);

    // Lose 1 promille
    player.addPromille(-1);

    await this.gameEngine.addToLog(
      `😢 ${player.name} mistet ${memoryLoss} minnepoeng og har nå ${player.memory} minnepoeng.`,
      "error"
    );

    // Player must discard a card
    if (player.hand.length > 0) {
      await this.gameEngine.addToLog(
        `🗑️ ${player.name} må kaste et kort på grunn av å kaste opp!`,
        "info"
      );
      await this.discardCardAfterVomiting(player);
    }

    // All other players get 3 memory points
    for (const otherPlayer of this.gameEngine.players) {
      if (otherPlayer !== player) {
        otherPlayer.addMemory(3);
        await this.gameEngine.addToLog(
          `🎉 ${otherPlayer.name} får 3 minnepoeng fordi ${player.name} kastet opp!`,
          "success"
        );
      }
    }

    await this.gameEngine.delay(1000);
  }

  async discardCardAfterVomiting(player) {
    // Match Python logic exactly
    if (player.hand.length === 0) return;

    if (player.isHuman) {
      this.gameEngine.showCardSelection(
        player,
        "Kast et kort etter å ha kastet opp"
      );
    } else {
      const cardIndex = Math.floor(Math.random() * player.hand.length);
      const discardedCard = player.hand.splice(cardIndex, 1)[0];
      await this.gameEngine.addToLog(
        `🗑️ ${player.name} kaster ${discardedCard.name} på grunn av å kaste opp!`,
        "info"
      );
    }
  }

  async handleBouncer() {
    console.log(`🔍 [DEBUG] handleBouncer START`);
    await this.gameEngine.addToLog(
      `🚪 DØRVAKT PÅ ${this.gameEngine.currentPlace.name.toUpperCase()}`,
      "warning"
    );
    await this.gameEngine.addToLog(
      "Alle spillere må kaste terning for å komme inn!",
      "info"
    );

    for (const player of this.gameEngine.players) {
      console.log(`🔍 [DEBUG] Processing bouncer for player: ${player.name}`);
      const targetNumber =
        player.promille === 0 ? 1 : Math.ceil(player.promille);
      await this.gameEngine.addToLog(
        `🎲 ${player.name} prøver å komme inn...`,
        "info"
      );
      await this.gameEngine.addToLog(
        `Du må kaste ${targetNumber} eller høyere (promille: ${player.promille})`,
        "info"
      );

      console.log(
        `🔍 [DEBUG] About to call rollDiceWithModal for ${player.name}`
      );
      const success = await this.gameEngine.diceRoller.rollSkillDiceModal(
        player,
        targetNumber,
        "å komme inn"
      );
      console.log(
        `🔍 [DEBUG] rollDiceWithModal returned: ${success} for ${player.name}`
      );

      if (success) {
        await this.gameEngine.addToLog(
          `✅ ${player.name} kommer inn på ${this.gameEngine.currentPlace.name}!`,
          "success"
        );
      } else {
        await this.gameEngine.addToLog(
          `❌ ${player.name} blir nektet inngang til ${this.gameEngine.currentPlace.name}!`,
          "error"
        );
        await this.gameEngine.addToLog(
          `😢 ${player.name} må vente utenfor denne runden...`,
          "warning"
        );
        player.status = "outside";
      }
    }
    console.log(`🔍 [DEBUG] handleBouncer END`);
  }

  async offerNpcInteraction(player) {
    if (this.gameEngine.npcsInTown.length === 0) {
      await this.gameEngine.addToLog(
        "😔 Ingen NPC-er ute på byen akkurat nå...",
        "info"
      );
      return;
    }

    // Show NPC selection dialog
    const modalContent = `
      <p>Hvilken NPC vil du ringe?</p>
      <div class="npc-selection">
        ${this.gameEngine.npcsInTown
          .map(
            (npc, idx) => `
          <button class="action-btn" onclick="selectNpcToCall(${idx})">
            ${npc.name} - ${npc.displayText || ""}
          </button>
        `
          )
          .join("")}
        <button class="action-btn" onclick="selectNpcToCall(-1)">Ikke nå</button>
      </div>
    `;

    showModal("Ring en venn", modalContent);

    // Set up waiting for player choice
    this.gameEngine.waitingForNpcChoice = true;
    this.gameEngine.npcChoicePlayer = player;
  }

  async giveRandomNpcOnFailure(player) {
    const availableNpcs = this.gameEngine.npcsData.filter(
      (npc) => !this.gameEngine.usedNpcs.has(npc.name)
    );

    if (availableNpcs.length > 0) {
      const npcData =
        availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
      const npc = new NPC(npcData.name, npcData.effects, npcData.displayText);

      await this.gameEngine.addToLog(
        `${player.name} får uventet besøk...`,
        "info"
      );
      player.addNpc(npc);
      await this.gameEngine.addToLog(
        `🎁 ${player.name} får uventet besøk av ${npc.name}!`,
        "success"
      );

      // Apply NPC effects immediately
      await npc.applyEffects(player, this.gameEngine);

      // Mark NPC as used
      this.gameEngine.usedNpcs.add(npcData.name);
    } else {
      await this.gameEngine.addToLog(
        `😔 Ingen flere NPC-er tilgjengelige for ${player.name}...`,
        "info"
      );
    }
  }

  async handleEddieBringsNpc(player, eddieNpc) {
    const availableNpcs = this.gameEngine.npcsData.filter(
      (npc) => !this.gameEngine.usedNpcs.has(npc.name)
    );

    if (availableNpcs.length > 0) {
      const npcData =
        availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
      const randomNpc = new NPC(
        npcData.name,
        npcData.effects,
        npcData.displayText
      );

      await this.gameEngine.addToLog(
        `${eddieNpc.name} tar med en venn...`,
        "info"
      );
      player.addNpc(randomNpc);
      await this.gameEngine.addToLog(
        `🎁 ${eddieNpc.name} tar med ${randomNpc.name}!`,
        "success"
      );

      // Apply NPC effects immediately
      await randomNpc.applyEffects(player, this.gameEngine);

      // Mark NPC as used
      this.gameEngine.usedNpcs.add(npcData.name);
    } else {
      await this.gameEngine.addToLog(
        `😔 ${eddieNpc.name} kunne ikke finne noen å ta med...`,
        "info"
      );
    }
  }

  async handleKnowBeerEffect(player, enhancedEffect = null) {
    await this.gameEngine.addToLog(
      `🍺 ${player.name} roper: 'Kjenner dere ølet!'`,
      "info"
    );
    await this.gameEngine.delay(1000);

    // Determine memory points to give (2 or 4 if player has Sjefen)
    const memoryBonus = enhancedEffect === "enhanced_know_beer" ? 4 : 2;

    // Check all players for bonus
    for (const p of this.gameEngine.players) {
      if (p.promille >= 2) {
        if (p === player && enhancedEffect === "enhanced_know_beer") {
          p.addMemory(memoryBonus);
          await this.gameEngine.addToLog(
            `🍺 ${p.name} har ${p.promille} promille og får ${memoryBonus} minnepoeng (forsterket av Sjefen)!`,
            "success"
          );
        } else {
          p.addMemory(2); // Standard bonus
          await this.gameEngine.addToLog(
            `🍺 ${p.name} har ${p.promille} promille og får 2 minnepoeng!`,
            "success"
          );
        }
      }
    }

    // Only the player playing the card loses memory points if they have under 2 promille
    if (player.promille < 2) {
      if (player.memory > 0) {
        // Only lose memory if player has memories
        player.addMemory(-1);
        await this.gameEngine.addToLog(
          `😔 ${player.name} har bare ${player.promille} promille og mister 1 minnepoeng...`,
          "error"
        );
      } else {
        await this.gameEngine.addToLog(
          `😔 ${player.name} har bare ${player.promille} promille, men har ingen M å miste...`,
          "info"
        );
      }
    }

    await this.gameEngine.delay(1000);
  }

  // Generic chug method that can be used for different items
  async handleGenericChug(player, itemName, successReward, failurePenalty) {
    // Show modal for player choice (non-closable)
    const modalContent = `
      <div class="chug-options">
        <p><strong>${player.name}, vil du chugge ${itemName}?</strong></p>
        <button class="action-btn" onclick="handleChugChoice(1)">1. Chug ${itemName} (kast 6+ for ${successReward}, feil = ${failurePenalty})</button>
        <button class="action-btn" onclick="handleChugChoice(2)">2. Feig ut (ingen risiko)</button>
      </div>
    `;
    showNonClosableModal(`Chug ${itemName}?`, modalContent);

    // Wait for player choice
    this.gameEngine.waitingForChugChoice = true;
    while (this.gameEngine.waitingForChugChoice) {
      await this.gameEngine.delay(100);
    }
    const choice = this.gameEngine.chugChoice;

    if (choice === 1) {
      // Try to chug
      await this.gameEngine.addToLog(
        `🍺 ${player.name} prøver å chugge ${itemName}!`,
        "info"
      );
      await this.gameEngine.addToLog(
        "Du må kaste 6 eller høyere for å klare det!",
        "info"
      );

      // Use skill dice modal to get proper bonuses (including William's skill bonus)
      const success = await this.gameEngine.diceRoller.rollSkillDiceModal(
        player,
        6,
        `chugge ${itemName}`
      );

      if (success) {
        await this.gameEngine.addToLog(
          `🏆 ${player.name} klarte å chugge ${itemName}!`,
          "success"
        );
        await this.gameEngine.addToLog(
          `🎉 ${player.name} får ${successReward} for å chugge!`,
          "success"
        );

        // Handle different reward types
        if (successReward.includes("promille")) {
          const promilleAmount = parseFloat(
            successReward.match(/(\d+\.?\d*)/)[1]
          );
          player.addPromille(promilleAmount);
        } else if (successReward.includes("minnepoeng")) {
          const memoryAmount = parseInt(successReward.match(/(\d+)/)[1]);
          player.addMemory(memoryAmount);
        }
      } else {
        await this.gameEngine.addToLog(
          `😔 ${player.name} klarte ikke å chugge ${itemName}...`,
          "error"
        );
        await this.gameEngine.addToLog(
          `💔 ${player.name} mister ${failurePenalty} for å feile!`,
          "error"
        );

        // Handle different penalty types
        if (failurePenalty.includes("minnepoeng")) {
          const memoryAmount = parseInt(failurePenalty.match(/(\d+)/)[1]);
          player.addMemory(-memoryAmount);
        }
      }
    } else {
      await this.gameEngine.addToLog(
        `😅 ${player.name} feiger ut og chugger ikke ${itemName}.`,
        "info"
      );
    }

    // Don't set waitingForHumanInput = false here - let card.play() handle it
  }

  async handleBeerChug(player) {
    return this.handleGenericChug(
      player,
      "ølen",
      "2 minnepoeng",
      "1 minnepoeng"
    );
  }

  async handleIceChug(player) {
    console.log(`🔍 [DEBUG] handleIceChug START for ${player.name}`);
    console.log(
      `🔍 [DEBUG] waitingForHumanInput before handleIceChug: ${this.gameEngine.waitingForHumanInput}`
    );
    console.log(
      `🔍 [DEBUG] waitingForNpcChoice before handleIceChug: ${this.gameEngine.waitingForNpcChoice}`
    );

    // Forced ice chugging - no choice dialog
    await this.gameEngine.addToLog(
      `🍺 ${player.name} prøver å chugge ice!`,
      "info"
    );
    await this.gameEngine.addToLog(
      "Du må kaste 6 eller høyere for å klare det!",
      "info"
    );

    // Add a small delay to ensure any previous modal is closed
    console.log(`🔍 [DEBUG] Adding 500ms delay before dice roll`);
    await this.gameEngine.delay(500);

    // Use special ice dice modal that doesn't affect waitingForHumanInput
    console.log(`🔍 [DEBUG] About to call showIceDiceModal for ice chugging`);
    const baseRoll = await this.showIceChugModal(player);
    const success = baseRoll >= 6;
    console.log(
      `🔍 [DEBUG] showIceChugModal returned: ${baseRoll}, success: ${success} for ice chugging`
    );
    console.log(
      `🔍 [DEBUG] This should NOT happen until player clicks 'Lukk' on dice modal`
    );

    if (success) {
      console.log(`🔍 [DEBUG] Ice chugging SUCCESS for ${player.name}`);
      await this.gameEngine.addToLog(
        `🏆 ${player.name} klarte å chugge ice!`,
        "success"
      );
      await this.gameEngine.addToLog(
        `🎉 ${player.name} får 0.5% promille for å chugge!`,
        "success"
      );
      player.addPromille(0.5);
    } else {
      console.log(`🔍 [DEBUG] Ice chugging FAILED for ${player.name}`);
      await this.gameEngine.addToLog(
        `😔 ${player.name} klarte ikke å chugge ice...`,
        "error"
      );
      await this.gameEngine.addToLog(
        `💔 ${player.name} mister 1 minnepoeng for å feile!`,
        "error"
      );
      player.addMemory(-1);
    }

    console.log(`🔍 [DEBUG] handleIceChug END for ${player.name}`);

    return success;
  }

  // Special ice chug modal that doesn't affect waitingForHumanInput
  async showIceChugModal(player) {
    // Use the new random dice modal for ice chug
    return this.gameEngine.diceRoller.rollRandomDiceModal(
      player,
      6,
      "chugge ice"
    );
  }

  // Special ice dice roll for matching players
  async handleIceDiceRoll(player, targetNumber) {
    // Use the new random dice modal for ice dice rolls
    return this.gameEngine.diceRoller.rollRandomDiceModal(
      player,
      targetNumber,
      "ice'ing"
    );
  }

  async handleBongChoice(player) {
    await this.gameEngine.addToLog(
      `🎫 ${player.name} løser inn en 'Bong'!`,
      "info"
    );

    let choice;
    if (player.isHuman) {
      // Show modal for human player choice (non-closable)
      const modalContent = `
        <div class="bong-options">
          <p><strong>${player.name}, velg hva du vil drikke:</strong></p>
          <button class="action-btn" onclick="handleBongChoice(1)">1. Øl (0.5% promille)</button>
          <button class="action-btn" onclick="handleBongChoice(2)">2. Drink (0.5% promille, 1M)</button>
          <button class="action-btn" onclick="handleBongChoice(3)">3. Shot (1% promille, 1M)</button>
        </div>
      `;
      showNonClosableModal("Bong eller ikke bong?", modalContent);

      // Wait for player choice
      this.gameEngine.waitingForBongChoice = true;
      while (this.gameEngine.waitingForBongChoice) {
        await this.gameEngine.delay(100);
      }
      choice = this.gameEngine.bongChoice;
    } else {
      // AI chooses randomly
      choice = Math.floor(Math.random() * 3) + 1;
      await this.gameEngine.addToLog(
        `🤖 ${player.name} velger alternativ ${choice}`,
        "info"
      );
    }

    // Find the chosen card data and create a Card object
    let chosenCardData = null;
    if (choice === 1) {
      chosenCardData = this.gameEngine.findCardByName("drinkBeer");
    } else if (choice === 2) {
      chosenCardData = this.gameEngine.findCardByName("drinkDrink");
    } else if (choice === 3) {
      chosenCardData = this.gameEngine.findCardByName("shot");
    }

    if (chosenCardData) {
      // Create a new Card object from the data
      const chosenCard = new Card(
        chosenCardData.name,
        chosenCardData.promille_change,
        chosenCardData.minne_change,
        chosenCardData.special_effect,
        chosenCardData.displayText,
        chosenCardData.idName,
        chosenCardData.onlyName,
        chosenCardData.icon,
        chosenCardData.shortEffect
      );

      // Play the chosen card with all rules and effects (including chugging)
      await chosenCard.play(
        player,
        this.gameEngine.currentPlace,
        this.gameEngine
      );

      // Log the choice after the card is played
      const choiceText = choice === 1 ? "Øl" : choice === 2 ? "Drink" : "Shot";
      await this.gameEngine.addToLog(
        `🎯 ${player.name} valgte ${choiceText}`,
        "info"
      );
    }
  }

  async handleRoundDrinks(player) {
    await this.gameEngine.addToLog(
      `🍻 ${player.name} spiller 'Ta en runde'!`,
      "info"
    );
    await this.gameEngine.addToLog(
      "Alle spillere får øl og kan velge å chugge!",
      "info"
    );

    // Find beer card data
    const beerCardData = this.gameEngine.findCardByName("drinkBeer");
    if (!beerCardData) {
      await this.gameEngine.addToLog("❌ Kunne ikke finne øl-kortet!", "error");
      return;
    }

    // Go through all players
    for (const p of this.gameEngine.players) {
      // Create a new Card instance and play it for the player
      // This will handle chugging and give beer effects
      const beerCard = new Card(
        beerCardData.name,
        beerCardData.promille_change,
        beerCardData.minne_change,
        beerCardData.special_effect,
        beerCardData.displayText,
        beerCardData.idName,
        beerCardData.onlyName,
        beerCardData.icon,
        beerCardData.shortEffect
      );

      await beerCard.play(p, this.gameEngine.currentPlace, this.gameEngine);

      await this.gameEngine.delay(1000);
    }

    await this.gameEngine.addToLog(`🍻 Runden er ferdig!`, "info");
  }

  async handleIcing(player) {
    // Use the dedicated IceHandler
    if (!this.gameEngine.iceHandler) {
      this.gameEngine.iceHandler = new IceHandler(this.gameEngine);
    }
    return this.gameEngine.iceHandler.handleIcing(player);
  }
}

// Make SpecialEffects globally available
window.SpecialEffects = SpecialEffects;
