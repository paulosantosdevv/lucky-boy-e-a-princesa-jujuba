# 🎄 Lucky Boy e a Princesa Jujuba
### *Uma Aventura Extraordinária de Natal*

Jogo de navegador **2D, 2.5D e 3D** desenvolvido com **React + TypeScript + Vite + HTML5 Canvas + Three.js**, inspirado no universo fantástico e colorido de **Dr. Seuss** e na jogabilidade clássica nostálgica de **Super Mario**.

Jogável em **computadores, celulares (multi-touch)** e **controles físicos (Gamepad API)**, com **salvamento automático** no navegador!

> 📖 Leia o roteiro completo e detalhado de todas as fases, personagens e final em **[ROTEIRO_OFICIAL.md](./ROTEIRO_OFICIAL.md)**.

---

## 🌟 História
Na terra toda torta e mágica de **Jubalândia**, a **Princesa Jujuba** acende todos os anos a **Estrela Encantada do Natal**.  
Na véspera de Natal, o vilão rabugento **Lula** invade o Castelo Doce, aprisiona a princesa em sua fortaleza no alto da montanha espiralada e despedaça a estrela em **9 fragmentos**.

Surge então o herói improvável: **Lucky Boy**, um pequeno Shih-tzu todo branco, gordinho e de cachecol vermelho — ajudado por sua amiga Shih-tzu **Lully** (branca com preto), pelo amigo **Paulo** (sempre vestindo o manto tricolor do **SPFC**) e pelo inventor **Professor Pinhão**.

---

## 🗺️ As 10 Fases do Jogo

| Fase | Nome | Modalidade | Destaques |
|---:|---|---|---|
| **01** | As Colinas de Jubalândia | Plataforma 2D | Cogumelos saltitantes, **Paulo (SPFC)** e mini-chefe **Cogumelo Gigante Espirrão** |
| **02** | A Floresta dos Trambolhos | Plataforma 2D | **Lully** ensina o **Pulo Duplo** e a **Barrigada Aérea**; plantas carnívoras e segredos |
| **03** | O Grande Prêmio dos Doces | **Corrida Kart 3D** | Kart em formato de osso, 5 adversários (incluindo Lully!), 3 voltas, drift, itens e **Paulo** na arquibancada |
| **04** | A Fábrica de Guloseimas Malucas | Plataforma 2.5D | Esteiras, prensas, rio de chocolate, Faro Secreto do **Paulo** e mini-chefe **Robô Confeiteiro** |
| **05** | O Oceano das Bolhas Perdidas | **Exploração Aquática 2D** | Capacete de mergulho, nado 360°, águas-vivas e mini-chefe **Polvo Gigante do Tesouro** |
| **06** | Os Céus de Algodão-Doce | **Combate Aéreo 3D** | Biplano natalino 3D, anéis dourados, nuvens elétricas e chefe **Dirigível Robótico do Lula** |
| **07** | A Mansão dos Sustinhos | Plataforma & Puzzles 2D | Fantasmas, móveis vivos e plataformas mágicas que só aparecem quando Lucky **late** |
| **08** | A Montanha dos Narizes Gelados | Plataforma 2.5D | Piso de gelo escorregadio, plataformas quebráveis, **Paulo (SPFC)** e mini-chefe **Boneco de Neve Gigante** |
| **09** | A Vila do Natal Esquecido | Exploração Natalina 2D | Religue as 5 árvores apagadas com **Lully** e **Paulo** para restaurar a Estrela Encantada |
| **10** | A Fortaleza do Último Natal | **Arena & Boss Final 3D** | Batalha em **4 etapas** contra **Lula** até oferecer o último petisco e libertar a **Princesa Jujuba**! |

---

## 🎮 Controles (Tela + Teclado + Gamepad)

Os controles virtuais ficam visíveis na tela (direcional + 4 botões `A`, `B`, `X`, `Y`) e se adaptam automaticamente conforme o modo da fase:

| Botão | Teclado | Plataforma | Kart 3D | Avião 3D | Água 2D |
|---|---|---|---|---|---|
| **Direcional** | `WASD` ou Setas | Mover | Dirigir | Voar | Nadar 360° |
| **A** | `Espaço` / `Z` | Pular / Pulo Duplo | Acelerar | Impulso | Nadar rápido |
| **B** | `J` / `X` | Latir / Atacar *(Baixo+B no ar = Barrigada)* | Frear | Disparar | Onda sonora |
| **X** | `K` / `Shift` | Rolar / Correr | Drift | Manobra 360° | Esquiva |
| **Y** | `L` / `E` | Poder Especial / Superlatido | Usar item | Disparo triplo | Poder especial |
| **Pause** | `ESC` | Pausar | Pausar | Pausar | Pausar |

---

## ✨ Poderes, Trajes e Salvamento Automático
- **6 Poderes Temporários:** Osso Dourado (invencibilidade 10s), Petisco Apimentado (bolas de fogo), Biscoito Congelante, Patinhas de Mola, Bolha Protetora e Superlatido.
- **6 Trajes Desbloqueáveis:** Cachecol Clássico, **Manto Tricolor (presente do Paulo SPFC)**, Lucky Papai Noel, Escafandro Bolha, Ases dos Céus e Herói da Estrela.
- **Salvamento Automático:** Progresso salvo automaticamente no navegador (`localStorage`), com opção de **Exportar e Importar JSON** nas Configurações — além do **Modo Livre** para desbloquear e testar todas as 10 fases na hora!

---

## 🛠️ Tecnologias
- **React 18** + **TypeScript** + **Vite**
- **HTML5 Canvas 2D** (motor de plataforma 2D/2.5D/água e arte procedural Dr. Seuss)
- **Three.js** (corrida de kart 3D, combate aéreo 3D e arena final 3D)
- **Web Audio API** (trilha natalina e efeitos sonoros sintetizados)
- **Vercel** (`vercel.json` pronto para deploy contínuo)

---

## 🚀 Executar Localmente

```bash
npm install
npm run dev
```

Para build de produção:
```bash
npm run build
npm run preview
```
