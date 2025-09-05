// SMØR - Player-klasse (konvertert fra game/player.py)

class Player {
  constructor(name, isHuman = true) {
    this.name = name;
    this.isHuman = isHuman;
    this.promille = 0;
    this.memory = 0;
    this.hand = []; // Spillerens hånd med kort
    this.npcs = []; // NPC-er spilleren har hentet
    this.lastDrinkCard = null;
    this.lastCardPromille = 0;
    this.status = "active"; // active, outside, standby, etc.
    this.diceBonus = 0; // Temporary dice bonus/penalty
    this.hasPill = false; // Whether player has pill penalty
  }

  addPromille(amount) {
    this.promille += amount;
    if (this.promille < 0) {
      this.promille = 0;
    }
    // Promille kan ikke overstige 5
    if (this.promille > 5) {
      this.promille = 5;
    }
  }

  addMemory(amount) {
    this.memory += amount;
  }

  addDiceBonus(amount) {
    // Add temporary dice bonus (can be negative for penalties)
    this.diceBonus += amount;
  }

  addNpc(npc) {
    // Legg til en NPC til spilleren
    this.npcs.push(npc);
  }

  getHandSize() {
    // Hent antall kort på hånden
    return this.hand.length;
  }

  getDiceBonus() {
    // Hent total terningbonus basert på spilleren sin tilstand
    let bonus = 0;

    // Sweetspot bonus (1-3 promille)
    if (this.promille >= 1 && this.promille <= 3) {
      bonus += 1;
    }

    // Temporary dice bonus (from pill, leader jersey, etc.)
    if (this.diceBonus) {
      bonus += this.diceBonus;
    }

    // Her kan vi legge til flere bonuser senere:
    // - NPC-effekter som gir terningbonus
    // - Kort-effekter som gir terningbonus
    // - Sted-effekter som gir terningbonus

    return bonus;
  }
}
