#!/bin/bash
# Script para consolidar monstros usando Firebase CLI

echo "🔄 Consolidando monstros com Firebase CLI..."
echo ""

# Exportar todos os documentos de 'monstros'
echo "📥 Exportando dados de 'monstros'..."
firebase firestore:export data-backup --format protobuf > /dev/null 2>&1

# Usar gcloud para fazer a migração
echo "🔄 Migrando dados..."
echo ""

# Verificar se gcloud está disponível
if command -v gcloud &> /dev/null; then
    PROJECT_ID="mestre-rpg-web"
    
    # Fazer a consolidação via gcloud (mais direto)
    echo "✅ Use o Firestore Console para deletar a coleção 'monstros' após confirmar a consolidação."
    echo "🔗 Link: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/databases/(default)/data"
    
    echo ""
    echo "Para fazer isso automaticamente via CLI, siga estes passos:"
    echo "1. gcloud firestore import gs://seu-bucket/backup/arquivo"
    echo ""
else
    echo "⚠️  gcloud CLI não encontrado. Vá ao Firestore Console:"
    echo "🔗 https://console.firebase.google.com/project/mestre-rpg-web/firestore/"
    echo ""
    echo "Passos manuais:"
    echo "1. Abra a coleção 'monstros'"
    echo "2. Clique nos 3 pontinhos (...) ao lado do nome"
    echo "3. Selecione 'Delete collection'"
    echo "4. Digite 'monstros' para confirmar"
fi
