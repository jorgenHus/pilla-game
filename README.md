# SMØR: Sjefen og Sårds ølduell

Et tekstbasert kortspill som simulerer en natt ut med vors, fest og nach. Spillere samler minner og prøver å unngå å bli slått ut av høy promille.

## Struktur

```
smor/
│
├── main.py            # Oppstart og meny
├── game/
│   ├── __init__.py
│   ├── engine.py      # Hovedspill-motoren (runde/faser)
│   ├── player.py      # Player-klassen (promille, minner, hånd osv.)
│   ├── card.py        # Kort-definisjoner og kort-logikk
│   ├── deck.py        # Trekking og blanding av kort
│   ├── npc.py         # NPC-definisjoner og effekter
│   └── place.py       # Steder (vors/fest/nach)
└── data/
    ├── cards.json     # Kort-definisjoner
    ├── npcs.json      # NPC-definisjoner
    └── places.json    # Sted-definisjoner
```

## Spillregler

### Faser

1. **Vors** - Forberedelser og første drikke
2. **Fest** - Hovedfesten med dans og drikke
3. **Nach** - Etterfest og hjemreise

### Spillmekanikk

- **Promille**: Øker når du drikker, kan føre til at du blir slått ut (>4.0)
- **Minner**: Poeng du samler for å vinne spillet
- **Kort**: Spilles for å få effekter
- **Steder**: Kan besøkes for å møte NPC-er og få effekter
- **NPC-er**: Karakterer som gir deg effekter når du møter dem

### Vinner

Spilleren med flest minner vinner spillet.

## Kjøring

```bash
python main.py
```

## Eksempel på spill

```
--- Velkommen til SMØR ---
Sjefen og Sårds ølduell
Hvor mange spillere? (maks 4): 2
Hvor mange av dem er ekte spillere? (0-3): 1
Skriv inn navn for spiller 1: Jørgen

=== Fase: VORS ===
Runde: 1

Jørgen sin tur:
Status: Promille: 0.0, Minner: 0

Hva vil du gjøre?
1. Spill et kort
2. Gå til et sted
3. Se hånden din
```

## Utvidelser

Spillet kan enkelt utvides ved å:

- Legge til nye kort i `data/cards.json`
- Legge til nye NPC-er i `data/npcs.json`
- Legge til nye steder i `data/places.json`
- Modifisere spillregler i `game/engine.py`

## Tekniske detaljer

- **Python 3.7+** påkrevd
- **JSON** for data-lagring
- **Modulær arkitektur** for enkel utvidelse
- **Factory patterns** for objekt-opprettelse
