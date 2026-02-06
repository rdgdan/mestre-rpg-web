# 🐉 Guia: Popular Monstros no Firestore

## O que este script faz?

Este script popula o Firestore com os monstros definidos em `lib/monsters-data.ts`.

**Importante:** O script **NÃO duplica** monstros! Ele verifica se cada monstro já existe (por nome) e só adiciona os novos.

## 🚀 Como usar

### 1. Testar PRIMEIRO (recomendado)

```bash
# Ver o que seria feito SEM modificar o banco
npm run popular-monstros
```

O script mostrará:
- ✅ Quantos monstros já estão no banco
- ✨ Quantos novos seriam adicionados
- ⚪ Quantos já existem (serão ignorados)

### 2. Se estiver OK, executar de verdade

```bash
# CUIDADO: Isso VAI MODIFICAR o banco!
npm run popular-monstros --execute
```

## 📊 Exemplo de saída

```
🐉 POPULANDO MONSTROS NO FIRESTORE
============================================================

📊 Monstros já no banco: 150
📚 Monstros no código: 200

✨ Novos monstros a adicionar: 50
⚪ Monstros já existentes: 150

📋 MONSTROS QUE SERIAM ADICIONADOS:

   ➕ Lobo Atroz (CR 3, Fera)
   ➕ Dragão Vermelho Ancião (CR 24, Dragão)
   ... e mais 48 monstros

⚠️  MODO DE TESTE - Nenhuma alteração foi salva!
   Execute com --execute para popular o banco.
```

## ⚠️ IMPORTANTE

1. **SEMPRE teste primeiro** sem `--execute`
2. O modo de teste **NÃO modifica** o banco
3. Só use `--execute` quando tiver certeza
4. O script é **seguro contra duplicados**
5. Se executar duas vezes, só adiciona o que falta

## 🎯 Casos de uso

### Primeira vez (banco vazio)
```bash
npm run popular-monstros --execute
# Adiciona todos os ~200 monstros
```

### Adicionou novo monstro no código
```bash
# 1. Adicione o monstro em lib/monsters-data.ts
# 2. Teste
npm run popular-monstros
# 3. Execute
npm run popular-monstros --execute
# Só o novo monstro será adicionado!
```

### Verificar se está tudo populado
```bash
npm run popular-monstros
# Se mostrar "0 novos", está tudo OK!
```

## 💡 Dica

Após popular, você pode adicionar/editar monstros diretamente no Firestore Console:
https://console.firebase.google.com/project/mestre-rpg-web/firestore

Collection: `monsters`
