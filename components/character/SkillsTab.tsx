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
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
    character,
    isReadOnly,
    activeSkillSubTab,
    setActiveSkillSubTab,
    skillSearchQuery,
    setSkillSearchQuery,
    handleNestedChange
}) => {
    return (
        <div className="flex flex-col h-full animate-fade-in space-y-4">
            {/* Cabeçalho de Navegação Interna e Busca */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-rpg-panel border border-rpg-gold/10 p-3 rounded-lg shadow-md backdrop-blur-sm">
                <div className="flex p-1 bg-rpg-slate/50 rounded-md border border-rpg-gold/10">
                    <button
                        onClick={() => setActiveSkillSubTab('skills')}
                        className={`px-4 py-1.5 rounded transition-all text-xs font-bold uppercase tracking-wider ${activeSkillSubTab === 'skills' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'text-rpg-grey hover:text-rpg-parchment'}`}
                    >
                        Perícias
                    </button>
                    <button
                        onClick={() => setActiveSkillSubTab('features')}
                        className={`px-4 py-1.5 rounded transition-all text-xs font-bold uppercase tracking-wider ${activeSkillSubTab === 'features' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'text-rpg-grey hover:text-rpg-parchment'}`}
                    >
                        Características
                    </button>
                    <button
                        onClick={() => setActiveSkillSubTab('feats')}
                        className={`px-4 py-1.5 rounded transition-all text-xs font-bold uppercase tracking-wider ${activeSkillSubTab === 'feats' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'text-rpg-grey hover:text-rpg-parchment'}`}
                    >
                        Talentos
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Buscar habilidade..."
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        className="w-full bg-rpg-dark/50 border border-rpg-gold/20 rounded-md py-2 pl-10 pr-4 text-sm text-rpg-parchment focus:border-rpg-gold/50 outline-none placeholder:text-rpg-grey/50"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-4 w-4 text-rpg-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Conteúdo Dinâmico das Sub-Abas */}
            <div className="flex-grow overflow-hidden bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md backdrop-blur-sm p-4 sm:p-6 min-h-[500px]">
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
                                        <div className="grid grid-cols-1 gap-3">
                                            {groupFeats.map((feat, idx) => (
                                                <details key={idx} className="group/feat bg-rpg-slate/30 rounded-lg border border-rpg-gold/5 overflow-hidden transition-all hover:bg-rpg-slate/50 hover:border-rpg-gold/30 shadow-sm">
                                                    <summary className="flex justify-between items-center p-4 cursor-pointer list-none select-none">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2 rounded ${feat.type === 'race' ? 'bg-emerald-500/10' : 'bg-rpg-gold/10'} transition-transform group-hover/feat:scale-110`}>
                                                                {feat.type === 'race' ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rpg-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h5 className={`font-bold font-medieval text-lg ${feat.type === 'race' ? 'text-emerald-300' : 'text-rpg-parchment'} group-hover/feat:text-rpg-gold transition-colors`}>{feat.name}</h5>
                                                                <div className="flex gap-2 mt-0.5">
                                                                    <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase tracking-tighter ${feat.type === 'race' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rpg-gold/20 text-rpg-gold'}`}>
                                                                        {feat.type === 'race' ? 'Raça' : 'Classe'}
                                                                    </span>
                                                                    {feat.level && <span className="text-[8px] bg-white/5 text-rpg-grey px-1.5 py-0.2 rounded font-black uppercase tracking-tighter border border-white/5">Nível {feat.level}</span>}
                                                                    {(feat.source || character.class) && <span className="text-[8px] bg-purple-900/20 text-purple-300 px-1.5 py-0.2 rounded font-black uppercase tracking-tighter border border-purple-500/10">{feat.source || character.class}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center transition-all group-open/feat:bg-rpg-gold group-open/feat:border-rpg-gold group-hover/feat:border-rpg-gold/30">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rpg-grey group-open/feat:text-rpg-dark transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </summary>
                                                    <div className="px-14 pb-6 text-sm text-rpg-grey leading-relaxed pt-2 animate-in slide-in-from-top-2 duration-300">
                                                        <p className="border-l-2 border-rpg-gold/20 pl-4 py-1 italic bg-black/5 rounded-r">
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {groupFeats.map((feat, idx) => (
                                                <div key={idx} className="p-4 bg-rpg-panel border border-purple-500/20 rounded-lg hover:border-purple-500/50 transition-all shadow-md group/feat relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rotate-45 translate-x-6 -translate-y-6"></div>
                                                    <h5 className="font-bold text-purple-200 text-lg mb-1 font-medieval">{feat.name}</h5>
                                                    <p className="text-xs text-rpg-grey leading-relaxed">{feat.description}</p>
                                                    {feat.level && <span className="absolute bottom-2 right-3 text-[8px] text-purple-400/50 font-black uppercase tracking-widest">Nível {feat.level}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillsTab;
