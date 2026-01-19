
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    ATTRIBUTE_DISPLAY_NAMES,
    SKILLS,
    createBlankCharacter,
    hydrateCharacter,
    calculateComputedStats,
    Character,
    ATTRIBUTE_KEYS
} from '@/lib/character-data';
import { Weapon, OtherEquipmentItem, dndWeapons, dndEquipments, parseDamageString } from '@/lib/items-data';
import { dndClasses, dndRaces } from '@/lib/dnd-data';
import SelectionModal from '@/components/ui/SelectionModal';
import SubclassModal from '../../../components/ui/SubclassModal';
import WeaponModal from '@/components/ui/WeaponModal';
import EquipmentModal from '@/components/ui/EquipmentModal';
import SpellModal from '@/components/ui/SpellModal';
import SpellSelectModal from '@/components/ui/SpellSelectModal';
import { searchSpells } from '@/lib/spells-data';
import LevelUpModal from '@/components/ui/LevelUpModal';
import {
    fetchClassFeaturesFromFirestore,
    fetchRaceFeaturesFromFirestore,
    fetchAllFeatsFromFirestore,
    saveGeneratedSubclassToFirestore
} from '@/lib/class-features-sync';
import { SUBCLASSES, SUBCLASS_CHOICE_LEVELS } from '@/lib/class-features';
import { StartingProficienciesModal } from '@/components/ui/StartingProficienciesModal';
import { StartingEquipmentModal } from '@/components/ui/StartingEquipmentModal';
import { CLASS_PROFICIENCIES } from '@/lib/class-proficiencies';
import Modal from '@/components/Modal';

// --- Constantes de Ficha 2.0 ---
import { COMMON_CONDITIONS, CLASS_EFFECTS, EFFECT_STYLES, getEffectStyle } from '@/lib/effects-conditions';

const ACTIVE_EFFECTS = [
    { id: 'rage', name: 'Fúria', icon: '🔥', classReq: 'Bárbaro' },
    { id: 'bless', name: 'Bênção', icon: '✨' },
    { id: 'inspiration', name: 'Inspiração Bárdica', icon: '🎵' },
    { id: 'concentrating', name: 'Concentrando', icon: '🧠' },
];

// --- Componentes Auxiliares ---
const StatBlock = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-rpg-panel border border-rpg-gold/20 shadow-lg h-full backdrop-blur-md group hover:border-rpg-gold/40 transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rpg-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-[10px] font-black text-rpg-gold/60 text-center uppercase tracking-[0.2em] font-cinzel mb-1">{label}</span>
        <span className="text-3xl font-bold text-rpg-parchment font-cinzel group-hover:text-white transition-colors drop-shadow-glow-gold/10">{value}</span>
    </div>
);

const AttributeInput = ({ label, value, onChange, disabled }: { label: string; value: number; onChange: (newValue: number) => void; disabled?: boolean }) => (
    <div className={`w-full p-3 text-center transition-all duration-300 bg-rpg-panel border rounded-lg shadow-lg backdrop-blur-sm group ${disabled ? 'opacity-70 border-rpg-grey/20' : 'border-rpg-gold/20 hover:border-rpg-gold/50'}`}>
        <label className={`block text-xs font-bold tracking-wider uppercase font-cinzel ${disabled ? 'text-rpg-grey' : 'text-rpg-gold group-hover:text-rpg-gold-light'}`}>{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className={`w-20 p-1 text-3xl font-bold text-center bg-transparent border-b-2 focus:outline-none font-medieval ${disabled ? 'text-rpg-grey border-rpg-grey/20 cursor-not-allowed' : 'text-rpg-parchment border-rpg-gold/20 focus:border-rpg-gold'}`}
        />
        <div className={`mt-1 text-xl font-bold font-medieval bg-rpg-dark/50 rounded px-2 w-10 mx-auto border border-white/5 ${disabled ? 'text-rpg-grey' : 'text-rpg-parchment'}`}>{Math.floor((value - 10) / 2)}</div>
    </div>
);

interface SkillCheckboxProps {
    skillKey: string;
    displayName: string;
    attribute: string;
    isProficient: boolean;
    proficiencyBonus: number;
    attributeMod: number;
    onChange: (key: string, checked: boolean) => void;
    disabled?: boolean;
}

const SkillCheckbox = ({ skillKey, displayName, attribute, isProficient, proficiencyBonus, attributeMod, onChange, disabled }: SkillCheckboxProps) => (
    <div className={`flex items-center justify-between p-2.5 rounded-lg transition-all border border-transparent ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-rpg-slate/40 hover:border-rpg-gold/10 hover:shadow-inner group/skill'}`}>
        <label htmlFor={skillKey} className={`flex items-center flex-grow ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="relative flex items-center justify-center">
                <input
                    id={skillKey}
                    type="checkbox"
                    checked={isProficient}
                    onChange={(e) => onChange(skillKey, e.target.checked)}
                    disabled={disabled}
                    className="absolute opacity-0 w-5 h-5 cursor-pointer z-10"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isProficient
                    ? 'bg-rpg-gold border-rpg-gold shadow-glow-gold/30'
                    : 'bg-black/40 border-rpg-gold/20 group-hover/skill:border-rpg-gold/40'}`}>
                    {isProficient && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-rpg-dark" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
            </div>
            <div className="ml-4 flex flex-col">
                <span className={`text-sm tracking-tight transition-colors ${isProficient ? 'text-rpg-gold font-bold' : 'text-rpg-parchment/80 group-hover/skill:text-rpg-parchment'}`}>
                    {displayName}
                </span>
                <span className="text-[9px] text-rpg-grey/50 uppercase font-bold tracking-tighter">
                    {ATTRIBUTE_DISPLAY_NAMES[attribute as keyof typeof ATTRIBUTE_DISPLAY_NAMES] || attribute}
                </span>
            </div>
        </label>
        <div className={`flex items-center justify-center w-10 h-10 rounded bg-black/20 border transition-all ${isProficient ? 'border-rpg-gold/30 bg-rpg-gold/5' : 'border-white/5 group-hover/skill:border-white/10'}`}>
            <span className={`font-medieval text-xl font-bold ${isProficient ? 'text-rpg-gold' : 'text-rpg-parchment/60'}`}>
                {attributeMod + (isProficient ? proficiencyBonus : 0) >= 0 ? '+' : ''}{attributeMod + (isProficient ? proficiencyBonus : 0)}
            </span>
        </div>
    </div>
);

interface TabButtonProps {
    activeTab: 'Principal' | 'Equipamento' | 'Habilidades' | 'Magias' | 'Personalidade';
    tabName: 'Principal' | 'Equipamento' | 'Habilidades' | 'Magias' | 'Personalidade';
    onClick: (tab: 'Principal' | 'Equipamento' | 'Habilidades' | 'Magias' | 'Personalidade') => void;
}

const TabButton = ({ activeTab, tabName, onClick }: TabButtonProps) => (
    <button onClick={() => onClick(tabName)} className={`flex-grow px-4 py-3 text-sm font-bold rounded-t-lg transition-all duration-200 font-cinzel tracking-wider border-t border-x ${activeTab === tabName ? 'bg-rpg-panel text-rpg-gold border-rpg-gold/30 shadow-[0_-5px_15px_-5px_rgba(218,165,32,0.1)]' : 'bg-rpg-slate text-rpg-grey border-transparent hover:text-rpg-parchment hover:bg-rpg-dark'}`}>
        {tabName}
    </button>
);

// --- DEBOUNCE --- 
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout !== null) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}

// --- Componentes Ficha 2.0 ---
const QuickActions = ({ character }: { character: Character }) => {
    const isBarbarian = character.class?.toLowerCase().includes('bárbaro') || character.class?.toLowerCase().includes('barbarian');
    const isSpellcaster = character.spellcasting?.ability !== '';
    const hasWeapons = character.inventory?.weapons?.length > 0;

    const actions = [
        hasWeapons && 'Ataque',
        isSpellcaster && 'Lançar Magia',
        'Desvencilhar',
        'Disparar',
        'Ajudar',
    ].filter(Boolean);

    const bonusActions = [
        isBarbarian && 'Entrar em Fúria',
        isSpellcaster && 'Magia (Bônus)',
        'Usar Poção',
    ].filter(Boolean);

    const reactions = [
        'Ataque de Oportunidade',
        isSpellcaster && 'Contrafeitiço/Escudo',
    ].filter(Boolean);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-rpg-panel border border-rpg-gold/20 p-3 rounded-lg flex flex-col items-center">
                <span className="text-[10px] text-rpg-gold font-bold uppercase mb-1">Ações Principais</span>
                <div className="flex flex-wrap justify-center gap-1">
                    {actions.map(a => <span key={a} className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-rpg-grey">{a}</span>)}
                </div>
            </div>
            <div className="bg-rpg-panel border border-rpg-gold/20 p-3 rounded-lg flex flex-col items-center text-blue-400">
                <span className="text-[10px] font-bold uppercase mb-1">Ações Bônus</span>
                <div className="flex flex-wrap justify-center gap-1">
                    {bonusActions.map(a => <span key={a} className="text-[10px] bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">{a}</span>)}
                </div>
            </div>
            <div className="bg-rpg-panel border border-rpg-gold/20 p-3 rounded-lg flex flex-col items-center text-red-400">
                <span className="text-[10px] font-bold uppercase mb-1">Reações</span>
                <div className="flex flex-wrap justify-center gap-1">
                    {reactions.map(a => <span key={a} className="text-[10px] bg-red-900/20 px-2 py-0.5 rounded border border-red-500/20">{a}</span>)}
                </div>
            </div>
        </div>
    );
};

const ConditionManager = ({ character, onToggleCondition, onToggleEffect }: {
    character: Character;
    onToggleCondition: (id: string) => void;
    onToggleEffect: (id: string) => void;
}) => {
    const isBarbarian = character.class?.toLowerCase().includes('bárbaro') || character.class?.toLowerCase().includes('barbarian');
    const activeConditions = character.conditions || [];
    const activeEffects = character.activeEffects || [];

    // Separar efeitos ativos em benefícios e malefícios
    const benefitIds = ['rage', 'bless', 'inspiration', 'concentrating', 'reckless', 'counter-charm', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'sneak-attack', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection'];
    
    const activeEffectObjects = ACTIVE_EFFECTS.filter(e => activeEffects.includes(e.id));
    const activeBenefits = activeEffectObjects.filter(e => benefitIds.includes(e.id));
    const activeDebuffs = activeEffectObjects.filter(e => !benefitIds.includes(e.id));

    return (
        <div className="space-y-4 mb-6">
            {/* Efeitos Ativos - Benefícios e Malefícios Lado a Lado */}
            <div className="grid grid-cols-2 gap-4">
                {/* Coluna de Benefícios */}
                <div className="space-y-2">
                    {activeBenefits.length > 0 && (
                        <>
                            <div className="text-xs text-green-400 font-bold uppercase tracking-widest">✦ Benefícios</div>
                            <div className="space-y-1.5">
                                {activeBenefits.map(effect => {
                                    if (effect.classReq && !isBarbarian) return null;
                                    return (
                                        <button
                                            key={effect.id}
                                            onClick={() => onToggleEffect(effect.id)}
                                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold border transition-all bg-gradient-to-r from-green-900/40 to-green-900/20 border-green-600/50 text-green-300 hover:border-green-500 hover:from-green-900/60 shadow-lg shadow-green-900/20"
                                        >
                                            <span className="text-lg">{effect.icon}</span>
                                            <span className="truncate">{effect.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                    
                    {/* Botão para adicionar benefícios */}
                    {ACTIVE_EFFECTS.filter(e => (e.classReq === undefined || (e.classReq && isBarbarian)) && benefitIds.includes(e.id) && !activeEffects.includes(e.id)).length > 0 && (
                        <div className="pt-2">
                            <div className="text-[9px] text-rpg-gold/50 font-bold uppercase opacity-70 mb-1">Adicionar:</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {ACTIVE_EFFECTS.filter(e => (e.classReq === undefined || (e.classReq && isBarbarian)) && benefitIds.includes(e.id) && !activeEffects.includes(e.id)).map(effect => (
                                    <button
                                        key={effect.id}
                                        onClick={() => onToggleEffect(effect.id)}
                                        className="w-full px-2 py-1.5 rounded text-[9px] font-bold border transition-all bg-green-950/30 border-green-700/30 text-green-400 hover:bg-green-900/40 hover:border-green-600"
                                    >
                                        + {effect.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Coluna de Malefícios */}
                <div className="space-y-2">
                    {activeDebuffs.length > 0 && (
                        <>
                            <div className="text-xs text-red-400 font-bold uppercase tracking-widest">⚠ Malefícios</div>
                            <div className="space-y-1.5">
                                {activeDebuffs.map(effect => {
                                    if (effect.classReq && !isBarbarian) return null;
                                    return (
                                        <button
                                            key={effect.id}
                                            onClick={() => onToggleEffect(effect.id)}
                                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold border transition-all bg-gradient-to-r from-red-900/40 to-red-900/20 border-red-600/50 text-red-300 hover:border-red-500 hover:from-red-900/60 shadow-lg shadow-red-900/20"
                                        >
                                            <span className="text-lg">{effect.icon}</span>
                                            <span className="truncate">{effect.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Botão para adicionar malefícios */}
                    {ACTIVE_EFFECTS.filter(e => (e.classReq === undefined || (e.classReq && isBarbarian)) && !benefitIds.includes(e.id) && !activeEffects.includes(e.id)).length > 0 && (
                        <div className="pt-2">
                            <div className="text-[9px] text-rpg-gold/50 font-bold uppercase opacity-70 mb-1">Adicionar:</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {ACTIVE_EFFECTS.filter(e => (e.classReq === undefined || (e.classReq && isBarbarian)) && !benefitIds.includes(e.id) && !activeEffects.includes(e.id)).map(effect => (
                                    <button
                                        key={effect.id}
                                        onClick={() => onToggleEffect(effect.id)}
                                        className="w-full px-2 py-1.5 rounded text-[9px] font-bold border transition-all bg-red-950/30 border-red-700/30 text-red-400 hover:bg-red-900/40 hover:border-red-600"
                                    >
                                        + {effect.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Condições Globais */}
            <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-rpg-gold font-bold uppercase tracking-widest mb-2">Condições</div>
                <div className="flex flex-wrap gap-2">
                    {COMMON_CONDITIONS.map(cond => {
                        const isActive = activeConditions.includes(cond.id);
                        const isBenefit = cond.id === 'invisivel';
                        return (
                            <button
                                key={cond.id}
                                onClick={() => onToggleCondition(cond.id)}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold border transition-all ${isActive
                                    ? isBenefit 
                                        ? 'bg-gradient-to-r from-green-900/40 to-green-900/20 border-green-600/50 text-green-300'
                                        : 'bg-gradient-to-r from-red-900/40 to-red-900/20 border-red-600/50 text-red-300'
                                    : 'bg-rpg-panel border-white/5 text-rpg-grey/60 hover:text-rpg-grey hover:border-rpg-gold/20'
                                }`}
                            >
                                <span>{cond.icon}</span>
                                <span className="truncate">{cond.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Componente Principal --- 
export default function CharacterSheetPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false); // True quando o mestre está visualizando
    const [activeTab, setActiveTab] = useState<'Principal' | 'Equipamento' | 'Habilidades' | 'Magias' | 'Personalidade'>('Principal');
    const [activeSkillSubTab, setActiveSkillSubTab] = useState<'skills' | 'features' | 'feats'>('skills');
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [availableFeats, setAvailableFeats] = useState<any[]>([]);
    const [isFeatModalOpen, setIsFeatModalOpen] = useState(false);
    const [isSubclassModalOpen, setIsSubclassModalOpen] = useState(false);


    // Automação: Proficiências
    const [isProficiencyModalOpen, setIsProficiencyModalOpen] = useState(false);
    const [casterAlertModal, setCasterAlertModal] = useState(false);
    const [isEquipmentStartModalOpen, setIsEquipmentStartModalOpen] = useState(false);
    const [selectedClassForProficiency, setSelectedClassForProficiency] = useState<string>('');

    // Modais e Estados de Dados
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'class' | 'race' | 'weapon', title: string } | null>(null);
    const [classes, setClasses] = useState<string[]>([]);
    const [races, setRaces] = useState<string[]>([]);
    const [weapons, setWeapons] = useState<any[]>([]);
    const [isDbDataLoading, setIsDbDataLoading] = useState(true);

    const [isWeaponModalOpen, setWeaponModalOpen] = useState(false);
    const [weaponToEdit, setWeaponToEdit] = useState<Weapon | null>(null);
    const [isEquipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<OtherEquipmentItem | null>(null);
    const [allEquipment, setAllEquipment] = useState<{ name: string }[]>([]);

    const [isSpellSelectOpen, setSpellSelectOpen] = useState(false);
    const [isSpellModalOpen, setSpellModalOpen] = useState(false);
    const [spellToEdit, setSpellToEdit] = useState(null);

    const [weaponSearchTerm, setWeaponSearchTerm] = useState('');
    const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
    const [expandedSpellLevels, setExpandedSpellLevels] = useState<Record<number, boolean>>({ 0: true });

    const [isLevelUpModalOpen, setLevelUpModalOpen] = useState(false);
    const [classProgression, setClassProgression] = useState<any>(null);
    const lastLevelRef = useRef<number | null>(null);

    // Modals de Confirmação
    const [confirmRemoveFeatureModal, setConfirmRemoveFeatureModal] = useState<{ open: boolean; featureName: string | null }>({ open: false, featureName: null });

    const dataFetchInitiated = useRef(false);

    const handleSelectSubclass = (subclassName: string | null) => {
        if (!subclassName) {
            setIsSubclassModalOpen(false);
            return;
        }

        updateCharacter(char => {
            const className = char.class;
            const level = char.level || 1;
            const subclassData = SUBCLASSES[className]?.[subclassName];

            let newFeatures = [...(char.features || [])];

            if (subclassData) {
                // Injetar habilidades da subclasse até o nível atual
                Object.entries(subclassData as Record<number, any>).forEach(([lvl, data]) => {
                    const levelNum = parseInt(lvl);
                    if (levelNum <= level) {
                        (data.features as any[]).forEach(feat => {
                            if (!newFeatures.some(f => f.name === feat.name)) {
                                newFeatures.push({
                                    ...feat,
                                    level: levelNum,
                                    type: 'class' as const
                                });
                            }
                        });
                    }
                });
            }

            return {
                ...char,
                subclass: subclassName,
                features: newFeatures
            };
        });
        setIsSubclassModalOpen(false);
    };



    const executeRemoveFeature = () => {
        const featureName = (window as any).__featureToRemove;
        if (featureName) {
            updateCharacter(prev => ({
                ...prev,
                features: prev.features.filter(f => f.name !== featureName)
            }));
            setConfirmRemoveFeatureModal({ open: false, featureName: null });
            delete (window as any).__featureToRemove;
        }
    };

    const characterLoaded = useRef(false);
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const debouncedSave = useMemo(() => debounce(async (charToSave: Character) => {
        if (!user || !charToSave.id || charToSave.id === 'novo') return;
        try {
            const docRef = doc(db, 'personagens', charToSave.id);
            await setDoc(docRef, JSON.parse(JSON.stringify(charToSave)), { merge: true });
        } catch (err) {
            console.error("Erro ao salvar personagem:", err);
        }
    }, 1500), [user]);

    const updateCharacter = useCallback((updater: (char: Character) => Character) => {
        if (isReadOnly) return; // Não permite edição em modo somente leitura
        setCharacter(prevChar => {
            if (!prevChar) return null;
            const updatedChar = updater(prevChar);
            const finalChar = calculateComputedStats(updatedChar);
            debouncedSave(finalChar);
            return finalChar;
        });
    }, [isReadOnly, debouncedSave]);

    // --- Carregamento de Dados ---
    useEffect(() => {
        if (dataFetchInitiated.current) return;
        dataFetchInitiated.current = true;

        const fetchGameData = async () => {
            setIsDbDataLoading(true);
            try {
                const populateCollection = async (collectionName: string, defaultData: any[], sortField = 'name') => {
                    const collectionRef = collection(db, collectionName);
                    const snapshot = await getDocs(collectionRef);

                    // Criar mapa com dados existentes do banco (normalizado)
                    const existingMap = new Map<string, any>();
                    snapshot.docs.forEach(docSnap => {
                        const data = docSnap.data();
                        const normalizedName = data.name?.toLowerCase().trim();
                        if (normalizedName) {
                            existingMap.set(normalizedName, { ...data, _docId: docSnap.id });
                        }
                    });

                    // Mesclar com dados do código (código tem prioridade para regras oficiais)
                    const mergedMap = new Map<string, any>();
                    defaultData.forEach(item => {
                        const normalizedName = item.name?.toLowerCase().trim();
                        if (normalizedName) {
                            const existing = existingMap.get(normalizedName);
                            mergedMap.set(normalizedName, {
                                ...item,
                                _docId: existing?._docId // Preserva ID se já existir
                            });
                        }
                    });

                    // Adicionar itens do banco que não estão no código (customizados)
                    existingMap.forEach((item, key) => {
                        if (!mergedMap.has(key)) {
                            mergedMap.set(key, item);
                        }
                    });

                    // Atualizar banco com versão consolidada (apenas se houver mudanças)
                    if (mergedMap.size > 0) {
                        const batch = writeBatch(db);
                        let batchCount = 0;

                        mergedMap.forEach((item) => {
                            const { _docId, ...dataToSave } = item;
                            const docRef = _docId ? doc(collectionRef, _docId) : doc(collectionRef);
                            batch.set(docRef, dataToSave, { merge: true });
                            batchCount++;
                        });

                        if (batchCount > 0) {
                            await batch.commit();
                            console.log(`✅ ${collectionName}: ${batchCount} itens consolidados (${defaultData.length} do código + ${existingMap.size - defaultData.length} customizados)`);
                        }
                    }

                    // Retornar dados consolidados
                    const finalSnapshot = await getDocs(collectionRef);
                    return finalSnapshot.docs
                        .map(doc => ({ ...doc.data() as any, id: doc.id }))
                        .sort((a, b) => a[sortField]?.localeCompare(b[sortField]));
                };

                const [classData, raceData, allItemsData] = await Promise.all([
                    populateCollection('classes', dndClasses.map(name => ({ name }))),
                    populateCollection('races', dndRaces.map(name => ({ name }))),
                    populateCollection('itens', [
                        ...dndWeapons.map(w => ({ ...w, itemType: 'WEAPON' })),
                        ...dndEquipments.map(e => ({ ...e, itemType: 'EQUIPMENT' }))
                    ])
                ]);

                setClasses(classData.map(c => c.name));
                setRaces(raceData.map(r => r.name));

                // Remover duplicatas por nome (caso o merge tenha falhado)
                const weaponsMap = new Map();
                allItemsData
                    .filter(i => i.itemType === 'WEAPON' || i.damage || i.diceType)
                    .forEach(item => {
                        const key = item.name?.toLowerCase().trim();
                        if (key && !weaponsMap.has(key)) {
                            weaponsMap.set(key, item);
                        }
                    });

                const equipmentMap = new Map();
                allItemsData
                    .filter(i => i.itemType !== 'WEAPON' && !i.damage && !i.diceType)
                    .forEach(item => {
                        const key = item.name?.toLowerCase().trim();
                        if (key && !equipmentMap.has(key)) {
                            equipmentMap.set(key, item);
                        }
                    });

                setWeapons(Array.from(weaponsMap.values()));
                setAllEquipment(Array.from(equipmentMap.values()));
            } catch (err) {
                console.error("Falha ao carregar dados do jogo:", err);
                setError("Falha ao carregar dados essenciais do jogo.");
            } finally {
                setIsDbDataLoading(false);
            }
        };
        fetchGameData();
    }, []);

    useEffect(() => {
        if (loadingAuth || !user || characterLoaded.current) return;
        if (id === 'novo' && character) return;

        const loadChar = async () => {
            setIsLoading(true);
            try {
                if (id === 'novo') {
                    setCharacter(createBlankCharacter(user.uid));
                    characterLoaded.current = true;
                } else {
                    const docRef = doc(db, 'personagens', id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const charData = docSnap.data();
                        const isOwner = charData.ownerId === user.uid;

                        // Salva o ID do personagem ativo para integração com a Biblioteca
                        localStorage.setItem('activeCharacterId', id as string);
                        localStorage.setItem('activeCharacterName', charData.name);

                        // Verificar se o usuário é o mestre da campanha vinculada
                        let isCampaignMaster = false;
                        if (charData.campaignId) {
                            const campaignRef = doc(db, 'campaigns', charData.campaignId);
                            const campaignSnap = await getDoc(campaignRef);
                            if (campaignSnap.exists() && campaignSnap.data().ownerId === user.uid) {
                                isCampaignMaster = true;
                            }
                        }

                        if (isOwner || isCampaignMaster) {
                            // Define modo somente leitura se for o mestre da campanha
                            setIsReadOnly(isCampaignMaster && !isOwner);

                            const hydratedChar = hydrateCharacter(charData as Partial<Character>, docSnap.id);

                            // Enriquecer magias se necessário
                            const { fetchGlobalSpells } = await import('@/lib/spells-data');
                            const globalSpells = await fetchGlobalSpells();

                            let needsUpdate = false;
                            const enrichedSpells = (hydratedChar.spells || []).map(s => {
                                if (!s || !s.name) return s;
                                if (s.description && s.description !== 'Sem descrição.' && s.castingTime) return s;

                                const match = globalSpells.find(gs => gs.name.toLowerCase() === s.name.toLowerCase());
                                if (match) {
                                    needsUpdate = true;
                                    return { ...s, ...match, id: s.id };
                                }
                                return s;
                            });

                            hydratedChar.spells = enrichedSpells;

                            // Enriquecer itens se necessário
                            const { fetchGlobalItems, parseDamageString: parseDmg } = await import('@/lib/items-data');

                            // Busca na coleção centralizada 'itens' (fonte única de verdade)
                            const firestoreItens = await fetchGlobalItems();

                            const allWeapons = firestoreItens.filter(i => i.itemType === 'WEAPON' || i.damage || i.diceType);
                            const allEquipment = firestoreItens.filter(i => i.itemType !== 'WEAPON' && !i.damage && !i.diceType);

                            const normalizeStr = (str: string) => str ? str.normalize('NFC').trim().toLowerCase() : '';

                            const enrichedWeapons = (hydratedChar.inventory.weapons || []).map(w => {
                                if (!w || !w.name) return w;
                                // Se for customizado, não tenta enriquecer para não perder edição do usuário
                                if (w.isCustomDamage) return w;

                                // Tenta validar se já tem dados críticos. Se tiver damageType, assume que está ok, 
                                // MAS se o nome bater com global, pode ser melhor enriquecer para garantir peso e regras novas?
                                // Vamos priorizar o banco global se não for customizado.

                                const wNameNormalized = normalizeStr(w.name);
                                const matches = allWeapons.filter(gi => normalizeStr(gi.name) === wNameNormalized);

                                logger.debug(`Buscando Arma: "${w.name}" (Normalizado: "${wNameNormalized}")`);
                                if (matches.length > 0) {
                                    // Prioridade: code > database
                                    const match = matches.find(m => (m as any).origin === 'code') ||
                                        matches.find(m => (m as any).origin === 'database') ||
                                        matches[0];

                                    if (matches.length > 1) {
                                        logger.warn(`[AVISO] Múltiplos registros para "${w.name}":`, matches.map(m => ((m as any).origin)));
                                    }

                                    logger.debug("Correspondência ENCONTRADA (${(match as any).origin || 'unknown'}):", match);
                                    const p = parseDmg(match.damage || '1d8');
                                    needsUpdate = true;

                                    const oldWeight = w.weight || 0;
                                    const newWeight = match.weight || 0;
                                    if (oldWeight !== newWeight) {
                                        logger.debug(`Corrigindo Peso de "${w.name}": ${oldWeight} -> ${newWeight}`);
                                    }

                                    // ESTRATÉGIA: Pega tudo do banco/código, mas mantém o que é específico do import
                                    return {
                                        ...w,
                                        ...match,
                                        id: w.id,
                                        quantity: w.quantity,
                                        weight: match.weight !== undefined ? match.weight : w.weight,
                                        diceQty: p.diceQty,
                                        diceType: p.diceType,
                                        diceBonus: p.diceBonus,
                                        isCustomDamage: false
                                    };
                                } else {
                                    console.warn(`[DEBUG] Não encontrado: "${w.name}" no pool de ${allWeapons.length} armas.`);
                                    return w;
                                }
                            });

                            const enrichedEquipment = (hydratedChar.inventory.otherEquipment || []).map(e => {
                                if (!e || !e.name) return e;
                                // Removido o guard para sempre tentar enriquecer por nome (preferência por dados oficiais)
                                const match = allEquipment.find(gi => normalizeStr(gi.name) === normalizeStr(e.name));
                                if (match) {
                                    logger.debug("Equipamento ENCONTRADO (${(match as any).origin || 'unknown'}):", match);
                                    needsUpdate = true;
                                    return {
                                        ...e,
                                        ...match,
                                        id: e.id,
                                        type: (match.itemType === 'ARMOR' ? 'armor' : match.itemType === 'SHIELD' ? 'shield' : 'other'),
                                        armorClass: match.ac || e.armorClass,
                                        weight: match.weight || e.weight
                                    };
                                }
                                return e;
                            });

                            hydratedChar.inventory.weapons = enrichedWeapons;
                            hydratedChar.inventory.otherEquipment = enrichedEquipment;

                            setCharacter(hydratedChar);
                            characterLoaded.current = true;

                            // Se houve enriquecimento, salva de volta para evitar re-enriquecer
                            if (needsUpdate) {
                                debouncedSave(hydratedChar);
                            }
                        } else {
                            setError("Ficha não encontrada ou acesso negado.");
                            router.push('/personagens');
                        }
                    }
                }
            } catch (e) { setError("Falha ao carregar a ficha."); console.error(e); }
            finally { setIsLoading(false); }
        };
        loadChar();
    }, [id, user, loadingAuth, router, character, debouncedSave]);

    // Monitoramento de Level Up
    useEffect(() => {
        if (!character || isLoading) return;

        if (lastLevelRef.current !== null && character.level > lastLevelRef.current) {
            setLevelUpModalOpen(true);
        }
        lastLevelRef.current = character.level;

        if (character.class) {
            fetchClassFeaturesFromFirestore(character.class).then(progression => {
                setClassProgression(progression);
            });
        }

        // Carregar Talentos Disponíveis
        fetchAllFeatsFromFirestore().then(feats => {
            setAvailableFeats(feats);
        });

        // Injetar Características Raciais se estiverem faltando
        if (character.race && (!character.features || character.features.filter(f => f.type === 'race').length === 0)) {
            fetchRaceFeaturesFromFirestore(character.race).then(raceFeatures => {
                if (raceFeatures.length > 0) {
                    updateCharacter(prev => {
                        const existingNames = new Set((prev.features || []).map(f => f.name));
                        const newRacialFeatures = raceFeatures
                            .filter(rf => !existingNames.has(rf.name))
                            .map(rf => ({ ...rf, type: 'race' as const }));

                        if (newRacialFeatures.length === 0) return prev;

                        return {
                            ...prev,
                            features: [...(prev.features || []), ...newRacialFeatures]
                        };
                    });
                }
            });
        }
    }, [character, isLoading, updateCharacter]);

    const handleApplyLevelUp = (choices: { attributes: Record<string, number>; hpIncrease: number; newSpells?: any[]; subclass?: string }) => {
        if (!character) return;

        updateCharacter(prev => {
            const newAttributes = { ...prev.attributes };
            Object.entries(choices.attributes).forEach(([attr, bonus]) => {
                if (bonus > 0) {
                    newAttributes[attr as keyof typeof newAttributes] = (newAttributes[attr as keyof typeof newAttributes] || 10) + bonus;
                }
            });

            const newLevel = prev.level; // O nível já foi atualizado pelo gatilho (XP ou Manual)
            const newFeatures = [...(prev.features || [])];

            // 1. Buscar características da CLASSE para o NOVO nível
            if (classProgression && classProgression[newLevel]) {
                const levelProgression = classProgression[newLevel];
                levelProgression.features.forEach(feat => {
                    // Evitar duplicatas exatas e ASI (que é escolha manual)
                    const isDuplicate = newFeatures.some(f => f.name === feat.name);
                    const isASI = feat.name.includes("Melhoria no Valor de Atributo");

                    if (!isDuplicate && !isASI) {
                        newFeatures.push({
                            ...feat,
                            level: newLevel,
                            type: 'class'
                        });
                    }
                });
            }

            // 2. Buscar características da SUBCLASSE (se houver escolha nova ou já existente)
            const activeSubclass = choices.subclass || prev.subclass;
            if (activeSubclass && prev.class) {
                const subclassData = SUBCLASSES[prev.class]?.[activeSubclass]?.[newLevel];
                if (subclassData) {
                    // Features
                    subclassData.features.forEach(feat => {
                        const isDuplicate = newFeatures.some(f => f.name === feat.name);
                        if (!isDuplicate) {
                            newFeatures.push({
                                ...feat,
                                level: newLevel,
                                type: 'class', // Usando 'class' pois as features de subclasse são extensões da classe
                                source: activeSubclass
                            });
                        }
                    });

                    // Magias Automáticas (Automação Sugerida)
                    if (subclassData.spells && subclassData.spells.length > 0) {
                        // Buscar detalhes das magias
                        // Precisamos de spellsDatabase. Vamos assumir que está importado ou usar uma função auxiliar.
                        // Como não temos acesso direto ao banco aqui dentro, vamos tentar usar searchSpells se importada,
                        // ou injetar manualmente se tivermos os dados.
                        // Melhor: Assumir que `spellsDatabase` (hardcoded) pode ser importado de spells-data.

                        // Importação dinâmica ou uso de função global seria ideal, mas aqui vamos tentar importar spellsDatabase no topo.
                        // Se não der, usaremos searchSpells que já deve estar importada (verificar imports).
                        // Assumindo que temos searchSpells de spells-data:
                        const autoSpells = subclassData.spells.map(spellId =>
                            searchSpells('', undefined).find(s => s.id === spellId)
                        ).filter(Boolean);

                        autoSpells.forEach(spell => {
                            if (spell) {
                                // Adicionar à lista de magias
                                // Verificar se já não está na lista de "updatedSpells" (que será processada abaixo)
                                // Mas precisamos adicionar ao "updatedSpells" antes do return.
                                // Como "updatedSpells" é definido DEPOIS, vamos adicionar a uma lista temporária ou mover a definição.
                            }
                        });

                        // Vamos mover a definição de updatedSpells para cima para poder usar aqui.
                    }
                }
            }

            // Magias (Evitar duplicatas)
            // Lógica ajustada para incluir subclass spells
            let updatedSpells = [...(prev.spells || [])];

            // Adicionar Automatic Spells
            if (activeSubclass && prev.class) {
                const subclassData = SUBCLASSES[prev.class]?.[activeSubclass]?.[newLevel];
                if (subclassData && subclassData.spells) {
                    const allSpells = searchSpells('', undefined); // Busca todas hardcoded
                    const autoSpells = subclassData.spells.map(id => allSpells.find(s => s.id === id)).filter(Boolean);

                    autoSpells.forEach(spell => {
                        if (spell && !updatedSpells.some(s => s.id === spell.id)) {
                            updatedSpells.push(spell);
                        }
                    });
                }
            }

            if (choices.newSpells && choices.newSpells.length > 0) {
                const existingIds = new Set(updatedSpells.map(s => s.id));
                choices.newSpells.forEach(spell => {
                    if (spell && !existingIds.has(spell.id)) {
                        updatedSpells.push(spell);
                        existingIds.add(spell.id);
                    }
                });
            }

            return {
                ...prev,
                level: newLevel,
                attributes: newAttributes,
                maxHp: (prev.maxHp || 0) + choices.hpIncrease,
                currentHp: (prev.currentHp || 0) + choices.hpIncrease,
                features: newFeatures,
                spells: updatedSpells,
                subclass: activeSubclass
            };
        });
    };

    // --- Lógica de Campos ---
    const handleFieldChange = (field: keyof Omit<Character, 'attributes' | 'skills' | 'inventory'>, value: any) => {
        updateCharacter(char => ({ ...char, [field]: value }));
    };
    const handleNestedChange = (path: string, value: any) => {
        updateCharacter(char => {
            const newChar = JSON.parse(JSON.stringify(char));
            let current: any = newChar;
            const keys = path.split('.');
            for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]] = current[keys[i]] || {}; }
            current[keys[keys.length - 1]] = value;
            return newChar;
        });
    };

    // --- Lógica de Itens ---
    const handleOpenWeaponModal = (weapon: Weapon | null) => { setWeaponToEdit(weapon); setWeaponModalOpen(true); };
    const handleSaveWeapon = (weapon: Weapon) => {
        updateCharacter(char => {
            const newWeapons = [...char.inventory.weapons];
            const index = newWeapons.findIndex(w => w.id === weapon.id);
            if (index > -1) newWeapons[index] = weapon; else newWeapons.push(weapon);
            return { ...char, inventory: { ...char.inventory, weapons: newWeapons } };
        });
        setWeaponModalOpen(false);
    };
    const handleRemoveWeapon = (weaponId: string) => {
        updateCharacter(char => ({
            ...char, inventory: { ...char.inventory, weapons: char.inventory.weapons.filter(w => w.id !== weaponId) }
        }));
    };

    const toggleCondition = (id: string) => {
        updateCharacter(char => {
            const conditions = char.conditions || [];
            const newConditions = conditions.includes(id)
                ? conditions.filter(c => c !== id)
                : [...conditions, id];
            return { ...char, conditions: newConditions };
        });
    };

    const toggleActiveEffect = async (id: string) => {
        // Atualizar localmente
        updateCharacter(char => {
            const effects = char.activeEffects || [];
            const newEffects = effects.includes(id)
                ? effects.filter(e => e !== id)
                : [...effects, id];
            return { ...char, activeEffects: newEffects };
        });

        // Sincronizar com o combate se o personagem estiver em um
        try {
            // Procura por combates que contenham este personagem
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const encountersRef = collection(db, 'encounters');
            const q = query(encountersRef);
            const snapshot = await getDocs(q);

            snapshot.forEach(async (docSnap) => {
                const combatData = docSnap.data();
                const combatants = combatData.combatants || [];
                
                // Procura o combatente com este personagem
                const combatant = combatants.find((c: any) => c.externalId === character?.id);
                if (combatant) {
                    // Sincroniza o efeito com o combate
                    const { updateDoc } = await import('firebase/firestore');
                    const combatRef = doc(db, 'encounters', docSnap.id);
                    
                    const updatedCombatants = combatants.map((c: any) => {
                        if (c.externalId === character?.id) {
                            const effects = c.statusEffects || [];
                            const hasEffect = effects.some((e: any) => e.id === id);
                            return {
                                ...c,
                                statusEffects: hasEffect
                                    ? effects.filter((e: any) => e.id !== id)
                                    : [...effects, { id, name: '', duration: 10 }]
                            };
                        }
                        return c;
                    });
                    
                    await updateDoc(combatRef, { combatants: updatedCombatants });
                    console.log(`[SYNC] Efeito ${id} sincronizado com combate`);
                }
            });
        } catch (err) {
            console.error('[SYNC] Erro ao sincronizar efeito com combate:', err);
        }
    };

    const handleLongRest = () => {
        updateCharacter(char => ({
            ...char,
            currentHp: char.maxHp,
            temporaryHp: 0,
            spellcasting: {
                ...char.spellcasting,
                slots: Object.fromEntries(
                    Object.entries(char.spellcasting.slots).map(([lvl, data]) => [
                        lvl, { ...data, current: data.max }
                    ])
                )
            }
        }));
        alert('✨ Descanso Longo concluído! PV e Slots de Magia restaurados.');
    };

    const togglePreparedSpell = (spellName: string) => {
        updateCharacter(char => ({
            ...char,
            spells: char.spells.map(s => s.name === spellName ? { ...s, prepared: !s.prepared } : s)
        }));
    };

    // Helper para formatar valores de magia que podem ser objetos complexos (5etools)
    const formatSpellValue = (value: any): string => {
        if (!value) return '-';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();

        // Handle 5etools components object: { v: true, s: true, m: "text" }
        if (value.v !== undefined || value.s !== undefined || value.m !== undefined) {
            const parts = [];
            if (value.v) parts.push('V');
            if (value.s) parts.push('S');
            if (value.m) {
                if (typeof value.m === 'string') parts.push(`M (${value.m})`);
                else parts.push('M');
            }
            return parts.join(', ') || '-';
        }

        // Handle 5etools range object: { type: 'point', distance: { type: 'feet', amount: 60 } }
        if (value.type && value.distance) {
            const dist = value.distance;
            if (dist.amount !== undefined) {
                const unit = dist.type === 'feet' ? 'pés' : dist.type === 'miles' ? 'milhas' : 'm';
                return `${dist.amount} ${unit}`;
            }
            if (dist.type === 'self') return 'Pessoal';
            if (dist.type === 'touch') return 'Toque';
            if (dist.type === 'sight') return 'Visão';
            if (dist.type === 'unlimited') return 'Ilimitado';
        }

        // Handle 5etools duration object: { type: 'timed', duration: { type: 'minute', amount: 1 } }
        if (value.type === 'timed' && value.duration) {
            const dur = value.duration;
            const amount = dur.amount || 1;
            let unit = 'rodadas';
            if (dur.type === 'minute') unit = amount > 1 ? 'minutos' : 'minuto';
            if (dur.type === 'hour') unit = amount > 1 ? 'horas' : 'hora';
            if (dur.type === 'day') unit = amount > 1 ? 'dias' : 'dia';
            return `${amount} ${unit}`;
        }
        if (value.type === 'instant') return 'Instantânea';
        if (value.type === 'permanent') return 'Permanente';

        // Fallback: try to stringify
        return JSON.stringify(value);
    };


    const handleOpenEquipmentModal = (item: OtherEquipmentItem | null) => { setEquipmentToEdit(item); setEquipmentModalOpen(true); };
    const handleSaveEquipment = (item: OtherEquipmentItem) => {
        updateCharacter(char => {
            const newEquipment = [...char.inventory.otherEquipment];
            const index = newEquipment.findIndex(e => e.id === item.id);
            if (index > -1) newEquipment[index] = item;
            else {
                const existing = newEquipment.find(e => e.name.toLowerCase() === item.name.toLowerCase());
                if (existing) existing.quantity += item.quantity; else newEquipment.push(item);
            }
            return { ...char, inventory: { ...char.inventory, otherEquipment: newEquipment } };
        });
        setEquipmentModalOpen(false);
    };
    const handleRemoveEquipment = (itemId: string) => {
        updateCharacter(char => ({
            ...char, inventory: { ...char.inventory, otherEquipment: char.inventory.otherEquipment.filter(e => e.id !== itemId) }
        }));
    };

    const handleAddNewGlobalItem = async (itemName: string) => {
        try {
            await setDoc(doc(collection(db, 'equipamentos')), { name: itemName });
            setAllEquipment(prev => [...prev, { name: itemName }].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) { console.error("Erro ao adicionar item global:", err); }
    };

    const openSelectionModal = (type: 'class' | 'race' | 'weapon') => {
        setModalConfig({ type, title: type === 'class' ? 'Selecione a Classe' : type === 'race' ? 'Selecione a Raça' : 'Selecione uma Arma' });
        setSelectionModalOpen(true);
    };

    const handleSelectItem = async (item: any) => {
        if (!modalConfig) return;
        setSelectionModalOpen(false);

        if (modalConfig.type === 'class') {
            handleFieldChange('class', item);

            // Automação: Carregar Features de Nível 1
            setIsLoading(true);
            try {
                const { fetchClassFeaturesFromFirestore } = await import('@/lib/class-features-sync');
                const { SUBCLASS_CHOICE_LEVELS } = await import('@/lib/class-features');

                const classFeatures = await fetchClassFeaturesFromFirestore(item);
                const level1Features = classFeatures[1]?.features || [];

                updateCharacter(char => {
                    // Remove features de classe antigas se houver (opcional, por enquanto apenas adiciona)
                    // Filtra features que já existem para não duplicar
                    const existingNames = new Set(char.features.map(f => f.name));
                    const newFeatures = level1Features.filter(f => !existingNames.has(f.name)).map(f => ({ ...f, level: 1, type: 'class' as const }));

                    return {
                        ...char,
                        features: [...char.features, ...newFeatures]
                    };
                });



                // Verifica Subclasse
                const subclassLevel = SUBCLASS_CHOICE_LEVELS[item] || 3;
                if ((character.level || 1) >= subclassLevel) {
                    // Pequeno delay para a UI atualizar
                    setTimeout(() => setIsSubclassModalOpen(true), 500);
                }


                // Automação: Proficiências (Salvaguardas e Skills)
                const profData = CLASS_PROFICIENCIES[item];

                if (profData) {
                    // 1. Aplicar Salvaguardas Automaticamente (assumindo que existe um campo ou apenas lógica interna)
                    // Como não identificamos um campo explícito de "savingThrows" no Character, vamos pular a persistência direta 
                    // a menos que encontremos onde isso fica. Mas abriremos o modal de skills.

                    // 2. Abrir Modal de Skills
                    setSelectedClassForProficiency(item);
                    setIsProficiencyModalOpen(true);
                }

                // Automação: Verificar Magias (Abrir Modal se for Conjurador)
                const { getCasterType } = await import('@/lib/level-progression');
                const casterType = getCasterType(item);
                if (casterType !== 'none') {
                    // Abre o modal de Level Up em modo de "Ajuste Inicial" para escolher magias
                    // Delay aumentado para garantir sequencia com modal de skills se necessário
                    setTimeout(() => {
                        setCasterAlertModal(true);
                        // setLevelUpModalOpen(true); // Moved to Modal confirmation
                    }, 1500);
                }

            } catch (err) {
                console.error("Erro na automação de classe:", err);
            } finally {
                setIsLoading(false);
            }

        } else if (modalConfig.type === 'race') {
            handleFieldChange(modalConfig.type, item);
            // Automação de Raça (pode ser feita similarmente depois)
        } else if (modalConfig.type === 'weapon') {
            const base = weapons.find(w => w.name === item);
            if (base) {
                const parsed = parseDamageString(base.damage);
                handleOpenWeaponModal({
                    ...base,
                    id: new Date().toISOString(),
                    quantity: 1,
                    isMagical: false,
                    magicalBonus: 0,
                    magicalEffect: '',
                    ...parsed,
                    isProficient: true
                });
            }
        }
    };

    // --- Magias ---
    const handleSaveSpell = (spell: any) => {
        updateCharacter(char => {
            const filtered = (char.spells || []).filter(s => s.name.trim().toLowerCase() !== spell.name.trim().toLowerCase());
            return { ...char, spells: [...filtered, spell] };
        });
        setSpellModalOpen(false);
        setSpellToEdit(null);
        setSpellSelectOpen(false);
    };


    const handleRemoveSpell = (spellName: string) => {
        updateCharacter(char => ({
            ...char, spells: (char.spells || []).filter(s => s.name.trim().toLowerCase() !== spellName.trim().toLowerCase())
        }));
    };

    // --- Subclasse (REMOVED) ---
    const handleSelectSubclass_REMOVED = (subclassName: string | null) => {
        if (!subclassName) {
            setIsSubclassModalOpen(false);
            return;
        }

        updateCharacter(char => {
            // 1. Define o nome da subclasse
            const updatedChar = { ...char, subclass: subclassName };

            // 2. Busca features da subclasse para o nível atual
            // SUBCLASSES é um objeto { [classe]: { [subclasse]: { [nivel]: { features: [] } } } }
            const classSubclasses = SUBCLASSES[char.class];
            if (classSubclasses && classSubclasses[subclassName]) {
                const subclassProgression = classSubclasses[subclassName];
                const newFeatures: any[] = [];

                // Varre todos os níveis até o atual para pegar features retroativas se necessário
                for (let lvl = 1; lvl <= (char.level || 1); lvl++) {
                    if (subclassProgression[lvl]?.features) {
                        subclassProgression[lvl].features.forEach((feat: any) => {
                            // Evita duplicatas pelo nome
                            if (!char.features.some(f => f.name === feat.name) && !newFeatures.some(f => f.name === feat.name)) {
                                newFeatures.push({
                                    ...feat,
                                    level: lvl,
                                    type: 'class' as const // Marca como feature de classe/subclasse
                                });
                            }
                        });
                    }
                }

                if (newFeatures.length > 0) {
                    updatedChar.features = [...updatedChar.features, ...newFeatures];
                }
            }

            return updatedChar;
        });

        setIsSubclassModalOpen(false);
    };

    if (isLoading || loadingAuth || !character) return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="text-2xl text-white">Carregando...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="p-4 text-center text-2xl text-red-500 bg-slate-800 rounded-lg">{error}</div></div>;

    const filteredWeapons = character.inventory.weapons.filter(w => w.name.toLowerCase().includes(weaponSearchTerm.toLowerCase()));
    const filteredEquipment = character.inventory.otherEquipment.filter(e => e.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase()));

    return (
        <div className="min-h-screen p-4 text-rpg-parchment md:p-8 bg-dnd-gradient font-sans selection:bg-rpg-gold/30 selection:text-rpg-gold">
            <div className="max-w-7xl mx-auto">
                {/* Header e Navigation */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                    <div className="w-full md:w-auto">
                        <Link
                            href={character.campaignId ? `/campanha/${character.campaignId}?tab=characters` : "/personagens"}
                            className="block w-full text-center md:inline-block md:w-auto px-4 py-2 text-sm font-bold rounded-md bg-rpg-panel border border-rpg-gold/20 text-rpg-grey hover:text-rpg-gold hover:border-rpg-gold shadow-lg hover:shadow-glow-gold transition-all"
                        >
                            &larr; {character.campaignId ? "Voltar à Campanha" : "Voltar ao Salão"}
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
                        {isReadOnly && (
                            <div className="px-4 py-2 bg-rpg-gold/20 border border-rpg-gold text-rpg-gold rounded font-bold font-cinzel flex items-center gap-2 animate-pulse text-xs md:text-sm">
                                <span>👁️</span> <span className="hidden sm:inline">Modo Espectador (Mestre)</span><span className="sm:hidden">Espectador</span>
                            </div>
                        )}
                        
                        {!isReadOnly && id !== 'novo' && (
                            <button
                                onClick={handleLongRest}
                                className="flex-grow md:flex-grow-0 bg-indigo-900/20 border border-indigo-500/30 text-indigo-400 px-3 py-2 rounded hover:bg-indigo-900/40 transition-all text-xs font-bold flex items-center justify-center gap-2"
                                title="Restaurar PV e Slots de Magia"
                            >
                                <span>⛺</span> Descanso Longo
                            </button>
                        )}
                        
                        {id === 'novo' && (
                            <button 
                                onClick={() => { /* Logic is handled by auto-save or context, but usually this button is ceremonial or triggers a specific save if manual */ }} 
                                className="w-full md:w-auto px-6 py-2 font-bold rounded-md bg-gradient-to-r from-rpg-gold to-yellow-600 text-rpg-dark hover:from-yellow-400 hover:to-rpg-gold shadow-lg transform hover:scale-105 transition-all"
                            >
                                Salvar Novo Personagem
                            </button>
                        )}
                    </div>
                </div>

                <header className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6 p-4 md:p-6 bg-rpg-panel/50 rounded-xl border border-rpg-gold/10 shadow-2xl backdrop-blur-md overflow-hidden">
                    <div className="flex-grow w-full">
                        <input
                            type="text"
                            disabled={isReadOnly}
                            value={character.name}
                            onChange={e => handleFieldChange('name', e.target.value)}
                            className="w-full text-2xl sm:text-3xl md:text-5xl font-extrabold bg-transparent border-b-2 border-rpg-gold/30 font-cinzel text-rpg-gold focus:outline-none focus:border-rpg-gold transition-all placeholder-rpg-grey/30 truncate"
                            placeholder="Nome do Personagem"
                        />
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <p className="text-rpg-grey uppercase font-bold tracking-[0.2em] text-[10px] break-all">
                                {character.race} • {character.class}{character.subclass ? ` (${character.subclass})` : ''}
                            </p>
                            {!character.subclass && character.level >= (SUBCLASS_CHOICE_LEVELS[character.class] || 3) && (
                                <button
                                    onClick={() => setIsSubclassModalOpen(true)}
                                    className="text-[9px] bg-purple-900/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full hover:bg-purple-500 hover:text-white transition-all animate-pulse flex items-center gap-1 shadow-glow-purple/20 whitespace-nowrap"
                                >
                                    <span className="text-xs">✨</span> Subclasse
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
                        <div className="w-full sm:w-40"><label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel">Classe</label><button disabled={isReadOnly} onClick={() => openSelectionModal('class')} className={`w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-left hover:border-rpg-gold/50 font-medieval text-sm ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>{character.class || 'Selecione...'}</button></div>
                        <div className="w-20 text-center group">
                            <label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel transition-colors group-hover:text-yellow-400">Nível</label>
                            <div className="relative flex items-center justify-between bg-rpg-slate border-2 border-rpg-gold/30 rounded-lg p-1 shadow-lg shadow-black/40 group-hover:border-rpg-gold transition-all h-[38px]">
                                <button
                                    onClick={() => handleFieldChange('level', Math.max(1, (character.level || 1) - 1))}
                                    disabled={isReadOnly}
                                    className={`w-6 h-full flex items-center justify-center bg-rpg-dark/50 hover:bg-rpg-red/20 text-rpg-grey hover:text-rpg-red rounded transition-all font-bold z-10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >-</button>

                                <span className="text-2xl font-black text-rpg-gold font-medieval drop-shadow-glow-gold px-1">{character.level || 1}</span>

                                <button
                                    onClick={() => handleFieldChange('level', Math.min(20, (character.level || 1) + 1))}
                                    disabled={isReadOnly}
                                    className={`w-6 h-full flex items-center justify-center bg-rpg-dark/50 hover:bg-green-900/20 text-rpg-grey hover:text-green-500 rounded transition-all font-bold z-10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >+</button>
                            </div>
                        </div>
                        <div className="w-full md:w-64">
                            <label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel">Experiência</label>
                            <div className="bg-rpg-slate border border-rpg-gold/20 rounded-md p-2">
                                {/* XP Info */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-rpg-grey font-cinzel truncate">
                                        {(() => {
                                           try {
                                                const { getXPForNextLevel } = require('@/lib/xp-progression');
                                                const nextXP = getXPForNextLevel(character.level);
                                                return character.level >= 20 ? 'Max' : `${character.experience} / ${nextXP} XP`;
                                           } catch (e) { return `${character.experience} XP`; }
                                        })()}
                                    </span>
                                    {!isReadOnly && (
                                        <button
                                            onClick={() => {
                                                const amount = prompt('Quanto XP adicionar?', '100');
                                                if (amount && !isNaN(Number(amount))) {
                                                    handleFieldChange('experience', (character.experience || 0) + Number(amount));
                                                }
                                            }}
                                            className="text-[9px] bg-rpg-gold/20 hover:bg-rpg-gold/30 text-rpg-gold px-2 py-0.5 rounded font-bold transition-all whitespace-nowrap"
                                        >
                                            + XP
                                        </button>
                                    )}
                                </div>
                                {/* Progress Bar */}
                                {character.level < 20 && (
                                    <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rpg-gold/60 to-rpg-gold transition-all duration-500"
                                            style={{
                                                width: `${(() => {
                                                    try {
                                                        const { getXPProgress } = require('@/lib/xp-progression');
                                                        return getXPProgress(character.level, character.experience);
                                                    } catch (e) { return 0; }
                                                })()}%`
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full sm:w-40"><label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-left">Raça</label><button disabled={isReadOnly} onClick={() => openSelectionModal('race')} className={`w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-left hover:border-rpg-gold/50 font-medieval text-sm ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>{character.race || 'Selecione...'}</button></div>
                    </div>
                </header>

                {/* Dashboards Ficha 2.0 */}
                <div className="px-6 space-y-4">
                    <ConditionManager
                        character={character}
                        onToggleCondition={toggleCondition}
                        onToggleEffect={toggleActiveEffect}
                    />
                    <QuickActions character={character} />
                </div>

                {/* Tabs Navigation */}
                <div className="mb-6 border-b border-rpg-gold/20">
                    <div className="flex flex-wrap gap-1">
                        {(['Principal', 'Equipamento', 'Habilidades', 'Magias', 'Personalidade'] as const).map(tab => (
                            <TabButton key={tab} activeTab={activeTab} tabName={tab} onClick={setActiveTab} />
                        ))}
                    </div>
                </div>

                <main>
                    {/* ABA PRINCIPAL */}
                    {activeTab === 'Principal' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex gap-2 overflow-x-auto pb-4">
                                {ATTRIBUTE_KEYS.map((key) => (
                                    <AttributeInput key={key} label={ATTRIBUTE_DISPLAY_NAMES[key].slice(0, 3)} value={character.attributes[key]} onChange={(val) => handleNestedChange(`attributes.${key}`, val)} disabled={isReadOnly} />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-all">
                                    <h4 className="text-xs font-bold text-rpg-gold uppercase mb-2 tracking-widest font-cinzel">Pontos de Vida</h4>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <input type="number" disabled={isReadOnly} value={character.currentHp === 0 ? '0' : (character.currentHp || '')} onChange={(e) => handleFieldChange('currentHp', e.target.value === '' ? '' : parseInt(e.target.value))} className={`w-16 text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-rpg-parchment font-medieval ${isReadOnly ? 'opacity-70' : ''}`} />
                                        <span className="text-xl text-rpg-grey/50">/</span>
                                        <input type="number" disabled={isReadOnly} value={character.maxHp === 0 ? '0' : (character.maxHp || '')} onChange={(e) => handleFieldChange('maxHp', e.target.value === '' ? '' : parseInt(e.target.value))} className={`w-16 text-xl font-bold text-center bg-transparent text-rpg-grey font-medieval ${isReadOnly ? 'opacity-70' : ''}`} />
                                    </div>
                                    <div className="flex justify-center gap-2">
                                        <button disabled={isReadOnly} onClick={() => updateCharacter(c => ({ ...c, currentHp: Math.max(0, c.currentHp - 1) }))} className={`px-2 py-1 bg-rpg-red/20 text-red-200 border border-rpg-red/30 rounded text-xs font-bold hover:bg-rpg-red/40 transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>-1</button>
                                        <button disabled={isReadOnly} onClick={() => updateCharacter(c => ({ ...c, currentHp: Math.min(c.maxHp, c.currentHp + 1) }))} className={`px-2 py-1 bg-green-900/30 text-green-200 border border-green-700/30 rounded text-xs font-bold hover:bg-green-700/40 transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>+1</button>
                                    </div>
                                </div>
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-all">
                                    <h4 className="text-xs font-bold text-rpg-gold uppercase mb-2 tracking-widest font-cinzel">PV Temporários</h4>
                                    <input type="number" disabled={isReadOnly} value={character.temporaryHp === 0 ? '0' : (character.temporaryHp || '')} onChange={(e) => handleFieldChange('temporaryHp', e.target.value === '' ? '' : parseInt(e.target.value))} className={`w-full text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-blue-200 font-medieval ${isReadOnly ? 'opacity-70' : ''}`} />
                                </div>
                                <StatBlock label="Classe de Armadura" value={character.armorClass} />
                                <StatBlock label="Iniciativa" value={character.initiative >= 0 ? `+${character.initiative}` : character.initiative} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-colors">
                                        <h4 className="text-sm font-semibold text-rpg-gold text-center font-medieval tracking-wide">Deslocamento</h4>
                                        <div className="flex items-center justify-center gap-1">
                                            <input type="number" disabled={isReadOnly} value={character.speed === 0 ? '0' : (character.speed || '')} onChange={(e) => handleFieldChange('speed', e.target.value === '' ? '' : parseInt(e.target.value))} className={`w-16 text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-rpg-parchment font-medieval ${isReadOnly ? 'opacity-70' : ''}`} />
                                            <span className="text-rpg-grey font-medieval">m</span>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg text-center flex flex-col justify-center shadow-lg backdrop-blur-sm">
                                        <span className="text-sm text-rpg-gold font-bold uppercase mb-2 tracking-widest">Bônus de Proficiência</span>
                                        <span className="text-5xl font-bold text-rpg-parchment font-medieval">+{character.proficiencyBonus}</span>
                                    </div>
                                </div>

                                <div className="p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md">
                                    <h4 className="font-bold text-rpg-gold mb-3 font-cinzel tracking-wide text-lg border-b border-rpg-gold/10 pb-2 text-center sm:text-left">Resistências à Morte</h4>
                                    <div className="flex justify-between items-center mb-2"><span className="text-sm text-rpg-grey font-bold uppercase tracking-widest">Sucessos</span> <div className="flex gap-2">{[1, 2, 3].map(i => <input key={i} type="checkbox" disabled={isReadOnly} checked={character.deathSaves?.successes >= i} onChange={(e) => handleNestedChange('deathSaves.successes', e.target.checked ? i : i - 1)} className={`w-5 h-5 rounded-full accent-green-600 ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} />)}</div></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-rpg-grey font-bold uppercase tracking-widest">Falhas</span> <div className="flex gap-2">{[1, 2, 3].map(i => <input key={i} type="checkbox" disabled={isReadOnly} checked={character.deathSaves?.failures >= i} onChange={(e) => handleNestedChange('deathSaves.failures', e.target.checked ? i : i - 1)} className={`w-5 h-5 rounded-full accent-rpg-red ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} />)}</div></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA EQUIPAMENTO */}
                    {activeTab === 'Equipamento' && (() => {
                        const totalWeight = (character.inventory.weapons.reduce((acc, w) => acc + (w.weight || 0) * (w.quantity || 1), 0) +
                            character.inventory.otherEquipment.reduce((acc, e) => acc + (e.weight || 0) * (e.quantity || 1), 0)).toFixed(1);
                        const weightLimit = (character.attributes.strength * 7.5).toFixed(1);
                        const weightPercentage = Math.min(100, (parseFloat(totalWeight) / parseFloat(weightLimit)) * 100);

                        return (
                            <div className="space-y-8 animate-fade-in">
                                {/* Barra de Carga */}
                                <div className="bg-rpg-panel border border-rpg-gold/20 rounded-xl p-5 shadow-inner">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <h3 className="text-sm font-bold text-rpg-gold uppercase tracking-widest font-cinzel">Capacidade de Carga</h3>
                                            <p className="text-xs text-rpg-grey">Baseado em sua Força ({character.attributes.strength})</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xl font-bold font-medieval ${parseFloat(totalWeight) > parseFloat(weightLimit) ? 'text-rpg-red shadow-glow-red' : 'text-rpg-parchment'}`}>{totalWeight} kg</span>
                                            <span className="text-rpg-grey/60 text-sm font-medieval ml-1">/ {weightLimit} kg</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-black/40 rounded-full border border-rpg-gold/10 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 rounded-full ${parseFloat(totalWeight) > parseFloat(weightLimit) ? 'bg-gradient-to-r from-red-600 to-rpg-red shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-rpg-gold/40 to-rpg-gold'}`}
                                            style={{ width: `${weightPercentage}%` }}
                                        />
                                    </div>
                                    {parseFloat(totalWeight) > parseFloat(weightLimit) && (
                                        <p className="text-[10px] text-rpg-red font-bold uppercase mt-2 text-center animate-pulse">⚠️ Sobrecarga! Sua velocidade é reduzida.</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-rpg-gold mb-3 font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Moedas</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md">
                                        {(Object.keys(character.inventory.currency) as Array<keyof typeof character.inventory.currency>).map(key => (
                                            <div key={key}>
                                                <label className="block text-[10px] font-bold text-rpg-gold uppercase text-center mb-1 font-cinzel">{key}</label>
                                                <input type="number" disabled={isReadOnly} value={character.inventory.currency[key]} onChange={e => handleNestedChange(`inventory.currency.${key}`, parseInt(e.target.value) || 0)} className={`w-full p-2 text-xl font-bold text-center bg-rpg-slate rounded-md border border-rpg-gold/10 font-medieval focus:border-rpg-gold/50 outline-none ${isReadOnly ? 'opacity-70' : ''}`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xl font-bold text-rpg-gold font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Armas</h3>
                                        {!isReadOnly && (
                                            <div className="flex gap-2">
                                                <button onClick={() => openSelectionModal('weapon')} className="px-3 py-1 text-xs font-bold bg-rpg-slate border border-rpg-gold/20 rounded hover:bg-rpg-dark transition-all uppercase tracking-tighter">Biblioteca</button>
                                                <button onClick={() => handleOpenWeaponModal(null)} className="px-3 py-1 text-xs font-bold bg-rpg-gold text-rpg-dark rounded hover:brightness-110 transition-all uppercase tracking-tighter shadow-glow-gold/20">+ Nova Arma</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-4 space-y-3 shadow-inner">
                                        {filteredWeapons.length > 0 ? filteredWeapons.map((weapon) => {
                                            const isStrengthBased = !(weapon.properties?.includes('Acuidade') && character.attributeModifiers.dexterity > character.attributeModifiers.strength) && !weapon.properties?.includes('Munição');
                                            const abilityMod = isStrengthBased ? character.attributeModifiers.strength : character.attributeModifiers.dexterity;
                                            const rageBonusToDmg = (isStrengthBased && character.activeEffects?.includes('rage')) ? (character.rageBonus || 0) : 0;

                                            const atkBonus = (weapon.isProficient !== false ? character.proficiencyBonus : 0) + abilityMod + (weapon.magicalBonus || 0);
                                            const dmgBonus = abilityMod + (weapon.magicalBonus || 0) + rageBonusToDmg;

                                            return (
                                                <div key={weapon.id} className={`p-4 bg-rpg-slate/80 border ${weapon.isMagical ? 'border-purple-500/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' : 'border-rpg-gold/10'} rounded-lg flex flex-col md:flex-row justify-between gap-4 hover:border-rpg-gold/30 transition-all group shadow-md relative overflow-hidden`}>
                                                    {weapon.isMagical && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent -rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />}
                                                    <div className="flex-grow">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h4 className={`font-bold text-lg font-medieval ${weapon.isMagical ? 'text-purple-200' : 'text-rpg-parchment'}`}>{weapon.name}</h4>
                                                            {weapon.isMagical && <span className="bg-purple-600 text-[8px] text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest shadow-lg">Mágico ✨</span>}
                                                            <span className="bg-rpg-gold text-rpg-dark px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-black/30 shadow-sm">ATK: {atkBonus >= 0 ? `+${atkBonus}` : atkBonus}</span>
                                                            <span className="bg-rpg-red text-white px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-black/30 shadow-sm">
                                                                DANO: {weapon.damage}{dmgBonus !== 0 ? ` + ${dmgBonus}` : ''}
                                                                {rageBonusToDmg > 0 && <span className="ml-1 text-[8px] text-yellow-300 animate-pulse"> (+{rageBonusToDmg} FÚRIA)</span>}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-rpg-grey uppercase tracking-wider bg-black/20 px-2 py-1 rounded inline-block">{weapon.damageType} | {weapon.properties?.join(', ')}</p>
                                                        {weapon.magicalEffect && <p className="text-[10px] text-purple-300 italic mt-1 font-sans">{weapon.magicalEffect}</p>}
                                                    </div>
                                                    {!isReadOnly && (
                                                        <div className="flex gap-2 items-center self-end md:self-center">
                                                            <button onClick={() => handleOpenWeaponModal(weapon)} className="px-3 py-1 text-xs font-medium bg-rpg-slate/50 border border-rpg-grey/30 hover:border-rpg-gold text-rpg-grey hover:text-rpg-parchment rounded-md transition-colors uppercase">Editar</button>
                                                            <button onClick={() => handleRemoveWeapon(weapon.id)} className="px-3 py-1 text-xs font-medium bg-rpg-red/20 border border-rpg-red/30 hover:bg-rpg-red/40 text-red-200 rounded-md transition-colors">×</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }) : (
                                            <p className="text-center text-rpg-grey py-8 italic">O cinto de utilidades está vazio.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xl font-bold text-rpg-gold font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Mochila & Itens</h3>
                                        {!isReadOnly && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenEquipmentModal(null)} className="px-3 py-1 text-xs font-bold bg-rpg-gold text-rpg-dark rounded hover:brightness-110 transition-all uppercase tracking-tighter shadow-glow-gold/20">+ Novo Item</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
                                            <div key={item.id} className={`p-3 bg-rpg-panel border ${item.isMagical ? 'border-purple-500/40 shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]' : 'border-rpg-gold/10'} rounded-lg flex justify-between items-center hover:border-rpg-gold/40 transition-all group shadow-sm relative overflow-hidden`}>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`${item.isMagical ? 'text-purple-300' : 'text-rpg-gold'} font-bold font-medieval`}>{item.quantity}x</span>
                                                        <span className={`font-bold font-medieval ${item.isMagical ? 'text-purple-100 italic' : 'text-rpg-parchment'}`}>{item.name}</span>
                                                        {item.isEquipped && <span className="text-[8px] bg-green-900/50 text-green-300 px-1 py-0.5 rounded border border-green-700/30 uppercase font-black">Equipado</span>}
                                                        {item.isMagical && <span className="text-[7px] bg-purple-600/80 text-white px-1 py-0.5 rounded uppercase font-black tracking-tighter shadow-sm animate-pulse-slow">Mágico ✨</span>}
                                                    </div>
                                                    {item.weight && <span className="text-[10px] text-rpg-grey/60">{item.weight} kg</span>}
                                                    {item.magicalEffect && <p className="text-[9px] text-purple-300/80 italic mt-0.5 font-sans leading-tight line-clamp-1">{item.magicalEffect}</p>}
                                                </div>
                                                {!isReadOnly && (
                                                    <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleOpenEquipmentModal(item)} className="p-1 text-rpg-grey hover:text-rpg-gold transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleRemoveEquipment(item.id)} className="p-1 text-rpg-red/50 hover:text-rpg-red transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <p className="col-span-full text-center text-rpg-grey py-8 italic bg-rpg-slate/20 rounded-lg border border-dashed border-rpg-gold/10">A mochila parece leve... nenhum item registrado.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Seção de Tesouros */}
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-rpg-gold mb-3 font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Tesouros & Objetos de Valor</h3>
                                    <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-5 shadow-inner">
                                        <textarea
                                            value={character.treasures || ''}
                                            onChange={(e) => handleFieldChange('treasures', e.target.value)}
                                            placeholder="Joias, pedras preciosas, obras de arte e outros itens valiosos que não ocupam espaço regular na mochila..."
                                            disabled={isReadOnly}
                                            className={`w-full h-32 bg-transparent text-rpg-parchment font-handschrift text-lg focus:outline-none resize-none placeholder:text-rpg-grey/30 border-none ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        />
                                        <div className="mt-2 text-[10px] text-rpg-grey italic border-t border-rpg-gold/10 pt-2">
                                            Ex: Colar de pérolas (250 po), Estatueta de obsidiana, Pergaminho antigo.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ABA HABILIDADES (REDESENHADA) */}
                    {activeTab === 'Habilidades' && (
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
                                                            <h4 className="text-sm font-bold uppercase tracking-widest text-purple-400 font-cinzel">{group}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {groupFeats.map((feat, idx) => (
                                                                <div key={idx} className="bg-rpg-slate/40 p-4 rounded-lg border-l-4 border-purple-500/50 hover:bg-rpg-slate/60 transition-all shadow-md group/feat relative overflow-hidden">
                                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                                                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                                                                                <span className="text-lg">⭐</span>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="font-bold text-purple-200 font-medieval text-xl group-hover/feat:text-purple-100 transition-colors">{feat.name}</h4>
                                                                                <span className="text-[10px] text-purple-400/80 uppercase font-black tracking-widest">Talento Lendário</span>
                                                                            </div>
                                                                        </div>
                                                                        {!isReadOnly && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setConfirmRemoveFeatureModal({ open: true, featureName: feat.name });
                                                                                    (window as any).__featureToRemove = feat.name;
                                                                                }}
                                                                                className="text-white/20 hover:text-red-400 transition-colors p-1"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                </svg>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-rpg-grey leading-relaxed relative z-10 bg-black/20 p-3 rounded border border-white/5">{feat.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                        })()}
                                        {!isReadOnly && (
                                            <div className="flex gap-4 mt-6">
                                                <button
                                                    onClick={() => setIsFeatModalOpen(true)}
                                                    className="w-full py-6 bg-purple-600/10 border-2 border-purple-500/30 rounded-lg text-purple-200 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-2 group shadow-lg"
                                                >
                                                    <span className="text-2xl transition-transform group-hover:scale-125">✨</span>
                                                    Escolher Talento da Biblioteca
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const name = prompt("Nome do Talento Customizado:");
                                                        const desc = prompt("Descrição:");
                                                        const level = parseInt(prompt("Nível em que foi adquirido (ou deixe vazio):") || "0");
                                                        if (name && desc) {
                                                            updateCharacter(prev => ({
                                                                ...prev,
                                                                features: [...(prev.features || []), {
                                                                    name,
                                                                    description: desc,
                                                                    type: 'feat',
                                                                    level: level > 0 ? level : undefined
                                                                }]
                                                            }));
                                                        }
                                                    }}
                                                    className="w-1/4 py-6 bg-rpg-panel border border-dashed border-rpg-gold/20 rounded-lg text-rpg-grey hover:text-rpg-gold hover:border-rpg-gold/40 transition-all font-bold uppercase tracking-widest text-[10px] flex flex-col items-center gap-2 group"
                                                >
                                                    <span className="text-xl transition-transform group-hover:rotate-12">📝</span>
                                                    Criar Manual
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ABA MAGIAS */}
                    {activeTab === 'Magias' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatBlock label="Atributo de Conjuração" value={character.spellcasting?.ability ? ATTRIBUTE_DISPLAY_NAMES[character.spellcasting.ability].slice(0, 3).toUpperCase() : '-'} />
                                <StatBlock label="CD de Resistência" value={character.spellcasting?.saveDc || 0} />
                                <StatBlock label="Bônus de Ataque" value={`+${character.spellcasting?.attackBonus || 0}`} />
                            </div>
                            <div className="flex justify-end mb-2">
                                {!isReadOnly && (
                                    <button onClick={() => setSpellSelectOpen(true)} className="px-4 py-2 rounded bg-rpg-gold text-rpg-dark font-bold hover:bg-yellow-400 transition-all shadow-glow-gold/10 uppercase text-xs tracking-wider">+ Selecionar Magia</button>
                                )}
                            </div>

                            {/* Seção de Truques (Nível 0) */}
                            {(() => {
                                const cantrips = (character.spells || []).filter(s => s && (s.level === 0 || s.level === undefined)); // Assume 0/undefined as cantrip if not specified
                                if (cantrips.length > 0) {
                                    return (
                                        <div className="mb-8">
                                            <h3 className="text-sm font-bold text-rpg-gold font-cinzel uppercase tracking-widest mb-3 border-b border-rpg-gold/20 pb-1 flex items-center gap-2">
                                                <span className="text-lg">✨</span> Truques & Talentos Mágicos
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {cantrips.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((spell, idx) => (
                                                    <div key={spell.id || idx} className="bg-rpg-panel border border-rpg-gold/10 hover:border-rpg-gold/30 rounded-lg p-3 transition-all relative group">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-rpg-parchment font-medieval text-lg group-hover:text-rpg-gold transition-colors">{spell.name}</span>
                                                            <div className="flex gap-1">
                                                                {spell.concentration && <span className="text-[8px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Concentração">C</span>}
                                                                {spell.ritual && <span className="text-[8px] bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Ritual">R</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] text-rpg-grey/70 uppercase font-sans tracking-tight border-b border-rpg-gold/5 pb-1">
                                                            <span>{formatSpellValue(spell.castingTime)}</span>
                                                            <span>{formatSpellValue(spell.range)}</span>
                                                            <span>{formatSpellValue(spell.duration)}</span>
                                                            <span className="text-purple-400/60 italic">{spell.school}</span>
                                                        </div>
                                                        <p className="text-xs text-rpg-grey/90 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">{spell.description}</p>
                                                        {!isReadOnly && (
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-rpg-panel shadow-sm rounded-full">
                                                                <button onClick={() => handleRemoveSpell(spell.name)} className="p-1 text-rpg-red/60 hover:text-rpg-red transition-colors" title="Esquecer Magia">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Magias Niveladas e Slots */}
                            <div className="space-y-6">
                                {(() => {
                                    // Agrupar magias por nível (apenas nível 1+)
                                    const validSpells = (character.spells || []).filter(s => s && typeof s === 'object' && s.level && s.level > 0);

                                    // Obter lista de níveis que possuem slots OU magias aprendidas
                                    const levelsWithSlots = Object.keys(character.spellcasting?.slots || {}).map(Number);
                                    const levelsWithSpells = validSpells.map(s => s.level);
                                    const allLevels = Array.from(new Set([...levelsWithSlots, ...levelsWithSpells])).sort((a, b) => a - b);

                                    if (allLevels.length === 0 && (!character.spells || character.spells.length === 0)) {
                                        return (
                                            <div className="bg-rpg-panel border border-rpg-gold/10 p-10 rounded-lg shadow-md flex flex-col items-center justify-center text-rpg-grey/40">
                                                <p className="text-6xl mb-4">📜</p>
                                                <p className="italic font-medieval text-xl">Sua mente está limpa de encantamentos.</p>
                                            </div>
                                        );
                                    }

                                    return allLevels.map(level => {
                                        const spells = validSpells.filter(s => s.level === level);
                                        const isExpanded = expandedSpellLevels[level] !== false; // Default expanded
                                        const levelLabel = `${level}º Nível`;
                                        const slotInfo = character.spellcasting?.slots?.[level.toString()]; // Suporte a Pact Magic depois

                                        // Renderização dos Slots no Cabeçalho
                                        const SlotCounter = () => {
                                            if (!slotInfo) return null;
                                            return (
                                                <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded ml-4 border border-white/5" onClick={e => e.stopPropagation()}>
                                                    <span className="text-[10px] text-rpg-grey uppercase font-bold mr-2 tracking-wider">Slots:</span>
                                                    {Array.from({ length: slotInfo.max }).map((_, i) => {
                                                        const isAvailable = i < slotInfo.current;
                                                        return (
                                                            <button
                                                                key={i}
                                                                disabled={isReadOnly}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newCurrent = isAvailable ? slotInfo.current - 1 : slotInfo.current + 1;
                                                                    handleNestedChange(`spellcasting.slots.${level}.current`, Math.max(0, Math.min(newCurrent, slotInfo.max)));
                                                                }}
                                                                className={`w-4 h-4 rounded-full border transition-all ${isAvailable ? 'bg-purple-600 border-purple-400 shadow-[0_0_5px_rgba(147,51,234,0.5)] hover:bg-purple-500' : 'bg-gray-800 border-gray-700 opacity-50 hover:opacity-80'}`}
                                                                title={isAvailable ? "Gastar Slot" : "Recuperar Slot"}
                                                            ></button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div key={level} className="bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md overflow-hidden transition-all">
                                                <div
                                                    className="w-full flex justify-between items-center p-3 bg-rpg-slate/40 border-b border-rpg-gold/5 cursor-pointer hover:bg-rpg-slate/60 transition-colors"
                                                    onClick={() => setExpandedSpellLevels(prev => ({ ...prev, [level]: !prev[level] }))}
                                                >
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <span className="w-6 h-6 flex items-center justify-center bg-purple-900/40 text-purple-300 rounded-full text-xs font-bold border border-purple-500/20">{level}</span>
                                                        <h3 className="text-base font-bold text-rpg-gold font-cinzel uppercase tracking-widest mr-2">{levelLabel}</h3>
                                                        <SlotCounter />
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-rpg-grey uppercase tracking-widest">{spells.length} Magias</span>
                                                        <span className={`text-rpg-gold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in bg-rpg-dark/20">
                                                        {spells.length === 0 ? (
                                                            <div className="col-span-full text-center py-4 text-rpg-grey/50 italic text-xs">Nenhuma magia aprendida deste nível.</div>
                                                        ) : (
                                                            spells.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((spell, idx) => (
                                                                <div key={spell.id || idx} className="bg-rpg-slate/40 p-3 rounded-lg border border-rpg-gold/5 hover:border-purple-500/30 transition-all group relative">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                disabled={isReadOnly}
                                                                                onClick={() => togglePreparedSpell(spell.name)}
                                                                                className={`w-3 h-3 rounded-full border transition-all ${spell.prepared ? 'bg-green-500 border-green-400 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'border-white/20 hover:border-green-500/50'}`}
                                                                                title={spell.prepared ? "Despreparar" : "Preparar"}
                                                                            ></button>
                                                                            <span className="font-bold text-rpg-parchment font-medieval text-lg group-hover:text-rpg-gold transition-colors">{spell.name}</span>
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                            {spell.concentration && <span className="text-[8px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Concentração">C</span>}
                                                                            {spell.ritual && <span className="text-[8px] bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Ritual">R</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] text-rpg-grey/70 uppercase font-sans tracking-tight border-b border-rpg-gold/5 pb-1">
                                                                        <span>{formatSpellValue(spell.castingTime)}</span>
                                                                        <span>{formatSpellValue(spell.range)}</span>
                                                                        <span>{formatSpellValue(spell.duration)}</span>
                                                                        <span className="text-purple-400/60 italic">{spell.school}</span>
                                                                    </div>
                                                                    <p className="text-xs text-rpg-grey/90 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{spell.description}</p>
                                                                    {!isReadOnly && (
                                                                        <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={() => handleRemoveSpell(spell.name)} className="p-1 text-rpg-red/60 hover:text-rpg-red transition-colors" title="Esquecer Magia">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ABA PERSONALIDADE */}
                    {activeTab === 'Personalidade' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Traços de Personalidade</label>
                                    <textarea disabled={isReadOnly} value={character.personalityTraits} onChange={e => handleFieldChange('personalityTraits', e.target.value)} className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} placeholder="Peculiaridades e maneirismos..." />
                                </div>
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Ideais</label>
                                    <textarea disabled={isReadOnly} value={character.ideals} onChange={e => handleFieldChange('ideals', e.target.value)} className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} placeholder="No que você acredita?" />
                                </div>
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Vínculos</label>
                                    <textarea disabled={isReadOnly} value={character.bonds} onChange={e => handleFieldChange('bonds', e.target.value)} className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} placeholder="O que te move?" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Defeitos</label>
                                    <textarea disabled={isReadOnly} value={character.flaws} onChange={e => handleFieldChange('flaws', e.target.value)} className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} placeholder="Suas fraquezas..." />
                                </div>
                                <div className="group flex-grow">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Anotações & História</label>
                                    <textarea disabled={isReadOnly} value={character.notes} onChange={e => handleFieldChange('notes', e.target.value)} className={`w-full h-[400px] bg-rpg-panel/40 border border-rpg-gold/10 rounded-lg p-5 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner custom-scrollbar ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`} placeholder="Escreva a lenda do seu herói aqui..." />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Modais */}
                {
                    isFeatModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                            <div className="bg-rpg-panel border-2 border-purple-500/30 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-[0_0_50px_-10px_rgba(168,85,247,0.4)]">
                                <div className="p-6 border-b border-purple-500/20 bg-purple-900/10 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold font-cinzel text-purple-200 uppercase tracking-widest">Biblioteca de Talentos</h3>
                                        <p className="text-[10px] text-purple-400 uppercase font-black">Escolha uma nova perícia heróica</p>
                                    </div>
                                    <button onClick={() => setIsFeatModalOpen(false)} className="text-purple-400 hover:text-white transition-colors text-2xl">×</button>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar bg-rpg-dark/50">
                                    {availableFeats.length === 0 ? (
                                        <div className="text-center py-10 text-rpg-grey italic">Nenhum talento sincronizado. Vá até a Biblioteca para sincronizar.</div>
                                    ) : (
                                        availableFeats.map((feat, idx) => {
                                            const isSelected = character.features?.some(f => f.name === feat.name);
                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={isSelected}
                                                    onClick={() => {
                                                        const level = parseInt(prompt(`Em qual nível você adquiriu "${feat.name}"?`) || "0");
                                                        updateCharacter(prev => ({
                                                            ...prev,
                                                            features: [...(prev.features || []), {
                                                                ...feat,
                                                                type: 'feat',
                                                                level: level > 0 ? level : undefined
                                                            }]
                                                        }));
                                                        setIsFeatModalOpen(false);
                                                    }}
                                                    className={`w-full text-left p-4 rounded-lg border transition-all flex justify-between items-center group/feat-row ${isSelected
                                                        ? 'bg-purple-900/10 border-purple-500/10 opacity-50 cursor-not-allowed'
                                                        : 'bg-rpg-panel border-rpg-gold/5 hover:border-purple-500/40 hover:bg-purple-900/5'}`}
                                                >
                                                    <div className="flex-grow">
                                                        <h4 className="font-bold text-rpg-parchment group-hover/feat-row:text-purple-200 transition-colors uppercase text-sm tracking-wider">{feat.name}</h4>
                                                        <p className="text-xs text-rpg-grey mt-1 line-clamp-2">{feat.description}</p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-200' : 'border-rpg-gold/20 text-rpg-gold'}`}>
                                                        {isSelected ? '✓' : '+'}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="p-4 bg-black/40 border-t border-purple-500/10 text-center">
                                    <p className="text-[10px] text-rpg-grey italic">Talentos são escolhas poderosas que definem seu herói.</p>
                                </div>
                            </div>
                        </div>
                    )
                }
                <SelectionModal isOpen={isSelectionModalOpen} onClose={() => setSelectionModalOpen(false)} title={modalConfig?.title || ''} items={modalConfig?.type === 'class' ? classes : (modalConfig?.type === 'race' ? races : weapons.map(w => w.name))} onSelectItem={handleSelectItem} isLoading={isDbDataLoading} />
                <WeaponModal isOpen={isWeaponModalOpen} onClose={() => setWeaponModalOpen(false)} onSave={handleSaveWeapon} weaponToEdit={weaponToEdit} />
                <EquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setEquipmentModalOpen(false)} onSave={handleSaveEquipment} allEquipment={allEquipment} onAddNewGlobalItem={handleAddNewGlobalItem} itemToEdit={equipmentToEdit} />
                <SpellSelectModal isOpen={isSpellSelectOpen} onClose={() => setSpellSelectOpen(false)} onSelect={handleSaveSpell} onCreate={() => { setSpellSelectOpen(false); setSpellToEdit(null); setSpellModalOpen(true); }} />
                <SpellModal isOpen={isSpellModalOpen} onClose={() => { setSpellModalOpen(false); setSpellToEdit(null); }} onSave={handleSaveSpell} spellToEdit={spellToEdit} />
                 <SubclassModal
                    isOpen={isSubclassModalOpen}
                    onClose={() => setIsSubclassModalOpen(false)}
                    character={character}
                    onSelect={handleSelectSubclass}
                />
                <LevelUpModal
                    isOpen={isLevelUpModalOpen}
                    onClose={() => setLevelUpModalOpen(false)}
                    onApply={handleApplyLevelUp}
                    level={character.level}
                    charClassName={character.class}
                    progression={classProgression?.[character.level]}
                    currentSpells={character.spells}
                    currentAttributes={character.attributes}
                />

                {/* CASTER ALERT MODAL */}
                <Modal
                    isOpen={casterAlertModal}
                    onClose={() => {
                        setCasterAlertModal(false);
                        setLevelUpModalOpen(true);
                    }}
                    title="✨ Caminho da Magia"
                >
                    <div className="text-center p-4">
                        <div className="text-5xl mb-4">🔮</div>
                        <h3 className="text-xl font-cinzel text-rpg-gold mb-2">Poder Arcano Detectado</h3>
                        <p className="text-rpg-parchment mb-6 leading-relaxed">
                            Como <strong className="text-purple-300">{character?.class}</strong>, você possui o dom da magia. 
                            Agora você deve escolher seus truques e magias iniciais para completar seu grimório.
                        </p>
                        <button
                            onClick={() => {
                                setCasterAlertModal(false);
                                setLevelUpModalOpen(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg shadow-glow-purple/50 transition-all transform hover:scale-105 font-cinzel tracking-wider border border-white/20"
                        >
                            Abrir Grimório
                        </button>
                    </div>
                </Modal>


                <StartingProficienciesModal
                    isOpen={isProficiencyModalOpen}
                    onClose={() => setIsProficiencyModalOpen(false)}
                    className={selectedClassForProficiency}
                    onConfirm={(skills) => {
                        updateCharacter(char => {
                            // Skills é Record<string, boolean>
                            const newSkills = { ...(char.skills || {}) } as any;
                            skills.forEach(skill => {
                                // Garantir tipo seguro
                                newSkills[skill] = true;
                            });
                            return { ...char, skills: newSkills };
                        });
                        setIsProficiencyModalOpen(false);
                        // Abre modal de equipamento após as proficiências
                        setIsEquipmentStartModalOpen(true);
                    }}
                />
                <StartingEquipmentModal
                    isOpen={isEquipmentStartModalOpen}
                    onClose={() => setIsEquipmentStartModalOpen(false)}
                    className={character?.class || ''}
                    background={character?.background || ''}
                    onConfirm={(newItems) => {
                        updateCharacter(char => {
                            const currentInv = { ...char.inventory };
                            const weapons = [...(currentInv.weapons || [])];
                            const otherEquip = [...(currentInv.otherEquipment || [])];

                            newItems.forEach(item => {
                                if (item.type === 'weapon') {
                                    weapons.push({
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: item.name,
                                        quantity: item.quantity,
                                        isEquipped: false,
                                        weight: 0,
                                        damage: '1d6',
                                        damageType: 'cortante',
                                        properties: []
                                    } as any);
                                } else {
                                    otherEquip.push({
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: item.name,
                                        quantity: item.quantity,
                                        weight: 0,
                                        type: item.type === 'armor' ? 'armor' : item.type === 'shield' ? 'shield' : 'other',
                                        description: '',
                                        equipped: false
                                    } as any);
                                }
                            });

                            return {
                                ...char,
                                inventory: {
                                    ...currentInv,
                                    weapons,
                                    otherEquipment: otherEquip
                                }
                            };
                        });
                        setIsEquipmentStartModalOpen(false);
                    }}
                />
            </div>
        </div>
    );
}

// --- Sub-componentes do Modal ---

// --- Text Scanner Modal ---
interface TextScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (text: string) => void;
    isScanning: boolean;
}

function TextScannerModal({ isOpen, onClose, onScan, isScanning }: TextScannerModalProps) {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-rpg-panel border-2 border-purple-500/30 rounded-lg max-w-2xl w-full overflow-hidden shadow-[0_0_100px_-20px_rgba(168,85,247,0.3)] flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-purple-500/20 bg-purple-900/10 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold font-cinzel text-purple-200 uppercase tracking-widest flex items-center gap-3">
                            <span className="text-2xl animate-pulse">🧠</span>
                            Tear de Extração
                        </h3>
                        <p className="text-[10px] text-purple-400 uppercase font-black">Cole textos de livros ou PDFs para extrair regras</p>
                    </div>
                    <button onClick={onClose} className="text-purple-400 hover:text-white transition-colors text-2xl">×</button>
                </div>

                <div className="p-6 flex-grow flex flex-col gap-4">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Cole aqui a descrição de um item mágico, uma habilidade de classe ou um talento..."
                        className="flex-grow bg-rpg-dark/60 border border-purple-500/20 rounded-lg p-5 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-serif leading-relaxed resize-none custom-scrollbar h-64"
                    />

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-rpg-grey hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={isScanning || !text.trim()}
                            onClick={() => onScan(text)}
                            className={`px-8 py-2 rounded bg-purple-600 text-white font-bold uppercase text-xs tracking-[0.2em] shadow-glow-purple/20 transition-all ${isScanning || !text.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500 hover:scale-105 active:scale-95'}`}
                        >
                            {isScanning ? 'Extraindo...' : 'Sincronizar com Ficha'}
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-purple-900/5 text-center border-t border-purple-500/10">
                    <p className="text-[9px] text-purple-400/60 italic">A I.A. identificará automaticamente nomes e descrições úteis.</p>
                </div>
            </div>
        </div>
    );
}
