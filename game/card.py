# -*- coding: utf-8 -*-
# card.py

class Card:
    def __init__(self, name, promille_change=0, minne_change=0, special_effect=None, display_text=""):
        self.name = name
        self.promille_change = promille_change
        self.minne_change = minne_change
        self.special_effect = special_effect  # spesialeffekt som "call_friend"
        self.display_text = display_text

    def play(self, player, place, game_engine=None):
        # Håndter chugging først for øl-kort
        if self.name == "Drikk en øl" and game_engine:
            game_engine.handle_beer_chug(player)
        
        # Endre promille og minner
        player.add_promille(self.promille_change)
        player.add_memory(self.minne_change)
        player.last_drink_card = self.name
        player.last_card_promille = self.promille_change

        print(f"{player.name} spiller {self.name} -> Promille: {player.promille}, Minne: {player.memory}")

        # Sjekk om stedet gir ekstra effekt
        current_phase = game_engine.current_phase if game_engine else None
        place.apply_phase_effect(player, current_phase)
        
        # Sjekk NPC-effekter
        enhanced_effect = None
        for npc in player.npcs:
            result = npc.apply_card_effects(player, self.name)
            if result:
                enhanced_effect = result
        
        # Håndter spesialeffekter
        if self.special_effect == "call_friend" and game_engine:
            game_engine.offer_npc_interaction(player)
        elif self.special_effect == "know_beer" and game_engine:
            game_engine.handle_know_beer_effect(player, enhanced_effect)
        elif self.special_effect == "bong_choice" and game_engine:
            game_engine.handle_bong_choice(player)
        elif self.special_effect == "round_drinks" and game_engine:
            game_engine.handle_round_drinks(player)
        elif self.special_effect == "icing" and game_engine:
            game_engine.handle_icing(player)
