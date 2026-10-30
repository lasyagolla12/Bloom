import React, { useState } from 'react';
import { 
  Sparkles, 
  FolderLock, 
  Lightbulb, 
  Layers,
  Compass,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlurtCanvas } from '../components/blurt/BlurtCanvas';
import { IdeaBin } from '../components/blurt/IdeaBin';
import { PrivateVault } from '../components/blurt/PrivateVault';

export const BlurtPage: React.FC = () => {
  const { profile, ideaItems, vaultEntries, thoughtSessions } = useAuth();
  const [activeTab, setActiveTab] = useState<'blurt' | 'ideabin' | 'vault'>('blurt');

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Blurt
            </h1>
            <span 
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: 'var(--bg-accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-primary)'
              }}
            >
              Thought Studio
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Unstructured brain-dumps, interactive AI thought branching, idea incubation, and confidential thoughts.
          </p>
        </div>

        {/* Tab Switcher: Blurt Canvas, Idea Bin, Private Vault */}
        <div 
          className="flex p-1 rounded-2xl border self-start sm:self-center"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setActiveTab('blurt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'blurt' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Blurt Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('ideabin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'ideabin' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Idea Bin</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'ideabin' ? 'bg-white/20' : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
            }`}>
              {ideaItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'vault' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>Private Vault</span>
            {vaultEntries.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'vault' ? 'bg-white/20' : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
              }`}>
                {vaultEntries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {activeTab === 'blurt' && <BlurtCanvas />}
      {activeTab === 'ideabin' && <IdeaBin />}
      {activeTab === 'vault' && <PrivateVault />}
    </div>
  );
};
