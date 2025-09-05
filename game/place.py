# place.py

class Place:
    def __init__(self, name, effects=None, display_text="", effect_descriptions=None, has_bouncer=False):
        self.name = name
        self.effects = effects or {}
        self.display_text = display_text
        self.effect_descriptions = effect_descriptions or {}
        self.has_bouncer = has_bouncer

    def apply_round_start(self, player):
        if "memory_bonus" in self.effects:
            player.add_memory(self.effects["memory_bonus"])
            print(f"{player.name} får {self.effects['memory_bonus']} minnepoeng fra {self.name}.")
        
        if "promille_reduction" in self.effects:
            reduction = self.effects["promille_reduction"]
            player.add_promille(-reduction)
            print(f"{player.name} får {reduction} mindre promille på grunn av {self.name}.")

    def apply_phase_effect(self, player, current_phase=None):
        if self.effects.get("beer_double") and player.last_drink_card in ["Drikk en øl", "Drikk en drink"]:
            print(f"{player.name} får dobbel promille på grunn av {self.name}!")
            player.add_promille(player.last_card_promille)
        
        # Oslo Plaza effekt: øl-kort telles som drink-kort (0.5% 1m)
        if self.effects.get("beer_as_drink") and player.last_drink_card == "Drikk en øl":
            print(f"{player.name} får drink-effekt på øl-kortet på grunn av {self.name}!")
            # Øl gir normalt 0.5% promille, drink gir 0.5% promille + 1 minnepoeng
            # Så vi legger til 1 minnepoeng (som drink-kortet ville gitt)
            player.add_memory(1)      # 1 minnepoeng
        
        # Herslebs Vors-effekt: +0.5 bonus på promille-kort
        if (self.effects.get("vors_promille_bonus") and 
            current_phase == "Vors" and 
            player.last_card_promille > 0):
            bonus = self.effects["vors_promille_bonus"]
            print(f"{player.name} får {bonus} ekstra promille på grunn av {self.name} (Vors)!")
            player.add_promille(bonus)
