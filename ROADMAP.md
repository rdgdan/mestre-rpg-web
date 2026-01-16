# 🗺️ Roadmap 2026 - Mestre RPG Web

## Visão Geral

Plano estratégico para melhorar qualidade de código, performance e features do projeto Mestre-RPG.

---

## 🎯 Q1 2026 (Janeiro - Março)

### Code Quality Sprint 🔧
- [x] Criar logger centralizado
- [x] Tipos TypeScript globais
- [x] Configurar ESLint forte
- [x] Setup Jest + Testing Library
- [x] Criar componentes refatorados
- [ ] Remover todos `console.log` (rodar migration script)
- [ ] Quebrar `biblioteca/page.tsx` (171 KB)
- [ ] Quebrar `personagem/[id]/page.tsx` (167 KB)
- [ ] Atingir 50%+ cobertura de testes

### Documentation 📚
- [ ] Finalizar REFACTORING_GUIDE.md
- [ ] Criar ADRs (Architecture Decision Records)
- [ ] Documentar padrões de componentes
- [ ] Criar guia de contribuição

**Estimado:** 3-4 semanas

---

## 🎯 Q2 2026 (Abril - Junho)

### Performance Optimization ⚡
- [ ] Implementar lazy loading para componentes pesados
- [ ] Otimizar imagens com `<Image>` do Next.js
- [ ] Adicionar `useMemo` e `useCallback` onde necessário
- [ ] Audit de performance com Lighthouse
- [ ] Reduzir bundle size em 20%

### Testing Expansion 🧪
- [ ] Atingir 70%+ cobertura de testes
- [ ] Adicionar E2E tests com Playwright
- [ ] Criar testes de integração Firebase
- [ ] Setup CI/CD no GitHub Actions

### Features 🚀
- [ ] Melhorar gerador de NPCs com IA
- [ ] Sistema de templates de campanhas
- [ ] Exportar ficha em PDF
- [ ] Dark mode oficial

**Estimado:** 4-5 semanas

---

## 🎯 Q3 2026 (Julho - Setembro)

### Escalabilidade 📈
- [ ] Migrar dados hardcoded para Firestore
- [ ] Implementar paginação em listas grandes
- [ ] Otimizar queries Firestore
- [ ] Caching com Redis

### Funcionalidades Avançadas 🎭
- [ ] Sistema de tokens/moedas
- [ ] Gerenciador de efeitos de combate
- [ ] API REST para integrações
- [ ] Suporte a múltiplos idiomas (i18n)

### Mobile First 📱
- [ ] PWA com suporte offline
- [ ] Otimizar para telas pequenas
- [ ] Suporte a gestos touch
- [ ] Notificações push

**Estimado:** 5-6 semanas

---

## 🎯 Q4 2026 (Outubro - Dezembro)

### Estabilidade & Scale 🏗️
- [ ] Testes de carga
- [ ] Backup automático de dados
- [ ] Sistema de logs centralizado
- [ ] Monitoramento com Sentry

### Community 👥
- [ ] Documentação para contribuidores
- [ ] Setup para self-hosted
- [ ] Marketplace de módulos
- [ ] Community forum

### Features de Negócio 💰
- [ ] Sistema de assinatura
- [ ] Analytics de campanhas
- [ ] Integração com Discord
- [ ] Suporte ao VTT (Virtual Tabletop)

**Estimado:** 6-8 semanas

---

## 📊 Métricas de Sucesso

### Code Quality
- ✅ 0 `console.log` em produção
- ✅ 0 `as any` injustificados
- ✅ ESLint 100% passou
- ✅ 70%+ cobertura de testes

### Performance
- ⏱️ Core Web Vitals: "Good" (Lighthouse)
- 📦 Bundle size: <200KB
- 🚀 First Contentful Paint: <1.5s
- ⚡ Lighthouse Score: >90

### Funcionalidades
- ✅ 95% uptime
- ✅ <100ms latência de API
- ✅ <2s loading de página
- ✅ 100% compatibilidade mobile

---

## 🔄 Processo

### Sprint Format
- Sprints de 2 semanas
- Planejamento second-feira 10:00
- Daily standup terça-sexta 9:30
- Retrospectiva sexta 15:00

### Code Review
1. Push para branch feature
2. Criar PR com descrição
3. Mínimo 1 aprovação
4. ESLint + testes passando
5. Merge e close de issue

### Release
- Releases mensais (1º de cada mês)
- Changelog automático
- Semantic versioning

---

## 🚨 Blocked/At Risk

| Item | Status | Mitigação |
|------|--------|-----------|
| Quebra de componentes gigantes | 🟨 | Começar em paralelo Q1 |
| Testes em produção | 🟨 | Setup Firebase emulator |
| Performance em mobile | 🟨 | Perfil + otimizar images |

---

## 📋 Links Relacionados

- [Refactoring Guide](./REFACTORING_GUIDE.md)
- [Blueprint](./blueprint.md)
- [GitHub Issues](https://github.com/rdgdan/mestre-rpg-web)

---

## 👥 Responsáveis

- **Tech Lead:** @danilo-araujo
- **QA:** TBD
- **DevOps:** TBD
- **Community:** TBD

---

Última atualização: 16 de janeiro de 2026
