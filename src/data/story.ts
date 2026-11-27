import { DialogueLine, LevelId } from '../types/game';

export const PROLOGUE_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'jujuba',
    speakerName: 'Princesa Jujuba',
    text: 'Socorro, Jubalândia! Na véspera de Natal, Lula invadiu o Castelo Doce, quebrou a Estrela Encantada em fragmentos e me levou para a Fortaleza do Último Natal!',
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
    text: 'Au-au! Lucky, eu e o Professor Pinhão vamos te ajudar em cada região! Recupera todos os fragmentos da Estrela e salva a Princesa Jujuba!',
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
      text: 'E aí, Lucky Boy! Bem-vindo às Colinas de Jubalândia! Use o direcional e A para pular, B para latir e X para rolar!',
      mood: 'happy',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'No fim da colina tem o Cogumelo Gigante Espirrão! Se vencer, te dou o Manto Tricolor de presente!',
      mood: 'excited',
    },
  ],
  2: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Lucky! Que bom te ver na Floresta dos Trambolhos! Trouxe dois truques novos pra você dominar!',
      mood: 'happy',
    },
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Aperte A duas vezes no ar para fazer o PULO DUPLO, e aperte BAIXO + B no ar para dar sua famosa BARRIGADA AÉREA!',
      mood: 'excited',
    },
  ],
  3: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Hoo-hoo! Construí um Kart em formato de Osso com turbo! Acelere com A, faça drift com X e use os itens (Turbo, Pimenta ou Bolha) com Y!',
      mood: 'excited',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Tô na arquibancada tricolor agitando a bandeira! A Lully também entrou na corrida — termina no Top 3 nas 3 voltas!',
      mood: 'happy',
    },
  ],
  4: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'A Fábrica de Guloseimas tá uma bagunça só! Ativei o seu FARO SECRETO para apontar onde estão as Patinhas Douradas!',
      mood: 'excited',
    },
    {
      speaker: 'jujuba',
      speakerName: 'Mensagem da Princesa Jujuba',
      text: 'Lucky, meu herói peludinho! Cuidado com o Robô Confeiteiro lá no fundo — desvie dos cupcakes dele!',
      mood: 'happy',
    },
  ],
  5: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Ajustei seu capacete de mergulho sob medida! Na água, nade com o direcional, A acelera e B dispara bolhas sonoras!',
      mood: 'happy',
    },
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Vou jogar bolhas de ar aqui de cima! Cuidado com o Polvo Gigante lá na caverna do tesouro!',
      mood: 'excited',
    },
  ],
  6: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Decolando nos Céus de Algodão-Doce! Atravesse anéis dourados em sequência para fazer combo, desvie com X e atire com B e Y!',
      mood: 'excited',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula (pelo rádio)',
      text: 'Um cachorro pilotando biplano?! Ativem as nuvens elétricas e mandem o meu Dirigível Robótico com turbinas duplas!',
      mood: 'grumpy',
    },
  ],
  7: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Brrr... que arrepio nessa Mansão dos Sustinhos! Quando você LATE (botão B), as plataformas fantasma aparecem brilhando!',
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
      text: 'Que frio na Montanha dos Narizes Gelados! Separei Petiscos Apimentados no caminho para derreter o Boneco de Neve Gigante!',
      mood: 'excited',
    },
  ],
  9: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'A Vila do Natal Esquecido perdeu todas as luzes! Encoste ou lata perto das 5 Árvores de Natal apagadas para devolver a magia!',
      mood: 'happy',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'A vila tá voltando a brilhar! Depois daqui a gente pega o Expresso do Polo Norte rumo à montanha do Lula!',
      mood: 'excited',
    },
  ],
  10: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'SUBA NO TREM, LUCKY! O Expresso do Polo Norte disparou montanha acima! Pule de vagão em vagão e cuidado com o vento!',
      mood: 'excited',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula (no megafone)',
      text: 'Haha! Ninguém chega ao meu castelo de trem! Locomotiva-Dragão, solte vapor máximo!',
      mood: 'grumpy',
    },
  ],
  11: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Uau, chegamos na Torre do Pinball dos Presentes! Use os cogumelos-bumper gigantes para voar bem alto até o portão final!',
      mood: 'excited',
    },
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Lá no topo espera o Quebra-Nozes Mecânico Real — vença-o para completar a Estrela Encantada e entrar na Fortaleza!',
      mood: 'happy',
    },
  ],
  12: [
    {
      speaker: 'jujuba',
      speakerName: 'Princesa Jujuba',
      text: 'Lucky Boy!! Você atravessou todo o reino, restaurou a Estrela Encantada e chegou antes da meia-noite! Estou na torre!',
      mood: 'excited',
    },
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Eu e a Lully estamos na sacada jogando poderes pra você! Dica de ouro: LATE (B) perto dos ataques DOURADOS para rebatê-los de volta no Lula!',
      mood: 'excited',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula',
      text: 'Chega de fofura! Você jamais passará pela Árvore da Destruição, pelo Relógio da Meia-Noite e pelo meu poder Supremo!',
      mood: 'grumpy',
    },
  ],
};

export const LEVEL_OUTROS: Record<LevelId, DialogueLine[]> = {
  1: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'GOLAÇO, Lucky Boy! Primeiro Fragmento garantido! Toma o Manto Tricolor de presente nos seus Trajes!',
      mood: 'excited',
    },
  ],
  2: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Uhuu! 2º Fragmento na pata! Agora o Pulo Duplo e a Barrigada Aérea são seus para sempre!',
      mood: 'happy',
    },
  ],
  3: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Que corrida espetacular! Pódio garantido no Grande Prêmio dos Doces!',
      mood: 'excited',
    },
  ],
  4: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'Robô Confeiteiro desligado! Próxima parada: o Oceano das Bolhas!',
      mood: 'happy',
    },
  ],
  5: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Você venceu o Polvo Gigante! Que mergulhador corajoso!',
      mood: 'excited',
    },
  ],
  6: [
    {
      speaker: 'pinhao',
      speakerName: 'Professor Pinhão',
      text: 'O Dirigível do Lula virou confete! O Traje de Piloto é todo seu!',
      mood: 'excited',
    },
  ],
  7: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'Ufa, vencemos a Mansão dos Sustinhos! Até os fantasmas riram do seu latido!',
      mood: 'happy',
    },
  ],
  8: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'Derreteu o Boneco de Neve Gigante na raça! Vamos pra Vila do Natal Esquecido!',
      mood: 'excited',
    },
  ],
  9: [
    {
      speaker: 'lully',
      speakerName: 'Lully',
      text: 'A Vila está toda iluminada de novo! Agora embarque no Expresso do Polo Norte!',
      mood: 'excited',
    },
  ],
  10: [
    {
      speaker: 'paulo',
      speakerName: 'Paulo (SPFC)',
      text: 'QUE VIAGEM INSANA! Locomotiva-Dragão domada! Falta só atravessar o Pinball dos Presentes até a Fortaleza!',
      mood: 'excited',
    },
  ],
  11: [
    {
      speaker: 'jujuba',
      speakerName: 'Princesa Jujuba',
      text: 'A Estrela Encantada está 100% completa! A ponte dourada para a Fortaleza do Último Natal se abriu! Venha, Lucky Boy!',
      mood: 'excited',
    },
  ],
  12: [
    {
      speaker: 'lula',
      speakerName: 'Lula',
      text: 'Snif... você... você realmente me deu o seu último petisco? Em toda a minha vida, ninguém nunca tinha me dado um presente de Natal...',
      mood: 'touched',
    },
    {
      speaker: 'lula',
      speakerName: 'Lula',
      text: 'Eu estava errado o tempo todo. O Natal é sobre carinho e amizade. Princesa Jujuba está livre — Feliz Natal a todos!',
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
