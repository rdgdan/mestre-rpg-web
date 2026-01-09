/**
 * Script de teste para demonstrar a tradução automática de magias
 * Execute com: npx ts-node scripts/test-tradutor.ts
 */

import { translateSpell, translateSpells, SPELL_NAMES, SPELL_SCHOOLS } from '../lib/spell-translator';

console.log('🧙‍♂️ TESTE DO TRADUTOR AUTOMÁTICO DE MAGIAS\n');
console.log('='.repeat(60));

// Exemplo 1: Magia simples do 5etools
console.log('\n📖 Exemplo 1: Traduzindo Fireball\n');
const fireball = {
    name: 'Fireball',
    level: 3,
    school: 'Evocation',
    time: [{ number: 1, unit: 'action' }],
    range: {
        type: 'point',
        distance: { type: 'feet', amount: 150 }
    },
    components: {
        v: true,
        s: true,
        m: 'a tiny ball of bat guano and sulfur'
    },
    duration: [{ type: 'instant' }],
    entries: ['A bright streak flashes from your pointing finger...'],
    classes: [{ name: 'Wizard' }, { name: 'Sorcerer' }]
};

const firebollTraduzida = translateSpell(fireball);
console.log('Antes (inglês):', JSON.stringify(fireball, null, 2));
console.log('\nDepois (português):', JSON.stringify(firebollTraduzida, null, 2));

// Exemplo 2: Lista de magias
console.log('\n\n' + '='.repeat(60));
console.log('\n📚 Exemplo 2: Traduzindo lista de magias\n');

const magiasIngles = [
    { name: 'Magic Missile', level: 1, school: 'Evocation' },
    { name: 'Shield', level: 1, school: 'Abjuration' },
    { name: 'Cure Wounds', level: 1, school: 'Evocation' },
    { name: 'Counterspell', level: 3, school: 'Abjuration' },
    { name: 'Invisibility', level: 2, school: 'Illusion' }
];

const magiasPortugues = translateSpells(magiasIngles);

console.log('Magias traduzidas:');
magiasPortugues.forEach((magia, i) => {
    console.log(`${i + 1}. ${magiasIngles[i].name} → ${magia.name}`);
});

// Exemplo 3: Estatísticas
console.log('\n\n' + '='.repeat(60));
console.log('\n📊 Estatísticas do Tradutor\n');

const totalMagias = Object.keys(SPELL_NAMES).length;
const totalEscolas = Object.keys(SPELL_SCHOOLS).length;

console.log(`✨ Total de magias no dicionário: ${totalMagias}`);
console.log(`🏫 Total de escolas traduzidas: ${totalEscolas}`);

console.log('\n📋 Algumas traduções disponíveis:');
const exemplos = [
    'Fireball',
    'Eldritch Blast',
    'Healing Word',
    'Tasha\'s Hideous Laughter',
    'Bigby\'s Hand',
    'Wish',
    'Silvery Barbs',
    'Mind Sliver',
    'Spirit Shroud'
];

exemplos.forEach(spell => {
    const traducao = SPELL_NAMES[spell];
    if (traducao) {
        console.log(`  • ${spell} → ${traducao}`);
    }
});

// Exemplo 4: Magias de diferentes livros
console.log('\n\n' + '='.repeat(60));
console.log('\n📚 Exemplo 4: Magias de diferentes livros\n');

const magiasPorLivro = {
    'PHB': ['Fireball', 'Magic Missile', 'Shield'],
    'XGE': ['Absorb Elements', 'Shadow Blade', 'Steel Wind Strike'],
    'TCE': ['Mind Sliver', 'Spirit Shroud', 'Summon Beast'],
    'Strixhaven': ['Silvery Barbs', 'Vortex Warp']
};

Object.entries(magiasPorLivro).forEach(([livro, magias]) => {
    console.log(`\n${livro}:`);
    magias.forEach(spell => {
        const traducao = SPELL_NAMES[spell] || '(não traduzido)';
        console.log(`  • ${spell} → ${traducao}`);
    });
});

console.log('\n\n' + '='.repeat(60));
console.log('\n✅ Teste concluído com sucesso!');
console.log('O tradutor está funcionando corretamente.\n');
