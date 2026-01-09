# Guia Rápido de Execução - Limpeza do Banco

## 🚀 Passo a Passo

### 1. Instalar dependência necessária (apenas primeira vez)

```bash
npm install -D tsx
```

### 2. Testar SEM modificar o banco (recomendado)

```bash
# Ver tudo que seria feito
npm run limpar-banco tudo
```

O script mostrará:
- ✅ Quais magias seriam traduzidas
- ✅ Quais duplicados seriam removidos
- ✅ Quantas alterações seriam feitas

### 3. Se estiver tudo OK, EXECUTAR de verdade

```bash
# CUIDADO: Isso VAI MODIFICAR o banco!
npm run limpar-banco tudo --execute
```

## 📝 Comandos Disponíveis

```bash
# Testar tudo (modo seguro)
npm run limpar-banco tudo

# Testar apenas magias
npm run limpar-banco magias

# Testar apenas raças
npm run limpar-banco racas

# Testar apenas classes  
npm run limpar-banco classes

# EXECUTAR de verdade (modifica o banco!)
npm run limpar-banco magias -- --execute
npm run limpar-banco racas -- --execute
npm run limpar-banco classes -- --execute
npm run limpar-banco tudo -- --execute
```

## ⚠️ IMPORTANTE

1. **SEMPRE TESTE PRIMEIRO** sem --execute
2. O modo de teste NÃO modifica o banco
3. Só use --execute quando tiver certeza
4. Não há como desfazer facilmente!

## 💡 Exemplo de Uso Completo

```bash
# 1. Instalar tsx (só precisa fazer uma vez)
npm install -D tsx

# 2. Testar tradução de magias
npm run limpar-banco magias

# 3. Se estiver OK, executar
npm run limpar-banco magias --execute

# 4. Testar limpeza de raças
npm run limpar-banco racas

# 5. Se estiver OK, executar
npm run limpar-banco racas --execute

# 6. Testar limpeza de classes
npm run limpar-banco classes

# 7. Se estiver OK, executar
npm run limpar-banco classes --execute
```

## 🎯 Resumo

- ✅ **SEM --execute** = Modo seguro de teste
- 🔴 **COM --execute** = Modifica o banco de dados

**Leia `LIMPEZA_BANCO.md` para mais detalhes!**
