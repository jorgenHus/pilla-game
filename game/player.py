# player.py

import random

class Player:
    def __init__(self, name, is_human=True):
        self.name = name
        self.is_human = is_human
        self.promille = 0
        self.memory = 0
        self.hand = []  # Spillerens hånd med kort
        self.npcs = []  # NPC-er spilleren har hentet
        self.last_drink_card = None
        self.last_card_promille = 0
        self.status = "active"  # active, outside, standby, etc.

    def add_promille(self, amount):
        self.promille += amount
        if self.promille < 0:
            self.promille = 0
        # Promille kan ikke overstige 5
        if self.promille > 5:
            self.promille = 5

    def add_memory(self, amount):
        self.memory += amount

    def add_npc(self, npc):
        """Legg til en NPC til spilleren"""
        self.npcs.append(npc)
        print(f"{self.name} har nå {len(self.npcs)} NPC-er")

    def get_hand_size(self):
        """Hent antall kort på hånden"""
        return len(self.hand)
    
    def get_dice_bonus(self):
        """Hent total terningbonus basert på spilleren sin tilstand"""
        bonus = 0
        
        # Sweetspot bonus (1-3 promille)
        if 1 <= self.promille <= 3:
            bonus += 1
            
        # Her kan vi legge til flere bonuser senere:
        # - NPC-effekter som gir terningbonus
        # - Kort-effekter som gir terningbonus
        # - Sted-effekter som gir terningbonus
        
        return bonus
