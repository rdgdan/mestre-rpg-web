import React, { useState } from 'react';
import Modal from '@/components/Modal';
import {
    CLASS_EFFECTS,
    getCategorizedGlobalConditions
} from '@/lib/effects-conditions';

interface EffectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    characterClass: string;
    onToggleEffect: (id: string) => void;
    activeEffects: string[];
    activeConditions: string[];
}

export const EffectSelectionModal: React.FC<EffectSelectionModalProps> = ({
    isOpen,
    onClose,
    characterName,
    characterClass,
    onToggleEffect,
    activeEffects = [],
    activeConditions = []
}) => {
    const [effectTab, setEffectTab] = useState<'all' | 'benefits' | 'debuffs'>('all');
    const [effectSearchQuery, setEffectSearchQuery] = useState('');

    const allActiveIds = [...activeEffects, ...activeConditions];

    const availableEffects = characterClass ? (CLASS_EFFECTS[characterClass] || []) : [];
    const globalConditions = getCategorizedGlobalConditions();

    const classEffectsWithType = availableEffects.map(fx => ({ ...fx, type: 'class' as const }));
    const globalBenefitsWithType = globalConditions.benefits.map(c => ({
        id: c.id,
        name: c.name,
        duration: 1,
        category: 'benefit' as const,
        type: 'global' as const
    }));
    const globalDebuffsWithType = globalConditions.debuffs.map(c => ({
        id: c.id,
        name: c.name,
        duration: 1,
        category: 'debuff' as const,
        type: 'global' as const
    }));

    const benefitIds = [
        'rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary',
        'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind',
        'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense',
        'lay-hands', 'divine-smite', 'aura-protection', 'hunters-mark', 'favored-foe',
        'metamagic', 'tides-chaos', 'invocation', 'arcane-recovery', 'spell-mastery',
        'sneak-attack', 'armor-agathys', 'multiattack', 'mirror-image'
    ];
    const debuffIds = [
        'stunning-strike', 'hex', 'curse', 'entangle', 'knocked-down',
        'paralyzed-ki', 'wrathful-smite', 'wild-surge', 'hypnotic-pattern'
    ];

    const allEffects = [...classEffectsWithType, ...globalBenefitsWithType, ...globalDebuffsWithType];
    const benefits = allEffects.filter(fx => (benefitIds.includes(fx.id)) || (fx.type === 'global' && fx.category === 'benefit'));
    const debuffs = allEffects.filter(fx => (debuffIds.includes(fx.id)) || (fx.type === 'global' && fx.category === 'debuff'));

    const normalizeSearch = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const searchTerm = normalizeSearch(effectSearchQuery);

    const filterEffects = (effects: any[]) => {
        if (!searchTerm) return effects;
        return effects.filter(fx =>
            normalizeSearch(fx.name).includes(searchTerm) ||
            normalizeSearch(fx.id).includes(searchTerm)
        );
    };

    const filteredBenefits = filterEffects(benefits);
    const filteredDebuffs = filterEffects(debuffs);
    const displayedEffects = effectTab === 'benefits'
        ? filteredBenefits
        : effectTab === 'debuffs'
            ? filteredDebuffs
            : filterEffects(allEffects);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Efeitos • ${characterName}`}
        >
            <div className="space-y-3">
                <div className="mb-3">
                    <input
                        type="text"
                        placeholder="🔍 Buscar efeito..."
                        value={effectSearchQuery}
                        onChange={(e) => setEffectSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-rpg-parchment focus:border-rpg-gold outline-none transition-all"
                    />
                </div>

                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 mb-4">
                    {(['all', 'benefits', 'debuffs'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setEffectTab(tab)}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${effectTab === tab
                                ? 'bg-rpg-gold text-rpg-dark shadow-lg shadow-rpg-gold/20'
                                : 'text-rpg-grey hover:text-rpg-parchment'
                                }`}
                        >
                            {tab === 'all' ? 'Todos' : tab === 'benefits' ? 'Benefícios' : 'Malefícios'}
                        </button>
                    ))}
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {displayedEffects.length === 0 ? (
                        <div className="text-center py-10 text-rpg-grey italic text-sm">Nenhum efeito encontrado.</div>
                    ) : (
                        displayedEffects.map(fx => {
                            const isActive = allActiveIds.includes(fx.id);
                            const isBenefit = benefitIds.includes(fx.id) || (fx.type === 'global' && fx.category === 'benefit');

                            return (
                                <button
                                    key={fx.id}
                                    onClick={() => onToggleEffect(fx.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${isActive
                                        ? (isBenefit ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50')
                                        : 'bg-white/5 border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isActive
                                            ? (isBenefit ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                                            : 'bg-white/10 text-rpg-grey group-hover:bg-white/20'
                                            }`}>
                                            {isBenefit ? '✨' : '⚠'}
                                        </div>
                                        <div>
                                            <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-rpg-parchment'}`}>{fx.name}</div>
                                            <div className="text-[9px] text-rpg-grey uppercase tracking-tighter">
                                                {fx.type === 'class' ? `Classe: ${characterClass}` : 'Condição Global'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive
                                        ? (isBenefit ? 'border-green-400 bg-green-400 text-rpg-dark' : 'border-red-400 bg-red-400 text-white')
                                        : 'border-white/10'
                                        }`}>
                                        {isActive && <span className="text-[10px] font-bold">✓</span>}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EffectSelectionModal;
