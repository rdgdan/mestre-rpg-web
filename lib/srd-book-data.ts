
export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title:string;
  description: string;
  chapters: Chapter[];
}

export const srdBook: Book = {
  id: 'srd-v5.1',
  title: 'System Reference Document 5.1',
  description: 'O SRD contém as regras essenciais, classes, magias e monstros do Dungeons & Dragons, disponibilizado sob a Open Gaming License (OGL).',
  chapters: [
    {
      id: 'races',
      title: 'Raças',
      content: `
        <h2 class="text-2xl font-bold mb-4">Escolhendo uma Raça</h2>
        <p class="mb-4">A raça de um personagem define uma série de qualidades inatas. A raça não apenas influencia os valores de atributo e perícias de um personagem, mas também fornece pistas para a história do personagem antes de se tornar um aventureiro. Cada raça neste capítulo inclui traços raciais que são comuns aos membros daquela raça.</p>
        <h3 class="text-xl font-bold mt-6 mb-2">Anão</h3>
        <p class="mb-4">Reinos ricos em antiga grandeza, salões esculpidos nas raízes das montanhas, o eco de picaretas e martelos em minas profundas e um compromisso com o clã e a tradição - essas são as características que unem todos os anões.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Aumento no Valor de Atributo:</strong> Seu valor de Constituição aumenta em 2.</li>
          <li><strong>Idade:</strong> Anões amadurecem na mesma proporção que os humanos, mas são considerados jovens até atingirem os 50 anos. Em média, vivem cerca de 350 anos.</li>
          <li><strong>Tendência:</strong> A maioria dos anões é leal, acreditando firmemente nos benefícios de uma sociedade bem ordenada. Eles tendem para o bem, com um forte senso de justiça.</li>
          <li><strong>Visão no Escuro:</strong> Acostumado à vida subterrânea, você tem uma visão superior em condições de escuridão e penumbra.</li>
        </ul>
        <h3 class="text-xl font-bold mt-6 mb-2">Elfo</h3>
        <p class="mb-4">Elfos são um povo mágico de graça sobrenatural, vivendo no mundo, mas não inteiramente parte dele. Eles vivem em lugares de beleza etérea, no meio de florestas antigas ou em torres prateadas que brilham com luz feérica.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Aumento no Valor de Atributo:</strong> Seu valor de Destreza aumenta em 2.</li>
          <li><strong>Idade:</strong> Embora os elfos atinjam a maturidade física na mesma idade que os humanos, a compreensão élfica da idade adulta vai além do crescimento físico para abranger a experiência mundana. Um elfo tipicamente assume a idade adulta e um nome adulto por volta dos 100 anos e pode viver até 750 anos.</li>
          <li><strong>Sentidos Aguçados:</strong> Você tem proficiência na perícia Percepção.</li>
          <li><strong>Ancestralidade Feérica:</strong> Você tem vantagem em salvaguardas contra ser enfeitiçado, e a magia não pode colocá-lo para dormir.</li>
        </ul>
        <h3 class="text-xl font-bold mt-6 mb-2">Halfling</h3>
        <p class="mb-4">O conforto de casa é o objetivo da maioria dos halflings: um lugar para se estabelecer em paz e sossego, longe de monstros saqueadores e exércitos em conflito; uma lareira quente e uma refeição generosa; bebida fina e conversa fina.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Aumento no Valor de Atributo:</strong> Seu valor de Destreza aumenta em 2.</li>
          <li><strong>Idade:</strong> Um halfling atinge a idade adulta aos 20 anos e geralmente vive até a metade de seu segundo século.</li>
          <li><strong>Sortudo:</strong> Quando você rola um 1 no d20 para um ataque, teste de atributo ou salvaguarda, você pode rolar o dado novamente e deve usar a nova rolagem.</li>
          <li><strong>Bravura:</strong> Você tem vantagem em salvaguardas contra ser amedrontado.</li>
        </ul>
        <h3 class="text-xl font-bold mt-6 mb-2">Humano</h3>
        <p class="mb-4">Na maioria dos mundos, os humanos são a mais jovem das raças comuns, chegando mais tarde ao cenário mundial e com uma vida curta em comparação com anões, elfos e dragões. Talvez seja por causa de suas vidas mais curtas que eles se esforçam para alcançar o máximo que podem nos anos que lhes são dados.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Aumento no Valor de Atributo:</strong> Todos os seus valores de atributo aumentam em 1.</li>
          <li><strong>Idade:</strong> Humanos atingem a idade adulta no final da adolescência e raramente vivem mais de um século.</li>
          <li><strong>Tendência:</strong> Humanos não tendem a nenhuma tendência em particular. O melhor e o pior podem ser encontrados entre eles.</li>
          <li><strong>Tamanho:</strong> Humanos variam muito em altura e peso, de pouco menos de 1,50 metro a bem mais de 1,80 metro. Seu tamanho é Médio.</li>
          <li><strong>Velocidade:</strong> Sua velocidade de caminhada base é de 9 metros.</li>
          <li><strong>Idiomas:</strong> Você pode falar, ler e escrever Comum e um idioma extra de sua escolha.</li>
        </ul>
      `
    },
    {
      id: 'classes',
      title: 'Classes',
      content: `
        <h2 class="text-2xl font-bold mb-4">Classes de Personagem</h2>
        <p class="mb-4">A classe é a definição primária de um personagem. É mais do que uma profissão; é a vocação do personagem. A classe molda a maneira como um personagem vê e interage com o mundo e suas habilidades e perícias.</p>
        
        <h3 class="text-xl font-bold mt-6 mb-2">Clérigo</h3>
        <p class="mb-4">Clérigos são intermediários entre o mundo mortal e os planos distantes dos deuses. Tão variados quanto os deuses que servem, os clérigos se esforçam para incorporar a obra de suas divindades. Um clérigo é imbuído de magia divina.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Dado de Vida:</strong> 1d8 por nível de clérigo</li>
          <li><strong>Atributo Primário:</strong> Sabedoria</li>
          <li><strong>Proficiências em Salvaguardas:</strong> Sabedoria & Carisma</li>
          <li><strong>Proficiências com Armaduras e Armas:</strong> Armaduras leves e médias, escudos, todas as armas simples.</li>
        </ul>

        <h3 class="text-xl font-bold mt-6 mb-2">Guerreiro</h3>
        <p class="mb-4">Guerreiros compartilham uma maestria inigualável com armas e armaduras, e um conhecimento profundo das habilidades de combate. Eles estão bem familiarizados com a morte, seja infligindo-a ou encarando-a de frente.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Dado de Vida:</strong> 1d10 por nível de guerreiro</li>
          <li><strong>Atributo Primário:</strong> Força ou Destreza</li>
          <li><strong>Proficiências em Salvaguardas:</strong> Força & Constituição</li>
          <li><strong>Proficiências com Armaduras e Armas:</strong> Todas as armaduras, escudos, armas simples e marciais.</li>
        </ul>

        <h3 class="text-xl font-bold mt-6 mb-2">Ladino</h3>
        <p class="mb-4">Ladinos contam com sua perícia, furtividade e as vulnerabilidades de seus inimigos para obter vantagem em qualquer situação. Eles têm um talento para encontrar a solução para praticamente qualquer problema, demonstrando desenvoltura e versatilidade.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Dado de Vida:</strong> 1d8 por nível de ladino</li>
          <li><strong>Atributo Primário:</strong> Destreza</li>
          <li><strong>Proficiências em Salvaguardas:</strong> Destreza & Inteligência</li>
          <li><strong>Proficiências com Armaduras e Armas:</strong> Armaduras leves, armas simples, bestas de mão, espadas longas, rapieiras, espadas curtas.</li>
        </ul>

        <h3 class="text-xl font-bold mt-6 mb-2">Mago</h3>
        <p class="mb-4">Magos são usuários de magia supremos, unidos e definidos pela teia de poder arcano que permeia o cosmos. Utilizando a magia que flui através deles, eles podem conjurar magias de poder explosivo, sussurros sutis de engano e controle mental bruto.</p>
         <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Dado de Vida:</strong> 1d6 por nível de mago</li>
          <li><strong>Atributo Primário:</strong> Inteligência</li>
          <li><strong>Proficiências em Salvaguardas:</strong> Inteligência & Sabedoria</li>
          <li><strong>Proficiências com Armaduras e Armas:</strong> Adagas, dardos, fundas, cajados, bestas leves. Nenhuma proficiência com armadura.</li>
        </ul>
      `
    },
    {
      id: 'equipment',
      title: 'Equipamento',
      content: `
        <h2 class="text-2xl font-bold mb-4">Equipamentos e Mercadorias</h2>
        <p class="mb-4">Como um aventureiro, você precisa de equipamentos para enfrentar os perigos que o aguardam. Este capítulo detalha os itens mundanos e exóticos que você pode precisar.</p>

        <h3 class="text-xl font-bold mt-6 mb-2">Armaduras e Escudos</h3>
        <p class="mb-4">A tabela de Armaduras mostra as mais comuns e as separa em categorias.</p>
        <div class="overflow-x-auto bg-surface/50 p-4 rounded-lg not-prose">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="border-b border-accent/30 font-serif">
              <tr>
                <th class="p-2">Armadura</th>
                <th class="p-2">Custo</th>
                <th class="p-2">Classe de Armadura (CA)</th>
                <th class="p-2">Força</th>
                <th class="p-2">Furtividade</th>
                <th class="p-2">Peso</th>
              </tr>
            </thead>
            <tbody class="font-sans">
              <tr class="border-b border-text/10"><td colspan="6" class="pt-3 pb-1 font-bold text-accent font-serif">Armadura Leve</td></tr>
              <tr class="hover:bg-background-end"><td>Acolchoada</td><td>5 po</td><td>11 + mod. Des</td><td>-</td><td>Desvantagem</td><td>4 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Couro</td><td>10 po</td><td>11 + mod. Des</td><td>-</td><td>-</td><td>5 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Couro Batido</td><td>45 po</td><td>12 + mod. Des</td><td>-</td><td>-</td><td>6.5 kg</td></tr>
              <tr class="border-b border-text/10"><td colspan="6" class="pt-3 pb-1 font-bold text-accent font-serif">Armadura Média</td></tr>
              <tr class="hover:bg-background-end"><td>Gibão de Peles</td><td>10 po</td><td>12 + mod. Des (max 2)</td><td>-</td><td>-</td><td>6 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Camisão de Malha</td><td>50 po</td><td>13 + mod. Des (max 2)</td><td>-</td><td>-</td><td>10 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Brunea</td><td>50 po</td><td>14 + mod. Des (max 2)</td><td>-</td><td>Desvantagem</td><td>22.5 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Peitoral de Aço</td><td>400 po</td><td>14 + mod. Des (max 2)</td><td>-</td><td>-</td><td>10 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Meia-armadura</td><td>750 po</td><td>15 + mod. Des (max 2)</td><td>-</td><td>Desvantagem</td><td>20 kg</td></tr>
              <tr class="border-b border-text/10"><td colspan="6" class="pt-3 pb-1 font-bold text-accent font-serif">Armadura Pesada</td></tr>
              <tr class="hover:bg-background-end"><td>Cota de Anéis</td><td>30 po</td><td>14</td><td>-</td><td>Desvantagem</td><td>20 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Cota de Malha</td><td>75 po</td><td>16</td><td>For 13</td><td>Desvantagem</td><td>27.5 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Cota de Talas</td><td>200 po</td><td>17</td><td>For 15</td><td>Desvantagem</td><td>30 kg</td></tr>
              <tr class="hover:bg-background-end"><td>Armadura de Placas</td><td>1,500 po</td><td>18</td><td>For 15</td><td>Desvantagem</td><td>32.5 kg</td></tr>
              <tr class="border-b border-text/10"><td colspan="6" class="pt-3 pb-1 font-bold text-accent font-serif">Escudo</td></tr>
              <tr class="hover:bg-background-end"><td>Escudo</td><td>10 po</td><td>+2</td><td>-</td><td>-</td><td>3 kg</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-xl font-bold mt-8 mb-2">Armas</h3>
        <p class="mb-4">Sua classe concede proficiência com certas armas, refletindo o foco da classe e as ferramentas que você tem mais probabilidade de usar.</p>
        <div class="overflow-x-auto bg-surface/50 p-4 rounded-lg not-prose">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="border-b border-accent/30 font-serif">
                    <tr>
                        <th class="p-2">Arma</th>
                        <th class="p-2">Custo</th>
                        <th class="p-2">Dano</th>
                        <th class="p-2">Peso</th>
                        <th class="p-2">Propriedades</th>
                    </tr>
                </thead>
                <tbody class="font-sans">
                    <tr class="border-b border-text/10"><td colspan="5" class="pt-3 pb-1 font-bold text-accent font-serif">Armas Simples Corpo a Corpo</td></tr>
                    <tr class="hover:bg-background-end"><td>Adaga</td><td>2 po</td><td>1d4 perfurante</td><td>0.5 kg</td><td>Acuidade, leve, arremesso (alcance 6/18)</td></tr>
                    <tr class="hover:bg-background-end"><td>Clava</td><td>1 pp</td><td>1d4 concussão</td><td>1 kg</td><td>Leve</td></tr>
                    <tr class="hover:bg-background-end"><td>Foice Curta</td><td>1 po</td><td>1d6 cortante</td><td>1 kg</td><td>Leve</td></tr>
                    <tr class="hover:bg-background-end"><td>Lança</td><td>1 po</td><td>1d6 perfurante</td><td>1.5 kg</td><td>Arremesso (alcance 6/18), versátil (1d8)</td></tr>
                    <tr class="border-b border-text/10"><td colspan="5" class="pt-3 pb-1 font-bold text-accent font-serif">Armas Simples à Distância</td></tr>
                    <tr class="hover:bg-background-end"><td>Arco Curto</td><td>25 po</td><td>1d6 perfurante</td><td>1 kg</td><td>Munição (alcance 24/96), duas mãos</td></tr>
                    <tr class="hover:bg-background-end"><td>Besta Leve</td><td>25 po</td><td>1d8 perfurante</td><td>2.5 kg</td><td>Munição (alcance 24/96), recarga, duas mãos</td></tr>
                    <tr class="border-b border-text/10"><td colspan="5" class="pt-3 pb-1 font-bold text-accent font-serif">Armas Marciais Corpo a Corpo</td></tr>
                    <tr class="hover:bg-background-end"><td>Espada Longa</td><td>15 po</td><td>1d8 cortante</td><td>1.5 kg</td><td>Versátil (1d10)</td></tr>
                    <tr class="hover:bg-background-end"><td>Machado de Batalha</td><td>10 po</td><td>1d8 cortante</td><td>2 kg</td><td>Versátil (1d10)</td></tr>
                    <tr class="hover:bg-background-end"><td>Martelo de Guerra</td><td>15 po</td><td>1d8 concussão</td><td>1 kg</td><td>Versátil (1d10)</td></tr>
                    <tr class="hover:bg-background-end"><td>Rapieira</td><td>25 po</td><td>1d8 perfurante</td><td>1 kg</td><td>Acuidade</td></tr>
                    <tr class="border-b border-text/10"><td colspan="5" class="pt-3 pb-1 font-bold text-accent font-serif">Armas Marciais à Distância</td></tr>
                    <tr class="hover:bg-background-end"><td>Arco Longo</td><td>50 po</td><td>1d8 perfurante</td><td>1 kg</td><td>Munição (alcance 45/180), pesada, duas mãos</td></tr>
                    <tr class="hover:bg-background-end"><td>Besta Pesada</td><td>50 po</td><td>1d10 perfurante</td><td>9 kg</td><td>Munição (alcance 30/120), pesada, recarga, duas mãos</td></tr>
                </tbody>
            </table>
        </div>

        <h3 class="text-xl font-bold mt-8 mb-2">Itens de Aventura</h3>
        <p class="mb-4">Esta seção descreve os itens que têm utilidade especial para os aventureiros. Desde mochilas e tochas até cordas e rações, ter o equipamento certo pode ser a diferença entre o sucesso e o fracasso.</p>
      `
    },
     {
      id: 'combat',
      title: 'Regras de Combate',
      content: `
        <h2 class="text-2xl font-bold mb-4">O Combate</h2>
        <p class="mb-4">Este capítulo fornece as regras que você precisa para seus personagens e monstros se engajarem em combate, seja uma breve escaramuça ou um conflito em larga escala.</p>

        <h3 class="text-xl font-bold mt-6 mb-2">A Ordem do Combate</h3>
        <p class="mb-4">Um combate típico é um confronto entre dois lados. O jogo organiza o caos do combate em um ciclo de rodadas e turnos. Uma <strong>rodada</strong> representa cerca de 6 segundos no mundo do jogo. Durante uma rodada, cada participante no combate tem um <strong>turno</strong>.</p>
        <p class="mb-4">A ordem dos turnos é determinada no início do combate, quando todos rolam a <strong>Iniciativa</strong>. A Iniciativa é um teste de Destreza. O Mestre compara os resultados de todos e a ordem dos turnos é estabelecida do maior para o menor.</p>
        
        <h3 class="text-xl font-bold mt-6 mb-2">Seu Turno</h3>
        <p class="mb-4">No seu turno, você pode <strong>mover-se</strong> uma distância igual à sua velocidade e <strong>realizar uma ação</strong>.</p>
        <p class="mb-4">Você pode usar sua ação para realizar uma das opções descritas na seção "Ações em Combate". Algumas características, magias e outras habilidades permitem que você realize uma ação adicional no seu turno chamada <strong>ação bônus</strong>. Você também pode realizar uma <strong>reação</strong>, que é uma resposta a um gatilho de algum tipo, que pode ocorrer no seu turno ou no turno de outra pessoa.</p>

        <h3 class="text-xl font-bold mt-6 mb-2">Ações em Combate</h3>
        <p class="mb-4">Quando você realiza uma ação no seu turno, você pode escolher uma das ações apresentadas aqui, uma ação que você ganhou de sua classe ou de um item especial, ou uma ação que você improvisa.</p>
        <ul class="list-disc list-inside mb-4 pl-4">
          <li><strong>Atacar:</strong> A ação mais comum. Você faz um ataque corpo a corpo ou à distância.</li>
          <li><strong>Lançar uma Magia:</strong> Muitos personagens podem lançar magias, usando a ação apropriada.</li>
          <li><strong>Correr:</strong> Você ganha movimento extra para o seu turno atual.</li>
          <li><strong>Esquivar:</strong> Você se concentra em evitar ataques. Até o início do seu próximo turno, qualquer ataque contra você tem desvantagem se você puder ver o atacante.</li>
          <li><strong>Ajudar:</strong> Você pode ajudar outra criatura, dando a ela vantagem em seu próximo teste de atributo ou ataque.</li>
          <li><strong>Esconder-se:</strong> Você faz um teste de Destreza (Furtividade) na tentativa de se esconder.</li>
        </ul>

        <h3 class="text-xl font-bold mt-6 mb-2">Realizando um Ataque</h3>
        <p class="mb-4">Seja com uma arma, uma magia ou um soco, um ataque tem uma estrutura simples. Escolha um alvo. Determine os modificadores. Role um d20 e adicione seus bônus. Se o total for igual ou superior à Classe de Armadura (CA) do alvo, você acerta.</p>

        <h3 class="text-xl font-bold mt-6 mb-2">Dano e Cura</h3>
        <p class="mb-4">Quando um ataque acerta, ele inflige dano. O tipo de dano e a quantidade são determinados pela arma ou magia. Se você rolar um 20 natural em uma jogada de ataque, é um <strong>acerto crítico</strong>, e você rola os dados de dano duas vezes e soma os resultados.</p>
        <p class="mb-4">Quando uma criatura recebe cura, seus pontos de vida atuais aumentam. Uma criatura não pode ter mais pontos de vida do que seu máximo de pontos de vida.</p>
      `
    },
    {
      id: 'bestiary',
      title: 'Bestiário',
      content: `
        <h2 class="text-2xl font-bold mb-4">Bestiário</h2>
        <p class="mb-4">Este capítulo contém uma seleção de monstros do Dungeons & Dragons. Cada monstro tem um bloco de estatísticas que fornece as informações essenciais que um Mestre precisa para administrá-lo.</p>

        <div class="bg-surface/50 p-6 rounded-lg not-prose border border-accent/30 mb-6">
          <h3 class="text-xl font-bold font-serif text-accent mb-2">Goblin</h3>
          <p class="text-sm italic text-text/70">Humanoide pequeno (goblinóide), neutro e mau</p>
          <div class="border-b border-accent/30 my-3"></div>
          <p><strong>Classe de Armadura:</strong> 15 (armadura de couro, escudo)</p>
          <p><strong>Pontos de Vida:</strong> 7 (2d6)</p>
          <p><strong>Velocidade:</strong> 9 m</p>
          <div class="border-b border-accent/30 my-3"></div>
          <div class="flex justify-around text-center font-sans">
            <div><strong>FOR</strong><br>8 (-1)</div>
            <div><strong>DES</strong><br>14 (+2)</div>
            <div><strong>CON</strong><br>10 (+0)</div>
            <div><strong>INT</strong><br>10 (+0)</div>
            <div><strong>SAB</strong><br>8 (-1)</div>
            <div><strong>CAR</strong><br>8 (-1)</div>
          </div>
          <div class="border-b border-accent/30 my-3"></div>
          <p><strong>Perícias:</strong> Furtividade +6</p>
          <p><strong>Sentidos:</strong> Visão no escuro 18 m, Percepção passiva 9</p>
          <p><strong>Idiomas:</strong> Comum, Goblin</p>
          <p><strong>Nível de Desafio:</strong> 1/4 (50 XP)</p>
          <div class="border-b border-accent/30 my-3"></div>
          <p class="mb-2"><strong>Fuga Ágil.</strong> O goblin pode usar a ação de Desengajar ou Esconder-se como uma ação bônus em cada um de seus turnos.</p>
          <h4 class="font-bold font-serif text-accent mt-4 mb-2">Ações</h4>
          <p><strong>Cimitarra.</strong> <em>Ataque Corpo a Corpo com Arma:</em> +4 para acertar, alcance 1,5 m, um alvo. <em>Dano:</em> 5 (1d6 + 2) de dano cortante.</p>
          <p><strong>Arco Curto.</strong> <em>Ataque à Distância com Arma:</em> +4 para acertar, alcance 24/96 m, um alvo. <em>Dano:</em> 5 (1d6 + 2) de dano perfurante.</p>
        </div>

        <div class="bg-surface/50 p-6 rounded-lg not-prose border border-accent/30 mb-6">
          <h3 class="text-xl font-bold font-serif text-accent mb-2">Orc</h3>
          <p class="text-sm italic text-text/70">Humanoide médio (orc), caótico e mau</p>
          <div class="border-b border-accent/30 my-3"></div>
          <p><strong>Classe de Armadura:</strong> 13 (gibão de peles)</p>
          <p><strong>Pontos de Vida:</strong> 15 (2d8 + 6)</p>
          <p><strong>Velocidade:</strong> 9 m</p>
          <div class="border-b border-accent/30 my-3"></div>
          <div class="flex justify-around text-center font-sans">
            <div><strong>FOR</strong><br>16 (+3)</div>
            <div><strong>DES</strong><br>12 (+1)</div>
            <div><strong>CON</strong><br>16 (+3)</div>
            <div><strong>INT</strong><br>7 (-2)</div>
            <div><strong>SAB</strong><br>11 (+0)</div>
            <div><strong>CAR</strong><br>10 (+0)</div>
          </div>
          <div class="border-b border-accent/30 my-3"></div>
          <p><strong>Perícias:</strong> Intimidação +2</p>
          <p><strong>Sentidos:</strong> Visão no escuro 18 m, Percepção passiva 10</p>
          <p><strong>Idiomas:</strong> Comum, Órquico</p>
          <p><strong>Nível de Desafio:</strong> 1/2 (100 XP)</p>
          <div class="border-b border-accent/30 my-3"></div>
          <p class="mb-2"><strong>Agressivo.</strong> Como uma ação bônus em seu turno, o orc pode se mover até sua velocidade em direção a uma criatura hostil que ele possa ver.</p>
          <h4 class="font-bold font-serif text-accent mt-4 mb-2">Ações</h4>
          <p><strong>Machado Grande.</strong> <em>Ataque Corpo a Corpo com Arma:</em> +5 para acertar, alcance 1,5 m, um alvo. <em>Dano:</em> 9 (1d12 + 3) de dano cortante.</p>
          <p><strong>Azagaia.</strong> <em>Ataque à Distância com Arma ou Corpo a Corpo:</em> +5 para acertar, alcance 1,5 m ou 9/27 m, um alvo. <em>Dano:</em> 6 (1d6 + 3) de dano perfurante.</p>
        </div>

        <div class="bg-surface/50 p-6 rounded-lg not-prose border border-accent/30">
          <h3 class="text-xl font-bold font-serif text-accent mb-2">Esqueleto</h3>
          <p class="text-sm italic text-text/70">Morto-vivo médio, leal e mau</p>
          <div class="border-b border-accent/30 my-3"></div>
          <p><strong>Classe de Armadura:</strong> 13 (restos de armadura)</p>
          <p><strong>Pontos de Vida:</strong> 13 (2d8 + 4)</p>
          <p><strong>Velocidade:</strong> 9 m</p>
          <div class="border-b border-accent/30 my-3"></div>
          <div class="flex justify-around text-center font-sans">
            <div><strong>FOR</strong><br>10 (+0)</div>
            <div><strong>DES</strong><br>14 (+2)</div>
            <div><strong>CON</strong><br>15 (+2)</div>
            <div><strong>INT</strong><br>6 (-2)</div>
            <div><strong>SAB</strong><br>8 (-1)</div>
            <div><strong>CAR</strong><br>5 (-3)</div>
          </div>
          <div class="border-b border-accent/30 my-3"></div>
          <p><strong>Vulnerabilidades a Dano:</strong> Concussão</p>
          <p><strong>Imunidades a Dano:</strong> Veneno</p>
          <p><strong>Imunidades a Condição:</strong> Exaustão, Envenenado</p>
          <p><strong>Sentidos:</strong> Visão no escuro 18 m, Percepção passiva 9</p>
          <p><strong>Idiomas:</strong> Entende todos os idiomas que conhecia em vida, mas não pode falar</p>
          <p><strong>Nível de Desafio:</strong> 1/4 (50 XP)</p>
          <div class="border-b border-accent/30 my-3"></div>
          <h4 class="font-bold font-serif text-accent mt-4 mb-2">Ações</h4>
          <p><strong>Espada Curta.</strong> <em>Ataque Corpo a Corpo com Arma:</em> +4 para acertar, alcance 1,5 m, um alvo. <em>Dano:</em> 5 (1d6 + 2) de dano perfurante.</p>
          <p><strong>Arco Curto.</strong> <em>Ataque à Distância com Arma:</em> +4 para acertar, alcance 24/96 m, um alvo. <em>Dano:</em> 5 (1d6 + 2) de dano perfurante.</p>
        </div>
      `
    }
  ]
};
