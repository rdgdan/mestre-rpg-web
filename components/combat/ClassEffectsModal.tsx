import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { CLASS_EFFECTS, getCategorizedGlobalConditions } from '@/lib/effects-conditions';
import { Combatant, StatusEffect } from '@/hooks/useCombat';

interface ClassEffectsModalProps {
    isOpen: boolean;
    target: Combatant | null;
    characterInfo: Record<string, { class: string; level: number }>;
    onClose: () => void;
    onApply: (cid: string, effect: any) => Promise<void>;
    onRemove: (cid: string, effectId: string) => Promise<void>;
}

const ClassEffectsModal: React.FC<ClassEffectsModalProps> = ({
    isOpen,
    target,
    characterInfo,
    onClose,
    onApply,
    onRemove
}) => {
    const [effectTab, setEffectTab] = useState<'all' | 'benefits' | 'debuffs'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [newCustomEffect, setNewCustomEffect] = useState({ name: '', duration: '', category: 'benefit' as 'benefit' | 'debuff' });

    if (!target) return null;

    const charClass = (target.externalId && characterInfo[target.externalId]) ? characterInfo[target.externalId].class : target.class;
    const charLevel = (target.externalId && characterInfo[target.externalId]) ? characterInfo[target.externalId].level : target.level;
    const availableClassEffects = charClass ? (CLASS_EFFECTS[charClass] || []) : [];

    const globalConditions = getCategorizedGlobalConditions();

    // Combine and type effects
    const allEffects = [
        ...availableClassEffects.map(fx => ({ ...fx, type: 'class' as const })),
        ...globalConditions.benefits.map(c => ({ id: c.id, name: c.name, duration: 1, category: 'benefit' as const, type: 'global' as const })),
        ...globalConditions.debuffs.map(c => ({ id: c.id, name: c.name, duration: 1, category: 'debuff' as const, type: 'global' as const }))
    ];

    const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'hunters-mark', 'favored-foe', 'metamagic', 'tides-chaos', 'invocation', 'arcane-recovery', 'spell-mastery', 'sneak-attack', 'armor-agathys', 'multiattack', 'mirror-image'];
    const debuffIds = ['stunning-strike', 'hex', 'curse', 'entangle', 'knocked-down', 'paralyzed-ki', 'wrathful-smite', 'wild-surge', 'hypnotic-pattern'];

    const categorized = allEffects.map(fx => ({
        ...fx,
        realCategory: (benefitIds.includes(fx.id) || (fx as any).category === 'benefit') ? 'benefit' : 'debuff'
    }));

    const filtered = categorized.filter(fx => {
        const matchesSearch = fx.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = effectTab === 'all' || (effectTab === 'benefits' && fx.realCategory === 'benefit') || (effectTab === 'debuffs' && fx.realCategory === 'debuff');
        return matchesSearch && matchesTab;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Efeitos • ${target.name}`}>
            <div className="space-y-4">
                <div className="text-center pb-2 border-b border-white/10">
                    <div className="text-rpg-gold font-cinzel text-xs tracking-widest uppercase">{charClass || 'COMBATENTE'}</div>
                    {charLevel && <div className="text-rpg-grey text-[9px] mt-0.5">Nível {charLevel}</div>}
                </div>

                <input
                    type="text"
                    placeholder="🔍 Buscar efeito..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold text-sm"
                />

                <div className="flex gap-1 border-b border-white/10">
                    {(['all', 'benefits', 'debuffs'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setEffectTab(tab)}
                            className={`flex-1 px-3 py-2 text-[10px] font-cinzel tracking-wider uppercase transition-all border-b-2 ${effectTab === tab ? 'border-rpg-gold text-rpg-gold' : 'border-transparent text-rpg-grey'}`}
                        >
                            {tab === 'all' ? '🎭 Todos' : tab === 'benefits' ? '✦ Benef.' : '⚠ Malef.'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {filtered.map(fx => {
                        const hasEffect = target.statusEffects?.some(se => se.id === fx.id);
                        const isBenefit = fx.realCategory === 'benefit';

                        return (
                            <div key={fx.id} className={`p-3 rounded-lg border flex flex-col gap-2 ${isBenefit ? 'bg-green-900/10 border-green-600/30' : 'bg-red-900/10 border-red-600/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className={isBenefit ? 'text-green-400' : 'text-red-400'}>{isBenefit ? '✦' : '⚠'}</span>
                                    <div className="text-rpg-parchment font-cinzel text-xs font-bold truncate">{fx.name}</div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { onApply(target.id, fx); onClose(); }}
                                        disabled={hasEffect}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold ${hasEffect ? 'bg-gray-700 opacity-50' : isBenefit ? 'bg-green-700 hover:bg-green-600' : 'bg-red-700 hover:bg-red-600'}`}
                                    >
                                        {hasEffect ? 'Ativo' : 'Aplicar'}
                                    </button>
                                    {hasEffect && (
                                        <button onClick={() => { onRemove(target.id, fx.id); onClose(); }} className="px-3 bg-red-900 hover:bg-red-800 rounded font-bold">✕</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="text-rpg-gold font-cinzel text-[10px] uppercase opacity-70">Customizado</div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nome"
                            value={newCustomEffect.name}
                            onChange={e => setNewCustomEffect({ ...newCustomEffect, name: e.target.value })}
                            className="bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-sm text-rpg-parchment flex-1"
                        />
                        <select
                            value={newCustomEffect.category}
                            onChange={e => setNewCustomEffect({ ...newCustomEffect, category: e.target.value as any })}
                            className="bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-xs text-rpg-parchment"
                        >
                            <option value="benefit">✦ Ben.</option>
                            <option value="debuff">⚠ Mal.</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Turnos"
                            value={newCustomEffect.duration}
                            onChange={e => setNewCustomEffect({ ...newCustomEffect, duration: e.target.value })}
                            className="bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-sm text-rpg-parchment w-20 text-center"
                        />
                        <button
                            onClick={() => {
                                if (!newCustomEffect.name || !newCustomEffect.duration) return;
                                onApply(target.id, {
                                    id: `custom-${Date.now()}`,
                                    name: newCustomEffect.name,
                                    duration: Number(newCustomEffect.duration),
                                    category: newCustomEffect.category
                                });
                                onClose();
                                setNewCustomEffect({ name: '', duration: '', category: 'benefit' });
                            }}
                            className="bg-purple-700 hover:bg-purple-600 text-white rounded px-4 text-[10px] font-bold flex-1"
                        >
                            CRIAR E APLICAR
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ClassEffectsModal;
