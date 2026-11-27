import React, { useState } from 'react';
import { SaveData } from '../types/game';
import { exportSaveJson, importSaveJson, resetSave } from '../systems/saveSystem';
import { audioSystem } from '../systems/audioSystem';
import { Download, RotateCcw, Upload, X } from 'lucide-react';

interface Props {
  save: SaveData;
  onUpdateSave: (next: SaveData) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ save, onUpdateSave, onClose }) => {
  const [statusMsg, setStatusMsg] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const updateSetting = <K extends keyof SaveData['settings']>(
    key: K,
    val: SaveData['settings'][K]
  ) => {
    const next: SaveData = {
      ...save,
      settings: { ...save.settings, [key]: val },
    };
    audioSystem.setVolumes(next.settings.musicVolume, next.settings.sfxVolume);
    onUpdateSave(next);
  };

  const handleDownloadBackup = () => {
    const json = exportSaveJson(save);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lucky-boy-jujuba-save.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('✅ Arquivo de progresso baixado!');
  };

  const handleImport = () => {
    const parsed = importSaveJson(importText);
    if (!parsed) {
      setStatusMsg('❌ Código JSON de save inválido.');
      return;
    }
    onUpdateSave(parsed);
    setShowImport(false);
    setImportText('');
    setStatusMsg('✅ Progresso importado com sucesso!');
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja apagar o progresso atual e começar do zero?')) {
      const fresh = resetSave();
      onUpdateSave(fresh);
      setStatusMsg('🔄 Progresso reiniciado.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(20, 42, 62, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="seuss-card scrollable-panel"
        style={{ width: 'min(540px, 95vw)', maxHeight: '88vh', padding: '20px 22px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="seuss-title" style={{ margin: 0, color: '#c91d1d' }}>
            ⚙️ Configurações & Save
          </h2>
          <button
            type="button"
            className="seuss-btn seuss-btn-ghost"
            style={{ padding: '6px 10px' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
          <label style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>
            🎵 Volume da Música ({Math.round(save.settings.musicVolume * 100)}%)
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.settings.musicVolume}
              onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#d92626', marginTop: 6 }}
            />
          </label>

          <label style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>
            🔊 Efeitos Sonoros ({Math.round(save.settings.sfxVolume * 100)}%)
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.settings.sfxVolume}
              onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#53a634', marginTop: 6 }}
            />
          </label>

          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
              🎮 Controles Virtuais na Tela (Direcional + A/B/X/Y)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(
                [
                  ['always', 'Sempre Mostrar'],
                  ['auto', 'Automático (Toque)'],
                  ['hidden', 'Ocultar'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`seuss-btn ${save.settings.showTouchControls === val ? 'seuss-btn-gold' : 'seuss-btn-ghost'}`}
                  style={{ padding: '7px 12px', fontSize: '0.84rem' }}
                  onClick={() => updateSetting('showTouchControls', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: '#f2e4c4',
              border: '2.5px solid #221b18',
              padding: '10px 14px',
              borderRadius: 16,
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#c91d1d' }}>
                🔓 Modo Livre (Desbloquear Todas as 12 Fases)
              </div>
              <div style={{ fontSize: 12, color: '#4a3d33', fontWeight: 700 }}>
                Permite testar o Kart 3D, Avião 3D, Água e o Chefão Lula imediatamente!
              </div>
            </div>
            <input
              type="checkbox"
              checked={save.settings.unlockAllMode}
              onChange={(e) => updateSetting('unlockAllMode', e.target.checked)}
              style={{ width: 22, height: 22, accentColor: '#d92626' }}
            />
          </label>
        </div>

        <div
          style={{
            borderTop: '2px dashed rgba(34,27,24,0.22)',
            paddingTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 14 }}>💾 Backup do Progresso (localStorage + JSON)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="seuss-btn seuss-btn-mint" style={{ fontSize: '0.85rem', padding: '8px 14px' }} onClick={handleDownloadBackup}>
              <Download size={16} /> Exportar Save
            </button>
            <button type="button" className="seuss-btn seuss-btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 14px' }} onClick={() => setShowImport(!showImport)}>
              <Upload size={16} /> Importar Save
            </button>
            <button type="button" className="seuss-btn seuss-btn-primary" style={{ fontSize: '0.85rem', padding: '8px 14px' }} onClick={handleReset}>
              <RotateCcw size={16} /> Novo Save
            </button>
          </div>

          {showImport && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <textarea
                rows={4}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Cole aqui o conteúdo do arquivo lucky-boy-jujuba-save.json..."
                style={{
                  width: '100%',
                  borderRadius: 12,
                  padding: 10,
                  background: '#ffffff',
                  color: '#221b18',
                  border: '2.5px solid #221b18',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              />
              <button type="button" className="seuss-btn seuss-btn-gold" style={{ alignSelf: 'flex-start', padding: '7px 14px', fontSize: '0.85rem' }} onClick={handleImport}>
                Confirmar Importação
              </button>
            </div>
          )}

          {statusMsg && <div style={{ fontSize: 13, fontWeight: 900, color: '#2f7a24' }}>{statusMsg}</div>}
        </div>
      </div>
    </div>
  );
};
