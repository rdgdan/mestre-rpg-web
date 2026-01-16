#!/bin/bash
# Arquivo de referência rápida de comandos

# ============ DESENVOLVIMENTO ============
npm run dev                 # Iniciar servidor local

# ============ BUILD & LINT ============
npm run build              # Build production
npm run lint               # Verificar ESLint
npm run lint -- --fix      # Corrigir automaticamente
npm run type-check         # Verificar TypeScript

# ============ TESTES ============
npm test                   # Rodar testes
npm test -- --watch        # Modo watch
npm test -- --coverage     # Gerar cobertura
npm test SpellFilter       # Testar arquivo específico

# ============ MIGRAÇÃO ============
npm run migrate-logger     # Remover console.log

# ============ DATABASE ============
npm run limpar-banco       # Limpar banco de dados
npm run popular-monstros   # Popular monstros
npm run diagnostico-banco  # Diagnosticar banco

# ============ GIT ============
git status                 # Ver mudanças
git add .                  # Adicionar todas
git commit -m "msg"        # Commit
git push                   # Push
git pull origin main       # Pull

# ============ NODE ============
npm install                # Instalar deps
npm update                 # Atualizar deps
npm outdated               # Ver outdated
