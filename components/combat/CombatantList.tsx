import React from 'react';
import { Combatant, CombatNotification } from '@/hooks/useCombat';
import CombatantCard from './CombatantCard';

interface CombatantListProps {
    combatants: Combatant[];
    phase: string;
    turnIndex: number;
    notificationsMap: Record<string, CombatNotification>;
    hpAdjustmentValues: Record<string, string>;
    healAdjustmentValues: Record<string, string>;
    sethpAdjustmentValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setHealAdjustmentValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateHP: (cid: string, amount: number) => Promise<void>;
    removeCombatant: (cid: string) => Promise<void>;
    setConfirmCureModal: React.Dispatch<React.SetStateAction<{ open: boolean; combatant: Combatant | null }>>;
    setClassFxTarget: React.Dispatch<React.SetStateAction<Combatant | null>>;
    setIsClassFxOpen: React.Dispatch<React.SetStateAction<boolean>>;
    syncState: (updates: any) => Promise<void>;
    setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
    isMaster?: boolean;
    user: any;
}

const CombatantList: React.FC<CombatantListProps> = (props) => {
    return (
        <main className="container mx-auto p-3 sm:p-6 flex-grow pb-24">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {props.combatants.map((c, index) => {
                    const isOwnHero = c.ownerId === props.user?.uid;
                    return (
                        <CombatantCard
                            key={c.id}
                            combatant={c}
                            index={index}
                            isMaster={props.isMaster}
                            isOwnHero={isOwnHero}
                            {...props}
                        />
                    );
                })}
            </div>
        </main>
    );
};

export default CombatantList;
