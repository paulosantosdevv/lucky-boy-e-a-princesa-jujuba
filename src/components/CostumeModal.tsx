import React from 'react';
import { COSTUME_INFO, CostumeId, SaveData } from '../types/game';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';
import { Check, Lock, X } from 'lucide-react';

interface Props {
  save: SaveData;
  onEquip: (costume: CostumeId) => void;
  onClose: () => void;
}

const COSTUME_LIST: CostumeId[] = ['classic', 'spfc', 'santa', 'diver', 'pilot', 'starlight'];

export const CostumeModal: React.FC<Props> = ({ save, onEquip, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(10, 6, 26, 0.82)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="seuss-card scrollable-panel"
        style={{ width: 'min(640px, 96vw)', maxHeight: '88vh', padding: '20px 22px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="seuss-title" style={{ margin: 0, color: '#ffd166' }}>
            👕 Guarda-Roupa do Lucky Boy
          </h2>
          <button type="button" className="seuss-btn seuss-btn-ghost" style={{ padding: '6px 10px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: 12,
          }}
        >
          {COSTUME_LIST.map((cid) => {
            const info = COSTUME_INFO[cid];
            const unlocked = save.unlockedCostumes.includes(cid) || save.settings.unlockAllMode;
            const equipped = save.equippedCostume === cid;

            return (
              <button
                key={cid}
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  audioSystem.playSfx('powerup');
                  onEquip(cid);
                }}
                style={{
                  background: equipped
                    ? 'linear-gradient(155deg, rgba(255,209,102,0.28), rgba(230,57,70,0.28))'
                    : 'rgba(255,255,255,0.07)',
                  border: equipped ? '3px solid #ffd166' : '2px solid rgba(255,255,255,0.18)',
                  borderRadius: 18,
                  padding: 12,
                  color: '#fff8eb',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.55,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 6,
                }}
              >
                <CharacterPortrait character="lucky" size={74} costume={cid} />
                <div className="seuss-title" style={{ fontSize: '0.96rem', color: '#ffd166' }}>
                  {info.badge} {info.name}
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.85, lineHeight: 1.3 }}>
                  {unlocked ? info.desc : info.unlockHint}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 900 }}>
                  {equipped ? (
                    <span style={{ color: '#7bf1a8' }}>
                      <Check size={14} style={{ verticalAlign: 'middle' }} /> Equipado
                    </span>
                  ) : unlocked ? (
                    <span style={{ color: '#ffd166' }}>Clique para vestir</span>
                  ) : (
                    <span>
                      <Lock size={13} style={{ verticalAlign: 'middle' }} /> Bloqueado
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
