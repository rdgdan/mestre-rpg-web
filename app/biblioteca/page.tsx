'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { searchSpells, Spell } from '@/lib/spells-data';

type TabType = 'grimorio' | 'bestiario' | 'itens' | 'notas';

// Componente Grimório
function GrimorioTab({ searchQuery }: { searchQuery: string }) {
    const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
    const [schoolFilter, setSchoolFilter] = useState<string>('');
    const [classFilter, setClassFilter] = useState<string>('');
    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

    const spells = searchSpells(searchQuery, {
        level: levelFilter,
        school: schoolFilter || undefined,
        class: classFilter || undefined
    });

    const schools = ['Abjuração', 'Adivinhação', 'Conjuração', 'Encantamento', 'Evocação', 'Ilusão', 'Necromancia', 'Transmutação'];
    const classes = ['Mago', 'Feiticeiro', 'Clérigo', 'Paladino', 'Druida', 'Bardo', 'Bruxo', 'Patrulheiro'];

    return (
        <div>
            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">✨ Grimório de Magias</h2>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Nível</label>
                    <select
                        value={levelFilter ?? ''}
                        onChange={(e) => setLevelFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                    >
                        <option value="">Todos</option>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                            <option key={level} value={level}>
                                {level === 0 ? 'Truque' : `Nível ${level}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Escola</label>
                    <select
                        value={schoolFilter}
                        onChange={(e) => setSchoolFilter(e.target.value)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                    >
                        <option value="">Todas</option>
                        {schools.map(school => (
                            <option key={school} value={school}>{school}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Classe</label>
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                    >
                        <option value="">Todas</option>
                        {classes.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de Magias */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {spells.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhuma magia encontrada.</p>
                    ) : (
                        spells.map(spell => (
                            <div
                                key={spell.id}
                                onClick={() => setSelectedSpell(spell)}
                                className={`bg-rpg-slate border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedSpell?.id === spell.id ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'
                                    }`}
                            >
                                <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                    {spell.level === 0 ? '🌟' : '✨'} {spell.name}
                                </h3>
                                <p className="text-sm text-rpg-grey">
                                    {spell.level === 0 ? 'Truque' : `Nível ${spell.level}`} • {spell.school}
                                    {spell.concentration && ' • Concentração'}
                                    {spell.ritual && ' • Ritual'}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Detalhes da Magia */}
                <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 sticky top-4">
                    {selectedSpell ? (
                        <div>
                            <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedSpell.name}</h3>
                            <p className="text-sm text-rpg-grey mb-4">
                                {selectedSpell.level === 0 ? 'Truque' : `Magia de Nível ${selectedSpell.level}`} • {selectedSpell.school}
                            </p>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="font-bold text-rpg-gold">Tempo de Conjuração:</span> {selectedSpell.castingTime}
                                </div>
                                <div>
                                    <span className="font-bold text-rpg-gold">Alcance:</span> {selectedSpell.range}
                                </div>
                                <div>
                                    <span className="font-bold text-rpg-gold">Componentes:</span> {selectedSpell.components}
                                </div>
                                <div>
                                    <span className="font-bold text-rpg-gold">Duração:</span> {selectedSpell.duration}
                                </div>
                                <div>
                                    <span className="font-bold text-rpg-gold">Classes:</span> {selectedSpell.classes.join(', ')}
                                </div>
                                <div className="pt-3 border-t border-rpg-gold/20">
                                    <p className="text-rpg-parchment leading-relaxed">{selectedSpell.description}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-rpg-grey py-12">
                            <p className="text-4xl mb-4">📖</p>
                            <p>Selecione uma magia para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BibliotecaPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('grimorio');
    const [searchQuery, setSearchQuery] = useState('');

    if (!user) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center font-cinzel text-rpg-gold">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">🔒 Acesso Restrito</h1>
                    <p className="text-rpg-parchment mb-8">Apenas membros da Guilda podem acessar a Grande Biblioteca.</p>
                    <Link href="/login" className="bg-rpg-gold text-rpg-dark px-8 py-3 rounded font-bold hover:scale-105 transition-all">
                        Entrar
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] font-lato">
            {/* HEADER */}
            <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-30 backdrop-blur-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl">
                            ⚔️
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-cinzel text-rpg-gold text-shadow-md">📚 A Grande Biblioteca</h1>
                            <p className="text-[10px] text-rpg-grey uppercase tracking-widest leading-none">Compêndio de Conhecimento Arcano</p>
                        </div>
                    </div>
                    <div className="text-sm text-rpg-grey">
                        Bem-vindo, <span className="text-rpg-gold font-bold">{user.displayName || 'Estudioso'}</span>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <section className="container mx-auto p-4 sm:p-8">
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {[
                        { id: 'grimorio' as TabType, label: '📖 Grimório', icon: '✨' },
                        { id: 'bestiario' as TabType, label: '🐉 Bestiário', icon: '⚔️' },
                        { id: 'itens' as TabType, label: '⚗️ Itens', icon: '💎' },
                        { id: 'notas' as TabType, label: '📜 Anotações', icon: '🖋️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded font-cinzel font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/30'
                                : 'bg-rpg-panel text-rpg-grey hover:bg-rpg-slate border border-rpg-gold/10'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* SEARCH BAR */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder={`Buscar em ${activeTab === 'grimorio' ? 'Magias' : activeTab === 'bestiario' ? 'Criaturas' : activeTab === 'itens' ? 'Itens' : 'Anotações'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-rpg-panel border border-rpg-gold/20 rounded px-4 py-3 text-rpg-parchment placeholder-rpg-grey focus:border-rpg-gold focus:outline-none transition-all"
                    />
                </div>

                {/* CONTENT */}
                <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 min-h-[500px]">
                    {activeTab === 'grimorio' && <GrimorioTab searchQuery={searchQuery} />}

                    {activeTab === 'bestiario' && (
                        <div>
                            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">🐉 Bestiário</h2>
                            <p className="text-rpg-grey">Em breve: Catálogo completo de monstros e criaturas.</p>
                        </div>
                    )}

                    {activeTab === 'itens' && (
                        <div>
                            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">⚗️ Enciclopédia de Itens</h2>
                            <p className="text-rpg-grey">Em breve: Base de dados de armas, armaduras e itens mágicos.</p>
                        </div>
                    )}

                    {activeTab === 'notas' && (
                        <div>
                            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">📜 Anotações do Mestre</h2>
                            <p className="text-rpg-grey mb-6">Registre o Lore do seu mundo, Regras da Casa e notas de sessões.</p>
                            <textarea
                                placeholder="Digite suas anotações aqui..."
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded p-4 text-rpg-parchment placeholder-rpg-grey min-h-[300px] focus:border-rpg-gold focus:outline-none transition-all"
                            />
                            <button className="mt-4 bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all">
                                💾 Salvar Anotações
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
