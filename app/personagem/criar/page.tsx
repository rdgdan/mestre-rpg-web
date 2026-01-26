
"use client";

import BackgroundModal from '@/components/ui/BackgroundModal';
import { StartingAttributesModal } from '@/components/ui/StartingAttributesModal';
import { StartingEquipmentModal } from '@/components/ui/StartingEquipmentModal';
import { StartingProficienciesModal } from '@/components/ui/StartingProficienciesModal';
import { useAuth } from '@/context/AuthContext';
import { Background } from '@/lib/backgrounds-data';
import {
    ATTRIBUTE_DISPLAY_NAMES,
    AttributeKey,
    calculateComputedStats,
    Character,
    createBlankCharacter,
    SKILLS
} from '@/lib/character-data';
import { CLASS_PROGRESSION, RACE_FEATURES } from '@/lib/class-features';
import { dndClasses, dndRaces } from '@/lib/dnd-data';
import { CLASS_SUMMARIES, RACE_SUMMARIES } from '@/lib/dnd-descriptions';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { RACE_BONUSES } from '@/lib/race-bonuses';
import { collection, doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreateCharacterPage() {
    const { user, loading: loadingAuth } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Seleções temporárias para detalhes
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedRace, setSelectedRace] = useState<string | null>(null);

    // Modals
    const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
    const [isProfModalOpen, setIsProfModalOpen] = useState(false);
    const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
    const [isBgModalOpen, setIsBgModalOpen] = useState(false);

    useEffect(() => {
        if (!loadingAuth && !user) {
            router.push('/login');
            return;
        }
        if (user && !character) {
            setCharacter(createBlankCharacter(user.uid));
        }
    }, [user, loadingAuth, character, router]);

    if (loadingAuth || !character) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-rpg-dark">
                <div className="text-rpg-gold font-cinzel text-2xl animate-pulse">Invocando Essência...</div>
            </div>
        );
    }

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => Math.max(1, prev - 1));

    const handleSelectClass = (cls: string) => {
        setCharacter(prev => prev ? { ...prev, class: cls } : null);
        nextStep();
    };

    const handleSelectRace = (race: string) => {
        setCharacter(prev => prev ? { ...prev, race: race } : null);
        nextStep();
    };

    const handleAttributesConfirm = (attrs: Record<AttributeKey, number>) => {
        setCharacter(prev => prev ? { ...prev, attributes: attrs } : null);
        setIsAttrModalOpen(false);
        nextStep();
    };

    const handleProficienciesConfirm = (skills: string[]) => {
        const skillMap: Record<string, boolean> = { ...(character?.skills || {}) };
        skills.forEach(s => skillMap[s] = true);
        setCharacter(prev => prev ? { ...prev, skills: skillMap as any } : null);
        setIsProfModalOpen(false);
        nextStep();
    };

    const handleBackgroundConfirm = (bg: Background) => {
        setCharacter(prev => {
            if (!prev) return null;
            const newSkills = { ...prev.skills };
            bg.skills.forEach(s => newSkills[s] = true);

            const newInv = { ...prev.inventory };
            newInv.currency.gp += bg.gold;

            // Adiciona equipamentos do background como itens de descrição por enquanto
            bg.equipment.forEach(item => {
                newInv.otherEquipment.push({
                    id: `bg-${Date.now()}-${Math.random()}`,
                    name: item,
                    quantity: 1,
                    type: 'other',
                    description: `Equipamento de ${bg.name}`
                });
            });

            return { ...prev, background: bg.name, skills: newSkills as any, inventory: newInv };
        });
        setIsBgModalOpen(false);
        nextStep();
    };

    const handleEquipmentConfirm = (items: any[]) => {
        setCharacter(prev => {
            if (!prev) return null;
            const newInv = { ...prev.inventory };
            items.forEach(item => {
                if (item.type === 'WEAPON') newInv.weapons.push(item);
                else newInv.otherEquipment.push(item);
            });
            return { ...prev, inventory: newInv };
        });
        setIsEquipModalOpen(false);
        nextStep();
    };

    const handleFinalize = async () => {
        if (!user || !character) return;
        setIsSaving(true);
        try {
            const finalChar = calculateComputedStats({
                ...character,
                createdAt: new Date().toISOString(),
                ownerId: user.uid
            });

            const newDocRef = doc(collection(db, 'personagens'));
            finalChar.id = newDocRef.id;

            await setDoc(newDocRef, JSON.parse(JSON.stringify(finalChar)));
            router.push(`/personagem/${newDocRef.id}`);
        } catch (err) {
            logger.error("Erro ao salvar personagem:", err);
            alert("Erro ao salvar personagem.");
        } finally {
            setIsSaving(false);
        }
    };

    const steps = [
        { id: 1, title: 'Classe' },
        { id: 2, title: 'Raça' },
        { id: 3, title: 'Antecedente' },
        { id: 4, title: 'Atributos' },
        { id: 5, title: 'Perícias' },
        { id: 6, title: 'Equipamento' },
        { id: 7, title: 'Finalizar' }
    ];

    return (
        <div className="min-h-screen bg-rpg-dark/95 text-rpg-parchment font-sans pb-20">
            {/* Header / Stepper */}
            <div className="bg-rpg-panel border-b border-rpg-gold/20 sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/home" className="text-rpg-gold hover:text-yellow-400 transition-colors font-cinzel text-sm uppercase flex items-center gap-2">
                        <span>&larr;</span> Desistir
                    </Link>

                    <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar py-2">
                        {steps.map(s => (
                            <div key={s.id} className="flex flex-col items-center min-w-max">
                                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${step >= s.id ? 'border-rpg-gold bg-rpg-gold text-rpg-dark shadow-glow-gold' : 'border-rpg-gold/20 text-rpg-gold/40'
                                    }`}>
                                    {s.id}
                                </span>
                                <span className={`text-[10px] uppercase font-black mt-1 tracking-widest ${step >= s.id ? 'text-rpg-gold' : 'text-rpg-gold/20'
                                    }`}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="w-20"></div> {/* Spacer for balance */}
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 mt-8 animate-fade-in">
                {/* ETAPA 1: CLASSE */}
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-3xl font-bold font-cinzel text-rpg-gold mb-6 border-b border-rpg-gold/20 pb-2">Escolha sua Classe</h2>
                            {dndClasses.map(cls => (
                                <button
                                    key={cls}
                                    onClick={() => setSelectedClass(cls)}
                                    className={`w-full p-4 rounded-lg border text-left transition-all flex justify-between items-center group ${selectedClass === cls ? 'bg-rpg-gold/20 border-rpg-gold text-shadow-glow' : 'bg-rpg-panel/40 border-rpg-gold/10 hover:border-rpg-gold/40'
                                        }`}
                                >
                                    <span className={`font-medieval text-xl ${selectedClass === cls ? 'text-rpg-gold' : 'text-rpg-parchment group-hover:text-rpg-gold'}`}>{cls}</span>
                                    {selectedClass === cls && <span className="text-rpg-gold">✨</span>}
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-2">
                            {selectedClass ? (
                                <div className="bg-rpg-panel p-8 rounded-xl border-2 border-rpg-gold/20 shadow-2xl animate-fade-up sticky top-28">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-5xl font-black font-cinzel text-rpg-gold mb-2">{selectedClass}</h3>
                                            <p className="text-rpg-parchment/60 italic font-medieval text-lg">{CLASS_SUMMARIES[selectedClass]}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSelectClass(selectedClass)}
                                            className="bg-rpg-gold text-rpg-dark px-10 py-4 rounded font-black uppercase tracking-widest hover:bg-yellow-400 hover:scale-105 transition-all shadow-glow-gold/40"
                                        >
                                            Escolher {selectedClass}
                                        </button>
                                    </div>

                                    <div className="space-y-6 border-t border-white/5 pt-6">
                                        <h4 className="text-xs font-black text-rpg-gold uppercase tracking-[0.3em]">Habilidades de Nível 1</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {CLASS_PROGRESSION[selectedClass]?.[1]?.features.map((f, i) => (
                                                <div key={i} className="bg-black/20 p-4 rounded-lg border border-white/5">
                                                    <h5 className="font-bold text-rpg-gold font-medieval">{f.name}</h5>
                                                    <p className="text-sm text-rpg-grey leading-relaxed">{f.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-rpg-gold/50 uppercase">
                                            <span>Dado de Vida: <span className="text-rpg-gold">{CLASS_PROGRESSION[selectedClass]?.[1]?.hitDice}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[60vh] flex flex-col items-center justify-center text-rpg-gold/20 border-2 border-dashed border-rpg-gold/10 rounded-xl">
                                    <span className="text-8xl mb-4 opacity-10">⚔️</span>
                                    <p className="font-cinzel text-xl tracking-widest">Selecione uma classe para ver os detalhes</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ETAPA 2: RAÇA */}
                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-3xl font-bold font-cinzel text-rpg-gold mb-6 border-b border-rpg-gold/20 pb-2">Escolha sua Raça</h2>
                            {dndRaces.map(race => (
                                <button
                                    key={race}
                                    onClick={() => setSelectedRace(race)}
                                    className={`w-full p-4 rounded-lg border text-left transition-all flex justify-between items-center group ${selectedRace === race ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-100 shadow-glow-emerald/10' : 'bg-rpg-panel/40 border-white/10 hover:border-emerald-500/30'
                                        }`}
                                >
                                    <span className={`font-medieval text-xl ${selectedRace === race ? 'text-emerald-300' : 'text-rpg-parchment group-hover:text-emerald-300'}`}>{race}</span>
                                    {selectedRace === race && <span className="text-emerald-400">🌿</span>}
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-2">
                            {selectedRace ? (
                                <div className="bg-rpg-panel p-8 rounded-xl border-2 border-emerald-500/20 shadow-2xl animate-fade-up sticky top-28">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-5xl font-black font-cinzel text-emerald-400 mb-2">{selectedRace}</h3>
                                            <p className="text-rpg-parchment/60 italic font-medieval text-lg">{RACE_SUMMARIES[selectedRace]}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSelectRace(selectedRace)}
                                            className="bg-emerald-600 text-white px-10 py-4 rounded font-black uppercase tracking-widest hover:bg-emerald-500 hover:scale-105 transition-all shadow-glow-emerald/40"
                                        >
                                            Escolher {selectedRace}
                                        </button>
                                    </div>

                                    <div className="space-y-6 border-t border-white/5 pt-6">
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            {RACE_BONUSES[selectedRace] && Object.entries(RACE_BONUSES[selectedRace]).map(([attr, bonus]) => (
                                                <div key={attr} className="bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-bold text-emerald-300">
                                                    + {bonus} {ATTRIBUTE_DISPLAY_NAMES[attr as AttributeKey]?.toUpperCase()}
                                                </div>
                                            ))}
                                        </div>

                                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em]">Traços Raciais</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {RACE_FEATURES[selectedRace]?.map((f, i) => (
                                                <div key={i} className="bg-black/20 p-4 rounded-lg border border-emerald-500/10">
                                                    <h5 className="font-bold text-emerald-300 font-medieval">{f.name}</h5>
                                                    <p className="text-sm text-rpg-grey leading-relaxed">{f.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[60vh] flex flex-col items-center justify-center text-emerald-500/10 border-2 border-dashed border-emerald-500/10 rounded-xl">
                                    <span className="text-8xl mb-4 opacity-10">🌿</span>
                                    <p className="font-cinzel text-xl tracking-widest">Selecione uma raça para ver os detalhes</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ETAPA 3: ANTECEDENTE */}
                {step === 3 && (
                    <div className="text-center py-20">
                        <div className="max-w-2xl mx-auto space-y-8 bg-rpg-panel/60 p-12 rounded-2xl border border-rpg-gold/20 shadow-2xl">
                            <h2 className="text-4xl font-bold font-cinzel text-rpg-gold">Sua História</h2>
                            <p className="text-rpg-parchment/70 font-medieval text-xl">
                                O que você fazia antes de se tornar um aventureiro? Seu antecedente define suas perícias extras e equipamentos iniciais.
                            </p>
                            <button
                                onClick={() => setIsBgModalOpen(true)}
                                className="bg-gradient-to-r from-rpg-gold to-yellow-600 text-rpg-dark px-12 py-5 rounded-lg font-black uppercase text-lg tracking-widest hover:scale-105 transition-all shadow-glow-gold"
                            >
                                Definir Antecedente
                            </button>
                        </div>
                    </div>
                )}

                {/* ETAPA 4: ATRIBUTOS */}
                {step === 4 && (
                    <div className="text-center py-20">
                        <div className="max-w-2xl mx-auto space-y-8 bg-rpg-panel/60 p-12 rounded-2xl border border-rpg-gold/20 shadow-2xl">
                            <h2 className="text-4xl font-bold font-cinzel text-rpg-gold">Poder e Potencial</h2>
                            <p className="text-rpg-parchment/70 font-medieval text-xl">
                                Chegou a hora de definir as forças e fraquezas de <strong className="text-rpg-gold">{character.name || 'seu herói'}</strong>.
                                Usaremos o método do <strong className="text-rpg-gold italic">Standard Array</strong> para balancear seus atributos.
                            </p>
                            <button
                                onClick={() => setIsAttrModalOpen(true)}
                                className="bg-gradient-to-r from-rpg-gold to-yellow-600 text-rpg-dark px-12 py-5 rounded-lg font-black uppercase text-lg tracking-widest hover:scale-105 transition-all shadow-glow-gold"
                            >
                                Iniciar Distribuição
                            </button>
                        </div>
                    </div>
                )}

                {/* ETAPA 5: PERÍCIAS */}
                {step === 5 && (
                    <div className="text-center py-20">
                        <div className="max-w-2xl mx-auto space-y-8 bg-rpg-panel/60 p-12 rounded-2xl border border-rpg-gold/20 shadow-2xl">
                            <h2 className="text-4xl font-bold font-cinzel text-rpg-gold">Talentos e Aptidões</h2>
                            <p className="text-rpg-parchment/70 font-medieval text-xl">
                                O que <strong className="text-rpg-gold">{character.class}</strong> sabe fazer de melhor?
                                Escolha as perícias que definem seu treinamento e experiência.
                            </p>
                            <button
                                onClick={() => setIsProfModalOpen(true)}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-12 py-5 rounded-lg font-black uppercase text-lg tracking-widest hover:scale-105 transition-all shadow-glow-purple"
                            >
                                Escolher Perícias
                            </button>
                        </div>
                    </div>
                )}

                {/* ETAPA 6: EQUIPAMENTO */}
                {step === 6 && (
                    <div className="text-center py-20">
                        <div className="max-w-2xl mx-auto space-y-8 bg-rpg-panel/60 p-12 rounded-2xl border border-rpg-gold/20 shadow-2xl">
                            <h2 className="text-4xl font-bold font-cinzel text-rpg-gold">Armas e Provisões</h2>
                            <p className="text-rpg-parchment/70 font-medieval text-xl">
                                Um aventureiro não sobrevive apenas com coragem.
                                Equipe seu herói com os itens necessários para a primeira jornada.
                            </p>
                            <button
                                onClick={() => setIsEquipModalOpen(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-12 py-5 rounded-lg font-black uppercase text-lg tracking-widest hover:scale-105 transition-all shadow-glow-emerald"
                            >
                                Abrir Arsenal
                            </button>
                        </div>
                    </div>
                )}

                {/* ETAPA 7: FINALIZAR */}
                {step === 7 && (
                    <div className="max-w-6xl mx-auto p-4 lg:p-12 animate-fade-up">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* COLUNA ESQUERDA: Identidade e Finalização */}
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-rpg-panel border-4 border-rpg-gold shadow-2xl rounded-2xl p-8">
                                    <h2 className="text-3xl font-black font-cinzel text-rpg-gold text-center mb-6">Dê um Nome à Lenda</h2>

                                    <input
                                        type="text"
                                        value={character.name}
                                        onChange={e => setCharacter(p => p ? { ...p, name: e.target.value } : null)}
                                        placeholder="Nome do Herói"
                                        className="w-full bg-black/40 border-2 border-rpg-gold/30 p-4 text-xl font-medieval text-rpg-gold focus:border-rpg-gold outline-none text-center rounded-xl mb-6 placeholder-rpg-grey/30"
                                    />

                                    <div className="grid grid-cols-2 gap-4 text-center border-y border-white/5 py-6 mb-6">
                                        <div>
                                            <span className="block text-[10px] uppercase font-black text-rpg-gold">Raça</span>
                                            <span className="text-xl font-medieval text-rpg-parchment">{character.race}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-black text-rpg-gold">Classe</span>
                                            <span className="text-xl font-medieval text-rpg-parchment">{character.class}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleFinalize}
                                        disabled={!character.name || isSaving}
                                        className={`w-full py-4 rounded-xl font-black uppercase text-lg tracking-[0.2em] transition-all shadow-glow-gold ${!character.name || isSaving ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-rpg-gold text-rpg-dark hover:scale-105'
                                            }`}
                                    >
                                        {isSaving ? 'Gravando...' : 'Concluir Herói'}
                                    </button>
                                </div>
                            </div>

                            {/* COLUNA DIREITA: Resumo Técnico */}
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-xl font-bold font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-2">Resumo das Habilidades</h3>

                                {/* ATRIBUTOS */}
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {Object.entries(character.attributes).map(([key, val]) => {
                                        const mod = Math.floor((val - 10) / 2);
                                        return (
                                            <div key={key} className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-2 text-center">
                                                <div className="text-[10px] uppercase font-bold text-rpg-grey truncaté">{ATTRIBUTE_DISPLAY_NAMES[key as AttributeKey].substring(0, 3)}</div>
                                                <div className="text-xl font-medieval text-rpg-parchment">{val}</div>
                                                <div className={`text-xs font-bold ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {mod >= 0 ? '+' : ''}{mod}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* COMBATE & VIDA */}
                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                        <h4 className="text-sm font-bold text-rpg-gold uppercase mb-3 font-cinzel">Estatísticas de Combate</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-rpg-dark/50 p-3 rounded flex flex-col items-center">
                                                <span className="text-[10px] text-rpg-grey uppercase">Vida (Nvl 1)</span>
                                                <span className="text-2xl font-medieval text-red-400 font-bold">
                                                    {(() => {
                                                        const hitDie = CLASS_PROGRESSION[character.class]?.[1]?.hitDice ? parseInt(CLASS_PROGRESSION[character.class][1].hitDice.replace('1d', '')) : 8;
                                                        const conMod = Math.floor((character.attributes.constitution - 10) / 2);
                                                        return hitDie + conMod;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="bg-rpg-dark/50 p-3 rounded flex flex-col items-center">
                                                <span className="text-[10px] text-rpg-grey uppercase">Classe de Armadura</span>
                                                <span className="text-2xl font-medieval text-blue-300 font-bold">
                                                    {calculateComputedStats({ ...character, level: 1 }).armorClass}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PERÍCIAS */}
                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                        <h4 className="text-sm font-bold text-rpg-gold uppercase mb-3 font-cinzel">Perícias Treinadas</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                const skillNames = Object.keys(character.skills || {}).map(skillKey => {
                                                    const skillData = SKILLS.find(s => s.key === skillKey);
                                                    return skillData ? skillData.displayName : skillKey;
                                                });
                                                const uniqueNames = Array.from(new Set(skillNames));

                                                return uniqueNames.map(displayName => (
                                                    <span key={displayName} className="text-[10px] font-bold bg-rpg-slate px-3 py-1.5 rounded-full text-rpg-parchment border border-rpg-gold/20 shadow-sm uppercase tracking-wider">
                                                        {displayName}
                                                    </span>
                                                ));
                                            })()}
                                            {Object.keys(character.skills || {}).length === 0 && (
                                                <span className="text-xs text-rpg-grey italic opacity-50">Nenhuma perícia selecionada</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* FEATURES */}
                                <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                                    <h4 className="text-sm font-bold text-rpg-gold uppercase mb-6 font-cinzel border-b border-rpg-gold/10 pb-2">Características de Classe & Raça</h4>
                                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                                        {/* Class Features */}
                                        {CLASS_PROGRESSION[character.class]?.[1]?.features.map((f, i) => (
                                            <div key={`cls-${i}`} className="bg-rpg-panel/40 p-4 rounded-lg border-l-4 border-rpg-gold shadow-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-rpg-gold text-xs">✦</span>
                                                    <h5 className="font-bold text-rpg-gold font-medieval text-base uppercase tracking-wider">{f.name}</h5>
                                                    <span className="text-[9px] bg-rpg-gold/10 text-rpg-gold px-2 py-0.5 rounded border border-rpg-gold/20 font-black ml-auto">CLASSE</span>
                                                </div>
                                                <p className="text-sm text-rpg-parchment/90 leading-relaxed font-sans">{f.description}</p>
                                            </div>
                                        ))}
                                        {/* Race Features */}
                                        {RACE_FEATURES[character.race]?.map((f, i) => (
                                            <div key={`race-${i}`} className="bg-emerald-950/20 p-4 rounded-lg border-l-4 border-emerald-500 shadow-md">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-emerald-400 text-xs">✦</span>
                                                    <h5 className="font-bold text-emerald-300 font-medieval text-base uppercase tracking-wider">{f.name}</h5>
                                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-black ml-auto">RAÇA</span>
                                                </div>
                                                <p className="text-sm text-rpg-parchment/90 leading-relaxed font-sans">{f.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-[10px] text-rpg-grey text-center italic">
                                    * Ao clicar em concluir, seu personagem será salvo no banco de dados. Caso desista agora, nenhum dado será gravado.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Controle de Navegação Inferior (Mobile/Suporte) */}
            <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md p-4 border-t border-white/10 z-[100]">
                <div className="max-w-6xl mx-auto flex justify-between gap-4">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className="px-6 py-3 rounded bg-rpg-slate text-rpg-parchment font-bold uppercase text-xs disabled:opacity-20"
                    >
                        Voltar
                    </button>
                    {step > 2 && step < 7 && (
                        <span className="text-rpg-gold font-cinzel text-xs flex items-center animate-pulse">Ação Requerida no Modal</span>
                    )}
                </div>
            </div>

            {/* Modals persistentes */}
            <StartingAttributesModal
                isOpen={isAttrModalOpen}
                onClose={() => setIsAttrModalOpen(false)}
                race={character.race}
                className={character.class}
                onConfirm={handleAttributesConfirm}
            />
            <StartingProficienciesModal
                isOpen={isProfModalOpen}
                onClose={() => setIsProfModalOpen(false)}
                className={character.class}
                onConfirm={handleProficienciesConfirm}
            />
            <StartingEquipmentModal
                isOpen={isEquipModalOpen}
                onClose={() => setIsEquipModalOpen(false)}
                className={character.class}
                background={character.background}
                onConfirm={handleEquipmentConfirm}
            />
            <BackgroundModal
                isOpen={isBgModalOpen}
                onClose={() => setIsBgModalOpen(false)}
                onConfirm={handleBackgroundConfirm}
                currentBackground={character.background}
            />
        </div>
    );
}
