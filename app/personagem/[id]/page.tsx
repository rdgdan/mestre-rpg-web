"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterSheet } from '@/hooks/useCharacterSheet';
import {
    CharacterStatsTab,
    InventoryTab,
    SkillsTab,
    SpellsTab,
    PersonalityTab,
    TabButton
} from '@/components/character';
import CharacterHeader from '@/components/character/CharacterHeader';
import ActiveEffectsBar from '@/components/character/ActiveEffectsBar';
import ExperienceModal from '@/components/character/ExperienceModal';
import EffectSelectionModal from '@/components/character/EffectSelectionModal';

// UI Components & Modals
import SelectionModal from '@/components/ui/SelectionModal';
import SubclassModal from '@/components/ui/SubclassModal';
import WeaponModal from '@/components/ui/WeaponModal';
import EquipmentModal from '@/components/ui/EquipmentModal';
import LevelUpModal from '@/components/ui/LevelUpModal';
import SpellSelectModal from '@/components/ui/SpellSelectModal';
import Toast, { ToastMessage } from '@/components/ui/Toast';
import {
    StartingProficienciesModal,
    StartingEquipmentModal,
    StartingAttributesModal
} from '@/components/ui';

// Libs
import { SUBCLASSES, CLASS_PROGRESSION } from '@/lib/class-features';
import { getMaxPreparedSpells } from '@/lib/spell-usage';
import { dndWeapons } from '@/lib/items-data';
import { BENEFIT_IDS } from '@/lib/effects-conditions';

// Componente para renderizar as partículas animadas de fundo
const ConditionVisuals: React.FC<{ hasBenefits: boolean; hasDebuffs: boolean; isDefeated: boolean }> = ({ hasBenefits, hasDebuffs, isDefeated }) => {
    if (isDefeated) return null;
    return (
        <>
            {/* Camadas de Glow de Fundo (z-0) */}
            <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${hasBenefits ? 'opacity-100' : 'opacity-0'} bg-glow-benefit`} />
            <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${hasDebuffs ? 'opacity-100' : 'opacity-0'} bg-glow-debuff`} />

            {/* Camada de Partículas/Faíscas (z-50) */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {hasBenefits && (
                    <>
                        <div className="particle-benefit particle-benefit-up" style={{ left: '2%', animationDelay: '0s', width: '4px', height: '4px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '12%', animationDelay: '0.5s', width: '3px', height: '3px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '25%', animationDelay: '1.2s', width: '6px', height: '6px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '38%', animationDelay: '0.2s', width: '4px', height: '4px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '45%', animationDelay: '0.8s', width: '3px', height: '3px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '55%', animationDelay: '1.5s', width: '5px', height: '5px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '68%', animationDelay: '0.4s', width: '4px', height: '4px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '75%', animationDelay: '2.1s', width: '6px', height: '6px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '88%', animationDelay: '1.1s', width: '5px', height: '5px' } as any} />
                        <div className="particle-benefit particle-benefit-up" style={{ left: '95%', animationDelay: '0.8s', width: '4px', height: '4px' } as any} />

                        <div className="particle-benefit particle-benefit-down" style={{ left: '8%', animationDelay: '0.3s' } as any} />
                        <div className="particle-benefit particle-benefit-down" style={{ left: '20%', animationDelay: '1.8s', width: '3px', height: '3px' } as any} />
                        <div className="particle-benefit particle-benefit-down" style={{ left: '50%', animationDelay: '0.7s', width: '5px', height: '5px' } as any} />
                        <div className="particle-benefit particle-benefit-down" style={{ left: '70%', animationDelay: '2.4s', width: '4px', height: '4px' } as any} />
                        <div className="particle-benefit particle-benefit-down" style={{ left: '85%', animationDelay: '1.5s', width: '6px', height: '6px' } as any} />

                        <div className="particle-benefit particle-benefit-right" style={{ top: '10%', animationDelay: '0.5s' } as any} />
                        <div className="particle-benefit particle-benefit-right" style={{ top: '30%', animationDelay: '1.8s', width: '3px', height: '3px' } as any} />
                        <div className="particle-benefit particle-benefit-right" style={{ top: '60%', animationDelay: '0.9s', width: '5px', height: '5px' } as any} />
                        <div className="particle-benefit particle-benefit-right" style={{ top: '90%', animationDelay: '2.2s' } as any} />

                        <div className="particle-benefit particle-benefit-left" style={{ top: '15%', animationDelay: '1.1s' } as any} />
                        <div className="particle-benefit particle-benefit-left" style={{ top: '45%', animationDelay: '0.3s', width: '4px', height: '4px' } as any} />
                        <div className="particle-benefit particle-benefit-left" style={{ top: '75%', animationDelay: '1.9s', width: '6px', height: '6px' } as any} />
                    </>
                )}
                {hasDebuffs && (
                    <>
                        <div className="particle-debuff particle-debuff-up" style={{ left: '5%', animationDelay: '0.1s' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '15%', animationDelay: '0.8s', width: '4px', height: '4px' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '28%', animationDelay: '1.4s', width: '6px', height: '6px' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '42%', animationDelay: '0.3s', width: '8px', height: '8px' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '55%', animationDelay: '1.1s' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '72%', animationDelay: '0.6s', width: '5px', height: '5px' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '85%', animationDelay: '1.9s', width: '6px', height: '6px' } as any} />
                        <div className="particle-debuff particle-debuff-up" style={{ left: '95%', animationDelay: '1.3s', width: '4px', height: '4px' } as any} />

                        <div className="particle-debuff particle-debuff-diagonal" style={{ left: '20%', top: '20%', animationDelay: '0.4s' } as any} />
                        <div className="particle-debuff particle-debuff-diagonal" style={{ left: '80%', top: '20%', animationDelay: '1.2s', width: '5px', height: '5px' } as any} />
                        <div className="particle-debuff particle-debuff-diagonal" style={{ left: '40%', top: '40%', animationDelay: '0.7s', width: '4px', height: '4px' } as any} />
                        <div className="particle-debuff particle-debuff-diagonal" style={{ left: '60%', top: '60%', animationDelay: '1.9s', width: '10px', height: '10px' } as any} />
                        <div className="particle-debuff particle-debuff-diagonal" style={{ left: '30%', top: '80%', animationDelay: '0.2s', width: '6px', height: '6px' } as any} />
                        <div className="particle-debuff particle-debuff-diagonal" style={{ left: '70%', top: '80%', animationDelay: '0.9s', width: '5px', height: '5px' } as any} />

                        <div className="particle-debuff particle-debuff-side" style={{ top: '10%', animationDelay: '0.5s' } as any} />
                        <div className="particle-debuff particle-debuff-side" style={{ top: '25%', animationDelay: '1.2s', width: '4px', height: '4px' } as any} />
                        <div className="particle-debuff particle-debuff-side" style={{ top: '40%', animationDelay: '0.2s' } as any} />
                        <div className="particle-debuff particle-debuff-side" style={{ top: '65%', animationDelay: '0.8s', width: '8px', height: '8px' } as any} />
                        <div className="particle-debuff particle-debuff-side" style={{ top: '80%', animationDelay: '1.5s', width: '5px', height: '5px' } as any} />
                        <div className="particle-debuff particle-debuff-side" style={{ top: '95%', animationDelay: '0.4s' } as any} />
                    </>
                )}
            </div>
        </>
    );
};

export default function CharacterSheetPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const {
        character,
        setCharacter,
        isLoading,
        error,
        isReadOnly,
        classes,
        races,
        weapons,
        allEquipment,
        updateCharacter,
        handleFieldChange,
        handleLevelChange,
        handleXPChange,
        handleNestedChange,
        handleRest,
        handleSpellUsed,
        classes: availableClasses, // Rename to avoid conflict with local state if any, though hook uses 'classes'
    } = useCharacterSheet(id);

    // Local UI State
    const [activeTab, setActiveTab] = useState<'Principal' | 'Equipamento' | 'Habilidades' | 'Magias' | 'Personalidade'>('Principal');
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
    const [isSubclassModalOpen, setIsSubclassModalOpen] = useState(false);
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'class' | 'race' | 'weapon', title: string } | null>(null);
    const [isWeaponModalOpen, setWeaponModalOpen] = useState(false);
    const [weaponToEdit, setWeaponToEdit] = useState(null);
    const [isEquipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [isSpellSelectOpen, setSpellSelectOpen] = useState(false);
    const [creationStep, setCreationStep] = useState(0);

    // Tab-specific State
    const [weaponSearchTerm, setWeaponSearchTerm] = useState('');
    const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
    const [expandedSpellLevels, setExpandedSpellLevels] = useState<Record<number, boolean>>({ 0: true });
    const [activeSkillSubTab, setActiveSkillSubTab] = useState<'skills' | 'features' | 'feats'>('skills');
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
    const [pendingLevel, setPendingLevel] = useState<number | null>(null);

    // Helpers
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setToast({ id: Date.now().toString(), message, type, duration: 4000 });
    }, []);

    // Lógica de Animação Baseada em Condições
    const { hasBenefits, hasDebuffs, isDefeated, activeVisualClasses } = useMemo(() => {
        const allActiveIds = [...(character?.activeEffects || []), ...(character?.conditions || [])];
        const defeated = (character?.currentHp || 0) <= 0 || character?.conditions?.includes('inconsciente');
        const benefits = allActiveIds.some(id => BENEFIT_IDS.includes(id));
        const debuffs = allActiveIds.filter(id => !BENEFIT_IDS.includes(id) && id !== 'inconsciente').length > 0;

        let classes = [];
        if (defeated) {
            classes.push("defeated-animation");
        } else {
            // Classes especiais para efeitos icônicos
            if (character?.activeEffects?.includes('rage')) classes.push("animate-rage");
            if (character?.activeEffects?.includes('bless')) classes.push("animate-bless");
            if (character?.activeEffects?.includes('inspiration')) classes.push("animate-inspiration");
        }

        return {
            hasBenefits: benefits,
            hasDebuffs: debuffs,
            isDefeated: defeated,
            activeVisualClasses: classes.join(" ")
        };
    }, [character]);

    const preparedSpellsInfo = useMemo(() => {
        if (!character?.spells || !character?.spellcasting?.ability || !character?.attributeModifiers) return null;
        const ability = character.spellcasting.ability as any;
        const mod = character.attributeModifiers[ability] || 0;
        const clsList = character.classes || [{ name: character.class, level: character.level }];
        let totalMax = 0;
        let canPrepare = false;
        clsList.forEach(c => {
            const max = getMaxPreparedSpells(c.name, c.level, mod);
            if (max > 0) { totalMax += max; canPrepare = true; }
        });
        if (!canPrepare) return null;
        const current = character.spells.filter(s => s && (s.level || 0) > 0 && s.prepared).length;
        return { current, max: totalMax };
    }, [character]);

    const formatSpellValue = (value: any): string => {
        if (!value) return '-';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (value.v !== undefined || value.s !== undefined || value.m !== undefined) {
            const parts = [];
            if (value.v) parts.push('V');
            if (value.s) parts.push('S');
            if (value.m) parts.push(typeof value.m === 'string' ? `M (${value.m})` : 'M');
            return parts.join(', ') || '-';
        }
        return JSON.stringify(value);
    };

    const handleSaveNewCharacter = async () => {
        if (!character) return;
        try {
            const { db } = await import('@/lib/firebase');
            const { collection, setDoc, doc } = await import('firebase/firestore');
            const { auth } = await import('@/lib/firebase');
            const user = auth.currentUser;
            if (!user) return;
            const newDocRef = doc(collection(db, 'personagens'));
            const charToSave = { ...character, id: newDocRef.id, ownerId: user.uid, createdAt: new Date().toISOString() };
            await setDoc(newDocRef, JSON.parse(JSON.stringify(charToSave)));
            router.push(`/personagem/${newDocRef.id}`);
        } catch (err) {
            console.error("Erro ao salvar personagem:", err);
            showToast('Erro ao salvar personagem.', 'error');
        }
    };

    // Wizard Logic
    useEffect(() => {
        if (id === 'novo' && character && creationStep === 0) {
            if (!character.race) setCreationStep(1);
            else if (!character.class) setCreationStep(2);
            else if (Object.values(character.attributes).every(v => v === 10)) setCreationStep(3);
            else setCreationStep(6);
        }
    }, [id, character, creationStep]);

    useEffect(() => {
        if (creationStep === 1) {
            setModalConfig({ type: 'race', title: 'Selecione a Raça' });
            setSelectionModalOpen(true);
        } else if (creationStep === 2) {
            setModalConfig({ type: 'class', title: 'Selecione a Classe' });
            setSelectionModalOpen(true);
        }
    }, [creationStep]);

    const renderTab = () => {
        if (!character) return null;
        switch (activeTab) {
            case 'Principal':
                return (
                    <CharacterStatsTab
                        character={character}
                        isReadOnly={isReadOnly}
                        handleLevelChange={handleLevelChange}
                        handleFieldChange={handleFieldChange}
                        handleNestedChange={handleNestedChange}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                    />
                );
            case 'Equipamento':
                return (
                    <InventoryTab
                        character={character}
                        isReadOnly={isReadOnly}
                        weaponSearchTerm={weaponSearchTerm}
                        equipmentSearchTerm={equipmentSearchTerm}
                        handleFieldChange={handleFieldChange}
                        handleNestedChange={handleNestedChange}
                        openSelectionModal={(type) => {
                            setModalConfig({ type: 'weapon', title: 'Adicionar Arma' });
                            setSelectionModalOpen(true);
                        }}
                        handleOpenWeaponModal={(w) => { setWeaponToEdit(w); setWeaponModalOpen(true); }}
                        handleRemoveWeapon={(wId) => {
                            updateCharacter(char => ({ ...char, inventory: { ...char.inventory, weapons: char.inventory.weapons.filter(w => w.id !== wId) } }));
                        }}
                        handleOpenEquipmentModal={(e) => { setEquipmentToEdit(e); setEquipmentModalOpen(true); }}
                        handleRemoveEquipment={(eId) => {
                            updateCharacter(char => ({ ...char, inventory: { ...char.inventory, otherEquipment: char.inventory.otherEquipment.filter(e => e.id !== eId) } }));
                        }}
                    />
                );
            case 'Habilidades':
                return (
                    <SkillsTab
                        character={character}
                        isReadOnly={isReadOnly}
                        activeSkillSubTab={activeSkillSubTab}
                        setActiveSkillSubTab={setActiveSkillSubTab}
                        skillSearchQuery={skillSearchQuery}
                        setSkillSearchQuery={setSkillSearchQuery}
                        handleNestedChange={handleNestedChange}
                    />
                );
            case 'Magias':
                return (
                    <SpellsTab
                        character={character}
                        isReadOnly={isReadOnly}
                        preparedSpellsInfo={preparedSpellsInfo}
                        expandedSpellLevels={expandedSpellLevels}
                        setExpandedSpellLevels={setExpandedSpellLevels}
                        setSpellSelectOpen={setSpellSelectOpen}
                        handleSpellUsed={async (spell) => {
                            const success = await handleSpellUsed(spell);
                            if (!success) showToast(`❌ Sem slots disponíveis para magia nível ${spell.level}`, 'error');
                        }}
                        togglePreparedSpell={(name) => {
                            updateCharacter(char => ({
                                ...char,
                                spells: char.spells.map(s => s.name === name ? { ...s, prepared: !s.prepared } : s)
                            }));
                        }}
                        handleRemoveSpell={(name) => {
                            updateCharacter(char => ({ ...char, spells: char.spells.filter(s => s.name !== name) }));
                        }}
                        formatSpellValue={formatSpellValue}
                    />
                );
            case 'Personalidade':
                return <PersonalityTab character={character} isReadOnly={isReadOnly} handleFieldChange={handleFieldChange} />;
            default:
                return null;
        }
    };

    if (isLoading) return <div className="min-h-screen bg-rpg-dark flex items-center justify-center text-rpg-gold font-cinzel">Carregando Ficha...</div>;
    if (error) return <div className="min-h-screen bg-rpg-dark flex items-center justify-center text-rpg-red font-cinzel">{error}</div>;
    if (!character) return null;

    return (
        <div className={`min-h-screen p-4 text-rpg-parchment bg-rpg-dark selection:bg-rpg-gold/30 transition-all duration-1000 relative ${activeVisualClasses}`}>
            {/* Camada Visual de Condições (Partículas) */}
            <ConditionVisuals hasBenefits={hasBenefits} hasDebuffs={hasDebuffs} isDefeated={isDefeated} />

            {/* Conteúdo da Ficha (Z-index superior às partículas) */}
            <div className="relative z-10">
                <CharacterHeader
                    character={character}
                    isReadOnly={isReadOnly}
                    isNew={id === 'novo'}
                    onFieldChange={handleFieldChange}
                    onLevelChange={(newLevel) => {
                        // Define o nível alvo localmente e abre o modal, sem salvar ainda
                        setPendingLevel(newLevel);
                        setIsLevelUpModalOpen(true);
                    }}
                    onOpenSubclassModal={() => setIsSubclassModalOpen(true)}
                    onOpenXPModal={() => setIsXPModalOpen(true)}
                    onOpenSelectionModal={(type) => {
                        setModalConfig({ type, title: type === 'class' ? 'Selecione a Classe' : 'Selecione a Raça' });
                        setSelectionModalOpen(true);
                    }}
                    onUpdateCharacter={updateCharacter}
                    onSaveNewCharacter={handleSaveNewCharacter}
                    onRest={handleRest}
                />

                <ActiveEffectsBar
                    character={character}
                    isReadOnly={isReadOnly}
                    onToggleEffect={(effId) => {
                        updateCharacter(char => {
                            const effects = char.activeEffects || [];
                            const newEffects = effects.includes(effId) ? effects.filter(e => e !== effId) : [...effects, effId];
                            return { ...char, activeEffects: newEffects };
                        });
                    }}
                />

                <nav className="max-w-7xl mx-auto flex gap-1 mb-6 p-1 bg-rpg-panel/30 backdrop-blur rounded-xl border border-rpg-gold/10 overflow-x-auto no-scrollbar shadow-inner">
                    {(['Principal', 'Equipamento', 'Habilidades', 'Magias', 'Personalidade'] as const).map(tab => (
                        <TabButton
                            key={tab}
                            activeTab={activeTab}
                            tabName={tab}
                            onClick={() => setActiveTab(tab)}
                        />
                    ))}
                </nav>

                <main className="max-w-7xl mx-auto pb-24">
                    {renderTab()}
                </main>

                {!isReadOnly && (
                    <button
                        onClick={() => setIsEffectModalOpen(true)}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-rpg-gold text-rpg-dark rounded-full shadow-glow-gold flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all z-40 group"
                        title="Efeitos e Condições"
                    >
                        <span>⚡</span>
                    </button>
                )}

                {/* Modals */}
                <ExperienceModal
                    isOpen={isXPModalOpen}
                    onClose={() => setIsXPModalOpen(false)}
                    currentExperience={character.experience || 0}
                    onAddXP={handleXPChange}
                />

                <EffectSelectionModal
                    isOpen={isEffectModalOpen}
                    onClose={() => setIsEffectModalOpen(false)}
                    characterName={character.name}
                    characterClass={character.class}
                    activeEffects={character.activeEffects || []}
                    activeConditions={character.conditions || []}
                    onToggleEffect={(effId) => {
                        updateCharacter(char => {
                            const effects = char.activeEffects || [];
                            const newEffects = effects.includes(effId) ? effects.filter(e => e !== effId) : [...effects, effId];
                            return { ...char, activeEffects: newEffects };
                        });
                    }}
                />

                <SelectionModal
                    isOpen={isSelectionModalOpen}
                    onClose={() => setSelectionModalOpen(false)}
                    title={modalConfig?.title || ''}
                    items={
                        modalConfig?.type === 'class' ? classes :
                            modalConfig?.type === 'race' ? races :
                                modalConfig?.type === 'weapon' ? (weapons || []).map(w => w.name) :
                                    []
                    }
                    onSelectItem={(val) => {
                        if (modalConfig?.type === 'class') {
                            handleFieldChange('class', val);
                            if (creationStep === 2) setCreationStep(3);
                        } else if (modalConfig?.type === 'race') {
                            handleFieldChange('race', val);
                            if (creationStep === 1) setCreationStep(2);
                        } else if (modalConfig?.type === 'weapon') {
                            const baseWeapon = weapons.find(w => w.name === val);
                            if (baseWeapon) {
                                updateCharacter(char => ({
                                    ...char,
                                    inventory: {
                                        ...char.inventory,
                                        weapons: [...(char.inventory.weapons || []), {
                                            ...baseWeapon,
                                            id: Math.random().toString(36).substr(2, 9),
                                            quantity: 1
                                        }]
                                    }
                                }));
                            }
                        }
                        setSelectionModalOpen(false);
                    }}
                />

                <SubclassModal
                    isOpen={isSubclassModalOpen}
                    onClose={() => setIsSubclassModalOpen(false)}
                    character={character}
                    onSelect={(val) => {
                        handleFieldChange('subclass', val);
                        setIsSubclassModalOpen(false);
                    }}
                />

                <WeaponModal
                    isOpen={isWeaponModalOpen}
                    onClose={() => setWeaponModalOpen(false)}
                    weaponToEdit={weaponToEdit}
                    onSave={(w) => {
                        updateCharacter(char => {
                            const weaponsList = [...(char.inventory.weapons || [])];
                            const idx = weaponsList.findIndex(ex => ex.id === w.id);
                            if (idx >= 0) weaponsList[idx] = w; else weaponsList.push(w);
                            return { ...char, inventory: { ...char.inventory, weapons: weaponsList } };
                        });
                        setWeaponModalOpen(false);
                    }}
                />

                <EquipmentModal
                    isOpen={isEquipmentModalOpen}
                    onClose={() => setEquipmentModalOpen(false)}
                    itemToEdit={equipmentToEdit}
                    allEquipment={allEquipment}
                    onAddNewGlobalItem={async (name) => {
                        try {
                            const { db } = await import('@/lib/firebase');
                            const { collection, setDoc, doc } = await import('firebase/firestore');
                            await setDoc(doc(collection(db, 'equipamentos')), { name });
                        } catch (e) {
                            console.error(e);
                        }
                    }}
                    onSave={(e) => {
                        updateCharacter(char => {
                            const itemsList = [...(char.inventory.otherEquipment || [])];
                            const idx = itemsList.findIndex(ex => ex.id === e.id);
                            if (idx >= 0) itemsList[idx] = e; else itemsList.push(e);
                            return { ...char, inventory: { ...char.inventory, otherEquipment: itemsList } };
                        });
                        setEquipmentModalOpen(false);
                    }}
                />

                <LevelUpModal
                    isOpen={isLevelUpModalOpen}
                    onClose={() => setIsLevelUpModalOpen(false)}
                    level={pendingLevel || character.level}
                    charClassName={character.class}
                    availableClasses={availableClasses.filter(c => c !== character.class)} // Passa classes para multiclasse
                    progression={CLASS_PROGRESSION[character.class]?.[pendingLevel || character.level]}
                    currentSpells={character.spells}
                    currentAttributes={character.attributes}
                    onApply={(choices) => {
                        console.log("[LevelUp] Confirmando Level Up para:", pendingLevel || character.class);
                        updateCharacter(char => {
                            const targetLevel = pendingLevel || (char.level + 1);
                            console.log("[LevelUp] Atualizando personagem:", { prevLevel: char.level, targetLevel });

                            const newSpells = [...char.spells, ...(choices.newSpells || [])];
                            const newAttributes = { ...char.attributes };
                            Object.entries(choices.attributes || {}).forEach(([key, val]) => {
                                newAttributes[key] = (newAttributes[key] || 10) + val;
                            });

                            // ATUALIZAÇÃO CRÍTICA: Atualizar o array de classes para que calculateComputedStats não reverta o nível
                            const updatedClasses = [...(char.classes || [])];

                            if (choices.newClass && choices.newClass !== character.class) {
                                // Lógica de Multiclasse: Adicionar nova classe
                                const existingClassIdx = updatedClasses.findIndex(c => c.name === choices.newClass);
                                if (existingClassIdx >= 0) {
                                    updatedClasses[existingClassIdx] = {
                                        ...updatedClasses[existingClassIdx],
                                        level: updatedClasses[existingClassIdx].level + 1
                                    };
                                } else {
                                    updatedClasses.push({ name: choices.newClass, level: 1, subclass: '' });
                                }
                            } else {
                                // Level Up Normal: Incrementar classe principal
                                // Encontra a classe atual no array. Se não achar, assume a primeira/principal.
                                const currentClassIdx = updatedClasses.findIndex(c => c.name === character.class) >= 0
                                    ? updatedClasses.findIndex(c => c.name === character.class)
                                    : 0;

                                if (updatedClasses[currentClassIdx]) {
                                    updatedClasses[currentClassIdx] = {
                                        ...updatedClasses[currentClassIdx],
                                        level: updatedClasses[currentClassIdx].level + 1
                                    };
                                }
                            }

                            return {
                                ...char,
                                classes: updatedClasses,
                                // level: targetLevel, // Não precisamos mais forçar o level aqui, ele será recalculado por calculateComputedStats
                                maxHp: char.maxHp + choices.hpIncrease,
                                currentHp: char.currentHp + choices.hpIncrease,
                                spells: newSpells,
                                attributes: newAttributes,
                                subclass: choices.subclass || char.subclass
                            };
                        });
                        setPendingLevel(null); // Limpa o estado pendente
                        setIsLevelUpModalOpen(false); // Garante o fechamento
                        showToast('Nível aprimorado com sucesso!', 'success');
                    }}
                />

                <SpellSelectModal
                    isOpen={isSpellSelectOpen}
                    onClose={() => setSpellSelectOpen(false)}
                    onSelect={(spell) => {
                        updateCharacter(char => {
                            const spells = [...char.spells];
                            if (!spells.find(s => s.name === spell.name)) {
                                spells.push({ ...spell, prepared: spell.level === 0 });
                            }
                            return { ...char, spells };
                        });
                        setSpellSelectOpen(false);
                        showToast(`${spell.name} adicionada ao grimório!`, 'success');
                    }}
                    onCreate={() => {
                        setSpellSelectOpen(false);
                        showToast('Criação customizada de magias em breve.', 'info');
                    }}
                />

                {id === 'novo' && (
                    <>
                        <StartingAttributesModal
                            isOpen={creationStep === 3}
                            onClose={() => setCreationStep(4)}
                            race={character.race}
                            className={character.class}
                            onConfirm={(attrs) => {
                                updateCharacter(char => ({ ...char, attributes: attrs }));
                                setCreationStep(4);
                            }}
                        />
                        <StartingProficienciesModal
                            isOpen={creationStep === 4}
                            onClose={() => setCreationStep(5)}
                            className={character.class}
                            backgroundSkills={[]} // TODO: get background skills if any
                            onConfirm={(profs) => {
                                handleNestedChange('skills', profs);
                                setCreationStep(5);
                            }}
                        />
                        <StartingEquipmentModal
                            isOpen={creationStep === 5}
                            onClose={() => setCreationStep(6)}
                            className={character.class}
                            background={character.background || null}
                            onConfirm={(items: any[]) => {
                                const weaponsToAdd = items.filter(i => i.type === 'weapon').map(i => {
                                    const base = dndWeapons.find(w => w.name === i.name);
                                    return {
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: i.name,
                                        quantity: i.quantity,
                                        damage: base?.damage || '1d4',
                                        damageType: base?.damageType || 'Concussão',
                                        properties: base?.properties || [],
                                        isMagical: false,
                                        magicalBonus: 0,
                                        magicalEffect: '',
                                        weight: base?.weight || 0
                                    };
                                });
                                const equipmentToAdd = items.filter(i => i.type !== 'weapon').map(i => ({
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: i.name,
                                    quantity: i.quantity,
                                    type: i.type,
                                    isMagical: false,
                                    magicalBonus: 0,
                                    magicalEffect: '',
                                    description: ''
                                }));

                                updateCharacter(char => ({
                                    ...char,
                                    inventory: {
                                        ...char.inventory,
                                        weapons: [...char.inventory.weapons, ...weaponsToAdd],
                                        otherEquipment: [...char.inventory.otherEquipment, ...equipmentToAdd]
                                    }
                                }));
                                setCreationStep(6);
                            }}
                        />
                    </>
                )}

                {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
            </div>
        </div>
    );
}
