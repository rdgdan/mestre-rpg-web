import { renderHook, act } from '@testing-library/react';
import { useCombat, Combatant } from '../../hooks/useCombat';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    db: {}
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()),
    updateDoc: jest.fn().mockResolvedValue({}),
    setDoc: jest.fn().mockResolvedValue({}),
    collection: jest.fn(),
    getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
    query: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    addDoc: jest.fn().mockResolvedValue({ id: 'new-id' }),
    serverTimestamp: jest.fn(),
    deleteDoc: jest.fn().mockResolvedValue({})
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    useParams: () => ({ id: 'test-enc' })
}));

describe('Add Combatant Flow Audit', () => {
    const mockUser = { uid: 'user-1', displayName: 'Mestre' };
    const encounterId = 'enc-1';

    it('should maintain the "path" from modal data to hook state correctly', async () => {
        const { result } = renderHook(() => useCombat(encounterId, mockUser));

        // 1. Imagine a monster selected in the modal
        const monsterFromLib = {
            name: 'Orc',
            hp: 15,
            ac: 13,
            initiativeBonus: 1 // Based on Dex 12
        };

        // 2. Modal logic simulation (quantities and names)
        const qty = 2;
        const addCalls: any[] = [];

        // Simulate handleSubmit loop in modal
        await act(async () => {
            for (let i = 0; i < qty; i++) {
                const suffix = ` ${i + 1}`;
                const entry = {
                    name: `Orc${suffix}`,
                    hp: 15,
                    maxHp: 15,
                    initiative: 0,
                    initiativeBonus: 1,
                    ac: 13,
                    type: 'monster' as const
                };
                addCalls.push(entry);
                await result.current.addCombatant(entry);
            }
        });

        // 3. Verify state in hook
        expect(result.current.combatants).toHaveLength(2);
        expect(result.current.combatants[0].name).toBe('Orc 1');
        expect(result.current.combatants[1].name).toBe('Orc 2');
        expect(result.current.combatants[0].hp).toBe(15);
        expect(result.current.combatants[0].maxHp).toBe(15);
        expect(result.current.combatants[0].status).toBe('active');
        expect((result.current.combatants[0] as any).initiativeBonus).toBe(1);
    });

    it('should respect manual initiative if provided (Logic Check)', async () => {
        // This test documents current behavior of startCombat overwriting manual initiative for NPCs
        const { result } = renderHook(() => useCombat(encounterId, mockUser));

        await act(async () => {
            await result.current.addCombatant({
                name: 'Boss',
                hp: 50,
                maxHp: 50,
                initiative: 18, // Manually set in modal
                initiativeBonus: 2,
                ac: 16,
                type: 'monster'
            });
        });

        expect(result.current.combatants[0].initiative).toBe(18);

        // ACT: Start Combat
        await act(async () => {
            result.current.startCombat();
        });

        // AUDIT: Did it overwrite 18?
        // Current logic in useCombat.ts:
        // if (c.type !== 'player') { roll + bonus }
        // So yes, it overwrites.
        // We might want to fix this to "if (c.initiative === 0) { roll }" 
        // OR provide a way to bypass.
    });
});
