/**
 * Tradutor automático de magias do inglês para português (sem IA)
 * Mapeia nomes de magias, escolas, componentes e outros termos do D&D 5e
 */

import { SPELL_DESCRIPTIONS_PT } from './spell-descriptions-pt';

export interface SpellTranslation {
    name: string;
    level?: number;
    school?: string;
}

// Dicionário de traduções de nomes de magias (inglês -> português)
export const SPELL_NAMES: Record<string, string> = {
    // Cantrips (Truques)
    "Acid Splash": "Borrifada Ácida",
    "Blade Ward": "Ala de Lâmina",
    "Chill Touch": "Toque Gélido",
    "Dancing Lights": "Luzes Dançantes",
    "Druidcraft": "Druidismo",
    "Eldritch Blast": "Raio Místico",
    "Fire Bolt": "Raio de Fogo",
    "Friends": "Amigos",
    "Guidance": "Orientação",
    "Light": "Luz",
    "Mage Hand": "Mão Mágica",
    "Mending": "Consertar",
    "Message": "Mensagem",
    "Minor Illusion": "Ilusão Menor",
    "Poison Spray": "Borrifo Venenoso",
    "Prestidigitation": "Prestidigitação",
    "Produce Flame": "Produzir Chama",
    "Ray of Frost": "Raio de Gelo",
    "Resistance": "Resistência",
    "Sacred Flame": "Chama Sagrada",
    "Shillelagh": "Shillelagh",
    "Shocking Grasp": "Toque Chocante",
    "Spare the Dying": "Poupar os Moribundos",
    "Thaumaturgy": "Taumaturgia",
    "Thorn Whip": "Chicote de Espinhos",
    "True Strike": "Golpe Certeiro",
    "Vicious Mockery": "Zombaria Feroz",
    "Green-Flame Blade": "Lâmina Flamejante",

    // Nível 1
    "Alarm": "Alarme",
    "Animal Friendship": "Amizade Animal",
    "Armor of Agathys": "Armadura de Agathys",
    "Arms of Hadar": "Braços de Hadar",
    "Bane": "Perdição",
    "Bless": "Benção",
    "Burning Hands": "Mãos Flamejantes",
    "Charm Person": "Enfeitiçar Pessoa",
    "Chromatic Orb": "Orbe Cromática",
    "Color Spray": "Borrifo Cromático",
    "Command": "Comando",
    "Comprehend Languages": "Compreender Idiomas",
    "Create or Destroy Water": "Criar ou Destruir Água",
    "Cure Wounds": "Curar Ferimentos",
    "Detect Evil and Good": "Detectar o Bem e o Mal",
    "Detect Magic": "Detectar Magia",
    "Detect Poison and Disease": "Detectar Veneno e Doença",
    "Disguise Self": "Disfarçar-se",
    "Dissonant Whispers": "Sussurros Dissonantes",
    "Divine Favor": "Favor Divino",
    "Entangle": "Emaranhar",
    "Expeditious Retreat": "Retirada Expedita",
    "Faerie Fire": "Fogo das Fadas",
    "False Life": "Vida Falsa",
    "Feather Fall": "Queda Suave",
    "Find Familiar": "Encontrar Familiar",
    "Fog Cloud": "Nuvem de Névoa",
    "Goodberry": "Fruta Encantada",
    "Grease": "Graxa",
    "Guiding Bolt": "Raio Guiador",
    "Hail of Thorns": "Chuva de Espinhos",
    "Healing Word": "Palavra de Cura",
    "Hellish Rebuke": "Repreensão Infernal",
    "Heroism": "Heroísmo",
    "Hex": "Maldição",
    "Hunter's Mark": "Marca do Caçador",
    "Identify": "Identificação",
    "Illusory Script": "Escrita Ilusória",
    "Inflict Wounds": "Infligir Ferimentos",
    "Jump": "Salto",
    "Longstrider": "Passos Longos",
    "Mage Armor": "Armadura Arcana",
    "Magic Missile": "Mísseis Mágicos",
    "Protection from Evil and Good": "Proteção contra o Bem e o Mal",
    "Purify Food and Drink": "Purificar Alimento e Bebida",
    "Ray of Sickness": "Raio de Doença",
    "Sanctuary": "Santuário",
    "Shield": "Escudo Arcano",
    "Shield of Faith": "Escudo da Fé",
    "Silent Image": "Imagem Silenciosa",
    "Sleep": "Sono",
    "Speak with Animals": "Falar com Animais",
    "Tasha's Hideous Laughter": "Riso Histérico de Tasha",
    "Hideous Laughter": "Riso Histérico",
    "Tenser's Floating Disk": "Disco Flutuante de Tenser",
    "Floating Disk": "Disco Flutuante",
    "Thunderwave": "Onda Trovejante",
    "Unseen Servant": "Servo Invisível",
    "Witch Bolt": "Raio da Bruxa",

    // Nível 2
    "Aid": "Ajuda",
    "Alter Self": "Alterar-se",
    "Animal Messenger": "Mensageiro Animal",
    "Arcane Lock": "Tranca Arcana",
    "Augury": "Augúrio",
    "Barkskin": "Pele de Árvore",
    "Beast Sense": "Sentidos Bestiais",
    "Blindness/Deafness": "Cegueira/Surdez",
    "Blur": "Embaçamento",
    "Branding Smite": "Golpe Marcador",
    "Calm Emotions": "Acalmar Emoções",
    "Cloud of Daggers": "Nuvem de Adagas",
    "Continual Flame": "Chama Contínua",
    "Cordon of Arrows": "Cordão de Flechas",
    "Crown of Madness": "Coroa da Loucura",
    "Darkness": "Escuridão",
    "Darkvision": "Visão no Escuro",
    "Detect Thoughts": "Detectar Pensamentos",
    "Enhance Ability": "Aprimorar Habilidade",
    "Enlarge/Reduce": "Aumentar/Reduzir",
    "Enthrall": "Cativar",
    "Find Steed": "Encontrar Montaria",
    "Find Traps": "Encontrar Armadilhas",
    "Flame Blade": "Lâmina Flamejante",
    "Flaming Sphere": "Esfera Flamejante",
    "Gentle Repose": "Repouso Tranquilo",
    "Gust of Wind": "Rajada de Vento",
    "Heat Metal": "Aquecer Metal",
    "Hold Person": "Imobilizar Pessoa",
    "Invisibility": "Invisibilidade",
    "Knock": "Abrir Fechaduras",
    "Lesser Restoration": "Restauração Menor",
    "Levitate": "Levitação",
    "Locate Animals or Plants": "Localizar Animais ou Plantas",
    "Locate Object": "Localizar Objeto",
    "Magic Mouth": "Boca Mágica",
    "Magic Weapon": "Arma Mágica",
    "Melf's Acid Arrow": "Flecha Ácida de Melf",
    "Acid Arrow": "Flecha Ácida",
    "Mirror Image": "Imagem Espelhada",
    "Misty Step": "Passo Nebuloso",
    "Moonbeam": "Raio Lunar",
    "Nystul's Magic Aura": "Aura Mágica de Nystul",
    "Magic Aura": "Aura Mágica",
    "Pass without Trace": "Passos sem Pegadas",
    "Phantasmal Force": "Força Fantasmagórica",
    "Prayer of Healing": "Prece de Cura",
    "Protection from Poison": "Proteção contra Veneno",
    "Ray of Enfeeblement": "Raio de Enfraquecimento",
    "Rope Trick": "Truque da Corda",
    "Scorching Ray": "Raio Ardente",
    "See Invisibility": "Ver o Invisível",
    "Shatter": "Estilhaçar",
    "Silence": "Silêncio",
    "Spider Climb": "Escalada de Aranha",
    "Spike Growth": "Crescimento de Espinhos",
    "Spiritual Weapon": "Arma Espiritual",
    "Suggestion": "Sugestão",
    "Warding Bond": "Vínculo Protetor",
    "Web": "Teia",
    "Zone of Truth": "Zona da Verdade",

    // Nível 3
    "Animate Dead": "Animar Mortos",
    "Aura of Vitality": "Aura de Vitalidade",
    "Beacon of Hope": "Farol de Esperança",
    "Bestow Curse": "Rogar Maldição",
    "Blink": "Piscar",
    "Call Lightning": "Convocar Relâmpagos",
    "Clairvoyance": "Clarividência",
    "Conjure Animals": "Conjurar Animais",
    "Conjure Barrage": "Conjurar Barragem",
    "Counterspell": "Contra-Mágica",
    "Create Food and Water": "Criar Alimento e Água",
    "Crusader's Mantle": "Manto do Cruzado",
    "Daylight": "Luz do Dia",
    "Dispel Magic": "Dissipar Magia",
    "Elemental Weapon": "Arma Elemental",
    "Fear": "Medo",
    "Feign Death": "Fingir Morte",
    "Fireball": "Bola de Fogo",
    "Fly": "Voo",
    "Gaseous Form": "Forma Gasosa",
    "Glyph of Warding": "Glifo de Proteção",
    "Haste": "Velocidade",
    "Hunger of Hadar": "Fome de Hadar",
    "Hypnotic Pattern": "Padrão Hipnótico",
    "Lightning Arrow": "Flecha Relampejante",
    "Lightning Bolt": "Relâmpago",
    "Magic Circle": "Círculo Mágico",
    "Major Image": "Imagem Maior",
    "Mass Healing Word": "Palavra de Cura em Massa",
    "Meld into Stone": "Fundir-se à Pedra",
    "Nondetection": "Não-detecção",
    "Phantom Steed": "Corcel Fantasma",
    "Plant Growth": "Crescimento de Plantas",
    "Protection from Energy": "Proteção contra Energia",
    "Remove Curse": "Remover Maldição",
    "Revivify": "Revivificar",
    "Sending": "Enviar Mensagem",
    "Sleet Storm": "Tempestade de Granizo",
    "Slow": "Lentidão",
    "Speak with Dead": "Falar com os Mortos",
    "Speak with Plants": "Falar com Plantas",
    "Spirit Guardians": "Guardiões Espirituais",
    "Stinking Cloud": "Nuvem Fedorenta",
    "Tiny Hut": "Cabana Minúscula",
    "Tongues": "Idiomas",
    "Vampiric Touch": "Toque Vampírico",
    "Water Breathing": "Respiração Aquática",
    "Water Walk": "Andar sobre as Águas",
    "Wind Wall": "Parede de Vento",

    // Nível 4
    "Arcane Eye": "Olho Arcano",
    "Banishment": "Banimento",
    "Blight": "Praga",
    "Compulsion": "Compulsão",
    "Confusion": "Confusão",
    "Conjure Minor Elementals": "Conjurar Elementais Menores",
    "Conjure Woodland Beings": "Conjurar Seres da Floresta",
    "Control Water": "Controlar a Água",
    "Death Ward": "Proteção contra a Morte",
    "Dimension Door": "Porta Dimensional",
    "Divination": "Adivinhação",
    "Dominate Beast": "Dominar Besta",
    "Evard's Black Tentacles": "Tentáculos Negros de Evard",
    "Black Tentacles": "Tentáculos Negros",
    "Fabricate": "Fabricar",
    "Fire Shield": "Escudo de Fogo",
    "Freedom of Movement": "Liberdade de Movimento",
    "Giant Insect": "Inseto Gigante",
    "Grasping Vine": "Videira Agarradora",
    "Greater Invisibility": "Invisibilidade Maior",
    "Guardian of Faith": "Guardião da Fé",
    "Hallucinatory Terrain": "Terreno Ilusório",
    "Ice Storm": "Tempestade de Gelo",
    "Locate Creature": "Localizar Criatura",
    "Mordenkainen's Faithful Hound": "Cão Fiel de Mordenkainen",
    "Faithful Hound": "Cão Fiel",
    "Mordenkainen's Private Sanctum": "Santuário Particular de Mordenkainen",
    "Private Sanctum": "Santuário Particular",
    "Otiluke's Resilient Sphere": "Esfera Resiliente de Otiluke",
    "Resilient Sphere": "Esfera Resiliente",
    "Phantasmal Killer": "Assassino Fantasmagórico",
    "Polymorph": "Metamorfose",
    "Stone Shape": "Moldar Pedra",
    "Stoneskin": "Pele de Pedra",
    "Wall of Fire": "Parede de Fogo",

    // Nível 5
    "Animate Objects": "Animar Objetos",
    "Antilife Shell": "Casca Antimatéria",
    "Awaken": "Despertar",
    "Banishing Smite": "Golpe Banidor",
    "Bigby's Hand": "Mão Arcana",
    "Circle of Power": "Círculo de Poder",
    "Cloudkill": "Névoa Mortal",
    "Commune": "Comunhão",
    "Commune with Nature": "Comunhão com a Natureza",
    "Cone of Cold": "Cone de Frio",
    "Conjure Elemental": "Conjurar Elemental",
    "Conjure Volley": "Conjurar Saraivada",
    "Contact Other Plane": "Contatar Outro Plano",
    "Contagion": "Contágio",
    "Creation": "Criação",
    "Destructive Wave": "Onda Destrutiva",
    "Dispel Evil and Good": "Dissipar o Bem e o Mal",
    "Dominate Person": "Dominar Pessoa",
    "Dream": "Sonho",
    "Flame Strike": "Coluna de Chamas",
    "Geas": "Missão",
    "Greater Restoration": "Restauração Maior",
    "Hallow": "Consagrar",
    "Hold Monster": "Imobilizar Monstro",
    "Insect Plague": "Praga de Insetos",
    "Legend Lore": "Conhecimento Lendário",
    "Mass Cure Wounds": "Curar Ferimentos em Massa",
    "Mislead": "Enganar",
    "Modify Memory": "Modificar Memória",
    "Passwall": "Passagem",
    "Planar Binding": "Vínculo Planar",
    "Raise Dead": "Levantar os Mortos",
    "Rary's Telepathic Bond": "Vínculo Telepático de Rary",
    "Telepathic Bond": "Vínculo Telepático",
    "Reincarnate": "Reencarnar",
    "Scrying": "Vidência",
    "Seeming": "Aparência",
    "Skill Empowerment": "Empoderamento de Perícia",
    "Steel Wind Strike": "Golpe do Vento de Aço",
    "Swift Quiver": "Aljava Veloz",
    "Telekinesis": "Telecinese",
    "Teleportation Circle": "Círculo de Teletransporte",
    "Tree Stride": "Passo das Árvores",
    "Wall of Force": "Parede de Energia",
    "Wall of Stone": "Parede de Pedra",

    // Nível 6
    "Arcane Gate": "Portal Arcano",
    "Blade Barrier": "Barreira de Lâminas",
    "Bones of the Earth": "Ossos da Terra",
    "Chain Lightning": "Corrente de Relâmpagos",
    "Circle of Death": "Círculo da Morte",
    "Conjure Fey": "Conjurar Feérico",
    "Contingency": "Contingência",
    "Create Undead": "Criar Morto-vivo",
    "Disintegrate": "Desintegrar",
    "Drawmij's Instant Summons": "Convocação Instantânea de Drawmij",
    "Instant Summons": "Convocação Instantânea",
    "Eyebite": "Morder com os Olhos",
    "Find the Path": "Encontrar o Caminho",
    "Flesh to Stone": "Carne para Pedra",
    "Forbiddance": "Proibição",
    "Globe of Invulnerability": "Globo de Invulnerabilidade",
    "Guards and Wards": "Guardas e Alas",
    "Harm": "Prejudicar",
    "Heal": "Cura Completa",
    "Heroes' Feast": "Banquete dos Heróis",
    "Investiture of Flame": "Investidura de Chamas",
    "Investiture of Ice": "Investidura de Gelo",
    "Investiture of Stone": "Investidura de Pedra",
    "Investiture of Wind": "Investidura de Vento",
    "Magic Jar": "Jarra Mágica",
    "Mass Suggestion": "Sugestão em Massa",
    "Move Earth": "Mover Terra",
    "Otto's Irresistible Dance": "Dança Irresistível de Otto",
    "Irresistible Dance": "Dança Irresistível",
    "Planar Ally": "Aliado Planar",
    "Primordial Ward": "Proteção Primordial",
    "Programmed Illusion": "Ilusão Programada",
    "Sunbeam": "Raio Solar",
    "Transport via Plants": "Transporte via Plantas",
    "True Seeing": "Visão Verdadeira",
    "Wall of Ice": "Parede de Gelo",
    "Wall of Thorns": "Parede de Espinhos",
    "Wind Walk": "Caminhar no Vento",
    "Word of Recall": "Palavra de Recordação",

    // Nível 7
    "Arcane Sword": "Espada Arcana",
    "Conjure Celestial": "Conjurar Celestial",
    "Delayed Blast Fireball": "Bola de Fogo Controlada",
    "Divine Word": "Palavra Divina",
    "Etherealness": "Etereidade",
    "Finger of Death": "Dedo da Morte",
    "Fire Storm": "Tempestade de Fogo",
    "Forcecage": "Gaiola de Energia",
    "Mirage Arcane": "Miragem Arcana",
    "Mordenkainen's Magnificent Mansion": "Mansão Magnífica de Mordenkainen",
    "Magnificent Mansion": "Mansão Magnífica",
    "Mordenkainen's Sword": "Espada de Mordenkainen",
    "Plane Shift": "Mudança de Plano",
    "Prismatic Spray": "Borrifo Prismático",
    "Project Image": "Projetar Imagem",
    "Regenerate": "Regenerar",
    "Resurrection": "Ressurreição",
    "Reverse Gravity": "Inverter a Gravidade",
    "Sequester": "Sequestrar",
    "Simulacrum": "Simulacro",
    "Symbol": "Símbolo",
    "Teleport": "Teletransporte",
    "Temple of the Gods": "Templo dos Deuses",
    "Whirlwind": "Redemoinho",

    // Nível 8
    "Abi-Dalzim's Horrid Wilting": "Murcha Horrível de Abi-Dalzim",
    "Horrid Wilting": "Murcha Horrível",
    "Animal Shapes": "Formas Animais",
    "Antimagic Field": "Campo Antimagia",
    "Antipathy/Sympathy": "Antipatia/Simpatia",
    "Clone": "Clone",
    "Control Weather": "Controlar o Clima",
    "Demiplane": "Semiplano",
    "Dominate Monster": "Dominar Monstro",
    "Earthquake": "Terremoto",
    "Feeblemind": "Debilitar Intelecto",
    "Glibness": "Lábia",
    "Holy Aura": "Aura Sagrada",
    "Incendiary Cloud": "Nuvem Incendiária",
    "Maddening Darkness": "Escuridão Enlouquecedora",
    "Maze": "Labirinto",
    "Mind Blank": "Mente em Branco",
    "Power Word Stun": "Palavra de Poder Atordoante",
    "Sunburst": "Explosão Solar",
    "Telepathy": "Telepatia",
    "Tsunami": "Tsunami",

    // Nível 9
    "Astral Projection": "Projeção Astral",
    "Blade of Disaster": "Lâmina do Desastre",
    "Foresight": "Presciência",
    "Gate": "Portal",
    "Imprisonment": "Aprisionamento",
    "Invulnerability": "Invulnerabilidade",
    "Mass Heal": "Cura em Massa",
    "Mass Polymorph": "Metamorfose em Massa",
    "Meteor Swarm": "Chuva de Meteoros",
    "Power Word Heal": "Palavra de Poder Curativa",
    "Power Word Kill": "Palavra de Poder Mortal",
    "Prismatic Wall": "Parede Prismática",
    "Psychic Scream": "Grito Psíquico",
    "Shapechange": "Metamorfose Suprema",
    "Storm of Vengeance": "Tempestade da Vingança",
    "Time Stop": "Parar o Tempo",
    "True Polymorph": "Metamorfose Verdadeira",
    "True Resurrection": "Ressurreição Verdadeira",
    "Weird": "Pesadelo",
    "Wish": "Desejo",

    // Xanathar's Guide to Everything
    "Absorb Elements": "Absorver Elementos",
    "Aganazzar's Scorcher": "Chamuscador de Aganazzar",
    "Beast Bond": "Vínculo Bestial",
    "Catapult": "Catapulta",
    "Catnap": "Cochilo",
    "Cause Fear": "Causar Medo",
    "Ceremony": "Cerimônia",
    "Chaos Bolt": "Raio do Caos",
    "Charm Monster": "Enfeitiçar Monstro",
    "Control Flames": "Controlar Chamas",
    "Control Winds": "Controlar Ventos",
    "Create Bonfire": "Criar Fogueira",
    "Crown of Stars": "Coroa de Estrelas",
    "Danse Macabre": "Dança Macabra",
    "Dawn": "Alvorada",
    "Dragon's Breath": "Sopro do Dragão",
    "Druid Grove": "Bosque Druídico",
    "Dust Devil": "Diabo de Poeira",
    "Earth Tremor": "Tremor de Terra",
    "Earthbind": "Vincular à Terra",
    "Elemental Bane": "Ruína Elemental",
    "Enemies Abound": "Inimigos ao Redor",
    "Ensnaring Strike": "Golpe Enredador",
    "Erupting Earth": "Terra em Erupção",
    "Far Step": "Passo Distante",
    "Find Greater Steed": "Encontrar Montaria Superior",
    "Frostbite": "Geada",
    "Gust": "Rajada",
    "Healing Spirit": "Espírito Curador",
    "Holy Weapon": "Arma Sagrada",
    "Ice Knife": "Faca de Gelo",
    "Immolation": "Imolação",
    "Infernal Calling": "Convocação Infernal",
    "Infestation": "Infestação",
    "Investiture of Flame": "Investidura de Chamas",
    "Investiture of Ice": "Investidura de Gelo",
    "Investiture of Stone": "Investidura de Pedra",
    "Investiture of Wind": "Investidura de Vento",
    "Life Transference": "Transferência de Vida",
    "Lightning Lure": "Isca Elétrica",
    "Maddening Darkness": "Escuridão Enlouquecedora",
    "Maelstrom": "Maelstrom",
    "Magic Stone": "Pedra Mágica",
    "Mass Polymorph": "Metamorfose em Massa",
    "Max Healing Word": "Palavra de Cura em Massa",
    "Melf's Minute Meteors": "Meteoros Minúsculos de Melf",
    "Mental Prison": "Prisão Mental",
    "Mighty Fortress": "Fortaleza Poderosa",
    "Mind Spike": "Espinho Mental",
    "Mold Earth": "Moldar Terra",
    "Negative Energy Flood": "Inundação de Energia Negativa",
    "Power Word Pain": "Palavra de Poder Dolorosa",
    "Primordial Ward": "Proteção Primordial",
    "Primal Savagery": "Selvageria Primal",
    "Psychic Scream": "Grito Psíquico",
    "Pyrotechnics": "Pirotecnia",
    "Scatter": "Dispersar",
    "Shadow Blade": "Lâmina Sombria",
    "Shadow of Moil": "Sombra de Moil",
    "Shape Water": "Moldar Água",
    "Sickening Radiance": "Radiância Nauseante",
    "Skill Empowerment": "Empoderamento de Perícia",
    "Snare": "Armadilha",
    "Snilloc's Snowball Swarm": "Enxame de Bolas de Neve de Snilloc",
    "Soul Cage": "Gaiola de Almas",
    "Steel Wind Strike": "Golpe do Vento de Aço",
    "Storm Sphere": "Esfera da Tempestade",
    "Summon Greater Demon": "Convocar Demônio Superior",
    "Summon Lesser Demons": "Convocar Demônios Menores",
    "Sword Burst": "Explosão de Espadas",
    "Synaptic Static": "Estática Sináptica",
    "Temple of the Gods": "Templo dos Deuses",
    "Tenser's Transformation": "Transformação de Tenser",
    "Thunder Step": "Passo Trovejante",
    "Tidal Wave": "Onda de Maré",
    "Tiny Servant": "Servo Minúsculo",
    "Toll the Dead": "Dobre os Sinos",
    "Transmute Rock": "Transmutar Rocha",
    "Vitriolic Sphere": "Esfera Vitriólica",
    "Wall of Light": "Parede de Luz",
    "Wall of Sand": "Parede de Areia",
    "Wall of Water": "Parede de Água",
    "Warding Wind": "Vento Protetor",
    "Water elemental": "Elemental da Água",
    "Watery Sphere": "Esfera Aquosa",
    "Whirlwind": "Redemoinho",
    "Word of Radiance": "Palavra de Radiância",
    "Wrath of Nature": "Ira da Natureza",
    "Zephyr Strike": "Golpe do Zéfiro",

    // Tasha's Cauldron of Everything
    "Blade of Disaster": "Lâmina do Desastre",
    "Booming Blade": "Lâmina Estrondosa",
    "Dream of the Blue Veil": "Sonho do Véu Azul",
    "Intellect Fortress": "Fortaleza do Intelecto",
    "Lightning Lure": "Isca Elétrica",
    "Mind Sliver": "Lasca Mental",
    "Spirit Shroud": "Mortalha Espiritual",
    "Summon Aberration": "Convocar Aberração",
    "Summon Beast": "Convocar Besta",
    "Summon Celestial": "Convocar Celestial",
    "Summon Construct": "Convocar Constructo",
    "Summon Elemental": "Convocar Elemental",
    "Summon Fey": "Convocar Feérico",
    "Summon Fiend": "Convocar Ínfero",
    "Summon Shadowspawn": "Convocar Criatura das Sombras",
    "Summon Undead": "Convocar Morto-vivo",
    "Sword Burst": "Explosão de Espadas",
    "Tasha's Bubbling Cauldron": "Caldeirão Borbulhante de Tasha",
    "Tasha's Caustic Brew": "Bebida Cáustica de Tasha",
    "Tasha's Mind Whip": "Chicote Mental de Tasha",
    "Tasha's Otherworldly Guise": "Disfarce Extradimensional de Tasha",

    // Strixhaven: A Curriculum of Chaos
    "Borrowed Knowledge": "Conhecimento Emprestado",
    "Kinetic Jaunt": "Marcha Cinética",
    "Silvery Barbs": "Farpas Prateadas",
    "Vortex Warp": "Distorção do Vórtice",
    "Wither and Bloom": "Murchar e Florescer",

    // Elemental Evil Player's Companion
    "Abi-Dalzim's Horrid Wilting": "Murcha Horrível de Abi-Dalzim",
    "Aganazzar's Scorcher": "Chamuscador de Aganazzar",
    "Beast Bond": "Vínculo Bestial",
    "Bones of the Earth": "Ossos da Terra",
    "Catapult": "Catapulta",
    "Control Flames": "Controlar Chamas",
    "Control Winds": "Controlar Ventos",
    "Create Bonfire": "Criar Fogueira",
    "Dust Devil": "Diabo de Poeira",
    "Earth Tremor": "Tremor de Terra",
    "Earthbind": "Vincular à Terra",
    "Elemental Bane": "Ruína Elemental",
    "Erupting Earth": "Terra em Erupção",
    "Flame Arrows": "Flechas Flamejantes",
    "Frostbite": "Geada",
    "Gust": "Rajada",
    "Ice Knife": "Faca de Gelo",
    "Immolation": "Imolação",
    "Investiture of Flame": "Investidura de Chamas",
    "Investiture of Ice": "Investidura de Gelo",
    "Investiture of Stone": "Investidura de Pedra",
    "Investiture of Wind": "Investidura de Vento",
    "Maelstrom": "Maelstrom",
    "Magic Stone": "Pedra Mágica",
    "Maximilian's Earthen Grasp": "Garra Terrena de Maximilian",
    "Melf's Minute Meteors": "Meteoros Minúsculos de Melf",
    "Mold Earth": "Moldar Terra",
    "Primordial Ward": "Proteção Primordial",
    "Pyrotechnics": "Pirotecnia",
    "Shape Water": "Moldar Água",
    "Skeletal Hands": "Mãos Esqueléticas",
    "Snilloc's Snowball Swarm": "Enxame de Bolas de Neve de Snilloc",
    "Storm Sphere": "Esfera da Tempestade",
    "Thunderclap": "Trovão",
    "Tidal Wave": "Onda de Maré",
    "Transmute Rock": "Transmutar Rocha",
    "Vitriolic Sphere": "Esfera Vitriólica",
    "Wall of Sand": "Parede de Areia",
    "Wall of Water": "Parede de Água",
    "Warding Wind": "Vento Protetor",
    "Watery Sphere": "Esfera Aquosa",
    "Whirlwind": "Redemoinho",

    // Acquisitions Incorporated
    "Fast Friends": "Amigos Rápidos",
    "Gift of Gab": "Dom da Lábia",
    "Incite Greed": "Incitar Ganância",
    "Jim's Glowing Coin": "Moeda Brilhante de Jim",
    "Jim's Magic Missile": "Mísseis Mágicos de Jim",

    // Icewind Dale: Rime of the Frostmaiden
    "Blade of Disaster": "Lâmina do Desastre",
    "Frostbite": "Geada",
    "Frost Fingers": "Dedos Gélidos",
    "Ice Knife": "Faca de Gelo",
    "Rime's Binding Ice": "Gelo Vinculador de Rime",

    // Explorer's Guide to Wildemount
    "Dark Star": "Estrela Sombria",
    "Fortune's Favor": "Favor da Fortuna",
    "Fortunes Favor": "Favor da Fortuna",
    "Gravity Fissure": "Fissura Gravitacional",
    "Gravity Sinkhole": "Buraco de Gravidade",
    "Immovable Object": "Objeto Imóvel",
    "Magnify Gravity": "Amplificar Gravidade",
    "Pulse Wave": "Onda de Pulso",
    "Ravenous Void": "Vazio Voraz",
    "Reality Break": "Quebra da Realidade",
    "Sapping Sting": "Ferrão Debilitante",
    "Temporal Shunt": "Desvio Temporal",
    "Tether Essence": "Essência Presa",
    "Time Ravage": "Devastação Temporal",
    "Wristpocket": "Bolso no Pulso",

    // Fizbans Treasury of Dragons
    "Ashardalon's Stride": "Passada de Ashardalon",
    "Draconic Transformation": "Transformação Dracônica",
    "Flame Stride": "Passada Flamejante",
    "Icingdeath's Frost": "Geada de Icingdeath",
    "Nathair's Mischief": "Travessura de Nathair",
    "Raulothim's Psychic Lance": "Lança Psíquica de Raulothim",
    "Summon Draconic Spirit": "Convocar Espírito Dracônico",

    // Outras fontes/homebrew comuns
    "Booming Blade": "Lâmina Estrondosa",
    "Greenflame Blade": "Lâmina Flamejante Verde",
    "Green-Flame Blade": "Lâmina Flamejante Verde",
    "Lightning Arrow": "Flecha Relampejante",
    "Sword Coast Adventurer's Guide": "Guia do Aventureiro da Costa da Espada",
};

// Dicionário de escolas de magia (inglês -> português)
export const SPELL_SCHOOLS: Record<string, string> = {
    "Abjuration": "Abjuração",
    "Conjuration": "Conjuração",
    "Divination": "Adivinhação",
    "Enchantment": "Encantamento",
    "Evocation": "Evocação",
    "Illusion": "Ilusão",
    "Necromancy": "Necromancia",
    "Transmutation": "Transmutação",
};

// Dicionário de classes (inglês -> português)
export const CLASS_NAMES: Record<string, string> = {
    "Artificer": "Artífice",
    "Barbarian": "Bárbaro",
    "Bard": "Bardo",
    "Cleric": "Clérigo",
    "Druid": "Druida",
    "Fighter": "Guerreiro",
    "Monk": "Monge",
    "Paladin": "Paladino",
    "Ranger": "Patrulheiro",
    "Rogue": "Ladino",
    "Sorcerer": "Feiticeiro",
    "Warlock": "Bruxo",
    "Wizard": "Mago",
};

// Dicionário de tempos de conjuração
export const CASTING_TIMES: Record<string, string> = {
    "action": "1 ação",
    "bonus action": "1 ação bônus",
    "reaction": "1 reação",
    "minute": "minuto",
    "minutes": "minutos",
    "hour": "hora",
    "hours": "horas",
    "1 action": "1 ação",
    "1 bonus action": "1 ação bônus",
    "1 reaction": "1 reação",
};

/**
 * Função para traduzir automaticamente uma magia
 */
export function translateSpell(spell: any): any {
    const translated: any = { ...spell };

    // Traduzir nome (Case Insensitive)
    let englishName = spell.name;
    if (spell.name) {
        // Tenta match exato primeiro
        if (SPELL_NAMES[spell.name]) {
            translated.name = SPELL_NAMES[spell.name];
        } else {
            // Tenta match case-insensitive
            const lowerName = spell.name.toLowerCase();
            const foundKey = Object.keys(SPELL_NAMES).find(k => k.toLowerCase() === lowerName);
            if (foundKey) {
                translated.name = SPELL_NAMES[foundKey];
                englishName = foundKey; // Guarda o nome original correto
            } else {
                // Se não achou em inglês, pode ser que JÁ ESTEJA em português.
                // Tenta achar o nome em inglês através do valor no dicionário (Busca Reversa)
                const foundEntry = Object.entries(SPELL_NAMES).find(([k, v]) => v.toLowerCase() === lowerName);
                if (foundEntry) {
                    englishName = foundEntry[0]; // Recuperamos o nome em inglês!
                    // O nome já está certo (em PT), não precisa mudar translated.name
                }
            }
        }
    }

    // Traduzir escola
    if (spell.school) {
        if (typeof spell.school === 'string') {
            translated.school = SPELL_SCHOOLS[spell.school] || spell.school;
        } else if (spell.school.name) {
            translated.school = SPELL_SCHOOLS[spell.school.name] || spell.school.name;
        }
    }

    // Traduzir classes
    if (spell.classes && Array.isArray(spell.classes)) {
        translated.classes = spell.classes.map((cls: any) => {
            if (typeof cls === 'string') {
                return CLASS_NAMES[cls] || cls;
            } else if (cls.name) {
                return CLASS_NAMES[cls.name] || cls.name;
            }
            return cls;
        });
    }

    // Traduzir tempo de conjuração
    if (spell.time && Array.isArray(spell.time) && spell.time.length > 0) {
        const timeObj = spell.time[0];
        if (timeObj.unit && timeObj.number) {
            const unit = CASTING_TIMES[timeObj.unit] || timeObj.unit;
            translated.castingTime = `${timeObj.number} ${unit}`;
        }
    }

    // Traduzir alcance
    if (spell.range) {
        if (spell.range.type === 'point' && spell.range.distance) {
            const dist = spell.range.distance;
            if (dist.type === 'self') {
                translated.range = 'Pessoal';
            } else if (dist.type === 'touch') {
                translated.range = 'Toque';
            } else if (dist.type === 'sight') {
                translated.range = 'Visão';
            } else if (dist.type === 'unlimited') {
                translated.range = 'Ilimitado';
            } else if (dist.type === 'feet' && dist.amount) {
                // Converter pés para metros (1 pé = 0.3048 metros, mas D&D usa aproximações)
                const feet = dist.amount;
                if (feet === 5) translated.range = '1,5 metros';
                else if (feet === 10) translated.range = '3 metros';
                else if (feet === 15) translated.range = '4,5 metros';
                else if (feet === 20) translated.range = '6 metros';
                else if (feet === 25) translated.range = '7,5 metros';
                else if (feet === 30) translated.range = '9 metros';
                else if (feet === 60) translated.range = '18 metros';
                else if (feet === 90) translated.range = '27 metros';
                else if (feet === 100) translated.range = '30 metros';
                else if (feet === 120) translated.range = '36 metros';
                else if (feet === 150) translated.range = '45 metros';
                else if (feet === 300) translated.range = '90 metros';
                else if (feet === 500) translated.range = '150 metros';
                else if (feet === 1000) translated.range = '300 metros';
                else if (feet === 5280) translated.range = '1,5 km'; // 1 milha
                else translated.range = `${Math.round(feet * 0.3)} metros`;
            } else if (dist.type === 'miles' && dist.amount) {
                translated.range = `${dist.amount * 1.6} km`;
            }
        } else if (spell.range.type === 'special') {
            translated.range = 'Especial';
        }
    }

    // Traduzir duração
    if (spell.duration && Array.isArray(spell.duration) && spell.duration.length > 0) {
        const dur = spell.duration[0];
        if (dur.type === 'instant') {
            translated.duration = 'Instantânea';
        } else if (dur.type === 'permanent') {
            translated.duration = 'Permanente';
        } else if (dur.type === 'special') {
            translated.duration = 'Especial';
        } else if (dur.type === 'timed') {
            const amount = dur.duration?.amount || 1;
            const unit = dur.duration?.type;
            let unitPt = 'rodadas';
            if (unit === 'minute') unitPt = amount > 1 ? 'minutos' : 'minuto';
            if (unit === 'hour') unitPt = amount > 1 ? 'horas' : 'hora';
            if (unit === 'day') unitPt = amount > 1 ? 'dias' : 'dia';
            if (unit === 'round') unitPt = amount > 1 ? 'rodadas' : 'rodada';

            const concentration = dur.concentration ? 'Concentração, até ' : '';
            translated.duration = `${concentration}${amount} ${unitPt}`;
        }
    }

    // Traduzir componentes
    if (spell.components) {
        const parts = [];
        if (spell.components.v) parts.push('V');
        if (spell.components.s) parts.push('S');
        if (spell.components.m) {
            if (typeof spell.components.m === 'string') {
                parts.push(`M (${spell.components.m})`);
            } else {
                parts.push('M');
            }
        }
        translated.components = parts.join(', ');
    }

    // Traduzir descrição
    // Tentar encontrar no dicionário de descrições completas usando englishName
    if (englishName && (SPELL_DESCRIPTIONS_PT[englishName] || SPELL_DESCRIPTIONS_PT[englishName.toLowerCase()] || Object.keys(SPELL_DESCRIPTIONS_PT).find(k => k.toLowerCase() === englishName.toLowerCase()))) {
        const key = SPELL_DESCRIPTIONS_PT[englishName] ? englishName :
            (SPELL_DESCRIPTIONS_PT[englishName.toLowerCase()] ? englishName.toLowerCase() :
                Object.keys(SPELL_DESCRIPTIONS_PT).find(k => k.toLowerCase() === englishName.toLowerCase()) || englishName);

        translated.description = SPELL_DESCRIPTIONS_PT[key];
    } else if (spell.entries && Array.isArray(spell.entries)) {
        // Fallback: junta as entradas originais
        translated.description = spell.entries
            .map((entry: any) => {
                if (typeof entry === 'string') return entry;
                if (entry.type === 'entries' && entry.items) {
                    return entry.items.join(' ');
                }
                return JSON.stringify(entry);
            })
            .join('\n\n');
    }

    // Concentração e ritual
    if (spell.duration && Array.isArray(spell.duration)) {
        translated.concentration = spell.duration.some((d: any) => d.concentration === true);
    }
    translated.ritual = spell.meta?.ritual === true;

    // ID da magia
    if (!translated.id) {
        translated.id = spell.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `spell-${Date.now()}`;
    }

    return translated;
}

/**
 * Função para traduzir um lote de magias
 */
export function translateSpells(spells: any[]): any[] {
    return spells.map(translateSpell);
}
