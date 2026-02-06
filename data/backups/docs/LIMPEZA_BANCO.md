# 🧹 Limpeza do Banco de Dados

## 📋 Problemas que este script resolve:

1. **Magias em inglês** → Traduz automaticamente para português
2. **Raças duplicadas** → Remove duplicados (ELFO, elfo, Elfo → Elfo)
3. **Classes duplicadas** → Remove duplicados (MAGO, mago, Mago → Mago)

## ⚠️ IMPORTANTE - Leia antes de executar!

**FAÇA BACKUP DO SEU BANCO DE DADOS FIREBASE ANTES DE EXECUTAR!**

## 🚀 Como usar:

### 1. Primeiro, teste sem modificar o banco (modo dry-run):

```bash
# Ver o que seria feito SEM modificar nada
npm run limpar-banco
```

ou teste operações específicas:

```bash
# Testar apenas tradução de magias
npm run limpar-banco magias

# Testar apenas limpeza de raças
npm run limpar-banco racas

# Testar apenas limpeza de classes
npm run limpar-banco classes
```

### 2. Se tudo estiver ok, execute de verdade:

```bash
# EXECUTAR TUDO (traduzir magias + limpar raças + limpar classes)
npm run limpar-banco tudo --execute

# Ou execute apenas o que você precisa:
npm run limpar-banco magias --execute
npm run limpar-banco racas --execute
npm run limpar-banco classes --execute
```

## 📊 O que o script faz:

### 1. Tradução de Magias
- Busca todas as magias na coleção `magias`
- Usa o tradutor automático para converter inglês → português
- Atualiza apenas as magias que estão em inglês
- Mantém as que já estão em português

**Exemplo:**
```
Magic Missile → Mísseis Mágicos
Fireball → Bola de Fogo
Shield → Escudo Arcano
```

### 2. Limpeza de Duplicados de Raças
- Normaliza todos os nomes: `Primeira Letra Maiúscula`
- Remove duplicados baseado no nome normalizado
- Mantém apenas uma versão de cada raça

**Exemplo:**
```
Antes:               Depois:
- ELFO              → Elfo (mantido)
- elfo              (removido - duplicado)
- Elfo              (removido - duplicado)
- ANÃO              → Anão (mantido)
- anão              (removido - duplicado)
```

### 3. Limpeza de Duplicados de Classes
- Mesma lógica das raças
- Normaliza e remove duplicados

**Exemplo:**
```
Antes:               Depois:
- MAGO              → Mago (mantido)
- mago              (removido - duplicado)
- Mago              (removido - duplicado)
- GUERREIRO         → Guerreiro (mantido)
```

## 🔍 Modo de Teste vs Execução Real

### Modo de Teste (dry-run) - PADRÃO
```bash
npm run limpar-banco
```
- ✅ Mostra o que SERIA feito
- ✅ NÃO modifica o banco
- ✅ Seguro para testar

### Modo de Execução Real
```bash
npm run limpar-banco tudo --execute
```
- 🔴 MODIFICA o banco de dados
- 🔴 Não pode ser desfeito facilmente
- ⚠️ Use com cuidado!

## 📈 Saída do Script

O script mostra:
- Quantos itens foram encontrados
- O que será modificado/removido
- Resumo final com estatísticas

Exemplo de saída:
```
🔮 TRADUZINDO MAGIAS DO BANCO DE DADOS
========================================

📊 Total de magias encontradas: 150

✅ Magic Missile → Mísseis Mágicos
✅ Fireball → Bola de Fogo
✅ Shield → Escudo Arcano
...

========================================

📊 RESUMO DA TRADUÇÃO:
   ✨ Magias traduzidas: 45
   ⚪ Já em português: 105

⚠️  MODO DE TESTE - Nenhuma alteração foi salva!
   Execute com --execute para aplicar as mudanças.
```

## 🛠️ Solução de Problemas

### Erro de autenticação Firebase
- Verifique se o arquivo `.env.local` existe
- Confirme que as variáveis Firebase estão corretas

### Script não encontra dados
- Verifique se as coleções existem no Firebase:
  - `magias`
  - `races`
  - `classes`

### Erro de permissão
- Verifique as regras de segurança do Firestore
- Certifique-se de ter permissão de escrita

## 💡 Dicas

1. **Sempre teste primeiro** com o modo dry-run
2. **Faça backup** antes de executar
3. **Execute em horário de baixo tráfego** se seu app estiver em produção
4. **Execute uma operação por vez** se não tiver certeza

## 📞 Suporte

Se algo der errado:
1. Verifique os logs do console
2. Restaure do backup se necessário
3. Execute novamente em modo de teste para investigar

---

**Última atualização:** 09/01/2026
