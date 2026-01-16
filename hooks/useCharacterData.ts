/**
 * Hook para gerenciar dados do personagem
 */

import { useState, useEffect, useCallback } from 'react';
import { Character } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';

export const useCharacterData = (characterId?: string) => {
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do personagem
  useEffect(() => {
    if (!user || !characterId || characterId === 'novo') {
      setIsLoading(false);
      return;
    }

    const loadCharacter = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'personagens', characterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCharacter({
            id: docSnap.id,
            ...data,
          } as Character);
          setError(null);
        } else {
          setError('Personagem não encontrado');
          logger.warn('Personagem não encontrado', { characterId });
        }
      } catch (err) {
        logger.error('Erro ao carregar personagem', err);
        setError('Falha ao carregar a ficha');
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacter();
  }, [user, characterId]);

  // Salvar personagem
  const saveCharacter = useCallback(
    async (updatedCharacter: Partial<Character>) => {
      if (!user || !character) return;

      try {
        setIsSaving(true);
        const mergedCharacter = { ...character, ...updatedCharacter };
        const docRef = doc(db, 'personagens', character.id);

        await setDoc(docRef, mergedCharacter, { merge: true });
        setCharacter(mergedCharacter);
        logger.info('Personagem salvo com sucesso', { id: character.id });
        return true;
      } catch (err) {
        logger.error('Erro ao salvar personagem', err);
        setError('Falha ao salvar a ficha');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, character]
  );

  // Atualizar campo específico
  const updateField = useCallback(
    async (field: keyof Character, value: any) => {
      await saveCharacter({ [field]: value } as Partial<Character>);
    },
    [saveCharacter]
  );

  return {
    character,
    setCharacter,
    isLoading,
    isSaving,
    error,
    saveCharacter,
    updateField,
  };
};
