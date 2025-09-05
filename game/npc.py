# npc.py

class NPC:
    def __init__(self, name, effects=None, display_text=""):
        self.name = name
        self.effects = effects or {}
        self.display_text = display_text

    def apply_effects(self, player):
        """Bruk NPC-effekter på spilleren når de hentes"""
        if "promille_bonus" in self.effects:
            player.add_promille(self.effects["promille_bonus"])
            print(f"{player.name} får {self.effects['promille_bonus']} ekstra promille fra {self.name}!")
            
        if "promille_penalty" in self.effects:
            player.add_promille(self.effects["promille_penalty"])
            print(f"{player.name} får {self.effects['promille_penalty']} promille fra {self.name}!")
            
        if "memory_bonus" in self.effects:
            player.add_memory(self.effects["memory_bonus"])
            print(f"{player.name} får {self.effects['memory_bonus']} minnepoeng fra {self.name}!")

    def apply_card_effects(self, player, card_name):
        """Bruk NPC-effekter når kort spilles"""
        if "double_beer" in self.effects and card_name in ["Drikk en øl", "Drikk en drink"]:
            player.add_promille(0.5)  # Doble øl/drink-effekten
            print(f"{self.name} dobler {card_name.lower()}-effekten for {player.name}!")
        
        # Sjefen sin spesialeffekt for "Kjenner dere ølet!"
        if "enhance_know_beer" in self.effects and card_name == "Kjenner dere ølet!":
            print(f"{self.name} forsterker effekten av 'Kjenner dere ølet!'!")
            return "enhanced_know_beer"  # Signal til GameEngine om forsterket effekt
