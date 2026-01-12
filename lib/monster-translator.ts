export interface MonsterTranslation {
    name: string;
    type: string;
}

export const MONSTER_TYPES: Record<string, string> = {
    "Aberration": "Aberração",
    "Beast": "Fera",
    "Celestial": "Celestial",
    "Construct": "Constructo",
    "Dragon": "Dragão",
    "Elemental": "Elemental",
    "Fey": "Fada",
    "Fiend": "Fiande", // Ou "Corruptor", "Infernal" - mantendo consistência com o que vi em monsters-data.ts
    "Giant": "Gigante",
    "Humanoid": "Humanoide",
    "Monstrosity": "Monstruosidade",
    "Ooze": "Limo",
    "Plant": "Planta",
    "Undead": "Morto-vivo",
    "Swarm of Tiny Beasts": "Enxame de Bestas Minúsculas",
};

export const MONSTER_NAMES: Record<string, string> = {
    "Aboleth": "Aboleth",
    "Abominable Yeti": "Yeti Abominável",
    "Acolyte": "Acólito",
    "Adult Black Dragon": "Dragão Preto Adulto",
    "Adult Blue Dragon": "Dragão Azul Adulto",
    "Adult Brass Dragon": "Dragão de Latão Adulto",
    "Adult Bronze Dragon": "Dragão de Bronze Adulto",
    "Adult Copper Dragon": "Dragão de Cobre Adulto",
    "Adult Gold Dragon": "Dragão de Ouro Adulto",
    "Adult Green Dragon": "Dragão Verde Adulto",
    "Adult Red Dragon": "Dragão Vermelho Adulto",
    "Adult Silver Dragon": "Dragão de Prata Adulto",
    "Adult White Dragon": "Dragão Branco Adulto",
    "Air Elemental": "Elemental do Ar",
    "Allosaurus": "Alossauro",
    "Ancient Black Dragon": "Dragão Preto Ancião",
    "Ancient Blue Dragon": "Dragão Azul Ancião",
    "Ancient Brass Dragon": "Dragão de Latão Ancião",
    "Ancient Bronze Dragon": "Dragão de Bronze Ancião",
    "Ancient Copper Dragon": "Dragão de Cobre Ancião",
    "Ancient Gold Dragon": "Dragão de Ouro Ancião",
    "Ancient Green Dragon": "Dragão Verde Ancião",
    "Ancient Red Dragon": "Dragão Vermelho Ancião",
    "Ancient Silver Dragon": "Dragão de Prata Ancião",
    "Ancient White Dragon": "Dragão Branco Ancião",
    "Androsphinx": "Androsfinge",
    "Animated Armor": "Armadura Animada",
    "Ankheg": "Ankheg",
    "Ankylosaurus": "Anquilossauro",
    "Ape": "Macaco",
    "Archmage": "Arquimago",
    "Assassin": "Assassino",
    "Awakened Shrub": "Arbusto Desperto",
    "Awakened Tree": "Árvore Desperta",
    "Axe Beak": "Bico de Machado",
    "Azer": "Azer",
    "Baboon": "Babuíno",
    "Badger": "Texugo",
    "Balor": "Balor",
    "Bandit": "Bandido",
    "Bandit Captain": "Capitão Bandido",
    "Banshee": "Banshee",
    "Barbed Devil": "Diabo Farpado",
    "Basilisk": "Basilisco",
    "Bat": "Morcego",
    "Bearded Devil": "Diabo Barbado",
    "Behir": "Behir",
    "Beholder": "Observador",
    "Berserker": "Berserker",
    "Black Bear": "Urso Preto",
    "Black Dragon Wyrmling": "Dragão Preto Jovem (Wyrmling)",
    "Black Pudding": "Pudim Negro",
    "Blink Dog": "Cão Intermitente",
    "Blood Hawk": "Falcão de Sangue",
    "Blue Dragon Wyrmling": "Dragão Azul Jovem (Wyrmling)",
    "Boar": "Javali",
    "Bone Devil": "Diabo dos Ossos",
    "Bone Naga": "Naga de Osso",
    "Brass Dragon Wyrmling": "Dragão de Latão Jovem (Wyrmling)",
    "Bronze Dragon Wyrmling": "Dragão de Bronze Jovem (Wyrmling)",
    "Brown Bear": "Urso Marrom",
    "Bugbear": "Bugbear",
    "Bulette": "Bulette",
    "Camel": "Camelo",
    "Carrion Crawler": "Verme da Carniça",
    "Cat": "Gato",
    "Centaur": "Centauro",
    "Chain Devil": "Diabo das Correntes",
    "Chimera": "Quimera",
    "Chuul": "Chuul",
    "Clay Golem": "Golem de Barro",
    "Cloaker": "Manto",
    "Cloud Giant": "Gigante das Nuvens",
    "Cockatrice": "Cocatrice",
    "Commoner": "Plebeu",
    "Constrictor Snake": "Cobra Constritora",
    "Copper Dragon Wyrmling": "Dragão de Cobre Jovem (Wyrmling)",
    "Couatl": "Couatl",
    "Crab": "Caranguejo",
    "Crocodile": "Crocodilo",
    "Cult Fanatic": "Fanático do Culto",
    "Cultist": "Cultista",
    "Cyclops": "Ciclope",
    "Darkmantle": "Manto Negro",
    "Death Dog": "Cão da Morte",
    "Deep Gnome (Svirfneblin)": "Gnomo das Profundezas (Svirfneblin)",
    "Deer": "Veado",
    "Deva": "Deva",
    "Dire Wolf": "Lobo Atroz",
    "Displacer Beast": "Besta Deslocadora",
    "Djinni": "Djinni",
    "Doppelganger": "Doppelganger",
    "Draft Horse": "Cavalo de Tração",
    "Dragon Turtle": "Tartaruga Dragão",
    "Dretch": "Dretch",
    "Drider": "Drider",
    "Drow": "Drow",
    "Druid": "Druida",
    "Dryad": "Dríade",
    "Duergar": "Duergar",
    "Dust Mephit": "Mephit de Poeira",
    "Eagle": "Águia",
    "Earth Elemental": "Elemental da Terra",
    "Efreeti": "Efreeti",
    "Elephant": "Elefante",
    "Elk": "Alce",
    "Erinyes": "Erínias",
    "Ettercap": "Ettercap",
    "Ettin": "Ettin",
    "Fire Elemental": "Elemental do Fogo",
    "Fire Giant": "Gigante do Fogo",
    "Flesh Golem": "Golem de Carne",
    "Flying Snake": "Cobra Voadora",
    "Flying Sword": "Espada Voadora",
    "Fomorian": "Fomoriano",
    "Frog": "Sapo",
    "Frost Giant": "Gigante do Gelo",
    "Gargoyle": "Gárgula",
    "Gelatinous Cube": "Cubo Gelatinoso",
    "Ghast": "Livido",
    "Ghost": "Fantasma",
    "Ghoul": "Carniçal",
    "Giant Ape": "Macaco Gigante",
    "Giant Badger": "Texugo Gigante",
    "Giant Bat": "Morcego Gigante",
    "Giant Boar": "Javali Gigante",
    "Giant Centipede": "Centopeia Gigante",
    "Giant Constrictor Snake": "Cobra Constritora Gigante",
    "Giant Crab": "Caranguejo Gigante",
    "Giant Crocodile": "Crocodilo Gigante",
    "Giant Eagle": "Águia Gigante",
    "Giant Elk": "Alce Gigante",
    "Giant Fire Beetle": "Besouro de Fogo Gigante",
    "Giant Frog": "Sapo Gigante",
    "Giant Goat": "Cabra Gigante",
    "Giant Hyena": "Hiena Gigante",
    "Giant Lizard": "Lagarto Gigante",
    "Giant Octopus": "Polvo Gigante",
    "Giant Owl": "Coruja Gigante",
    "Giant Poisonous Snake": "Cobra Venenosa Gigante",
    "Giant Rat": "Rato Gigante",
    "Giant Scorpion": "Escorpião Gigante",
    "Giant Sea Horse": "Cavalo Marinho Gigante",
    "Giant Shark": "Tubarão Gigante",
    "Giant Spider": "Aranha Gigante",
    "Giant Toad": "Sapo Gigante",
    "Giant Vulture": "Abutre Gigante",
    "Giant Wasp": "Vespa Gigante",
    "Giant Weasel": "Doninha Gigante",
    "Giant Wolf Spider": "Aranha Lobo Gigante",
    "Gibbering Mouther": "Boca Balbuciante",
    "Girallon": "Girallon",
    "Girallon Zombie": "Zumbi Girallon",
    "Glabrezu": "Glabrezu",
    "Gladiator": "Gladiador",
    "Gnoll": "Gnoll",
    "Goat": "Cabra",
    "Goblin": "Goblin",
    "Gold Dragon Wyrmling": "Dragão de Ouro Jovem (Wyrmling)",
    "Gorgon": "Górgona",
    "Gray Ooze": "Limo Cinzento",
    "Green Dragon Wyrmling": "Dragão Verde Jovem (Wyrmling)",
    "Green Hag": "Bruxa Verde",
    "Grick": "Grick",
    "Grick Alpha": "Grick Alfa",
    "Griffon": "Grifo",
    "Grimlock": "Grimlock",
    "Guard": "Guarda",
    "Guardian Naga": "Naga Guardiã",
    "Gynosphinx": "Ginosfinge",
    "Half-Red Dragon Veteran": "Veterano Meio-Dragão Vermelho",
    "Harengon": "Harengon",
    "Harengon brigand": "Bandido Harengon",
    "Harpy": "Harpia",
    "Hawk": "Falcão",
    "Hell Hound": "Cão Infernal",
    "Hezrou": "Hezrou",
    "Hill Giant": "Gigante das Colinas",
    "Hippogriff": "Hipogrifo",
    "Hobgoblin": "Hobgoblin",
    "Hobgoblin Captain": "Capitão Hobgoblin",
    "Hobgoblin Warlord": "Senhor da Guerra Hobgoblin",
    "Homunculus": "Homúnculo",
    "Horned Devil": "Diabo Chifrudo",
    "Hunter Shark": "Tubarão Caçador",
    "Hydra": "Hidra",
    "Hyena": "Hiena",
    "Ice Devil": "Diabo do Gelo",
    "Ice Mephit": "Mephit de Gelo",
    "Imp": "Diabrete",
    "Incubus": "Íncubo",
    "Invisible Stalker": "Espreitador Invisível",
    "Iron Golem": "Golem de Ferro",
    "Jackal": "Chacal",
    "Killer Whale": "Baleia Assassina",
    "Knight": "Cavaleiro",
    "Kobold": "Kobold",
    "Kraken": "Kraken",
    "Lamia": "Lamia",
    "Lemure": "Lêmure",
    "Lich": "Lich",
    "Lion": "Leão",
    "Lizard": "Lagarto",
    "Lizardfolk": "Povo Lagarto",
    "Mage": "Mago",
    "Magma Mephit": "Mephit de Magma",
    "Magmin": "Magmin",
    "Mammoth": "Mamute",
    "Manticore": "Mantícora",
    "Marilith": "Marilith",
    "Mastiff": "Mastim",
    "Medusa": "Medusa",
    "Merfolk": "Sereiano",
    "Merrow": "Merrow",
    "Mimic": "Mímico",
    "Minotaur": "Minotauro",
    "Minotaur Skeleton": "Minotauro Esqueleto",
    "Mule": "Mula",
    "Mummy": "Múmia",
    "Mummy Lord": "Lorde Múmia",
    "Nalfeshnee": "Nalfeshnee",
    "Night Hag": "Bruxa da Noite",
    "Nightmare": "Pesadelo",
    "Noble": "Nobre",
    "Nothic": "Nothic",
    "Nycaloth": "Nycaloth",
    "Ochre Jelly": "Gelatina Ocre",
    "Octopus": "Polvo",
    "Ogre": "Ogro",
    "Ogre Zombie": "Ogro Zumbi",
    "Oni": "Oni",
    "Orc": "Orc",
    "Orc War Chief": "Chefe de Guerra Orc",
    "Otyugh": "Otyugh",
    "Owl": "Coruja",
    "Owlbear": "Urso-Coruja",
    "Panther": "Pantera",
    "Pegasus": "Pégaso",
    "Peryton": "Peryton",
    "Phase Spider": "Aranha de Fase",
    "Pit Fiend": "Diabo das Profundezas",
    "Planetar": "Planetário",
    "Plesiosaurus": "Plesiossauro",
    "Poisonous Snake": "Cobra Venenosa",
    "Polar Bear": "Urso Polar",
    "Pony": "Pônei",
    "Priest": "Sacerdote",
    "Pseudodragon": "Pseudodragão",
    "Purple Worm": "Verme Púrpura",
    "Quasit": "Quasit",
    "Quipper": "Quipper",
    "Rakshasa": "Rakshasa",
    "Rat": "Rato",
    "Raven": "Corvo",
    "Red Dragon Wyrmling": "Dragão Vermelho Jovem (Wyrmling)",
    "Reef Shark": "Tubarão de Recife",
    "Remorhaz": "Remorhaz",
    "Revenant": "Revenant",
    "Rhinoceros": "Rinoceronte",
    "Riding Horse": "Cavalo de Montaria",
    "Roc": "Roca",
    "Roper": "Roper",
    "Rug of Smothering": "Tapete Sufocante",
    "Rust Monster": "Monstro da Ferrugem",
    "Saber-Toothed Tiger": "Tigre Dentes-de-Sabre",
    "Sahuagin": "Sahuagin",
    "Salamander": "Salamandra",
    "Satyr": "Sátiro",
    "Scorpion": "Escorpião",
    "Scout": "Batedor",
    "Sea Hag": "Bruxa do Mar",
    "Sea Horse": "Cavalo Marinho",
    "Shadow": "Sombra",
    "Shambling Mound": "Montículo Errante",
    "Shield Guardian": "Guardião Escudo",
    "Shrieker": "Guinchador",
    "Silver Dragon Wyrmling": "Dragão de Prata Jovem (Wyrmling)",
    "Skeleton": "Esqueleto",
    "Slaad": "Slaad",
    "Solar": "Solar",
    "Specter": "Espectro",
    "Spider": "Aranha",
    "Spirit Naga": "Naga Espiritual",
    "Sprite": "Sprite",
    "Spy": "Espião",
    "Steam Mephit": "Mephit de Vapor",
    "Stirge": "Estirge",
    "Stone Giant": "Gigante de Pedra",
    "Stone Golem": "Golem de Pedra",
    "Storm Giant": "Gigante da Tempestade",
    "Succubus/Incubus": "Súcubo/Íncubo",
    "Swarm of Bats": "Enxame de Morcegos",
    "Swarm of Insects": "Enxame de Insetos",
    "Swarm of Poisonous Snakes": "Enxame de Cobras Venenosas",
    "Swarm of Quippers": "Enxame de Quippers",
    "Swarm of Rats": "Enxame de Ratos",
    "Swarm of Ravens": "Enxame de Corvos",
    "Tarrasque": "Tarrasque",
    "Thug": "Bandido",
    "Tiger": "Tigre",
    "Treant": "Ente",
    "Tribal Warrior": "Guerreiro Tribal",
    "Triceratops": "Tricerátops",
    "Troll": "Troll",
    "Tyrannosaurus Rex": "Tiranossauro Rex",
    "Unicorn": "Unicórnio",
    "Vampire": "Vampiro",
    "Vampire Spawn": "Cria Vampírica",
    "Veteran": "Veterano",
    "Violet Fungus": "Fungo Violeta",
    "Vrock": "Vrock",
    "Vulture": "Abutre",
    "Warhorse": "Cavalo de Guerra",
    "Warhorse Skeleton": "Cavalo de Guerra Esqueleto",
    "Water Elemental": "Elemental da Água",
    "Weasel": "Doninha",
    "Werebear": "Ursohomem",
    "Wereboar": "Javalihomem",
    "Wererat": "Ratohomem",
    "Weretiger": "Tigrehomem",
    "Werewolf": "Lobisomem",
    "White Dragon Wyrmling": "Dragão Branco Jovem (Wyrmling)",
    "Wight": "Cariatura",
    "Will-o'-Wisp": "Fogo Fátuo",
    "Winter Wolf": "Lobo de Inverno",
    "Wolf": "Lobo",
    "Worg": "Worg",
    "Wraith": "Aparição",
    "Wyvern": "Serpe",
    "Xorn": "Xorn",
    "Yeti": "Yeti",
    "Yochlol": "Yochlol",
    "Young Black Dragon": "Dragão Preto Jovem",
    "Young Blue Dragon": "Dragão Azul Jovem",
    "Young Brass Dragon": "Dragão de Latão Jovem",
    "Young Bronze Dragon": "Dragão de Bronze Jovem",
    "Young Copper Dragon": "Dragão de Cobre Jovem",
    "Young Gold Dragon": "Dragão de Ouro Jovem",
    "Young Green Dragon": "Dragão Verde Jovem",
    "Young Red Dragon": "Dragão Vermelho Jovem",
    "Young Silver Dragon": "Dragão de Prata Jovem",
    "Young White Dragon": "Dragão Branco Jovem",
    "Zombie": "Zumbi",
    "Zombie Cat": "Gato Zumbi",
    "Zombie Horse": "Cavalo Zumbi",
    "Zombie Rat": "Rato Zumbi",
    "Zombie Snake": "Cobra Zumbi"
};

const ADJECTIVES: Record<string, string> = {
    "Black": "Preto",
    "Blue": "Azul",
    "Brass": "de Latão",
    "Bronze": "de Bronze",
    "Copper": "de Cobre",
    "Gold": "de Ouro",
    "Green": "Verde",
    "Red": "Vermelho",
    "Silver": "de Prata",
    "White": "Branco",
    "Amethyst": "de Ametista",
    "Crystal": "de Cristal",
    "Emerald": "de Esmeralda",
    "Sapphire": "de Safira",
    "Topaz": "de Topázio",
    "Moonstone": "da Pedra da Lua",
    "Solar": "Solar",
    "Time": "do Tempo",
    "Deep": "Profundo",
    "Giant": "Gigante",
    "Awakened": "Desperto",
    "Skeletal": "Esqueleto",
    "Spectral": "Espectral",
    "Common": "Comum",
    "Greater": "Maior",
    "Lesser": "Menor",
    "Dire": "Atroz",
    "Polar": "Polar",
    "Spotted": "Malhado",
    "Cloud": "das Nuvens",
    "Fire": "do Fogo",
    "Frost": "do Gelo",
    "Hill": "das Colinas",
    "Stone": "de Pedra",
    "Storm": "da Tempestade",
    "Iron": "de Ferro",
    "Clay": "de Barro",
    "Flesh": "de Carne",
    "Air": "do Ar",
    "Earth": "da Terra",
    "Water": "da Água",
    "Flying": "Voador",
    "Invisible": "Invisível",
    "Killer": "Assassina",
    "Phase": "de Fase",
    "Violet": "Violeta",
    "Winter": "de Inverno",
    "Winged": "Alado",
    "Young": "Jovem",
    "Ancient": "Ancião",
    "Adult": "Adulto",
    "Spirit": "Espiritual",
    "Cogwork": "Mecânico",
    "Archivist": "Arquivista",
    "Corpse": "Cadáver",
    "Flower": "Flor",
    "Draconian": "Draconiano",
    "Infiltrator": "Infiltrador",
    "Hare": "Lebre",
    "Two-Headed": "de Duas Cabeças",

    "Smoke": "de Fumaça",
    "Commander": "Comandante",
    "Prophet": "Profeta",
    "Spawn": "Cria",
    "Cosmic": "Cósmico",
    "Overlord": "Suserano",
    "Hunter": "Caçador",
    "Warden": "Guardião",
    "Legendary": "Lendário",
    "Mythic": "Mítico",
    "Monstrous": "Monstruoso",
    "Fungal": "Fúngico",
    "Cursed": "Amaldiçoado",
    "Blessed": "Abençoado",
    "Enchanted": "Encantado",
    "Corrupted": "Corrompido",
    "Slime": "de Limo",
    "Magical": "Mágico",
    "Mechanical": "Mecânico",

    "Battleforce": "de Batalha",
    "Angel": "Anjo",
    "Returned": "Retornado",
    "Drifter": "Errante",

    "Tyrant": "Tirano",
    "Shadow": "Sombra",

    "Boontu": "Boontu",
    "Monkey": "Macaco",
    "Clockwork": "Mecânico",
    "Fiendish": "Infernal",
    "Auger": "Excavador",
    "Horror": "Horror",
    "Brain": "Cérebro",
    "Dragonfly": "Libélula",
    "Firemane": "Crina de Fogo",
    "Army": "do Exército",
    "Apprentice": "Aprendiz",
    "Priest": "Sacerdote",
    "Dandylion": "Dente-de-Leão",
    "Deathlock": "Morte-Eterna",

    "Elder": "Ancião",
    "Tempest": "Tempestade",
    "Dankwood": "da Floresta Sombria",
    "Screamer": "Gritador",
    "Animated": "Animado",
    "Stove": "Fogão",
    "Leech": "Sanguessuga",
    "Warrior": "Guerreiro",
    "Wraith": "Aparição",
    "Sword": "da Espada",
    "Shadowghast": "Ghast Sombrio",
    "Shator": "Shator",
    "Demodand": "Demodand",
    "Brigand": "Bandido",
    "Mind": "Mental",
    "Flayer": "Devorador",
    "Mind Flayer": "Devorador de Mentes",

    "Callous": "Cruel",
    "Cruel": "Cruel",
    "Absolved": "Absolvido",
    "Dispossessed": "Despossuído",
    "Tormented": "Atormentado",
    "Blueberry": "Mirtilo",
    "Detention": "de Detenção",
    "Bane": "da Ruína", // Bane (god) could be also just Bane
    "Talos": "de Talos",
    "Amonkhet": "de Amonkhet",
    "Kaladesh": "de Kaladesh",
    "Ravnica": "de Ravnica",
    "Theros": "de Theros",
    "Simic": "Simic",
    "Izzet": "Izzet",
    "Golgari": "Golgari",
    "Boros": "Boros",
    "Azorius": "Azorius",
    "Orzhov": "Orzhov",
    "Rakdos": "Rakdos",
    "Selesnya": "Selesnya",
    "Gruul": "Gruul",
    "Dimir": "Dimir",
    "Abyssal": "Abissal",
    "Acidic": "Ácido",
    "Aquatic": "Aquático",
    "Crystalline": "Cristalino",

    "Lunar": "Lunar",

    "Space": "do Espaço",
    "Aberrant": "Aberrante",
    "Albino": "Albino",
    "Angry": "Furioso",

};

const CREATURE_BASES: Record<string, string> = {
    "Dragon": "Dragão",
    "Bear": "Urso",
    "Boar": "Javali",
    "Rat": "Rato",
    "Wolf": "Lobo",
    "Cat": "Gato",
    "Spider": "Aranha",
    "Toad": "Sapo",
    "Frog": "Sapo",
    "Snake": "Cobra",
    "Bat": "Morcego",
    "Crab": "Caranguejo",
    "Crocodile": "Crocodilo",
    "Eagle": "Águia",
    "Elk": "Alce",
    "Goat": "Cabra",
    "Hyena": "Hiena",
    "Lizard": "Lagarto",
    "Octopus": "Polvo",
    "Owl": "Coruja",
    "Shark": "Tubarão",
    "Vulture": "Abutre",
    "Wasp": "Vespa",
    "Weasel": "Doninha",
    "Beetle": "Besouro",
    "Centipede": "Centopeia",
    "Scorpion": "Escorpião",
    "Lion": "Leão",
    "Tiger": "Tigre",
    "Badger": "Texugo",
    "Horse": "Cavalo",
    "Ape": "Macaco",
    "Seahorse": "Cavalo Marinho",
    "Archivist": "Arquivista",
    "Flower": "Flor", // Flower can be base
    "Infiltrator": "Infiltrador",
    "Hare": "Lebre",
    "Owlbear": "Urso-Coruja",
    "Berserker": "Berserker",
    "Mephit": "Mephit",
    "Aboleth": "Aboleth",
    "Kuo-toa": "Kuo-toa",
    "Quaggoth": "Quaggoth",
    "Naga": "Naga",
    "Lich": "Lich",
    "Vampire": "Vampiro",
    "Ghoul": "Carniçal",
    "Ghost": "Fantasma",
    "Harpy": "Harpia",
    "Manticore": "Mantícora",
    "Griffon": "Grifo",
    "Chimera": "Quimera",
    "Hydra": "Hidra",
    "Troll": "Troll",
    "Ogre": "Ogro",
    "Orc": "Orc",
    "Goblin": "Goblin",
    "Hobgoblin": "Hobgoblin",
    "Bugbear": "Bugbear",
    "Kobold": "Kobold",
    "Giant": "Gigante",
    "Golem": "Golem",
    "Elemental": "Elemental",
    "Demon": "Demônio",
    "Devil": "Diabo",
    "Slaad": "Slaad",
    "Dragonnel": "Dragonel",
    "Crow": "Corvo",
    "Mule": "Mula",
    "Monkey": "Macaco",
    "Mind Flayer": "Devorador de Mentes",

    "Cultist": "Cultista",
    "Wizard": "Mago",
    "Archer": "Arqueiro",
    "Knight": "Cavaleiro",
    "Zealot": "Zelote",
    "Spirit": "Espírito",
    "Overlord": "Suserano",
    "Mist": "Névoa",
    "Apparition": "Aparição",
    "Greatwyrm": "Dragão Arcaico",

    "Mummy": "Múmia",
    "Sphinx": "Esfinge",
    "Anchorite": "Anacoreta",
    "Simulacrum": "Simulacro",
    "Drone": "Drone",
    "Ballista": "Balista",
    "Library": "Biblioteca",
    "Rug": "Tapete",
    "Stove": "Fogão",
    "Leech": "Sanguessuga",
    "Tree": "Árvore",
    "Hoplite": "Hoplita",
    "Dinosaur": "Dinossauro",

};

export function translateMonster(monster: any): any {
    let name = monster.name;
    let type = monster.type;

    if (typeof name !== 'string') return monster;

    // 1. Tradução Direta (Prioridade Máxima)
    if (MONSTER_NAMES[name]) {
        name = MONSTER_NAMES[name];
    } else {
        // Tenta encontrar case-insensitive
        const nameLower = name.toLowerCase();
        const key = Object.keys(MONSTER_NAMES).find(k => k.toLowerCase() === nameLower);
        if (key) {
            name = MONSTER_NAMES[key];
        } else {
            // 2. Tradução Dinâmica (Algorítmica)
            name = translateDynamic(name);
        }
    }

    // 3. Tradução de Tipo
    if (type && typeof type === 'string') {
        if (MONSTER_TYPES[type]) {
            type = MONSTER_TYPES[type];
        } else {
            const typeLower = type.toLowerCase();
            const keyType = Object.keys(MONSTER_TYPES).find(k => k.toLowerCase() === typeLower);
            if (keyType) type = MONSTER_TYPES[keyType];
        }
    }

    return {
        ...monster,
        name: name,
        type: type
    };
}

function translateDynamic(name: string): string {
    let translated = name;

    // Helper para buscar no dicionário de adjetivos/bases de forma case-insensitive
    const getTerm = (term: string, dict: Record<string, string>) => {
        const key = Object.keys(dict).find(k => k.toLowerCase() === term.toLowerCase());
        return key ? dict[key] : null;
    };

    // 0. Caso o nome completo esteja nos dicionários (inclusive termos compostos)
    const fullTerm = getTerm(translated, CREATURE_BASES) || getTerm(translated, ADJECTIVES);
    if (fullTerm) return fullTerm;

    // Patterns

    // 0.1 Case insensitive literal lookup (redundant with fullTerm but good to have in logic flow)
    const termInsensitive = getTerm(translated, MONSTER_NAMES);
    if (termInsensitive) return termInsensitive;

    // A. TITLE Pattern: "[Name] the [Adjective]" -> "[Name] o [Adjetivo]"
    // Ex: "Alyxian the callous"
    let match = translated.match(/^(.+) the (.+)$/i);
    if (match) {
        const noun = match[1];
        const titlePart = match[2];
        const translatedTitle = getTerm(titlePart, ADJECTIVES) || translateDynamic(titlePart);
        const translatedNoun = getTerm(noun, CREATURE_BASES) || noun;

        return `${translatedNoun}, o ${translatedTitle}`;
    }

    // B. LOCATION/SOURCE Pattern: "[Creature] of [Place/Source]" -> "[Creature] de [Lugar]"
    // Ex: "Cultist of bane", "Anchorite of talos"
    match = translated.match(/^(.+) of (.+)$/i);
    if (match) {
        const base = match[1];
        const source = match[2];
        const translatedBase = getTerm(base, CREATURE_BASES) || getTerm(base, ADJECTIVES) || translateDynamic(base);

        let translatedSource = getTerm(source, ADJECTIVES) || getTerm(source, CREATURE_BASES) || translateDynamic(source);

        // Handle "of the"
        if (source.toLowerCase().startsWith("the ")) {
            const subSource = source.substring(4);
            const subTrans = getTerm(subSource, ADJECTIVES) || getTerm(subSource, CREATURE_BASES) || translateDynamic(subSource);
            return `${translatedBase} do(a) ${subTrans}`;
        }

        // Se a tradução já começar com uma preposição, não adiciona "de"
        if (/^(de|do|da|dos|das)\s/i.test(translatedSource)) {
            return `${translatedBase} ${translatedSource}`;
        }

        return `${translatedBase} de ${translatedSource}`;
    }

    // C. POSSESSIVE Pattern: "[Name]'s [Creature]" -> "[Creature] de [Name]"
    // Ex: "Acererak's Golem"
    match = translated.match(/^(.+)'s (.+)$/i);
    if (match) {
        const owner = match[1];
        const base = match[2];
        const translatedBase = getTerm(base, CREATURE_BASES) || translateDynamic(base);
        return `${translatedBase} de ${owner}`;
    }

    // "Adult [Color] Dragon" -> "Dragão [Cor] Adulto"
    match = translated.match(/^(Adult|Ancient|Young) (.+) Dragon$/i);
    if (match) {
        const age = getTerm(match[1], ADJECTIVES) || match[1];
        const color = getTerm(match[2], ADJECTIVES) || match[2];
        return `Dragão ${color} ${age}`;
    }

    // "[Color] Dragon Wyrmling" -> "Dragão [Cor] Jovem (Wyrmling)"
    match = translated.match(/^(.+) Dragon Wyrmling$/i);
    if (match) {
        const color = getTerm(match[1], ADJECTIVES) || match[1];
        return `Dragão ${color} Jovem (Wyrmling)`;
    }

    // "Giant [Creature]" -> "[Criatura] Gigante"
    match = translated.match(/^Giant (.+)$/i);
    if (match) {
        let baseTerm = match[1];
        let base = getTerm(baseTerm, CREATURE_BASES) || translateDynamic(baseTerm);
        return `${base} Gigante`;
    }

    // "Swarm of [Creature]s"
    match = translated.match(/^Swarm of (.+?)(s?)$/i);
    if (match) {
        let baseTerm = match[1];
        if (baseTerm.endsWith('s') && !match[2]) baseTerm = baseTerm.slice(0, -1);
        let base = getTerm(baseTerm, CREATURE_BASES) || getTerm(baseTerm, ADJECTIVES) || translateDynamic(baseTerm);
        return `Enxame de ${base}s`;
    }

    // "[Adjective] [Base]" -> "[Base] [Adjective]" (Generic Pattern)
    // Permite hífens e variações
    match = translated.match(/^([\w-]+) ([\w-]+)$/);
    if (match) {
        const word1 = match[1];
        const word2 = match[2];

        // Para a segunda palavra (o substantivo), preferimos o dicionário de BASES
        const base = getTerm(word2, CREATURE_BASES) || getTerm(word2, ADJECTIVES);
        // Para a primeira (o adjetivo), preferimos o dicionário de ADJETIVOS
        const adj = getTerm(word1, ADJECTIVES) || getTerm(word1, CREATURE_BASES);

        if (base && adj) {
            return `${base} ${adj}`;
        }

        // Se apenas a base for conhecida, ainda assim invertemos se parecer um adjetivo vindo antes
        if (base) {
            return `${base} ${word1}`;
        }
    }

    // 3 Words: "[Word1] [Word2] [Word3]"
    match = translated.match(/^([\w-]+) ([\w-]+) ([\w-]+)$/);
    if (match) {
        const w1 = match[1];
        const w2 = match[2];
        const w3 = match[3];

        // Tenta reconhecer um termo composto nos dois primeiros (ex: "Mind flayer prophet")
        const compound12 = getTerm(`${w1} ${w2}`, ADJECTIVES) || getTerm(`${w1} ${w2}`, CREATURE_BASES);
        const t3 = getTerm(w3, ADJECTIVES) || getTerm(w3, CREATURE_BASES);
        if (compound12 && t3) {
            return `${t3} ${compound12}`;
        }

        const t1 = getTerm(w1, ADJECTIVES) || getTerm(w1, CREATURE_BASES);
        const t2 = getTerm(w2, ADJECTIVES) || getTerm(w2, CREATURE_BASES);

        if (t1 && t2 && t3) {
            return `${t3} ${t2} ${t1}`;
        }
    }

    // "[Creature] Zombie"
    match = translated.match(/^(.+) (Zombie|Skeleton)$/i);
    if (match) {
        let baseTerm = match[1];
        let base = getTerm(baseTerm, CREATURE_BASES) || translateDynamic(baseTerm);
        const typeTerm = match[2].toLowerCase();
        const type = typeTerm === "zombie" ? "Zumbi" : "Esqueleto";
        return `${base} ${type}`;
    }

    // "Skeletal [Creature]"
    match = translated.match(/^Skeletal (.+)$/i);
    if (match) {
        let baseTerm = match[1];
        let base = getTerm(baseTerm, CREATURE_BASES) || translateDynamic(baseTerm);
        return `${base} Esqueleto`;
    }

    return translated;
}
