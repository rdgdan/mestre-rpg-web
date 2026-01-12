
import { translateMonster } from '../lib/monster-translator';

const testCases = [
    "Alyxian the callous",
    "Cultist of bane",
    "Anchorite of talos",
    "Sheldon the blueberry dragon",
    "Lifferlas",
    "Fantasma",
    "Aartuk elder",
    "Aberrant spirit",
    "Animated stove"
];

console.log("--- DEBUG TRANSLATION ---");
testCases.forEach(name => {
    const result = translateMonster({ name, type: "Monstrosity" });
    console.log(`'${name}' -> '${result.name}'`);
});
