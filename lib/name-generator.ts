// lib/name-generator.ts

type Gender = 'male' | 'female';
type Race = 'human' | 'elf' | 'dwarf' | 'orc' | 'halfling' | 'goblin' | 'tiefling' | 'dragonborn';

interface NameData {
    male: string[];
    female: string[];
    surnames: string[];
    titles?: string[];
}

const NAME_DATA: Record<Race, NameData> = {
    human: {
        male: ["Alaric", "Borin", "Cedric", "Darin", "Eldrin", "Faren", "Gareth", "Haldor", "Ivor", "Jareth", "Kael", "Lorin", "Marek", "Norin", "Oric", "Perrin", "Quentin", "Roric", "Seth", "Torin", "Ulrich", "Valen", "Warin", "Xander", "Yoric", "Zane"],
        female: ["Alana", "Brea", "Caelia", "Dara", "Elena", "Fia", "Gwen", "Hana", "Isla", "Jana", "Kaela", "Lia", "Mara", "Nora", "Orla", "Petra", "Quinn", "Ria", "Sara", "Tana", "Una", "Vera", "Willa", "Xena", "Yana", "Zara"],
        surnames: ["Blackwood", "Crownguard", "Dawnstrider", "Emberfall", "Frostborn", "Goldleaf", "Highshield", "Ironfist", "Jadetree", "Kingsbane", "Lightbringer", "Moonshadow", "Nightwalker", "Oakenshield", "Pyreheart", "Quickstep", "Ravenshade", "Stormcaller", "Thunderstrike", "Underhill", "Valorshine", "Windwhisper", "Xylander", "Yewdale", "Zephyr"]
    },
    elf: {
        male: ["Adran", "Aelar", "Beiro", "Carric", "Dain", "Erdan", "Gennal", "Heian", "Ilannis", "Leo", "Mindartis", "Paelias", "Peren", "Quarion", "Riardon", "Soveliss", "Thamior", "Tharivol", "Theren", "Varis"],
        female: ["Adrie", "Althaea", "Anastrianna", "Andraste", "Antinua", "Bethrynna", "Birel", "Caelynn", "Drusilia", "Enna", "Felosial", "Ielenia", "Jelenneth", "Keyleth", "Leshanna", "Lia", "Meriele", "Mialee", "Naivara", "Quelenna", "Sariel", "Shanairra", "Shava", "Silaqui", "Theirastra", "Thia", "Vadania", "Valanthe", "Xanaphia"],
        surnames: ["Amakiir", "Amastacia", "Galanodel", "Holimion", "Ilphelkiir", "Liadon", "Meliamne", "Nailo", "Siannodel", "Xiloscient"]
    },
    dwarf: {
        male: ["Adrik", "Baern", "Brottor", "Bruenor", "Dain", "Darrak", "Delg", "Eberk", "Einkil", "Fargrim", "Flint", "Gardain", "Harbek", "Kildrak", "Morgran", "Orsik", "Oskar", "Rangrim", "Rurik", "Taklinn", "Thoradin", "Thorin", "Tordek", "Traubon", "Travok", "Ulfgar", "Veit", "Vondal"],
        female: ["Amber", "Artin", "Audhild", "Bardryn", "Dagnal", "Diesa", "Eldeth", "Falkrunn", "Finellen", "Gunnloda", "Gurdis", "Helja", "Hlin", "Kathra", "Kristryd", "Ilde", "Liftrasa", "Mardred", "Riswynn", "Sannl", "Torbera", "Torgga", "Vistra"],
        surnames: ["Balderk", "Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Gorunn", "Holderhek", "Ironfist", "Loderr", "Lutgehr", "Rumnaheim", "Strakeln", "Torunn", "Ungart"]
    },
    orc: {
        male: ["Dench", "Feng", "Gell", "Henk", "Holg", "Imsh", "Keth", "Krusk", "Mhurren", "Ront", "Shump", "Thokk"],
        female: ["Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Ownka", "Shautha", "Sutha", "Vola", "Volen", "Yevelda"],
        surnames: ["Bonecrusher", "Bloodaxe", "Deathbringer", "Doomhammer", "Fleshripper", "Gorefang", "Ironhide", "Killjoy", "Rageclaw", "Skullsmash", "Thunderroar", "Warpath"]
    },
    halfling: {
        male: ["Alton", "Ander", "Cade", "Corrin", "Eldon", "Errich", "Finnan", "Garret", "Lindal", "Lyle", "Merric", "Milo", "Osborn", "Perrin", "Reed", "Roscoe", "Wellby"],
        female: ["Andry", "Bree", "Callie", "Cora", "Euphemia", "Jillian", "Kithri", "Lavinia", "Lidda", "Merla", "Nedda", "Paela", "Portia", "Seraphina", "Shaena", "Trym", "Vani", "Verna"],
        surnames: ["Brushgather", "Goodbarrel", "Greenbottle", "High-hill", "Hilltopple", "Leagallow", "Tealeaf", "Thorngage", "Tosscobble", "Underbough"]
    },
    goblin: {
        male: ["Griz", "Raz", "Vig", "Zog", "Glug", "Nux", "Rix", "Bok", "Zek", "Krug"],
        female: ["Vex", "Nix", "Zil", "Tix", "Ruz", "Mog", "Laz", "Fiz", "Bix", "Wix"],
        surnames: ["Ratcatcher", "Toebiter", "Fleabag", "Scabpicker", "Nosepicker", "Earbiter", "Anklebiter", "Shinsplinter"]
    },
    tiefling: {
        male: ["Akmenos", "Amnon", "Barakas", "Damakos", "Ekemon", "Iados", "Kairon", "Leucis", "Melech", "Mordai", "Morthos", "Pelaios", "Skamos", "Therai"],
        female: ["Akta", "Anakis", "Bryseis", "Criella", "Damaia", "Ea", "Kallista", "Lerissa", "Makaria", "Nemeia", "Orianna", "Phelaia", "Rieta"],
        surnames: ["Fear", "Hope", "Despair", "Torment", "Sorrow", "Joy", "Glory", "Pride", "Wrath", "Greed"]
    },
    dragonborn: {
        male: ["Arjhan", "Balasar", "Bharash", "Donaar", "Ghesh", "Heskan", "Kriv", "Medrash", "Mehen", "Nadarr", "Pandjed", "Patrin", "Rhogar", "Shamash", "Shedinn", "Tarhun", "Torinn"],
        female: ["Akra", "Biri", "Daar", "Farideh", "Harann", "Havilar", "Jheri", "Kava", "Korinn", "Mishann", "Nala", "Perra", "Raiann", "Sora", "Surina", "Thava", "Uadjit"],
        surnames: ["Clethtinthiallor", "Daardendrian", "Delmirev", "Drachedandion", "Fenkenkabradon", "Kepeshkmolik", "Kerrhylon", "Kimbatuul", "Linxakasendalor", "Myastan", "Nemmonis", "Norixius", "Ophinshtalajiir", "Prexijandilin", "Shestendeliath", "Turnuroth", "Verthisathurgiesh", "Yarjerit"]
    }
};

export function generateName(race: Race = 'human', gender?: Gender): string {
    const data = NAME_DATA[race];

    // Select gender randomly if not provided
    const selectedGender = gender || (Math.random() > 0.5 ? 'male' : 'female');
    const firstNames = data[selectedGender];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const surname = data.surnames[Math.floor(Math.random() * data.surnames.length)];

    return `${firstName} ${surname}`;
}

export function generateRandomName(): { name: string, race: Race, gender: Gender } {
    const races = Object.keys(NAME_DATA) as Race[];
    const race = races[Math.floor(Math.random() * races.length)];
    const gender = Math.random() > 0.5 ? 'male' : 'female';

    return {
        name: generateName(race, gender),
        race,
        gender
    };
}
