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
        background: 'rgba(20, 42, 62, 0.62)',
        backdropFilter: 'blur(4px)',
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
          <h2 className="seuss-title" style={{ margin: 0, color: '#c91d1d' }}>
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
                  background: equipped ? '#fff3bf' : '#ffffff',
                  border: equipped ? '3.5px solid #d92626' : '2.5px solid #221b18',
                  borderRadius: 18,
                  padding: 12,
                  color: '#221b18',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 6,
                  boxShadow: '0 4px 0 rgba(34,27,24,0.18)',
                }}
              >
                <CharacterPortrait character="lucky" size={74} costume={cid} />
                <div className="seuss-title" style={{ fontSize: '0.96rem', color: '#c91d1d' }}>
                  {info.badge} {info.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#4a3d33', fontWeight: 700, lineHeight: 1.3 }}>
                  {unlocked ? info.desc : info.unlockHint}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 900 }}>
                  {equipped ? (
                    <span style={{ color: '#2f7a24' }}>
                      <Check size={14} style={{ verticalAlign: 'middle' }} /> Equipado
                    </span>
                  ) : unlocked ? (
                    <span style={{ color: '#c91d1d' }}>Clique para vestir</span>
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
