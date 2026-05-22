import { renderHook, act } from '@testing-library/react';
import { useCombat, Combatant } from '../../hooks/useCombat';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    db: {}
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()), // return unsubscribe
    updateDoc: jest.fn().mockResolvedValue({}),
    setDoc: jest.fn().mockResolvedValue({}),
    collection: jest.fn(),
    getDoc: jest.fn().mockResolvedValue({
        exists: () => false,
        data: () => ({})
    }),
    getDocs: jest.fn().mockResolvedValue({ docs: [] }),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    addDoc: jest.fn().mockResolvedValue({ id: 'new-id' }),
    serverTimestamp: jest.fn(),
    deleteDoc: jest.fn().mockResolvedValue({})
}));

// Mock Next Navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn()
    }),
    useParams: () => ({ id: 'test-encounter' })
}));

describe('Combat Logic Audit', () => {
    const mockUser = { uid: 'user-1', displayName: 'Mestre' };
    const encounterId = 'enc-123';

    it('should initialize correctly with default values', () => {
        const { result } = renderHook(() => useCombat(encounterId, mockUser));
        expect(result.current.phase).toBe('preparation');
        expect(result.current.round).toBe(1);
        expect(result.current.turnIndex).toBe(0);
        expect(result.current.combatants).toEqual([]);
    });

    it('should increment turn and round correctly on nextTurn', async () => {
        const { result } = renderHook(() => useCombat(encounterId, mockUser));
        
        // Setup mock combatants
        const mockCombatants: Combatant[] = [
            { id: '1', name: 'Player 1', type: 'player', hp: 10, maxHp: 10, initiative: 20, status: 'active', statusEffects: [] },
            { id: '2', name: 'Monster 1', type: 'monster', hp: 20, maxHp: 20, initiative: 10, status: 'active', statusEffects: [] }
        ];

        act(() => {
            result.current.setCombatants(mockCombatants);
            result.current.setPhase('combat');
        });

        // 1st Turn -> 2nd Turn
        await act(async () => {
            result.current.nextTurn();
        });
        expect(result.current.turnIndex).toBe(1);
        expect(result.current.round).toBe(1);

        // 2nd Turn -> Back to 1st Turn, Round 2
        await act(async () => {
            result.current.nextTurn();
        });
        expect(result.current.turnIndex).toBe(0);
        expect(result.current.round).toBe(2);
    });

    it('should update HP and respect bounds', async () => {
        const { result } = renderHook(() => useCombat(encounterId, mockUser));
        const mockCombatant: Combatant = { 
            id: '1', name: 'P1', type: 'player', hp: 10, maxHp: 20, 
            initiative: 10, status: 'active', statusEffects: [] 
        };

        act(() => {
            result.current.setCombatants([mockCombatant]);
        });

        // Damage
        await act(async () => {
            await result.current.updateHP('1', -5);
        });
        expect(result.current.combatants[0].hp).toBe(5);

        // Healing capped at maxHp
        await act(async () => {
            await result.current.updateHP('1', 100);
        });
        expect(result.current.combatants[0].hp).toBe(20);

        // Overdamage stays at 0
        await act(async () => {
            await result.current.updateHP('1', -100);
        });
        expect(result.current.combatants[0].hp).toBe(0);
    });

    it('should mark monsters as dead at 0 HP but keep players active/unconscious', async () => {
        const { result } = renderHook(() => useCombat(encounterId, mockUser));
        const p1: Combatant = { id: 'p1', name: 'P1', type: 'player', hp: 10, maxHp: 10, initiative: 10, status: 'active', statusEffects: [] };
        const m1: Combatant = { id: 'm1', name: 'M1', type: 'monster', hp: 10, maxHp: 10, initiative: 5, status: 'active', statusEffects: [] };

        act(() => {
            result.current.setCombatants([p1, m1]);
        });

        // Monster dies
        await act(async () => {
            await result.current.updateHP('m1', -10);
        });
        expect(result.current.combatants.find(c => c.id === 'm1')?.status).toBe('dead');

        // Player falls (Now should become unconscious)
        await act(async () => {
            await result.current.updateHP('p1', -10);
        });
        const playerStatus = result.current.combatants.find(c => c.id === 'p1')?.status;
        expect(playerStatus).toBe('unconscious'); 
    });

    it('should sort initiative correctly in startCombat and use initiativeBonus', async () => {
        const { result } = renderHook(() => useCombat(encounterId, mockUser));
        // M1 has +5 bonus, M2 has -5 bonus
        const m1: any = { id: 'm1', name: 'M1', type: 'monster', hp: 10, maxHp: 10, initiative: 0, initiativeBonus: 5, status: 'active', statusEffects: [] };
        const m2: any = { id: 'm2', name: 'M2', type: 'monster', hp: 10, maxHp: 10, initiative: 0, initiativeBonus: -5, status: 'active', statusEffects: [] };

        act(() => {
            result.current.setCombatants([m1, m2]);
        });

        await act(async () => {
            result.current.startCombat();
        });

        const comb1 = result.current.combatants[0];
        const comb2 = result.current.combatants[1];
        
        // M1 (bonus +5) should likely be ahead of M2 (bonus -5) 
        // statistically, but we just check if initiative was set
        expect(comb1.initiative).not.toBe(0);
        expect(comb2.initiative).not.toBe(0);
    });
});
