
# Blueprint do Projeto: Gerenciador de Fichas de RPG

## Visão Geral

Este projeto é uma aplicação web completa, construída com Next.js e hospedada na Firebase, projetada para ser uma suíte de ferramentas para RPG de mesa. A plataforma permite que os jogadores criem e gerenciem suas fichas de personagem de D&D 5ª Edição e oferece ao Mestre do Jogo (DM) ferramentas para facilitar a condução das sessões.

A aplicação foi desenvolvida com foco em uma experiência de usuário moderna, responsiva e intuitiva, especialmente otimizada para uso em dispositivos móveis durante as sessões de jogo.

## Arquitetura e Tecnologias

*   **Framework**: Next.js com App Router
*   **Linguagem**: TypeScript
*   **Estilização**: Tailwind CSS
*   **Banco de Dados**: Firestore (Firebase)
*   **Autenticação**: Firebase Authentication
*   **Bibliotecas Principais**:
    *   `react`: Para a construção da interface.
    *   `jszip`: Para a descompactação de arquivos `.rpg` no lado do cliente.
    *   `react-firebase-hooks`: Para integração reativa com a autenticação do Firebase.

## Estrutura de Arquivos Principal

```
/
├── app/
│   ├── (home)/               # Rota da página inicial (/)
│   ├── login/                # Rota de login (/login)
│   ├── register/             # Rota de registro (/register)
│   ├── personagens/          # Rota do salão de personagens (/personagens)
│   └── personagem/[id]/      # Rota dinâmica para edição de ficha (/personagem/[id])
├── components/               # Componentes React reutilizáveis
├── context/                  # Contexto de autenticação (AuthContext)
├── lib/                      # Lógica de negócio e configuração
│   ├── firebase.ts           # Configuração do Firebase
│   ├── character-data.ts     # Estruturas de dados e valores padrão da ficha
│   ├── items-data.ts         # Estruturas de dados e valores padrão de itens
│   └── character-mapper.ts   # Mapeador para traduzir dados importados
└── public/                   # Arquivos estáticos
```

---

## Funcionalidades e Design Implementados

### 1. Autenticação de Usuários
*   **Fluxo Completo**: Sistema de registro, login e logout utilizando o Firebase Authentication.
*   **Proteção de Rotas**: As páginas de personagens são protegidas, exigindo que o usuário esteja logado para acessá-las.

### 2. Salão de Personagens (`/personagens`)
*   **Listagem Reativa**: Exibe a lista de personagens do usuário logado em tempo real.
*   **Design de Cartões**: Cada personagem é apresentado em um cartão estilizado com nome, raça, classe, nível e imagem.
*   **Ações**: Botões para Editar ou Excluir (com confirmação) cada personagem.
*   **Criação e Importação**: Botões para criar um novo personagem do zero ou importar de um arquivo `.rpg`.

### 3. Sistema de Importação de Fichas (.rpg)
*   **Lógica no Cliente**: Descompacta e processa o arquivo `.json` contido no `.rpg` diretamente no navegador.
*   **Mapeamento de Dados**: Utiliza o `character-mapper.ts` para traduzir dados importados para a estrutura da aplicação, garantindo compatibilidade e prevenindo erros.

### 4. Página de Edição da Ficha (`/personagem/[id]`)
*   **Interface Otimizada**: Layout moderno e responsivo, organizado em abas (`Principal`, `Equipamento`, `Habilidades`, `Magias`, `Personalidade`).
*   **Salvamos Automático**: As alterações são salvas no Firestore de forma eficiente usando `debounce`.
*   **Seleção Dinâmica**: Modais permitem ao usuário escolher a classe e raça de listas pré-definidas ou adicionar novas opções, que são salvas no banco de dados para uso futuro.

### 5. Sistema de Inventário e Equipamentos Avançado
*   **Estrutura de Dados Robusta**: O inventário foi migrado de um campo de texto simples para um objeto estruturado, separando `currency` (moedas), `weapons` (armas), e `otherEquipment` (outros itens).
*   **Aba "Equipamento" Reconstruída**: A interface agora apresenta seções distintas e interativas para Tesouro, Armas e Outros Equipamentos.
*   **Forja de Armas (Criação e Edição)**:
    *   Um modal dedicado (`WeaponModal`) permite a criação de armas personalizadas a partir do zero ou a edição de armas existentes.
    *   Suporta a definição de todas as propriedades da arma, incluindo **nome, dano, tipo de dano, propriedades, quantidade**, e mais importante, **atributos mágicos** (bônus de acerto/dano e efeitos especiais).
*   **Gerenciamento Completo do Arsenal**:
    *   **"Adicionar da Lista"**: Permite adicionar rapidamente armas padrão do D&D 5e (a lista é previamente populada na coleção `armas` do Firestore).
    *   **"Criar Arma Personalizada"**: Abre a Forja para criações únicas.
    *   **"Editar" e "Remover"**: Cada arma no inventário pode ser editada ou removida individualmente.

---

## Plano de Implementação (Próxima Fase): Ferramenta de Confronto do Mestre

### Visão Geral

O próximo grande módulo será uma página dedicada para o Mestre do Jogo (DM), projetada para gerenciar encontros de combate de forma eficiente e centralizada. Esta ferramenta buscará os personagens dos jogadores diretamente do Firestore e permitirá ao Mestre conduzir o combate com facilidade.

### Funcionalidades Planejadas

1.  **Nova Rota**: Criar a página em `/mestre/confronto`.
2.  **Seleção de Combatentes**:
    *   **Jogadores**: Permitir ao Mestre selecionar quais personagens (da coleção `personagens` do Firestore) estão participando do confronto.
    *   **Monstros/NPCs**: Implementar um método para adicionar monstros ao combate. Isso incluirá a criação de um formulário simples para definir o nome, iniciativa e pontos de vida de cada inimigo.
3.  **Controle de Iniciativa**: 
    *   Criar uma lista única de todos os combatentes (jogadores e monstros).
    *   Permitir a inserção da iniciativa rolada para cada um.
    *   Ordenar a lista automaticamente da maior para a menor iniciativa.
    *   Implementar um marcador visual para indicar de quem é o turno atual, com botões para avançar para o próximo na ordem.
4.  **Gerenciamento de Pontos de Vida (HP)**:
    *   Ao lado de cada combatente na lista de iniciativa, exibir seus pontos de vida atuais.
    *   Permitir que o Mestre edite rapidamente o HP de qualquer jogador ou monstro à medida que o dano é causado.
    *   **Importante**: As alterações no HP dos personagens dos jogadores devem ser salvas diretamente em seus respectivos documentos no Firestore, garantindo que a ficha do jogador esteja sempre atualizada.

