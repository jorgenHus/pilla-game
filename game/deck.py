# game/deck.py
from .card import Card

def create_deck():
    """Lag en enkel demo-deck med kort og effektfunksjoner"""
    deck = [
        Card("Drikk en øl", promille_change=0.5),
        Card("Drikk vann", promille_change=-0.5),
        Card("Karaoke", minne_change=1),
    ] * 5  # 5 kopier av hver for demo
    import random
    random.shuffle(deck)
    return deck
