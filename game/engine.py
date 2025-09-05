# -*- coding: utf-8 -*-
# game_engine.py

import random
import time
from .player import Player
from .card import Card
from .place import Place
from .npc import NPC

class GameEngine:
    def __init__(self, players, places, cards, npcs_data):
        self.players = players
        self.places = places
        self.cards = cards
        self.npcs_data = npcs_data  # NPC-data fra JSON
        self.phases = ["Vors", "Fest", "Nach"]
        self.current_phase_index = 0
        self.current_place = places[0]
        self.npcs_in_town = []  # NPC-er "ute på byen"
        self.deck = self.create_deck()
        self.visited_places = set()  # Spor hvilke steder som er besøkt
        self.used_npcs = set()  # Spor hvilke NPC-er som er i bruk

    def create_deck(self):
        """Opprett en kortstokk med alle kort"""
        deck = []
        for card_data in self.cards:
            # Legg til flere kopier av hvert kort
            for _ in range(5):  # 5 kopier av hvert kort
                deck.append(Card(
                    card_data.name, 
                    card_data.promille_change, 
                    card_data.minne_change,
                    getattr(card_data, 'special_effect', None),
                    getattr(card_data, 'display_text', '')
                ))
        random.shuffle(deck)
        return deck

    def typewriter_print(self, text, speed=0.03):
        """Skriv ut tekst bokstav for bokstav med typewriter-effekt"""
        for char in text:
            print(char, end="", flush=True)
            time.sleep(speed)
        print()  # Ny linje etter teksten

    def loading_effect(self, message, duration=1.5):
        """Vis en loading-effekt med melding"""
        print(f"⏳ {message}", end="", flush=True)
        time.sleep(duration)
        print(" ✅")

    def quick_delay(self, duration=0.8):
        """Kort delay for bedre flyt"""
        time.sleep(duration)

    def long_delay(self, duration=1.2):
        """Lengre delay for viktige hendelser"""
        time.sleep(duration)

    def show_place_effects(self):
        """Vis sted-effekter på en lesbar måte basert på JSON-data"""
        effects_text = []
        
        # Gå gjennom alle effekter og bruk beskrivelser fra JSON
        for effect_key, effect_value in self.current_place.effects.items():
            if effect_key in self.current_place.effect_descriptions:
                # Sjekk om effekten gjelder for nåværende fase
                show_effect = True
                
                # Herslebs Vors-effekt: vis kun i Vors-fase
                if effect_key == "vors_promille_bonus" and self.current_phase != "Vors":
                    show_effect = False
                
                # Herslebs Nach-effekt: vis kun i Nach-fase
                if effect_key == "nach_rescue_threshold" and self.current_phase != "Nach":
                    show_effect = False
                
                if show_effect:
                    # Bruk beskrivelse fra JSON
                    description = self.current_place.effect_descriptions[effect_key]
                    # Erstatt eventuelle placeholders med faktiske verdier
                    if isinstance(effect_value, (int, float)) and effect_value != 0:
                        description = description.replace("1", str(effect_value))
                    effects_text.append(description)
        
        if effects_text:
            self.typewriter_print(f"⚡ Sted-effekter: {', '.join(effects_text)}")
        else:
            self.typewriter_print("⚡ Ingen spesielle sted-effekter")

    def handle_bouncer(self):
        """Håndter dørvakt for alle spillere"""
        self.typewriter_print(f"\n🚪 DØRVAKT PÅ {self.current_place.name.upper()}")
        self.typewriter_print("Alle spillere må kaste terning for å komme inn!")
        self.typewriter_print("Du må kaste høyere enn din promille for å komme inn.")
        self.long_delay()
        
        for player in self.players:
            # Target er spilleren sin promille (rundet opp)
            target_number = int(player.promille) + 1
            self.typewriter_print(f"\n🎲 {player.name} prøver å komme inn...")
            self.typewriter_print(f"Du må kaste {target_number} eller høyere (promille: {player.promille})")
            self.long_delay()
            
            # Bruk generell terningkast-metode med standard target
            if self.roll_dice(player, target_number=target_number, action_description="å komme inn"):
                self.typewriter_print(f"✅ {player.name} kommer inn på {self.current_place.name}!")
            else:
                self.typewriter_print(f"❌ {player.name} blir nektet inngang til {self.current_place.name}!")
                self.typewriter_print(f"😢 {player.name} må vente utenfor denne runden...")
                # Marker spilleren som inaktiv for denne runden
                player.status = "blocked"
            
            self.quick_delay()

    def draw_cards(self, num=5):
        """Trekk kort fra kortstokken"""
        drawn = []
        for _ in range(num):
            if self.deck:
                drawn.append(self.deck.pop())
            else:
                # Hvis kortstokken er tom, bland den på nytt
                self.deck = self.create_deck()
                if self.deck:
                    drawn.append(self.deck.pop())
        return drawn

    def setup_npcs(self, npcs_data):
        """Sett opp 3 NPC-er ute på byen fra JSON-data"""
        self.npcs_in_town = []
        self.used_npcs = set()
        
        # Velg 3 tilfeldige NPC-er fra alle tilgjengelige
        available_npcs = [npc for npc in npcs_data if npc["name"] not in self.used_npcs]
        
        for _ in range(3):
            if available_npcs:
                npc_data = random.choice(available_npcs)
                available_npcs.remove(npc_data)  # Unngå duplikater
                npc = NPC(npc_data["name"], npc_data.get("effects", {}), npc_data.get("displayText", ""))
                self.npcs_in_town.append(npc)
                self.used_npcs.add(npc_data["name"])

    def refill_npcs(self):
        """Fyll opp NPC-listen til 3 når noen blir ringt"""
        while len(self.npcs_in_town) < 3:
            # Finn tilgjengelige NPC-er som ikke er i bruk
            available_npcs = [npc for npc in self.npcs_data if npc["name"] not in self.used_npcs]
            
            if available_npcs:
                npc_data = random.choice(available_npcs)
                npc = NPC(npc_data["name"], npc_data.get("effects", {}), npc_data.get("displayText", ""))
                self.npcs_in_town.append(npc)
                self.used_npcs.add(npc_data["name"])
            else:
                # Hvis alle NPC-er er i bruk, ikke fyll mer
                break

    def start_game(self):
        """Start hele spillet med alle faser"""
        print("\n--- SMØR: Sjefen og Sårds ølduell ---")
        print("Spillet starter!")
        
        # Sett opp NPC-er
        self.loading_effect("Setter opp NPC-er...")
        self.setup_npcs(self.npcs_data)
        self.quick_delay()
        
        # Kjør alle faser
        for i, phase in enumerate(self.phases):
            self.play_phase(phase)
            
            # Vis fase-overgang (ikke etter siste fase)
            if i < len(self.phases) - 1:
                self.show_phase_transition(phase, self.phases[i + 1])
            
        # Vis endelig resultat
        self.end_game()

    def play_phase(self, phase):
        """Spill en fase (Vors, Fest, eller Nach)"""
        self.current_phase = phase
        
        # Velg tilfeldig sted for denne fasen
        self.current_place = random.choice(self.places)
        
        print(f"\n{'='*50}")
        self.typewriter_print(f"🎯 FASE: {phase}")
        self.typewriter_print(f"📍 Sted: {self.current_place.name}")
        
        # Vis sted-beskrivelse
        if self.current_place.display_text:
            self.typewriter_print(f"📖 {self.current_place.display_text}")
        
        # Vis sted-effekter
        self.show_place_effects()
        
        # Håndter dørvakt hvis dette er første gang på stedet
        if self.current_place.has_bouncer and self.current_place.name not in self.visited_places:
            self.handle_bouncer()
        
        # Marker stedet som besøkt
        self.visited_places.add(self.current_place.name)
        
        print(f"👥 NPC-er ute på byen:")
        for npc in self.npcs_in_town:
            if npc.display_text:
                print(f"  • {npc.name} - {npc.display_text}")
            else:
                print(f"  • {npc.name}")
        print(f"{'='*50}")
        self.long_delay()
        
        # Gi alle aktive spillere 5 nye kort og bruk sted-effekter
        for player in self.players:
            if player.status == "active":
                self.loading_effect(f"Gir {player.name} 5 kort...")
                player.hand = self.draw_cards(5)
                self.current_place.apply_round_start(player)
            else:
                self.typewriter_print(f"😢 {player.name} er blokkert og får ingen kort denne runden.")
            self.quick_delay()
        
        # Spill til alle har brukt opp kortene sine
        while any(player.hand for player in self.players):
            for player in self.players:
                if player.hand and player.status == "active":
                    self.player_turn(player)
        
        # Reset alle spillere til aktiv status for neste fase
        for player in self.players:
            player.status = "active"

    def show_phase_transition(self, current_phase, next_phase):
        """Vis tydelig overgang mellom faser"""
        print(f"\n{'='*60}")
        print(f"🎉 {current_phase.upper()} ER FERDIG! 🎉")
        print(f"{'='*60}")
        self.long_delay()
        
        print(f"\n{'='*60}")
        print(f"🚀 GÅR VIDERE TIL {next_phase.upper()}! 🚀")
        print(f"{'='*60}")
        self.long_delay()
        
        # Vis status for alle spillere
        print(f"\n📊 STATUS ETTER {current_phase.upper()}:")
        print(f"{'Spiller':<12} {'Promille':<8} {'Minner':<7} {'NPC-er'}")
        print("-" * 40)
        for player in self.players:
            npc_names = ", ".join([npc.name for npc in player.npcs]) if player.npcs else "Ingen"
            print(f"{player.name:<12} {player.promille:<8.1f} {player.memory:<7} {npc_names}")
        print()
        self.long_delay()

    def show_game_status(self):
        """Vis oversiktlig status for alle spillere"""
        print(f"\n📊 SPILLSTATUS:")
        print(f"{'Spiller':<12} {'Promille':<8} {'Minner':<7} {'Kort':<5} {'NPC-er'}")
        print("-" * 45)
        for player in self.players:
            npc_names = ", ".join([npc.name for npc in player.npcs]) if player.npcs else "Ingen"
            print(f"{player.name:<12} {player.promille:<8.1f} {player.memory:<7} {len(player.hand):<5} {npc_names}")
        print()

    def player_turn(self, player):
        """En spiller sin tur"""
        print(f"\n{'='*60}")
        print(f"🎮 {player.name.upper()} SIN TUR")
        print(f"{'='*60}")
        
        # Sjekk for turn-start effekter
        for npc in player.npcs:
            if "turn_start_promille" in npc.effects:
                promille_bonus = npc.effects["turn_start_promille"]
                player.add_promille(promille_bonus)
                print(f"👼 {npc.name} gir {promille_bonus} promille ved starten av turen!")
            
            if "turn_start_memory" in npc.effects:
                memory_bonus = npc.effects["turn_start_memory"]
                player.add_memory(memory_bonus)
                print(f"🧠 {npc.name} gir {memory_bonus} minnepoeng ved starten av turen!")
        
        # Sjekk redningskast hvis spilleren har 4+ promille
        if not self.check_rescue_roll(player):
            return  # Spilleren kastet opp og turen er over
        
        # Sjekk NPC-effekter som påvirker turen
        if not self.check_npc_turn_effects(player):
            return  # Spilleren må stå over runden
        
        # Vis sted og fase info
        print(f"📍 Sted: {self.current_place.name}")
        print(f"🎯 Fase: {self.current_phase}")
        
        # Vis stedseffekter
        if self.current_place.effects:
            print(f"\n⚡ Stedseffekter:")
            for effect_key, effect_value in self.current_place.effects.items():
                if effect_key in self.current_place.effect_descriptions:
                    description = self.current_place.effect_descriptions[effect_key]
                    if isinstance(effect_value, (int, float)) and effect_value != 0:
                        description = description.replace("1", str(effect_value))
                    print(f"  • {description}")
        
        # Vis NPC-er på byen
        print(f"\n👥 NPC-er ute på byen:")
        for npc in self.npcs_in_town:
            if npc.display_text:
                print(f"  • {npc.name} - {npc.display_text}")
            else:
                print(f"  • {npc.name}")
        
        # Vis spilleren sin status
        print(f"\n👤 {player.name} sin status:")
        print(f"  🍺 Promille: {player.promille}")
        print(f"  🧠 Minner: {player.memory}")
        print(f"  🃏 Kort på hånden: {len(player.hand)}")
        
        if player.npcs:
            print(f"  👥 NPC-er:")
            for npc in player.npcs:
                print(f"    • {npc.name} - {npc.display_text}")
        else:
            print(f"  👥 NPC-er: Ingen")
        
        # Vis oversikt over alle spillere
        print(f"\n📊 Alle spillere:")
        for p in self.players:
            if p == player:
                print(f"  👤 {p.name}: {p.promille} promille, {p.memory} minner, {len(p.hand)} kort, {len(p.npcs)} NPC-er ⭐")
            else:
                print(f"  👤 {p.name}: {p.promille} promille, {p.memory} minner, {len(p.hand)} kort, {len(p.npcs)} NPC-er")
        
        # Vis kort på hånden
        print(f"\n📋 Hånden din:")
        for idx, card in enumerate(player.hand):
            if card.display_text:
                print(f"  {idx+1}. {card.name} - {card.display_text}")
            else:
                print(f"  {idx+1}. {card.name}")
        
        print(f"{'='*60}")
        
        if player.is_human:
            choice = input(f"\n🎯 Velg kort (nummer) eller 9 for spesielle alternativer: ")
            if choice == "9":
                self.handle_special_options(player)
                return
            if not choice.isdigit() or int(choice)-1 not in range(len(player.hand)):
                print("❌ Ugyldig valg. Prøv igjen.")
                return
            card_idx = int(choice)-1
        else:
            # AI velger tilfeldig kort
            card_idx = random.randint(0, len(player.hand)-1)
            self.typewriter_print(f"🤖 {player.name} tenker...")
            self.long_delay()
            self.loading_effect(f"{player.name} velger kort...")
            self.typewriter_print(f"🤖 {player.name} velger kort {card_idx+1}")
            self.quick_delay()
        
        # Spill kortet
        self.loading_effect(f"{player.name} spiller kort...")
        selected_card = player.hand.pop(card_idx)
        selected_card.play(player, self.current_place, self)
        self.quick_delay()

    def roll_dice(self, player, target_number=3, action_description="terningkast"):
        """Generell terningkast-metode med bonus-system"""
        self.typewriter_print(f"\n🎲 {player.name} kaster terning...")
        self.long_delay()
        self.loading_effect("Terningen ruller...")
        
        base_roll = random.randint(1, 6)
        bonus = player.get_dice_bonus()
        
        # Sjekk for spesielle terningkast-bonuser fra NPC-er
        special_bonus = 0
        bonus_description = ""
        
        if action_description == "redningskast":
            for npc in player.npcs:
                if "rescue_bonus" in npc.effects:
                    special_bonus += npc.effects["rescue_bonus"]
                    bonus_description += f" + {npc.effects['rescue_bonus']} (redningskast-bonus fra {npc.name})"
                    self.typewriter_print(f"🏆 {npc.name} gir {npc.effects['rescue_bonus']} bonus på redningskast!")
        
        elif action_description == "å komme inn":
            for npc in player.npcs:
                if "bouncer_bonus" in npc.effects:
                    special_bonus += npc.effects["bouncer_bonus"]
                    bonus_description += f" + {npc.effects['bouncer_bonus']} (dørvakt-bonus fra {npc.name})"
                    self.typewriter_print(f"🏆 {npc.name} gir {npc.effects['bouncer_bonus']} bonus på dørvaktkast!")
        
        # Sjekk for ferdighetskast-bonus fra William (gjelder alle terningkast)
        for npc in player.npcs:
            if "skill_bonus" in npc.effects:
                special_bonus += npc.effects["skill_bonus"]
                bonus_description += f" + {npc.effects['skill_bonus']} (ferdighetskast-bonus fra {npc.name})"
                self.typewriter_print(f"🏆 {npc.name} gir {npc.effects['skill_bonus']} bonus på ferdighetskast!")
        
        total_roll = base_roll + bonus + special_bonus
        
        # Vis terningkast-resultat
        if special_bonus != 0:
            self.typewriter_print(f"🎲 {player.name} kaster terning for {action_description}: {base_roll} + {bonus} + {special_bonus} = {total_roll}")
        else:
            self.typewriter_print(f"🎲 {player.name} kaster terning for {action_description}: {base_roll} + {bonus} = {total_roll}")
        
        if bonus > 0:
            self.typewriter_print(f"🍺 {player.name} får {bonus} bonus på terningen!")
            self.quick_delay()
        
        success = total_roll >= target_number
        if success:
            self.typewriter_print(f"✅ Suksess! ({total_roll} >= {target_number})")
        else:
            self.typewriter_print(f"❌ Feil! ({total_roll} < {target_number})")
        
        self.long_delay()
        return success

    def offer_npc_interaction(self, player):
        """Tilby spilleren å hente en NPC med terningkast"""
        if not self.npcs_in_town:
            print("📞 Ingen NPC-er tilgjengelige ute på byen.")
            return
            
        if player.is_human:
            self.typewriter_print(f"\n📞 RING EN VENN")
            print(f"👥 Tilgjengelige NPC-er:")
            for idx, npc in enumerate(self.npcs_in_town):
                if npc.display_text:
                    print(f"  {idx+1}. {npc.name} - {npc.display_text}")
                else:
                    print(f"  {idx+1}. {npc.name}")
            self.typewriter_print(f"  0. Ikke nå")
            
            choice = input(f"\n🎯 Velg NPC (nummer): ")
            if choice.isdigit() and 1 <= int(choice) <= len(self.npcs_in_town):
                # Sjekk for Los Tacos bonus på "Ring en venn"
                target_number = 3  # Standard
                if self.current_place.name == "Los Tacos":
                    if self.current_phase == "Vors":
                        target_number = 2  # +2 bonus (3-2=1, men vi setter target til 2)
                        print(f"🍺 Los Tacos gir +2 bonus på 'Ring en venn' i Vors-fasen!")
                    else:
                        target_number = 2  # +1 bonus (3-1=2)
                        print(f"🍺 Los Tacos gir +1 bonus på 'Ring en venn'!")
                
                # Bruk generell terningkast-metode
                if self.roll_dice(player, target_number=target_number, action_description="å ringe en venn"):
                    npc_idx = int(choice) - 1
                    npc = self.npcs_in_town.pop(npc_idx)
                    self.loading_effect(f"{player.name} henter {npc.name}...")
                    player.add_npc(npc)
                    print(f"✅ {player.name} henter {npc.name}!")
                    
                    # Gi 1 minnepoeng for suksessfull "ring en venn"
                    player.add_memory(1)
                    print(f"🎉 {player.name} får 1 minnepoeng for å ringe en venn!")
                    
                    # Sjekk for Eddie's "brings_random_npc" effekt
                    if "brings_random_npc" in npc.effects:
                        self.handle_eddie_brings_npc(player, npc)
                    
                    # Bruk NPC-effekter umiddelbart
                    npc.apply_effects(player)
                    
                    # Fyll opp NPC-listen
                    self.refill_npcs()
                else:
                    print(f"❌ {player.name} får ikke kontakt med {self.npcs_in_town[int(choice)-1].name}...")
                    print("📞 Du trenger 3 eller høyere for å få kontakt!")
                    
                    # Gi tilfeldig NPC som trøst
                    self.give_random_npc_on_failure(player)
        else:
            # AI-spiller - automatisk prøve å ringe en venn
            if self.npcs_in_town:
                npc_idx = random.randint(0, len(self.npcs_in_town) - 1)
                npc = self.npcs_in_town[npc_idx]
                self.typewriter_print(f"🤖 {player.name} prøver å ringe {npc.name}...")
                self.long_delay()
                
                if self.roll_dice(player, target_number=3, action_description="å ringe en venn"):
                    npc = self.npcs_in_town.pop(npc_idx)
                    self.loading_effect(f"{player.name} henter {npc.name}...")
                    player.add_npc(npc)
                    print(f"✅ {player.name} henter {npc.name}!")
                    
                    # Gi 1 minnepoeng for suksessfull "ring en venn"
                    player.add_memory(1)
                    print(f"🎉 {player.name} får 1 minnepoeng for å ringe en venn!")
                    
                    # Sjekk for Eddie's "brings_random_npc" effekt
                    if "brings_random_npc" in npc.effects:
                        self.handle_eddie_brings_npc(player, npc)
                    
                    # Bruk NPC-effekter umiddelbart
                    npc.apply_effects(player)
                    
                    # Fyll opp NPC-listen
                    self.refill_npcs()
                else:
                    print(f"❌ {player.name} får ikke kontakt med {npc.name}...")
                    
                    # Gi tilfeldig NPC som trøst
                    self.give_random_npc_on_failure(player)

    def give_random_npc_on_failure(self, player):
        """Gi en tilfeldig NPC når spilleren feiler ved å ringe en venn"""
        # Finn tilgjengelige NPC-er som ikke er i bruk
        available_npcs = [npc for npc in self.npcs_data if npc["name"] not in self.used_npcs]
        
        if available_npcs:
            npc_data = random.choice(available_npcs)
            npc = NPC(npc_data["name"], npc_data.get("effects", {}), npc_data.get("displayText", ""))
            
            self.loading_effect(f"{player.name} får uventet besøk...")
            player.add_npc(npc)
            print(f"🎁 {player.name} får uventet besøk av {npc.name}!")
            
            # Bruk NPC-effekter umiddelbart
            npc.apply_effects(player)
            
            # Marker NPC som i bruk
            self.used_npcs.add(npc_data["name"])
        else:
            print(f"😔 Ingen flere NPC-er tilgjengelige for {player.name}...")

    def handle_eddie_brings_npc(self, player, eddie_npc):
        """Håndter Eddie's effekt som tar med en tilfeldig NPC"""
        # Finn tilgjengelige NPC-er som ikke er i bruk
        available_npcs = [npc for npc in self.npcs_data if npc["name"] not in self.used_npcs]
        
        if available_npcs:
            npc_data = random.choice(available_npcs)
            random_npc = NPC(npc_data["name"], npc_data.get("effects", {}), npc_data.get("displayText", ""))
            
            self.loading_effect(f"{eddie_npc.name} tar med en venn...")
            player.add_npc(random_npc)
            print(f"🎁 {eddie_npc.name} tar med {random_npc.name}!")
            
            # Bruk NPC-effekter umiddelbart
            random_npc.apply_effects(player)
            
            # Marker NPC som i bruk
            self.used_npcs.add(npc_data["name"])
        else:
            print(f"😔 {eddie_npc.name} kunne ikke finne noen å ta med...")

    def handle_know_beer_effect(self, player, enhanced_effect=None):
        """Håndter 'Kjenner dere ølet!' kort-effekten"""
        print(f"\n🍺 {player.name} roper: 'Kjenner dere ølet!'")
        self.long_delay()
        
        # Bestem hvor mange minnepoeng som gis (2 eller 4 hvis spilleren har Sjefen)
        memory_bonus = 4 if enhanced_effect == "enhanced_know_beer" else 2
        
        # Sjekk alle spillere for bonus
        for p in self.players:
            if p.promille >= 2:
                # Hvis spilleren som spiller kortet har Sjefen, gi forsterket bonus
                if p == player and enhanced_effect == "enhanced_know_beer":
                    p.add_memory(memory_bonus)
                    print(f"🍺 {p.name} har {p.promille} promille og får {memory_bonus} minnepoeng (forsterket av Sjefen)!")
                else:
                    p.add_memory(2)  # Standard bonus
                    print(f"🍺 {p.name} har {p.promille} promille og får 2 minnepoeng!")
        
        # Kun spilleren som spiller kortet mister minnepoeng hvis de har under 2 promille
        if player.promille < 2:
            if player.memory > 0:  # Bare mist minne hvis spilleren har minner
                player.add_memory(-1)
                print(f"😔 {player.name} har bare {player.promille} promille og mister 1 minnepoeng...")
            else:
                print(f"😔 {player.name} har bare {player.promille} promille, men har ingen minner å miste...")
        
        self.long_delay()

    def check_rescue_roll(self, player):
        """Sjekk om spilleren trenger redningskast"""
        # Bestem redningskast-terskel basert på sted og fase
        rescue_threshold = 5  # Standard (ny kapp)
        dice_target = 4  # Standard terningkrav
        
        # Herslebs Nach-effekt: redningskast ved 4 promille (ny kapp)
        if (self.current_place.name == "Herslebs" and 
            self.current_phase == "Nach" and 
            "nach_rescue_threshold" in self.current_place.effects):
            rescue_threshold = 4  # Herslebs Nach: 4 promille
            dice_target = 3  # Herslebs Nach: terningkrav 3
        
        if player.promille >= rescue_threshold:
            print(f"\n🤮 {player.name} har {player.promille} promille og trenger redningskast!")
            print(f"Du må kaste {dice_target} eller høyere for å unngå å kaste opp!")
            self.long_delay()
            
            # Kast terning for redningskast
            if self.roll_dice(player, target_number=dice_target, action_description="redningskast"):
                print(f"✅ {player.name} klarer redningskastet og kan spille videre!")
                return True
            else:
                print(f"🤮 {player.name} kaster opp!")
                self.handle_vomiting(player)
                return False
        
        return True  # Ingen redningskast nødvendig

    def handle_special_options(self, player):
        """Håndter spesielle alternativer for spilleren"""
        print(f"\n🔮 Spesielle alternativer for {player.name}:")
        print("1. Bytt 2 kort mot 1 nytt kort")
        print("2. Send vekk venn")
        print("0. Tilbake til hovedmenyen")
        
        choice = input("Velg alternativ: ")
        
        if choice == "1":
            self.handle_card_trade(player)
        elif choice == "2":
            self.handle_send_away_venn(player)
        elif choice == "0":
            print("Tilbake til hovedmenyen...")
            return
        else:
            print("❌ Ugyldig valg!")
            self.handle_special_options(player)

    def handle_card_trade(self, player):
        """Håndter kort-byttemekanisme: 2 kort mot 1 nytt"""
        if len(player.hand) < 2:
            print("❌ Du må ha minst 2 kort for å bytte!")
            return
        
        print(f"\n🔄 {player.name} bytter 2 kort mot 1 nytt kort!")
        
        # Velg første kort å kaste
        print(f"\n📋 Hånden din:")
        for i, card in enumerate(player.hand, 1):
            print(f"  {i}. {card.name} - {card.display_text}")
        
        while True:
            try:
                choice1 = int(input(f"\n🎯 Velg første kort å kaste (nummer): "))
                if 1 <= choice1 <= len(player.hand):
                    break
                else:
                    print("❌ Ugyldig valg!")
            except ValueError:
                print("❌ Vennligst skriv inn et tall!")
        
        # Velg andre kort å kaste
        print(f"\n📋 Hånden din (uten det valgte kortet):")
        for i, card in enumerate(player.hand, 1):
            if i != choice1:
                print(f"  {i}. {card.name} - {card.display_text}")
        
        while True:
            try:
                choice2 = int(input(f"\n🎯 Velg andre kort å kaste (nummer): "))
                if 1 <= choice2 <= len(player.hand) and choice2 != choice1:
                    break
                else:
                    print("❌ Ugyldig valg!")
            except ValueError:
                print("❌ Vennligst skriv inn et tall!")
        
        # Kaste de valgte kortene
        card1 = player.hand.pop(choice1 - 1)
        if choice2 > choice1:
            choice2 -= 1  # Juster indeks etter første pop
        card2 = player.hand.pop(choice2 - 1)
        
        print(f"🗑️ {player.name} kaster {card1.name} og {card2.name}")
        
        # Trekke 3 tilfeldige kort fra bunken
        available_cards = [card for card in self.deck if card not in player.hand]
        if len(available_cards) < 3:
            print("❌ Ikke nok kort i bunken for å bytte!")
            # Legg tilbake kortene
            player.hand.append(card1)
            player.hand.append(card2)
            return
        
        import random
        random.shuffle(available_cards)
        new_cards = available_cards[:3]
        
        print(f"\n🎲 Trekker 3 tilfeldige kort...")
        self.long_delay()
        
        print(f"\n🃏 Velg et av disse kortene:")
        for i, card in enumerate(new_cards, 1):
            print(f"  {i}. {card.name} - {card.display_text}")
        
        while True:
            try:
                choice = int(input(f"\n🎯 Velg kort (1-3): "))
                if 1 <= choice <= 3:
                    break
                else:
                    print("❌ Ugyldig valg!")
            except ValueError:
                print("❌ Vennligst skriv inn et tall!")
        
        # Legge det nye kortet til hånden
        new_card = new_cards[choice - 1]
        player.hand.append(new_card)
        
        print(f"✅ {player.name} får {new_card.name}!")
        
        # Legge de andre kortene tilbake i bunken
        for card in new_cards:
            if card != new_card:
                self.deck.append(card)

    def handle_send_away_venn(self, player):
        """Håndter 'Send vekk venn' mekanismen"""
        if not player.npcs:
            print("❌ Du har ingen NPC-er å sende vekk!")
            return
        
        if not player.hand:
            print("❌ Du må ha minst 1 kort for å sende vekk en venn!")
            return
        
        print(f"\n👋 {player.name} vil sende vekk en venn!")
        
        # Velg kort å kaste bort
        print(f"\n📋 Hånden din:")
        for i, card in enumerate(player.hand, 1):
            print(f"  {i}. {card.name} - {card.display_text}")
        
        while True:
            try:
                card_choice = int(input(f"\n🎯 Velg kort å kaste bort (nummer): "))
                if 1 <= card_choice <= len(player.hand):
                    break
                else:
                    print("❌ Ugyldig valg!")
            except ValueError:
                print("❌ Vennligst skriv inn et tall!")
        
        # Kaste det valgte kortet
        discarded_card = player.hand.pop(card_choice - 1)
        print(f"🗑️ {player.name} kaster {discarded_card.name}")
        
        # Velg NPC å sende vekk
        print(f"\n👥 Dine NPC-er:")
        for i, npc in enumerate(player.npcs, 1):
            print(f"  {i}. {npc.name} - {npc.display_text}")
        
        while True:
            try:
                npc_choice = int(input(f"\n🎯 Velg NPC å sende vekk (nummer): "))
                if 1 <= npc_choice <= len(player.npcs):
                    break
                else:
                    print("❌ Ugyldig valg!")
            except ValueError:
                print("❌ Vennligst skriv inn et tall!")
        
        # Fjern NPC-en fra spilleren
        npc_to_send = player.npcs.pop(npc_choice - 1)
        print(f"👋 {player.name} sender vekk {npc_to_send.name}!")
        
        # Spilleren må kaste ferdighetskast for å sende vekk
        print(f"\n🎲 {player.name} må kaste 4+ for å sende vekk {npc_to_send.name}!")
        if self.roll_dice(player, target_number=4, action_description="å sende vekk venn"):
            print(f"✅ {player.name} klarte å sende vekk {npc_to_send.name}!")
            self.handle_npc_auction(npc_to_send, player)
        else:
            print(f"❌ {player.name} klarte ikke å sende vekk {npc_to_send.name}!")
            print(f"😔 {npc_to_send.name} kommer tilbake til {player.name}!")
            # Legg NPC-en tilbake til spilleren
            player.add_npc(npc_to_send)

    def handle_npc_auction(self, npc, sender):
        """Håndter auksjon hvor spillere kaster for å få NPC-en"""
        print(f"\n🏆 AUKSJON FOR {npc.name.upper()}!")
        print(f"Alle spillere (unntatt {sender.name}) kaster ferdighetskast!")
        print(f"Den som får lavest kast får {npc.name}!")
        self.long_delay()
        
        # Finn spillere som kan delta (alle unntatt senderen)
        eligible_players = [p for p in self.players if p != sender]
        
        if not eligible_players:
            print(f"😔 Ingen andre spillere kan få {npc.name}!")
            print(f"🗑️ {npc.name} forsvinner...")
            return
        
        round_number = 1
        while True:
            print(f"\n{'='*50}")
            print(f"🎲 RUNDE {round_number} - AUKSJON FOR {npc.name}")
            print(f"{'='*50}")
            
            # Alle spillere kaster
            rolls = []
            for player in eligible_players:
                print(f"\n🎲 {player.name} kaster ferdighetskast...")
                self.long_delay()
                self.loading_effect("Terningen ruller...")
                
                # Bruk roll_dice for ferdighetskast (William's bonus gjelder)
                base_roll = random.randint(1, 6)
                bonus = player.get_dice_bonus()
                
                # Sjekk for William's skill_bonus
                skill_bonus = 0
                for npc_obj in player.npcs:
                    if "skill_bonus" in npc_obj.effects:
                        skill_bonus += npc_obj.effects["skill_bonus"]
                        print(f"🏆 {npc_obj.name} gir {npc_obj.effects['skill_bonus']} bonus på ferdighetskast!")
                
                total_roll = base_roll + bonus + skill_bonus
                if skill_bonus > 0:
                    print(f"🎲 {player.name} kastet: {base_roll} + {bonus} + {skill_bonus} = {total_roll}")
                else:
                    print(f"🎲 {player.name} kastet: {base_roll} + {bonus} = {total_roll}")
                
                rolls.append((player, total_roll))
                self.quick_delay()
            
            # Vis resultater
            print(f"\n📊 RESULTATER RUNDE {round_number}:")
            for player, roll in sorted(rolls, key=lambda x: x[1]):
                print(f"  {player.name}: {roll}")
            
            # Finn laveste kast
            min_roll = min(rolls, key=lambda x: x[1])[1]
            winners = [player for player, roll in rolls if roll == min_roll]
            
            if len(winners) == 1:
                # Vi har en vinner!
                winner = winners[0]
                print(f"\n🏆 {winner.name} vinner auksjonen med {min_roll}!")
                print(f"🎉 {winner.name} får {npc.name}!")
                
                # Gi NPC-en til vinneren
                winner.add_npc(npc)
                npc.apply_effects(winner)
                
                self.long_delay()
                break
            else:
                # Uavgjort - fortsett til neste runde
                print(f"\n🤝 Uavgjort! {len(winners)} spillere fikk {min_roll}")
                print(f"🔄 Fortsetter til neste runde...")
                eligible_players = winners
                round_number += 1
                self.long_delay()

    def handle_vomiting(self, player):
        """Håndter når en spiller kaster opp"""
        print(f"💀 {player.name} mister 50% av minnepoengene sine!")
        print(f"🤮 {player.name} mister 1 promille på grunn av å kaste opp!")
        
        # Beregn 50% tap av minnepoeng
        memory_loss = int(player.memory * 0.5)
        player.add_memory(-memory_loss)
        
        # Mister 1 promille
        player.add_promille(-1)
        
        print(f"😢 {player.name} mistet {memory_loss} minnepoeng og har nå {player.memory} minnepoeng.")
        
        # Spilleren må kaste et valgfritt kort
        if player.hand:
            print(f"\n🗑️ {player.name} må kaste et kort på grunn av å kaste opp!")
            self.discard_card_after_vomiting(player)
        
        # Alle andre spillere får 3 minnepoeng
        for other_player in self.players:
            if other_player != player:
                other_player.add_memory(3)
                print(f"🎉 {other_player.name} får 3 minnepoeng fordi {player.name} kastet opp!")
        
        self.long_delay()

    def discard_card_after_vomiting(self, player):
        """La spilleren kaste et kort etter å ha kastet opp"""
        if not player.hand:
            return
        
        print(f"\n📋 Hånden din:")
        for i, card in enumerate(player.hand, 1):
            print(f"  {i}. {card.name} - {card.display_text}")
        
        if player.is_human:
            while True:
                try:
                    choice = int(input(f"\n🎯 Velg kort å kaste (nummer): "))
                    if 1 <= choice <= len(player.hand):
                        break
                    else:
                        print("❌ Ugyldig valg!")
                except ValueError:
                    print("❌ Vennligst skriv inn et tall!")
        else:
            # AI-spiller velger tilfeldig kort
            import random
            choice = random.randint(1, len(player.hand))
        
        # Kaste det valgte kortet
        discarded_card = player.hand.pop(choice - 1)
        print(f"🗑️ {player.name} kaster {discarded_card.name} på grunn av å kaste opp!")

    def handle_beer_chug(self, player):
        """Håndter chug-mekanisme for øl-kort"""
        print(f"\n🍺 {player.name} har drukket en øl!")
        print("Vil du prøve å chugge ølen?")
        print("1. Chug ølen (kast 6+ for 2 minnepoeng, feil = -1 minnepoeng)")
        print("2. Feig ut (ingen risiko)")
        
        if player.is_human:
            while True:
                try:
                    choice = int(input("Velg alternativ (1-2): "))
                    if choice in [1, 2]:
                        break
                    else:
                        print("❌ Ugyldig valg! Velg 1 eller 2.")
                except ValueError:
                    print("❌ Vennligst skriv inn et tall!")
        else:
            # AI-spiller velger tilfeldig
            import random
            choice = random.randint(1, 2)
            print(f"🤖 {player.name} velger alternativ {choice}")
        
        if choice == 1:
            # Prøv å chugge
            print(f"\n🍺 {player.name} prøver å chugge ølen!")
            print("Du må kaste 6 eller høyere for å klare det!")
            
            # Sjekk for Tord's chug-bonus
            chug_bonus = 0
            for npc in player.npcs:
                if "chug_bonus" in npc.effects:
                    chug_bonus += npc.effects["chug_bonus"]
                    print(f"🏆 {npc.name} gir {npc.effects['chug_bonus']} bonus på chuggekast!")
            
            # Kast terning for chug med bonus
            self.typewriter_print(f"\n🎲 {player.name} kaster terning...")
            self.long_delay()
            self.loading_effect("Terningen ruller...")
            
            import random
            base_roll = random.randint(1, 6)
            standard_bonus = player.get_dice_bonus()
            total_result = base_roll + standard_bonus + chug_bonus
            
            print(f"🎲 {player.name} kaster terning for chugge øl: {base_roll} + {standard_bonus} + {chug_bonus} = {total_result}")
            
            if total_result >= 6:
                print(f"🏆 {player.name} klarte å chugge ølen!")
                print(f"🎉 {player.name} får 2 minnepoeng for å chugge!")
                player.add_memory(2)
            else:
                print(f"😔 {player.name} klarte ikke å chugge ølen...")
                print(f"💀 {player.name} mister 1 minnepoeng!")
                player.add_memory(-1)
        else:
            print(f"😅 {player.name} feiger ut og drikker ølen normalt.")

    def handle_bong_choice(self, player):
        """Håndter Bong-kortet hvor spilleren kan velge mellom øl, drink eller shot"""
        print(f"\n🌿 {player.name} spiller Bong-kortet!")
        print("Velg hva du vil bytte mot:")
        print("1. Øl (0.5% promille)")
        print("2. Drink (0.5% promille, 1 minnepoeng)")
        print("3. Shot (1% promille, 1 minnepoeng)")
        
        if player.is_human:
            choice = input("Velg alternativ (1-3): ")
        else:
            # AI-spiller velger tilfeldig
            import random
            choice = str(random.randint(1, 3))
            print(f"🤖 {player.name} velger alternativ {choice}")
        
        # Finn det valgte kortet og spill det
        chosen_card = None
        if choice == "1":
            print(f"🍺 {player.name} velger øl!")
            chosen_card = self.find_card_by_name("Drikk en øl")
        elif choice == "2":
            print(f"🍹 {player.name} velger drink!")
            chosen_card = self.find_card_by_name("Drikk en drink")
        elif choice == "3":
            print(f"🥃 {player.name} velger shot!")
            chosen_card = self.find_card_by_name("Shot")
        else:
            print("Ugyldig valg, velger øl som standard.")
            chosen_card = self.find_card_by_name("Drikk en øl")
        
        if chosen_card:
            # Spill det valgte kortet med alle regler og effekter
            chosen_card.play(player, self.current_place, self)

    def handle_round_drinks(self, player):
        """Håndter 'Ta en runde' kortet hvor alle får øl-effekt og kan chugge"""
        print(f"\n🍻 {player.name} spiller 'Ta en runde'!")
        print("Alle spillere får øl-effekt og kan velge å chugge!")
        
        # Finn øl-kortet
        beer_card = self.find_card_by_name("Drikk en øl")
        if not beer_card:
            print("Feil: Kunne ikke finne øl-kortet!")
            return
        
        # Gå gjennom alle spillere
        for p in self.players:
            print(f"\n{'='*40}")
            print(f"🍺 {p.name.upper()} SIN TUR")
            print(f"{'='*40}")
            
            # Spill øl-kortet for spilleren (med alle regler og effekter)
            beer_card.play(p, self.current_place, self)
            
            self.long_delay()
        
        print(f"\n🍻 Runden er ferdig! Alle har fått øl-effekt.")

    def handle_icing(self, player):
        """Håndter Ice'ing kortet hvor alle kaster terning og matcher får ice"""
        print(f"\n🧊 {player.name} spiller Ice'ing!")
        print("Alle spillere kaster terning. De som matcher får ice (+0.5% promille)!")
        
        # Spilleren kaster først (kun standard promille-bonus, ikke ferdighetskast)
        print(f"\n🎲 {player.name} kaster terning...")
        self.long_delay()
        self.loading_effect("Terningen ruller...")
        
        import random
        base_roll = random.randint(1, 6)
        bonus = player.get_dice_bonus()  # Kun standard promille-bonus
        
        player_roll = base_roll + bonus
        print(f"🎲 {player.name} kastet: {base_roll} + {bonus} = {player_roll}")
        
        # Alle andre spillere kaster (kun standard promille-bonus)
        matches = 0
        for other_player in self.players:
            if other_player != player:
                print(f"\n🎲 {other_player.name} kaster terning...")
                self.long_delay()
                self.loading_effect("Terningen ruller...")
                
                other_base_roll = random.randint(1, 6)
                other_bonus = other_player.get_dice_bonus()  # Kun standard promille-bonus
                
                other_roll = other_base_roll + other_bonus
                print(f"🎲 {other_player.name} kastet: {other_base_roll} + {other_bonus} = {other_roll}")
                
                if abs(other_roll - player_roll) <= 1:
                    print(f"🧊 {other_player.name} matcher! Får ice (+0.5% promille)!")
                    other_player.add_promille(0.5)
                    matches += 1
                else:
                    print(f"❄️ {other_player.name} matcher ikke.")
        
        # Spilleren får minnepoeng basert på antall matches
        if matches > 0:
            print(f"\n🎉 {player.name} får {matches} minnepoeng fordi {matches} spillere matchet!")
            player.add_memory(matches)
        else:
            print(f"\n😔 Ingen matchet {player.name}s kast. Ingen minnepoeng.")
        
        self.long_delay()

    def find_card_by_name(self, card_name):
        """Finn et kort basert på navn"""
        for card in self.cards:
            if card.name == card_name:
                return card
        return None

    def check_npc_turn_effects(self, player):
        """Sjekk NPC-effekter som påvirker om spilleren kan spille denne runden"""
        for npc in player.npcs:
            if "dring_effect" in npc.effects:
                return self.handle_dring_effect(player, npc)
        return True  # Ingen NPC-effekter som blokkerer turen

    def handle_dring_effect(self, player, dring_npc):
        """Håndter Dring NPC-effekten"""
        print(f"\n🍺 {player.name} er dringa!")
        print(f"Du må kaste 3 eller høyere for å kunne spille denne runden!")
        self.long_delay()
        
        # Kast terning
        if self.roll_dice(player, target_number=3, action_description="å kunne spille"):
            print(f"✅ {player.name} kan spille denne runden!")
            return True
        else:
            print(f"❌ {player.name} må stå over runden!")
            print(f"Du må kaste bort et kort uten å få effekt av det.")
            
            # Vis kort på hånden
            print(f"\n📋 Hånden din:")
            for idx, card in enumerate(player.hand):
                if card.display_text:
                    print(f"  {idx+1}. {card.name} - {card.display_text}")
                else:
                    print(f"  {idx+1}. {card.name}")
            
            # La spilleren velge kort å kaste
            if player.is_human:
                while True:
                    choice = input(f"\n🎯 Velg kort å kaste (nummer): ")
                    if choice.isdigit() and 1 <= int(choice) <= len(player.hand):
                        card_idx = int(choice) - 1
                        discarded_card = player.hand.pop(card_idx)
                        print(f"🗑️ {player.name} kaster {discarded_card.name} uten effekt!")
                        return False
                    else:
                        print("❌ Ugyldig valg. Prøv igjen.")
            else:
                # AI-spiller velger tilfeldig kort
                card_idx = random.randint(0, len(player.hand) - 1)
                discarded_card = player.hand.pop(card_idx)
                print(f"🗑️ {player.name} kaster {discarded_card.name} uten effekt!")
                return False

    def end_game(self):
        """Avslutt spillet og vis resultater"""
        print(f"\n{'='*50}")
        self.typewriter_print(f"🏁 SPILLET ER SLUTT!")
        print(f"{'='*50}")
        self.long_delay()
        
        self.typewriter_print(f"\n📊 ENDELIG RESULTAT:")
        print(f"{'Spiller':<12} {'Minner':<7} {'Promille':<8} {'Status'}")
        print("-" * 40)
        
        for player in self.players:
            status = "🏆 VINNER!" if player.memory == max(p.memory for p in self.players) else "💀 Taper"
            self.typewriter_print(f"{player.name:<12} {player.memory:<7} {player.promille:<8.1f} {status}")
            self.quick_delay()
        
        # Finn vinneren
        winner = max(self.players, key=lambda p: p.memory)
        self.long_delay()
        self.typewriter_print(f"\n🎉 GRATULERER {winner.name.upper()}! 🎉")
        self.typewriter_print(f"🏆 Du vant med {winner.memory} minnepoeng! 🏆")
        print(f"{'='*50}")
