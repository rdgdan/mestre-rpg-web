# 📋 Guia de Refatoração e Boas Práticas

## Status das Melhorias ✅

Este documento rastreia o progresso das melhorias de qualidade de código no projeto Mestre-RPG.

### ✅ Implementado

1. **Logger Centralizado** (`lib/logger.ts`)
   - ✅ Criado com suporte a dev/prod
   - ✅ Substitui todos os `console.log`
   - Uso: `import { logger } from '@/lib/logger';`

2. **Tipos Globais** (`types/index.ts`)
   - ✅ Interfaces para Character, Spell, Campaign, etc.
   - ✅ Elimina uso de `as any`
   - Uso: `import { Character, Spell } from '@/types';`

3. **ESLint Configurado** (`.eslintrc.json`)
   - ✅ Regras contra `any`
   - ✅ Forçar type annotations
   - ✅ Validar React hooks
   - Execute: `npm run lint`

4. **Jest/Testing Setup**
   - ✅ Configuração Jest (`jest.config.js`)
   - ✅ Setup Testing Library (`jest.setup.js`)
   - ✅ Testes de exemplo nos `__tests__/`
   - Execute: `npm test`

5. **Componentes Refatorados**
   - ✅ `components/biblioteca/SpellDetails.tsx`
   - ✅ `components/biblioteca/SpellList.tsx`
   - ✅ `components/biblioteca/SpellFilterBar.tsx`
   - ✅ `components/character/CharacterBasics.tsx`
   - Redução de ~60KB em componentes monolíticos

6. **Hooks Customizados**
   - ✅ `hooks/useSpellFilter.ts` - Gerenciar filtros de magias
   - ✅ `hooks/useCharacterData.ts` - CRUD de personagens
   - Reutilizáveis em múltiplos componentes

### 🚀 Próximas Tarefas

#### Priority 1 (Esta Semana)
- [ ] Quebrar `app/biblioteca/page.tsx` (171 KB) usando novos componentes
- [ ] Quebrar `app/personagem/[id]/page.tsx` (167 KB) usando novos componentes
- [ ] Remover todos `console.log` restantes (rodar `migrate-to-logger.ts`)
- [ ] Revisar e remover `as any` usando tipos criados

#### Priority 2 (Próximas 2 Semanas)
- [ ] Adicionar testes para componentes principais
- [ ] Configurar pre-commit hook para lint
- [ ] Adicionar CI/CD no GitHub Actions
- [ ] Documentar padrões de componentes

#### Priority 3 (Longo Prazo)
- [ ] Lazy loading para componentes pesados
- [ ] Otimização de imagens com `<Image>` do Next.js
- [ ] Memoization com `useMemo`/`useCallback`
- [ ] E2E tests com Playwright

---

## 📐 Padrões de Código

### 1. Tipagem Forte

❌ **Antes:**
```typescript
const handleData = (data: any) => {
  (data.features as any[]).forEach(feat => {
    console.log(feat);
  });
};
```

✅ **Depois:**
```typescript
import { Character } from '@/types';
import { logger } from '@/lib/logger';

const handleData = (character: Character): void => {
  character.features?.forEach(feat => {
    logger.info('Feature found', feat);
  });
};
```

### 2. Componentização

❌ **Antes:** Um componente com 1000+ linhas

✅ **Depois:**
```
components/
├── biblioteca/
│   ├── SpellDetails.tsx      (60 linhas)
│   ├── SpellList.tsx         (50 linhas)
│   ├── SpellFilterBar.tsx    (80 linhas)
│   └── GrimorioTab.tsx       (150 linhas)
└── hooks/
    └── useSpellFilter.ts     (120 linhas)
```

### 3. Error Handling

❌ **Antes:**
```typescript
try {
  await saveCharacter();
} catch (error) {
  console.error("Erro ao salvar", error);
  alert("Erro!"); 
}
```

✅ **Depois:**
```typescript
try {
  const success = await saveCharacter();
  if (success) {
    logger.info('Personagem salvo com sucesso');
  }
} catch (error) {
  logger.error('Erro ao salvar personagem', error);
  setError('Falha ao salvar a ficha');
}
```

### 4. Hooks Customizados

Criar hooks para lógica compartilhada:

```typescript
// hooks/useMagia.ts
export const useMagia = (spellId: string) => {
  const [spell, setSpell] = useState<Spell | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Buscar magia
  }, [spellId]);

  return { spell, isLoading };
};

// Uso no componente
const { spell, isLoading } = useMagia(spellId);
```

---

## 🧪 Testando

### Rodar Testes
```bash
npm test                    # Rodar todos os testes
npm test -- --watch       # Modo watch
npm test -- --coverage    # Gerar cobertura
```

### Adicionar Teste a um Componente

1. Criar arquivo `__tests__/components/MeuComponente.test.tsx`
2. Usar template:

```typescript
import { render, screen } from '@testing-library/react';
import MeuComponente from '@/components/MeuComponente';

describe('MeuComponente', () => {
  it('deve renderizar corretamente', () => {
    render(<MeuComponente />);
    expect(screen.getByText(/esperado/i)).toBeInTheDocument();
  });
});
```

---

## 🔧 Ferramentas

### ESLint
```bash
npm run lint              # Verificar
npm run lint -- --fix    # Corrigir automaticamente
```

### TypeScript
```bash
npx tsc --noEmit         # Verificar tipos
```

### Migração de Loggers
```bash
npx tsx scripts/migrate-to-logger.ts
```

---

## 📚 Referências

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

---

## 🚨 Checklist Antes de Fazer Commit

- [ ] Sem `console.log` no código
- [ ] Sem `as any` desnecessários
- [ ] ESLint passa (`npm run lint`)
- [ ] TypeScript compila (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Código foi revisado
- [ ] Mensagem de commit é clara

---

## 💬 Dúvidas?

Consulte o `blueprint.md` ou abra uma issue no repositório.
