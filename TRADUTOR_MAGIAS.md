# Sistema de Tradução Automática de Magias

## 📖 Resumo

Implementado um sistema de **tradução automática** de magias do D&D 5e do inglês para português **sem usar IA**. O sistema usa dicionários predefinidos de mapeamento para traduzir automaticamente os dados que vêm da API do 5etools.

## ✨ Características

### ✅ Tradução Automática (Sem IA)
- ✅ **Mais de 600 magias** traduzidas automaticamente
- ✅ Traduz nomes de magias (ex: "Fireball" → "Bola de Fogo")
- ✅ Traduz escolas de magia (ex: "Evocation" → "Evocação")
- ✅ Traduz classes (ex: "Wizard" → "Mago")
- ✅ Converte unidades (ex: pés → metros)
- ✅ Traduz componentes, duração, alcance e tempo de conjuração

### 📚 Livros Cobertos
- **Player's Handbook (PHB)** - Livro do Jogador
- **Xanathar's Guide to Everything (XGE)** - Guia de Xanathar para Tudo
- **Tasha's Cauldron of Everything (TCE)** - Caldeirão de Tasha para Tudo
- **Elemental Evil Player's Companion (EEPC)**
- **Sword Coast Adventurer's Guide (SCAG)** - Guia do Aventureiro da Costa da Espada
- **Strixhaven: A Curriculum of Chaos**
- **Icewind Dale: Rime of the Frostmaiden**
- **Explorer's Guide to Wildemount**
- **Fizban's Treasury of Dragons**
- **Acquisitions Incorporated**

## 🛠️ Arquivos Criados/Modificados

### Novo Arquivo
- `lib/spell-translator.ts` - Tradutor automático de magias

### Arquivos Modificados
- `app/api/dnd-api/route.ts` - Integrou o tradutor
- `app/api/fivetools/route.ts` - Integrou o tradutor

## 🎯 Como Funciona

### 1. Dicionários de Tradução
O arquivo `spell-translator.ts` contém vários dicionários:
```typescript
SPELL_NAMES: {
  "Fireball": "Bola de Fogo",
  "Magic Missile": "Mísseis Mágicos",
  // ... mais de 600 magias
}

SPELL_SCHOOLS: {
  "Evocation": "Evocação",
  "Abjuration": "Abjuração",
  // ...
}

CLASS_NAMES: {
  "Wizard": "Mago",
  "Sorcerer": "Feiticeiro",
  // ...
}
```

### 2. Função de Tradução
A função `translateSpell()` recebe uma magia em inglês e retorna traduzida:
```typescript
const spell = {
  name: "Fireball",
  school: "Evocation",
  level: 3,
  // ...dados do 5etools em inglês
}

const translated = translateSpell(spell);
// Resultado:
// {
//   name: "Bola de Fogo",
//   school: "Evocação",
//   level: 3,
//   range: "45 metros",
//   duration: "Instantânea",
//   // ...tudo traduzido!
// }
```

### 3. Integração nas APIs
As rotas de API automaticamente aplicam a tradução:
```typescript
// Em app/api/dnd-api/route.ts
if (type === 'spells') {
    finalItems = translateSpells(uniqueItems);
    console.log(`${finalItems.length} magias traduzidas automaticamente!`);
}
```

## 📊 Conversões Automáticas

### Unidades de Distância (pés → metros)
- 5 pés → 1,5 metros
- 10 pés → 3 metros
- 30 pés → 9 metros
- 60 pés → 18 metros
- 120 pés → 36 metros
- 1 milha → 1,5 km

### Durações
- "instant" → "Instantânea"
- "permanent" → "Permanente"
- "1 minute" → "1 minuto"
- "Concentration, up to 1 hour" → "Concentração, até 1 hora"

### Componentes
- `{ v: true, s: true, m: "guano de morcego" }` → "V, S, M (guano de morcego)"

## 🚀 Como Usar

### Para Usuários
1. Acesse a Biblioteca (Grimório)

2. As magias do 5etools agora aparecem **automaticamente em português**
3. Não é necessário fazer nada - a tradução acontece nos bastidores!

### Para Desenvolvedores

#### Traduzir uma Magia
```typescript
import { translateSpell } from '@/lib/spell-translator';

const magiaIngles = { name: "Shield", level: 1, school: "Abjuration" };
const magiaPortugues = translateSpell(magiaIngles);
console.log(magiaPortugues.name); // "Escudo Arcano"
```

#### Traduzir Múltiplas Magias
```typescript
import { translateSpells } from '@/lib/spell-translator';

const magiasIngles = [/* array de magias */];
const magiasPortugues = translateSpells(magiasIngles);
```

#### Adicionar Novas Traduções
Edite `lib/spell-translator.ts` e adicione ao dicionário `SPELL_NAMES`:
```typescript
export const SPELL_NAMES: Record<string, string> = {
    // ... magias existentes
    "Nova Magia em Inglês": "Nova Magia em Português",
};
```

## 📝 Exemplos de Traduções

| Inglês | Português |
|--------|-----------|
| Fireball | Bola de Fogo |
| Magic Missile | Mísseis Mágicos |
| Cure Wounds | Curar Ferimentos |
| Shield | Escudo Arcano |
| Counterspell | Contra-Mágica |
| Eldritch Blast | Raio Místico |
| Healing Word | Palavra de Cura |
| Invisibility | Invisibilidade |
| Teleport | Teletransporte |
| Wish | Desejo |
| Absorb Elements | Absorver Elementos |
| Silvery Barbs | Farpas Prateadas |
| Mind Sliver | Lasca Mental |
| Spirit Shroud | Mortalha Espiritual |

## 🔧 Manutenção

### Adicionar Mais Magias
Para adicionar traduções de novas magias:
1. Abra `lib/spell-translator.ts`
2. Localize o dicionário `SPELL_NAMES`
3. Adicione a nova entrada:
   ```typescript
   "Nome em Inglês": "Nome em Português",
   ```

### Adicionar Novos Livros
Se um novo livro de D&D for lançado:
1. Adicione um comentário organizacional
2. Adicione todas as magias do livro
3. Exemplo:
   ```typescript
   // Nome do Novo Livro
   "New Spell 1": "Nova Magia 1",
   "New Spell 2": "Nova Magia 2",
   ```

## ⚠️ Limitações

- Apenas nomes de magias **predefinidos** são traduzidos
- Magias homebrew ou muito novas podem não estar no dicionário
- Descrições de magias permanecem em inglês (texto longo demais para mapear)
- Para magias não traduzidas, o nome original em inglês é mantido

## 🎓 Benefícios

✅ **Sem dependência de IA** - Tradução instantânea e gratuita  
✅ **Consistente** - Mesmas traduções sempre  
✅ **Rápido** - Não precisa fazer chamadas de API  
✅ **Expansível** - Fácil adicionar novas traduções  
✅ **Offline** - Funciona sem internet  
✅ **Preciso** - Traduções oficiais do D&D em português  

## 📚 Recursos

- [SRD 5.1 em Português](https://github.com/brazilianldsjaguar/RRPG-SRD5)
- [5etools](https://5e.tools/)
- [D&D Beyond](https://www.dndbeyond.com/)

---

**Criado em:** 09/01/2026  
**Versão:** 1.0  
**Magias Traduzidas:** 600+
