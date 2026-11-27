import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CostumeId,
  DialogueLine,
  HudSnapshot,
  LevelCompletionResult,
  LevelId,
  SaveData,
} from './types/game';
import { getLevelMeta } from './data/levels';
import { LEVEL_INTROS, LEVEL_OUTROS, PROLOGUE_DIALOGUE } from './data/story';
import {
  applyLevelResult,
  getCompletionPercent,
  hasExistingProgress,
  loadSave,
  persistSave,
  resetSave,
} from './systems/saveSystem';
import { audioSystem } from './systems/audioSystem';
import { haptics } from './systems/haptics';
import { inputManager } from './systems/inputSystem';
import { CoverArt } from './components/CoverArt';
import { CharacterPortrait } from './components/CharacterArt';
import { WorldMap } from './components/WorldMap';
import { DialogueBox } from './components/DialogueBox';
import { GameHud } from './components/GameHud';
import { TouchControls } from './components/TouchControls';
import { SettingsModal } from './components/SettingsModal';
import { CostumeModal } from './components/CostumeModal';
import { EndingCinematic } from './components/EndingCinematic';
import { Platform2DEngine } from './engines/platform2d/Platform2DEngine';
import { Kart3DEngine } from './engines/three3d/Kart3DEngine';
import { Plane3DEngine } from './engines/three3d/Plane3DEngine';
import { Boss3DEngine } from './engines/three3d/Boss3DEngine';
import { BookOpen, Map as MapIcon, Play, RotateCcw, Settings, Shirt, Sparkles } from 'lucide-react';

type Screen = 'menu' | 'map' | 'playing' | 'ending';

const EMPTY_HUD: HudSnapshot = {
  hearts: 3,
  maxHearts: 3,
  treats: 0,
  lives: 5,
  goldenPaws: [false, false, false],
  activePower: null,
  powerTimer: 0,
  hasShield: false,
};

export function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>('menu');
  const [activeLevelId, setActiveLevelId] = useState<LevelId>(save.selectedLevel);
  const [runKey, setRunKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [dialogue, setDialogue] = useState<{ lines: DialogueLine[]; after: () => void } | null>(null);
  const [resultModal, setResultModal] = useState<{
    result: LevelCompletionResult;
    extraLives: number;
    newlyUnlocked: string[];
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCostumes, setShowCostumes] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [specialYLabel, setSpecialYLabel] = useState<string | undefined>(undefined);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const activeLevelMeta = useMemo(() => getLevelMeta(activeLevelId), [activeLevelId]);

  useEffect(() => {
    inputManager.bind();
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    audioSystem.setVolumes(save.settings.musicVolume, save.settings.sfxVolume);
    haptics.setEnabled(save.settings.vibrationEnabled ?? true);

    const unlockAudio = () => audioSystem.unlock();
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      inputManager.unbind();
    };
  }, []);

  useEffect(() => {
    if (screen === 'menu' || screen === 'map') {
      audioSystem.playMusic('menu');
    } else if (screen === 'ending') {
      audioSystem.playMusic('victory');
    } else if (screen === 'playing') {
      audioSystem.playMusic(activeLevelMeta.musicTrack);
    }
  }, [screen, activeLevelMeta]);

  const updateSave = useCallback((next: SaveData) => {
    setSave(next);
    persistSave(next);
  }, []);

  const startLevel = useCallback(
    (levelId: LevelId, skipIntro = false) => {
      inputManager.clearAll();
      setActiveLevelId(levelId);
      setHud({ ...EMPTY_HUD, lives: save.lives });
      setResultModal(null);
      setSpecialYLabel(undefined);
      setRunKey((k) => k + 1);
      setScreen('playing');

      const intro = LEVEL_INTROS[levelId];
      if (!skipIntro && intro && intro.length > 0) {
        setPaused(true);
        setDialogue({
          lines: intro,
          after: () => {
            inputManager.clearAll();
            setDialogue(null);
            setPaused(false);
          },
        });
      } else {
        setPaused(false);
      }
    },
    [save.lives]
  );

  const handleContinue = () => {
    audioSystem.unlock();
    audioSystem.playSfx('star');
    setScreen('map');
  };

  const handleNewGame = () => {
    audioSystem.unlock();
    audioSystem.playSfx('click');
    if (hasExistingProgress(save)) {
      if (!window.confirm('Iniciar um Novo Jogo vai substituir o progresso atual salvo. Deseja continuar?')) {
        return;
      }
    }
    const fresh = resetSave();
    setSave(fresh);
    setScreen('map');
    setDialogue({
      lines: PROLOGUE_DIALOGUE,
      after: () => {
        setDialogue(null);
        startLevel(1);
      },
    });
  };

  const handleLevelFinish = useCallback(
    (result: LevelCompletionResult) => {
      setPaused(true);
      const { next, extraLivesGained, newlyUnlocked } = applyLevelResult(save, result);
      setSave(next);

      if (result.won) {
        const outro = LEVEL_OUTROS[result.levelId];
        const showAfterOutro = () => {
          setDialogue(null);
          if (result.levelId === 10) {
            setScreen('ending');
          } else {
            setResultModal({ result, extraLives: extraLivesGained, newlyUnlocked });
          }
        };
        if (outro && outro.length > 0) {
          setDialogue({ lines: outro, after: showAfterOutro });
        } else {
          showAfterOutro();
        }
      } else {
        setResultModal({ result, extraLives: 0, newlyUnlocked: [] });
      }
    },
    [save]
  );

  const handlePauseRequest = useCallback(() => {
    if (dialogue || resultModal) return;
    setPaused((p) => !p);
  }, [dialogue, resultModal]);

  const showTouchControls =
    save.settings.showTouchControls === 'always' ||
    (save.settings.showTouchControls === 'auto' && isTouchDevice);

  const progressPct = getCompletionPercent(save);
  const hasProgress = hasExistingProgress(save);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* MAIN MENU SCREEN - Bright Dr. Seuss / Big Golden Book */}
      {screen === 'menu' && (
        <div
          className="scrollable-panel"
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #6fd3f7 0%, #c6f1ff 64%, #78c44d 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 14px 28px',
            gap: 14,
          }}
        >
          <CoverArt costume={save.equippedCostume} />

          <div
            className="seuss-card"
            style={{
              width: 'min(780px, 100%)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {hasProgress ? (
              <button
                type="button"
                className="seuss-btn seuss-btn-primary animate-glow"
                style={{ width: 'min(390px, 100%)', padding: '14px 22px', fontSize: '1.15rem', flexDirection: 'column', gap: 2 }}
                onClick={handleContinue}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Play size={20} /> CONTINUAR AVENTURA
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.94 }}>
                  Fase {save.selectedLevel.toString().padStart(2, '0')} · {progressPct}% concluído
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="seuss-btn seuss-btn-primary animate-glow"
                style={{ width: 'min(390px, 100%)', padding: '14px 22px', fontSize: '1.18rem' }}
                onClick={handleNewGame}
              >
                <Sparkles size={21} /> COMEÇAR AVENTURA DE NATAL
              </button>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%' }}>
              <button
                type="button"
                className="seuss-btn seuss-btn-gold"
                onClick={() => {
                  audioSystem.unlock();
                  audioSystem.playSfx('click');
                  setScreen('map');
                }}
              >
                <MapIcon size={17} /> Selecionar Fase
              </button>

              {hasProgress && (
                <button type="button" className="seuss-btn seuss-btn-ghost" onClick={handleNewGame}>
                  <RotateCcw size={17} /> Novo Jogo
                </button>
              )}

              <button
                type="button"
                className="seuss-btn seuss-btn-mint"
                onClick={() => {
                  audioSystem.unlock();
                  audioSystem.playSfx('click');
                  setShowCostumes(true);
                }}
              >
                <Shirt size={17} /> Trajes ({save.unlockedCostumes.length}/6)
              </button>

              <button
                type="button"
                className="seuss-btn seuss-btn-ghost"
                onClick={() => {
                  audioSystem.unlock();
                  audioSystem.playSfx('click');
                  setShowSettings(true);
                }}
              >
                <Settings size={17} /> Configurações
              </button>

              <button
                type="button"
                className="seuss-btn seuss-btn-ghost"
                onClick={() => {
                  audioSystem.unlock();
                  audioSystem.playSfx('click');
                  setShowCredits(true);
                }}
              >
                <BookOpen size={17} /> Elenco & Controles
              </button>
            </div>

            <div style={{ fontSize: 12.5, color: '#2f7a24', fontWeight: 900, marginTop: 2 }}>
              💾 Progresso salvo automaticamente no navegador · PC, Celular e Gamepad
            </div>
          </div>
        </div>
      )}

      {/* WORLD MAP */}
      {screen === 'map' && (
        <WorldMap
          save={save}
          onSelectLevel={(id) => updateSave({ ...save, selectedLevel: id })}
          onPlayLevel={(id) => startLevel(id)}
          onBackMenu={() => setScreen('menu')}
          onOpenCostumes={() => setShowCostumes(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* GAMEPLAY SCREEN */}
      {screen === 'playing' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {activeLevelMeta.mode === 'kart' ? (
            <Kart3DEngine
              key={runKey}
              costume={save.equippedCostume}
              lives={save.lives}
              paused={paused}
              onHudUpdate={setHud}
              onFinish={handleLevelFinish}
              onPauseRequest={handlePauseRequest}
            />
          ) : activeLevelMeta.mode === 'plane' ? (
            <Plane3DEngine
              key={runKey}
              costume={save.equippedCostume}
              lives={save.lives}
              paused={paused}
              onHudUpdate={setHud}
              onFinish={handleLevelFinish}
              onPauseRequest={handlePauseRequest}
            />
          ) : activeLevelMeta.mode === 'boss3d' ? (
            <Boss3DEngine
              key={runKey}
              costume={save.equippedCostume}
              lives={save.lives}
              paused={paused}
              onHudUpdate={setHud}
              onFinish={handleLevelFinish}
              onPauseRequest={handlePauseRequest}
              onSpecialYLabelChange={setSpecialYLabel}
            />
          ) : (
            <Platform2DEngine
              key={runKey}
              levelId={activeLevelId}
              costume={save.equippedCostume}
              unlockedSkills={save.unlockedSkills}
              lives={save.lives}
              paused={paused}
              onHudUpdate={setHud}
              onFinish={handleLevelFinish}
              onPauseRequest={handlePauseRequest}
            />
          )}

          <GameHud hud={hud} level={activeLevelMeta} />

          <TouchControls
            mode={activeLevelMeta.controlMode}
            visible={showTouchControls && !dialogue && !resultModal && !paused}
            onPauseClick={() => setPaused(true)}
            specialYLabel={specialYLabel}
          />

          {/* Pause Overlay */}
          {paused && !dialogue && !resultModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 45,
                background: 'rgba(20, 42, 62, 0.62)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div className="seuss-card" style={{ width: 'min(380px, 92vw)', padding: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h2 className="seuss-title" style={{ margin: '0 0 6px', color: '#c91d1d' }}>
                  ⏸ Jogo Pausado
                </h2>
                <button type="button" className="seuss-btn seuss-btn-primary" onClick={() => setPaused(false)}>
                  ▶ Continuar Fase
                </button>
                <button type="button" className="seuss-btn seuss-btn-gold" onClick={() => startLevel(activeLevelId, true)}>
                  🔄 Reiniciar Fase
                </button>
                <button type="button" className="seuss-btn seuss-btn-mint" onClick={() => setShowSettings(true)}>
                  ⚙️ Configurações
                </button>
                <button
                  type="button"
                  className="seuss-btn seuss-btn-ghost"
                  onClick={() => {
                    setPaused(false);
                    setScreen('map');
                  }}
                >
                  🗺️ Voltar ao Mapa
                </button>
              </div>
            </div>
          )}

          {/* Result Modal */}
          {resultModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 55,
                background: 'rgba(20, 42, 62, 0.66)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div className="seuss-card" style={{ width: 'min(480px, 95vw)', padding: '22px 24px', textAlign: 'center' }}>
                <h2 className="seuss-title" style={{ margin: '0 0 8px', fontSize: '1.6rem', color: resultModal.result.won ? '#2f7a24' : '#c91d1d' }}>
                  {resultModal.result.won ? '⭐ FASE CONCLUÍDA! ⭐' : '🐾 Quase lá, Lucky Boy!'}
                </h2>

                {resultModal.result.extraNote && (
                  <p style={{ margin: '0 0 10px', fontWeight: 800, color: '#2272a3' }}>{resultModal.result.extraNote}</p>
                )}

                {resultModal.result.won && (
                  <div style={{ fontSize: 34, marginBottom: 10 }}>
                    {'⭐'.repeat(resultModal.result.starsEarned)}
                    <span style={{ opacity: 0.25 }}>{'⭐'.repeat(3 - resultModal.result.starsEarned)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    background: '#f2e4c4',
                    border: '2.5px solid #221b18',
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 14,
                    fontWeight: 900,
                    fontSize: 13.5,
                  }}
                >
                  <div>
                    <div style={{ color: '#5b4c3f', fontSize: 11 }}>Petiscos</div>
                    <div style={{ color: '#c91d1d' }}>🦴 +{resultModal.result.treatsCollected}</div>
                  </div>
                  <div>
                    <div style={{ color: '#5b4c3f', fontSize: 11 }}>Patinhas</div>
                    <div>
                      {resultModal.result.goldenPaws.map((g, i) => (
                        <span key={i} style={{ opacity: g ? 1 : 0.25 }}>🐾</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#5b4c3f', fontSize: 11 }}>Tempo</div>
                    <div>⏱ {Math.round(resultModal.result.timeSec)}s</div>
                  </div>
                </div>

                {resultModal.extraLives > 0 && (
                  <div style={{ color: '#2f7a24', fontWeight: 900, marginBottom: 8 }}>
                    🎉 +{resultModal.extraLives} Vida Extra por juntar 100 petiscos!
                  </div>
                )}

                {resultModal.newlyUnlocked.length > 0 && (
                  <div
                    style={{
                      background: '#fff3bf',
                      border: '2.5px solid #221b18',
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 14,
                      fontSize: 13,
                      fontWeight: 900,
                      color: '#221b18',
                    }}
                  >
                    🎁 Desbloqueado:<br />
                    {resultModal.newlyUnlocked.join(' · ')}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {resultModal.result.won && activeLevelId < 10 && (
                    <button
                      type="button"
                      className="seuss-btn seuss-btn-primary"
                      onClick={() => startLevel((activeLevelId + 1) as LevelId)}
                    >
                      ▶ Próxima Fase
                    </button>
                  )}
                  <button
                    type="button"
                    className="seuss-btn seuss-btn-gold"
                    onClick={() => startLevel(activeLevelId, true)}
                  >
                    🔄 Jogar Novamente
                  </button>
                  <button
                    type="button"
                    className="seuss-btn seuss-btn-ghost"
                    onClick={() => {
                      setResultModal(null);
                      setPaused(false);
                      setScreen('map');
                    }}
                  >
                    🗺️ Mapa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENDING CINEMATIC */}
      {screen === 'ending' && (
        <EndingCinematic save={save} onContinueExploring={() => setScreen('map')} />
      )}

      {/* DIALOGUE OVERLAY */}
      {dialogue && (
        <DialogueBox
          key={dialogue.lines[0]?.text || 'dlg'}
          lines={dialogue.lines}
          costume={save.equippedCostume}
          onComplete={dialogue.after}
        />
      )}

      {/* MODALS */}
      {showSettings && (
        <SettingsModal save={save} onUpdateSave={updateSave} onClose={() => setShowSettings(false)} />
      )}

      {showCostumes && (
        <CostumeModal
          save={save}
          onEquip={(cid: CostumeId) => updateSave({ ...save, equippedCostume: cid })}
          onClose={() => setShowCostumes(false)}
        />
      )}

      {showCredits && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(20, 42, 62, 0.62)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowCredits(false)}
        >
          <div
            className="seuss-card scrollable-panel"
            style={{ width: 'min(680px, 96vw)', maxHeight: '88vh', padding: '20px 22px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="seuss-title" style={{ margin: '0 0 12px', color: '#c91d1d' }}>
              📖 Elenco de Jubalândia & Controles
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10, marginBottom: 16 }}>
              {(
                [
                  ['lucky', 'Lucky Boy', 'Shih-tzu todo branco e gordinho de cachecol vermelho. Herói do Natal!'],
                  ['jujuba', 'Princesa Jujuba', 'Guardiã loira da Estrela Encantada do Natal de Jubalândia.'],
                  ['paulo', 'Paulo (SPFC)', 'Amigo fiel com a camisa tricolor do São Paulo FC que ajuda Lucky pelo caminho!'],
                  ['lully', 'Lully', 'Amiga Shih-tzu branca com preto, esperta e parceira de aventura!'],
                  ['pinhao', 'Professor Pinhão', 'Coruja inventora que cria o Kart de Osso, Capacete e Avião 3D.'],
                  ['lula', 'Lula (Boss Final)', 'O rabugento Devorador de Natais — mas será que ele só precisa de um presente?'],
                ] as const
              ).map(([id, name, desc]) => (
                <div
                  key={id}
                  style={{
                    background: '#ffffff',
                    border: '2.5px solid #221b18',
                    borderRadius: 16,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 6,
                  }}
                >
                  <CharacterPortrait character={id} size={68} costume={id === 'lucky' ? save.equippedCostume : 'classic'} />
                  <div className="seuss-title" style={{ color: '#c91d1d', fontSize: '0.96rem' }}>{name}</div>
                  <div style={{ fontSize: 12, color: '#3b312a', fontWeight: 700, lineHeight: 1.35 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f2e4c4', border: '2.5px solid #221b18', borderRadius: 14, padding: 12, fontSize: 13, lineHeight: 1.6, marginBottom: 14, fontWeight: 700 }}>
              <strong style={{ color: '#c91d1d' }}>🎮 Controles (Teclado / Tela / Gamepad):</strong>
              <br />• <strong>Direcional:</strong> WASD ou Setas (ou D-Pad na tela)
              <br />• <strong>Botão A (Espaço):</strong> Pular / Pulo Duplo / Acelerar (Kart) / Impulso (Avião) / Nadar
              <br />• <strong>Botão B (J):</strong> Latir / Atacar / Frear (Kart) / Atirar (Avião) · <em>Baixo + B no ar = Barrigada Aérea!</em>
              <br />• <strong>Botão X (K / Shift):</strong> Rolar/Correr / Drift (Kart) / Manobra (Avião)
              <br />• <strong>Botão Y (L):</strong> Poder Especial / Superlatido / Usar Item / Oferecer Último Petisco
              <br />• <strong>ESC:</strong> Pausar
            </div>

            <button type="button" className="seuss-btn seuss-btn-gold" onClick={() => setShowCredits(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
