import { renderHook, act } from '@testing-library/react';
import { useCombat, Combatant } from '../../hooks/useCombat';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    db: {}
}));

// Mock Firestore
const mockUpdateDoc = jest.fn().mockResolvedValue({});
const mockGetDoc = jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
const mockSetDoc = jest.fn().mockResolvedValue({});
const mockGetDocs = jest.fn().mockResolvedValue({ docs: [] });

jest.mock('firebase/firestore', () => {
    return {
        doc: jest.fn(),
        onSnapshot: jest.fn(() => jest.fn()), // unsubscribe
        updateDoc: (ref: any, data: any) => mockUpdateDoc(ref, data),
        setDoc: (ref: any, data: any) => mockSetDoc(ref, data),
        getDoc: (ref: any) => mockGetDoc(ref),
        getDocs: (q: any) => mockGetDocs(q),
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        addDoc: jest.fn(),
        serverTimestamp: jest.fn(),
        deleteDoc: jest.fn()
    };
});

// Mock Next Navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    useParams: () => ({ id: 'arena-123' })
}));

describe('Online Combat Player Flow', () => {
    const mockUser = { uid: 'player-456', displayName: 'Heroi' };
    const arenaId = 'arena-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle player joining battle with manual data', async () => {
        const { result } = renderHook(() => useCombat(arenaId, mockUser, 'player'));

        // Mock Arena Data (Empty arena)
        mockGetDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ combatants: [], hostId: 'master-1', hostName: 'Mestre' })
        });

        const manualChar: Partial<Combatant> = {
            name: 'Convidado T1',
            class: 'Guerreiro',
            level: 1,
            hp: 10,
            maxHp: 10,
            ac: 15,
            initiative: 12,
            type: 'player'
        };

        await act(async () => {
            await result.current.handleJoinBattle(manualChar);
        });

        // Verify updateDoc was called with the new combatant
        expect(mockUpdateDoc).toHaveBeenCalled();
        const callArgs = mockUpdateDoc.mock.calls[0][1];
        expect(callArgs.combatants).toHaveLength(1);
        expect(callArgs.combatants[0].name).toBe('Convidado T1');
        expect(callArgs.combatants[0].ownerId).toBe('player-456');
    });

    it('should handle player joining with existing character and sync initial data', async () => {
        const { result } = renderHook(() => useCombat(arenaId, mockUser, 'player'));

        const existingChar = {
            id: 'char-789',
            name: 'Aragorn',
            class: 'Ranger',
            level: 5,
            currentHp: 25,
            hp: { max: 40 },
            armorClass: 16
        };

        mockGetDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ combatants: [], hostId: 'master-1' })
        });

        const charData: Partial<Combatant> = {
            externalId: existingChar.id,
            name: existingChar.name,
            class: existingChar.class,
            level: existingChar.level,
            hp: existingChar.currentHp,
            maxHp: existingChar.hp.max,
            ac: existingChar.armorClass,
            initiative: 15,
            type: 'player'
        };

        await act(async () => {
            await result.current.handleJoinBattle(charData);
        });

        expect(mockUpdateDoc).toHaveBeenCalled();
        const callArgs = mockUpdateDoc.mock.calls[0][1];
        expect(callArgs.combatants[0].externalId).toBe('char-789');
        expect(callArgs.combatants[0].hp).toBe(25);
    });
});
