
export interface NPCTemplate {
    name: string;
    hp: number;
    ac: number;
    challenge: string;
    description: string;
}

export const npcTemplates: NPCTemplate[] = [
    { name: "Guarda", hp: 11, ac: 16, challenge: "1/8", description: "Um soldado comum da cidade." },
    { name: "Bandido", hp: 11, ac: 12, challenge: "1/8", description: "Um mercenário ou ladrão de estrada." },
    { name: "Cavaleiro", hp: 52, ac: 18, challenge: "3", description: "Um guerreiro blindado e experiente." },
    { name: "Mago (Aprendiz)", hp: 9, ac: 10, challenge: "1/4", description: "Um jovem estudante de artes arcanas." },
    { name: "Mago (Mestre)", hp: 40, ac: 12, challenge: "6", description: "Um conjurador poderoso." },
    { name: "Sacerdote", hp: 27, ac: 13, challenge: "2", description: "Um clérigo devoto." },
    { name: "Assassino", hp: 78, ac: 15, challenge: "8", description: "Um mestre da morte furtiva." },
    { name: "Valentão", hp: 32, ac: 13, challenge: "1/2", description: "Um capanga forte em uma taverna." },
    { name: "Cultista", hp: 9, ac: 12, challenge: "1/8", description: "Um seguidor fanático de uma divindade sombria." },
    { name: "Espião", hp: 27, ac: 12, challenge: "1", description: "Um infiltrador habilidoso." },
    { name: "Arqueiro", hp: 75, ac: 16, challenge: "3", description: "Um mestre do arco e flecha." },
    { name: "Berserker", hp: 67, ac: 13, challenge: "2", description: "Um guerreiro que luta com fúria cega." },
    { name: "Gladiador", hp: 112, ac: 16, challenge: "5", description: "Um mestre das arenas de combate." },
    { name: "Nobre", hp: 9, ac: 15, challenge: "1/8", description: "Um aristocrata treinado em esgrima básica." },
    { name: "Plebeu", hp: 4, ac: 10, challenge: "0", description: "Um cidadão comum." },
    { name: "Veterano", hp: 58, ac: 17, challenge: "3", description: "Um soldado que sobreviveu a muitas guerras." }
];
