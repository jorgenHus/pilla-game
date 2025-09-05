// SMØR - Dice Roller Module
// Handles all dice rolling logic and UI

class DiceRoller {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.diceModalData = null;
  }

  // Show dice modal for human players
  showDiceModal(
    player,
    targetNumber,
    actionDescription,
    bonuses = [],
    callback = null
  ) {
    const modal = document.getElementById("diceModal");
    const title = document.getElementById("diceActionTitle");
    const targetInfo = document.getElementById("diceTargetInfo");
    const bonusesDiv = document.getElementById("diceBonuses");
    const totalInfo = document.getElementById("diceTotalInfo");
    const dice = document.getElementById("dice");
    const instruction = document.querySelector(".dice-instruction");
    const result = document.getElementById("diceResult");
    const closeBtn = document.getElementById("diceCloseBtn");

    // Set up modal content with better titles
    let titleText = `🎲 ${actionDescription}`;

    // Fix specific action descriptions for better titles
    if (actionDescription === "å komme inn") {
      titleText = `🚪 Dørvaktkast`;
    } else if (actionDescription === "å ringe en venn") {
      titleText = `📞 Ring en venn`;
    } else if (actionDescription === "redningskast") {
      titleText = `🚑 Redningskast`;
    } else if (
      actionDescription === "chugge øl" ||
      actionDescription === "chugge ølen"
    ) {
      titleText = `🍺 Chugge øl`;
    } else if (actionDescription === "chugge ice") {
      titleText = `🧊 Chugge ice`;
    } else if (actionDescription === "ice'ing") {
      titleText = `🧊 ${player.name} sin tur`;
    }

    title.textContent = titleText;

    // Set target info based on action type
    if (actionDescription === "ice'ing") {
      if (targetNumber === 1) {
        targetInfo.textContent = "Kast terning";
      } else {
        targetInfo.textContent = `Du må treffe ${targetNumber}`;
      }
    } else {
      targetInfo.textContent = `Mål: ${targetNumber}`;
    }

    // Show bonuses
    if (bonuses.length > 0) {
      bonusesDiv.innerHTML = bonuses
        .map(
          (bonus) =>
            `<div>${bonus.emoji} ${bonus.description}: ${
              bonus.value > 0 ? "+" : ""
            }${bonus.value}</div>`
        )
        .join("");
    } else {
      bonusesDiv.innerHTML = "";
    }

    // Calculate total
    const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus.value, 0);
    const actualTarget = targetNumber - totalBonus;

    if (actionDescription === "ice'ing") {
      if (targetNumber === 1) {
        totalInfo.textContent = ""; // No target info for first roll
      } else {
        totalInfo.textContent = `Du må treffe ${targetNumber}`;
      }
    } else {
      totalInfo.textContent = `Du må kaste: ${actualTarget}${
        totalBonus !== 0
          ? ` (${targetNumber} ${totalBonus > 0 ? "-" : "+"} ${Math.abs(
              totalBonus
            )})`
          : ""
      }`;
    }

    // Reset dice state
    dice.className = "dice";
    dice.onclick = () => this.rollDiceInModal();
    instruction.textContent = "Klikk på terningen for å kaste";
    result.style.display = "none";
    closeBtn.style.display = "none";

    // Hide all dice faces except face 1
    const faces = dice.querySelectorAll(".dice-face");
    faces.forEach((face) => {
      if (!face.classList.contains("dice-face-1")) {
        face.classList.remove("show");
      }
    });

    // Store data for the roll
    this.diceModalData = {
      player,
      targetNumber,
      actionDescription,
      bonuses,
      callback,
    };

    // Show modal
    console.log(
      `🔍 [DEBUG] Showing dice modal for ${player.name} - ${actionDescription}`
    );
    modal.style.display = "block";
    console.log(`🔍 [DEBUG] Dice modal display set to block`);
  }

  // Roll dice in modal
  rollDiceInModal() {
    console.log(`🔍 [DEBUG] rollDiceInModal called`);
    if (!this.diceModalData) return;

    const dice = document.getElementById("dice");
    const instruction = document.querySelector(".dice-instruction");
    const result = document.getElementById("diceResult");
    const resultText = document.getElementById("diceResultText");
    const closeBtn = document.getElementById("diceCloseBtn");

    // Disable clicking during roll
    dice.onclick = null;

    // Generate random result
    const baseRoll = Math.floor(Math.random() * 6) + 1;
    const totalBonus = this.diceModalData.bonuses.reduce(
      (sum, bonus) => sum + bonus.value,
      0
    );
    const totalRoll = baseRoll + totalBonus;
    const success = totalRoll >= this.diceModalData.targetNumber;

    // Start rolling animation
    dice.classList.add("rolling");

    // After animation, show result
    setTimeout(() => {
      dice.classList.remove("rolling");

      // Hide all faces
      const faces = dice.querySelectorAll(".dice-face");
      faces.forEach((face) => face.classList.remove("show"));

      // Show the correct face
      const correctFace = dice.querySelector(`.dice-face-${baseRoll}`);
      if (correctFace) {
        correctFace.classList.add("show");
      }

      // Show result
      result.style.display = "block";
      result.className = `dice-result ${success ? "success" : "failure"}`;

      if (success) {
        resultText.textContent = `🎉 Du traff!`;
      } else {
        resultText.textContent = `😔 Aah, det var nesten!`;
      }

      // Show close button
      closeBtn.style.display = "inline-block";

      // Store result for game logic
      this.diceModalData.result = {
        baseRoll,
        totalRoll,
        success,
      };
    }, 2000);
  }

  // Close dice modal
  closeDiceModal() {
    console.log(`🔍 [DEBUG] closeDiceModal called`);
    const modal = document.getElementById("diceModal");
    modal.style.display = "none";

    // Return result to game logic
    if (this.diceModalData && this.diceModalData.callback) {
      console.log(
        `🔍 [DEBUG] Calling dice modal callback with result:`,
        this.diceModalData.result
      );
      this.diceModalData.callback(this.diceModalData.result);
    } else {
      console.log(`🔍 [DEBUG] No callback or diceModalData found`);
    }

    this.diceModalData = null;
  }

  // Calculate bonuses for dice roll
  calculateBonuses(player, actionDescription) {
    // For tilfeldighetskast (like ice'ing), no bonuses
    if (actionDescription.includes("tilfeldighetskast")) {
      return [];
    }

    const totalBonus = player.getDiceBonus();
    const bonuses = [];

    // Add sweetspot bonus separately
    if (player.promille >= 1 && player.promille <= 3) {
      bonuses.push({
        emoji: "🍺",
        description: "Sweetspot",
        value: 1,
      });
    }

    // Add pill penalty separately
    if (player.hasPill) {
      bonuses.push({ emoji: "💊", description: "Pilla", value: -1 });
    }

    // Add other dice bonuses (if any)
    const otherBonus =
      totalBonus -
      (player.promille >= 1 && player.promille <= 3 ? 1 : 0) -
      (player.hasPill ? -1 : 0);
    if (otherBonus !== 0) {
      bonuses.push({
        emoji: "🍺",
        description: "Kastbonus",
        value: otherBonus,
      });
    }

    // Add special bonuses from NPCs
    let specialBonus = 0;
    if (actionDescription === "redningskast") {
      for (const npc of player.npcs) {
        if (npc.effects.rescue_bonus) {
          specialBonus += npc.effects.rescue_bonus;
          bonuses.push({
            emoji: "🏆",
            description: `${npc.name} (redning)`,
            value: npc.effects.rescue_bonus,
          });
        }
      }
    } else if (actionDescription === "å komme inn") {
      for (const npc of player.npcs) {
        if (npc.effects.bouncer_bonus) {
          specialBonus += npc.effects.bouncer_bonus;
          bonuses.push({
            emoji: "🏆",
            description: `${npc.name} (dørvakt)`,
            value: npc.effects.bouncer_bonus,
          });
        }
      }
    }

    // Add Los Tacos bonus
    if (
      actionDescription === "å ringe en venn" &&
      this.gameEngine.currentPlace.name === "Los Tacos"
    ) {
      if (this.gameEngine.currentPhase === "Vors") {
        specialBonus += 2;
        bonuses.push({
          emoji: "🌮",
          description: "Los Tacos (Vors)",
          value: 2,
        });
      } else {
        specialBonus += 1;
        bonuses.push({
          emoji: "🌮",
          description: "Los Tacos",
          value: 1,
        });
      }
    }

    // Add William skill bonus
    for (const npc of player.npcs) {
      if (npc.effects.skill_bonus) {
        specialBonus += npc.effects.skill_bonus;
        bonuses.push({
          emoji: "🏆",
          description: `${npc.name} (ferdighet)`,
          value: npc.effects.skill_bonus,
        });
      }
    }

    // Add chug bonus from NPCs (like Tord)
    if (actionDescription.includes("chugge øl")) {
      for (const npc of player.npcs) {
        if (npc.effects.chug_bonus) {
          specialBonus += npc.effects.chug_bonus;
          bonuses.push({
            emoji: "🍺",
            description: `${npc.name} (chug)`,
            value: npc.effects.chug_bonus,
          });
        }
      }
    }

    return bonuses;
  }

  // Main dice roll method - now redirects to skill dice modal
  async rollDiceWithModal(
    player,
    targetNumber = 3,
    actionDescription = "terningkast"
  ) {
    return this.rollSkillDiceModal(player, targetNumber, actionDescription);
  }

  // Skill dice modal with bonuses (William, Sweetspot, etc.)
  async rollSkillDiceModal(
    player,
    targetNumber = 3,
    actionDescription = "ferdighetskast"
  ) {
    console.log(
      `🔍 [DEBUG] rollSkillDiceModal START - Player: ${player.name}, Action: ${actionDescription}, Target: ${targetNumber}`
    );

    return new Promise((resolve) => {
      const bonuses = this.calculateBonuses(player, actionDescription);

      // Show dice modal with callback
      this.showDiceModal(
        player,
        targetNumber,
        actionDescription,
        bonuses,
        (result) => {
          console.log(
            `🔍 [DEBUG] Skill dice modal callback triggered for ${player.name} - Result:`,
            result
          );

          // Log the result to game log
          this.gameEngine.addToLog(
            `🎲 ${
              player.name
            } kaster ferdighetskast for ${actionDescription}: ${
              result.baseRoll
            } + ${result.totalRoll - result.baseRoll} = ${result.totalRoll}`,
            "info"
          );

          if (result.success) {
            this.gameEngine.addToLog(
              `✅ Suksess! (${result.totalRoll} >= ${targetNumber})`,
              "success"
            );
          } else {
            this.gameEngine.addToLog(
              `❌ Feil! (${result.totalRoll} < ${targetNumber})`,
              "error"
            );
          }

          resolve(result.success);
        }
      );
    });
  }

  // Random dice modal without bonuses (for ice'ing, etc.)
  async rollRandomDiceModal(
    player,
    targetNumber = 3,
    actionDescription = "tilfeldighetskast"
  ) {
    console.log(
      `🔍 [DEBUG] rollRandomDiceModal START - Player: ${player.name}, Action: ${actionDescription}, Target: ${targetNumber}`
    );

    return new Promise((resolve) => {
      // No bonuses for random dice
      const bonuses = [];

      // Show dice modal with callback
      this.showDiceModal(
        player,
        targetNumber,
        actionDescription,
        bonuses,
        (result) => {
          console.log(
            `🔍 [DEBUG] Random dice modal callback triggered for ${player.name} - Result:`,
            result
          );

          // For random dice, return the actual roll value
          this.gameEngine.addToLog(
            `🎲 ${player.name} kastet tilfeldighetskast: ${result.baseRoll}`,
            "info"
          );

          resolve(result.baseRoll);
        }
      );
    });
  }
}

// Make functions globally available for HTML onclick handlers
window.closeDiceModal = function () {
  console.log(`🔍 [DEBUG] window.closeDiceModal called`);
  console.log(`🔍 [DEBUG] window.diceRoller exists:`, !!window.diceRoller);
  if (window.diceRoller) {
    window.diceRoller.closeDiceModal();
  } else {
    console.log(`🔍 [DEBUG] ERROR: window.diceRoller is not available!`);
  }
};
