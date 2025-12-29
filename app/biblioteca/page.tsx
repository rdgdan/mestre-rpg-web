'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { searchSpells, Spell } from '@/lib/spells-data';
import { searchMonsters, getMonsterTypes, MonsterDataExtended } from '@/lib/monsters-search';
import { dndWeapons } from '@/lib/items-data';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

// Componente Bestiário
function BestiarioTab({ searchQuery }: { searchQuery: string }) {
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [crMinFilter, setCrMinFilter] = useState<number | undefined>(undefined);
    const [crMaxFilter, setCrMaxFilter] = useState<number | undefined>(undefined);
    const [selectedMonster, setSelectedMonster] = useState<MonsterDataExtended | null>(null);

    const monsters = searchMonsters(searchQuery, {
        type: typeFilter || undefined,
        challengeMin: crMinFilter,
        challengeMax: crMaxFilter
    });

    const types = getMonsterTypes();

    return (
        <div>
            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">🐉 Bestiário</h2>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Tipo</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                    >
                        <option value="">Todos</option>
                        {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">CR Mínimo</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={crMinFilter ?? ''}
                        onChange={(e) => setCrMinFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">CR Máximo</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={crMaxFilter ?? ''}
                        onChange={(e) => setCrMaxFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                        placeholder="30"
                    />
                </div>
            </div>

            {/* Lista de Monstros */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {monsters.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhuma criatura encontrada.</p>
                    ) : (
                        monsters.map(monster => (
                            <div
                                key={monster.name}
                                onClick={() => setSelectedMonster(monster)}
                                className={`bg-rpg-slate border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedMonster?.name === monster.name ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'
                                    }`}
                            >
                                <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                    🐉 {monster.name}
                                </h3>
                                <p className="text-sm text-rpg-grey">
                                    CR {monster.challenge} • {monster.type} • {monster.xp} XP
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Detalhes do Monstro */}
                <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 sticky top-4">
                    {selectedMonster ? (
                        <div>
                            <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedMonster.name}</h3>
                            <p className="text-sm text-rpg-grey mb-4">{selectedMonster.type}</p>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="font-bold text-rpg-gold">CA:</span> {selectedMonster.ac}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">HP:</span> {selectedMonster.hp}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">CR:</span> {selectedMonster.challenge}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">XP:</span> {selectedMonster.xp}
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-rpg-gold/20">
                                    <p className="text-rpg-parchment leading-relaxed">{selectedMonster.description}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-rpg-grey py-12">
                            <p className="text-4xl mb-4">🐲</p>
                            <p>Selecione uma criatura para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente Itens
function ItensTab({ searchQuery }: { searchQuery: string }) {
    const [selectedItem, setSelectedItem] = useState<typeof dndWeapons[0] | null>(null);

    const items = dndWeapons.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.damageType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">⚗️ Enciclopédia de Armas</h2>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {items.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhum item encontrado.</p>
                    ) : (
                        items.map(item => (
                            <div
                                key={item.name}
                                onClick={() => setSelectedItem(item)}
                                className={`bg-rpg-slate border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedItem?.name === item.name ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'
                                    }`}
                            >
                                <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                    ⚔️ {item.name}
                                </h3>
                                <p className="text-sm text-rpg-grey">
                                    {item.damage} {item.damageType}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 sticky top-4">
                    {selectedItem ? (
                        <div>
                            <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedItem.name}</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="font-bold text-rpg-gold">Dano:</span> {selectedItem.damage}
                                </div>
                                <div>
                                    <span className="font-bold text-rpg-gold">Tipo:</span> {selectedItem.damageType}
                                </div>
                                <div className="pt-3 border-t border-rpg-gold/20">
                                    <span className="font-bold text-rpg-gold">Propriedades:</span>
                                    <ul className="list-disc list-inside mt-2 text-rpg-parchment">
                                        {selectedItem.properties.map((prop, idx) => (
                                            <li key={idx}>{prop}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-rpg-grey py-12">
                            <p className="text-4xl mb-4">⚔️</p>
                            <p>Selecione um item para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente Anotações do Mestre
function NotasTab() {
    const { user } = useAuth();
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        if (user) {
            loadNotes();
        }
    }, [user]);

    const loadNotes = async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'master_notes', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setNotes(docSnap.data().notes || '');
                setLastSaved(docSnap.data().updatedAt?.toDate() || null);
            }
        } catch (error) {
            console.error('Erro ao carregar anotações:', error);
        }
    };

    const saveNotes = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'master_notes', user.uid);
            await setDoc(docRef, {
                notes,
                updatedAt: new Date()
            });
            setLastSaved(new Date());
        } catch (error) {
            console.error('Erro ao salvar anotações:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-4">📜 Anotações do Mestre</h2>
            <p className="text-rpg-grey mb-6">Registre o Lore do seu mundo, Regras da Casa e notas de sessões.</p>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Digite suas anotações aqui..."
                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded p-4 text-rpg-parchment placeholder-rpg-grey min-h-[400px] focus:border-rpg-gold focus:outline-none transition-all font-mono text-sm"
            />
            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={saveNotes}
                    disabled={isSaving}
                    className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? '💾 Salvando...' : '💾 Salvar Anotações'}
                </button>
                {lastSaved && (
                    <span className="text-sm text-rpg-grey">
                        Última atualização: {lastSaved.toLocaleString('pt-BR')}
                    </span>
                )}
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
                        <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl flex items-center gap-2 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            <span>⚔️</span>
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

                    {activeTab === 'bestiario' && <BestiarioTab searchQuery={searchQuery} />}

                    {activeTab === 'itens' && <ItensTab searchQuery={searchQuery} />}

                    {activeTab === 'notas' && <NotasTab />}
                </div>
            </section>
        </div>
    );
}
