import { DialogueLine, LevelId } from '../types/game';

export const PROLOGUE_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'jujuba',
    speakerName: 'Princesa Jujuba',
    text: 'Socorro, Jubalândia! Na véspera de Natal, Lula invadiu o Castelo Doce, quebrou a Estrela Encantada em 9 fragmentos e me levou para a Fortaleza do Último Natal!',
    mood: 'worried',
  },
  {
    speaker: 'lula',
    speakerName: 'Lula',
    text: 'Bwahahaha! Sem estrela, sem luzinhas e sem rabanada! Hoje o Natal vira oficialmente o Dia Mundial do Mau Humor! Ninguém vai escalar minha montanha a tempo da meia-noite!',
    mood: 'grumpy',
  },
  {
    speaker: 'paulo',
    speakerName: 'Paulo (SPFC)',
    text: 'Calma aí, parceiro! Olha quem chegou pra virar esse jogo no segundo tempo: Lucky Boy! Bota esse cachecol vermelho e mostra a raça tricolor, amigão!',
    mood: 'excited',
  },
  {
    speaker: 'lully',
    speakerName: 'Lully',
    text: 'Au-au! Lucky, eu e o Professor Pinhão vamos te ajudar em cada região! Recupera os 9 fragmentos da Estrela e salva a Princesa Jujuba!',
    mood: 'happy',
  },
  {
    speaker: 'lucky',
    speakerName: 'Lucky Boy',
    text: 'Au! Pode deixar comigo! Por petiscos, pelo Natal e pela Princesa Jujuba — minhas quatro patinhas e minha barriguinha estão prontas!',
    mood: 'excited',
  },
];

export const LEVEL_INTROS: Record<LevelId, DialogueLine[]> = {
  1: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'E aí, Lucky Boy! Bem-vindo às Colinas de Jubalândia! Use o direcional e o botão A para pular, B para latir e X para dar um rolamento veloz!',
      mood: 'happy',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Fica esperto no fim da colina: tem um Cogumelo Gigante que espirra sem parar! Se você vencer, te dou um manto tricolor de presente!',
      mood: 'excited',
    },
  ],
  2: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Lucky! Que bom te ver na Floresta dos Trambolhos! Aqui as árvores dançam e tem plantas carnívoras malucas. Trouxe um truque novo pra você!',
      mood: 'happy',
    },
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Aperte A duas vezes no ar para fazer o PULO DUPLO, e aperte BAIXO + B (ou Y no ar) para dar sua famosa BARRIGADA AÉREA!',
      mood: 'excited',
    },
  ],
  3: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Hoo-hoo! Construí um Kart em formato de Osso especialmente para você, Lucky! Acelere com A, faça drift com X e use itens com Y!',
      mood: 'excited',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Tô na arquibancada agitando a bandeira! A Lully também entrou na corrida — termina entre os 3 primeiros nas 3 voltas pra ganhar o 3º Fragmento!',
      mood: 'happy',
    },
  ],
  4: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Essa Fábrica de Guloseimas tá uma bagunça só! Esteiras rápidas, prensas e rios de chocolate. Ativei o seu FARO SECRETO para brilhar perto das Patinhas Douradas!',
      mood: 'excited',
    },
    {
      speaker: 'jujuba',
      speakerName: 'Mensagem da Princesa Jujuba',
      text: 'Lucky, meu herói peludinho! Cuidado com o Robô Confeiteiro lá no fundo — desvie dos cupcakes dele e use seus poderes!',
      mood: 'happy',
    },
  ],
  5: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Ajustei seu capacete de mergulho sob medida para um Shih-tzu! Na água, use o direcional para nadar, A para impulso rápido e B para soltar ondas sonoras!',
      mood: 'happy',
    },
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Vou jogar bolhas de ar do barquinho aqui de cima! Cuidado com o Polvo Gigante lá na caverna do tesouro!',
      mood: 'excited',
    },
  ],
  6: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Prepare-se para decolar nos Céus de Algodão-Doce! Pilote o biplano natalino com o direcional, atire com B, dê impulso com A e manobra evasiva com X!',
      mood: 'excited',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula (pelo rádio)',
      text: 'O quê?! Um cachorro pilotando avião?! Ativem as nuvens elétricas e mandem o meu Dirigível Robótico agora mesmo!',
      mood: 'grumpy',
    },
  ],
  7: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Brrr... que arrepio nessa Mansão dos Sustinhos! Mas descobri um segredo incrível: quando você LATE (botão B), as plataformas fantasma aparecem brilhando!',
      mood: 'worried',
    },
    {
      speaker: 'lucky',
      speakerName: 'Lucky Boy',
      text: 'Deixa comigo, Lully! Fantasma nenhum resiste ao meu latido corajoso!',
      mood: 'excited',
    },
  ],
  8: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Que frio na Montanha dos Narizes Gelados! O chão escorrega demais, mas separei Petiscos Apimentados no caminho para esquentar contra o Boneco de Neve Gigante!',
      mood: 'excited',
    },
  ],
  9: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'A Vila do Natal Esquecido perdeu todas as luzes! Lucky, encoste ou lata perto das 5 Árvores de Natal apagadas para devolver a magia aos moradores!',
      mood: 'happy',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Quando você pegar esse 9º Fragmento, a Estrela Encantada vai se completar e abrir o portão da Fortaleza do Lula! Vai que é tua, Lucky!',
      mood: 'excited',
    },
  ],
  10: [
    {
      speaker: 'jujuba',
      speakerName: 'Princesa Jujuba',
      text: 'Lucky Boy!! Você conseguiu restaurar a Estrela Encantada e chegou antes da meia-noite! Estou presa na torre da Fortaleza!',
      mood: 'excited',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula',
      text: 'Chega de fofura! Você pode ter chegado até aqui, bolinha de pelo, mas jamais passará pela minha Árvore da Destruição, pelo Relógio da Meia-Noite e pelo meu poder Supremo!',
      mood: 'grumpy',
    },
    {
      speaker: 'lucky',
      speakerName: 'Lucky Boy',
      text: 'Au-au! Eu vim salvar a Princesa Jujuba e o Natal de todo mundo — até o seu, Lula!',
      mood: 'excited',
    },
  ],
};

export const LEVEL_OUTROS: Record<LevelId, DialogueLine[]> = {
  1: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'GOLAÇO, Lucky Boy! Primeiro Fragmento garantido! Toma aqui o Manto Tricolor de presente — já está disponível nos seus Trajes!',
      mood: 'excited',
    },
  ],
  2: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Uhuu! Você pegou o 2º Fragmento! Agora o Pulo Duplo e a Barrigada Aérea são seus para sempre!',
      mood: 'happy',
    },
  ],
  3: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Que corrida espetacular! Pódio garantido no Grande Prêmio dos Doces e 3º Fragmento na pata!',
      mood: 'excited',
    },
  ],
  4: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Robô Confeiteiro desligado com sucesso! Com o 4º Fragmento, já podemos mergulhar no Oceano das Bolhas!',
      mood: 'happy',
    },
  ],
  5: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Você venceu o Polvo Gigante! Que mergulhador corajoso! Já temos 5 Fragmentos da Estrela!',
      mood: 'excited',
    },
  ],
  6: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'O Dirigível do Lula virou confete! 6º Fragmento recuperado — o Traje de Piloto é todo seu!',
      mood: 'excited',
    },
  ],
  7: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Ufa, saímos da Mansão dos Sustinhos com o 7º Fragmento! Até os fantasmas acabaram rindo do seu latido!',
      mood: 'happy',
    },
  ],
  8: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Derreteu o Boneco de Neve Gigante na raça! Falta só UM fragmento na Vila do Natal Esquecido!',
      mood: 'excited',
    },
  ],
  9: [
    {
      speaker: 'jujuba',
      speakerName: 'Princesa Jujuba',
      text: 'A Estrela Encantada está completa novamente! As cores estão voltando! Venha para a Fortaleza do Último Natal, Lucky Boy!',
      mood: 'excited',
    },
  ],
  10: [
    {
      speaker: 'lula',
      speakerName: 'Lula',
      text: 'Snif... você... você realmente me deu o seu último petisco? Em toda a minha vida, ninguém nunca tinha me dado um presente de Natal...',
      mood: 'touched',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula',
      text: 'Eu... eu estava errado o tempo todo. O Natal não é sobre barulho chato — é sobre carinho. Vou abrir a jaula da Princesa Jujuba agora mesmo!',
      mood: 'happy',
    },
  ],
};

export const ENDING_SCENE_LINES: DialogueLine[] = [
  {
    speaker: 'jujuba',
    speakerName: 'Princesa Jujuba',
    text: 'Lucky Boy!! Meu pequeno herói gordinho! Você atravessou todo o reino e trouxe o Natal de volta para Jubalândia!',
    mood: 'excited',
  },
  {
    speaker: 'lully',
    speakerName: 'Lully',
    text: 'Au-au!! Olha lá no céu: a Estrela Encantada está brilhando mais forte do que nunca!',
    mood: 'happy',
  },
  {
    speaker: 'paulo',
    speakerName: 'Paulo (SPFC)',
    text: 'É CAMPEÃO DO NATAL!! Que aventura histórica, Lucky! Tem petisco e panetone para todo mundo — até pro Lula!',
    mood: 'excited',
  },
  {
    speaker: 'lula',
    speakerName: 'Lula',
    text: 'Eheh... Feliz Natal, pessoal. Esse petisco realmente é muito bom...',
    mood: 'touched',
  },
];
