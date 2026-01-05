
export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
}

export const srdBook: Book = {
  id: 'srd-v5.1',
  title: 'System Reference Document 5.1',
  description: 'O SRD contém as regras essenciais, classes, magias e monstros do Dungeons & Dragons, disponibilizado sob a Open Gaming License (OGL).',
  chapters: [
    {
      id: 'classes',
      title: 'Classes de Personagem',
      content: `
        <h2 class="text-3xl font-bold mb-6 text-rpg-gold border-b-2 border-rpg-gold/30 pb-2">Classes de Personagem</h2>
        <p class="mb-8 text-lg">As classes definem a vocação do seu personagem, suas habilidades principais e sua progressão de poder.</p>
        
        <div class="space-y-16">
          <!-- BÁRBARO -->
          <section id="barbaro">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🪓 Bárbaro</h3>
            <p class="mb-4">Um guerreiro feroz de origem primitiva que pode entrar em fúria de batalha.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Fúria, Defesa Sem Armadura</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Ataque Temerário, Sentido de Perigo</td></tr>
                  <tr class="border-b border-white/5"><td>5º</td><td>+3</td><td>Ataque Extra, Movimento Rápido</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- BARDO -->
          <section id="bardo">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🪕 Bardo</h3>
            <p class="mb-4">Um mestre da música e da magia que inspira seus aliados e manipula a mente dos inimigos.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Inspiração Bárdica, Conjuração</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Pau para Toda Obra, Canção de Descanso</td></tr>
                  <tr class="border-b border-white/5"><td>3º</td><td>+2</td><td>Colégio Bárdico, Especialização</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- CLÉRIGO -->
          <section id="clerigo">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">✨ Clérigo</h3>
            <p class="mb-4">Um conjurador divino que serve a um poder superior e traz cura ou destruição.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Domínio Divino, Conjuração</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Canalizar Divindade</td></tr>
                  <tr class="border-b border-white/5"><td>5º</td><td>+3</td><td>Destruir Mortos-Vivos</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- DRUIDA -->
          <section id="druida">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🌲 Druida</h3>
            <p class="mb-4">Um guardião da natureza que pode assumir formas animais e moldar os elementos.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Druídico, Conjuração</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Forma Selvagem, Círculo Druídico</td></tr>
                  <tr class="border-b border-white/5"><td>18º</td><td>+6</td><td>Corpo Atemporal, Magia de Fera</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- GUERREIRO -->
          <section id="guerreiro">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">⚔️ Guerreiro</h3>
            <p class="mb-4">Um mestre das armas e táticas merciais de todos os tipos.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Estilo de Luta, Retomada de Fôlego</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Surto de Ação</td></tr>
                  <tr class="border-b border-white/5"><td>5º</td><td>+3</td><td>Ataque Extra (1)</td></tr>
                  <tr class="border-b border-white/5"><td>11º</td><td>+4</td><td>Ataque Extra (2)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- LADINO -->
          <section id="ladino">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🗡️ Ladino</h3>
            <p class="mb-4">Um mestre da furtividade e da perícia que ataca quando os inimigos estão vulneráveis.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Ataque Furtivo (1d6), Especialização</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Ação Astuta</td></tr>
                  <tr class="border-b border-white/5"><td>11º</td><td>+4</td><td>Talento Confiável</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- MONGE -->
          <section id="monge">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">👊 Monge</h3>
            <p class="mb-4">Um artista marcial que canaliza a energia mística do Ki para feitos sobre-humanos.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Defesa Sem Armadura, Artes Marciais</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Ki, Movimento Sem Armadura</td></tr>
                  <tr class="border-b border-white/5"><td>14º</td><td>+5</td><td>Alma Diamantina</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- PALADINO -->
          <section id="paladino">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🛡️ Paladino</h3>
            <p class="mb-4">Um campeão sagrado vinculado a um juramento solene.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Sentido Divino, Mãos Curadoras</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Estilo de Luta, Destruição Divina</td></tr>
                  <tr class="border-b border-white/5"><td>6º</td><td>+3</td><td>Aura de Proteção</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- PATRULHEIRO -->
          <section id="patrulheiro">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🏹 Patrulheiro</h3>
            <p class="mb-4">Um caçador experiente das fronteiras do mundo.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Inimigo Favorito, Explorador Natural</td></tr>
                  <tr class="border-b border-white/5"><td>3º</td><td>+2</td><td>Arquétipo, Prontidão Primal</td></tr>
                  <tr class="border-b border-white/5"><td>10º</td><td>+4</td><td>Desaparecer, Camuflagem</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- FEITICEIRO -->
          <section id="feiticeiro">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">🔥 Feiticeiro</h3>
            <p class="mb-4">Um conjurador nato, cuja magia provém de sua própria linhagem.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Origem Feiticeira, Conjuração</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Fonte de Magia (Pontos)</td></tr>
                  <tr class="border-b border-white/5"><td>3º</td><td>+2</td><td>Metamagia</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- BRUXO -->
          <section id="bruxo">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">👁️ Bruxo</h3>
            <p class="mb-4">Um buscador de conhecimento que fez um pacto com uma entidade poderosa.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Patrono, Magia de Pacto</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Invocações Místicas</td></tr>
                  <tr class="border-b border-white/5"><td>3º</td><td>+2</td><td>Dádiva do Pacto</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- MAGO -->
          <section id="mago">
            <h3 class="text-2xl font-bold text-accent mb-4 border-l-4 border-accent pl-3">📖 Mago</h3>
            <p class="mb-4">Um estudioso que manipula a realidade através de fórmulas arcanas.</p>
            <div class="bg-surface/30 p-4 rounded-xl border border-rpg-gold/10 mb-6 font-sans overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="border-b border-rpg-gold/20">
                  <tr><th class="p-2">Nível</th><th class="p-2">PB</th><th class="p-2">Características Principais</th></tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5"><td>1º</td><td>+2</td><td>Recuperação Arcana, Conjuração</td></tr>
                  <tr class="border-b border-white/5"><td>2º</td><td>+2</td><td>Tradição Arcana (Escola)</td></tr>
                  <tr class="border-b border-white/5"><td>18º</td><td>+6</td><td>Mestria em Magia</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      `
    },
    {
      id: 'races',
      title: 'Raças',
      content: `
        <h2 class="text-3xl font-bold mb-6 text-rpg-gold border-b-2 border-rpg-gold/30 pb-2">Raças do SRD</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">🛡️ Anão (Dwarf)</h3>
            <p class="text-sm mb-3">Mestres das montanhas e da metalurgia.</p>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Con +2</li>
              <li>• Visão no Escuro (18m)</li>
              <li>• Resiliência Anã (Vantagem vs Veneno)</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">🍃 Elfo (Elf)</h3>
            <p class="text-sm mb-3">Elegância e magia ancestral.</p>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Des +2</li>
              <li>• Ancestralidade Feérica (Imune a sono mágico)</li>
              <li>• Visão no Escuro (18m)</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">🦶 Halfling</h3>
            <p class="text-sm mb-3">Sorte e bravura em corpos pequenos.</p>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Des +2</li>
              <li>• Sortudo (Rola novamente 1s naturais)</li>
              <li>• Bravura (Vantagem vs Medo)</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">👤 Humano</h3>
            <p class="text-sm mb-3">Adaptabilidade e determinação.</p>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Todos os atributos +1</li>
              <li>• Deslocamento: 9m</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">🐲 Draconato (Dragonborn)</h3>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• For +2, Car +1</li>
              <li>• Ancestral Dracônico (Sopro e Resistência)</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">⚙️ Gnomo</h3>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Int +2</li>
              <li>• Esperteza Gnômica (Vantagem em Magias Mentais)</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">🌓 Meio-Elfo</h3>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Car +2, Outros +1</li>
              <li>• Versatilidade (2 Perícias extras)</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">👹 Meio-Orc</h3>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• For +2, Con +1</li>
              <li>• Resistência Implacável, Ataques Selvagens</li>
            </ul>
          </section>

          <section class="bg-surface/30 p-5 rounded-xl border border-accent/20">
            <h3 class="text-xl font-bold text-accent mb-3">🔥 Tiefling</h3>
            <ul class="text-xs space-y-1 opacity-80">
              <li>• Car +2, Int +1</li>
              <li>• Resistência Infernal, Legado de Magia</li>
            </ul>
          </section>
        </div>
      `
    },
    {
      id: 'equipment',
      title: 'Equipamento',
      content: `
        <h2 class="text-3xl font-bold mb-6 text-rpg-gold border-b-2 border-rpg-gold/30 pb-2">Equipamentos e Mercadorias</h2>
        
        <div class="space-y-12">
          <!-- ARMADURAS -->
          <section>
            <h3 class="text-xl font-bold mb-4 text-accent border-l-4 border-accent pl-2">🛡️ Armaduras</h3>
            <div class="overflow-x-auto bg-surface/30 rounded-xl border border-white/5 p-1">
              <table class="w-full text-xs font-sans">
                <thead class="bg-accent/10">
                  <tr><th class="p-2 text-left">Armadura</th><th class="p-2 text-center">CA</th><th class="p-2 text-center">Peso</th><th class="p-2 text-center">Furtividade</th></tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr><td class="p-2">Acolchoada (Leve)</td><td class="text-center">11 + Des</td><td class="text-center">4kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr><td class="p-2">Couro (Leve)</td><td class="text-center">11 + Des</td><td class="text-center">5kg</td><td class="text-center">-</td></tr>
                  <tr><td class="p-2">Couro Batido (Leve)</td><td class="text-center">12 + Des</td><td class="text-center">6kg</td><td class="text-center">-</td></tr>
                  <tr class="bg-white/5"><td class="p-2">Gibão de Peles (Média)</td><td class="text-center">12 + Des (max 2)</td><td class="text-center">6kg</td><td class="text-center">-</td></tr>
                  <tr class="bg-white/5"><td class="p-2">Camisão de Malha (Média)</td><td class="text-center">13 + Des (max 2)</td><td class="text-center">10kg</td><td class="text-center">-</td></tr>
                  <tr class="bg-white/5"><td class="p-2">Brunea (Média)</td><td class="text-center">14 + Des (max 2)</td><td class="text-center">22kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr class="bg-white/5"><td class="p-2">Peitoral (Média)</td><td class="text-center">14 + Des (max 2)</td><td class="text-center">10kg</td><td class="text-center">-</td></tr>
                  <tr class="bg-white/5"><td class="p-2">Meia-Armadura (Média)</td><td class="text-center">15 + Des (max 2)</td><td class="text-center">20kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr><td class="p-2">Cota de Anéis (Pesada)</td><td class="text-center">14</td><td class="text-center">20kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr><td class="p-2">Cota de Malha (Pesada)</td><td class="text-center">16 (For 13)</td><td class="text-center">27kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr><td class="p-2">Loriga Segmentada (Pesada)</td><td class="text-center">17 (For 15)</td><td class="text-center">30kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr><td class="p-2">Placas (Pesada)</td><td class="text-center">18 (For 15)</td><td class="text-center">32kg</td><td class="text-center text-red-400">Desvantagem</td></tr>
                  <tr class="bg-accent/5"><td class="p-2">Escudo</td><td class="text-center">+2</td><td class="text-center">3kg</td><td class="text-center">-</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ARMAS SIMPLES -->
          <section>
            <h3 class="text-xl font-bold mb-4 text-accent border-l-4 border-accent pl-2">⚔️ Armas Simples</h3>
            <div class="overflow-x-auto bg-surface/30 rounded-xl border border-white/5 p-1">
              <table class="w-full text-xs font-sans">
                <thead class="bg-accent/10">
                  <tr><th class="p-2 text-left">Arma</th><th class="p-2 text-center">Dano</th><th class="p-2 text-center">Propriedades</th></tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr><td class="p-2">Adaga</td><td class="text-center">1d4 P</td><td class="p-2 text-center opacity-70">Acuidade, Leve, Arremesso</td></tr>
                  <tr><td class="p-2">Azagaia</td><td class="text-center">1d6 P</td><td class="p-2 text-center opacity-70">Arremesso (9/36m)</td></tr>
                  <tr><td class="p-2">Bordão</td><td class="text-center">1d6 C</td><td class="p-2 text-center opacity-70">Versátil (1d8)</td></tr>
                  <tr><td class="p-2">Dardo</td><td class="text-center">1d4 P</td><td class="p-2 text-center opacity-70">Acuidade, Arremesso (6/18m)</td></tr>
                  <tr><td class="p-2">Lança</td><td class="text-center">1d6 P</td><td class="p-2 text-center opacity-70">Arremesso, Versátil (1d8)</td></tr>
                  <tr><td class="p-2">Maça</td><td class="text-center">1d6 C</td><td class="p-2 text-center opacity-70">-</td></tr>
                  <tr><td class="p-2">Machadinha</td><td class="text-center">1d6 C</td><td class="p-2 text-center opacity-70">Leve, Arremesso</td></tr>
                  <tr><td class="p-2">Besta Leve</td><td class="text-center">1d8 P</td><td class="p-2 text-center opacity-70">Munição (24/96m), Recarga</td></tr>
                  <tr><td class="p-2">Arco Curto</td><td class="text-center">1d6 P</td><td class="p-2 text-center opacity-70">Munição (24/96m), Duas Mãos</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ARMAS MARCIAIS -->
          <section>
            <h3 class="text-xl font-bold mb-4 text-accent border-l-4 border-accent pl-2">⚔️ Armas Marciais</h3>
            <div class="overflow-x-auto bg-surface/30 rounded-xl border border-white/5 p-1">
              <table class="w-full text-xs font-sans">
                <thead class="bg-accent/10">
                  <tr><th class="p-2 text-left">Arma</th><th class="p-2 text-center">Dano</th><th class="p-2 text-center">Propriedades</th></tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr><td class="p-2">Alabarda</td><td class="text-center">1d10 C</td><td class="p-2 text-center opacity-70">Pesada, Alcance, Duas Mãos</td></tr>
                  <tr><td class="p-2">Cimitarra</td><td class="text-center">1d6 C</td><td class="p-2 text-center opacity-70">Acuidade, Leve</td></tr>
                  <tr><td class="p-2">Espada Curta</td><td class="text-center">1d6 P</td><td class="p-2 text-center opacity-70">Acuidade, Leve</td></tr>
                  <tr><td class="p-2">Espada Longa</td><td class="text-center">1d8 C</td><td class="p-2 text-center opacity-70">Versátil (1d10)</td></tr>
                  <tr><td class="p-2">Glaive</td><td class="text-center">1d10 C</td><td class="p-2 text-center opacity-70">Pesada, Alcance, Duas Mãos</td></tr>
                  <tr><td class="p-2">Machado de Batalha</td><td class="text-center">1d8 C</td><td class="p-2 text-center opacity-70">Versátil (1d10)</td></tr>
                  <tr><td class="p-2">Machado Grande</td><td class="text-center">1d12 C</td><td class="p-2 text-center opacity-70">Pesada, Duas Mãos</td></tr>
                  <tr><td class="p-2">Malho</td><td class="text-center">2d6 C</td><td class="p-2 text-center opacity-70">Pesada, Duas Mãos</td></tr>
                  <tr><td class="p-2">Martelo de Guerra</td><td class="text-center">1d8 C</td><td class="p-2 text-center opacity-70">Versátil (1d10)</td></tr>
                  <tr><td class="p-2">Montante</td><td class="text-center">2d6 C</td><td class="p-2 text-center opacity-70">Pesada, Duas Mãos</td></tr>
                  <tr><td class="p-2">Rapieira</td><td class="text-center">1d8 P</td><td class="p-2 text-center opacity-70">Acuidade</td></tr>
                  <tr><td class="p-2">Tridente</td><td class="text-center">1d6 P</td><td class="p-2 text-center opacity-70">Arremesso, Versátil (1d8)</td></tr>
                  <tr><td class="p-2">Arco Longo</td><td class="text-center">1d8 P</td><td class="p-2 text-center opacity-70">Munição (45/180m), Pesada</td></tr>
                  <tr><td class="p-2">Besta Pesada</td><td class="text-center">1d10 P</td><td class="p-2 text-center opacity-70">30/120m, Pesada, Recarga</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ITENS DE AVENTURA -->
          <section>
            <h3 class="text-xl font-bold mb-4 text-accent border-l-4 border-accent pl-2">🎒 Itens de Aventura</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
              <div class="bg-surface/20 p-2 rounded border border-white/5">Mochila (2.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Rações (1 dia) (1kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Corda de Cânhamo (5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Tocha (0.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Cantil (2.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Caixa de Fogo (0.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Saco de Dormir (2.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Pé de Cabra (2.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Martelo e Pítons (1.6kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Óleo (frasco) (0.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Lampião (1kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Algemas (0.2kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Símbolo Sagrado (0.5kg)</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5">Foco Arcano (1kg)</div>
            </div>
          </section>

          <!-- FERRAMENTAS -->
          <section>
            <h3 class="text-xl font-bold mb-4 text-accent border-l-4 border-accent pl-2">🛠️ Ferramentas e Utensílios</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
              <div class="bg-surface/20 p-2 rounded border border-white/5 text-center">Ferramentas de Ladrão</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5 text-center">Kit de Disfarce</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5 text-center">Kit de Curandeiro</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5 text-center">Ferramentas de Ferreiro</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5 text-center">Utensílios de Cozinheiro</div>
              <div class="bg-surface/20 p-2 rounded border border-white/5 text-center">Kit de Venenos</div>
            </div>
          </section>
            </div>
          </section>
        </div>
      `
    },
    {
      id: 'combat',
      title: 'Combate',
      content: `
        <h2 class="text-2xl font-bold mb-4">A Dança da Batalha</h2>
        <div class="space-y-6">
          <div class="bg-rpg-gold/5 border-l-4 border-rpg-gold p-4">
            <h4 class="font-bold text-rpg-gold">Iniciativa</h4>
            <p class="text-sm">Teste de Destreza que define a ordem dos turnos.</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-surface/40 rounded border border-white/5">
              <strong class="text-accent">Ação Bônus:</strong> Apenas se um recurso permitir.
            </div>
            <div class="p-3 bg-surface/40 rounded border border-white/5">
              <strong class="text-accent">Reação:</strong> Apenas uma por rodada.
            </div>
          </div>
          <h4 class="font-bold mt-4">Ações Especiais</h4>
          <ul class="text-sm list-disc pl-5 space-y-1">
            <li><strong>Desengajar:</strong> Não provoca ataques de oportunidade.</li>
            <li><strong>Correr:</strong> Dobra o movimento.</li>
            <li><strong>Ajudar:</strong> Dá vantagem ao aliado.</li>
            <li><strong>Esquivar:</strong> Ataques contra têm desvantagem.</li>
          </ul>
        </div>
      `
    },
    {
      id: 'conditions',
      title: 'Condições',
      content: `
        <h2 class="text-2xl font-bold mb-4 text-red-400">Estados Alterados</h2>
        <div class="space-y-4">
          <div class="p-3 bg-red-900/10 border border-red-500/20 rounded">
            <strong>Incapacitado:</strong> Não pode realizar ações ou reações.
          </div>
          <div class="p-3 bg-red-900/10 border border-red-500/20 rounded">
            <strong>Paralisado:</strong> Incapacitado, não se move, falha em salvaguardas físicas. Crítico automático de ataques a 1,5m.
          </div>
          <div class="p-3 bg-red-900/10 border border-red-500/20 rounded">
            <strong>Envenenado:</strong> Desvantagem em ataques e testes de atributo.
          </div>
          <div class="p-3 bg-red-900/10 border border-red-500/20 rounded">
            <strong>Invisível:</strong> Vantagem em ataques, inimigos têm desvantagem.
          </div>
        </div>
      `
    },
    {
      id: 'magic-items',
      title: 'Itens Mágicos',
      content: `
        <h2 class="text-2xl font-bold mb-4 text-purple-400">Relíquias e Artefatos</h2>
        <p class="mb-6 text-sm">Itens mágicos são raros e concedem poderes extraordinários a quem os possui.</p>
        <div class="space-y-4">
          <div class="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
            <h4 class="font-bold text-purple-300">Poção de Cura</h4>
            <p class="text-xs opacity-70">Item comum. Recupera 2d4+2 pontos de vida.</p>
          </div>
          <div class="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
            <h4 class="font-bold text-purple-300">Arma +1, +2 ou +3</h4>
            <p class="text-xs opacity-70">Item incomum/raro. Bônus em jogadas de ataque e dano.</p>
          </div>
          <div class="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
            <h4 class="font-bold text-purple-300">Bolsa Sem Fundo (Bag of Holding)</h4>
            <p class="text-xs opacity-70">Item incomum. Armazena até 250kg em um espaço extradimensional.</p>
          </div>
        </div>
        <div class="mt-8 p-4 bg-surface/40 rounded-lg text-center text-xs italic border border-white/5">
          Dica: Use a busca da Biblioteca para ver a lista completa de itens mágicos disponíveis no banco de dados.
        </div>
      `
    },
    {
      id: 'bestiary',
      title: 'Bestiário',
      content: `
        <h2 class="text-3xl font-bold mb-6 text-red-500 border-b-2 border-red-500/30 pb-2">Guia do Bestiário SRD</h2>
        <p class="mb-6">O multiverso é repleto de criaturas perigosas. Aqui estão alguns exemplos de categorias que você encontrará.</p>

        <div class="space-y-8">
          <section>
            <h3 class="text-xl font-bold text-accent mb-3">💀 Mortos-Vivos</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Lich (ND 21):</strong> Mestre supremo da necromancia.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Vampiro (ND 13):</strong> Predador elegante e mortal.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Esqueleto (ND 1/4):</strong> Guerreiros sem alma.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Zumbi (ND 1/4):</strong> Cadáveres reanimados.</div>
            </div>
          </section>

          <section>
            <h3 class="text-xl font-bold text-accent mb-3">🐉 Dragões</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Dragão Vermelho:</strong> Gananciosos e cruéis.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Dragão de Ouro:</strong> Defensores da justiça.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Wyvern (ND 6):</strong> Primo menor e peçonhento.</div>
            </div>
          </section>

          <section>
            <h3 class="text-xl font-bold text-accent mb-3">👹 Monstruosidades</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Beholder (ND 13):</strong> O Observador onipotente.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Urso-Coruja (ND 3):</strong> Ferocidade híbrida.</div>
              <div class="bg-surface/20 p-3 rounded border border-white/5"><strong>Medusa (ND 6):</strong> Olhar petrificante.</div>
            </div>
          </section>
        </div>

        <div class="mt-12 p-6 bg-red-900/10 rounded-xl border-2 border-red-500/20 text-center">
          <h4 class="text-xl font-bold text-red-500 mb-2">🔍 Ver Estatísticas Completas</h4>
          <p class="text-sm mb-4">Acesse a aba <strong>Bestiário</strong> no menu lateral para visualizar fichas completas, ataques e habilidades de mais de 150 criaturas!</p>
        </div>
      `
    }
  ]
};
