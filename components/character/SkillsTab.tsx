import React, { useState, useMemo } from 'react';
import { Character, SKILLS } from '@/lib/character-data';
import { SkillCheckbox } from './SkillCheckbox';

interface SkillsTabProps {
    character: Character;
    isReadOnly: boolean;
    activeSkillSubTab: 'skills' | 'features' | 'feats';
    setActiveSkillSubTab: (tab: 'skills' | 'features' | 'feats') => void;
    skillSearchQuery: string;
    setSkillSearchQuery: (query: string) => void;
    handleNestedChange: (path: string, value: any) => void;
    updateCharacter: (updater: (char: Character) => Character) => void;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
    character,
    isReadOnly,
    activeSkillSubTab,
    setActiveSkillSubTab,
    skillSearchQuery,
    setSkillSearchQuery,
    handleNestedChange,
    updateCharacter
}) => {
    const [editingFeature, setEditingFeature] = useState<any | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);

    const handleSaveFeature = () => {
        if (!editingFeature.name) return;

        updateCharacter(char => {
            const features = [...(char.features || [])];
            if (isAddMode) {
                features.push({ ...editingFeature, id: Date.now().toString() });
            } else {
                const idx = features.findIndex(f => f.name === editingFeature._originalName || f.id === editingFeature.id);
                if (idx !== -1) {
                    features[idx] = { ...editingFeature };
                    delete (features[idx] as any)._originalName;
                }
            }
            return { ...char, features };
        });
        setEditingFeature(null);
        setIsAddMode(false);
    };

    const handleDeleteFeature = (featName: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${featName}"?`)) return;
        updateCharacter(char => ({
            ...char,
            features: (char.features || []).filter(f => f.name !== featName)
        }));
    };

    const openAddModal = () => {
        setIsAddMode(true);
        setEditingFeature({
            name: '',
            description: '',
            type: activeSkillSubTab === 'feats' ? 'feat' : 'class',
            source: '',
            level: 1
        });
    };

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-4">
            {/* Cabeçalho de Navegação Interna e Busca */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-5 card-glass border-none p-4 shadow-xl">
                <div className="flex p-1.5 bg-black/20 rounded-xl border border-white/5 self-stretch md:self-auto">
                    {[
                        { id: 'skills', label: 'Perícias' },
                        { id: 'features', label: 'Características' },
                        { id: 'feats', label: 'Talentos' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSkillSubTab(tab.id as any)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg transition-all text-[11px] font-black uppercase tracking-widest ${activeSkillSubTab === tab.id ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'text-rpg-grey/60 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {!isReadOnly && activeSkillSubTab !== 'skills' && (
                        <button 
                            onClick={openAddModal}
                            className="btn-premium px-5 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                            ADICIONAR
                        </button>
                    )}
                    <div className="relative flex-grow md:w-72 group">
                        <input
                            type="text"
                            placeholder="Buscar habilidade..."
                            value={skillSearchQuery}
                            onChange={(e) => setSkillSearchQuery(e.target.value)}
                            className="w-full card-glass border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-rpg-gold/40 outline-none placeholder:text-rpg-grey/30 transition-all group-hover:bg-white/5"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-3 h-4 w-4 text-rpg-gold/40 group-focus-within:text-rpg-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Conteúdo Dinâmico das Sub-Abas */}
            <div className="flex-grow overflow-hidden card-glass border-none shadow-2xl p-6 min-h-[500px] relative group/content">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />
                {activeSkillSubTab === 'skills' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {SKILLS.filter(s => s.displayName.toLowerCase().includes(skillSearchQuery.toLowerCase())).map((skill) => (
                            <SkillCheckbox
                                key={skill.key}
                                skillKey={skill.key}
                                displayName={skill.displayName}
                                attribute={skill.attribute}
                                isProficient={character.skills[skill.key]}
                                proficiencyBonus={character.proficiencyBonus}
                                attributeMod={character.attributeModifiers[skill.attribute]}
                                onChange={(k: any, v: any) => handleNestedChange(`skills.${k}`, v)}
                                disabled={isReadOnly}
                            />
                        ))}
                    </div>
                )}

                {activeSkillSubTab === 'features' && (
                    <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-8">
                        {(() => {
                            const feats = (character.features || []).filter(f =>
                                (f.type === 'class' || f.type === 'race' || !f.type) &&
                                (f.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                                    f.description.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                            );

                            if (feats.length === 0) return (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <p className="italic">Nenhuma característica encontrada.</p>
                                </div>
                            );

                            // Agrupar por nível ou categoria
                            const groups: Record<string, typeof feats> = {};
                            feats.forEach(f => {
                                const key = f.level ? `Nível ${f.level}` : (f.type === 'race' ? 'Habilidades de Raça' : 'Especiais');
                                if (!groups[key]) groups[key] = [];
                                groups[key].push(f);
                            });

                            return Object.entries(groups)
                                .sort((a, b) => {
                                    if (a[0] === 'Habilidades de Raça') return -1;
                                    if (b[0] === 'Habilidades de Raça') return 1;
                                    if (a[0] === 'Especiais') return 1;
                                    if (b[0] === 'Especiais') return -1;
                                    return parseInt(a[0].replace(/\D/g, '')) - parseInt(b[0].replace(/\D/g, ''));
                                })
                                .map(([group, groupFeats]) => (
                                    <div key={group} className="space-y-3">
                                        <div className="flex items-center gap-3 border-b border-rpg-gold/10 pb-2 mb-4">
                                            <div className="w-8 h-8 rounded bg-rpg-gold/10 flex items-center justify-center border border-rpg-gold/20 shadow-glow-gold/10">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rpg-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-rpg-gold font-cinzel">{group}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {groupFeats.map((feat, idx) => (
                                                <details key={idx} className="group/feat card-glass border-none overflow-hidden transition-all duration-300 hover:bg-white/5 shadow-lg">
                                                    <summary className="flex justify-between items-center p-5 cursor-pointer list-none select-none relative z-10">
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${feat.type === 'race' ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-emerald-500/20' : 'from-rpg-gold/20 to-rpg-gold/5 text-rpg-gold border-rpg-gold/20'} border transition-transform group-hover/feat:scale-105`}>
                                                                {feat.type === 'race' ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black font-serif text-xl text-white group-hover/feat:text-rpg-gold-light transition-colors">{feat.name}</h5>
                                                                <div className="flex gap-2.5 mt-1.5">
                                                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${feat.type === 'race' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'}`}>
                                                                        {feat.type === 'race' ? 'Ancestralidade' : (feat.source || character.class)}
                                                                    </span>
                                                                    {feat.level && <span className="text-[9px] bg-white/5 text-rpg-grey/60 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-white/5">Círculo {feat.level}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {!isReadOnly && (
                                                                <div className="flex gap-2 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.preventDefault(); e.stopPropagation(); setIsAddMode(false);
                                                                            setEditingFeature({ ...feat, _originalName: feat.name });
                                                                        }}
                                                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500/5 text-blue-400/50 hover:bg-blue-500 hover:text-white border border-blue-500/10 transition-all"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.preventDefault(); e.stopPropagation(); handleDeleteFeature(feat.name);
                                                                        }}
                                                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/5 text-red-400/50 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className={`p-1.5 rounded-full bg-white/5 text-rpg-gold transition-all duration-500 group-open/feat:rotate-180 group-open/feat:bg-rpg-gold/10`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </summary>
                                                    <div className="px-6 pb-6 pt-2 animate-fade-in border-t border-white/5 bg-black/5">
                                                        <p className="text-sm text-rpg-grey/70 leading-relaxed font-serif italic whitespace-pre-wrap pl-4 border-l-2 border-rpg-gold/20">
                                                            {feat.description}
                                                        </p>
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    </div>
                                ));
                        })()}
                    </div>
                )}

                {activeSkillSubTab === 'feats' && (
                    <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-8">
                        {(() => {
                            const feats = (character.features || []).filter(f =>
                                f.type === 'feat' &&
                                (f.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                                    f.description.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                            );

                            if (feats.length === 0) return (
                                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 animate-pulse">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-rpg-parchment font-bold text-lg font-cinzel">Sua Lenda está em branco...</p>
                                        <p className="text-xs text-rpg-grey max-w-xs mx-auto">Talentos são perícias heróicas que definem seu estilo de luta único.</p>
                                    </div>
                                </div>
                            );

                            // Agrupar Talentos por Nível
                            const groups: Record<string, typeof feats> = {};
                            feats.forEach(f => {
                                const key = f.level ? `Nível ${f.level}` : 'Inatos / Outros';
                                if (!groups[key]) groups[key] = [];
                                groups[key].push(f);
                            });

                            return Object.entries(groups)
                                .sort((a, b) => {
                                    if (a[0] === 'Inatos / Outros') return 1;
                                    if (b[0] === 'Inatos / Outros') return -1;
                                    return parseInt(a[0].replace(/\D/g, '')) - parseInt(b[0].replace(/\D/g, ''));
                                })
                                .map(([group, groupFeats]) => (
                                    <div key={group} className="space-y-3">
                                        <div className="flex items-center gap-3 border-b border-purple-500/10 pb-2 mb-4">
                                            <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-glow-purple/10">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-purple-300 font-cinzel">{group}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {groupFeats.map((feat, idx) => (
                                                <div key={idx} className="p-5 card-glass border-none transition-all duration-300 hover:bg-white/5 shadow-xl group/feat relative overflow-hidden flex flex-col min-h-[160px]">
                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                        <div>
                                                            <h5 className="font-black text-purple-200 text-xl font-serif tracking-tight leading-tight">{feat.name}</h5>
                                                            {feat.level && <span className="text-[10px] text-purple-400/50 font-black uppercase tracking-[0.2em] mt-2 block">Nível {feat.level}</span>}
                                                        </div>
                                                        {!isReadOnly && (
                                                            <div className="flex gap-2 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => {
                                                                        setIsAddMode(false);
                                                                        setEditingFeature({ ...feat, _originalName: feat.name });
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/5 text-blue-400/50 hover:bg-blue-500 hover:text-white border border-blue-500/10 transition-all"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteFeature(feat.name)}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/5 text-red-400/50 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-rpg-grey/70 leading-relaxed relative z-10 whitespace-pre-wrap font-serif italic border-l-2 border-purple-500/20 pl-4 py-1 flex-grow">
                                                        {feat.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                        })()}
                    </div>
                )}
            </div>

            {/* Modal de Edição de Característica */}
            {editingFeature && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="bg-rpg-slate/50 p-6 border-b border-rpg-gold/20 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-cinzel text-rpg-gold flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {isAddMode ? 'Nova Habilidade' : 'Editar Habilidade'}
                            </h3>
                            <button onClick={() => setEditingFeature(null)} className="text-rpg-grey hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-rpg-gold uppercase mb-2">Nome</label>
                                <input 
                                    type="text"
                                    value={editingFeature.name}
                                    onChange={e => setEditingFeature({...editingFeature, name: e.target.value})}
                                    className="w-full bg-black/40 border border-rpg-gold/20 rounded-md p-3 text-rpg-parchment focus:border-rpg-gold/50 outline-none"
                                    placeholder="Ex: Ataque Extra"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-rpg-gold uppercase mb-2">Fonte / Origem</label>
                                    <input 
                                        type="text"
                                        value={editingFeature.source}
                                        onChange={e => setEditingFeature({...editingFeature, source: e.target.value})}
                                        className="w-full bg-black/40 border border-rpg-gold/20 rounded-md p-3 text-rpg-parchment focus:border-rpg-gold/50 outline-none"
                                        placeholder="Ex: Mago ou Raça"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-rpg-gold uppercase mb-2">Nível</label>
                                    <input 
                                        type="number"
                                        value={editingFeature.level || 0}
                                        onChange={e => setEditingFeature({...editingFeature, level: parseInt(e.target.value) || 1})}
                                        className="w-full bg-black/40 border border-rpg-gold/20 rounded-md p-3 text-rpg-parchment focus:border-rpg-gold/50 outline-none text-center"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-rpg-gold uppercase mb-2">Descrição</label>
                                <textarea 
                                    rows={5}
                                    value={editingFeature.description}
                                    onChange={e => setEditingFeature({...editingFeature, description: e.target.value})}
                                    className="w-full bg-black/40 border border-rpg-gold/20 rounded-md p-3 text-rpg-parchment focus:border-rpg-gold/50 outline-none resize-none custom-scrollbar"
                                    placeholder="O que esta habilidade faz?"
                                />
                            </div>
                        </div>

                        <div className="bg-rpg-slate/30 p-6 flex gap-3">
                            <button 
                                onClick={() => setEditingFeature(null)}
                                className="flex-1 px-4 py-3 border border-rpg-gold/20 text-rpg-grey font-bold rounded-md hover:bg-white/5 transition-all uppercase text-xs"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveFeature}
                                className="flex-[2] bg-rpg-gold text-rpg-dark font-black px-6 py-3 rounded-md hover:shadow-glow-gold/40 transition-all uppercase text-xs"
                            >
                                {isAddMode ? 'Criar Habilidade' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsTab;
