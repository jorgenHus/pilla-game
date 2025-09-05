// SMØR - UI Display Module

class UIDisplay {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  updateGameDisplay() {
    this.updateStatusDisplay();
    this.updateHandDisplay();
  }

  updateStatusDisplay() {
    // Update banner with phase and place
    this.updateBanner();

    // Update status panel with players and NPCs
    this.updateStatusPanel();
  }

  updateBanner() {
    // Update phase in banner (top-right)
    const phaseElement = document.getElementById("currentPhase");
    if (phaseElement) {
      phaseElement.textContent = `🎯 ${this.gameEngine.currentPhase}`;
    }

    // Update place in banner (left side)
    const placeElement = document.getElementById("currentPlace");
    if (placeElement) {
      const place = this.gameEngine.currentPlace;
      placeElement.textContent = `📍 ${place.name}`;
    }

    // Update place effects (left side, below place)
    const effectsElement = document.getElementById("placeEffects");
    if (effectsElement) {
      const effects = this.showPlaceEffects();
      if (effects) {
        effectsElement.textContent = `⚡ ${effects}`;
      } else {
        effectsElement.textContent = `⚡ Ingen`;
      }
    }
  }

  updateStatusPanel() {
    // Update players table
    this.updatePlayersTable();

    // Update NPCs section
    this.updateNpcsSection();
  }

  updatePlayersTable() {
    const playersTableElement = document.querySelector("#playersTable tbody");
    if (!playersTableElement) return;

    const currentPlayer = this.gameEngine.getCurrentPlayer();

    const playersHTML = this.gameEngine.players
      .map((player) => {
        const isCurrent = player === currentPlayer;
        const playerNpcs =
          player.npcs.length > 0
            ? player.npcs.map((npc) => npc.name).join(", ")
            : "Ingen";

        return `
          <tr class="${isCurrent ? "current-player" : ""}">
            <td class="player-name-cell">
              ${player.name}${player.hasPill ? " 💊" : ""}
            </td>
            <td>${player.promille}%</td>
            <td>${player.memory}</td>
            <td>${player.hand.length}</td>
            <td class="player-npcs-cell">${playerNpcs}</td>
          </tr>
        `;
      })
      .join("");

    playersTableElement.innerHTML = playersHTML;
  }

  updateNpcsSection() {
    const npcsElement = document.getElementById("npcsInTown");
    if (!npcsElement) return;

    if (this.gameEngine.npcsInTown.length === 0) {
      npcsElement.innerHTML = `
        <div class="npcs-section">
          <span>Ingen NPC-er ute på byen akkurat nå</span>
        </div>
      `;
    } else {
      const npcsHTML = this.gameEngine.npcsInTown
        .map((npc) => `<span class="npc-tag">${npc.name}</span>`)
        .join("");

      npcsElement.innerHTML = `
        <div class="npcs-section">
          <div class="npcs-list">
            ${npcsHTML}
            <button class="btn-small" onclick="showNpcInfo()" style="margin-left: 0.5rem;">Se detaljer</button>
          </div>
        </div>
      `;
    }
  }

  updateHandDisplay() {
    const currentPlayer = this.gameEngine.getCurrentPlayer();
    const playerNameElement = document.getElementById("currentPlayerName");
    const handElement = document.getElementById("playerHand");

    if (playerNameElement && currentPlayer) {
      playerNameElement.textContent = `${currentPlayer.name} sin tur`;
    }

    // Hide hand when new player's turn starts
    if (window.handVisible !== undefined) {
      window.handVisible = false;
      const overlay = document.getElementById("handOverlay");
      const button = document.getElementById("toggleHandBtn");
      if (overlay && button) {
        overlay.classList.remove("hidden");
        button.textContent = "Vis hånd";
      }
    }

    if (handElement && currentPlayer) {
      if (currentPlayer.hand.length === 0) {
        handElement.innerHTML = '<div class="no-cards">Ingen kort igjen</div>';
      } else {
        // Add special button as first "card"
        let cardsHTML = `
          <div class="card special-card" onclick="showSpecialOptions()">
            <div class="card-name">🎯 Spesial</div>
            <div class="card-description">Kortbytte & send vekk venn</div>
          </div>
        `;

        // Add regular cards
        cardsHTML += currentPlayer.hand
          .map(
            (card, index) => `
              <div class="card" onclick="showCardPreview(${this.gameEngine.players.indexOf(
                currentPlayer
              )}, ${index})">
                <div class="card-icon">${card.icon}</div>
                <div class="card-name">${card.onlyName}</div>
                <div class="card-short-effect">${card.shortEffect}</div>
              </div>
            `
          )
          .join("");

        handElement.innerHTML = cardsHTML;
      }
    }
  }

  updateGameLogDisplay() {
    const gameLogElement = document.getElementById("gameLog");
    if (gameLogElement) {
      // Show all entries, not just last 50
      gameLogElement.innerHTML = this.gameEngine.gameLog
        .map(
          (entry) => `
            <div class="log-entry ${entry.type} ${
            entry.isTyping ? "typing" : ""
          }">
              ${entry.message}
            </div>
          `
        )
        .join("");
      gameLogElement.scrollTop = gameLogElement.scrollHeight;
    }
  }

  showPlaceEffects() {
    const place = this.gameEngine.currentPlace;
    if (!place || !place.effectDescriptions) return "";

    const effects = Object.values(place.effectDescriptions);
    if (effects.length === 0) return "";

    return effects.join(", ");
  }

  showCardSelection(player, reason) {
    if (!player.isHuman || player.hand.length === 0) return;

    // Set up card selection state
    this.gameEngine.cardSelectionReason = reason;
    this.gameEngine.cardSelectionPlayer = player;

    // Show modal for card selection
    const modalContent = `
      <p>${reason}:</p>
      <div class="cards">
          ${player.hand
            .map(
              (card, index) => `
              <div class="card" onclick="selectCardForDiscard(${index})">
                  <div class="card-name">${card.name}</div>
                  <div class="card-description">${card.displayText}</div>
              </div>
          `
            )
            .join("")}
      </div>
    `;

    showModal("Velg kort", modalContent);
  }

  async showPhaseTransition(fromPhase, toPhase) {
    await this.gameEngine.addToLog(
      `🔄 Overgang fra ${fromPhase} til ${toPhase}...`,
      "info"
    );
    await this.gameEngine.delay(1500);
  }

  async endGame() {
    await this.gameEngine.addToLog("🎉 Spillet er slutt!", "success");

    // Find winner
    const winner = this.gameEngine.players.reduce((prev, current) =>
      prev.memory > current.memory ? prev : current
    );

    await this.gameEngine.addToLog(
      `🏆 ${winner.name} vinner med ${winner.memory} minnepoeng!`,
      "success"
    );

    // Show final stats
    await this.gameEngine.addToLog("📊 Sluttresultater:", "info");
    const sortedPlayers = this.gameEngine.players.sort(
      (a, b) => b.memory - a.memory
    );
    for (let index = 0; index < sortedPlayers.length; index++) {
      const player = sortedPlayers[index];
      await this.gameEngine.addToLog(
        `${index + 1}. ${player.name}: ${player.memory} minnepoeng, ${
          player.promille
        }% promille`,
        "info"
      );
    }
  }
}
