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
    // A - Z
    "Abi-Dalzim's Horrid Wilting": "Murcha Horrível de Abi-Dalzim",
    "Absorb Elements": "Absorver Elementos",
    "Acid Arrow": "Flecha Ácida",
    "Acid Splash": "Borrifada Ácida",
    "Aganazzar's Scorcher": "Chamuscador de Aganazzar",
    "Aid": "Ajuda",
    "Alarm": "Alarme",
    "Alter Self": "Alterar-se",
    "Animal Friendship": "Amizade Animal",
    "Animal Messenger": "Mensageiro Animal",
    "Animal Shapes": "Formas Animais",
    "Animate Dead": "Animar Mortos",
    "Animate Objects": "Animar Objetos",
    "Antilife Shell": "Casca Antimatéria",
    "Antimagic Field": "Campo Antimagia",
    "Antipathy/Sympathy": "Antipatia/Simpatia",
    "Arcane Eye": "Olho Arcano",
    "Arcane Gate": "Portal Arcano",
    "Arcane Lock": "Tranca Arcana",
    "Arcane Sword": "Espada Arcana",
    "Armor of Agathys": "Armadura de Agathys",
    "Arms of Hadar": "Braços de Hadar",
    "Ashardalon's Stride": "Passada de Ashardalon",
    "Astral Projection": "Projeção Astral",
    "Augury": "Augúrio",
    "Aura of Vitality": "Aura de Vitalidade",
    "Awaken": "Despertar",

    "Bane": "Perdição",
    "Banishing Smite": "Golpe Banidor",
    "Banishment": "Banimento",
    "Barkskin": "Pele de Árvore",
    "Beacon of Hope": "Farol de Esperança",
    "Beast Bond": "Vínculo Bestial",
    "Beast Sense": "Sentidos Bestiais",
    "Bestow Curse": "Rogar Maldição",
    "Bigby's Hand": "Mão Arcana",
    "Black Tentacles": "Tentáculos Negros",
    "Blade Barrier": "Barreira de Lâminas",
    "Blade of Disaster": "Lâmina do Desastre",
    "Blade Ward": "Ala de Lâmina",
    "Bless": "Benção",
    "Blight": "Praga",
    "Blindness/Deafness": "Cegueira/Surdez",
    "Blink": "Piscar",
    "Blur": "Embaçamento",
    "Bones of the Earth": "Ossos da Terra",
    "Booming Blade": "Lâmina Estrondosa",
    "Borrowed Knowledge": "Conhecimento Emprestado",
    "Branding Smite": "Golpe Marcador",
    "Burning Hands": "Mãos Flamejantes",

    "Call Lightning": "Convocar Relâmpagos",
    "Calm Emotions": "Acalmar Emoções",
    "Catapult": "Catapulta",
    "Catnap": "Cochilo",
    "Cause Fear": "Causar Medo",
    "Ceremony": "Cerimônia",
    "Chain Lightning": "Corrente de Relâmpagos",
    "Chaos Bolt": "Raio do Caos",
    "Charm Monster": "Enfeitiçar Monstro",
    "Charm Person": "Enfeitiçar Pessoa",
    "Chill Touch": "Toque Gélido",
    "Chromatic Orb": "Orbe Cromática",
    "Circle of Death": "Círculo da Morte",
    "Circle of Power": "Círculo de Poder",
    "Clairvoyance": "Clarividência",
    "Clone": "Clone",
    "Cloud of Daggers": "Nuvem de Adagas",
    "Cloudkill": "Névoa Mortal",
    "Color Spray": "Borrifo Cromático",
    "Command": "Comando",
    "Commune": "Comunhão",
    "Commune with Nature": "Comunhão com a Natureza",
    "Compulsion": "Compulsão",
    "Comprehend Languages": "Compreender Idiomas",
    "Cone of Cold": "Cone de Frio",
    "Confusion": "Confusão",
    "Conjure Animals": "Conjurar Animais",
    "Conjure Barrage": "Conjurar Barragem",
    "Conjure Celestial": "Conjurar Celestial",
    "Conjure Elemental": "Conjurar Elemental",
    "Conjure Fey": "Conjurar Feérico",
    "Conjure Minor Elementals": "Conjurar Elementais Menores",
    "Conjure Volley": "Conjurar Saraivada",
    "Conjure Woodland Beings": "Conjurar Seres da Floresta",
    "Contact Other Plane": "Contatar Outro Plano",
    "Contagion": "Contágio",
    "Contingency": "Contingência",
    "Continual Flame": "Chama Contínua",
    "Control Flames": "Controlar Chamas",
    "Control Water": "Controlar a Água",
    "Control Weather": "Controlar o Clima",
    "Control Winds": "Controlar Ventos",
    "Cordon of Arrows": "Cordão de Flechas",
    "Counterspell": "Contra-Mágica",
    "Create Bonfire": "Criar Fogueira",
    "Create Food and Water": "Criar Alimento e Água",
    "Create or Destroy Water": "Criar ou Destruir Água",
    "Create Undead": "Criar Morto-vivo",
    "Creation": "Criação",
    "Crown of Madness": "Coroa da Loucura",
    "Crown of Stars": "Coroa de Estrelas",
    "Crusader's Mantle": "Manto do Cruzado",
    "Cure Wounds": "Curar Ferimentos",

    "Dancing Lights": "Luzes Dançantes",
    "Danse Macabre": "Dança Macabra",
    "Dark Star": "Estrela Sombria",
    "Darkness": "Escuridão",
    "Darkvision": "Visão no Escuro",
    "Dawn": "Alvorada",
    "Daylight": "Luz do Dia",
    "Death Ward": "Proteção contra a Morte",
    "Delayed Blast Fireball": "Bola de Fogo Controlada",
    "Demiplane": "Semiplano",
    "Destructive Wave": "Onda Destrutiva",
    "Detect Evil and Good": "Detectar o Bem e o Mal",
    "Detect Magic": "Detectar Magia",
    "Detect Poison and Disease": "Detectar Veneno e Doença",
    "Detect Thoughts": "Detectar Pensamentos",
    "Dimension Door": "Porta Dimensional",
    "Disguise Self": "Disfarçar-se",
    "Disintegrate": "Desintegrar",
    "Dispel Evil and Good": "Dissipar o Bem e o Mal",
    "Dispel Magic": "Dissipar Magia",
    "Dissonant Whispers": "Sussurros Dissonantes",
    "Divination": "Adivinhação",
    "Divine Favor": "Favor Divino",
    "Divine Word": "Palavra Divina",
    "Dominate Beast": "Dominar Besta",
    "Dominate Monster": "Dominar Monstro",
    "Dominate Person": "Dominar Pessoa",
    "Draconic Transformation": "Transformação Dracônica",
    "Dragon's Breath": "Sopro do Dragão",
    "Drawmij's Instant Summons": "Convocação Instantânea de Drawmij",
    "Dream": "Sonho",
    "Dream of the Blue Veil": "Sonho do Véu Azul",
    "Druid Grove": "Bosque Druídico",
    "Druidcraft": "Druidismo",
    "Dust Devil": "Diabo de Poeira",

    "Earth Tremor": "Tremor de Terra",
    "Earthbind": "Vincular à Terra",
    "Earthquake": "Terremoto",
    "Eldritch Blast": "Raio Místico",
    "Elemental Bane": "Ruína Elemental",
    "Elemental Weapon": "Arma Elemental",
    "Enemies Abound": "Inimigos ao Redor",
    "Enhance Ability": "Aprimorar Habilidade",
    "Enlarge/Reduce": "Aumentar/Reduzir",
    "Ensnaring Strike": "Golpe Enredador",
    "Entangle": "Emaranhar",
    "Enthrall": "Cativar",
    "Erupting Earth": "Terra em Erupção",
    "Etherealness": "Etereidade",
    "Evard's Black Tentacles": "Tentáculos Negros de Evard",
    "Expeditious Retreat": "Retirada Expedita",
    "Eyebite": "Morder com os Olhos",

    "Fabricate": "Fabricar",
    "Faerie Fire": "Fogo das Fadas",
    "Faithful Hound": "Cão Fiel",
    "False Life": "Vida Falsa",
    "Far Step": "Passo Distante",
    "Fast Friends": "Amigos Rápidos",
    "Fear": "Medo",
    "Feather Fall": "Queda Suave",
    "Feeblemind": "Debilitar Intelecto",
    "Feign Death": "Fingir Morte",
    "Find Familiar": "Encontrar Familiar",
    "Find Greater Steed": "Encontrar Montaria Superior",
    "Find Steed": "Encontrar Montaria",
    "Find the Path": "Encontrar o Caminho",
    "Find Traps": "Encontrar Armadilhas",
    "Finger of Death": "Dedo da Morte",
    "Fire Bolt": "Raio de Fogo",
    "Fire Shield": "Escudo de Fogo",
    "Fire Storm": "Tempestade de Fogo",
    "Fireball": "Bola de Fogo",
    "Flame Arrows": "Flechas Flamejantes",
    "Flame Blade": "Lâmina Flamejante",
    "Flame Strike": "Coluna de Chamas",
    "Flame Stride": "Passada Flamejante",
    "Flaming Sphere": "Esfera Flamejante",
    "Flesh to Stone": "Carne para Pedra",
    "Floating Disk": "Disco Flutuante",
    "Fly": "Voo",
    "Fog Cloud": "Nuvem de Névoa",
    "Forbiddance": "Proibição",
    "Forcecage": "Gaiola de Energia",
    "Foresight": "Presciência",
    "Fortune's Favor": "Favor da Fortuna",
    "Fortunes Favor": "Favor da Fortuna",
    "Freedom of Movement": "Liberdade de Movimento",
    "Friends": "Amigos",
    "Frost Fingers": "Dedos Gélidos",
    "Frostbite": "Geada",

    "Gaseous Form": "Forma Gasosa",
    "Gate": "Portal",
    "Geas": "Missão",
    "Gentle Repose": "Repouso Tranquilo",
    "Giant Insect": "Inseto Gigante",
    "Gift of Gab": "Dom da Lábia",
    "Glibness": "Lábia",
    "Globe of Invulnerability": "Globo de Invulnerabilidade",
    "Glyph of Warding": "Glifo de Proteção",
    "Goodberry": "Fruta Encantada",
    "Grasping Vine": "Videira Agarradora",
    "Gravity Fissure": "Fissura Gravitacional",
    "Gravity Sinkhole": "Buraco de Gravidade",
    "Grease": "Graxa",
    "Greater Invisibility": "Invisibilidade Maior",
    "Greater Restoration": "Restauração Maior",
    "Green-Flame Blade": "Lâmina Flamejante",
    "Greenflame Blade": "Lâmina Flamejante Verde",
    "Guardian of Faith": "Guardião da Fé",
    "Guards and Wards": "Guardas e Alas",
    "Guidance": "Orientação",
    "Guiding Bolt": "Raio Guiador",
    "Gust": "Rajada",
    "Gust of Wind": "Rajada de Vento",

    "Hail of Thorns": "Chuva de Espinhos",
    "Hallow": "Consagrar",
    "Hallucinatory Terrain": "Terreno Ilusório",
    "Harm": "Prejudicar",
    "Haste": "Velocidade",
    "Heal": "Cura Completa",
    "Healing Spirit": "Espírito Curador",
    "Healing Word": "Palavra de Cura",
    "Heat Metal": "Aquecer Metal",
    "Hellish Rebuke": "Repreensão Infernal",
    "Heroes' Feast": "Banquete dos Heróis",
    "Heroism": "Heroísmo",
    "Hex": "Maldição",
    "Hideous Laughter": "Riso Histérico",
    "Hold Monster": "Imobilizar Monstro",
    "Hold Person": "Imobilizar Pessoa",
    "Holy Aura": "Aura Sagrada",
    "Holy Weapon": "Arma Sagrada",
    "Horrid Wilting": "Murcha Horrível",
    "Hunger of Hadar": "Fome de Hadar",
    "Hunter's Mark": "Marca do Caçador",
    "Hypnotic Pattern": "Padrão Hipnótico",

    "Ice Knife": "Faca de Gelo",
    "Ice Storm": "Tempestade de Gelo",
    "Icingdeath's Frost": "Geada de Icingdeath",
    "Identify": "Identificação",
    "Illusory Script": "Escrita Ilusória",
    "Immovable Object": "Objeto Imóvel",
    "Immolation": "Imolação",
    "Imprisonment": "Aprisionamento",
    "Incite Greed": "Incitar Ganância",
    "Incendiary Cloud": "Nuvem Incendiária",
    "Infernal Calling": "Convocação Infernal",
    "Infestation": "Infestação",
    "Inflict Wounds": "Infligir Ferimentos",
    "Insect Plague": "Praga de Insetos",
    "Instant Summons": "Convocação Instantânea",
    "Intellect Fortress": "Fortaleza do Intelecto",
    "Investiture of Flame": "Investidura de Chamas",
    "Investiture of Ice": "Investidura de Gelo",
    "Investiture of Stone": "Investidura de Pedra",
    "Investiture of Wind": "Investidura de Vento",
    "Invisibility": "Invisibilidade",
    "Invulnerability": "Invulnerabilidade",
    "Irresistible Dance": "Dança Irresistível",
    "Jim's Glowing Coin": "Moeda Brilhante de Jim",
    "Jim's Magic Missile": "Mísseis Mágicos de Jim",
    "Jump": "Salto",
    "Kinetic Jaunt": "Marcha Cinética",
    "Knock": "Abrir Fechaduras",
    "Legend Lore": "Conhecimento Lendário",
    "Lesser Restoration": "Restauração Menor",
    "Levitate": "Levitação",
    "Life Transference": "Transferência de Vida",
    "Light": "Luz",
    "Lightning Arrow": "Flecha Relampejante",
    "Lightning Bolt": "Relâmpago",
    "Lightning Lure": "Isca Elétrica",
    "Locate Animals or Plants": "Localizar Animais ou Plantas",
    "Locate Creature": "Localizar Criatura",
    "Locate Object": "Localizar Objeto",
    "Longstrider": "Passos Longos",

    "Maddening Darkness": "Escuridão Enlouquecedora",
    "Maelstrom": "Maelstrom",
    "Mage Armor": "Armadura Arcana",
    "Mage Hand": "Mão Mágica",
    "Magic Aura": "Aura Mágica",
    "Magic Circle": "Círculo Mágico",
    "Magic Jar": "Jarra Mágica",
    "Magic Missile": "Mísseis Mágicos",
    "Magic Mouth": "Boca Mágica",
    "Magic Stone": "Pedra Mágica",
    "Magic Weapon": "Arma Mágica",
    "Magnificent Mansion": "Mansão Magnífica",
    "Magnify Gravity": "Amplificar Gravidade",
    "Major Image": "Imagem Maior",
    "Mass Cure Wounds": "Curar Ferimentos em Massa",
    "Mass Heal": "Cura em Massa",
    "Mass Healing Word": "Palavra de Cura em Massa",
    "Mass Polymorph": "Metamorfose em Massa",
    "Mass Suggestion": "Sugestão em Massa",
    "Max Healing Word": "Palavra de Cura em Massa",
    "Maximilian's Earthen Grasp": "Garra Terrena de Maximilian",
    "Maze": "Labirinto",
    "Meld into Stone": "Fundir-se à Pedra",
    "Melf's Acid Arrow": "Flecha Ácida de Melf",
    "Melf's Minute Meteors": "Meteoros Minúsculos de Melf",
    "Mending": "Consertar",
    "Mental Prison": "Prisão Mental",
    "Message": "Mensagem",
    "Meteor Swarm": "Chuva de Meteoros",
    "Mighty Fortress": "Fortaleza Poderosa",
    "Mind Blank": "Mente em Branco",
    "Mind Sliver": "Lasca Mental",
    "Mind Spike": "Espinho Mental",
    "Minor Illusion": "Ilusão Menor",
    "Mirage Arcane": "Miragem Arcana",
    "Mirror Image": "Imagem Espelhada",
    "Mislead": "Enganar",
    "Misty Step": "Passo Nebuloso",
    "Modify Memory": "Modificar Memória",
    "Mold Earth": "Moldar Terra",
    "Moonbeam": "Raio Lunar",
    "Mordenkainen's Faithful Hound": "Cão Fiel de Mordenkainen",
    "Mordenkainen's Magnificent Mansion": "Mansão Magnífica de Mordenkainen",
    "Mordenkainen's Private Sanctum": "Santuário Particular de Mordenkainen",
    "Mordenkainen's Sword": "Espada de Mordenkainen",
    "Move Earth": "Mover Terra",

    "Nathair's Mischief": "Travessura de Nathair",
    "Negative Energy Flood": "Inundação de Energy Negativa",
    "Nondetection": "Não-detecção",
    "Nystul's Magic Aura": "Aura Mágica de Nystul",

    "Otiluke's Resilient Sphere": "Esfera Resiliente de Otiluke",
    "Otto's Irresistible Dance": "Dança Irresistível de Otto",

    "Pass without Trace": "Passos sem Pegadas",
    "Passwall": "Passagem",
    "Phantasmal Force": "Força Fantasmagórica",
    "Phantasmal Killer": "Assassino Fantasmagórico",
    "Phantom Steed": "Corcel Fantasma",
    "Planar Ally": "Aliado Planar",
    "Planar Binding": "Vínculo Planar",
    "Plane Shift": "Mudança de Plano",
    "Plant Growth": "Crescimento de Plantas",
    "Poison Spray": "Borrifo Venenoso",
    "Polymorph": "Metamorfose",
    "Power Word Heal": "Palavra de Poder Curativa",
    "Power Word Kill": "Palavra de Poder Mortal",
    "Power Word Pain": "Palavra de Poder Dolorosa",
    "Power Word Stun": "Palavra de Poder Atordoante",
    "Prayer of Healing": "Prece de Cura",
    "Prestidigitation": "Prestidigitação",
    "Primal Savagery": "Selvageria Primal",
    "Primordial Ward": "Proteção Primordial",
    "Prismatic Spray": "Borrifo Prismático",
    "Prismatic Wall": "Parede Prismática",
    "Private Sanctum": "Santuário Particular",
    "Produce Flame": "Produzir Chama",
    "Programmed Illusion": "Ilusão Programada",
    "Project Image": "Projetar Imagem",
    "Protection from Energy": "Proteção contra Energia",
    "Protection from Evil and Good": "Proteção contra o Bem e o Mal",
    "Protection from Poison": "Proteção contra Veneno",
    "Psychic Scream": "Grito Psíquico",
    "Pulse Wave": "Onda de Pulso",
    "Purify Food and Drink": "Purificar Alimento e Bebida",
    "Pyrotechnics": "Pirotecnia",

    "Raise Dead": "Levantar os Mortos",
    "Rary's Telepathic Bond": "Vínculo Telepático de Rary",
    "Raulothim's Psychic Lance": "Lança Psíquica de Raulothim",
    "Ravenous Void": "Vazio Voraz",
    "Ray of Enfeeblement": "Raio de Enfraquecimento",
    "Ray of Frost": "Raio de Gelo",
    "Ray of Sickness": "Raio de Doença",
    "Reality Break": "Quebra da Realidade",
    "Regenerate": "Regenerar",
    "Reincarnate": "Reencarnar",
    "Remove Curse": "Remover Maldição",
    "Resilient Sphere": "Esfera Resiliente",
    "Resistance": "Resistência",
    "Resurrection": "Ressurreição",
    "Reverse Gravity": "Inverter a Gravidade",
    "Revivify": "Revivificar",
    "Rime's Binding Ice": "Gelo Vinculador de Rime",
    "Rope Trick": "Truque da Corda",

    "Sacred Flame": "Chama Sagrada",
    "Sanctuary": "Santuário",
    "Sapping Sting": "Ferrão Debilitante",
    "Scatter": "Dispersar",
    "Scorching Ray": "Raio Ardente",
    "Scrying": "Vidência",
    "See Invisibility": "Ver o Invisível",
    "Seeming": "Aparência",
    "Sending": "Enviar Mensagem",
    "Sequester": "Sequestrar",
    "Shadow Blade": "Lâmina Sombria",
    "Shadow of Moil": "Sombra de Moil",
    "Shape Water": "Moldar Água",
    "Shapechange": "Metamorfose Suprema",
    "Shatter": "Estilhaçar",
    "Shield": "Escudo Arcano",
    "Shield of Faith": "Escudo da Fé",
    "Shillelagh": "Shillelagh",
    "Shocking Grasp": "Toque Chocante",
    "Sickening Radiance": "Radiância Nauseante",
    "Silence": "Silêncio",
    "Silent Image": "Imagem Silenciosa",
    "Silvery Barbs": "Farpas Prateadas",
    "Simulacrum": "Simulacro",
    "Skeletal Hands": "Mãos Esqueléticas",
    "Skill Empowerment": "Empoderamento de Perícia",
    "Sleep": "Sono",
    "Sleet Storm": "Tempestade de Granizo",
    "Slow": "Lentidão",
    "Snare": "Armadilha",
    "Snilloc's Snowball Swarm": "Enxame de Bolas de Neve de Snilloc",
    "Soul Cage": "Gaiola de Almas",
    "Spare the Dying": "Poupar os Moribundos",
    "Speak with Animals": "Falar com Animais",
    "Speak with Dead": "Falar com os Mortos",
    "Speak with Plants": "Falar com Plantas",
    "Spider Climb": "Escalada de Aranha",
    "Spike Growth": "Crescimento de Espinhos",
    "Spirit Guardians": "Guardiões Espirituais",
    "Spirit Shroud": "Mortalha Espiritual",
    "Spiritual Weapon": "Arma Espiritual",
    "Steel Wind Strike": "Golpe do Vento de Aço",
    "Stinking Cloud": "Nuvem Fedorenta",
    "Stone Shape": "Moldar Pedra",
    "Stoneskin": "Pele de Pedra",
    "Storm of Vengeance": "Tempestade da Vingança",
    "Storm Sphere": "Esfera da Tempestade",
    "Suggestion": "Sugestão",
    "Summon Aberration": "Convocar Aberração",
    "Summon Beast": "Convocar Besta",
    "Summon Celestial": "Convocar Celestial",
    "Summon Construct": "Convocar Constructo",
    "Summon Draconic Spirit": "Convocar Espírito Dracônico",
    "Summon Elemental": "Convocar Elemental",
    "Summon Fey": "Convocar Feérico",
    "Summon Fiend": "Convocar Ínfero",
    "Summon Greater Demon": "Convocar Demônio Superior",
    "Summon Lesser Demons": "Convocar Demônios Menores",
    "Summon Shadowspawn": "Convocar Criatura das Sombras",
    "Summon Undead": "Convocar Morto-vivo",
    "Sunbeam": "Raio Solar",
    "Sunburst": "Explosão Solar",
    "Swift Quiver": "Aljava Veloz",
    "Sword Burst": "Explosão de Espadas",
    "Sword Coast Adventurer's Guide": "Guia do Aventureiro da Costa da Espada",
    "Symbol": "Símbolo",
    "Synaptic Static": "Estática Sináptica",
    "Tasha's Bubbling Cauldron": "Caldeirão Borbulhante de Tasha",
    "Tasha's Caustic Brew": "Bebida Cáustica de Tasha",
    "Tasha's Hideous Laughter": "Riso Histérico de Tasha",
    "Tasha's Mind Whip": "Chicote Mental de Tasha",
    "Tasha's Otherworldly Guise": "Disfarce Extradimensional de Tasha",
    "Telekinesis": "Telecinese",
    "Telepathy": "Telepatia",
    "Telepathic Bond": "Vínculo Telepático",
    "Teleport": "Teletransporte",
    "Teleportation Circle": "Círculo de Teletransporte",
    "Temple of the Gods": "Templo dos Deuses",
    "Temporal Shunt": "Desvio Temporal",
    "Tenser's Floating Disk": "Disco Flutuante de Tenser",
    "Tenser's Transformation": "Transformação de Tenser",
    "Tether Essence": "Essência Presa",
    "Thaumaturgy": "Taumaturgia",
    "Thorn Whip": "Chicote de Espinhos",
    "Thunder Step": "Passo Trovejante",
    "Thunderclap": "Trovão",
    "Thunderwave": "Onda Trovejante",
    "Tidal Wave": "Onda de Maré",
    "Time Ravage": "Devastação Temporal",
    "Time Stop": "Parar o Tempo",
    "Tiny Hut": "Cabana Minúscula",
    "Tiny Servant": "Servo Minúsculo",
    "Toll the Dead": "Dobre os Sinos",
    "Tongues": "Idiomas",
    "Transport via Plants": "Transporte via Plantas",
    "Transmute Rock": "Transmutar Rocha",
    "Tree Stride": "Passo das Árvores",
    "True Polymorph": "Metamorfose Verdadeira",
    "True Resurrection": "Ressurreição Verdadeira",
    "True Seeing": "Visão Verdadeira",
    "True Strike": "Golpe Certeiro",
    "Tsunami": "Tsunami",
    "Unseen Servant": "Servo Invisível",
    "Vampiric Touch": "Toque Vampírico",
    "Vicious Mockery": "Zombaria Feroz",
    "Vitriolic Sphere": "Esfera Vitriólica",
    "Vortex Warp": "Distorção do Vórtice",
    "Wall of Fire": "Parede de Fogo",
    "Wall of Force": "Parede de Energia",
    "Wall of Ice": "Parede de Gelo",
    "Wall of Light": "Parede de Luz",
    "Wall of Sand": "Parede de Areia",
    "Wall of Stone": "Parede de Pedra",
    "Wall of Thorns": "Parede de Espinhos",
    "Wall of Water": "Parede de Água",
    "Warding Bond": "Vínculo Protetor",
    "Warding Wind": "Vento Protetor",
    "Water Breathing": "Respiração Aquática",
    "Water elemental": "Elemental da Água",
    "Water Walk": "Andar sobre as Águas",
    "Watery Sphere": "Esfera Aquosa",
    "Web": "Teia",
    "Weird": "Pesadelo",
    "Whirlwind": "Redemoinho",
    "Wind Walk": "Caminhar no Vento",
    "Wind Wall": "Parede de Vento",
    "Wish": "Desejo",
    "Witch Bolt": "Raio da Bruxa",
    "Wither and Bloom": "Murchar e Florescer",
    "Word of Radiance": "Palavra de Radiância",
    "Word of Recall": "Palavra de Recordação",
    "Wrath of Nature": "Ira da Natureza",
    "Wristpocket": "Bolso no Pulso",
    "Zephyr Strike": "Golpe do Zéfiro",
    "Zone of Truth": "Zona da Verdade",
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
                parts.push(`M (${spell.components.m})`); // Apenas repassa o texto do componente material
            } else if (spell.components.m.text) {
                parts.push(`M (${spell.components.m.text})`);
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

    return translated;
}
