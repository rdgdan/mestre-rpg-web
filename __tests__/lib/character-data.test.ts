import { calculateComputedStats, createBlankCharacter } from '../../lib/character-data';
import { Character } from '../../lib/character-data';

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
    auth: { onAuthStateChanged: jest.fn() },
    db: {},
    googleProvider: {}
}));

// Mock only the Firestore calls in items-data, keep logic
jest.mock('../../lib/items-data', () => {
    const actual = jest.requireActual('../../lib/items-data');
    return {
        ...actual,
        fetchGlobalItems: jest.fn().mockResolvedValue([])
    };
});

describe('Character Logic Audit (D&D 5e Rules)', () => {
    let mockCharacter: Character;

    beforeEach(() => {
        mockCharacter = createBlankCharacter('test-user');
    });

    describe('Attribute Modifiers', () => {
        test('should calculate correct modifiers for various scores', () => {
            const testCases = [
                { score: 8, expected: -1 },
                { score: 10, expected: 0 },
                { score: 12, expected: 1 },
                { score: 14, expected: 2 },
                { score: 16, expected: 3 },
                { score: 18, expected: 4 },
                { score: 20, expected: 5 },
            ];

            testCases.forEach(({ score, expected }) => {
                mockCharacter.attributes.strength = score;
                const computed = calculateComputedStats(mockCharacter);
                expect(computed.attributeModifiers.strength).toBe(expected);
            });
        });
    });

    describe('Proficiency Bonus', () => {
        test('should scale correctly with total level', () => {
            const testCases = [
                { level: 1, expected: 2 },
                { level: 4, expected: 2 },
                { level: 5, expected: 3 },
                { level: 8, expected: 3 },
                { level: 9, expected: 4 },
                { level: 13, expected: 5 },
                { level: 17, expected: 6 },
                { level: 20, expected: 6 },
            ];

            testCases.forEach(({ level, expected }) => {
                mockCharacter.classes = [{ name: 'Guerreiro', level, subclass: '' }];
                const computed = calculateComputedStats(mockCharacter);
                expect(computed.proficiencyBonus).toBe(expected);
            });
        });
    });

    describe('Armor Class (AC) Calculation', () => {
        test('Unarmored AC should be 10 + Dex modifier', () => {
            mockCharacter.attributes.dexterity = 14; // Mod +2
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.armorClass).toBe(12);
        });

        test('Light Armor should add full Dex modifier', () => {
            mockCharacter.attributes.dexterity = 18; // Mod +4
            mockCharacter.inventory.otherEquipment = [{
                id: 'armor-1',
                name: 'Couro Batido',
                quantity: 1,
                isEquipped: true,
                armorClass: 12,
                type: 'armor'
            }];
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.armorClass).toBe(16); // 12 + 4
        });

        test('Medium Armor should cap Dex modifier at +2', () => {
            mockCharacter.attributes.dexterity = 18; // Mod +4
            mockCharacter.inventory.otherEquipment = [{
                id: 'armor-2',
                name: 'Meia-Armadura',
                quantity: 1,
                isEquipped: true,
                armorClass: 15,
                type: 'armor'
            }];
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.armorClass).toBe(17); // 15 + 2 (capped)
        });

        test('Heavy Armor should ignore Dex modifier', () => {
            mockCharacter.attributes.dexterity = 8; // Mod -1 (should be ignored)
            mockCharacter.inventory.otherEquipment = [{
                id: 'armor-3',
                name: 'Placa',
                quantity: 1,
                isEquipped: true,
                armorClass: 18,
                type: 'armor'
            }];
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.armorClass).toBe(18); // Flat 18
        });

        test('Barbarian Unarmored Defense should use Dex + Con', () => {
            mockCharacter.classes = [{ name: 'Bárbaro', level: 1 }];
            mockCharacter.attributes.dexterity = 14; // +2
            mockCharacter.attributes.constitution = 16; // +3
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.armorClass).toBe(15); // 10 + 2 + 3
        });

        test('Shield should add to AC', () => {
            mockCharacter.attributes.dexterity = 14; // +2
            mockCharacter.inventory.otherEquipment = [{
                id: 'shield-1',
                name: 'Escudo',
                quantity: 1,
                isEquipped: true,
                armorClass: 2,
                type: 'shield'
            }];
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.armorClass).toBe(14); // 10 + 2 + 2
        });
    });

    describe('Encumbrance and Speed', () => {
        test('Speed should decrease if weight exceeds capacity', () => {
            mockCharacter.attributes.strength = 10; // Capacity 75 lb
            mockCharacter.speed = 9;
            mockCharacter.inventory.otherEquipment = [{
                id: 'heavy-item',
                name: 'Bigornia',
                quantity: 1,
                weight: 100,
                type: 'other'
            }];
            const computed = calculateComputedStats(mockCharacter);
            expect(computed.speed).toBe(6); // 9 - 3
        });
    });

    describe('Character Hydration and Migration', () => {
        const { hydrateCharacter } = require('../../lib/character-data');

        test('should migrate legacy class field to classes array', () => {
            const legacyData = {
                class: 'Mago',
                level: 5,
                ownerId: 'user-1'
            };
            const hydrated = hydrateCharacter(legacyData, 'char-1');
            expect(hydrated.classes).toHaveLength(1);
            expect(hydrated.classes[0].name).toBe('Mago');
            expect(hydrated.classes[0].level).toBe(5);
        });

        test('should migrate legacy inventory (weapon with old format)', () => {
            const legacyData: any = {
                ownerId: 'user-1',
                inventory: {
                    weapons: [{
                        b: {
                            u: 'Espada Lendária',
                            damage: '2d6',
                            damageType: 'Cortante'
                        },
                        a: { c: 1 }
                    }]
                }
            };
            const hydrated = hydrateCharacter(legacyData, 'char-1');
            expect(hydrated.inventory.weapons).toHaveLength(1);
            expect(hydrated.inventory.weapons[0].name).toBe('Espada Lendária');
            expect(hydrated.inventory.weapons[0].diceQty).toBe(2);
            expect(hydrated.inventory.weapons[0].diceType).toBe('d6');
        });

        test('should identify weapons erroneously placed in equipment during legacy migration', () => {
            // Mocking dndWeapons to include 'Adaga' for detection
            const itemsData = require('../../lib/items-data');
            itemsData.dndWeapons = [{ name: 'Adaga', damage: '1d4' }];

            const legacyData: any = {
                ownerId: 'user-1',
                inventory: {
                    otherEquipment: [{
                        name: 'Adaga',
                        quantity: 1,
                        type: 'other' // Incorrectly typed as other
                    }]
                }
            };
            const hydrated = hydrateCharacter(legacyData, 'char-1');
            expect(hydrated.inventory.weapons).toHaveLength(1);
            expect(hydrated.inventory.weapons[0].name).toBe('Adaga');
            expect(hydrated.inventory.otherEquipment).toHaveLength(0);
        });
    });

    describe('Damage String Parsing', () => {
        const { parseDamageString } = require('../../lib/items-data');

        test('should parse simple damage strings', () => {
            expect(parseDamageString('1d6')).toEqual({ diceQty: 1, diceType: 'd6', diceBonus: 0, isCustomDamage: false });
            expect(parseDamageString('2d8 + 4')).toEqual({ diceQty: 2, diceType: 'd8', diceBonus: 4, isCustomDamage: false });
        });

        test('should handle irregular strings as custom damage', () => {
             const result = parseDamageString('Dano de fogo 10');
             expect(result.isCustomDamage).toBe(true);
        });
    });

    describe('Multiclass Spell Slots', () => {
        test('Two Full Casters (Wizard 3 / Cleric 2) should have level 5 slots', () => {
            mockCharacter.classes = [
                { name: 'Mago', level: 3 },
                { name: 'Clérigo', level: 2 }
            ];
            const computed = calculateComputedStats(mockCharacter);
            // Level 5 slots: 4, 3, 2
            expect(computed.spellcasting.slots['1'].max).toBe(4);
            expect(computed.spellcasting.slots['2'].max).toBe(3);
            expect(computed.spellcasting.slots['3'].max).toBe(2);
        });

        test('Full Caster + Half Caster (Wizard 3 / Paladin 2) should have level 4 slots', () => {
            mockCharacter.classes = [
                { name: 'Mago', level: 3 },
                { name: 'Paladino', level: 2 }
            ];
            const computed = calculateComputedStats(mockCharacter);
            // Caster Level = 3 + floor(2/2) = 4
            // Level 4 slots: 4, 3
            expect(computed.spellcasting.slots['1'].max).toBe(4);
            expect(computed.spellcasting.slots['2'].max).toBe(3);
            expect(computed.spellcasting.slots['3']).toBeUndefined();
        });

        test('Warlock slots should be separate (Sorcerer 3 / Warlock 2)', () => {
            mockCharacter.classes = [
                { name: 'Feiticeiro', level: 3 },
                { name: 'Bruxo', level: 2 }
            ];
            const computed = calculateComputedStats(mockCharacter);
            // Sorcerer 3 slots: 4, 2
            expect(computed.spellcasting.slots['1'].max).toBe(4);
            expect(computed.spellcasting.slots['2'].max).toBe(2);
            // Warlock 2 slots: 2 lvl 1 slots
            expect(computed.spellcasting.slots['pact'].max).toBe(2);
            expect(computed.spellcasting.pactLevel).toBe(1);
        });
    });
});
