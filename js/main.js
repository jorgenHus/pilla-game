// SMØR - Mobile-friendly main logic

let gameEngine = null;
let players = [];

// Intro screen functionality
function startIntroSequence() {
  const introScreen = document.getElementById("introScreen");
  const introLogo = document.getElementById("introLogo");
  const introText = document.getElementById("introText");

  // Start with black screen for 0.5 seconds
  setTimeout(() => {
    // Fade in logo over 1 second
    introLogo.classList.add("fade-in");

    // Show "Trykk for å starte" text after logo fade-in is complete (1 second) + 0.5 seconds
    setTimeout(() => {
      introText.classList.add("show");
    }, 1500); // 1 second for logo fade-in + 0.5 seconds = 1.5 seconds total
  }, 500);

  // Handle click to start game
  introScreen.addEventListener("click", () => {
    introScreen.style.display = "none";
    document.getElementById("setupScreen").style.display = "flex";
  });
}

// Initialize intro when page loads
document.addEventListener("DOMContentLoaded", () => {
  startIntroSequence();
});

// Hand visibility toggle
let handVisible = false;

function toggleHandVisibility() {
  const overlay = document.getElementById("handOverlay");
  const button = document.getElementById("toggleHandBtn");

  // Use the global variable as source of truth
  window.handVisible = !window.handVisible;
  handVisible = window.handVisible; // Sync local variable

  if (window.handVisible) {
    overlay.classList.add("hidden");
    button.textContent = "Skjul hånd";
  } else {
    overlay.classList.remove("hidden");
    button.textContent = "Vis hånd";
  }
}

// Make function and variable globally available
window.toggleHandVisibility = toggleHandVisibility;
window.handVisible = handVisible;

// Initialize dice roller when game starts
let diceRoller = null;

// Setup functions
function addPlayer() {
  const input = document.getElementById("playerNameInput");
  const name = input.value.trim();

  // Validation
  if (!name) {
    showModal("Feil", "Spillernavn kan ikke være tomt!");
    return;
  }

  if (players.length >= 4) {
    showModal("Feil", "Maksimalt 4 spillere!");
    return;
  }

  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    showModal("Feil", "Spillernavn må være unikt!");
    return;
  }

  players.push({
    name: name,
    isHuman: true,
  });
  input.value = "";
  updatePlayerList();
  updateStartButton();
  updatePlayerCount();
}

function handleEnterKey(event) {
  if (event.key === "Enter") {
    addPlayer();
  }
}

function addAI() {
  if (players.length >= 4) {
    showModal("Feil", "Maksimalt 4 spillere!");
    return;
  }

  updatePlayerList();
  updateStartButton();
  updatePlayerCount();
}

function updatePlayerList() {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";

  // Sort players alphabetically
  const sortedPlayers = [...players].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  sortedPlayers.forEach((player, index) => {
    const originalIndex = players.indexOf(player);
    const playerItem = document.createElement("div");
    playerItem.className = "player-item human";
    playerItem.innerHTML = `
      <span class="player-name">
        ${player.name} 
        <span class="player-type">👤 Menneske</span>
      </span>
      <button onclick="removePlayer(${originalIndex})" class="remove-btn">Fjern</button>
    `;
    playerList.appendChild(playerItem);
  });
}

function removePlayer(index) {
  const player = players[index];

  // If it's an AI, remove from usedAiNames
  if (!player.isHuman && usedAiNames.includes(player.name)) {
    usedAiNames = usedAiNames.filter((name) => name !== player.name);
  }

  players.splice(index, 1);
  updatePlayerList();
  updateStartButton();
  updatePlayerCount();
}

function updatePlayerCount() {
  const countElement = document.getElementById("playerCount");
  if (countElement) {
    countElement.textContent = `${players.length}/4 spillere`;
  }
}

function updateStartButton() {
  const startBtn = document.getElementById("startGameBtn");
  startBtn.disabled = players.length < 2;
}

// Game functions
function startGame() {
  if (players.length < 2) return;

  // Hide setup screen, show game screen
  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "flex";

  // Initialize game
  initializeGame();
}

function initializeGame() {
  // Create player objects
  const gamePlayers = players.map((playerData) => {
    const player = new Player(playerData.name, playerData.isHuman);
    return player;
  });

  // Create places
  const places = PLACES_DATA.map(
    (placeData) =>
      new Place(
        placeData.name,
        placeData.effects,
        placeData.displayText,
        placeData.effectDescriptions,
        placeData.hasBouncer
      )
  );

  // Initialize game engine
  gameEngine = new GameEngine(gamePlayers, places, CARDS_DATA, NPCS_DATA);

  // Set up dice roller reference
  diceRoller = gameEngine.diceRoller;
  window.diceRoller = diceRoller;

  // Start the game
  gameEngine.startGame();
}

// Game action functions
function showCardPreview(playerIndex, cardIndex) {
  if (!gameEngine || !gameEngine.waitingForHumanInput) return;

  const player = gameEngine.players[playerIndex];
  if (!player || !player.hand[cardIndex] || !player.isHuman) return;

  const card = player.hand[cardIndex];

  // Create card preview modal
  const modalContent = `
    <div class="card-preview">
      <div class="card-preview-body">
        <p>${card.displayText}</p>
      </div>
      <div class="card-preview-actions">
        <button class="action-btn primary" onclick="confirmPlayCard(${playerIndex}, ${cardIndex})">
          🎯 Spill kort
        </button>
      </div>
    </div>
  `;

  showModal(card.name, modalContent);
}

async function confirmPlayCard(playerIndex, cardIndex) {
  if (!gameEngine || !gameEngine.waitingForHumanInput) return;

  const player = gameEngine.players[playerIndex];
  if (!player || !player.hand[cardIndex] || !player.isHuman) return;

  closeModal();

  // Play the card
  const selectedCard = player.hand.splice(cardIndex, 1)[0];
  await selectedCard.play(player, gameEngine.currentPlace, gameEngine);

  // Update display
  gameEngine.updateGameDisplay();

  // Only continue if we're not waiting for NPC interaction, icing, or chug choice
  if (
    !gameEngine.waitingForNpcChoice &&
    !gameEngine.waitingForIcing &&
    !gameEngine.waitingForChugChoice
  ) {
    gameEngine.waitingForHumanInput = false;
  }
}

function getSpecialEffectDescription(specialEffect) {
  const descriptions = {
    call_friend: "Ring en venn",
    know_beer: "Kjenner dere ølet",
    bong_choice: "Bong",
    round_drinks: "Ta en runde",
    icing: "Ice'ing",
    discard: "Kast kort",
  };
  return descriptions[specialEffect] || specialEffect;
}

function showSpecialOptions() {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();
  if (!currentPlayer || !currentPlayer.isHuman) {
    showModal("Info", "Kun menneskespillere kan bruke spesielle alternativer!");
    return;
  }

  const modalContent = `
        <div class="special-options">
            <button class="action-btn" onclick="handleCardTrade()">Bytt 2 kort mot 1 nytt</button>
            <button class="action-btn" onclick="handleSendAwayVenn()">Send vekk venn</button>
        </div>
    `;

  showModal("Spesielle alternativer", modalContent);
}

function handleCardTrade() {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();
  if (currentPlayer.hand.length < 2) {
    showModal("Feil", "Du må ha minst 2 kort for å bytte!");
    return;
  }

  // Reset selection state
  gameEngine.tradeSelection = [];

  // Show card selection dialog
  const modalContent = `
    <p>Velg kort å bytte bort (${gameEngine.tradeSelection.length}/2):</p>
    <div class="cards">
        ${currentPlayer.hand
          .map(
            (card, index) => `
            <div class="card ${
              gameEngine.tradeSelection.includes(index) ? "selected" : ""
            }" onclick="selectCardForTrade(${index})">
                <div class="card-name">${card.name}</div>
                <div class="card-description">${card.displayText}</div>
            </div>
        `
          )
          .join("")}
    </div>
  `;

  showModal("Bytt kort - Velg kort", modalContent);
}

async function selectCardForTrade(cardIndex) {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();

  if (gameEngine.tradeSelection.includes(cardIndex)) {
    // Deselect if already selected
    gameEngine.tradeSelection = gameEngine.tradeSelection.filter(
      (i) => i !== cardIndex
    );
  } else {
    // Select card (but don't allow more than 2)
    if (gameEngine.tradeSelection.length < 2) {
      gameEngine.tradeSelection.push(cardIndex);
    }
  }

  // Show updated selection dialog
  const modalContent = `
    <p>Velg kort å bytte bort (${gameEngine.tradeSelection.length}/2):</p>
    <div class="cards">
        ${currentPlayer.hand
          .map(
            (card, index) => `
            <div class="card ${
              gameEngine.tradeSelection.includes(index) ? "selected" : ""
            }" onclick="selectCardForTrade(${index})">
                <div class="card-name">${card.name}</div>
                <div class="card-description">${card.displayText}</div>
            </div>
        `
          )
          .join("")}
    </div>
    ${
      gameEngine.tradeSelection.length === 2
        ? `
      <div style="text-align: center; margin-top: 1rem;">
        <button class="action-btn primary" onclick="confirmCardTrade()">
          ✅ Bekreft bytte
        </button>
      </div>
    `
        : ""
    }
  `;

  showModal("Bytt kort - Velg kort", modalContent);
}

async function confirmCardTrade() {
  if (!gameEngine || gameEngine.tradeSelection.length !== 2) return;

  closeModal();
  await completeCardTrade();
}

async function completeCardTrade() {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();
  const [index1, index2] = gameEngine.tradeSelection;

  // Remove selected cards (remove higher index first to avoid index shifting)
  const card1 = currentPlayer.hand.splice(Math.max(index1, index2), 1)[0];
  const card2 = currentPlayer.hand.splice(Math.min(index1, index2), 1)[0];

  await gameEngine.addToLog(
    `🗑️ ${currentPlayer.name} kaster ${card1.name} og ${card2.name}`,
    "info"
  );

  // Draw 3 new cards for trading
  const newCards = drawCards(gameEngine.deck, 3);

  // Show selection of 1 card to keep
  const modalContent = `
        <p>Velg ett kort å beholde:</p>
        <div class="cards">
            ${newCards
              .map(
                (card, index) => `
                <div class="card" onclick="selectNewCardFromTrade(${index})">
                    <div class="card-name">${card.name}</div>
                    <div class="card-description">${card.displayText}</div>
                </div>
            `
              )
              .join("")}
        </div>
    `;

  showNonClosableModal("Bytt kort - Velg nytt kort", modalContent);
  gameEngine.tradeNewCards = newCards;
}

async function selectNewCardFromTrade(cardIndex) {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();
  const selectedCard = gameEngine.tradeNewCards[cardIndex];

  // Add the selected card to hand
  currentPlayer.hand.push(selectedCard);

  // Clean up
  gameEngine.tradeSelection = [];
  gameEngine.tradeStep = 1;
  gameEngine.tradeNewCards = [];

  // Close modal first
  closeModal();

  // Then update log and display
  await gameEngine.addToLog(
    `🃏 ${currentPlayer.name} får ${selectedCard.name}`,
    "info"
  );
  gameEngine.updateGameDisplay();

  // Continue the game flow
  gameEngine.waitingForHumanInput = false;
}

function handleSendAwayVenn() {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();
  if (currentPlayer.npcs.length === 0) {
    showModal("Feil", "Du har ingen NPC-er å sende vekk!");
    return;
  }

  if (currentPlayer.hand.length === 0) {
    showModal("Feil", "Du må ha minst 1 kort for å sende vekk en venn!");
    return;
  }

  // Reset selection state
  gameEngine.sendAwayStep = 1; // 1 = select card, 2 = select NPC
  gameEngine.sendAwayCardIndex = null;

  // Show card selection first
  const modalContent = `
        <p>Velg kort å kaste bort:</p>
        <div class="cards">
            ${currentPlayer.hand
              .map(
                (card, index) => `
                <div class="card" onclick="selectCardToSendAway(${index})">
                    <div class="card-name">${card.name}</div>
                    <div class="card-description">${card.displayText}</div>
                </div>
            `
              )
              .join("")}
        </div>
    `;

  showModal("Send vekk venn - Velg kort", modalContent);
}

function selectCardToSendAway(cardIndex) {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();

  if (gameEngine.sendAwayStep === 1) {
    // Select card
    gameEngine.sendAwayCardIndex = cardIndex;
    gameEngine.sendAwayStep = 2;

    // Show NPC selection
    const modalContent = `
          <p>Velg NPC å sende vekk:</p>
          <div class="npcs">
              ${currentPlayer.npcs
                .map(
                  (npc, index) => `
                  <div class="npc" onclick="selectNpcToSendAway(${index})">
                      <div class="npc-name">${npc.name}</div>
                      <div class="npc-description">${
                        npc.displayText || "Ingen beskrivelse"
                      }</div>
                  </div>
              `
                )
                .join("")}
          </div>
      `;

    showModal("Send vekk venn - Velg NPC", modalContent);
  }
}

async function selectNpcToSendAway(npcIndex) {
  if (!gameEngine) return;

  const currentPlayer = gameEngine.getCurrentPlayer();
  const cardIndex = gameEngine.sendAwayCardIndex;
  const npcToSend = currentPlayer.npcs[npcIndex];

  // Remove selected card first
  const discardedCard = currentPlayer.hand.splice(cardIndex, 1)[0];

  // Close modal first
  closeModal();

  // Then update log and roll dice
  await gameEngine.addToLog(
    `🗑️ ${currentPlayer.name} kaster ${discardedCard.name}`,
    "info"
  );
  await gameEngine.addToLog(
    `👋 ${currentPlayer.name} prøver å sende vekk ${npcToSend.name}!`,
    "info"
  );

  // Roll dice using new dice system
  const success = await gameEngine.diceRoller.rollSkillDiceModal(
    currentPlayer,
    3, // Target number for sending away
    "å sende vekk en venn"
  );

  if (!success) {
    // Failed roll: NPC refuses to leave
    await gameEngine.addToLog(`😤 ${npcToSend.name} vil ikke dra!`, "error");
  } else {
    // Success: NPC goes to another player (lowest skill roll)
    const npcToSend = currentPlayer.npcs.splice(npcIndex, 1)[0];
    const otherPlayers = gameEngine.players.filter((p) => p !== currentPlayer);

    if (otherPlayers.length > 0) {
      // Find player with lowest skill roll
      let lowestRoll = 999;
      let targetPlayer = null;

      for (const player of otherPlayers) {
        const playerRoll =
          Math.floor(Math.random() * 6) + 1 + player.getDiceBonus();
        await gameEngine.addToLog(
          `🎲 ${player.name} kaster ferdighetskast: ${playerRoll}`,
          "info"
        );

        if (playerRoll < lowestRoll) {
          lowestRoll = playerRoll;
          targetPlayer = player;
        }
      }

      if (targetPlayer) {
        targetPlayer.addNpc(npcToSend);
        await npcToSend.applyEffects(targetPlayer);
        await gameEngine.addToLog(
          `🎉 ${targetPlayer.name} får ${npcToSend.name}! (lavest ferdighetskast: ${lowestRoll})`,
          "success"
        );
      }
    } else {
      // No other players, NPC goes home
      await gameEngine.addToLog(
        `🏠 ${npcToSend.name} drar hjem! (ingen andre spillere)`,
        "info"
      );
    }
  }

  // Clean up
  gameEngine.sendAwayStep = 1;
  gameEngine.sendAwayCardIndex = null;

  gameEngine.updateGameDisplay();

  // End the turn - player should not get to play another card
  gameEngine.waitingForHumanInput = false;
}

function showGameStatus() {
  if (!gameEngine) return;

  let status = "📊 SPILLSTATUS:\n\n";

  // Game info
  status += `Fase: ${gameEngine.currentPhase}\n`;
  status += `Sted: ${gameEngine.currentPlace.name}\n\n`;

  // Players
  status += "👥 SPILLERE:\n";
  gameEngine.players.forEach((player, index) => {
    status += `${index + 1}. ${player.name} ${!player.isHuman ? "🤖" : "👤"}\n`;
    status += `   🍺 ${player.promille}% promille\n`;
    status += `   🧠 ${player.memory} minnepoeng\n`;
    status += `   🃏 ${player.hand.length} kort\n`;
    status += `   👥 ${player.npcs.length} NPC-er\n\n`;
  });

  // NPCs in town
  status += "🏠 NPC-ER UTE PÅ BYEN:\n";
  if (gameEngine.npcsInTown.length === 0) {
    status += "Ingen NPC-er ute på byen.\n";
  } else {
    gameEngine.npcsInTown.forEach((npc) => {
      status += `• ${npc.name}\n`;
    });
  }

  showModal("Spillstatus", `<pre>${status}</pre>`);
}

// Modal functions
function showModal(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = content;
  document.getElementById("modal").style.display = "flex";

  // Show close button for regular modals
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.style.display = "block";
  }
}

function showNonClosableModal(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = content;
  document.getElementById("modal").style.display = "flex";

  // Hide close button for non-closable modals
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.style.display = "none";
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function showNpcInfo() {
  if (!gameEngine) return;

  const npcs = gameEngine.npcsInTown;
  if (npcs.length === 0) {
    showModal("NPC-er", "Ingen NPC-er ute på byen.");
    return;
  }

  const npcContent = npcs
    .map(
      (npc) => `
      <div class="npc-info">
        <h4>${npc.name}</h4>
        <p>${npc.displayText}</p>
      </div>
    `
    )
    .join("");

  document.getElementById("npcModalBody").innerHTML = npcContent;
  document.getElementById("npcModal").style.display = "flex";
}

function closeNpcModal() {
  document.getElementById("npcModal").style.display = "none";
}

// Choice handlers
function handleChugChoice(choice) {
  if (!gameEngine) return;

  gameEngine.chugChoice = choice;
  gameEngine.waitingForChugChoice = false;
  closeModal();
}

function handleBongChoice(choice) {
  if (!gameEngine) return;

  gameEngine.bongChoice = choice;
  gameEngine.waitingForBongChoice = false;
  closeModal();
}

async function selectCardForDiscard(cardIndex) {
  if (!gameEngine) return;

  const player = gameEngine.cardSelectionPlayer;
  const reason = gameEngine.cardSelectionReason;

  if (!player || !player.hand[cardIndex]) return;

  // Remove the selected card
  const discardedCard = player.hand.splice(cardIndex, 1)[0];

  await gameEngine.addToLog(
    `🗑️ ${player.name} kaster ${discardedCard.name} (${reason})`,
    "info"
  );

  // Clean up
  gameEngine.cardSelectionReason = null;
  gameEngine.cardSelectionPlayer = null;

  closeModal();
  gameEngine.updateGameDisplay();
}

async function selectCardForDringDiscard(cardIndex) {
  if (!gameEngine) return;

  const player = gameEngine.dringDiscardPlayer;
  if (!player || !player.hand[cardIndex]) return;

  // Remove the selected card
  const discardedCard = player.hand.splice(cardIndex, 1)[0];

  await gameEngine.addToLog(
    `🗑️ ${player.name} kaster ${discardedCard.name} uten effekt!`,
    "info"
  );

  // Clean up and continue game
  gameEngine.dringDiscardPlayer = null;
  gameEngine.waitingForDringDiscard = false;

  closeModal();
  gameEngine.updateGameDisplay();
}

// NPC calling function
async function selectNpcToCall(npcIndex) {
  console.log(`🔍 [DEBUG] selectNpcToCall called with npcIndex: ${npcIndex}`);
  if (!gameEngine || !gameEngine.waitingForNpcChoice) return;

  const player = gameEngine.npcChoicePlayer;
  if (!player) return;

  closeModal();

  if (npcIndex === -1) {
    // Player chose "Ikke nå"
    await gameEngine.addToLog(
      `${player.name} velger å ikke ringe noen.`,
      "info"
    );
    gameEngine.waitingForNpcChoice = false;
    gameEngine.npcChoicePlayer = null;

    // Continue the game flow
    gameEngine.waitingForHumanInput = false;
    return;
  }

  if (npcIndex < 0 || npcIndex >= gameEngine.npcsInTown.length) return;

  const selectedNpc = gameEngine.npcsInTown[npcIndex];

  // Roll dice (Los Tacos bonus is handled in rollDice method)
  console.log(`🔍 [DEBUG] About to call rollDiceWithModal for NPC calling`);
  const success = await gameEngine.diceRoller.rollSkillDiceModal(
    player,
    3, // Standard difficulty
    "å ringe en venn"
  );
  console.log(
    `🔍 [DEBUG] rollDiceWithModal returned: ${success} for NPC calling`
  );

  if (success) {
    // Add NPC to player
    player.addNpc(selectedNpc);
    await selectedNpc.applyEffects(player, gameEngine);

    await gameEngine.addToLog(
      `✅ ${player.name} henter ${selectedNpc.name}!`,
      "success"
    );
    await gameEngine.addToLog(
      `🎉 ${player.name} får 1 minnepoeng for å ringe en venn!`,
      "success"
    );
    player.addMemory(1);

    // Remove NPC from town
    gameEngine.npcsInTown.splice(npcIndex, 1);

    // Check if Eddie brings a friend
    if (selectedNpc.name === "Eddie") {
      await gameEngine.handleEddieBringsNpc(player, selectedNpc);
    }
  } else {
    await gameEngine.giveRandomNpcOnFailure(player);
  }

  // Clean up
  console.log(
    `🔍 [DEBUG] Setting waitingForNpcChoice = false and waitingForHumanInput = false`
  );
  gameEngine.waitingForNpcChoice = false;
  gameEngine.npcChoicePlayer = null;

  // Continue the game flow
  gameEngine.waitingForHumanInput = false;
  console.log(`🔍 [DEBUG] selectNpcToCall completed`);
}

// Make functions globally available
window.addPlayer = addPlayer;
window.handleEnterKey = handleEnterKey;
window.removePlayer = removePlayer;
window.startGame = startGame;
window.showCardPreview = showCardPreview;
window.confirmPlayCard = confirmPlayCard;
window.showSpecialOptions = showSpecialOptions;
window.showGameStatus = showGameStatus;
window.showModal = showModal;
window.showNonClosableModal = showNonClosableModal;
window.closeModal = closeModal;
window.selectCardForTrade = selectCardForTrade;
window.confirmCardTrade = confirmCardTrade;
window.selectNewCardFromTrade = selectNewCardFromTrade;
window.selectCardToSendAway = selectCardToSendAway;
window.selectNpcToSendAway = selectNpcToSendAway;
window.selectCardForDiscard = selectCardForDiscard;
window.selectCardForDringDiscard = selectCardForDringDiscard;
window.handleChugChoice = handleChugChoice;
window.handleBongChoice = handleBongChoice;
window.showNpcInfo = showNpcInfo;
window.closeNpcModal = closeNpcModal;
window.selectNpcToCall = selectNpcToCall;

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}