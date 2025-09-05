// SMØR - Main GameEngine (refactored into smaller modules)

class GameEngine {
  constructor(players, places, cards, npcsData) {
    this.players = players;
    this.places = places;
    this.cards = cards;
    this.npcsData = npcsData;
    this.phases = ["Vors", "Fest", "Nach"];
    this.currentPhaseIndex = 0;
    this.currentPlace = places[0];
    this.npcsInTown = [];
    this.deck = this.createDeck();
    this.visitedPlaces = new Set();
    this.usedNpcs = new Set();
    this.currentPlayerIndex = 0;
    this.gameLog = [];
    this.gameState = "playing"; // playing, waiting, ended
    this.isProcessing = false; // Prevent multiple simultaneous operations
    this.waitingForHumanInput = false; // Flag for human player input
    this.waitingForNpcChoice = false; // Flag for NPC choice interactions
    this.waitingForIcing = false; // Flag for icing operations
    this.waitingForChugChoice = false; // Flag for chug choice interactions

    // Initialize sub-modules
    this.gameFlow = new GameFlow(this);
    this.playerTurns = new PlayerTurns(this);
    this.specialEffects = new SpecialEffects(this);
    this.uiDisplay = new UIDisplay(this);
    this.diceRoller = new DiceRoller(this);
  }

  createDeck() {
    return createDeck();
  }

  async addToLog(message, type = "info") {
    // Use typewriter effect for all log messages
    return await this.addToLogWithTypewriter(message, type);
  }

  async addToLogWithTypewriter(message, type = "info") {
    // Create a new log entry for this message
    const logEntry = {
      message: "",
      type,
      timestamp: new Date(),
      isTyping: true,
    };
    this.gameLog.push(logEntry);

    // Add message character by character for typewriter effect
    let currentMessage = "";
    for (let i = 0; i < message.length; i++) {
      currentMessage += message[i];
      // Update the current log entry
      logEntry.message = currentMessage;
      this.uiDisplay.updateGameLogDisplay();
      await this.delay(30); // Character display speed
    }

    // Mark as finished typing
    logEntry.isTyping = false;
    this.uiDisplay.updateGameLogDisplay();

    // Wait 0.5 seconds after each line
    await this.delay(500); // Delay after line is fully typed
  }

  async typewriterLog(message, type = "info", speed = 30) {
    // Add message character by character for typewriter effect
    let currentMessage = "";
    for (let i = 0; i < message.length; i++) {
      currentMessage += message[i];
      // Update the last log entry
      if (this.gameLog.length > 0) {
        this.gameLog[this.gameLog.length - 1] = {
          message: currentMessage,
          type,
          timestamp: new Date(),
        };
      } else {
        this.gameLog.push({
          message: currentMessage,
          type,
          timestamp: new Date(),
        });
      }
      this.uiDisplay.updateGameLogDisplay();
      await this.delay(speed);
    }
    // Wait 0.5 seconds after each line
    await this.delay(500);
  }

  // Delegate to sub-modules
  async startGame() {
    return this.gameFlow.startGame();
  }

  async playPhase(phase) {
    return this.gameFlow.playPhase(phase);
  }

  async playerTurn(player) {
    return this.playerTurns.playerTurn(player);
  }

  async checkRescueRoll(player) {
    return this.playerTurns.checkRescueRoll(player);
  }

  async checkNpcTurnEffects(player) {
    return this.playerTurns.checkNpcTurnEffects(player);
  }

  async handleDringEffect(player, dringNpc) {
    return this.playerTurns.handleDringEffect(player, dringNpc);
  }

  async aiPlayerTurn(player) {
    return this.playerTurns.aiPlayerTurn(player);
  }

  async rollDice(player, targetNumber = 3, actionDescription = "terningkast") {
    return this.diceRoller.rollSkillDiceModal(
      player,
      targetNumber,
      actionDescription
    );
  }

  async rollDiceWithModal(
    player,
    targetNumber = 3,
    actionDescription = "terningkast"
  ) {
    return this.diceRoller.rollSkillDiceModal(
      player,
      targetNumber,
      actionDescription
    );
  }

  waitForHumanAction(player) {
    return this.playerTurns.waitForHumanAction(player);
  }

  showPlayerTurnInfo(player) {
    return this.playerTurns.showPlayerTurnInfo(player);
  }

  async handleVomiting(player) {
    return this.specialEffects.handleVomiting(player);
  }

  async discardCardAfterVomiting(player) {
    return this.specialEffects.discardCardAfterVomiting(player);
  }

  async handleBouncer() {
    return this.specialEffects.handleBouncer();
  }

  async offerNpcInteraction(player) {
    return this.specialEffects.offerNpcInteraction(player);
  }

  async giveRandomNpcOnFailure(player) {
    return await this.specialEffects.giveRandomNpcOnFailure(player);
  }

  async handleEddieBringsNpc(player, eddieNpc) {
    return await this.specialEffects.handleEddieBringsNpc(player, eddieNpc);
  }

  async handleKnowBeerEffect(player, enhancedEffect = null) {
    return this.specialEffects.handleKnowBeerEffect(player, enhancedEffect);
  }

  async handleBeerChug(player) {
    return this.specialEffects.handleBeerChug(player);
  }

  async handleIceChug(player) {
    return this.specialEffects.handleIceChug(player);
  }

  async handleBongChoice(player) {
    return this.specialEffects.handleBongChoice(player);
  }

  async handleRoundDrinks(player) {
    return this.specialEffects.handleRoundDrinks(player);
  }

  async handleIcing(player) {
    return this.specialEffects.handleIcing(player);
  }

  updateGameDisplay() {
    return this.uiDisplay.updateGameDisplay();
  }

  updatePhaseDisplay() {
    return this.uiDisplay.updatePhaseDisplay();
  }

  updateStatusDisplay() {
    return this.uiDisplay.updateStatusDisplay();
  }

  updateHandDisplay() {
    return this.uiDisplay.updateHandDisplay();
  }

  showPlaceEffects() {
    return this.uiDisplay.showPlaceEffects();
  }

  showCardSelection(player, reason) {
    return this.uiDisplay.showCardSelection(player, reason);
  }

  async showPhaseTransition(fromPhase, toPhase) {
    return this.uiDisplay.showPhaseTransition(fromPhase, toPhase);
  }

  async endGame() {
    return this.uiDisplay.endGame();
  }

  // Utility methods
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  findCardByName(cardName) {
    // First try to find by idName, then fall back to name
    return this.cards.find(
      (card) => card.idName === cardName || card.name === cardName
    );
  }

  setupNpcs(npcsData) {
    this.npcsInTown = [];
    this.usedNpcs.clear();
    this.refillNpcs();
  }

  refillNpcs() {
    while (this.npcsInTown.length < 3) {
      const availableNpcs = this.npcsData.filter(
        (npc) => !this.usedNpcs.has(npc.name)
      );

      if (availableNpcs.length > 0) {
        const npcData =
          availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
        const npc = new NPC(npcData.name, npcData.effects, npcData.displayText);
        this.npcsInTown.push(npc);
        this.usedNpcs.add(npcData.name);
      } else {
        break; // No more NPCs available
      }
    }
  }
}
