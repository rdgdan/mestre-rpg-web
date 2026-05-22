import { renderHook, act } from '@testing-library/react';
import { useCharacterSheet } from '@/hooks/useCharacterSheet';

// Mocks do Firebase
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockOnSnapshot: any = jest.fn(() => jest.fn()); // retorna unsubscribe

// Mock do @/lib/firebase ANTES de qualquer importação
jest.mock('@/lib/firebase', () => ({
    db: { type: 'mocked-db' },
    auth: { type: 'mocked-auth', currentUser: { uid: 'user-123' } },
}));

jest.mock('firebase/firestore', () => ({
    ...jest.requireActual('firebase/firestore'),
    getFirestore: jest.fn(),
    collection: jest.fn((db, ...path) => ({ type: 'query', path: path.join('/') })),
    doc: jest.fn((db, ...path) => ({ type: 'doc', path: path.join('/') })),
    addDoc: (...args: any[]) => mockAddDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    onSnapshot: (...args: any[]) => mockOnSnapshot.apply(null, args as any),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    setDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
})); 

jest.mock('react-firebase-hooks/auth', () => ({
    useAuthState: () => [{ uid: 'user-123' }, false],
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    useParams: () => ({ id: 'char-123' }),
}));

describe('Combat Audit Flow', () => {
    const mockCharacter: any = {
        id: 'char-123',
        ownerId: 'user-123',
        name: 'Guerreiro Teste',
        currentHp: 20,
        maxHp: 30,
        activeEncounterId: 'encounter-456',
        spellcasting: { slots: {} }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => mockCharacter,
            id: 'char-123',
            metadata: { hasPendingWrites: false }
        });
        
        // Simular o snapshot de forma mais segura
        mockOnSnapshot.mockImplementation((ref, callback) => {
            // Usar setTimeout para disparar o callback fora do ciclo de render atual
            setTimeout(() => {
                callback({
                    exists: () => true,
                    data: () => mockCharacter,
                    id: 'char-123',
                    metadata: { hasPendingWrites: false }
                });
            }, 0);
            return jest.fn();
        });
    });

    it('should send a notification to the encounter when HP changes', async () => {
        const { result } = renderHook(() => useCharacterSheet('char-123'));

        // Esperar o carregamento inicial e o enrichment
        await act(async () => {
            await new Promise(r => setTimeout(r, 100));
        });

        // Alterar HP (Simulando um dano de 5)
        await act(async () => {
            await result.current.handleFieldChange('currentHp', 15);
            await new Promise(r => setTimeout(r, 50));
        });

        // Verificar se addDoc foi chamado na coleção 'logs' do encontro correto
        expect(mockAddDoc).toHaveBeenCalled();
        const callArgs = mockAddDoc.mock.calls[0];
        expect(callArgs[0].path).toContain('encounters/encounter-456/logs');
    });

    it('should send a notification when a spell is used', async () => {
        // Ajustar o mock para já vir com slots
        mockCharacter.spellcasting = { 
            slots: { '3': { current: 1, max: 1 } },
            ability: 'Inteligencia'
        };

        const { result } = renderHook(() => useCharacterSheet('char-123'));
        
        await act(async () => {
            await new Promise(r => setTimeout(r, 150));
        });

        const mockSpell = { name: 'Bola de Fogo', level: 3 };

        await act(async () => {
            const success = await result.current.handleSpellUsed(mockSpell);
            expect(success).toBe(true);
            await new Promise(r => setTimeout(r, 50));
        });

        expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should notify when a short rest is taken', async () => {
        const { result } = renderHook(() => useCharacterSheet('char-123'));

        await act(async () => {
            await new Promise(r => setTimeout(r, 100));
        });

        await act(async () => {
            await result.current.handleRest('short');
            await new Promise(r => setTimeout(r, 50));
        });

        expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should be in read-only mode when user is not the owner', async () => {
        // Simular que o usuário logado é outro
        const differentUser = { uid: 'master-999' };
        jest.spyOn(require('react-firebase-hooks/auth'), 'useAuthState').mockReturnValue([differentUser, false]);

        const { result } = renderHook(() => useCharacterSheet('char-123'));

        await act(async () => {
            await new Promise(r => setTimeout(r, 150));
        });

        expect(result.current.isReadOnly).toBe(true);
        
        // Tentar alterar algo e ver se bloqueia
        await act(async () => {
            await result.current.handleFieldChange('name', 'Hacker');
        });

        // Verificamos que o setDoc não foi chamado (ou mockCharacter não mudou)
        // No hook real, updateCharacter retorna early se isReadOnly for true.
        expect(require('firebase/firestore').setDoc).not.toHaveBeenCalled();
    });
});
