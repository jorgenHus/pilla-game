# -*- coding: utf-8 -*-
# main.py

import json
from game.player import Player
from game.card import Card
from game.place import Place
from game.engine import GameEngine

def setup_players():
    """Opprett spillere basert på bruker-input"""
    print("\n--- Velkommen til SMØR ---")
    print("Sjefen og Sårds ølduell")
    
    # Få antall spillere
    while True:
        try:
            num_players = int(input("\nHvor mange spillere? (maks 4): "))
            if 1 <= num_players <= 4:
                break
            else:
                print("Vennligst velg mellom 1 og 4 spillere.")
        except ValueError:
            print("Vennligst skriv inn et tall.")
    
    # Få antall ekte spillere
    while True:
        try:
            num_humans = int(input(f"Hvor mange av disse er ekte spillere? (0-{num_players}): "))
            if 0 <= num_humans <= num_players:
                break
            else:
                print(f"Vennligst velg mellom 0 og {num_players} ekte spillere.")
        except ValueError:
            print("Vennligst skriv inn et tall.")
    
    players = []
    
    # Opprett ekte spillere
    for i in range(num_humans):
        while True:
            name = input(f"Skriv inn navn for spiller {i+1}: ").strip()
            if name:
                players.append(Player(name, is_human=True))
                break
            else:
                print("Navnet kan ikke være tomt.")
    
    # Opprett AI-spillere
    for i in range(num_players - num_humans):
        players.append(Player(f"AI_{i+1}", is_human=False))
    
    return players

def main():
    """Hovedfunksjonen"""
    try:
        # ---- Les inn data ----
        with open("data/places.json", encoding='utf-8') as f:
            places_data = json.load(f)

        with open("data/cards.json", encoding='utf-8') as f:
            cards_data = json.load(f)

        with open("data/npcs.json", encoding='utf-8') as f:
            npcs_data = json.load(f)

        # ---- Lag objekter ----
        places = [Place(p["name"], p.get("effects"), p.get("displayText", ""), p.get("effectDescriptions", {}), p.get("hasBouncer", False)) for p in places_data]
        cards = [Card(c["name"], c.get("promille_change",0), c.get("minne_change",0), c.get("special_effect"), c.get("displayText", "")) for c in cards_data]

        # ---- Opprett spillere ----
        players = setup_players()
        
        print(f"\nSpillere: {', '.join([p.name for p in players])}")

        # ---- Start spillmotor ----
        game = GameEngine(players, places, cards, npcs_data)
        game.start_game()
        
    except KeyboardInterrupt:
        print("\n\nSpillet ble avbrutt.")
    except Exception as e:
        print(f"\nEn feil oppstod: {e}")

if __name__ == "__main__":
    main()
